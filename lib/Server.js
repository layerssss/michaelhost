const AdminServer = require("./AdminServer.js");
const WebhookServer = require("./WebhookServer.js");
const State = require("./State.js");
const createLogger = require("./createLogger.js");
const serverListenAsync = require("./serverListenAsync.js");
const serverStopAsync = require("./serverStopAsync.js");

const logger = createLogger("Server");

class Server {
  static async init({
    adminPort,
    adminBind,
    webhookServerPort,
    secret,
    stateFilePath,
  }) {
    if (!stateFilePath) throw new Error("stateFilePath is required");
    if (!adminPort) throw new Error("adminPort is required");
    if (!adminBind) throw new Error("adminBind is required");

    const state = await State.load({
      filePath: stateFilePath,
      secret,
    });

    const adminServer = await AdminServer.init({ state });
    const webhookServer = new WebhookServer({ state });

    const server = new Server();
    Object.assign(server, {
      adminPort,
      adminBind,
      adminServer,
      webhookServer,
      webhookServerPort,
      state,
    });

    return server;
  }

  async start() {
    if (this.webhookServerPort)
      await serverListenAsync(this.webhookServer.httpServer, {
        port: this.webhookServerPort,
        host: this.adminBind,
      });

    await serverListenAsync(this.adminServer, {
      port: this.adminPort,
      host: this.adminBind,
    });

    await this.state.start();
  }

  async stop() {
    await this.state.stop();

    if (this.webhookServerPort)
      await serverStopAsync(this.webhookServer.httpServer);
    await serverStopAsync(this.adminServer);
  }
}

module.exports = logger.wrapClass(Server);
