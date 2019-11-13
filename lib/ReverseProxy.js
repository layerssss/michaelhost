const httpProxy = require("http-proxy");
const moment = require("moment");
const uuid = require("uuid");
const Cookie = require("cookie");
const QueryString = require("query-string");
const Url = require("url");
const _ = require("lodash");

const createLogger = require("./createLogger.js");
const OidcClient = require("./OidcClient.js");
const UserError = require("./UserError.js");

const logger = createLogger("ReverseProxy");

const sessionTimeout = 3600;

class ReverseProxy {
  static async init({ state }) {
    const reverseProxy = new ReverseProxy();

    Object.assign(reverseProxy, {
      state,
      sessions: [],
      proxy: new httpProxy.createProxyServer(),
    });

    return reverseProxy;
  }

  async proxyRequest({ request, response, host }) {
    // TODO
    delete request.headers["accept-encoding"];

    await new Promise((resolve, reject) => {
      response.on("close", resolve);

      this.proxy.web(
        request,
        response,
        {
          target: host.upstream,
          xfwd: !host.changeOrigin,
          changeOrigin: host.changeOrigin,
        },
        error => reject(new UserError(`Proxy Error: ${error.message}`)),
      );
    });
  }

  async proxyUpgrade({ request, socket, head, host }) {
    await new Promise((resolve, reject) => {
      socket.on("close", resolve);
      this.proxy.ws(
        request,
        socket,
        head,
        {
          target: host.upstream,
          xfwd: !host.changeOrigin,
          changeOrigin: host.changeOrigin,
        },
        error => reject(new UserError(`Proxy Error: ${error.message}`)),
      );
    });
  }

  handleRequest({ request, response, ssl }) {
    Promise.resolve()
      .then(async () => {
        const { method, url, headers } = request;
        const { host: hostname = "", accept = "" } = headers;

        logger.info({
          hostname,
          method,
          url,
          accept,
        });

        const host = this.state.hosts.find(
          h => h.enabled && h.hostname === hostname,
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
            !session.emails.find(e => host.oidcConfig.allowEmails.includes(e))
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

        await this.proxyRequest({ request, response, host });
      })
      .catch(error => {
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
        const tokenSet = await oidcClient.authorizationCallback(
          callbackUrl,
          query,
          {
            state: authState.id,
          },
        );
        session.emails = [tokenSet.claims.email];
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
      ["Cache-Control"]: "private, max-age=0",
      ["Location"]: redirectUrl,
      ["Content-Type"]: "text/html",
    });
    response.end(`<script>location.href="${redirectUrl}";</script>`);
  }

  getSession({ request, response }) {
    const cookies = Cookie.parse(request.headers.cookie || "");
    let session = this.sessions.find(
      s => s.sessionId === cookies.michaelhostsid,
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
        expires: moment()
          .add(sessionTimeout, "seconds")
          .toDate(),
        secure: true,
        maxAge: moment.duration(sessionTimeout, "seconds").asSeconds(),
      }),
    ]);
  }

  handleUpgrade({ request, socket, head, ssl }) {
    Promise.resolve()
      .then(async () => {
        logger.info({
          method: request.method,
          url: request.url,
          headers: request.headers,
        });

        const hostname = request.headers.host;
        const host = this.state.hosts.find(
          h => !h.redirect && h.enabled && h.hostname === hostname,
        );
        if (!host) throw new UserError(`${hostname} not found.`);

        if (host.ssl !== ssl)
          throw new UserError(`Please use: ${host.origin}/`);

        if (host.oidcConfig) {
          const session = this.getSession({ request });
          if (!session) throw new UserError("Not Authenticated");
          if (
            !session.emails.find(e => host.oidcConfig.allowEmails.includes(e))
          )
            throw new UserError("Not Authorized");
        }

        await this.proxyUpgrade({
          request,
          socket,
          head,
          host,
        });
      })
      .catch(error => {
        logger.error(error);
        socket.end();
      });
  }
}

module.exports = logger.wrapClass(ReverseProxy);
