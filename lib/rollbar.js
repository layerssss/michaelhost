const Rollbar = require("rollbar");

const rollbarEnabled =
  !!process.env.ROLLBAR_ACCESS_TOKEN && process.env.NODE_ENV === "production";

const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  enabled: rollbarEnabled,
});

module.exports = rollbar;
