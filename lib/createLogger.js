const bunyan = require("bunyan");
const assert = require("assert");
const _ = require("lodash");
const PrettyStream = require("bunyan-prettystream");

const AsyncFunction = require("./AsyncFunction.js");

const prettyStdOut = new PrettyStream();
prettyStdOut.pipe(process.stdout);

function format(input) {
  if ([null, undefined].includes(input)) return input;
  if (!input.constructor) return input;

  if (input.constructor === Array) return input.map(i => format(i));
  if (input.constructor === Object)
    return _.fromPairs(Object.entries(input).map(([k, v]) => [k, format(v)]));
  if ([String, Number, Boolean, Date].includes(input.constructor)) return input;

  return `[${input.constructor.name}]`;
}

function createLogger(name) {
  assert.equal(name.constructor, String);
  const logger = bunyan.createLogger({
    name,
    streams: [
      {
        level: "debug",
        type: "raw",
        stream: prettyStdOut
      }
    ]
  });

  Object.assign(logger, {
    wrapClass: function(klass) {
      for (const methodName of Object.getOwnPropertyNames(klass)) {
        const method = klass[methodName];
        if (![AsyncFunction, Function].includes(method.constructor)) continue;
        klass[methodName] = this.wrapMethod(
          method,
          () => `${klass.name}.${methodName}()`
        );
      }

      for (const methodName of Object.getOwnPropertyNames(klass.prototype)) {
        if (methodName === "constructor") continue;
        const method = klass.prototype[methodName];
        if (![AsyncFunction, Function].includes(method.constructor)) continue;
        klass.prototype[methodName] = this.wrapMethod(
          method,
          () => `${klass.name}#${methodName}()`
        );
      }

      return klass;
    },
    wrapMethod: function(func, getMessage, getArgs) {
      return function(...args) {
        const message = getMessage
          ? getMessage(this, ...args)
          : `${func.name}()`;
        let formatedArgs = [...args];
        if (getArgs) formatedArgs = getArgs(...formatedArgs);
        formatedArgs = format(formatedArgs);
        logger.debug(`${message}`, ...formatedArgs);

        return func.call(this, ...args);
      };
    }
  });

  return logger;
}

module.exports = createLogger;
