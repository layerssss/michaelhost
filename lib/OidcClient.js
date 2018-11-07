const { Issuer } = require("openid-client");

const createLogger = require("./createLogger.js");

const logger = createLogger("OidcClient");

const clientEntries = [];

class OidcClient {
  static async get({ discoveryUrl, clientSecret, clientId }) {
    const clientEntry = clientEntries.find(
      c =>
        c.discoveryUrl === discoveryUrl &&
        c.clientId === clientId &&
        c.clientSecret === clientSecret
    );

    if (clientEntry) return clientEntry.client;

    const issuer = await Issuer.discover(discoveryUrl);

    const client = new issuer.Client({
      client_id: clientId,
      client_secret: clientSecret
    });

    clientEntries.push({
      discoveryUrl,
      clientId,
      clientEntry,
      client
    });

    return client;
  }
}

module.exports = logger.wrapClass(OidcClient);
