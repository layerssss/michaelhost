const serverListenAsync = (server, ...args) =>
  new Promise((resolve, reject) => {
    server.listen(...args);
    server.on("listening", () => {
      resolve(server.address());
    });
    server.on("error", reject);
  });

module.exports = serverListenAsync;
