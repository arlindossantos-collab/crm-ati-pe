const fs = require("node:fs"),
  path = require("node:path"),
  acorn = require("acorn"),
  scope = require("eslint-scope");
const { root, sourceFiles, readIndexHtml } = require("./lib/source.cjs");
const globals = new Set(
  "window document console Date Object Array String encodeURIComponent alert Error Number Boolean sessionStorage FileReader JSON __PRGD_DEMO__ Intl Promise Map Set undefined clearTimeout setTimeout Math Chart crypto TextEncoder Uint8Array confirm URL Blob createImageBitmap WeakSet isNaN globalThis".split(
    " ",
  ),
);
let errors = [];
for (const file of sourceFiles()) {
  const code = fs.readFileSync(file, "utf8"),
    ast = acorn.parse(code, {
      ecmaVersion: 2022,
      sourceType: "module",
      ranges: true,
    });
  const scopes = scope.analyze(ast, {
    ecmaVersion: 2022,
    sourceType: "module",
  });
  for (const ref of scopes.globalScope.through)
    if (!globals.has(ref.identifier.name))
      errors.push(
        path.relative(root, file) +
          ": identificador sem origem " +
          ref.identifier.name,
      );
  for (const node of ast.body.filter((n) => n.type === "ImportDeclaration")) {
    if (file.endsWith("/services/firebase.js")) continue;
    if (!node.source.value.startsWith("."))
      errors.push(
        path.relative(root, file) + ": dependência fora da fronteira Firebase",
      );
    else if (
      !fs.existsSync(path.resolve(path.dirname(file), node.source.value))
    )
      errors.push("Import inexistente: " + node.source.value);
  }
}
const html = readIndexHtml(),
  ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
if (new Set(ids).size !== ids.length) errors.push("IDs HTML duplicados.");
if (
  [
    ...fs
      .readFileSync("index.html", "utf8")
      .matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g),
  ].some((m) => m[1].trim())
)
  errors.push("Script inline voltou ao HTML principal.");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    sourceFiles().length +
      " módulos com sintaxe/imports válidos; " +
      ids.length +
      " IDs de interface únicos.",
  );
