module.exports = {
  extends: [
    "react-app",
    "eslint:recommended",
    "plugin:import/errors",
    "prettier",
    "plugin:prettier/recommended",
  ],
  plugins: ["import"],
  rules: {
    "react-hooks/exhaustive-deps": [0],
    "no-console": [1],
  },
};
