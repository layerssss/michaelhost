module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "prettier",
    "plugin:prettier/recommended",
  ],
  plugins: ["import"],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "script",
  },
  env: {
    node: true,
    es2021: true,
  },
  rules: {
    "no-console": [1],
    "no-unused-vars": ["error", { args: "none", varsIgnorePattern: "^_" }],
  },
};
