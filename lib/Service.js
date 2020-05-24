const assert = require("assert");
const http = require("http");
const https = require("https");

const { HTTP_TIMEOUT } = require("./constants.js");
const AdminServer = require("./AdminServer.js");
const WebhookServer = require("./WebhookServer.js");
const State = require("./State.js");
const createLogger = require("./createLogger.js");
const ReverseProxy = require("./ReverseProxy.js");
const LEClient = require("./LEClient.js");
const serverListenAsync = require("./serverListenAsync.js");
const serverStopAsync = require("./serverStopAsync.js");

const logger = createLogger("service");

function tryGetHref({ path, base }) {
  try {
    const url = new URL(path, base);
    return url.href;
  } catch (error) {
    if (error instanceof TypeError) return null;
    throw error;
  }
}

class Service {
  static async init({
    adminPort,
    adminBind,
    webhookServerPort,
    email,
    secret,
    stateFilePath,
  }) {
    if (!adminPort) throw new Error("adminPort is required");
    if (!adminBind) throw new Error("adminBind is required");
    if (!email) throw new Error("email is required");
    if (!stateFilePath) throw new Error("stateFilePath is required");

    assert.equal(adminPort.constructor, Number);
    assert.equal(email.constructor, String);
    assert.equal(stateFilePath.constructor, String);

    const service = new Service();

    const state = await State.load({ filePath: stateFilePath, email, secret });
    await state.start();
    const adminServer = await AdminServer.init({ state });
    const webhookServer = new WebhookServer({ state });
    const leClient = await LEClient.init({ state, email });
    const reverseProxy = await ReverseProxy.init({ state });
    const httpServer = http.createServer((request, response) => {
      const { host } = request.headers;

      if (host) {
        const href = tryGetHref({ path: request.url, base: `http://${host}` });
        const leChallenge = leClient.challenges[href];
        if (leChallenge) return response.end(leChallenge);
      }

      reverseProxy.handleRequest({ request, response, ssl: false });
    });
    httpServer.setTimeout(HTTP_TIMEOUT);

    httpServer.on("upgrade", (request, socket, head) =>
      reverseProxy.handleUpgrade({ request, socket, head, ssl: false }),
    );

    const sslServer = https.createServer(
      {
        SNICallback: (domain, cb) =>
          Promise.resolve()
            .then(async () => await leClient.handleSNICallback({ domain }))
            .then(
              (ctx) => cb(null, ctx),
              (error) => {
                logger.error(error);
                cb(error);
              },
            ),
      },
      (request, response) =>
        reverseProxy.handleRequest({ request, response, ssl: true }),
    );
    sslServer.setTimeout(HTTP_TIMEOUT);

    sslServer.on("upgrade", (request, socket, head) =>
      reverseProxy.handleUpgrade({ request, socket, head, ssl: true }),
    );

    Object.assign(service, {
      email,
      state,

      adminPort,
      adminBind,
      adminServer,

      webhookServer,
      webhookServerPort,

      sslServer,
      httpServer,
    });

    return service;
  }

  async start() {
    if (this.webhookServerPort)
      await serverListenAsync(this.webhookServer.httpServer, {
        port: this.webhookServerPort,
        host: "localhost",
      });

    await serverListenAsync(this.adminServer, {
      port: this.adminPort,
      host: this.adminBind,
    });

    await serverListenAsync(this.httpServer, {
      port: 80,
      host: "::",
    });

    await serverListenAsync(this.sslServer, {
      port: 443,
      host: "::",
    });
  }

  async stop() {
    await this.state.stop();
    if (this.webhookServerPort)
      await serverStopAsync(this.webhookServer.httpServer);
    await serverStopAsync(this.adminServer);
    await serverStopAsync(this.httpServer);
    await serverStopAsync(this.sslServer);
  }
}

module.exports = logger.wrapClass(Service);
