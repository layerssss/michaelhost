const assert = require("assert");
const createLogger = require("./createLogger.js");

const logger = createLogger("Container");

class Container {
  static async all({ state }) {
    const containers = [];
    for (const data of await state.docker.listContainers({ all: true }))
      containers.push(await Container.byId({ id: data.Id, state }));
    return containers;
  }

  static async byId({ id, state }) {
    assert(id && state);
    const dockerContainer = state.docker.getContainer(id);
    const data = await dockerContainer.inspect();

    const container = new Container();

    Object.assign(container, {
      id,
      state,
      dockerContainer,
      name: data.Name.replace(/^\//, ""),
      image: data.Config.Image,
      command: data.Config.Cmd,
      entrypoint: data.Config.Entrypoint,
      createdAt: data.Created,
      startedAt: data.State.StartedAt,
      finishedAt: data.State.FinishedAt,
      running: data.State.Running,
      status: data.State.Status,
      mounts: data.Mounts?.map((mount) => ({
        id: mount.Name,
        source: mount.Source,
        destination: mount.Destination,
        driver: mount.Driver,
        mode: mount.Mode,
        rw: mount.RW,
      })),
    });

    return container;
  }
}

module.exports = logger.wrapClass(Container);
