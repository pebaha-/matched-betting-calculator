import globals from 'globals'

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: globals.browser
    },
    rules: {
      // 🛑 Fejl / bugs
      "no-undef": "error",
      "no-unused-vars": "warn",
      "no-redeclare": "error",
      "no-unreachable": "error",

       // ⚠️ Pitfalls
      "eqeqeq": "error",
      "no-implicit-globals": "error",
      "no-var": "error",
      "prefer-const": "error",

      // 🧠 Bedre kode
      // "no-console": "warn",
      "no-debugger": "error",

       // ✨ Let styling (uden at gå overboard)
      "no-trailing-spaces": "error",
      "no-mixed-spaces-and-tabs": "error",
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
      "no-extra-semi": "error",
      "no-multi-spaces": "error",
      "space-before-blocks": ["error", "always"],
      "comma-spacing": ["error", { before: false, after: true }],
    }
  }
];