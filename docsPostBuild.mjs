import { join } from "path";
import { copyFile, readFile, writeFile } from "fs/promises";

const __dirname = new URL(import.meta.url + "/..").pathname;

const baseUrl = process.env.READTHEDOCS_VERSION_NAME
  ? `/${process.env.READTHEDOCS_VERSION_NAME}/`
  : "/";

const docsDir = join(__dirname, "docs");
const docsDistDir = join(docsDir, ".vitepress", "dist");

(async () => {
  const indexHTMLPath = join(docsDistDir, "index.html");
  let indexHTML = await readFile(indexHTMLPath, { encoding: "utf-8" });
  indexHTML = indexHTML
    .replaceAll('src="./img/logo.png"', `src="${baseUrl}assets/logo.png"`)
    .replaceAll('href="/img/favicon.png"', `href="${baseUrl}favicon.png"`);
  await writeFile(indexHTMLPath, indexHTML, { encoding: "utf-8" });
  await copyFile(
    join(docsDir, "img", "logo.png"),
    join(docsDistDir, "assets", "logo.png"),
  );
  await copyFile(
    join(docsDir, "img", "favicon.png"),
    join(docsDistDir, "favicon.png"),
  );
})();
