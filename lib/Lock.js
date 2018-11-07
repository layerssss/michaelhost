const sleep = require("./sleep.js");

class Lock {
  async run(func) {
    while (this.locked) await sleep(10);
    this.locked = true;
    let result = null;
    try {
      result = await func();
    } catch (error) {
      this.locked = false;
      throw error;
    }

    this.locked = false;
    return result;
  }
}

module.exports = Lock;
