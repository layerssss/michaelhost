const http = require("http");
const Path = require("path");
const express = require("express");
const { ApolloServer } = require("apollo-server-express");

const handleWebSocket = require("./handleWebSocket.js");
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

    app.use(express.static(Path.join(__dirname, "../build")));
    app.use((request, response, next) => {
      const acceptHeader = request.headers.accept || "";
      if (acceptHeader.startsWith("text/html"))
        return response.sendfile(Path.join(__dirname, "../build/index.html"));
      next();
    });

    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      debug: true,
      formatError: error => {
        logger.error(error.extensions.exception.stacktrace.join("\n"));
        return error;
      },
      context: ({ req }) => {
        return { state };
      },
    });

    apolloServer.applyMiddleware({ app });

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
                  const callback = dataString =>
                    webSocket.send(
                      dataString.replace(/\n/g, "\r\n"),
                      error => null,
                    );
                  createLogger.infoState.callbacks.push(callback);
                  callback(createLogger.infoState.history);
                  session.callback = callback;
                },
                handleWebSocketClose: ({ session }) => {
                  createLogger.infoState.callbacks = createLogger.infoState.callbacks.filter(
                    c => c !== session.callback,
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

          const composeApplicationPathMatch = url.match(
            /\/api\/compose_applications\/([\w]{8})/,
          );
          if (composeApplicationPathMatch) {
            const composeApplicationId = composeApplicationPathMatch[1];
            const composeApplication = state.composeApplications.find(
              t => t.id === composeApplicationId,
            );
            if (!composeApplication)
              throw new Error(
                `Cannot find ComposeApplication#${composeApplication}`,
              );

            return await handleWebSocket({
              request,
              socket,
              head,
              handler: composeApplication,
            });
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
