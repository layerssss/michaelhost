const http = require("http");
const Path = require("path");
const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@as-integrations/express5");
const {
  ApolloServerPluginDrainHttpServer,
} = require("@apollo/server/plugin/drainHttpServer");

const handleWebSocket = require("./handleWebSocket.js");
const UserError = require("./UserError");
const typeDefs = require("./typeDefs.js");
const resolvers = require("./resolvers.js");
const createLogger = require("./createLogger.js");

const logger = createLogger("AdminServer");

class AdminServer {
  static async init({ state }) {
    const app = express();

    app.use((req, res, next) => {
      const { method, url } = req;
      logger.info(`${method} ${url}`);
      next();
    });

    app.use(express.static(Path.join(__dirname, "../admin_ui/build")));
    app.use((request, response, next) => {
      const acceptHeader = request.headers.accept || "";
      if (acceptHeader.startsWith("text/html"))
        return response.sendFile(
          Path.join(__dirname, "../admin_ui/build/index.html"),
        );
      next();
    });

    const adminServer = http.createServer(app);
    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer: adminServer })],
      debug: true,
      formatError: (error) => {
        const stacktrace =
          error.extensions?.exception?.stacktrace ||
          error.extensions?.stacktrace;
        logger.error(stacktrace ? stacktrace.join("\n") : error);
        return error;
      },
    });

    await apolloServer.start();
    app.use(
      "/graphql",
      express.json(),
      expressMiddleware(apolloServer, {
        context: async ({ req }) => {
          return { state };
        },
      }),
    );

    adminServer.on("upgrade", (request, socket, head) =>
      Promise.resolve()
        .then(async () => {
          const { url } = request;
          const terminalPathMatch = url.match(/\/api\/terminals\/([\w]{8})/);
          if (terminalPathMatch) {
            const terminalId = terminalPathMatch[1];
            const terminal = state.terminals.find((t) => t.id === terminalId);
            if (!terminal)
              throw new UserError(`Cannot find terminal#${terminalId}`);

            return await handleWebSocket({
              request,
              socket,
              head,
              handler: terminal,
            });
          }

          if (url === "/api/log") {
            return await handleWebSocket({
              request,
              socket,
              head,
              handler: {
                sessions: [],
                handleWebSocketConnect: ({ webSocket, session }) => {
                  const callback = (dataString) =>
                    webSocket.send(
                      JSON.stringify({
                        output: dataString.replace(/\n/g, "\r\n"),
                      }),
                      (error) => null,
                    );
                  createLogger.infoState.callbacks.push(callback);
                  callback(createLogger.infoState.history);
                  session.callback = callback;
                },
                handleWebSocketClose: ({ session }) => {
                  createLogger.infoState.callbacks =
                    createLogger.infoState.callbacks.filter(
                      (c) => c !== session.callback,
                    );
                },
                handleWebSocketMessage: () => {},
              },
            });
          }

          if (url === "/api/state") {
            return await handleWebSocket({
              request,
              socket,
              head,
              handler: state,
            });
          }

          throw new UserError(`No ws handlers at ${url}`);
        })
        .catch((error) => {
          socket.end();
          logger.error(error);
        }),
    );

    return adminServer;
  }
}

module.exports = logger.wrapClass(AdminServer);
