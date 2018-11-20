const _ = require("lodash");
const Os = require("os");
const uuid = require("uuid");
const ShellQuote = require("shell-quote");

const createLogger = require("./createLogger.js");
const Host = require("./Host.js");
const Terminal = require("./Terminal.js");
const OidcConfig = require("./OidcConfig.js");
const MountedApp = require("./MountedApp.js");

const logger = createLogger("resolvers");

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
      return terminals;
    },

    mountedApps: async (parent, args, { state }) => {
      const { mountedApps } = state;
      return mountedApps;
    },

    mountedApp: async (parent, { name }, { state }) => {
      const mountedApp = state.mountedApps.find(
        h => h.name.toLowerCase() === name,
      );
      if (!mountedApp) throw new Error(`Cannot find mountedApp ${name}`);
      return mountedApp;
    },

    terminal: async (parent, { id }, { state }) => {
      const terminal = state.terminals.find(h => h.id === id);
      if (!terminal) throw new Error(`Cannot find terminal ${id}`);
      return terminal;
    },
  },

  Mutation: {
    createHost: async (
      parent,
      { hostname, ssl = true, upstream, oidcConfig: oidcConfigInput },
      { state },
    ) => {
      if (state.hosts.map(h => h.hostname).includes(hostname))
        throw new Error(`Host with ${hostname} already exists`);

      const host = new Host({
        enabled: false,
        hostname,
        ssl,
        upstream,
        oidcConfig:
          oidcConfigInput &&
          new OidcConfig({
            ...oidcConfigInput,
          }),
      });

      state.hosts.push(host);
      await state.save();

      return host;
    },

    updateHost: async (
      parent,
      {
        id,
        hostname,
        ssl,
        enabled,
        upstream,
        redirect,
        xfwd,
        oidcConfig: oidcConfigInput,
      },
      { state },
    ) => {
      const host = state.hosts.find(h => h.id === id);
      if (!host) throw new Error(`Cannot find host ${id}`);

      Object.assign(host, {
        enabled,
        hostname,
        ssl,
        upstream,
        redirect,
        xfwd,
        oidcConfig:
          oidcConfigInput &&
          new OidcConfig({
            id: uuid.v4().slice(0, 8),
            ...oidcConfigInput,
          }),
      });

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
      const terminal = await Terminal.init({
        file,
        args,
        cwd,
      });

      state.terminals.push(terminal);

      return terminal;
    },

    deleteTerminal: async (parent, { id }, { state }) => {
      const terminal = state.terminals.find(h => h.id === id);
      if (!terminal) throw new Error(`Cannot find terminal ${id}`);
      if (terminal.alive)
        throw new Error(`Terminal ${terminal.name} is still running`);

      _.remove(state.terminals, terminal);

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
