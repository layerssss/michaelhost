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

const logger = createLogger("Server");

function tryGetHref({ path, base }) {
  try {
    const url = new URL(path, base);
    return url.href;
  } catch (error) {
    if (error instanceof TypeError) return null;
    throw error;
  }
}

class Server {
  static async init({
    adminPort,
    adminBind,
    webhookServerPort,
    email,
    secret,
    stateFilePath,
    master = false,
    slave = false,
  }) {
    if (!stateFilePath) throw new Error("stateFilePath is required");
    const state = await State.load({
      filePath: stateFilePath,
      email,
      secret,
      master,
      slave,
    });
    const server = new Server();

    if (master) {
      if (!adminPort) throw new Error("adminPort is required");
      if (!adminBind) throw new Error("adminBind is required");

      const adminServer = await AdminServer.init({ state });
      const webhookServer = new WebhookServer({ state });

      Object.assign(server, {
        adminPort,
        adminBind,
        adminServer,

        webhookServer,
        webhookServerPort,
      });
    }

    if (slave) {
      if (!email) throw new Error("email is required");
      const leClient = await LEClient.init({ state, email });
      const reverseProxy = await ReverseProxy.init({ state });
      const httpServer = http.createServer((request, response) => {
        const { host } = request.headers;

        if (host) {
          const href = tryGetHref({
            path: request.url,
            base: `http://${host}`,
          });
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

      Object.assign(server, {
        email,
        sslServer,
        httpServer,
      });
    }

    Object.assign(server, {
      state,
      master,
      slave,
    });

    return server;
  }

  async start() {
    if (this.master) {
      if (this.webhookServerPort)
        await serverListenAsync(this.webhookServer.httpServer, {
          port: this.webhookServerPort,
          host: this.adminBind,
        });

      await serverListenAsync(this.adminServer, {
        port: this.adminPort,
        host: this.adminBind,
      });
    }

    if (this.slave) {
      await serverListenAsync(this.httpServer, {
        port: 80,
        host: "::",
      });

      await serverListenAsync(this.sslServer, {
        port: 443,
        host: "::",
      });
    }

    await this.state.start();
  }

  async stop() {
    await this.state.stop();

    if (this.master) {
      if (this.webhookServerPort)
        await serverStopAsync(this.webhookServer.httpServer);
      await serverStopAsync(this.adminServer);
    }

    if (this.slave) {
      await serverStopAsync(this.httpServer);
      await serverStopAsync(this.sslServer);
    }
  }
}

module.exports = logger.wrapClass(Server);
