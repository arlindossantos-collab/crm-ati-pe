const fs = require("node:fs"),
  path = require("node:path"),
  esbuild = require("esbuild"),
  { execFileSync } = require("node:child_process");
const { root, readIndexHtml } = require("./lib/source.cjs");
async function build({ mode = "production", outdir = "dist" } = {}) {
  if (!["production", "demo"].includes(mode))
    throw Error("Modo de build inválido.");
  if (!["dist", ".firebase/homologacao"].includes(outdir))
    throw Error("Diretório de saída não autorizado.");
  const output = path.join(root, outdir),
    assets = path.join(output, "assets"),
    demo = mode === "demo";
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(assets, { recursive: true });
  const options = {
    bundle: true,
    platform: "browser",
    target: "es2022",
    format: "esm",
    minify: true,
    legalComments: "external",
    define: { __PRGD_DEMO__: String(demo) },
    logLevel: "warning",
  };
  await esbuild.build({
    ...options,
    entryPoints: [path.join(root, "src/services/firebase.js")],
    outfile: path.join(assets, "firebase.js"),
  });
  const application = await esbuild.build({
    ...options,
    metafile: true,
    entryPoints: [path.join(root, "src/main.js")],
    outfile: path.join(assets, "app.js"),
    plugins: [
      {
        name: "firebase-boundary",
        setup(builder) {
          builder.onResolve({ filter: /firebase\.js$/ }, (args) =>
            path.resolve(path.dirname(args.importer), args.path) ===
            path.join(root, "src/services/firebase.js")
              ? { path: "./firebase.js", external: true }
              : undefined,
          );
        },
      },
    ],
  });
  if (
    Object.keys(application.metafile.inputs).some((file) =>
      file.includes("node_modules/"),
    )
  )
    throw Error("SDK duplicado no bundle da aplicação.");
  await esbuild.build({
    entryPoints: [path.join(root, "node_modules/chart.js/auto/auto.js")],
    bundle: true,
    minify: true,
    format: "iife",
    globalName: "ChartBundle",
    footer: { js: "window.Chart=ChartBundle.default;" },
    legalComments: "external",
    outfile: path.join(assets, "chart.js"),
  });
  execFileSync(
    process.execPath,
    [
      path.join(root, "node_modules/tailwindcss/lib/cli.js"),
      "-i",
      "src/styles/tailwind.css",
      "--content",
      "index.html,src/**/*.{html,js}",
      "-o",
      path.join(assets, "tailwind.css"),
      "--minify",
    ],
    { cwd: root, stdio: "pipe" },
  );
  fs.copyFileSync(
    path.join(root, "src/styles/main.css"),
    path.join(assets, "app.css"),
  );
  const fa = path.join(root, "node_modules/@fortawesome/fontawesome-free");
  fs.mkdirSync(path.join(assets, "fontawesome/css"), { recursive: true });
  fs.copyFileSync(
    path.join(fa, "css/all.min.css"),
    path.join(assets, "fontawesome/css/all.min.css"),
  );
  fs.cpSync(
    path.join(fa, "webfonts"),
    path.join(assets, "fontawesome/webfonts"),
    { recursive: true },
  );
  const publicDir = path.join(root, "public");
  function checkPublic(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink() || entry.name.startsWith("."))
        throw Error("Arquivo público não permitido.");
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) checkPublic(full);
      else if (
        !/\.(html|png|jpe?g|svg|webp|ico|txt|woff2?|ttf)$/i.test(entry.name)
      )
        throw Error("Extensão não publicável: " + entry.name);
    }
  }
  if (fs.existsSync(publicDir)) {
    checkPublic(publicDir);
    fs.cpSync(publicDir, output, { recursive: true });
  }
  let html = readIndexHtml()
    .replace("./src/main.js", "./assets/app.js")
    .replace("./src/styles/main.css", "./assets/app.css");
  if (demo) {
    html = html.replace(
      /<title>[\s\S]*?<\/title>/,
      "<title>PRGD — HOMOLOGAÇÃO LOCAL — DADOS FICTÍCIOS</title>",
    );
    html = html.replace(
      /<body[^>]*>/,
      '$&<div class="demo-banner">HOMOLOGAÇÃO LOCAL • DADOS FICTÍCIOS • SEM CONEXÃO À PRODUÇÃO</div>',
    );
    fs.appendFileSync(
      path.join(assets, "app.css"),
      "\n.demo-banner{position:fixed;bottom:0;left:0;right:0;z-index:99999;font-size:12px;background:#fef3c7;color:#78350f;padding:10px;text-align:center}\n",
    );
    fs.writeFileSync(
      path.join(output, "firebase-local.js"),
      "export * from './assets/firebase.js';\n",
    );
    if (
      fs
        .readFileSync(path.join(assets, "app.js"), "utf8")
        .includes("prgd-ati-pe.firebaseapp.com")
    )
      throw Error("Build demo contém configuração de produção.");
  }
  fs.writeFileSync(path.join(output, "index.html"), html);
  fs.writeFileSync(path.join(output, ".nojekyll"), "");
  const licenses = path.join(assets, "licenses");
  fs.mkdirSync(licenses, { recursive: true });
  for (const name of [
    "firebase",
    "chart.js",
    "@fortawesome/fontawesome-free",
  ]) {
    const location = path.join(root, "node_modules", name);
    const license = fs
      .readdirSync(location)
      .find((f) => /^licen[cs]e/i.test(f));
    if (license)
      fs.copyFileSync(
        path.join(location, license),
        path.join(licenses, name.replaceAll("/", "-") + "-" + license),
      );
  }
  // Artefato público deve ser legível pelo usuário de serviço da VM/Nginx,
  // independentemente da umask privada usada no workspace de desenvolvimento.
  function publicPermissions(directory) {
    fs.chmodSync(directory, 0o755);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) publicPermissions(full);
      else fs.chmodSync(full, 0o644);
    }
  }
  publicPermissions(output);
  return { output, mode };
}
if (require.main === module) {
  const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => arg.replace(/^--/, "").split("=")),
  );
  build({ mode: args.mode || "production", outdir: args.outdir || "dist" })
    .then(({ output, mode }) =>
      console.log(
        "Build " + mode + " concluído: " + path.relative(root, output),
      ),
    )
    .catch((err) => {
      console.error(err.message);
      process.exitCode = 1;
    });
}
module.exports = { build };
