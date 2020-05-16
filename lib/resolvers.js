const _ = require("lodash");
const Os = require("os");
const ShellQuote = require("shell-quote");

const createLogger = require("./createLogger.js");
const Host = require("./Host.js");
const CronJob = require("./CronJob.js");
const OidcConfig = require("./OidcConfig.js");
const MountedApp = require("./MountedApp.js");
const ComposeApplication = require("./ComposeApplication.js");
const ComposePortMapping = require("./ComposePortMapping.js");

const logger = createLogger("resolvers");

const makeComposeApplicationResolver = resolver => async (
  parent,
  { id, ...args },
  context,
) => {
  const { state } = context;
  const composeApplication = state.composeApplications.find(a => a.id === id);
  if (!composeApplication)
    throw new Error(`Cannot find ComposeApplication ${id}`);
  return await resolver(parent, args, { ...context, composeApplication });
};

const makeCronJobResolver = resolver => async (
  parent,
  { id, ...args },
  context,
) => {
  const { state } = context;
  const cronJob = state.cronJobs.find(a => a.id === id);
  if (!cronJob) throw new Error(`Cannot find CronJob ${id}`);
  return await resolver(parent, args, { ...context, cronJob });
};

const resolvers = {
  Query: {
    hostname: async () => {
      const hostname = Os.hostname();
      return hostname;
    },

    hosts: async (parent, args, { state }) => {
      const { hosts } = state;
      return hosts;
    },

    host: async (parent, { id }, { state }) => {
      const host = state.hosts.find(h => h.id === id);
      if (!host) throw new Error(`Cannot find host ${id}`);
      return host;
    },

    terminals: async (parent, args, { state }) => {
      const { terminals } = state;
      return terminals.filter(t => !t.finished);
    },

    mountedApps: async (parent, args, { state }) => {
      const { mountedApps } = state;
      return mountedApps;
    },

    mountedApp: async (parent, { id }, { state }) => {
      const mountedApp = state.mountedApps.find(h => h.id === id);
      if (!mountedApp) throw new Error(`Cannot find mountedApp ${id}`);
      return mountedApp;
    },

    terminal: async (parent, { id }, { state }) => {
      const terminal = state.terminals.find(h => h.id === id);
      if (!terminal) throw new Error(`Cannot find terminal ${id}`);
      return terminal;
    },

    composeApplications: async (parent, args, { state }) => {
      const { composeApplications } = state;
      return composeApplications;
    },

    composeApplication: makeComposeApplicationResolver(
      async (parent, { id }, { composeApplication }) => {
        return composeApplication;
      },
    ),

    cronJobs: async (parent, args, { state }) => {
      const { cronJobs } = state;
      return cronJobs;
    },

    cronJob: makeCronJobResolver(async (parent, args, { cronJob }) => {
      return cronJob;
    }),
  },

  Mutation: {
    updateHost: async (
      parent,
      {
        id,
        hostname,
        ssl,
        enabled,
        upstream,
        redirect,
        changeOrigin,
        oidcConfig: oidcConfigInput,
      },
      { state },
    ) => {
      let host = state.hosts.find(h => h.id === id);
      const hostAttributes = {
        hostname,
        ssl,
        upstream,
        enabled,
        redirect,
        changeOrigin,
        oidcConfig:
          oidcConfigInput &&
          new OidcConfig({
            ...oidcConfigInput,
          }),
      };
      if (!host) {
        if (state.hosts.map(h => h.hostname).includes(hostname))
          throw new Error(`Host with ${hostname} already exists`);

        host = new Host({
          id,
          ...hostAttributes,
        });

        state.hosts.push(host);
        await state.save();
      } else {
        Object.assign(host, hostAttributes);
      }

      await state.save();

      return host;
    },

    deleteHost: async (parent, { id }, { state }) => {
      const host = state.hosts.find(h => h.id === id);
      if (!host) throw new Error(`Cannot find host ${id}`);

      _.remove(state.hosts, host);
      await state.save();

      return host;
    },

    runCommand: async (parent, { command, name, cwd }, { state }) => {
      const [file, ...args] = ShellQuote.parse(command, process.env);
      const terminal = await state.runTerminal({
        file,
        args,
        cwd,
      });

      return terminal;
    },

    createMountedApp: async (parent, { name, upstream }, { state }) => {
      if (state.mountedApps.map(a => a.name).includes(name))
        throw new Error(`MountedApp with ${name} already exists`);

      const mountedApp = new MountedApp({
        name,
        upstream,
      });

      state.mountedApps.push(mountedApp);
      await state.save();

      return mountedApp;
    },

    deleteMountedApp: async (parent, { id }, { state }) => {
      const mountedApp = state.mountedApps.find(a => a.id === id);
      if (!mountedApp) throw new Error(`Cannot find MountedApp ${id}`);

      _.remove(state.mountedApps, mountedApp);
      await state.save();

      return mountedApp;
    },

    composeCreateApplication: async (
      parent,
      { id, repo, branch, path },
      { state },
    ) => {
      const composeApplication = new ComposeApplication({
        id,
        repo,
        branch,
        path,
        state,
      });
      state.composeApplications.push(composeApplication);
      await state.save();

      await composeApplication.up();

      return composeApplication;
    },

    composeDeleteApplication: makeComposeApplicationResolver(
      async (parent, { id }, { state, composeApplication }) => {
        for (const composePortMapping of composeApplication.portMappings)
          await composePortMapping.stop();
        _.remove(state.composeApplications, composeApplication);
        await state.save();
        return composeApplication;
      },
    ),

    composePS: makeComposeApplicationResolver(
      async (parent, args, { state, composeApplication }) => {
        await composeApplication.ps();
        return composeApplication;
      },
    ),

    composeUp: makeComposeApplicationResolver(
      async (parent, args, { state, composeApplication }) => {
        await composeApplication.up();
        return composeApplication;
      },
    ),

    composeDown: makeComposeApplicationResolver(
      async (parent, args, { state, composeApplication }) => {
        await composeApplication.down();
        return composeApplication;
      },
    ),

    composeAddPortMapping: makeComposeApplicationResolver(
      async (
        parent,
        {
          protocol = "tcp",
          loopback = true,
          serviceName,
          servicePort,
          publicPort,
        },
        { state, composeApplication },
      ) => {
        const composePortMapping = new ComposePortMapping({
          protocol,
          loopback,
          serviceName,
          servicePort,
          publicPort,
          composeApplication,
          state,
        });

        composeApplication.portMappings.push(composePortMapping);
        await composePortMapping.start();
        await state.save();

        return composeApplication;
      },
    ),

    composeRemovePortMapping: makeComposeApplicationResolver(
      async (
        parent,
        { composePortMappingId },
        { state, composeApplication },
      ) => {
        const composePortMapping = composeApplication.portMappings.find(
          m => m.id === composePortMappingId,
        );

        if (!composePortMapping)
          throw new Error(`Cannot find PortMapping#${composePortMappingId}`);

        await composePortMapping.stop();
        _.remove(composeApplication.portMappings, composePortMapping);
        await state.save();

        return composeApplication;
      },
    ),

    composeExec: makeComposeApplicationResolver(
      async (
        parent,
        { command, composeContainerId },
        { composeApplication },
      ) => {
        const composeContainer = composeApplication.containers.find(
          c => c.id === composeContainerId,
        );

        if (!composeContainer)
          throw new Error(`Cannot find ComposeContainer#${composeContainerId}`);

        await composeApplication.exec({ composeContainer, command });

        return composeApplication;
      },
    ),

    composeLogs: makeComposeApplicationResolver(
      async (parent, { serviceName }, { composeApplication }) => {
        await composeApplication.logs({ serviceName });

        return composeApplication;
      },
    ),

    composeRun: makeComposeApplicationResolver(
      async (parent, { command, serviceName }, { composeApplication }) => {
        await composeApplication.run({ serviceName, command });

        return composeApplication;
      },
    ),

    createCronJob: async (parent, { command, cron }, { state }) => {
      const cronJob = new CronJob({ command, cron, state });

      state.cronJobs.push(cronJob);
      await cronJob.start();
      await state.save();

      return cronJob;
    },

    deleteCronJob: makeCronJobResolver(
      async (parent, args, { state, cronJob }) => {
        await cronJob.stop();
        _.remove(state.cronJobs, cronJob);
        await state.save();

        return cronJob;
      },
    ),

    updateCronJob: makeCronJobResolver(
      async (parent, { command, cron }, { state, cronJob }) => {
        await cronJob.stop();
        Object.assign(cronJob, {
          command: command || cronJob.command,
          cron: cron || cronJob.cron,
        });
        await cronJob.start();
        await state.save();

        return cronJob;
      },
    ),

    triggerCronJob: makeCronJobResolver(
      async (parent, args, { state, cronJob }) => {
        await cronJob.trigger();

        return cronJob;
      },
    ),
  },
};

for (const [typeName, typeResolvers] of Object.entries(resolvers))
  for (const [fieldName, resolver] of Object.entries(typeResolvers))
    typeResolvers[fieldName] = logger.wrapMethod(
      resolver,
      (self, parent) =>
        `${typeName}${parent ? `(${parent.id})` : ""} -> ${fieldName}`,
      (parent, args) => [{ parent, args }],
    );

module.exports = resolvers;
