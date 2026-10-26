const path = require("node:path"),
  fs = require("node:fs"),
  { build } = require("./build.cjs");
const root = path.resolve(__dirname, "..");
const watchers = [];
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => {
    stopping = true;
    clearTimeout(timer);
    for (const watcher of watchers) watcher.close();
  });
let building = false,
  pending = false,
  timer;
async function refresh() {
  if (stopping) return;
  if (building) {
    pending = true;
    return;
  }
  building = true;
  try {
    await build({ mode: "demo", outdir: ".firebase/homologacao" });
    console.log("Fontes recompiladas. Atualize o navegador.");
  } catch (err) {
    console.error(err.message);
  } finally {
    building = false;
    if (pending) {
      pending = false;
      refresh();
    }
  }
}
(async () => {
  await build({ mode: "demo", outdir: ".firebase/homologacao" });
  require("./homologacao/serve.cjs");
  watchers.push(
    fs.watch(path.join(root, "src"), { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 150);
    }),
  );
  watchers.push(
    fs.watch(path.join(root, "index.html"), () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 150);
    }),
  );
  console.log(
    "Desenvolvimento isolado: emuladores necessários. Produção não é usada neste modo.",
  );
})().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
