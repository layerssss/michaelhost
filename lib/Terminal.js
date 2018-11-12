const uuid = require("uuid");
const pty = require("node-pty");
const _ = require("lodash");

const createLogger = require("./createLogger.js");

const logger = createLogger("Terminal");

class Terminal {
  static async init({
    file = process.env.SHELL || "/bin/sh",
    name = file,
    cwd = process.env.HOME,
    args = [],
    env = {},
  }) {
    const terminal = new Terminal();

    Object.assign(terminal, {
      id: uuid.v4().slice(0, 8),
      name,
      file,
      args,
      cwd,
      env,
      sessions: [],
      history: "",
    });

    const ptyProcess = pty.spawn(file, args, {
      name: "xterm-256color",
      cols: 80,
      rows: 30,
      cwd,
      env: { ...process.env, ...env },
    });

    ptyProcess.on("data", output => terminal.broadcast({ output }));
    ptyProcess.on("exit", exitCode => {
      terminal.ptyProcess = null;
      terminal.broadcast({ output: `\r\n\r\nExited: ${exitCode}\r\n` });
    });
    terminal.ptyProcess = ptyProcess;

    return terminal;
  }

  get alive() {
    return !!this.ptyProcess;
  }

  broadcast({ output }) {
    this.history += output;
    this.history = this.history.slice(-100000);
    for (const session of this.sessions)
      session.webSocket.send(
        JSON.stringify({
          alive: this.alive,
          output,
        }),
      );
  }

  handleWebSocket({ webSocket }) {
    const session = {
      webSocket,
    };
    this.sessions.push(session);

    webSocket.on("message", dataJSON =>
      this.handleWebSocketMessage({
        webSocket,
        session,
        data: JSON.parse(dataJSON),
      }),
    );
    webSocket.on("error", error => logger.error(error));
    webSocket.on("close", () =>
      this.handleWebSocketClose({ webSocket, session }),
    );
    webSocket.send(
      JSON.stringify({
        alive: this.alive,
        output: this.history,
      }),
    );
  }

  handleWebSocketMessage({ webSocket, session, data }) {
    const { input, size, kill } = data;
    if (!this.alive) return;
    if (input) this.ptyProcess.write(input);
    if (size) {
      session.size = size;
      const sizes = this.sessions.map(s => s.size).filter(s => s);
      if (sizes.length)
        this.ptyProcess.resize(
          _.min(sizes.map(s => s.cols)),
          _.min(sizes.map(s => s.rows)),
        );
    }
    if (kill) {
      this.ptyProcess.kill();
    }
  }

  handleWebSocketClose({ webSocket, session }) {
    _.remove(this.sessions, session);
  }
}

module.exports = logger.wrapClass(Terminal, {
  ignoreMethods: ["broadcast"],
});
