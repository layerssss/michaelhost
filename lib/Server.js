const http = require("http");
const assert = require("assert");
const _ = require("lodash");

class Server {
  async start({ port, email }) {
    assert(port);

    if (this.started) throw new Error("Server has already started.");
    this.started = true;

    const httpServer = http.createServer();
    httpServer.listen({
      port,
      host: "localhost"
    });

    await new Promise((resolve, reject) => {
      httpServer.on("listening", resolve);
      httpServer.on("error", reject);
    });

    const address = httpServer.address();
    console.log(
      `Admin interface listening on http://${address.address}:${
        address.port
      } (${address.family})`
    );

    httpServer.on("request", (req, res) => {
      res.end("TODO");
    });

    _.assign(this, { httpServer });

    await new Promise(resolve => httpServer.on("close", resolve));
    console.log("stopped.");
  }

  stop() {
    if (!this.started) throw new Error("Server has already started.");
    this.httpServer.close();
  }
}

module.exports = Server;
