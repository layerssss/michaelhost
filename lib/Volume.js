const assert = require("assert");
const _ = require("lodash");
const createLogger = require("./createLogger.js");

const logger = createLogger("Volume");

class Volume {
  static async all({ state }) {
    const volumes = [];
    for (const data of _.orderBy(
      (await state.docker.listVolumes()).Volumes,
      (v) => v.Name,
    ))
      volumes.push(await Volume.byId({ id: data.Name, state }));
    return volumes;
  }

  static async byId({ id, state }) {
    assert(id && state);
    const dockerVolume = state.docker.getVolume(id);
    const data = await dockerVolume.inspect();

    const volume = new Volume();

    Object.assign(volume, {
      id,
      state,
      dockerVolume,
      name: data.Name,
      driver: data.Driver,
    });

    return volume;
  }
}

module.exports = logger.wrapClass(Volume);
