const assert = require("assert");
const createLogger = require("./createLogger.js");
const OidcConfig = require("./OidcConfig.js");

const logger = createLogger("Host");

class Host {
  constructor({ id, hostname, ssl, upstream, oidcConfig }) {
    assert.equal(id.constructor, String);
    assert.equal(hostname.constructor, String);
    assert.equal(ssl.constructor, Boolean);
    assert.equal(upstream.constructor, String);
    if (oidcConfig) assert.equal(oidcConfig.constructor, OidcConfig);

    assert(
      hostname.match(
        /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/
      ),
      `Not a valid hostname: ${hostname}`
    );
    assert(
      upstream.match(
        /https?:\/\/[-a-zA-Z0-9@:%._+~#=]{2,256}([-a-zA-Z0-9@:%_+.~#?&//=]*)/
      ),
      `Not a valid upsteam: ${upstream}`
    );

    Object.assign(this, { id, hostname, ssl, upstream, oidcConfig });
  }

  protocol() {
    return this.ssl ? "https:" : "http:";
  }

  origin() {
    return `${this.protocol()}//${this.hostname}`;
  }
}

module.exports = logger.wrapClass(Host);
