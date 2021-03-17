const globalAgent = require("global-agent");
const globalTunnel = require("global-tunnel-ng");

const MAJOR_NODEJS_VERSION = parseInt(
  process.version.slice(1).split(".")[0],
  10,
);

if (MAJOR_NODEJS_VERSION >= 10) {
  // `global-agent` works with Node.js v10 and above.
  if (process.env.http_proxy) {
    process.env.GLOBAL_AGENT_HTTP_PROXY = process.env.http_proxy;
    process.env.http_proxy = "";
  }

  if (process.env.https_proxy) {
    process.env.GLOBAL_AGENT_HTTPS_PROXY = process.env.https_proxy;
    process.env.https_proxy = "";
  }

  globalAgent.bootstrap();
} else {
  // `global-tunnel-ng` works only with Node.js v10 and below.
  globalTunnel.initialize();
}
