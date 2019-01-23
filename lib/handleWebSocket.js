const _ = require("lodash");
const ws = require("ws");
const assert = require("assert");
const createLogger = require("./createLogger.js");

const logger = createLogger("Greenlock");

const wsServer = new ws.Server({
  noServer: true,
});

const handleWebSocket = logger.wrapMethod(
  async ({ request, socket, head, handler }) => {
    assert(request);
    assert(socket);
    assert(head);
    assert(handler);
    assert(handler.sessions);
    assert(handler.handleWebSocketConnect);
    assert(handler.handleWebSocketClose);
    assert(handler.handleWebSocketMessage);

    const webSocket = await new Promise(resolve =>
      wsServer.handleUpgrade(request, socket, head, resolve),
    );

    const session = {
      webSocket,
    };
    handler.sessions.push(session);

    webSocket.on("message", data =>
      handler.handleWebSocketMessage({
        session,
        webSocket,
        data,
      }),
    );
    webSocket.on("error", error => logger.error(error));
    webSocket.on("close", () => {
      _.remove(handler.sessions, session);
      handler.handleWebSocketClose({ session, webSocket });
    });

    handler.handleWebSocketConnect({ session, webSocket });
  },
);

module.exports = handleWebSocket;
