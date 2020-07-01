const http = require("http");
const assert = require("assert");
const crypto = require("crypto");
const express = require("express");
const fetch = require("node-fetch");
const bodyParser = require("body-parser");
const secureCompare = require("secure-compare");

const Lock = require("./Lock.js");
const { HTTP_TIMEOUT } = require("./constants.js");
const createLogger = require("./createLogger.js");
const UserError = require("./UserError.js");
const Service = require("./Service.js");

const logger = createLogger("WebhookServer");
const dockerPullLock = new Lock();

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
        .catch((error) => {
          logger.error(error);
          next(error);
        }),
    );

    app.post("/image", (req, res, next) =>
      Promise.resolve()
        .then(() => this.handleImagePush({ req, res }))
        .catch((error) => {
          logger.error(error);
          next(error);
        }),
    );

    app.use(
      "/github",
      bodyParser.json({
        verify: (req, res, buf, encoding) => {
          try {
            assert(this.state.secret);
            const payloadBody = buf.toString(encoding);
            const sha1 = crypto
              .createHmac("sha1", state.secret)
              .update(payloadBody)
              .digest("hex");
            const signature = `sha1=${sha1}`;
            const headerSignature = req.headers["x-hub-signature"];
            if (!secureCompare(signature, headerSignature))
              throw UserError(`${headerSignature} is not valid.`);
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
        .catch((error) => {
          logger.error(error);
          next(error);
        }),
    );

    const httpServer = http.createServer(app);
    httpServer.setTimeout(HTTP_TIMEOUT);
    Object.assign(this, { httpServer, state });
  }

  async handleImagePush({ req, res }) {
    assert(this.state.secret);
    const { repoName, tag } = req.query;
    assert(repoName);
    assert(tag);
    const authorizationHeader = req.get("Authorization");
    const authorizationHeaderExpect = `Bearer ${this.state.secret}`;
    if (!secureCompare(authorizationHeader, authorizationHeaderExpect))
      return res.status(403).end();

    await this.handleDockerImagePush({ repoName, tag });

    res.json({ ok: true });
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
      throw new UserError(`Callback URL: ${callbackUrl} is not trusted.`);

    const callbackPayload = {
      state: "success",
      description: "TODO: description",
      context: "TODO: context",
      target_url: repoUrl,
    };

    const response = await fetch(callbackUrl, {
      method: "POST",
      body: callbackPayload,
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    await this.handleDockerImagePush({ repoName, tag });

    res.json({ ok: true });
  }

  async handleDockerImagePush({ repoName, tag }) {
    const image = `${repoName}:${tag}`;

    const matchedComposeApplications = [];
    for (const composeApplication of this.state.composeApplications) {
      if (
        composeApplication.containers &&
        composeApplication.containers.find((c) => c.image === image)
      )
        matchedComposeApplications.push(composeApplication);
    }

    if (matchedComposeApplications.length) {
      await dockerPullLock.run(async () => {
        const terminal = await this.state.runTerminal({
          file: "docker",
          name: "docker pull",
          args: ["pull", image],
        });

        await terminal.waitForExit();

        for (const composeApplication of matchedComposeApplications) {
          await composeApplication.queueTask(async () => {
            await composeApplication.up();
          });
        }
      });
    }

    const services = await Service.all({ state: this.state });
    for (const service of services) {
      if (service.image !== image) continue;
      await dockerPullLock.run(async () => {
        await service.pull();
      });
    }
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
        await composeApplication.queueTask(async () => {
          await composeApplication.up();
        });
    }
  }
}

module.exports = logger.wrapClass(WebhookServer);
