const assert = require("assert");
const fs = require("fs");
const _ = require("lodash");
const { promisify } = require("util");
const semver = require("semver");

const sleep = require("./sleep.js");
const { version } = require("../package.json");
const Host = require("./Host.js");
const OidcConfig = require("./OidcConfig.js");
const MountedApp = require("./MountedApp.js");
const Terminal = require("./Terminal.js");
const Lock = require("./Lock.js");
const ComposeApplication = require("./ComposeApplication.js");
const ComposePortMapping = require("./ComposePortMapping.js");
const CronJob = require("./CronJob.js");
const createLogger = require("./createLogger.js");

const logger = createLogger("state");
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

const configVersion = `michaelhost-config.${semver.major(version)}`;

class State {
  constructor() {
    this.fileLock = new Lock();
    this.id = "michaelhost";
    this.terminals = [];
    this.sessions = [];
    this.broadcastState = _.throttle(this.broadcastState, 500).bind(this);
  }

  static async load({ filePath, email, secret }) {
    const data = JSON.parse(await readFileAsync(filePath, "utf8"));

    const state = new State();
    const pems = data.pems || {};

    assert.equal(data.configVersion, configVersion);

    const hosts = [];
    for (const { oidcConfig: oidcConfigData, ...hostData } of data.hosts || [])
      hosts.push(
        new Host({
          ...hostData,
          oidcConfig: !oidcConfigData ? null : new OidcConfig(oidcConfigData),
        }),
      );

    const mountedApps = [];
    for (const mountedAppData of data.mountedApps || [])
      mountedApps.push(new MountedApp(mountedAppData));

    const composeApplications = [];
    for (const composeApplicationData of data.composeApplications || []) {
      const composeApplication = new ComposeApplication({
        ...composeApplicationData,
        state,
      });

      for (const portMappingData of composeApplicationData.portMappings || [])
        composeApplication.portMappings.push(
          new ComposePortMapping({
            ...portMappingData,
            composeApplication,
            state,
          }),
        );

      composeApplications.push(composeApplication);
    }

    const cronJobs = [];
    for (const cronJobData of data.cronJobs || []) {
      const cronJob = new CronJob({
        ...cronJobData,
        state,
      });

      cronJobs.push(cronJob);
    }

    Object.assign(state, {
      filePath,
      hosts,
      mountedApps,
      composeApplications,
      cronJobs,
      email,
      secret,
      pems,
    });

    return state;
  }

  static async init({ filePath }) {
    const state = new State();

    Object.assign(state, {
      filePath,
      hosts: [],
      mountedApps: [],
      composeApplications: [],
      cronJobs: [],
      pems: {},
    });

    return state;
  }

  async save() {
    await this.fileLock.run(async () => {
      const data = {
        configVersion,
      };

      data.hosts = [];
      for (const host of this.hosts) {
        const hostData = _.pick(host, [
          "id",
          "hostname",
          "ssl",
          "upstream",
          "enabled",
          "redirect",
          "changeOrigin",
        ]);

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

      data.mountedApps = [];
      for (const mountedApp of this.mountedApps) {
        const mountedAppData = _.pick(mountedApp, ["id", "name", "upstream"]);

        data.mountedApps.push(mountedAppData);
      }

      data.composeApplications = [];
      for (const composeApplication of this.composeApplications) {
        const composeApplicationData = _.pick(composeApplication, [
          "id",
          "repo",
          "path",
          "branch",
        ]);

        composeApplicationData.portMappings = [];
        for (const portMapping of composeApplication.portMappings) {
          const portMappingData = _.pick(portMapping, [
            "id",
            "protocol",
            "serviceName",
            "servicePort",
            "publicPort",
            "loopback",
          ]);

          composeApplicationData.portMappings.push(portMappingData);
        }

        data.composeApplications.push(composeApplicationData);
      }

      data.cronJobs = [];
      for (const cronJob of this.cronJobs) {
        const cronJobData = _.pick(cronJob, ["id", "command", "cron"]);

        data.cronJobs.push(cronJobData);
      }
      data.pems = this.pems;

      await writeFileAsync(this.filePath, JSON.stringify(data), "utf8");
    });
  }

  async start() {
    for (const composeApplication of this.composeApplications) {
      for (const composePortMapping of composeApplication.portMappings) {
        await composePortMapping.start();
      }
    }

    this.deferStartTimer = setTimeout(
      () =>
        Promise.resolve()
          .then(async () => {
            this.deferJobTimer = null;
            for (const composeApplication of this.composeApplications) {
              await composeApplication.queueTask(async () => {
                await composeApplication.up();
              });
            }

            for (const cronJob of this.cronJobs) {
              await cronJob.start();
            }
          })
          .catch(error => logger.error(error)),
      // start after 1 second
      1000,
    );

    this.intervalTimer = setInterval(
      () =>
        Promise.resolve()
          .then(async () => {
            for (const composeApplication of this.composeApplications) {
              await composeApplication.queueTask(async () => {
                await composeApplication.ps();
              });
            }
          })
          .catch(error => logger.error(error)),
      // ps every hour
      1000 * 3600,
    );
  }

  async stop() {
    if (this.deferStartTimer) {
      clearTimeout(this.deferStartTimer);
      this.deferStartTimer = null;
    }

    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }

    for (const composeApplication of this.composeApplications) {
      for (const composePortMapping of composeApplication.portMappings) {
        await composePortMapping.stop();
      }
    }

    for (const cronJob of this.cronJobs) {
      await cronJob.stop();
    }
  }

  broadcastState() {
    for (const session of this.sessions)
      session.webSocket.send(
        JSON.stringify({
          terminals: this.terminals
            .filter(t => !t.finished)
            .map(terminal => ({
              __typename: "Terminal",
              id: terminal.id,
              name: terminal.name,
            })),
          composeApplications: this.composeApplications.map(
            composeApplication => ({
              __typename: "ComposeApplication",
              id: composeApplication.id,
              name: composeApplication.name,
              task: composeApplication.task && {
                __typename: "ComposeTask",
                id: composeApplication.task.id,
                name: composeApplication.task.name,
                terminal: composeApplication.task.terminal && {
                  __typename: "Terminal",
                  id: composeApplication.task.terminal.id,
                },
              },
              containers:
                composeApplication.containers &&
                composeApplication.containers.map(composeContainer => ({
                  __typename: "ComposeContainer",
                  id: composeContainer.id,
                  runningFor: composeContainer.runningFor,
                  ports: composeContainer.ports.map(composeContainerPort => ({
                    __typename: "ComposeContainerPort",
                    id: composeContainerPort.id,
                    hostPort: composeContainerPort.hostPort,
                  })),
                })),
            }),
          ),
        }),
        error => null,
      );
  }

  async runTerminal(options) {
    const terminal = await Terminal.init(options);

    this.terminals.push(terminal);
    this.broadcastState();

    Promise.resolve()
      .then(async () => {
        try {
          await terminal.waitForExit();
        } catch (error) {
          logger.error(error);
        }
        this.broadcastState();
        await sleep(10000);
        _.remove(this.terminals, terminal);
      })
      .catch(async error => logger.error(error));

    return terminal;
  }

  handleWebSocketConnect() {
    this.broadcastState();
  }
  handleWebSocketClose() {}
  handleWebSocketMessage() {}
}

module.exports = logger.wrapClass(State, {
  ignoreMethods: ["broadcastState"],
});
