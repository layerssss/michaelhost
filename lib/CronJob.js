const assert = require("assert");
const uuid = require("uuid");
const nodeCron = require("node-cron");
const moment = require("moment");
const shellQuote = require("shell-quote");

const createLogger = require("./createLogger.js");

const logger = createLogger("ComposeApplication");

class CronJob {
  constructor({
    id = uuid.v4().slice(0, 8),
    command,
    cron,
    state,
    singleInstance = false,
  }) {
    assert(id);
    assert(command);
    assert(cron);
    assert(state);

    Object.assign(this, {
      id,
      command,
      cron,
      state,
      singleInstance,
    });
  }

  set cron(cron) {
    if (!nodeCron.validate(cron))
      throw new Error(`"${cron}" is not a valid crontab syntax.`);
    this._cron = cron;
  }

  get cron() {
    return this._cron;
  }

  async start() {
    if (this.running) return;
    this.running = true;

    this._task = nodeCron.schedule(this.cron, async () => await this.trigger());
  }

  async stop() {
    if (!this.running) return;
    this.running = false;

    this._task.destroy();
    this._task = null;
  }

  async trigger() {
    Promise.resolve()
      .then(async () => {
        await this.execute();
      })
      .catch((error) => logger.error(error));
  }

  async execute() {
    if (this._executing && this.singleInstance) return;
    try {
      this._executing = true;
      const time = moment().format();
      const [file, ...args] = shellQuote.parse(this.command);
      const terminal = await this.state.runTerminal({
        file,
        args,
        name: `${this.command}@${time}`,
      });
      await terminal.waitForExit();
    } finally {
      this._executing = false;
    }
  }
}

module.exports = logger.wrapClass(CronJob);
