const assert = require("assert");
const _ = require("lodash");
const createLogger = require("./createLogger.js");
const Image = require("./Image");

const logger = createLogger("Service");

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
    const image = await Image.pull({ state: this.state, tag: this.image });

    const digestMatch = image.digests[0]?.match(/(@.+)$/);
    if (!digestMatch)
      throw new Error(`Missing digest from: ${image.digests.join()}`);
    const imageSpec = `${this.image}${digestMatch[1]}`;

    await this.dockerService.update({
      version: this.data.Version.Index,
      ...this.data.Spec,
      TaskTemplate: {
        ...this.data.Spec.TaskTemplate,
        ContainerSpec: {
          ...this.data.Spec.TaskTemplate.ContainerSpec,
          Image: imageSpec,
        },
        ForceUpdate: 1,
      },
    });
  }
}

module.exports = logger.wrapClass(Service);
