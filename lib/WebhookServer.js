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
    app.post("/docker_hub", (req, res, next) =>
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

          if (!callbackUrl.startsWith("https://registry.hub.docker.com/"))
            throw new Error(`Callback URL: ${callbackUrl} is not trusted.`);

          const callbackPayload = {
            state: "success",
            description: "TODO: description",
            context: "TODO: context",
            target_url: repoUrl,
          };

          await requestp({
            method: "POST",
            uri: callbackUrl,
            json: true,
            body: callbackPayload,
          });

          await webhookServer.handleDockerHubPush({ repoName, tag });

          res.json({ ok: true });
        })
        .catch(error => {
          logger.error(error);
          next(error);
        }),
    );

    const webhookServer = http.createServer(app);

    return webhookServer;
  }

  async handleDockerHubPush({ repoName, tag }) {
    Promise.resolve()
      .then(async () => {
        const terminal = await this.state.runTerminal({
          file: "docker",
          name: "docker pull",
          args: ["pull", `${repoName}:${tag}`],
        });

        await terminal.waitForExit();

        for (const composeApplication of this.state.composeApplications) {
          if (
            composeApplication.containers ||
            composeApplication.containers.find(
              c => c.image === `${repoName}:${tag};`,
            )
          )
            await composeApplication.up();
        }
      })
      .catch(error => logger.error(error));
  }
}

module.exports = logger.wrapClass(WebhookServer);
