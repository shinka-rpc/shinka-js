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

const __dirname = new URL(import.meta.url + "/..").pathname;
const distDir = join(__dirname, "dist");

const publish = async (path) => {
  const options = {
    cwd: path,
    env: process.env,
    stdio: [process.stdin, process.stdout, process.stderr],
  };
  const args = ["publish"];
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

const getNPMVersions = async (name) => {
  const process = spawn("npm", ["info", "--json", name, "versions"]);
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
    if (!data) return;
    if (data[0] !== "[") return; // if not published, data === `"0.0.0"`
    return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
};

const handlePackageJSON = async (path) => {
  const ourData = await getPackageJSONVersion(path);
  if (ourData === undefined) return;
  try {
    const npmVersions = await getNPMVersions(ourData.name);
    if (npmVersions === undefined) return path;
    if (!new Set(npmVersions).has(ourData.version)) return path;
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
  // const dirHandlerPromises = [];
  for (const name of await readdir(distDir)) {
    // const promise = handlePackageName(name);
    // dirHandlerPromises.push(promise);
    results.push(await handlePackageName(name));
  }

  // const results = await Promise.all(dirHandlerPromises);
  const toPublishPaths = results.filter(Boolean);
  // console.log(toPublishPaths);
  for (const toPublish of toPublishPaths) await publish(toPublish);
})();
