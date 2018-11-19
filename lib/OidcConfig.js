const assert = require("assert");
const uuid = require("uuid");
const createLogger = require("./createLogger.js");

const logger = createLogger("OidcConfig");

class OidcConfig {
  constructor({
    id = uuid.v4(),
    discoveryUrl = "",
    clientId = "",
    clientSecret = "",
    allowEmails = [],
  }) {
    assert(
      discoveryUrl.match(
        /https:\/\/[-a-zA-Z0-9@:%._+~#=]{2,256}([-a-zA-Z0-9@:%_+.~#?&//=]*)/,
      ),
      `Not a valid discoveryUrl: ${discoveryUrl}`,
    );

    Object.assign(this, {
      id,
      discoveryUrl,
      clientId,
      clientSecret,
      allowEmails,
    });
  }
}

module.exports = logger.wrapClass(OidcConfig);
