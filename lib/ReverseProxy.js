const moment = require("moment");
const assert = require("assert");
const jwt = require("jsonwebtoken");
const Cookie = require("cookie");
const Url = require("url");

const createLogger = require("./createLogger.js");
const OidcClient = require("./OidcClient.js");
const UserError = require("./UserError.js");
const ProxyCore = require("./ProxyCore.js");

const logger = createLogger("ReverseProxy");

const TOKEN_TIMEOUT = 3600 * 24 * 30;

class ReverseProxy {
  static async init({ state }) {
    const reverseProxy = new ReverseProxy();

    Object.assign(reverseProxy, {
      state,
      proxyCore: new ProxyCore(),
    });

    return reverseProxy;
  }

  async proxyRequest({ request, response, host, ssl }) {
    const { changeOrigin, upstream } = host;
    await this.proxyCore.proxyRequest({
      request,
      response,
      upstream,
      changeOrigin,
      ssl,
    });
  }

  async proxyUpgrade({ request, socket, head, host, ssl }) {
    const { changeOrigin, upstream } = host;
    await this.proxyCore.proxyUpgrade({
      request,
      socket,
      head,
      upstream,
      changeOrigin,
      ssl,
    });
  }

  handleRequest({ request, response, ssl }) {
    Promise.resolve()
      .then(async () => {
        const { method, url, headers } = request;
        const ip = request.connection.remoteAddress;
        const { accept = "" } = headers;
        // remove port spec
        const hostname = (headers.host || "").replace(/:.*$/, "");

        logger.info({
          hostname,
          method,
          url,
          accept,
          ip,
        });

        const host = this.state.hosts.find(
          (h) => h.enabled && h.hostname === hostname,
        );
        if (!host) throw new UserError(`${hostname} not found.`);

        if (host.ssl && !host.plain && !ssl) {
          const { path } = Url.parse(url);
          return this.redirect({
            redirectUrl: `https://${host.hostname}${path}`,
            response,
          });
        }

        if (host.redirect)
          return this.redirect({
            redirectUrl: `${host.upstream}/`,
            response,
          });

        if (!host.allowIp(ip)) {
          response.writeHead(403);
          throw new UserError("Not Authorized");
        }

        if (host.oidcConfig) {
          const email = this.getEmail({ request });

          if (!email)
            return await this.handleUnauthenticated({
              response,
              accept,
              host,
              url,
            });
          {
            // check redundant callbacks
            const { pathname, query } = Url.parse(url, true);
            if (
              pathname === "/michaelhost_callback" &&
              query.state === "MICHAELHOST"
            ) {
              const redirectUrl = query.redirect || "/";
              return this.redirect({
                response,
                redirectUrl,
              });
            }
          }

          if (!host.oidcConfig.allowEmails.includes(email)) {
            response.writeHead(403);
            throw new UserError("Not Authorized");
          }
        }

        await this.proxyRequest({ request, response, host, ssl });
      })
      .catch((error) => {
        logger.error(error);
        if (!response.headersSent) response.writeHead(502);
        response.end(error.message);
      });
  }

  async handleUnauthenticated({ response, accept, host, url }) {
    if (accept.match(/text\/html/)) {
      let callbackUrl = `${host.origin}/michaelhost_callback`;

      if (url !== "/")
        callbackUrl = `${callbackUrl}?redirect=${encodeURIComponent(url)}`;

      const { pathname, query } = Url.parse(url, true);

      const oidcClient = await OidcClient.get({
        discoveryUrl: host.oidcConfig.discoveryUrl,
        clientId: host.oidcConfig.clientId,
        clientSecret: host.oidcConfig.clientSecret,
      });

      if (
        pathname !== "/michaelhost_callback" ||
        !query.code ||
        query.state !== "MICHAELHOST"
      )
        return this.redirect({
          response,
          redirectUrl: oidcClient.authorizationUrl({
            redirect_uri: callbackUrl,
            scope: "openid email",
            state: "MICHAELHOST",
          }),
        });

      const tokenSet = await oidcClient.callback(callbackUrl, query, {
        state: "MICHAELHOST",
      });

      response.setHeader("Set-Cookie", [
        Cookie.serialize(
          "michaelhost_token",
          jwt.sign(
            {
              sub: tokenSet.claims().email,
            },
            this.state.secret,
            { expiresIn: TOKEN_TIMEOUT * 1000 },
          ),
          {
            expires: moment().add(TOKEN_TIMEOUT, "seconds").toDate(),
            secure: true,
            maxAge: moment.duration(TOKEN_TIMEOUT, "seconds").asSeconds(),
            httpOnly: false,
            path: "/",
            sameSite: false,
          },
        ),
      ]);

      const redirectUrl = query.redirect || "/";

      return this.redirect({
        response,
        redirectUrl,
      });
    }
    throw new UserError("Authentication Needed");
  }

  redirect({ response, redirectUrl }) {
    response.writeHead(302, {
      "Cache-Control": "private, max-age=0",
      Location: redirectUrl,
      "Content-Type": "text/html",
    });
    response.end(`<script>location.href="${redirectUrl}";</script>`);
  }

  getEmail({ request }) {
    assert(this.state.secret);
    const cookies = Cookie.parse(request.headers.cookie || "");
    const token = cookies["michaelhost_token"];
    if (!token) return;
    try {
      const payload = jwt.verify(token, this.state.secret);
      return payload.sub;
    } catch (error) {
      logger.debug(error);
    }
  }

  handleUpgrade({ request, socket, head, ssl }) {
    Promise.resolve()
      .then(async () => {
        const ip = request.connection.remoteAddress;
        logger.info({
          method: request.method,
          url: request.url,
          ip,
          headers: request.headers,
        });

        const hostname = request.headers.host;
        const host = this.state.hosts.find(
          (h) => !h.redirect && h.enabled && h.hostname === hostname,
        );
        if (!host) throw new UserError(`${hostname} not found.`);

        if (host.ssl && !host.plain && !ssl)
          throw new UserError(`Please use: ${host.origin}/`);

        if (!host.allowIp(ip)) throw new UserError("Not Authorized");

        if (host.oidcConfig) {
          const email = this.getEmail({ request });
          if (!email) throw new UserError("Not Authenticated");
          if (!host.oidcConfig.allowEmails.includes(email))
            throw new UserError("Not Authorized");
        }

        await this.proxyUpgrade({
          request,
          socket,
          head,
          host,
          ssl,
        });
      })
      .catch((error) => {
        logger.error(error);
        socket.end();
      });
  }
}

module.exports = logger.wrapClass(ReverseProxy);
