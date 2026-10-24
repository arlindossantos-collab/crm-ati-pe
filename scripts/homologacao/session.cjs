// Executado pelo Firebase CLI somente depois de os dois emuladores estarem prontos.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawn, spawnSync} = require('node:child_process');
const {once} = require('node:events');
const root = path.resolve(__dirname, '../..');
const stopping = () => process.env.PRGD_SESSION_STOP_FILE && fs.existsSync(process.env.PRGD_SESSION_STOP_FILE);
assert.equal(process.env.GCLOUD_PROJECT, 'demo-prgd-usuarios');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080');
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:9099');

function run(script) {
  const result = spawnSync(process.execPath, [script], {cwd:root, env:process.env, stdio:'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error(`Falha em ${script}.`);
}

(async () => {
  if (stopping()) return;
  run('scripts/homologacao/seed.cjs');
  if (stopping()) return;
  const server = spawn(process.execPath, ['scripts/homologacao/serve.cjs'], {cwd:root, stdio:'inherit'});
  const finished = once(server, 'exit');
  const stopCheck = setInterval(() => {if (stopping()) server.kill('SIGTERM');}, 100);
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => server.kill(signal));
  try {
    const deadline = Date.now() + 15000;
    while (true) {
      if (stopping()) return;
      if (server.exitCode !== null) throw Error('Servidor local encerrou antes de ficar pronto.');
      try {
        const response = await fetch('http://127.0.0.1:4173', {signal:AbortSignal.timeout(1000)});
        if (response.ok && (await response.text()).includes('HOMOLOGAÇÃO LOCAL')) break;
      } catch {}
      if (Date.now() >= deadline) throw Error('Servidor local não ficou pronto em 15 segundos.');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (process.argv.includes('--test')) {
      run('scripts/homologacao/smoke.cjs');
      if (!stopping()) run('scripts/homologacao/piloto.cjs');
    } else {
      console.log('Abra http://127.0.0.1:4173 — dados fictícios. Ctrl+C encerra a sessão descartável.');
      const [code, signal] = await finished;
      if (code !== 0 && signal !== 'SIGINT' && signal !== 'SIGTERM') throw Error('Servidor local encerrou com falha.');
    }
  } finally {
    clearInterval(stopCheck);
    if (server.exitCode === null && server.signalCode === null) server.kill('SIGTERM');
    await finished;
  }
})().catch(error => {console.error(error.message); process.exitCode = 1;});
