const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

const optsByKey = {
  "ts-jest": {
    useESM: true,
    tsconfig: "tsconfig.test.json",
  },
};

for (const entry of Object.values(tsJestTransformCfg)) {
  const [key, opts] = entry;
  if (Object.hasOwn(optsByKey, key))
    if (opts) Object.assign(opts, optsByKey[key]);
    else entry[1] = optsByKey[key];
}

tsJestTransformCfg["^.+\\.jsx?$"] = "babel-jest";

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
};
