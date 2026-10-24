const fs = require("node:fs"),
  path = require("node:path"),
  acorn = require("acorn");
const root = path.resolve(__dirname, "../..");
function sourceFiles(directory = path.join(root, "src")) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? sourceFiles(path.join(directory, entry.name))
        : entry.name.endsWith(".js")
          ? [path.join(directory, entry.name)]
          : [],
    )
    .sort();
}
function readIndexHtml() {
  const seen = new Set();
  function expand(file) {
    const full = path.resolve(root, file);
    if (
      (file !== "index.html" &&
        (!full.startsWith(path.join(root, "src/views") + path.sep) ||
          !full.endsWith(".html"))) ||
      seen.has(full)
    )
      throw Error("Template inválido/cíclico: " + file);
    seen.add(full);
    const html = fs
      .readFileSync(full, "utf8")
      .replace(/<!-- @include ([^\s]+) -->/g, (_, name) => expand(name));
    seen.delete(full);
    return html;
  }
  return expand("index.html");
}
function parse(code) {
  return acorn.parse(code, { ecmaVersion: 2022, sourceType: "module" });
}
function stripModuleSyntax(code) {
  const edits = [];
  for (const node of parse(code).body) {
    if (node.type === "ImportDeclaration")
      edits.push({ start: node.start, end: node.end, text: "" });
    else if (node.type === "ExportNamedDeclaration") {
      if (!node.declaration) {
        edits.push({ start: node.start, end: node.end, text: "" });
        continue;
      }
      edits.push({ start: node.start, end: node.declaration.start, text: "" });
    }
  }
  for (const e of edits.sort((a, b) => b.start - a.start))
    code = code.slice(0, e.start) + e.text + code.slice(e.end);
  return code;
}
function readApplicationSource() {
  const state = path.join(root, "src/app/state.js"),
    config = path.join(root, "src/config/firebase.js"),
    bootstrap = path.join(root, "src/app/bootstrap.js");
  const files = [
    state,
    config,
    ...sourceFiles().filter(
      (f) =>
        ![
          state,
          config,
          bootstrap,
          path.join(root, "src/main.js"),
          path.join(root, "src/services/firebase.js"),
        ].includes(f),
    ),
    bootstrap,
  ];
  let code = files
    .map((file) => stripModuleSyntax(fs.readFileSync(file, "utf8")))
    .join("\n");
  const start = parse(fs.readFileSync(bootstrap, "utf8")).body.find(
    (n) => n.type === "ExportNamedDeclaration",
  ).declaration;
  const names = start.body.body
    .filter(
      (n) =>
        n.type === "ExpressionStatement" &&
        n.expression.type === "AssignmentExpression" &&
        n.expression.left.type === "MemberExpression" &&
        n.expression.left.object.name === "prgdState",
    )
    .map((n) => n.expression.left.property.name);
  // Somente para o harness VM: getters apontam ao estado real; nenhuma cópia da lógica.
  code +=
    "\n" +
    [...new Set(names)]
      .map(
        (name) =>
          `Object.defineProperty(globalThis,${JSON.stringify(name)},{configurable:true,get(){return prgdState[${JSON.stringify(name)}]},set(v){prgdState[${JSON.stringify(name)}]=v}});`,
      )
      .join("\n");
  return code + "\nbootstrap();\n";
}
function readFunctionSource(name) {
  for (const file of sourceFiles().filter(
    (f) => !f.endsWith("/services/firebase.js"),
  )) {
    const code = fs.readFileSync(file, "utf8"),
      node = parse(code).body.find(
        (n) =>
          n.type === "ExportNamedDeclaration" &&
          n.declaration?.id?.name === name,
      )?.declaration;
    if (node) return code.slice(node.start, node.end);
  }
  throw Error("Função não encontrada: " + name);
}
module.exports = {
  root,
  sourceFiles,
  readIndexHtml,
  readApplicationSource,
  readFunctionSource,
};
