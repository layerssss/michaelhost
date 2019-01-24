const assert = require("assert");
const net = require("net");
const uuid = require("uuid");

const serverListenAsync = require("./serverListenAsync.js");
const serverStopAsync = require("./serverStopAsync.js");
const createLogger = require("./createLogger.js");

const logger = createLogger("ComposePortMapping");

class ComposePortMapping {
  constructor({
    id = uuid.v4().slice(0, 8),
    loopback = true,
    protocol = "tcp",
    serviceName,
    servicePort,
    publicPort,
    state,
    composeApplication,
  }) {
    assert(protocol);
    assert(serviceName);
    assert(servicePort);
    assert(publicPort);
    assert(state);
    assert(composeApplication);

    Object.assign(this, {
      id,
      protocol,
      serviceName,
      servicePort,
      publicPort,
      state,
      composeApplication,
      connections: [],
      loopback,
      status: "ready",
    });
  }

  async start() {
    Promise.resolve()
      .then(async () => {
        if (this.protocol !== "tcp")
          throw new Error(`${this.protocol} is not supported`);
        this.status = "starting...";
        this.composeApplication.broadcastState();
        this.server = net.createServer(socket =>
          Promise.resolve()
            .then(async () => this.handleConnect(socket))
            .catch(error => {
              logger.error(error);
              socket.end();
            }),
        );
        await serverListenAsync(this.server, {
          host: this.loopback ? "127.0.0.1" : "0.0.0.0",
          port: this.publicPort,
        });
        this.status = "listening...";
        this.composeApplication.broadcastState();
      })
      .catch(error => {
        logger.error(error);
        this.server = null;
        this.status = error.message;
        this.composeApplication.broadcastState();
      });
  }

  handleConnect(socket) {
    const clientPorts = [];
    for (const composeContainer of this.composeApplication.containers || []) {
      if (composeContainer.serviceName !== this.serviceName) continue;
      for (const composeContainerPort of composeContainer.ports) {
        if (composeContainerPort.protocol !== this.protocol) continue;
        if (composeContainerPort.port !== this.servicePort) continue;
        clientPorts.push(composeContainerPort.hostPort);
      }
    }

    const clientPort =
      clientPorts[Math.floor(Math.random() * clientPorts.length)];

    if (!clientPort)
      throw new Error(
        `Not available: ${this.serviceName}/${this.protocol}/${
          this.servicePort
        }`,
      );

    const clientSocket = net.connect({
      host: "127.0.0.1",
      port: clientPort,
    });

    socket.pipe(clientSocket);
    clientSocket.pipe(socket);
  }

  async stop() {
    if (this.server) await serverStopAsync(this.server);
    this.composeApplication.broadcastState();
  }

  get connectionsCount() {
    return this.connections.length;
  }
}

module.exports = logger.wrapClass(ComposePortMapping);
