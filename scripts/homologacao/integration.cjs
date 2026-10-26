// Chamado por emulators:exec: testa o artefato com SDK real e dados descartáveis.
const { spawn } = require("node:child_process");
const path = require("node:path");
const { build } = require("../build.cjs");
const root = path.resolve(__dirname, "../..");
const env = {
  ...process.env,
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
};
function run(file) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, file)], {
      cwd: root,
      env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0 ? resolve() : reject(Error(file + " falhou: " + code)),
    );
  });
}
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
(async () => {
  // Não reutilizar um processo desconhecido que já esteja ocupando a porta.
  const net = require("node:net");
  await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", () =>
      reject(
        Error(
          "Porta 4173 ocupada; encerre o servidor local antes do ensaio integrado.",
        ),
      ),
    );
    probe.listen(4173, "127.0.0.1", () => probe.close(resolve));
  });
  await build({ mode: "demo", outdir: ".firebase/homologacao" });
  await run("seed.cjs");
  const server = spawn(process.execPath, [path.join(__dirname, "serve.cjs")], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  const closed = new Promise((resolve) => server.once("exit", resolve));
  let serverError;
  server.once("error", (err) => {
    serverError = err;
  });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (serverError) throw serverError;
      if (server.exitCode !== null)
        throw Error("Servidor de ensaio encerrou antes da prontidão.");
      try {
        const response = await fetch("http://127.0.0.1:4173", {
          signal: AbortSignal.timeout(1000),
        });
        if (
          response.ok &&
          (await response.text()).includes("DADOS FICTÍCIOS")
        ) {
          ready = true;
          break;
        }
      } catch {
        /* O servidor ainda pode estar inicializando. */
      }
      await delay(100);
    }
    if (!ready) throw Error("Servidor de ensaio não ficou pronto.");
    await run("smoke.cjs");
  } finally {
    if (server.exitCode === null) server.kill("SIGTERM");
    await closed;
  }
})().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
