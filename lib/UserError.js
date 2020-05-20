class UserError extends Error {
  constructor(message, metadata) {
    super(message);
    Object.assign(this, {
      ...metadata,
      code: "USER_ERROR",
    });
  }
}

module.exports = UserError;
