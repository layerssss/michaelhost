const assert = require("assert");
const createLogger = require("./createLogger.js");

const logger = createLogger("OidcConfig");

class OidcConfig {
  constructor({ id, discoveryUrl, clientId, clientSecret, allowEmails }) {
    assert.equal(id.constructor, String);
    assert.equal(discoveryUrl.constructor, String);
    assert.equal(clientId.constructor, String);
    assert.equal(clientSecret.constructor, String);
    assert.equal(allowEmails.constructor, Array);

    assert(
      discoveryUrl.match(
        /https:\/\/[-a-zA-Z0-9@:%._+~#=]{2,256}([-a-zA-Z0-9@:%_+.~#?&//=]*)/
      ),
      `Not a valid discoveryUrl: ${discoveryUrl}`
    );

    Object.assign(this, {
      id,
      discoveryUrl,
      clientId,
      clientSecret,
      allowEmails
    });
  }
}

module.exports = logger.wrapClass(OidcConfig);
