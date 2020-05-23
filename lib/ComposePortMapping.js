const assert = require("assert");
const _ = require("lodash");
const net = require("net");
const uuid = require("uuid");

const { TCP_TIMEOUT } = require("./constants.js");
const serverListenAsync = require("./serverListenAsync.js");
const serverStopAsync = require("./serverStopAsync.js");
const createLogger = require("./createLogger.js");
const UserError = require("./UserError.js");

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
          throw new UserError(`${this.protocol} is not supported`);
        this.status = "starting...";
        this.composeApplication.broadcastState();
        this.server = net.createServer(
          {
            allowHalfOpen: true,
          },
          (socket) =>
            Promise.resolve()
              .then(async () => this.handleConnect(socket))
              .catch((error) => {
                logger.error(error);
                socket.destroy();
              }),
        );
        await serverListenAsync(this.server, {
          host: this.loopback ? "127.0.0.1" : "0.0.0.0",
          port: this.publicPort,
        });
        this.status = "listening...";
        this.composeApplication.broadcastState();
      })
      .catch((error) => {
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
      throw new UserError(
        `Not available: ${this.serviceName}/${this.protocol}/${this.servicePort}`,
      );

    const connection = {
      id: uuid.v4(),
      remoteAddress: socket.remoteAddress,
      remotePort: socket.remotePort,
      bytesReceived: 0,
      bytesSent: 0,
      receiving: true,
      sending: true,
      errorMessage: null,
    };

    this.connections.push(connection);
    this.composeApplication.broadcastState();

    socket.on("close", () => {
      _.remove(this.connections, connection);
      this.composeApplication.broadcastState();
    });

    const clientSocket = net.connect({
      host: "127.0.0.1",
      port: clientPort,
      allowHalfOpen: true,
    });

    socket.pipe(clientSocket);
    clientSocket.pipe(socket);

    socket.on("error", (error) => {
      logger.error(new UserError(`Error on socket: ${error.message}`));
      connection.errorMessage = error.message;
      connection.receiving = false;
      this.composeApplication.broadcastState();
    });

    clientSocket.on("error", (error) => {
      logger.error(new Error(`Error on clientSocket: ${error.message}`));
      connection.errorMessage = error.message;
      connection.sending = false;
      this.composeApplication.broadcastState();
    });

    socket.on("close", () => clientSocket.destroy());
    clientSocket.on("close", () => socket.destroy());

    socket.setTimeout(TCP_TIMEOUT);
    socket.on("timeout", () => socket.destroy());
    clientSocket.setTimeout(TCP_TIMEOUT);
    clientSocket.on("timeout", () => clientSocket.destroy());

    // broadcasting state

    socket.on("data", (buffer) => {
      connection.bytesReceived += buffer.length;
      this.composeApplication.broadcastState();
    });

    socket.on("end", () => {
      connection.receiving = false;
      this.composeApplication.broadcastState();
    });

    clientSocket.on("data", (buffer) => {
      connection.bytesSent += buffer.length;
      this.composeApplication.broadcastState();
    });

    clientSocket.on("end", () => {
      connection.sending = false;
      this.composeApplication.broadcastState();
    });
  }

  async stop() {
    if (this.server) await serverStopAsync(this.server);
    this.composeApplication.broadcastState();
  }
}

module.exports = logger.wrapClass(ComposePortMapping);
