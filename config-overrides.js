const {
  override,
  addWebpackAlias,
  disableEsLint,
  useBabelRc,
} = require("customize-cra");

module.exports = override(
  useBabelRc(),
  disableEsLint(),
  addWebpackAlias({
    "react-dom": "@hot-loader/react-dom",
  }),
);
