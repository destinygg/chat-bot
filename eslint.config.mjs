import js from "@eslint/js";
import nodePlugin from "eslint-plugin-n";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default [
  { ignores: ["tests/**", "node_modules/**"] },
  js.configs.recommended,
  nodePlugin.configs["flat/recommended"],
  prettierConfig,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      "n/no-process-exit": "off",
    },
  },
];
