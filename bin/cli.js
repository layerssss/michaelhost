const commander = require("commander");

const Server = require("../lib/Server.js");

Promise.resolve()
  .then(async () => {
    const { port, email, bind } = commander
      .version(require("../package.json").version)
      .option(
        "-p --port [integer]",
        "admin interface http port on localhost",
        (i, d) => parseInt(i || d, 10),
        3000
      )
      .option("-e --email [string]", "email", process.env["EMAIL"])
      .parse(process.argv);

    const server = new Server();

    process.on("SIGINT", () => server.stop());

    await server.start({ port, email, bind });
  })
  .then(() => process.exit(0))
  .catch(ex => {
    console.error("Critical error.");
    console.error(ex.stack || ex.message);
    process.exit(1);
  });
