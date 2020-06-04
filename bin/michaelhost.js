#!/usr/bin/env node
const commander = require("commander");
const homedir = require("homedir");
const path = require("path");

if (!process.env.NODE_ENV) process.env.NODE_ENV = "production";

const createLogger = require("../lib/createLogger.js");
const Service = require("../lib/Service.js");
const State = require("../lib/State.js");
const waitForDeath = require("../lib/waitForDeath.js");
const rollbar = require("../lib/rollbar.js");

const logger = createLogger("cli");

commander
  .version(require("../package.json").version)
  .option(
    "-s --state-file-path [path]",
    "file path to store application config and state",
    path.join(homedir(), ".michaelhost-state.json"),
  );

const runAsync = (func) =>
  Promise.resolve()
    .then(func)
    .then(() => process.exit(0))
    .catch((error) =>
      rollbar.critical(error, () => {
        logger.error(error);
        process.exit(1);
      }),
    );

commander
  .command("service")
  .option(
    "-p --admin-port [integer]",
    "admin interface http port",
    (i, d) => parseInt(i || d, 10),
    2000,
  )
  .option(
    "-w --webhook-server-port [integer]",
    "webhook http port on localhost",
  )
  .option(
    "-b --admin-bind [addr]",
    "admin interface http bind on localhost",
    (i, d) => i || d,
    "localhost",
  )
  .option("-s --secret [secret]", "secret for webhook")
  .option("-e --email [string]", "admin email address", process.env["EMAIL"])
  .action(({ adminPort, adminBind, webhookServerPort, email, secret }) =>
    runAsync(async () => {
      logger.info({
        command: "service",
        adminPort,
        adminBind,
        webhookServerPort,
        email,
      });

      const service = await Service.init({
        secret,
        adminPort,
        adminBind,
        webhookServerPort,
        email,
        stateFilePath,
      });
      await service.start();

      await waitForDeath();
      await service.stop();
    }),
  );

commander.command("init").action(() =>
  runAsync(async () => {
    logger.info({ command: "init" });

    const state = await State.init({ filePath: stateFilePath });
    await state.save();
  }),
);

const { stateFilePath } = commander.parse(process.argv);

logger.info({ stateFilePath });
