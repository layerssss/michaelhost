const proxy = require("http-proxy-middleware");

module.exports = app => {
  app.use(proxy("/graphql", { target: "http://localhost:4444" }));
};
