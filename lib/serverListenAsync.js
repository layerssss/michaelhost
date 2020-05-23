const _ = require("lodash");

const serverListenAsync = async (server, ...args) => {
  const sockets = [];
  server.destroySockets = () => {
    for (const socket of sockets) socket.destroy(new Error("Socket destroyed"));
  };

  server.on("connection", (socket) => {
    sockets.push(socket);
    socket.on("close", () => _.remove(sockets, socket));
  });

  await new Promise((resolve, reject) => {
    server.listen(...args);
    server.on("listening", () => {
      resolve(server.address());
    });
    server.on("error", reject);
  });
};

module.exports = serverListenAsync;
