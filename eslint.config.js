const js = require("@eslint/js");
const prettierRecommended = require("eslint-plugin-prettier/recommended");

const nodeGlobals = {
  __dirname: "readonly",
  Buffer: "readonly",
  clearInterval: "readonly",
  clearTimeout: "readonly",
  console: "readonly",
  module: "readonly",
  process: "readonly",
  require: "readonly",
  setInterval: "readonly",
  setTimeout: "readonly",
};

module.exports = [
  {
    ignores: ["node_modules/**", "build/**", "admin_ui/**"],
  },
  js.configs.recommended,
  {
    files: ["bin/**/*.js", "lib/**/*.js", "eslint.config.js", "webpack.config.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "commonjs",
      globals: nodeGlobals,
    },
    rules: {
      "no-console": [1],
      "no-unused-vars": ["error", { args: "none", varsIgnorePattern: "^_" }],
    },
  },
  prettierRecommended,
];
