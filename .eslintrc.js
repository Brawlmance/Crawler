module.exports = {
  env: {
    es6: true,
    node: true
  },
  extends: ["standard", "prettier"],
  plugins: ["prettier"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly"
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module"
  },
  rules: {
    "no-shadow": "warn",
    "prettier/prettier": "error",
    "no-return-await": "off"
  }
};
