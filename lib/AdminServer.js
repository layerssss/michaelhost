const http = require("http");
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
      }
    });

    apolloServer.applyMiddleware({ app });

    const adminServer = http.createServer(app);

    return adminServer;
  }
}

module.exports = logger.wrapClass(AdminServer);
