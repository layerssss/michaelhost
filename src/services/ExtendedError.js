class ExtendedError extends Error {
  constructor(message, metadata) {
    super(message);
    Object.assign(this, {
      ...metadata,
    });
  }
}

export default ExtendedError;
