const http = require("http");
const assert = require("assert");
const express = require("express");
const requestp = require("request-promise-native");
const bodyParser = require("body-parser");

const createLogger = require("./createLogger.js");

const logger = createLogger("WebhookServer");

class WebhookServer {
  static async init({ state }) {
    const app = express();

    app.use((req, res, next) => {
      const { method, url } = req;
      logger.info(`${method} ${url}`);
      next();
    });

    app.use("/docker_hub", bodyParser.json());
    app.get("/docker_hub", (req, res, next) =>
      Promise.resolve()
        .then(async () => {
          const callbackUrl = req.body.callback_url;
          const tag = req.body.push_data.tag;
          const repoName = req.body.repository.repo_name;
          const repoUrl = req.body.repository.repo_url;

          assert(callbackUrl);
          assert(tag);
          assert(repoName);
          assert(repoUrl);

          const callbackPayload = {
            state: "success",
            description: "TODO: description",
            context: "TODO: context",
            target_url: repoUrl,
          };

          try {
            const terminal = await state.runTerminal({
              file: "docker",
              name: "docker pull",
              args: ["pull", `${repoName}:${tag}`],
            });
            await terminal.waitForExit();
          } catch (error) {
            callbackPayload.state = "error";
            callbackPayload.description = error.message;
          }

          await requestp({
            method: "POST",
            uri: callbackUrl,
            json: true,
            body: callbackPayload,
          });
        })
        .catch(error => {
          logger.error(error);
          next(error);
        }),
    );

    const webhookServer = http.createServer(app);

    return webhookServer;
  }
}

module.exports = logger.wrapClass(WebhookServer);
