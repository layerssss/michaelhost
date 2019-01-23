const uuid = require("uuid");
const pty = require("node-pty");
const _ = require("lodash");
const stripAnsi = require("strip-ansi");
const ShellQuote = require("shell-quote");

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
      output: "",
      callbacks: [],
      finished: false,
      error: null,
    });

    const ptyProcess = pty.spawn(file, args, {
      name: "xterm-256color",
      cols: 80,
      rows: 30,
      cwd,
      env: { ...process.env, ...env },
    });

    ptyProcess.on("data", output => {
      terminal.output += output;
      terminal.broadcast({ output });
    });
    ptyProcess.on("exit", exitCode =>
      terminal.handleProcessEnd(
        !exitCode ? null : new Error(`${file} exited with ${exitCode}`),
      ),
    );
    terminal.ptyProcess = ptyProcess;

    terminal.broadcast({
      output: `${cwd}> ${file} ${ShellQuote.quote(args)}\r\n`,
    });

    return terminal;
  }

  finalize() {
    if (this.finished) return;
    this.finished = true;
    for (const callback of this.callbacks) {
      callback(this.error);
    }
  }

  async waitForExit() {
    if (!this.ptyProcess) throw new Error(`${this.id} is not running.`);
    await new Promise((resolve, reject) =>
      this.callbacks.push((error, result) => {
        if (error) return reject(error);
        resolve(result);
      }),
    );
    return stripAnsi(this.output).replace(/\r/g, "");
  }

  get alive() {
    return !!this.ptyProcess;
  }

  broadcast({ output }) {
    this.history += output;
    for (const session of this.sessions)
      session.webSocket.send(
        JSON.stringify({
          alive: this.alive,
          output,
        }),
      );
  }

  handleWebSocketConnect({ webSocket }) {
    webSocket.send(
      JSON.stringify({
        alive: this.alive,
        output: this.history,
      }),
    );
  }

  handleWebSocketMessage({ webSocket, session, data }) {
    const { input, size, kill } = JSON.parse(data);
    if (input) this.handleInput({ input });
    if (size) this.handleResize({ session, size });
    if (kill) this.handleKill();
  }

  handleInput({ input }) {
    if (this.ptyProcess) this.ptyProcess.write(input);
    else this.finalize();
  }

  handleResize({ size, session }) {
    session.size = size;
    const sizes = this.sessions.map(s => s.size).filter(s => s);
    if (sizes.length && this.ptyProcess)
      this.ptyProcess.resize(
        _.min(sizes.map(s => s.cols)),
        _.min(sizes.map(s => s.rows)),
      );
  }

  handleKill() {
    if (!this.ptyProcess) return;
    this.ptyProcess.kill();
  }

  handleProcessEnd(error) {
    this.ptyProcess = null;
    if (error) {
      this.error = error;
      this.broadcast({ output: `\r\n${error.message}` });
      this.broadcast({ output: `\r\nPress any key to dismiss this terminal.` });
    } else {
      this.broadcast({ output: `\r\n${this.file} exited.` });
      this.finalize();
    }
  }

  handleWebSocketClose({ webSocket, session }) {}
}

module.exports = logger.wrapClass(Terminal, {
  ignoreMethods: ["broadcast"],
});
