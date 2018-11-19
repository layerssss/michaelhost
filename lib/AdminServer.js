const http = require("http");
const httpProxy = require("http-proxy");
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

    app.use((req, res, next) => {
      const { method, url } = req;
      logger.info(`${method} ${url}`);
      next();
    });

    const proxy = new httpProxy.createProxyServer();
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

          if (url === "/api/info") {
            const webSocket = await new Promise(resolve =>
              wsServer.handleUpgrade(request, socket, head, resolve),
            );
            const callback = dataString =>
              webSocket.send(dataString.replace(/\n/g, "\r\n"), error => null);
            callback(createLogger.infoState.history);
            createLogger.infoState.callbacks.push(callback);
            webSocket.on("close", () => {
              createLogger.infoState.callbacks = createLogger.infoState.callbacks.filter(
                c => c !== callback,
              );
            });
            return;
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
