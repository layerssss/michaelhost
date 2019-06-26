const Greenlock = require("greenlock");

const createLogger = require("./createLogger.js");

const logger = createLogger("Greenlock");

async function initGreenlock({ state, email }) {
  const greenlock = Greenlock.create({
    version: "draft-12",
    server: "https://acme-v02.api.letsencrypt.org/directory",
    configDir: "~/.config/acme",
    store: require("greenlock-store-fs"),
    email,
    agreeTos: true,
    securityUpdates: true,
    approveDomains: (options, certs, cb) =>
      Promise.resolve()
        .then(async () => {
          logger.info("approveDomains", { options, certs });
          const host = state.hosts.find(h => h.hostname === options.domain);
          if (!host) throw new Error(`Cannot find host: ${options.domain}`);

          return { options, certs };
        })
        .then(result => cb(null, result), error => cb(error)),
  });

  return greenlock;
}

module.exports = logger.wrapMethod(initGreenlock);
