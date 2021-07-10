const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = (app) => {
  app.use(
    createProxyMiddleware("/graphql", {
      target: "http://localhost:2002",
    }),
  );
  app.use(
    createProxyMiddleware("/api", {
      target: "http://localhost:2002",
      ws: true,
    }),
  );
};
