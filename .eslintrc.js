module.exports = {
  extends: ["eslint:recommended", "prettier", "plugin:prettier/recommended"],
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
