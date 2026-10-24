// Orquestra uma sessão descartável. Nunca utiliza projetos ou portas remotos.
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const {spawn, spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);

async function available(port) {
  await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', () => reject(Error(`Porta local ${port} ocupada. Encerre a outra sessão antes de iniciar; nenhum dado foi apagado.`)));
    probe.listen(port, '127.0.0.1', () => probe.close(resolve));
  });
}

(async () => {
  if (args.some(arg => arg !== '--test')) throw Error('Use sem argumentos ou com --test.');
  for (const [name, value] of Object.entries({FIRESTORE_EMULATOR_HOST:'127.0.0.1:8080', FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9099'})) {
    if (process.env[name] && process.env[name] !== value) throw Error(`${name} deve apontar a ${value}.`);
  }
  await Promise.all([4173, 4400, 4500, 8080, 9099, 9150].map(available));
  const env = {...process.env,
    PATH: path.dirname(process.execPath) + path.delimiter + process.env.PATH,
    XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME || path.join(root, '.firebase/config'),
    FIREBASE_EMULATORS_PATH: process.env.FIREBASE_EMULATORS_PATH || path.join(root, '.firebase/emulator-cache')};
  fs.mkdirSync(env.XDG_CONFIG_HOME, {recursive:true});
  fs.mkdirSync(env.FIREBASE_EMULATORS_PATH, {recursive:true});
  const prepared = spawnSync(process.execPath, ['scripts/homologacao/prepare.cjs'], {cwd:root, env, stdio:'inherit'});
  if (prepared.error) throw prepared.error;
  if (prepared.status !== 0) throw Error('Não foi possível preparar a cópia local.');
  const sessionDir = fs.mkdtempSync(path.join(root, '.firebase/session-'));
  const stopFile = path.join(sessionDir, 'stop');
  env.PRGD_SESSION_STOP_FILE = stopFile;
  const command = 'node scripts/homologacao/session.cjs' + (args.includes('--test') ? ' --test' : '');
  const child = spawn(process.execPath, [require.resolve('firebase-tools/lib/bin/firebase.js'),
    'emulators:exec', '--config', 'firebase.homologacao.json', '--only', 'auth,firestore',
    '--project', 'demo-prgd-usuarios', command], {cwd:root, env, stdio:'inherit'});
  // Encerrar primeiro a sessão permite ao emulators:exec limpar todos os serviços.
  const stop = () => fs.writeFileSync(stopFile, 'stop');
  const cleanup = () => {
    for (const signal of ['SIGINT','SIGTERM']) process.removeListener(signal, stop);
    fs.rmSync(sessionDir, {recursive:true, force:true});
  };
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal, stop);
  child.on('error', error => {cleanup(); console.error(error.message); process.exitCode = 1;});
  child.on('exit', (code, signal) => {
    const cancelled = args.includes('--test') && fs.existsSync(stopFile);
    cleanup();
    process.exitCode = cancelled ? 130 : (code ?? (signal ? 1 : 0));
  });
})().catch(error => {console.error(error.message); process.exitCode = 1;});
