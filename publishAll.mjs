import { join } from "path";
import { spawn } from "child_process";
import {
  readdir,
  stat,
  access,
  constants as fsConstants,
  readFile,
} from "fs/promises";
import { compareVersions } from "compare-versions";

const __dirname = new URL(import.meta.url + "/..").pathname;
const distDir = join(__dirname, "dist");

const publish = async (path) => {
  const options = {
    cwd: path,
    env: process.env,
    stdio: [process.stdin, process.stdout, process.stderr],
  };
  const args = ["publish", "--access", "public"];
  const publishProcess = spawn("npm", args, options);
  await new Promise((resolve, reject) => publishProcess.on("exit", resolve));
};

const getPackageJSONVersion = async (path) => {
  const packageJSONPath = join(path, "package.json");

  try {
    await access(packageJSONPath, fsConstants.R_OK);
  } catch {
    return;
  }

  try {
    const packageJSONContent = await readFile(packageJSONPath);
    const packageJSON = JSON.parse(packageJSONContent);
    return {
      name: packageJSON.name,
      version: packageJSON.version,
    };
  } catch {
    return;
  }
};

const getNPMVersion = async (name) => {
  const process = spawn("npm", ["info", name, "version"]);
  const buffer = await new Promise((resolve, reject) =>
    process.stdout.on("data", resolve),
  );
  const data = buffer.toString();
  return data.trim();
};

const handlePackageJSON = async (path) => {
  const ourData = await getPackageJSONVersion(path);
  if (ourData === undefined) return;
  const npmVersion = await getNPMVersion(ourData.name);
  if (compareVersions(ourData.version, npmVersion) > 0) {
    return path;
  }
};

const handlePackageName = async (name) => {
  try {
    const packagePath = join(distDir, name);
    const packageStats = await stat(packagePath);
    if (packageStats.isDirectory()) {
      return await handlePackageJSON(packagePath);
    }
  } catch {
    return;
  }
};

(async () => {
  const dirHandlerPromices = [];
  for (const name of await readdir(distDir)) {
    const promice = handlePackageName(name);
    dirHandlerPromices.push(promice);
  }

  const results = Promise.all(dirHandlerPromices);
  const toPublishPaths = (await results).filter(Boolean);
  for (const toPublish of toPublishPaths) await publish(toPublish);
})();
