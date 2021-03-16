const moment = require("moment");
const uuid = require("uuid");
const Cookie = require("cookie");
const QueryString = require("query-string");
const Url = require("url");
const _ = require("lodash");

const createLogger = require("./createLogger.js");
const OidcClient = require("./OidcClient.js");
const UserError = require("./UserError.js");
const ProxyCore = require("./ProxyCore.js");

const logger = createLogger("ReverseProxy");

const sessionTimeout = 3600;

class ReverseProxy {
  static async init({ state }) {
    const reverseProxy = new ReverseProxy();

    Object.assign(reverseProxy, {
      state,
      sessions: [],
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

        if (host.ssl !== ssl)
          return this.redirect({
            redirectUrl: `${host.origin}${url}`,
            response,
          });

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
          const session = this.getSession({ request, response });
          if (!session.emails)
            return await this.handleUnauthenticated({
              response,
              accept,
              host,
              url,
              session,
            });

          if (
            !session.emails.find((e) => host.oidcConfig.allowEmails.includes(e))
          ) {
            response.writeHead(403);
            throw new UserError("Not Authorized");
          }

          if (url.startsWith("/callback")) {
            const redirectUrl = session.authState
              ? session.authState.redirectUrl
              : "/";

            if (!redirectUrl.startsWith("/callback"))
              return this.redirect({
                response,
                redirectUrl,
              });
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

  async handleUnauthenticated({ response, accept, host, url, session }) {
    if (accept.match(/text\/html/)) {
      const callbackUrl = `${host.origin}/callback`;

      const { pathname, search } = Url.parse(url);
      const query = QueryString.parse(search);

      const oidcClient = await OidcClient.get({
        discoveryUrl: host.oidcConfig.discoveryUrl,
        clientId: host.oidcConfig.clientId,
        clientSecret: host.oidcConfig.clientSecret,
      });

      if (pathname === "/callback" && session.authState) {
        const { authState } = session;
        const tokenSet = await oidcClient.callback(callbackUrl, query, {
          state: authState.id,
        });

        session.emails = [tokenSet.claims().email];
        delete session.authState;

        return this.redirect({
          response,
          redirectUrl: authState.redirectUrl,
        });
      } else {
        const authState = session.authState || {
          id: uuid.v4(),
          redirectUrl: url,
        };
        session.authState = authState;

        return this.redirect({
          response,
          redirectUrl: oidcClient.authorizationUrl({
            redirect_uri: callbackUrl,
            scope: "openid email",
            state: authState.id,
          }),
        });
      }
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

  getSession({ request, response }) {
    const cookies = Cookie.parse(request.headers.cookie || "");
    let session = this.sessions.find(
      (s) => s.sessionId === cookies.michaelhostsid,
    );

    if (!session) {
      if (!response) return null;

      session = {
        sessionId: uuid.v4(),
        createdAt: 0,
      };

      this.sessions.push(session);
    }

    if (response) this.refreshSession({ response, session });

    return session;
  }

  refreshSession({ response, session }) {
    const isSessionTimeout = moment(session.createdAt).isBefore(
      moment().subtract(0.5 * sessionTimeout, "seconds"),
    );
    if (!isSessionTimeout) return;

    if (session.timer) clearTimeout(session.timer);

    session.createdAt = new Date();

    session.timer = setTimeout(
      () => _.remove(this.sessions, session),
      moment.duration(sessionTimeout, "seconds").asMilliseconds(),
    );

    response.setHeader("Set-Cookie", [
      Cookie.serialize("michaelhostsid", session.sessionId, {
        expires: moment().add(sessionTimeout, "seconds").toDate(),
        secure: true,
        maxAge: moment.duration(sessionTimeout, "seconds").asSeconds(),
        httpOnly: false,
        path: "/",
        sameSite: false,
      }),
    ]);
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

        if (host.ssl !== ssl)
          throw new UserError(`Please use: ${host.origin}/`);

        if (!host.allowIp(ip)) throw new UserError("Not Authorized");

        if (host.oidcConfig) {
          const session = this.getSession({ request });
          if (!session || !session.emails)
            throw new UserError("Not Authenticated");
          if (
            !session.emails.find((e) => host.oidcConfig.allowEmails.includes(e))
          )
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
