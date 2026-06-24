import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const failures = [];
const filesAllowlist = new Set(packageJson.files ?? []);

function requireFile(label, relativePath) {
  if (typeof relativePath !== "string" || relativePath.trim() === "") {
    failures.push(`${label} must be a non-empty path`);
    return;
  }

  const normalizedPath = relativePath.replace(/^\.\//, "");
  const fullPath = path.join(root, normalizedPath);

  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    failures.push(`${label} points at missing file: ${relativePath}`);
  }
}

requireFile("main", packageJson.main);
requireFile("types", packageJson.types);

for (const [name, binPath] of Object.entries(packageJson.bin ?? {})) {
  requireFile(`bin.${name}`, binPath);
}

const rootExport = packageJson.exports?.["."];
if (rootExport) {
  requireFile("exports[.].import", rootExport.import);
  requireFile("exports[.].types", rootExport.types);
}

for (const directory of ["docs", "examples", "fixtures", "scripts"]) {
  if (!filesAllowlist.has(directory)) {
    failures.push(`files allowlist must include ${directory}/`);
  }
}

if (failures.length > 0) {
  console.error("Package manifest validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Package manifest validation passed.");
