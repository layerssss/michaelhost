const assert = require("assert");
const uuid = require("uuid");
const createLogger = require("./createLogger.js");

const logger = createLogger("MontedApp");

class MontedApp {
  constructor({ id = uuid.v4().slice(0, 8), name = "app", upstream = "" }) {
    assert(name.match(/^[\w-]{1,}$/), `Not a valid name: ${name}`);
    assert(
      upstream.match(
        /https?:\/\/[-a-zA-Z0-9@:%._+~#=]{2,256}([-a-zA-Z0-9@:%_+.~#?&//=]*)/,
      ),
      `Not a valid upsteam: ${upstream}`,
    );

    Object.assign(this, { id, name, upstream });
  }
}

module.exports = logger.wrapClass(MontedApp);
