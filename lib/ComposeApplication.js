const assert = require("assert");
const uuid = require("uuid");
const url = require("url");
const path = require("path");
const rimraf = require("rimraf");
const { promisify } = require("util");
const os = require("os");
const fs = require("fs");
const shellQuote = require("shell-quote");

const createLogger = require("./createLogger.js");

const logger = createLogger("ComposeAppication");
const rimrafAsync = promisify(rimraf);
const mkdtempAsync = promisify(fs.mkdtemp);
const existsAsync = promisify(fs.exists);

class ComposeAppication {
  constructor({
    id = uuid.v4().slice(0, 8),
    repo,
    branch = "master",
    path = "",
    state,
  }) {
    assert(state);
    assert(repo);
    assert(branch);

    Object.assign(this, {
      id,
      repo,
      branch,
      path,
      state,
      containers: null,
      serviceNames: null,
      task: null,
      sessions: [],
      portMappings: [],
    });
  }

  get name() {
    const repoName = url
      .parse(this.repo.replace(/^.+@/, ""))
      .pathname.replace(/^\//, "")
      .replace(/\.git/, "");
    return `${repoName}#${this.branch}/${this.path}`;
  }

  get projectName() {
    return `michaelhost_compose_${this.id}`;
  }

  async _task(name, callback) {
    if (this.task) throw new Error(`${this.task.name} is still running.`);

    const task = {
      id: uuid.v4(),
      name,
      terminal: null,
    };

    this.task = task;
    this.broadcastState();
    Promise.resolve()
      .then(async () => {
        await callback();
      })
      .catch(async error => {
        logger.error(error);
      })
      .then(async () => {
        this.task = null;
        this.broadcastState();
      });

    return task;
  }

  async _runTerminal(options) {
    assert(this.task);
    const { terminal } = await this.state.runTerminal({
      ...options,
      env: {
        ...options.env,
        COMPOSE_PROJECT_NAME: this.projectName,
      },
    });
    this.task.terminal = terminal;
    this.broadcastState();
    const data = await terminal.waitForExit();
    this.task.terminal = null;
    this.broadcastState();
    return data;
  }

  async _checkout(callback) {
    const cachePath = path.join(
      process.env["HOME"],
      ".cache",
      "michaelhost",
      "compose",
    );
    const repoPath = path.join(cachePath, `${this.id}.repo`);
    const workPath = await mkdtempAsync(
      path.join(os.tmpdir(), "michaelhost-compose"),
    );

    if (!(await existsAsync(path.join(repoPath, ".git"))))
      await this._runTerminal({
        file: "git",
        name: "git clone",
        args: ["clone", this.repo, `--branch=${this.branch}`, repoPath],
      });
    else
      await this._runTerminal({
        file: "git",
        name: "git fetch",
        args: ["fetch", "origin"],
        cwd: repoPath,
      });
    await this._runTerminal({
      file: "git",
      name: "git checkout",
      args: [
        `--work-tree=${workPath}`,
        "reset",
        "--hard",
        `origin/${this.branch}`,
      ],
      cwd: repoPath,
    });

    await callback({ workPath: path.join(workPath, this.path) });

    await rimrafAsync(workPath);
  }

  async _dockerComposePS({ workPath }) {
    this.serviceNames = (await this._runTerminal({
      file: "docker-compose",
      args: ["ps", "--services"],
      cwd: workPath,
    }))
      .split("\n")
      .filter(line => line);

    this.broadcastState();

    const containers = [];
    for (const [containerId, portsSpec, runningFor] of (await this._runTerminal(
      {
        file: "docker",
        args: [
          "container",
          "ls",
          `--format=[{{json .Names}},{{json .Ports}},{{json .RunningFor}}]`,
        ],
        cwd: workPath,
      },
    ))
      .split("\n")
      .filter(l => l)
      .map(l => JSON.parse(l))) {
      if (!containerId.startsWith(this.projectName)) continue;
      const serviceName = this.serviceNames.find(n =>
        containerId.startsWith(`${this.projectName}_${n}_`),
      );

      const ports = [];
      for (const [, hostPort, port, protocol] of portsSpec
        .split(",")
        .map(s => s.trim())
        .map(s => s)
        .map(s => s.match(/0\.0\.0\.0:(\d+)->(\d+)\/(\w+)/))
        .filter(m => !!m)) {
        ports.push({
          id: `${containerId}_${protocol}_${port}`,
          protocol,
          port: Number(port),
          hostPort: Number(hostPort),
        });
      }

      containers.push({
        id: containerId,
        serviceName,
        runningFor: runningFor,
        ports,
      });
    }

    this.containers = containers;
    this.broadcastState();
  }

  async ps() {
    await this._task(
      "compose ps",
      async () =>
        await this._checkout(async ({ workPath }) => {
          await this._dockerComposePS({ workPath });
        }),
    );
  }

  async up() {
    await this._task(
      "docker-compose up",
      async () =>
        await this._checkout(async ({ workPath }) => {
          await this._runTerminal({
            file: "docker-compose",
            args: ["up", "--remove-orphans", "--build", "--detach"],
            cwd: workPath,
          });

          await this._dockerComposePS({ workPath });
        }),
    );
  }

  async down() {
    await this._task(
      "docker-compose ps",
      async () =>
        await this._checkout(async ({ workPath }) => {
          await this._runTerminal({
            file: "docker-compose",
            args: ["down", "--remove-orphans"],
            cwd: workPath,
          });

          await this._dockerComposePS({ workPath });
        }),
    );
  }

  async exec({ composeContainer, command }) {
    assert(composeContainer);
    assert(command);
    assert(this.containers.includes(composeContainer));
    const [file, ...args] = shellQuote.parse(command);

    await this._task(
      "docker exec",
      async () =>
        await this._checkout(async ({ workPath }) => {
          await this._runTerminal({
            file: "docker",
            args: [
              "exec",
              "--interactive",
              "--tty",
              composeContainer.id,
              file,
              ...args,
            ],
            cwd: workPath,
          });
        }),
    );
  }

  async run({ serviceName, command }) {
    assert(serviceName);
    assert(command);
    const [file, ...args] = shellQuote.parse(command);

    await this._task(
      "docker-compose run",
      async () =>
        await this._checkout(async ({ workPath }) => {
          await this._runTerminal({
            file: "docker-compose",
            args: ["run", "--rm", serviceName, file, ...args],
            cwd: workPath,
          });
        }),
    );
  }

  async logs({ serviceName }) {
    assert(serviceName);

    await this._task(
      "docker-compose logs",
      async () =>
        await this._checkout(async ({ workPath }) => {
          await this._runTerminal({
            file: "docker-compose",
            args: ["logs", "--follow", "--timestamps", serviceName],
            cwd: workPath,
            pauseBeforeExit: true,
          });
        }),
    );
  }

  broadcastState() {
    for (const session of this.sessions)
      session.webSocket.send(
        JSON.stringify({
          composeApplication: {
            __typename: "ComposeAppication",
            id: this.id,
            task: this.task && {
              __typename: "ComposeTask",
              id: this.task.id,
              name: this.task.name,
              terminal: this.task.terminal && {
                __typename: "Terminal",
                id: this.task.terminal.id,
              },
            },
            serviceNames: this.serviceNames,
            containers:
              this.containers &&
              this.containers.map(composeContainer => ({
                __typename: "ComposeContainer",
                id: composeContainer.id,
                runningFor: composeContainer.runningFor,
                ports: composeContainer.ports.map(composeContainerPort => ({
                  __typename: "ComposeContainerPort",
                  id: composeContainerPort.id,
                  hostPort: composeContainerPort.hostPort,
                })),
              })),
            portMappings: this.portMappings.map(composePortMapping => ({
              __typename: "ComposePortMapping",
              id: composePortMapping.id,
              connectionsCount: composePortMapping.connectionsCount,
              status: composePortMapping.status,
            })),
          },
        }),
      );
  }

  handleWebSocketConnect() {
    this.broadcastState();
  }
  handleWebSocketClose() {}
  handleWebSocketMessage() {}
}

module.exports = logger.wrapClass(ComposeAppication);
