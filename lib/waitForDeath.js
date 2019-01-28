const waitForDeath = () =>
  new Promise((resolve, reject) => {
    process.stdin.resume();
    process.once("uncaughtException", reject);
    process.on("unhandledRejection", reject);
    process.on("SIGINT", resolve);
    process.on("SIGUSR2", resolve);
    process.on("SIGQUIT", resolve);
    process.on("SIGTERM", resolve);
  });

module.exports = waitForDeath;
