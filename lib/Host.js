const assert = require("assert");
const uuid = require("uuid");
const IP = require("ip");
const createLogger = require("./createLogger.js");

const logger = createLogger("Host");

class Host {
  constructor({
    id = uuid.v4().slice(0, 8),
    hostname = "localhost",
    ssl = true,
    plain = !ssl,
    upstream = "",
    oidcConfig = null,
    enabled = true,
    redirect = false,
    changeOrigin = false,
    whitelistIps = "",
  }) {
    assert(id.match(/^\w{8}$/), "Invalid ID");
    assert(hostname, "hostname is required");
    assert(upstream, "upstream is required");

    Object.assign(this, {
      id,
      hostname,
      ssl,
      plain,
      upstream,
      oidcConfig,
      enabled,
      redirect,
      changeOrigin,
      whitelistIps,
    });
  }

  get protocol() {
    return this.ssl ? "https:" : "http:";
  }

  get origin() {
    return `${this.protocol}//${this.hostname}`;
  }

  set whitelistIps(value) {
    this.whitelistSubnets = value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s)
      .map((s) => [s, IP.cidrSubnet(s)]);
  }

  get whitelistIps() {
    return this.whitelistSubnets.map((s) => s[0]).join(",");
  }

  allowIp(ip) {
    {
      //
      // https://stackoverflow.com/questions/31100703/stripping-ffff-prefix-from-request-connection-remoteaddress-nodejs
      //
      const ips = ip.split(":");
      const ipsLast = ips[ips.length - 1];
      if (IP.isV4Format(ipsLast)) ip = ipsLast;
    }
    if (!this.whitelistSubnets.length) return true;
    for (const subnet of this.whitelistSubnets) {
      try {
        if (subnet[1].contains(ip)) return true;
      } catch (error) {
        logger.error(error);
        return false;
      }
    }
    return false;
  }
}

module.exports = logger.wrapClass(Host);
