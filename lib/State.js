const assert = require("assert");
const fs = require("fs");
const _ = require("lodash");
const { promisify } = require("util");
const semver = require("semver");

const { version } = require("../package.json");
const Host = require("./Host.js");
const OidcConfig = require("./OidcConfig.js");
const MountedApp = require("./MountedApp.js");
const Lock = require("./Lock.js");
const createLogger = require("./createLogger.js");

const logger = createLogger("state");
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

const configVersion = `michaelhost-config.${semver.major(
  version,
)}.${semver.minor(version)}`;

class State {
  constructor() {
    this.fileLock = new Lock();
    this.id = "michaelhost";
    this.terminals = [];
  }

  static async load({ filePath }) {
    const data = JSON.parse(await readFileAsync(filePath, "utf8"));

    assert.equal(data.configVersion, configVersion);

    const state = new State();
    state.hosts = [];
    for (const { oidcConfig: oidcConfigData, ...hostData } of data.hosts || [])
      state.hosts.push(
        new Host({
          ...hostData,
          oidcConfig: !oidcConfigData ? null : new OidcConfig(oidcConfigData),
        }),
      );

    state.mountedApps = [];
    for (const mountedAppData of data.mountedApps || [])
      state.mountedApps.push(new MountedApp(mountedAppData));

    Object.assign(state, {
      filePath,
    });

    return state;
  }

  static async init({ filePath }) {
    const state = new State();

    Object.assign(state, {
      filePath,
      hosts: [],
    });

    return state;
  }

  async save() {
    await this.fileLock.run(async () => {
      const data = {
        configVersion,
        hosts: [],
        mountedApps: [],
      };
      for (const host of this.hosts) {
        const hostData = _.pick(host, ["id", "hostname", "ssl", "upstream"]);

        const { oidcConfig } = host;
        if (oidcConfig)
          hostData.oidcConfig = _.pick(oidcConfig, [
            "id",
            "discoveryUrl",
            "clientId",
            "clientSecret",
            "allowEmails",
          ]);

        data.hosts.push(hostData);
      }

      for (const mountedApp of this.mountedApps) {
        const mountedAppData = _.pick(mountedApp, ["id", "name", "upstream"]);

        data.mountedApps.push(mountedAppData);
      }

      await writeFileAsync(this.filePath, JSON.stringify(data), "utf8");
    });
  }
}

module.exports = logger.wrapClass(State);
