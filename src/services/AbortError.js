import ExtendedError from "./ExtendedError";

export default class AbortError extends ExtendedError {
  constructor(message = "action aborted") {
    super(message, { isAbortError: true });
  }
}
