import type { Config } from "jest";

const config: Config = {
  transform: { "^.+\\.(t|j)sx?$": "@swc/jest" },
  modulePaths: ["../.."],
  moduleNameMapper: {
    "@shinka-rpc\\/([^\\/]+)$": "<rootDir>/../$1/src",
    "@shinka-rpc\\/([^\\/]+)/(.*)$": "<rootDir>/../$1/src/$2",
  },
  testMatch: [
    "**/__tests__/**/*.test.?([mc])[jt]s?(x)",
    "**/?(*.)+(spec|test).?([mc])[jt]s?(x)",
  ],
};

export default config;
