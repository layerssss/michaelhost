#!/usr/bin/env node

require("../lib/tunnelBootstrap.js");

const { Command } = require("commander");
const homedir = require("homedir");
const path = require("path");

if (!process.env.NODE_ENV) process.env.NODE_ENV = "production";

const createLogger = require("../lib/createLogger.js");
const Server = require("../lib/Server.js");
const State = require("../lib/State.js");
const waitForDeath = require("../lib/waitForDeath.js");
const rollbar = require("../lib/rollbar.js");

const logger = createLogger("cli");

const commander = new Command();
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
      rollbar.critical(
        error,
        {
          blackbox: createLogger.blackbox,
        },
        () => {
          logger.error(error);
          process.exit(1);
        },
      ),
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
  .option("-s --secret [secret]", "secret for WebhookServer / ReverseProxy")
  .option(
    "-e --email [string]",
    "admin email address, used in Let's Encrypit",
    process.env["EMAIL"],
  )
  .action(({ adminPort, adminBind, webhookServerPort, email, secret }) =>
    runAsync(async () => {
      logger.info({
        command: "service",
        adminPort,
        adminBind,
        webhookServerPort,
        email,
      });

      const server = await Server.init({
        secret,
        adminPort,
        adminBind,
        webhookServerPort,
        email,
        stateFilePath,
        master: true,
        slave: true,
      });
      await server.start();

      await waitForDeath();
      await server.stop();
    }),
  );

commander
  .command("master")
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
  .option("-s --secret [secret]", "secret for WebhookServer / ReverseProxy")
  .action(({ adminPort, adminBind, webhookServerPort, secret }) =>
    runAsync(async () => {
      logger.info({
        command: "master",
        adminPort,
        adminBind,
        webhookServerPort,
      });

      const server = await Server.init({
        secret,
        adminPort,
        adminBind,
        webhookServerPort,
        stateFilePath,
        master: true,
      });
      await server.start();

      await waitForDeath();
      await server.stop();
    }),
  );

commander
  .command("slave")
  .option(
    "-e --email [string]",
    "admin email address, used in Let's Encrypit",
    process.env["EMAIL"],
  )
  .option("-s --secret [secret]", "secret for WebhookServer / ReverseProxy")
  .action(({ email, secret }) =>
    runAsync(async () => {
      logger.info({
        command: "slave",
        email,
      });

      const server = await Server.init({
        email,
        secret,
        stateFilePath,
        slave: true,
      });
      await server.start();

      await waitForDeath();
      await server.stop();
    }),
  );

commander.command("init").action(() =>
  runAsync(async () => {
    logger.info({ command: "init" });

    const state = await State.init({ filePath: stateFilePath });
    await state.save();
  }),
);

commander.parse(process.argv);
const { stateFilePath } = commander.opts();
logger.info({ stateFilePath });
