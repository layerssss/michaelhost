const assert = require("assert");
const fs = require("fs");
const _ = require("lodash");
const Docker = require("dockerode");
const { promisify } = require("util");
const semver = require("semver");

const sleep = require("./sleep.js");
const { version } = require("../package.json");
const Host = require("./Host.js");
const OidcConfig = require("./OidcConfig.js");
const Terminal = require("./Terminal.js");
const Lock = require("./Lock.js");
const CronJob = require("./CronJob.js");
const createLogger = require("./createLogger.js");

const logger = createLogger("State");
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const statAsync = promisify(fs.stat);

const configVersion = `michaelhost-config.${semver.major(version)}`;

class State {
  constructor() {
    this.fileLock = new Lock();
    this.id = "michaelhost";
    this.terminals = [];
    this.sessions = [];
    this.broadcastState = _.throttle(this.broadcastState, 500).bind(this);
  }

  static async load({
    filePath,
    email,
    secret,
    master = false,
    slave = false,
  }) {
    const data = JSON.parse(await readFileAsync(filePath, "utf8"));

    const state = new State();

    assert.equal(data.configVersion, configVersion);

    Object.assign(state, {
      filePath,
      email,
      secret,
      docker: new Docker(),
      master,
      slave,
    });

    await state.loadSharable();
    state.mtime = await state.getMtime();

    return state;
  }

  async getMtime() {
    const stats = await statAsync(this.filePath);
    const mtime = Number(stats.mtime);
    return mtime;
  }

  async loadSharable() {
    const data = JSON.parse(await readFileAsync(this.filePath, "utf8"));
    const pems = data.pems || {};
    const hosts = [];
    const cronJobs = [];

    for (const { oidcConfig: oidcConfigData, ...hostData } of data.hosts || [])
      hosts.push(
        new Host({
          ...hostData,
          oidcConfig: !oidcConfigData ? null : new OidcConfig(oidcConfigData),
        }),
      );

    for (const cronJobData of data.cronJobs || []) {
      const cronJob = new CronJob({
        ...cronJobData,
        state: this,
      });

      cronJobs.push(cronJob);
    }
    Object.assign(this, { hosts, pems, cronJobs });
  }

  static async init({ filePath }) {
    if (fs.existsSync(filePath)) throw new Error(`${filePath} already exists!`);
    const state = new State();

    Object.assign(state, {
      filePath,
      hosts: [],
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
          "plain",
          "upstream",
          "enabled",
          "redirect",
          "changeOrigin",
          "whitelistIps",
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

      data.cronJobs = [];
      for (const cronJob of this.cronJobs) {
        const cronJobData = _.pick(cronJob, [
          "id",
          "name",
          "command",
          "cron",
          "singleInstance",
        ]);

        data.cronJobs.push(cronJobData);
      }
      data.pems = this.pems;

      await writeFileAsync(this.filePath, JSON.stringify(data), "utf8");

      this.mtime = await this.getMtime();
    });
  }

  async start() {
    await this.startSharable();

    this.intervalTimer = setInterval(
      () =>
        Promise.resolve()
          .then(async () => {
            this.fileLock.run(async () => {
              // check mtime to reload sharable
              const mtime = await this.getMtime();
              if (mtime !== this.mtime) {
                await this.stopSharable();
                await this.loadSharable();
                await this.startSharable();
                this.mtime = mtime;
              }
            });
          })
          .catch((error) => logger.error(error)),
      // ps every minute
      1000 * 60,
    );
  }

  async startSharable() {
    if (this.master)
      for (const cronJob of this.cronJobs) {
        await cronJob.start();
      }
  }

  async stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }

    await this.stopSharable();
  }

  async stopSharable() {
    if (this.master)
      for (const cronJob of this.cronJobs) {
        await cronJob.stop();
      }
  }

  broadcastState() {
    for (const session of this.sessions)
      session.webSocket.send(
        JSON.stringify({
          terminals: this.terminals
            .filter((t) => !t.finished)
            .map((terminal) => ({
              __typename: "Terminal",
              id: terminal.id,
              name: terminal.name,
            })),
        }),
        (error) => null,
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
      .catch(async (error) => logger.error(error));

    return terminal;
  }

  handleWebSocketConnect({ session }) {
    session.messageListener = ({ message, error, errorInfo }) => {
      if (message)
        for (const session of this.sessions)
          session.webSocket.send(
            JSON.stringify({
              message,
            }),
            (error) => null,
          );
      if (error && error.code !== "USER_ERROR")
        for (const session of this.sessions)
          session.webSocket.send(
            JSON.stringify({
              error: {
                message: error.message,
                ...errorInfo,
              },
            }),
            (error) => null,
          );
    };
    createLogger.globalEventEmitter.on("message", session.messageListener);
  }

  handleWebSocketClose({ session }) {
    createLogger.globalEventEmitter.off("message", session.messageListener);
  }

  handleWebSocketMessage() {}
}

module.exports = logger.wrapClass(State, {
  ignoreMethods: ["broadcastState"],
});
