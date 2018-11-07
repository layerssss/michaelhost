const _ = require("lodash");
const uuid = require("uuid");

const createLogger = require("./createLogger.js");
const Host = require("./Host.js");
const OidcConfig = require("./OidcConfig.js");

const logger = createLogger("resolvers");

const resolvers = {
  Query: {
    hosts: async (parent, args, { state }) => {
      const { hosts } = state;
      return hosts;
    },

    host: async (parent, { id }, { state }) => {
      const host = state.hosts.find(h => h.id === id);
      if (!host) throw new Error(`Cannot find host ${id}`);
      return host;
    }
  },

  Mutation: {
    createHost: async (
      parent,
      { hostname, ssl = true, upstream, oidcConfig: oidcConfigInput },
      { state }
    ) => {
      if (state.hosts.map(h => h.hostname).includes(hostname))
        throw new Error(`Host with ${hostname} already exists`);

      const host = new Host({
        id: uuid.v4().slice(0, 8),
        hostname,
        ssl,
        upstream,
        oidcConfig:
          oidcConfigInput &&
          new OidcConfig({
            id: uuid.v4().slice(0, 8),
            ...oidcConfigInput
          })
      });

      state.hosts.push(host);
      await state.save();

      return host;
    },

    updateHost: async (
      parent,
      { id, hostname, ssl = true, upstream, oidcConfig: oidcConfigInput },
      { state }
    ) => {
      const host = state.hosts.find(h => h.id === id);
      if (!host) throw new Error(`Cannot find host ${id}`);

      Object.assign(host, {
        hostname,
        ssl,
        upstream,
        oidcConfig:
          oidcConfigInput &&
          new OidcConfig({
            id: uuid.v4().slice(0, 8),
            ...oidcConfigInput
          })
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
    }
  }
};

for (const [typeName, typeResolvers] of Object.entries(resolvers))
  for (const [fieldName, resolver] of Object.entries(typeResolvers))
    typeResolvers[fieldName] = logger.wrapMethod(
      resolver,
      (self, parent) =>
        `${typeName}${parent ? `(${parent.id})` : ""} -> ${fieldName}`,
      (parent, args) => [{ parent, args }]
    );

module.exports = resolvers;
