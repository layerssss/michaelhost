const assert = require("assert");
const uuid = require("uuid");
const createLogger = require("./createLogger.js");

const logger = createLogger("Host");

class Host {
  constructor({
    id = uuid.v4().slice(0, 8),
    hostname = "localhost",
    ssl = true,
    upstream = "",
    oidcConfig = null,
    enabled = true,
    redirect = false,
    changeOrigin = false,
  }) {
    assert(id.match(/^\w{8}$/), "Invalid ID");
    assert(
      hostname.match(
        /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/,
      ),
      `Not a valid hostname: ${hostname}`,
    );
    assert(
      upstream.match(
        /https?:\/\/[-a-zA-Z0-9@:%._+~#=]{2,256}([-a-zA-Z0-9@:%_+.~#?&//=]*)/,
      ),
      `Not a valid upsteam: ${upstream}`,
    );

    Object.assign(this, {
      id,
      hostname,
      ssl,
      upstream,
      oidcConfig,
      enabled,
      redirect,
      changeOrigin,
    });
  }

  get protocol() {
    return this.ssl ? "https:" : "http:";
  }

  get origin() {
    return `${this.protocol}//${this.hostname}`;
  }
}

module.exports = logger.wrapClass(Host);
