const createLogger = require("./createLogger.js");
const fs = require("fs");
const path = require("path");
const homedir = require("homedir");
const { promisify } = require("util");

const logger = createLogger("Image");

const readFileAsync = promisify(fs.readFile);

class Image {
  constructor({ dImage, state }) {
    Object.assign(this, { dImage, state });
  }

  get id() {
    return this.dImage.Id;
  }

  get tags() {
    return this.dImage.RepoTags;
  }

  get digests() {
    return this.dImage.RepoDigests;
  }

  get createdAt() {
    return this.dImage.Created;
  }

  static async all({ state }) {
    const dImages = await state.docker.listImages();
    const images = [];
    for (const { Id: id } of dImages)
      images.push(await Image.byId({ id, state: state }));
    return images;
  }

  static async byId({ id, state }) {
    const dImage = await (await state.docker.getImage(id)).inspect();
    return new Image({ dImage, state });
  }

  static async pull({ state, tag }) {
    let auth = null;
    const dockerConfigPath = path.join(homedir(), ".docker/config.json");
    const hostMatch = tag.match(/^([.\w-]+)\//);
    if (fs.existsSync(dockerConfigPath)) {
      const dockerConfig = JSON.parse(
        await readFileAsync(dockerConfigPath, "utf8"),
      );
      const auths = Object.entries(dockerConfig.auths || {}).map(
        ([serveraddress, others]) => ({
          serveraddress,
          ...others,
        }),
      );
      if (!hostMatch) {
        auth = auths.find((a) => a.serveraddress.includes("index.docker.io"));
      } else {
        auth = auths.find((a) => a.serveraddress === hostMatch[1]);
      }
      if (auth) {
        const buffer = new Buffer(auth.auth, "base64");
        const [username, password] = buffer.toString("utf8").split(":");
        auth = {
          username,
          password,
          auth: "",
          serveraddress: auth.serveraddress,
        };
      }
    }

    await new Promise((resolve, reject) =>
      state.docker.pull(
        tag,
        {
          authconfig: auth,
        },
        (error, stream) => {
          if (error) return reject(error);
          state.docker.modem.followProgress(stream, (error, output) =>
            error ? reject(error) : resolve(output),
          );
        },
      ),
    );
    const dImage = await (await state.docker.getImage(tag)).inspect();

    return new Image({ dImage, state });
  }

  static async prune({ state }) {
    await state.docker.pruneImages();
  }

  async rm() {
    await (await this.state.docker.getImage(this.id)).remove();
  }
}

module.exports = logger.wrapClass(Image);
