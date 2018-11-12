const proxy = require("http-proxy-middleware");

module.exports = app => {
  app.use(proxy("/graphql", { target: "http://localhost:4444" }));
  app.use(proxy("/api", { target: "http://localhost:4444", ws: true }));
};
