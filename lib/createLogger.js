const bunyan = require("bunyan");
const assert = require("assert");
const _ = require("lodash");
const stream = require("stream");
const events = require("events");
const PrettyStream = require("bunyan-prettystream");

const UserError = require("./UserError.js");
const AsyncFunction = require("./AsyncFunction.js");
const rollbar = require("./rollbar.js");

const prettyStdOut = new PrettyStream();
prettyStdOut.pipe(process.stdout);

class ErrorStream extends stream.Writable {
  constructor(options) {
    super({
      decodeStrings: false,
      objectMode: true,
    });

    Object.assign(this, { ...options });
  }

  _write({ err: error, ...errorInfo }, encoding, callback) {
    if (!error) return callback();
    this.eventEmitter.emit("message", { error, errorInfo });
    globalEventEmitter.emit("message", { error, errorInfo });
    callback();
  }
}

const globalEventEmitter = new events.EventEmitter();
const infoState = {
  history: "",
  callbacks: [],
};
const prettyInfo = new PrettyStream();
prettyInfo.on("data", (dataString) => {
  infoState.history += dataString;
  infoState.history = infoState.history.slice(-100000);
  for (const callback of infoState.callbacks) callback(dataString);
});

function format(input) {
  if ([null, undefined].includes(input)) return input;
  if (!input.constructor) return input;

  if (input.constructor === Array) return input.map((i) => format(i));
  if (input.constructor === Object)
    return _.fromPairs(Object.entries(input).map(([k, v]) => [k, format(v)]));
  if ([String, Number, Boolean, Date].includes(input.constructor)) return input;

  return `[${input.constructor.name}]`;
}

const { MICHAELHOST_LOG_LEVEL, NODE_ENV } = process.env;

function createLogger(name) {
  assert.equal(name.constructor, String);
  const eventEmitter = new events.EventEmitter();
  const errorStream = new ErrorStream({ name, eventEmitter });
  const logger = bunyan.createLogger({
    name,
    streams: [
      {
        level:
          MICHAELHOST_LOG_LEVEL ||
          (NODE_ENV === "production" ? "warn" : "debug"),
        type: "raw",
        stream: prettyStdOut,
      },
      {
        level: "info",
        type: "raw",
        stream: prettyInfo,
      },
      { level: "error", type: "raw", stream: errorStream },
    ],
  });

  Object.assign(logger, {
    wrapClass: function (
      klass,
      { verboseMethods = [], ignoreMethods = [] } = {},
    ) {
      for (const methodName of Object.getOwnPropertyNames(klass)) {
        const method = klass[methodName];
        if (![AsyncFunction, Function].includes(method.constructor)) continue;
        if (ignoreMethods.includes(methodName)) continue;
        klass[methodName] = this.wrapMethod(
          method,
          () => `${klass.name}.${methodName}()`,
          !verboseMethods.includes(methodName)
            ? undefined
            : (...args) => [`args[${args.length}]`],
        );
      }

      for (const methodName of Object.getOwnPropertyNames(klass.prototype)) {
        const descriptor = Object.getOwnPropertyDescriptor(
          klass.prototype,
          methodName,
        );
        if (methodName === "constructor") continue;
        if (!descriptor.writable) continue;
        const method = klass.prototype[methodName];
        if (![AsyncFunction, Function].includes(method.constructor)) continue;
        if (ignoreMethods.includes(methodName)) continue;
        klass.prototype[methodName] = this.wrapMethod(
          method,
          () => `${klass.name}#${methodName}()`,
          !verboseMethods.includes(methodName)
            ? undefined
            : (...args) => [`args[${args.length}]`],
        );
      }

      Object.assign(klass.prototype, {
        logger,
        errorStream,
        eventEmitter,
      });

      return klass;
    },
    wrapMethod: function (func, getMessage, getArgs) {
      const funcWrapped = function (...args) {
        const message = getMessage
          ? getMessage(this, ...args)
          : `${func.name}()`;
        let formatedArgs = [...args];
        if (getArgs) formatedArgs = getArgs(...formatedArgs);
        formatedArgs = format(formatedArgs);
        logger.debug(`${message}`, ...formatedArgs);

        return func.call(this, ...args);
      };
      Object.assign(funcWrapped, {
        logger,
        errorStream,
        eventEmitter,
      });

      return funcWrapped;
    },
    errorStream,
    eventEmitter,
  });

  logger._error = logger.error;
  logger.error = (error) => {
    if (error.constructor !== UserError)
      rollbar.error(error, { context: name });
    logger._error(error);
  };

  return logger;
}

Object.assign(createLogger, { infoState, globalEventEmitter });

module.exports = createLogger;
