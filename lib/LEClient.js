const ACME = require("@root/acme");
const PEM = require("@root/pem");
const CSR = require("@root/csr");
const Keypairs = require("@root/keypairs");
const tls = require("tls");
const { pki } = require("node-forge");

const Lock = require("./Lock.js");
const pkg = require("../package.json");
const UserError = require("./UserError.js");
const createLogger = require("./createLogger.js");

const logger = createLogger("LEClient");

class LEClient {
  static async init({ state, email }) {
    const leClient = new LEClient();
    const acme = ACME.create({
      maintainerEmail: "me@micy.in",
      subscriberEmail: email,
      packageAgent: `${pkg.name}/${pkg.version}`,
      notify: (level, message) =>
        logger[
          {
            warning: "warn",
            error: "error",
          }[level] || "debug"
        ](message),
      skipChallengeTest: true,
      skipDryRun: true,
    });

    if (process.env.NODE_ENV === "production")
      await acme.init("https://acme-v02.api.letsencrypt.org/directory");
    else
      await acme.init("https://acme-staging-v02.api.letsencrypt.org/directory");

    Object.assign(leClient, {
      state,
      acme,
      challenges: [],
      keyPems: [],
      keyLock: new Lock(),
    });

    return leClient;
  }

  async handleSNICallback({ domain }) {
    const host = this.state.hosts.find((h) => h.hostname === domain && h.ssl);
    if (!host) throw new UserError(`Cannot find host: ${domain}`);

    const domainKeyPem = await this.getDomainKey({ domain, pem: true });
    const domainCert = await this.getDomainCert({ domain });

    const secureContext = tls.createSecureContext({
      key: domainKeyPem,
      cert: domainCert,
    });

    return secureContext;
  }

  async getDomainCert({ domain }) {
    let domainCert = this.state.pems[`${domain}.domain.cert`];
    if (domainCert) {
      const cert = pki.certificateFromPem(domainCert);
      // renew in 7 days advance
      if (Number(cert.validity.notAfter) > Date.now() + 3600 * 1000 * 24 * 7)
        return domainCert;
    }

    const domainKey = await this.getDomainKey({ domain });
    const account = await this.getAccount();
    const accountKey = await this.getAccountKey();

    const csr = PEM.packBlock({
      type: "CERTIFICATE REQUEST",
      bytes: await CSR.csr({
        jwk: domainKey,
        domains: [domain],
        encoding: "der",
      }),
    });

    const domainPems = await this.acme.certificates.create({
      account,
      accountKey,
      csr,
      domains: [domain],
      challenges: {
        "http-01": {
          // Should make the token url return the key authorization
          set: async ({ challenge }) => {
            const { keyAuthorization, challengeUrl } = challenge;
            this.challenges[challengeUrl] = keyAuthorization;
          },

          // Should remove the previously set token file (just the one)
          remove: async ({ challenge }) => {
            const { challengeUrl } = challenge;
            delete this.challenges[challengeUrl];
          },

          // Should get the token file via the hosting service API
          get: async ({ challenge }) => {
            const { challengeUrl } = challenge;
            return this.challenges[challengeUrl];
          },
        },
      },
    });

    domainCert = domainPems.cert + domainPems.chain;
    this.state.pems[`${domain}.domain.cert`] = domainCert;

    await this.state.save();
    return domainCert;
  }

  async getAccount() {
    if (!this.account) {
      const accountKey = await this.getAccountKey();
      this.account = await this.acme.accounts.create({
        subscriberEmail: this.email,
        agreeToTerms: true,
        accountKey,
      });
    }
    return this.account;
  }

  async getDomainKey({ domain, pem = false }) {
    return await this[pem ? "getKeyPem" : "getKey"]({
      name: `${domain}.domain`,
      options: {
        kty: "RSA",
        format: "jwk",
      },
    });
  }

  async getAccountKey() {
    return await this.getKey({
      name: `account`,
      options: {
        kty: "EC",
        format: "jwk",
      },
    });
  }

  // get or generate key pair, return public key
  async getKey({ name, options }) {
    return this.keyLock.run(async () => {
      const keyPem = this.state.pems[`${name}.key`];
      if (keyPem) return await Keypairs.import({ pem: keyPem });

      const keypair = await Keypairs.generate(options);
      const key = keypair.private;
      this.state.pems[`${name}.key`] = await Keypairs.export({ jwk: key });
      await this.state.save();

      return key;
    });
  }

  async getKeyPem({ name, options }) {
    let keyPem = this.keyPems[name];
    if (keyPem) return keyPem;
    const key = await this.getKey({ name, options });
    keyPem = await Keypairs.export({ jwk: key });
    this.keyPems[name] = keyPem;
    return keyPem;
  }
}

module.exports = logger.wrapClass(LEClient);
