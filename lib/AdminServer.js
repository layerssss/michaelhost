const http = require("http");
const ws = require("ws");
const Path = require("path");
const express = require("express");
const { ApolloServer } = require("apollo-server-express");

const typeDefs = require("./typeDefs.js");
const resolvers = require("./resolvers.js");
const createLogger = require("./createLogger.js");

const logger = createLogger("AdminServer");

class AdminServer {
  static async init({ state }) {
    const app = express();
    app.use(express.static(Path.join(__dirname, "../build")));

    app.use((req, res, next) => {
      const { method, url } = req;
      logger.info(`${method} ${url}`);
      next();
    });

    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      formatError: error => {
        logger.error(error.extensions.exception.stacktrace.join("\n"));
        return error;
      },
      context: ({ req }) => {
        return { state };
      },
    });

    apolloServer.applyMiddleware({ app });

    const wsServer = new ws.Server({
      noServer: true,
    });

    const adminServer = http.createServer(app);
    adminServer.on("upgrade", (request, socket, head) =>
      Promise.resolve()
        .then(async () => {
          const { url } = request;
          const terminalPathMatch = url.match(/\/api\/terminals\/([\w]{8})/);
          if (terminalPathMatch) {
            const terminalId = terminalPathMatch[1];
            const terminal = state.terminals.find(t => t.id === terminalId);
            if (!terminal)
              throw new Error(`Cannot find terminal#${terminalId}`);
            const webSocket = await new Promise(resolve =>
              wsServer.handleUpgrade(request, socket, head, resolve),
            );
            return terminal.handleWebSocket({ webSocket });
          }
          throw new Error(`No ws handlers at ${url}`);
        })
        .catch(error => {
          socket.end();
          logger.error(error);
        }),
    );

    return adminServer;
  }
}

module.exports = logger.wrapClass(AdminServer);
