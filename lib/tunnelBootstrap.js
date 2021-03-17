const globalAgent = require("global-agent");
const globalTunnel = require("global-tunnel-ng");

const MAJOR_NODEJS_VERSION = parseInt(
  process.version.slice(1).split(".")[0],
  10,
);

if (MAJOR_NODEJS_VERSION >= 10) {
  // `global-agent` works with Node.js v10 and above.
  for (const [env, gaEnv] of [
    ["http_proxy", "GLOBAL_AGENT_HTTP_PROXY"],
    ["https_proxy", "GLOBAL_AGENT_HTTPS_PROXY"],
    ["no_proxy", "GLOBAL_AGENT_NO_PROXY"],
  ]) {
    if (process.env[env]) {
      process.env[gaEnv] = process.env[env];
      process.env[env] = "";
    }
  }

  globalAgent.bootstrap();
} else {
  // `global-tunnel-ng` works only with Node.js v10 and below.
  globalTunnel.initialize();
}
