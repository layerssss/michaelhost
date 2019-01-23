const serverStopAsync = server =>
  new Promise((resolve, reject) =>
    server.close(error => {
      if (error) return reject(error);
      resolve();
    }),
  );

module.exports = serverStopAsync;
