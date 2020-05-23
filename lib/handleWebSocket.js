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

    const webSocket = await new Promise((resolve) =>
      wsServer.handleUpgrade(request, socket, head, resolve),
    );

    const session = {
      webSocket,
    };
    handler.sessions.push(session);

    webSocket.on("message", (data) =>
      Promise.resolve()
        .then(() =>
          handler.handleWebSocketMessage({
            session,
            webSocket,
            data,
          }),
        )
        .catch((error) => logger.error(error)),
    );
    webSocket.on("error", (error) => logger.error(error));
    webSocket.on("close", () => {
      _.remove(handler.sessions, session);
      Promise.resolve()
        .then(() => handler.handleWebSocketClose({ session, webSocket }))
        .catch((error) => logger.error(error));
    });

    Promise.resolve()
      .then(() => handler.handleWebSocketConnect({ session, webSocket }))
      .catch((error) => logger.error(error));
  },
);

module.exports = handleWebSocket;
