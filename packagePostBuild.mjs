import { join, sep } from "path";
import { copyFile, readFile, writeFile } from "fs/promises";

const __dirname = new URL(import.meta.url + "/..").pathname;

const srcDir = process.cwd();
const srcPathArray = srcDir.split(sep);
const pkgName = srcPathArray.at(-1);
const descDir = join(__dirname, "dist", pkgName);

const handlePackageJSON = async () => {
  const package_json = "package.json";

  const packageJSON = JSON.parse(await readFile(join(srcDir, package_json)));

  delete packageJSON.exports;
  packageJSON.main = "./index.js";

  await writeFile(
    join(descDir, package_json),
    JSON.stringify(packageJSON, null, 2),
  );
};

const main = async () => {
  await Promise.all([
    copyFile(join(__dirname, "LICENSE"), join(descDir, "LICENSE")),
    copyFile(join(".", "README.md"), join(descDir, "README.md")),
    handlePackageJSON(),
  ]);
};

main();
