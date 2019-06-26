const http = require("http");
const assert = require("assert");
const crypto = require("crypto");
const express = require("express");
const requestp = require("request-promise-native");
const bodyParser = require("body-parser");
const secureCompare = require("secure-compare");

const createLogger = require("./createLogger.js");

const logger = createLogger("WebhookServer");

class WebhookServer {
  constructor({ state }) {
    const app = express();

    app.use((req, res, next) => {
      const { method, url } = req;
      logger.info(`${method} ${url}`);
      next();
    });

    app.use("/docker_hub", bodyParser.json());
    app.post("/docker_hub", (req, res, next) =>
      Promise.resolve()
        .then(() => this.handleDockerHubRequest({ req, res }))
        .catch(error => {
          logger.error(error);
          next(error);
        }),
    );

    app.use(
      "/github",
      bodyParser.json({
        verify: (req, res, buf, encoding) => {
          try {
            const payloadBody = buf.toString(encoding);
            const sha1 = crypto
              .createHmac("sha1", state.email)
              .update(payloadBody)
              .digest("hex");
            const signature = `sha1=${sha1}`;
            const headerSignature = req.headers["x-hub-signature"];
            if (!secureCompare(signature, headerSignature))
              throw Error(`${headerSignature} is not valid.`);
          } catch (error) {
            logger.error(error);
            throw error;
          }
        },
      }),
    );
    app.post("/github", (req, res, next) =>
      Promise.resolve()
        .then(() => this.handleGithubRequest({ req, res }))
        .catch(error => {
          logger.error(error);
          next(error);
        }),
    );

    const httpServer = http.createServer(app);
    Object.assign(this, { httpServer, state });
  }

  async handleDockerHubRequest({ req, res }) {
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

    await this.handleDockerHubPush({ repoName, tag });

    res.json({ ok: true });
  }

  async handleDockerHubPush({ repoName, tag }) {
    Promise.resolve()
      .then(async () => {
        const matchedComposeApplications = [];
        for (const composeApplication of this.state.composeApplications) {
          if (
            composeApplication.containers ||
            composeApplication.containers.find(
              c => c.image === `${repoName}:${tag};`,
            )
          )
            matchedComposeApplications.push(composeApplication);
        }

        if (!matchedComposeApplications.length) return;

        const terminal = await this.state.runTerminal({
          file: "docker",
          name: "docker pull",
          args: ["pull", `${repoName}:${tag}`],
        });

        await terminal.waitForExit();

        for (const composeApplication of matchedComposeApplications) {
          await composeApplication.up();
        }
      })
      .catch(error => logger.error(error));
  }

  async handleGithubRequest({ req, res }) {
    if (req.body.ref)
      await this.handleGithubPush({
        repoUrl: req.body.repository.ssh_url,
        ref: req.body.ref,
      });
    res.json({ ok: true });
  }

  async handleGithubPush({ repoUrl, ref }) {
    for (const composeApplication of this.state.composeApplications) {
      if (
        composeApplication.repo === repoUrl &&
        `refs/heads/${composeApplication.branch}` === ref
      )
        await composeApplication.up();
    }
  }
}

module.exports = logger.wrapClass(WebhookServer);
