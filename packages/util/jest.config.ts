import type { Config } from "jest";
import { createDefaultPreset } from "ts-jest";

const preset: Config = createDefaultPreset();

Object.assign(preset.transform!["^.+\\.tsx?$"]![1]!, { useESM: true });

preset.transform!["^.+\\.jsx?$"] = "babel-jest";
preset.modulePaths = ["../.."];
preset.moduleNameMapper = { "@shinka-rpc/(.*)$": "<rootDir>/../$1" };
preset.testMatch = [
  "**/__tests__/**/*.test.?([mc])[jt]s?(x)",
  "**/?(*.)+(spec|test).?([mc])[jt]s?(x)",
];

export default preset;
