const assert = require("assert");
const http = require("http");
const spdy = require("spdy");

const AdminServer = require("./AdminServer.js");
const State = require("./State.js");
const createLogger = require("./createLogger.js");
const ReverseProxy = require("./ReverseProxy.js");
const initGreenlock = require("./initGreenlock.js");
const serverListenAsync = require("./serverListenAsync.js");
const serverStopAsync = require("./serverStopAsync.js");

const logger = createLogger("service");

class Service {
  static async init({ adminPort, email, stateFilePath }) {
    assert.equal(adminPort.constructor, Number);
    assert.equal(email.constructor, String);
    assert.equal(stateFilePath.constructor, String);

    const service = new Service();

    const state = await State.load({ filePath: stateFilePath });
    const adminServer = await AdminServer.init({ state: state });
    const greenlock = await initGreenlock({ state, email });
    const reverseProxy = await ReverseProxy.init({ state });
    const httpServer = http.createServer(
      greenlock.middleware((request, response) =>
        reverseProxy.handleRequest({ request, response, ssl: false }),
      ),
    );

    httpServer.on("upgrade", (request, socket, head) =>
      reverseProxy.handleUpgrade({ request, socket, head, ssl: false }),
    );

    const sslServer = spdy.createServer(
      greenlock.tlsOptions,
      (request, response) =>
        reverseProxy.handleRequest({ request, response, ssl: true }),
    );

    sslServer.on("upgrade", (request, socket, head) =>
      reverseProxy.handleUpgrade({ request, socket, head, ssl: true }),
    );

    Object.assign(service, {
      adminPort,
      email,
      state,
      adminServer,
      sslServer,
      httpServer,
    });

    return service;
  }

  async start() {
    await serverListenAsync(this.adminServer, {
      port: this.adminPort,
      host: "localhost",
    });

    await serverListenAsync(this.httpServer, {
      port: 80,
      host: "0.0.0.0",
    });

    await serverListenAsync(this.sslServer, {
      port: 443,
      host: "0.0.0.0",
    });
  }

  async stop() {
    await serverStopAsync(this.adminServer);
    await serverStopAsync(this.httpServer);
    await serverStopAsync(this.sslServer);
  }
}

module.exports = logger.wrapClass(Service);
