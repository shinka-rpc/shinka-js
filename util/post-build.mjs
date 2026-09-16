import { join, sep } from "path";
import { copyFile, readFile, writeFile } from "fs/promises";
import { distDir, rootDir } from "./lib/paths.mjs";

const srcDir = process.cwd();
const srcPathArray = srcDir.split(sep);
const pkgName = srcPathArray.at(-1);
const descDir = join(distDir, pkgName);

const handlePackageJSON = async () => {
  const package_json = "package.json";

  const packageJSON = JSON.parse(await readFile(join(srcDir, package_json)));

  delete packageJSON.exports;
  packageJSON.main = "./index.js";
  // packageJSON.exports = { types: "./index.d.ts" };

  await writeFile(
    join(distDir, package_json),
    JSON.stringify(packageJSON, null, 2),
  );
};

(async () => {
  await Promise.all([
    copyFile(join(rootDir, "LICENSE"), join(descDir, "LICENSE")),
    copyFile(join(".", "README.md"), join(descDir, "README.md")),
    handlePackageJSON(),
  ]);
})();
