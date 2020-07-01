const assert = require("assert");
const _ = require("lodash");
const createLogger = require("./createLogger.js");

const logger = createLogger("Service");

class Service {
  static async all({ state }) {
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
    const terminal = await this.state.runTerminal({
      file: "docker",
      name: "docker pull",
      args: ["pull", this.image],
    });

    await terminal.waitForExit();
    const images = await this.state.docker.listImages();
    const image = images.find(
      (i) => i.RepoTags && i.RepoTags.includes(this.image),
    );
    const tagIndex = image.RepoTags.indexOf(this.image);
    const tagRepoDigest = image.RepoDigests[tagIndex].match(/@(sha.*)$/)[1];
    const imageSpec = `${this.image}@${tagRepoDigest}`;

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
