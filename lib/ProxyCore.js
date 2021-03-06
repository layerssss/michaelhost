const http = require("http");
const https = require("https");
const tls = require("tls");
const net = require("net");

const createLogger = require("./createLogger.js");

const logger = createLogger("ProxyCore");

class ProxyCore {
  getModules(urlString) {
    const url = new URL(urlString);
    if (url.protocol === "https:") return [https, tls];
    if (url.protocol === "http:") return [http, net];
    throw new Error(`Unsupported protocol ${url.protocol}`);
  }
  async proxyRequest({ request, response, upstream, changeOrigin, ssl }) {
    const upstreamUrl = new URL(upstream);
    const { hostname, port } = upstreamUrl;
    const upstreamRequestOptions = {
      method: request.method,
      host: hostname,
      port,
      path: request.url,
      setHost: false,
      headers: this.transformRequestHeaders(request.headers, {
        changeOrigin,
        upstreamUrl,
        request,
        ssl,
      }),
    };
    logger.info("upstreamRequestOptions", upstreamRequestOptions);
    const upstreamRequest = this.getModules(upstream)[0].request(
      upstreamRequestOptions,
    );

    request.pipe(upstreamRequest);
    request.on("error", () => upstreamRequest.destroy());
    upstreamRequest.on("error", () => {
      if (response.headersSent) {
        request.destroy();
      } else {
        response.writeHead(502, {
          "Content-Type": "text/plain",
        });
        response.end("Bad Gateway");
      }
    });

    upstreamRequest.on("response", (upstreamResponse) => {
      const { statusCode, statusMessage } = upstreamResponse;
      const headers = this.transformResponseHeaders(upstreamResponse.headers, {
        changeOrigin,
        upstreamUrl,
        request,
        ssl,
      });
      logger.info("upstreamResponse", { statusCode, statusMessage, headers });
      response.writeHead(statusCode, statusMessage, headers);
      response.flushHeaders();
      upstreamResponse.pipe(response);
      upstreamResponse.on("error", () => response.destroy());
      response.on("error", () => upstreamResponse.destroy());
    });

    await new Promise((resolve) => {
      upstreamRequest.on("close", resolve);
    });
  }

  async proxyUpgrade({ request, socket, head, upstream, changeOrigin, ssl }) {
    const upstreamUrl = new URL(upstream);
    const upstreamConnectOptions = {
      host: upstreamUrl.hostname,
      port: upstreamUrl.port || (upstreamUrl.protocol === "https:" ? 443 : 80),
      servername: upstreamUrl.hostname,
    };
    const upstreamSocket = this.getModules(upstream)[1].connect(
      upstreamConnectOptions,
    );
    const upsteamHeaders = this.transformRequestHeaders(request.headers, {
      changeOrigin,
      upstreamUrl,
      ssl,
      request,
    });
    const upsteamPath = request.url;
    logger.info("upstreamSocket", {
      upstreamConnectOptions,
      upsteamPath,
      upsteamHeaders,
    });
    socket.unshift(
      Buffer.concat([
        Buffer.from(
          [
            `${request.method} ${upsteamPath} HTTP/${request.httpVersion}`,
            ...Object.entries(upsteamHeaders).map(
              ([name, value]) => `${name}: ${value}`,
            ),
          ].join("\r\n"),
        ),
        Buffer.from("\r\n\r\n"),
        head,
      ]),
    );
    socket.pipe(upstreamSocket).pipe(socket);
    socket.on("error", () => upstreamSocket.destroy());
    upstreamSocket.on("error", () => socket.destroy());

    await new Promise((resolve) => {
      upstreamSocket.on("connect", resolve);
    });
  }

  transformRequestHeaders(
    headers,
    { changeOrigin, upstreamUrl, ssl, request },
  ) {
    const headersTransformed = { ...headers };
    if (changeOrigin) {
      headersTransformed.host = upstreamUrl.host;
    } else {
      // generate xfwd headers
      const origAddr = request.socket.remoteAddress.replace("::ffff:", "");
      const origPort = request.socket.localPort;
      const origProto = ssl ? "https" : "http";
      for (const [suffix, value, append] of [
        ["for", origAddr, true],
        ["port", origPort, false],
        ["proto", origProto, false],
      ]) {
        const name = `x-forwarded-${suffix}`;
        if (headersTransformed[name] && append)
          headersTransformed[name] = `${headersTransformed[name]},${value}`;
        else headersTransformed[name] = value;
      }
    }
    return headersTransformed;
  }

  transformResponseHeaders(headers) {
    return {
      ...headers,
    };
  }
}
module.exports = logger.wrapClass(ProxyCore);
