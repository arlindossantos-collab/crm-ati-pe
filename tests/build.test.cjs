const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const { build } = require("../scripts/build.cjs"),
  { root, readIndexHtml } = require("../scripts/lib/source.cjs");
function files(dir, prefix = "") {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory()
        ? files(path.join(dir, e.name), prefix + e.name + "/")
        : [prefix + e.name],
    );
}
const digest = (dir) =>
  Object.fromEntries(
    files(dir)
      .sort()
      .map((file) => [
        file,
        crypto
          .createHash("sha256")
          .update(fs.readFileSync(path.join(dir, file)))
          .digest("hex"),
      ]),
  );
test("interface modular mantém os IDs de interação da versão publicada", () => {
  const before = require("./fixtures/ui-contract.json");
  const ids = [...readIndexHtml().matchAll(/\bid="([^"]+)"/g)]
    .map((m) => m[1])
    .sort();
  assert.deepEqual(ids, before.ids);
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.ok(index.split("\n").length < 100);
  assert.doesNotMatch(index, /<style>|<script type="module">/);
});
test("build produz artefato isolado, recursos locais e resultado reproduzível", async () => {
  await build();
  const dir = path.join(root, "dist"),
    before = digest(dir),
    html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  assert.doesNotMatch(
    html,
    /@include|\.\/src\/|cdn.tailwindcss|cdn.jsdelivr|cdnjs.cloudflare/,
  );
  for (const file of files(dir))
    assert.equal(fs.statSync(path.join(dir, file)).mode & 0o777, 0o644);
  assert.equal(fs.statSync(dir).mode & 0o777, 0o755);
  assert.ok(before["assets/app.js"]);
  assert.ok(before["assets/firebase.js"]);
  assert.ok(before["assets/app.css"]);
  assert.ok(before["previa-perfis.html"]);
  assert.equal(
    files(dir).some(
      (f) =>
        /^(src|tests|scripts|deploy|docs|node_modules)\//.test(f) ||
        /^firebase.*\.json$|^firestore\.|^package/.test(f),
    ),
    false,
  );
  const app = fs.readFileSync(path.join(dir, "assets/app.js"), "utf8");
  assert.match(app, /prgd-ati-pe.firebaseapp.com/);
  assert.match(app, /firebase\.js/);
  const legacy = fs.readFileSync(path.join(dir, "v0.40/index.html"), "utf8");
  assert.doesNotMatch(legacy, /firebaseConfig|signInWithEmailAndPassword/);
  await build();
  assert.deepEqual(digest(dir), before);
  await build({ mode: "demo", outdir: ".firebase/homologacao" });
  const demo = path.join(root, ".firebase/homologacao");
  assert.doesNotMatch(
    fs.readFileSync(path.join(demo, "assets/app.js"), "utf8"),
    /prgd-ati-pe.firebaseapp.com/,
  );
  assert.match(
    fs.readFileSync(path.join(demo, "index.html"), "utf8"),
    /DADOS FICTÍCIOS/,
  );
  assert.match(
    fs.readFileSync(path.join(demo, "firebase-local.js"), "utf8"),
    /assets\/firebase.js/,
  );
  await assert.rejects(build({ outdir: "src" }), /não autorizado/);
});
test("consulta de agenda pode ser reutilizada sem navegador ou Firebase", async () => {
  const { consultarAgendaEventos } = await import("../src/domain/agenda.js");
  const rows = [
    { titulo: "Formação", status: "Confirmado", dataInicio: "2099-01-01" },
  ];
  assert.equal(
    consultarAgendaEventos(rows, { busca: "formacao" }).eventos.length,
    1,
  );
});
