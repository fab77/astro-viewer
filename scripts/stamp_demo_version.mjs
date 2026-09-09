import { readFile, writeFile } from "node:fs/promises";

const VERSION_TOKEN = "__ASTROVIEWER_VERSION__";
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const demoPath = "public/index.html";
const demoHtml = await readFile(demoPath, "utf8");

if (!demoHtml.includes(VERSION_TOKEN)) {
  throw new Error(`Demo version token ${VERSION_TOKEN} not found in ${demoPath}`);
}

await writeFile(
  demoPath,
  demoHtml.replaceAll(VERSION_TOKEN, packageJson.version),
);
