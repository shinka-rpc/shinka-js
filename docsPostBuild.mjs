import { join } from "path";
import { copyFile, readFile, writeFile } from "fs/promises";

const __dirname = new URL(import.meta.url + "/..").pathname;

const docsDir = join(__dirname, "docs");
const docsDistDir = join(docsDir, ".vitepress", "dist");

(async () => {
  const indexHTMLPath = join(docsDistDir, "index.html");
  let indexHTML = await readFile(indexHTMLPath, { encoding: "utf-8" });
  indexHTML = indexHTML.replaceAll(
    'src="./img/logo.png"',
    `src="${process.env.READTHEDOCS_VERSION_NAME || ""}/logo.png"`,
  );
  await writeFile(indexHTMLPath, indexHTML);
  await copyFile(
    join(docsDir, "img", "logo.png"),
    join(docsDistDir, "logo.png"),
  );
})();
