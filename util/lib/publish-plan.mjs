import {
  readdir,
  stat,
  access,
  constants as fsConstants,
  readFile,
} from "fs/promises";
import { spawn } from "child_process";
import { join } from "path";
import { packagesDir, distDir } from "./paths.mjs";

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
    if (!data) return [];
    if (data[0] !== "[") return []; // if not published, data === `"0.0.0"`
    return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
};

const handlePackageJSON = async (path) => {
  const ourData = await getPackageJSONVersion(path);
  if (ourData === undefined) return;
  const { name, version } = ourData;
  try {
    const versions = await getNPMVersions(ourData.name);
    const publish =
      versions === undefined ? true : !new Set(versions).has(version);
    return { name, path, dist: 0, version, versions, publish };
  } catch (e) {
    console.error(e);
  }
};

const handlePackageName = async (root, name) => {
  try {
    const packagePath = join(root, name);
    const packageStats = await stat(packagePath);
    if (packageStats.isDirectory()) {
      const jsonContent = await handlePackageJSON(packagePath);
      jsonContent.dist = join(distDir, name);
      return jsonContent;
    }
  } catch (e) {
    return console.error(e);
  }
};

export const publishPlan = async () => {
  const dirNames = await readdir(packagesDir);
  for (let i = 0; i < dirNames.length; i++)
    dirNames[i] = await handlePackageName(packagesDir, dirNames[i]);
  return dirNames;
};
