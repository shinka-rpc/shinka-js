import type { Config } from "jest";
import { createDefaultPreset } from "ts-jest";

const preset: Config = createDefaultPreset();

Object.assign(preset.transform!["^.+\\.tsx?$"]![1]!, { useESM: true });

preset.transform!["^.+\\.jsx?$"] = "babel-jest";
preset.testEnvironment = "node";
preset.modulePaths = ["../.."];
preset.moduleNameMapper = { "@shinka-rpc/(.*)$": "<rootDir>/../$1" };

export default preset;
