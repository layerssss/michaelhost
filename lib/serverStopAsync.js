const serverStopAsync = async (server) => {
  if (server.destroySockets) server.destroySockets();

  await new Promise((resolve, reject) =>
    server.close((error) => {
      if (error) return reject(error);
      resolve();
    }),
  );
};

module.exports = serverStopAsync;
