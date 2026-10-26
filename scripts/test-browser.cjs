const fs = require("node:fs"),
  path = require("node:path"),
  { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
for (const suite of fs
  .readdirSync(path.join(root, "tests"))
  .filter((name) => name.endsWith(".browser.cjs"))
  .sort()) {
  const result = spawnSync(
    process.execPath,
    [path.join(root, "tests", suite)],
    { cwd: root, stdio: "inherit", env: process.env },
  );
  if (result.status !== 0) process.exit(result.status || 1);
}
