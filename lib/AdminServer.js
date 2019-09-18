const http = require("http");
const httpProxy = require("http-proxy");
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

    const proxy = new httpProxy.createProxyServer({ xfwd: true });
    proxy.on("error", error => logger.error(error));

    app.use("/api/mounted_apps/:mountedAppId(\\w{8})", (req, res, next) => {
      const mountedApp = state.mountedApps.find(
        a => a.id === req.params.mountedAppId,
      );

      if (!mountedApp) return next();

      proxy.web(req, res, {
        target: mountedApp.upstream,
      });
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
    adminServer.setTimeout(0);
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

          const mountedAppPathMatch = url.match(
            /\/api\/mounted_apps\/([\w]{8})\//,
          );
          if (mountedAppPathMatch) {
            const mountedAppId = mountedAppPathMatch[1];
            const mountedApp = state.mountedApps.find(
              t => t.id === mountedAppId,
            );
            if (!mountedApp)
              throw new Error(`Cannot find MountedApp#${mountedAppId}`);
            request.url = request.url.slice(mountedAppPathMatch[0].length - 1);

            return proxy.ws(request, socket, head, {
              target: mountedApp.upstream,
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
