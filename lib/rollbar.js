const Rollbar = require("rollbar");
const path = require("path");
const fs = require("fs");

const rollbarEnabled =
  !!process.env.ROLLBAR_ACCESS_TOKEN && process.env.NODE_ENV === "production";
const revisionPath = path.join(__dirname, "../REVISION");
const revision = fs.existsSync(revisionPath)
  ? fs.readFileSync(revisionPath, "utf8")
  : null;

const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  enabled: rollbarEnabled,
  codeVersion: revision,
  payload: {
    michaelhostVersion: require("../package.json").version,
  },
});

module.exports = rollbar;
