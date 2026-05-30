const js = require("@eslint/js");
const prettierRecommended = require("eslint-plugin-prettier/recommended");

const browserGlobals = {
  clearInterval: "readonly",
  clearTimeout: "readonly",
  console: "readonly",
  document: "readonly",
  Event: "readonly",
  fetch: "readonly",
  FileReader: "readonly",
  FormData: "readonly",
  localStorage: "readonly",
  location: "readonly",
  navigator: "readonly",
  setInterval: "readonly",
  setTimeout: "readonly",
  URL: "readonly",
  WebSocket: "readonly",
  window: "readonly",
};

const nodeGlobals = {
  __dirname: "readonly",
  console: "readonly",
  module: "readonly",
  process: "readonly",
  require: "readonly",
};

module.exports = [
  {
    ignores: ["node_modules/**", "build/**"],
  },
  js.configs.recommended,
  {
    files: ["eslint.config.js", "webpack.config.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "commonjs",
      globals: nodeGlobals,
    },
  },
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: browserGlobals,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      "no-console": [1],
      "no-unused-vars": [
        "error",
        { args: "none", varsIgnorePattern: "^_|^React$" },
      ],
    },
  },
  prettierRecommended,
];
