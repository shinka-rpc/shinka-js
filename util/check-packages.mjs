import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { packagesDir } from "./lib/paths.mjs";

(async () => {
  for (const pkg of await readdir(packagesDir)) {
    const packageJsonPath = join(packagesDir, pkg, "package.json");
    const packageJSON = JSON.parse(await readFile(packageJsonPath));
    if (packageJSON.name.split("/").at(-1) !== pkg)
      console.error({ pkg, reason: "Package name mismatch" });
    if (packageJSON.repository?.directory !== `packages/${pkg}`)
      console.error({ pkg, reason: "Repository directory mismatch" });

    const tsCfgPath = join(packagesDir, pkg, "tsconfig.common.json");
    const tsCfg = JSON.parse(await readFile(tsCfgPath));

    if (tsCfg.compilerOptions?.outDir.split("/").at(-1) !== pkg)
      console.error({ pkg, reason: "tsconfig outDir mismatch" });
  }
})();
