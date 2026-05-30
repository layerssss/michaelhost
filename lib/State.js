const assert = require("assert");
const fs = require("fs");
const _ = require("lodash");
const Docker = require("dockerode");
const { promisify } = require("util");
const semver = require("semver");

const sleep = require("./sleep.js");
const { version } = require("../package.json");
const Terminal = require("./Terminal.js");
const Lock = require("./Lock.js");
const CronJob = require("./CronJob.js");
const createLogger = require("./createLogger.js");

const logger = createLogger("State");
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

  static async load({ filePath, secret }) {
    if (!fs.existsSync(filePath)) {
      logger.info(`Initializing state file at ${filePath}`);
      await writeFileAsync(
        filePath,
        JSON.stringify({ configVersion, cronJobs: [] }),
        "utf8",
      );
    }
    const data = JSON.parse(await readFileAsync(filePath, "utf8"));

    const state = new State();

    assert.equal(data.configVersion, configVersion);

    Object.assign(state, {
      filePath,
      secret,
      docker: new Docker(),
    });

    const cronJobs = [];
    for (const cronJobData of data.cronJobs || []) {
      cronJobs.push(
        new CronJob({
          ...cronJobData,
          state,
        }),
      );
    }
    state.cronJobs = cronJobs;

    return state;
  }

  static async init({ filePath }) {
    if (fs.existsSync(filePath)) throw new Error(`${filePath} already exists!`);
    const state = new State();

    Object.assign(state, {
      filePath,
      cronJobs: [],
    });

    return state;
  }

  async save() {
    await this.fileLock.run(async () => {
      const data = {
        configVersion,
        cronJobs: this.cronJobs.map((cronJob) =>
          _.pick(cronJob, ["id", "name", "command", "cron", "singleInstance"]),
        ),
      };

      await writeFileAsync(this.filePath, JSON.stringify(data), "utf8");
    });
  }

  async start() {
    for (const cronJob of this.cronJobs) {
      await cronJob.start();
    }
  }

  async stop() {
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
