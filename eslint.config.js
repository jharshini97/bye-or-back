import js from "@eslint/js";
import globals from "globals";

export default [
  // Recommended JavaScript rules
  js.configs.recommended,

  // Backend and Node.js scripts
  {
    files: [
      "server.js",
      "db/**/*.js",
      "routes/**/*.js",
      "scripts/**/*.js",
      "eslint.config.js",
    ],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Frontend JavaScript
  {
    files: ["public/js/**/*.js"],
    languageOptions: {
      globals: globals.browser,
    },
  },
];
