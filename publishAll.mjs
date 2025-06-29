import { join } from "path";
import { spawn } from "child_process";
import {
  readdir,
  stat,
  access,
  constants as fsConstants,
  readFile,
} from "fs/promises";
import { Buffer } from "node:buffer";
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
  } catch (e) {
    return console.error(e);
  }

  try {
    const packageJSONContent = await readFile(packageJSONPath);
    const packageJSON = JSON.parse(packageJSONContent);
    return {
      name: packageJSON.name,
      version: packageJSON.version,
    };
  } catch (e) {
    return console.error(e);
  }
};

const getNPMVersion = async (name) => {
  const process = spawn("npm", ["info", name, "version"]);
  try {
    let readingStderr = false;
    const buffer = await new Promise((resolve, reject) => {
      process.stdout.on("data", resolve);
      process.stderr.on("data", (errBuffer) => {
        readingStderr = true;
        const errors = errBuffer.toString();
        const lines = errors.toString().split("\n");
        const first = lines[0];
        if (first.endsWith("code E404")) resolve(Buffer.from("0.0.0"));
      });
      process.on("close", (code) => {
        if (code != 0 && !readingStderr) {
          reject(
            new Error(
              `Process ${JSON.stringify(
                process.spawnargs,
              )} finished with non-zero code: ${code}`,
              { code, spawnargs: process.spawnargs },
            ),
          );
        }
      });
    });
    const data = buffer.toString();
    return data.trim();
  } catch (e) {
    console.error(e);
  }
};

const handlePackageJSON = async (path) => {
  const ourData = await getPackageJSONVersion(path);
  if (ourData === undefined) return;
  try {
    const npmVersion = await getNPMVersion(ourData.name);
    // console.log({
    //   name: ourData.name,
    //   npmVersion,
    //   ourVersion: ourData.version,
    // });
    if (npmVersion === undefined) return path;
    if (compareVersions(ourData.version, npmVersion) > 0) return path;
  } catch (e) {
    console.error(e);
  }
};

const handlePackageName = async (name) => {
  try {
    const packagePath = join(distDir, name);
    const packageStats = await stat(packagePath);
    if (packageStats.isDirectory()) {
      return await handlePackageJSON(packagePath);
    }
  } catch (e) {
    return console.error(e);
  }
};

(async () => {
  const results = [];
  // const dirHandlerPromices = [];
  for (const name of await readdir(distDir)) {
    // const promice = handlePackageName(name);
    // dirHandlerPromices.push(promice);
    results.push(await handlePackageName(name));
  }

  // const results = await Promise.all(dirHandlerPromices);
  const toPublishPaths = results.filter(Boolean);
  // console.log(toPublishPaths);
  for (const toPublish of toPublishPaths) await publish(toPublish);
})();
