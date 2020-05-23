const assert = require("assert");
const moment = require("moment");
const Docker = require("dockerode");
const _ = require("lodash");
const uuid = require("uuid");
const url = require("url");
const path = require("path");
const fs = require("fs");
const util = require("util");
const Nodegit = require("nodegit");
const shellQuote = require("shell-quote");
const YAML = require("yaml");

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const createLogger = require("./createLogger.js");
const sleep = require("./sleep.js");

const logger = createLogger("ComposeApplication");
const COMPOSE_PREFIX = "michaelhost_compose_";

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
      headRevision: null,
      task: null,
      sessions: [],
      portMappings: [],
    });
    this.broadcastState = _.throttle(this.broadcastState, 500).bind(this);
    this.docker = new Docker();
    Promise.resolve()
      .then(async () => {
        this.headRevision = await this.getHeadRevision();
        this.broadcastState();
      })
      .catch((error) => logger.error(error));
  }

  get name() {
    const repoName = url
      .parse(this.repo.replace(/^.+@/, ""))
      .pathname.replace(/^\//, "")
      .replace(/\.git/, "");
    return `${repoName}#${this.branch}/${this.path}`;
  }

  get projectName() {
    return `${COMPOSE_PREFIX}${this.id}`;
  }
  get cachePath() {
    return path.join(process.env["HOME"], ".cache", "michaelhost", "compose");
  }
  get repoPath() {
    return path.join(this.cachePath, `${this.id}.repobare`);
  }
  get workPath() {
    return path.join(this.cachePath, `${this.id}.work`);
  }
  get headRevisionPath() {
    return path.join(this.cachePath, `${this.id}.headrevision`);
  }
  async getHeadRevision() {
    if (!fs.existsSync(this.headRevisionPath)) return null;
    return await readFileAsync(this.headRevisionPath, "utf8");
  }
  async setHeadRevision(value) {
    await writeFileAsync(this.headRevisionPath, value, "utf8");
    this.headRevision = value;
    return value;
  }

  async queueTask(func) {
    Promise.resolve()
      .then(async () => {
        while (this.task) await sleep(1000);
        await func();
      })
      .catch((error) => logger.error(error));
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
      .catch((error) => logger.error(error))
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

  async _checkout(func, { force = false } = {}) {
    if (!fs.existsSync(this.workPath) || force) {
      let repository;
      const fetchOpts = {
        callbacks: {
          certificateCheck: function () {
            return 0;
          },
          credentials: function (url, username) {
            return Nodegit.Cred.sshKeyNew(
              username,
              path.join(process.env.HOME, ".ssh/id_rsa.pub"),
              path.join(process.env.HOME, ".ssh/id_rsa"),
              "",
            );
          },
        },
      };
      if (!fs.existsSync(this.repoPath)) {
        repository = await Nodegit.Clone.clone(this.repo, this.repoPath, {
          bare: 1,
          checkoutBranch: this.branch,
          fetchOpts,
        });
      } else {
        repository = await Nodegit.Repository.openBare(this.repoPath);
        await repository.fetch("origin", fetchOpts);
      }
      const headReference = await repository.getReference(
        `remotes/origin/${this.branch}`,
      );
      const headCommit = await repository.getReferenceCommit(headReference);
      const headRevision = headCommit.sha();

      if ((await this.getHeadRevision()) !== headRevision) {
        await repository.checkoutRef(headReference, {
          targetDirectory: this.workPath,
          checkoutStrategy: Nodegit.Checkout.STRATEGY.FORCE,
        });
        await this.setHeadRevision(headRevision);
        this.broadcastState();
      }
    }

    await func({ workPath: path.join(this.workPath, this.path) });
  }

  async _dockerComposePS({ workPath }) {
    const config = YAML.parse(
      await readFileAsync(path.join(workPath, "docker-compose.yml"), "utf8"),
    );
    this.serviceNames = Object.keys(config.services);

    this.broadcastState();

    const containers = [];
    for (const {
      Names: [Name],
      Image,
      Created,
      Ports,
    } of await this.docker.listContainers()) {
      if (!Name) continue;
      const containerId = Name.replace(/^\//, "");
      if (!containerId) continue;
      const serviceName = this.serviceNames.find((n) =>
        containerId.startsWith(`${this.projectName}_${n}_`),
      );
      if (!serviceName) continue;
      const ports = [];
      for (const { PrivatePort, PublicPort, Type } of Ports) {
        ports.push({
          id: `${containerId}_${Type}_${PrivatePort}`,
          protocol: Type,
          port: Number(PrivatePort),
          hostPort: Number(PublicPort),
        });
      }

      containers.push({
        id: containerId,
        serviceName,
        runningFor: moment(Created * 1000).fromNow(),
        image: Image,
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

  async gitFetch() {
    await this._task(
      "git fetch",
      async () => await this._checkout(async () => {}, { force: true }),
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

  async pull() {
    await this._task(
      "docker-compose pull",
      async () =>
        await this._checkout(async ({ workPath }) => {
          await this._runTerminal({
            file: "docker-compose",
            args: ["pull"],
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
            serviceNames: this.serviceNames,
            headRevision: this.headRevision,
            task: this.task && {
              __typename: "ComposeTask",
              id: this.task.id,
              name: this.task.name,
              terminal: this.task.terminal && {
                __typename: "Terminal",
                name: this.task.terminal.name,
                id: this.task.terminal.id,
              },
            },
            containers:
              this.containers &&
              this.containers.map((composeContainer) => ({
                __typename: "ComposeContainer",
                id: composeContainer.id,
                runningFor: composeContainer.runningFor,
                ports: composeContainer.ports.map((composeContainerPort) => ({
                  __typename: "ComposeContainerPort",
                  id: composeContainerPort.id,
                  hostPort: composeContainerPort.hostPort,
                })),
              })),
            portMappings: this.portMappings.map((composePortMapping) => ({
              __typename: "ComposePortMapping",
              id: composePortMapping.id,
              connections: composePortMapping.connections.map((connection) => ({
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
        (error) => null,
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
