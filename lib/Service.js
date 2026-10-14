const assert = require("assert");
const _ = require("lodash");
const createLogger = require("./createLogger.js");
const Image = require("./Image");
const Lock = require("./Lock.js");

const logger = createLogger("Service");
// Serialises pull + ServiceUpdate across every caller (webhook and GraphQL),
// so no two michaelhost deploys of the same service are ever in flight at once.
const pullLock = new Lock();

class Service {
  static async all({ state }) {
    const info = await state.docker.info();
    if (!info.Swarm.NodeID) return [];

    const services = [];
    for (const data of await state.docker.listServices())
      services.push(await Service.byId({ id: data.ID, state }));
    return services;
  }

  static async byId({ id, state }) {
    assert(id && state);
    const dockerService = state.docker.getService(id);
    const data = await dockerService.inspect();

    const service = new Service();

    Object.assign(service, {
      id,
      data,
      state,
      dockerService,
      name: data.Spec.Name,
      image: data.Spec.TaskTemplate.ContainerSpec.Image.replace(/@sha.*$/, ""),
      replicas: data.Spec.Mode.Replicated && data.Spec.Mode.Replicated.Replicas,
      ports: !data.Endpoint.Ports
        ? []
        : data.Endpoint.Ports.map((port) => ({
            protocol: port.Protocol,
            targetPort: port.TargetPort,
            publishedPort: port.PublishedPort,
          })),
    });

    const tasks = await state.docker.listTasks({
      filters: JSON.stringify({
        service: [service.name],
      }),
    });

    service.tasks = _.orderBy(tasks, (t) => t.CreatedAt, "desc").map(
      (task) => ({
        id: task.ID,
        createdAt: task.CreatedAt,
        status: task.Status.State,
        message: task.Status.Message,
      }),
    );

    return service;
  }

  get runningTaskCount() {
    return this.tasks.filter((t) => t.status === "running").length;
  }

  async pull() {
    await pullLock.run(async () => {
      const image = await Image.pull({ state: this.state, tag: this.image });

      const digestMatch = image.digests[0]?.match(/(@.+)$/);
      if (!digestMatch)
        throw new Error(`Missing digest from: ${image.digests.join()}`);
      const imageSpec = `${this.image}${digestMatch[1]}`;

      // `this.data` was captured when this Service was constructed, possibly
      // before another deploy of the same service committed. Swarm rejects
      // ServiceUpdate with a stale Version.Index ("update out of sequence"),
      // so re-inspect now, while holding the lock, and build the update from
      // the current Spec and version.
      const data = await this.dockerService.inspect();

      await this.dockerService.update({
        version: data.Version.Index,
        ...data.Spec,
        TaskTemplate: {
          ...data.Spec.TaskTemplate,
          ContainerSpec: {
            ...data.Spec.TaskTemplate.ContainerSpec,
            Image: imageSpec,
          },
          ForceUpdate: 1,
        },
      });
    });
  }
}

module.exports = logger.wrapClass(Service);
