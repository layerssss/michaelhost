const _ = require("lodash");
const Os = require("os");
const ShellQuote = require("shell-quote");

const createLogger = require("./createLogger.js");
const Host = require("./Host.js");
const CronJob = require("./CronJob.js");
const OidcConfig = require("./OidcConfig.js");
const Container = require("./Container.js");
const Service = require("./Service.js");
const Volume = require("./Volume.js");
const Image = require("./Image.js");

const logger = createLogger("resolvers");

const makeCronJobResolver = (resolver) => async (
  parent,
  { id, ...args },
  context,
) => {
  const { state } = context;
  const cronJob = state.cronJobs.find((a) => a.id === id);
  if (!cronJob) throw new Error(`Cannot find CronJob ${id}`);
  return await resolver(parent, args, { ...context, cronJob });
};

const makeContainerResolver = (resolver) => async (
  parent,
  { id, ...args },
  context,
) => {
  const { state } = context;
  const container = await Container.byId({ id, state });
  return await resolver(parent, args, { ...context, container });
};

const makeServiceResolver = (resolver) => async (
  parent,
  { id, ...args },
  context,
) => {
  const { state } = context;
  const service = await Service.byId({ id, state });
  return await resolver(parent, args, { ...context, service });
};

const makeVolumeResolver = (resolver) => async (
  parent,
  { id, ...args },
  context,
) => {
  const { state } = context;
  const volume = await Volume.byId({ id, state });
  return await resolver(parent, args, { ...context, volume });
};

const makeImageResolver = (resolver) => async (
  parent,
  { id, ...args },
  context,
) => {
  const { state } = context;
  const image = await Image.byId({ id, state });
  return await resolver(parent, args, { ...context, image });
};

const resolvers = {
  Query: {
    hostname: async () => {
      const hostname = Os.hostname();
      return hostname;
    },

    version: async () => {
      return require("../package.json").version;
    },

    hosts: async (parent, args, { state }) => {
      const { hosts } = state;
      return hosts;
    },

    host: async (parent, { id }, { state }) => {
      const host = state.hosts.find((h) => h.id === id);
      if (!host) throw new Error(`Cannot find host ${id}`);
      return host;
    },

    terminals: async (parent, args, { state }) => {
      const { terminals } = state;
      return terminals.filter((t) => !t.finished);
    },

    terminal: async (parent, { id }, { state }) => {
      const terminal = state.terminals.find((h) => h.id === id);
      if (!terminal) throw new Error(`Cannot find terminal ${id}`);
      return terminal;
    },

    cronJobs: async (parent, args, { state }) => {
      const { cronJobs } = state;
      return cronJobs;
    },

    cronJob: makeCronJobResolver(async (parent, args, { cronJob }) => {
      return cronJob;
    }),

    containers: async (parent, args, { state }) => {
      return await Container.all({ state });
    },

    container: makeContainerResolver(
      async (parent, args, { state, container }) => {
        return container;
      },
    ),

    images: async (parent, args, { state }) => {
      return await Image.all({ state });
    },

    image: makeImageResolver(async (parent, args, { state, image }) => {
      return image;
    }),

    services: async (parent, args, { state }) => {
      return await Service.all({ state });
    },

    service: makeServiceResolver(async (parent, args, { state, service }) => {
      return service;
    }),

    volumes: async (parent, args, { state }) => {
      return await Volume.all({ state });
    },

    volume: makeVolumeResolver(async (parent, args, { state, volume }) => {
      return volume;
    }),
  },

  Mutation: {
    updateHost: async (
      parent,
      {
        id,
        hostname,
        ssl,
        plain,
        enabled,
        upstream,
        redirect,
        changeOrigin,
        whitelistIps,
        oidcConfig: oidcConfigInput,
      },
      { state },
    ) => {
      let host = state.hosts.find((h) => h.id === id);
      const hostAttributes = {
        hostname,
        ssl,
        plain,
        upstream,
        enabled,
        redirect,
        changeOrigin,
        whitelistIps,
        oidcConfig:
          oidcConfigInput &&
          new OidcConfig({
            ...oidcConfigInput,
          }),
      };
      if (!host) {
        if (state.hosts.map((h) => h.hostname).includes(hostname))
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
      const host = state.hosts.find((h) => h.id === id);
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

    createCronJob: async (parent, { ...props }, { state }) => {
      const cronJob = new CronJob({ ...props, state });

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
      async (parent, { ...props }, { state, cronJob }) => {
        await cronJob.stop();
        Object.assign(cronJob, props);
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

    containerExec: makeContainerResolver(
      async (parent, { command }, { state, container }) => {
        const [file, ...args] = ShellQuote.parse(command, process.env);
        const terminal = await state.runTerminal({
          file: "docker",
          args: ["exec", "-it", container.id, file, ...args],
        });

        return terminal;
      },
    ),

    containerLogs: makeContainerResolver(
      async (parent, { command }, { state, container }) => {
        const terminal = await state.runTerminal({
          file: "docker",
          args: [
            "logs",
            "--timestamps",
            "--tail=100",
            "--follow",
            container.id,
          ],
        });

        return terminal;
      },
    ),

    containerStart: makeContainerResolver(
      async (parent, args, { container }) => {
        await container.dockerContainer.start();
        return true;
      },
    ),

    containerStop: makeContainerResolver(
      async (parent, args, { container }) => {
        await container.dockerContainer.stop();
        return true;
      },
    ),

    containerRm: makeContainerResolver(async (parent, args, { container }) => {
      await container.dockerContainer.remove();
      return true;
    }),

    containersPrune: async (parent, args, { state }) => {
      await state.docker.pruneContainers();
      return true;
    },

    serviceLogs: makeServiceResolver(
      async (parent, args, { state, service }) => {
        const terminal = await state.runTerminal({
          file: "docker",
          args: [
            "service",
            "logs",
            "--timestamps",
            "--tail=100",
            "--follow",
            service.id,
          ],
        });

        return terminal;
      },
    ),

    serviceRm: makeServiceResolver(async (parent, args, { service }) => {
      await service.dockerService.remove();
      return true;
    }),

    servicePull: makeServiceResolver(async (parent, args, { service }) => {
      await service.pull();
      return true;
    }),

    volumeRm: makeVolumeResolver(async (parent, args, { volume }) => {
      await volume.dockerVolume.remove();
      return true;
    }),

    volumesPrune: async (parent, args, { state }) => {
      await state.docker.pruneVolumes();
      return true;
    },

    imageRm: makeImageResolver(async (parent, args, { image }) => {
      await image.rm();
      return true;
    }),

    imagesPrune: async (parent, args, { state }) => {
      await Image.prune({ state });
      return true;
    },

    imagePull: async (parent, { tag }, { state }) => {
      return await Image.pull({ tag, state });
    },
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
