const assert = require("assert");
const _ = require("lodash");
const uuid = require("uuid");
const url = require("url");
const path = require("path");
const fs = require("fs");
const Nodegit = require("nodegit");

const shellQuote = require("shell-quote");

const createLogger = require("./createLogger.js");
const sleep = require("./sleep.js");

const logger = createLogger("ComposeApplication");

class ComposeApplication {
  constructor({
    id = uuid.v4().slice(0, 8),
    repo,
    branch = "master",
    path = "",
    state,
  }) {
    assert(id.match(/^\w{8,}$/), "Invalid ID");
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
    this.broadcastState = _.throttle(this.broadcastState, 500).bind(this);
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

  async queueTask(func) {
    Promise.resolve()
      .then(async () => {
        while (this.task) await sleep(1000);
        await func();
      })
      .catch(error => logger.error(error));
  }

  async _task(name, func) {
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
        await func();
      })
      .catch(error => logger.error(error))
      .then(async () => {
        this.task = null;
        this.broadcastState();
      });

    return task;
  }

  async _runTerminal(options) {
    assert(this.task);
    const terminal = await this.state.runTerminal({
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

  async _checkout(func) {
    const cachePath = path.join(
      process.env["HOME"],
      ".cache",
      "michaelhost",
      "compose",
    );
    const repoPath = path.join(cachePath, `${this.id}.repobare`);
    const workPath = path.join(cachePath, `${this.id}.work`);

    let repository;
    const fetchOpts = {
      callbacks: {
        certificateCheck: function() {
          return 0;
        },
        credentials: function(url, username) {
          return Nodegit.Cred.sshKeyNew(
            username,
            path.join(process.env.HOME, ".ssh/id_rsa.pub"),
            path.join(process.env.HOME, ".ssh/id_rsa"),
            "",
          );
        },
      },
    };
    if (!fs.existsSync(repoPath)) {
      repository = await Nodegit.Clone.clone(this.repo, repoPath, {
        bare: 1,
        checkoutBranch: this.branch,
        fetchOpts,
      });
    } else {
      repository = await Nodegit.Repository.openBare(repoPath);
      await repository.fetch("origin", fetchOpts);
    }
    const head = await repository.getReferenceCommit(
      `remotes/origin/${this.branch}`,
    );
    const headRevision = head.sha();

    if (this.headRevision !== headRevision) {
      await Nodegit.Checkout.tree(repository, headRevision, {
        targetDirectory: workPath,
        checkoutStrategy: Nodegit.Checkout.STRATEGY.FORCE,
      });
      this.headRevision = headRevision;
    }

    await func({ workPath: path.join(workPath, this.path) });
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
    for (const [
      containerId,
      portsSpec,
      runningFor,
      image,
    ] of (await this._runTerminal({
      file: "docker",
      args: [
        "container",
        "ls",
        `--format=[{{json .Names}},{{json .Ports}},{{json .RunningFor}},{{json .Image}}]`,
      ],
      cwd: workPath,
    }))
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
        runningFor,
        image,
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
      "docker-compose down",
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
            args: [
              "logs",
              "--follow",
              "--timestamps",
              "--tail=100",
              serviceName,
            ],
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
            __typename: "ComposeApplication",
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
              connections: composePortMapping.connections.map(connection => ({
                __typename: "ComposeConnection",
                id: connection.id,
                remoteAddress: connection.remoteAddress,
                remotePort: connection.remotePort,
                bytesSent: connection.bytesSent,
                bytesReceived: connection.bytesReceived,
                sending: connection.sending,
                receiving: connection.receiving,
                errorMessage: connection.errorMessage,
              })),
              status: composePortMapping.status,
            })),
          },
        }),
        error => null,
      );
  }

  handleWebSocketConnect() {
    this.broadcastState();
  }
  handleWebSocketClose() {}
  handleWebSocketMessage() {}
}

module.exports = logger.wrapClass(ComposeApplication, {
  ignoreMethods: ["broadcastState"],
});
