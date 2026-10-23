// Gera somente arquivos ignorados. O HTML de produção permanece intacto.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const tools = process.env.PRGD_BROWSER_TOOLS || '/workspace/tools/prgd-browser/node_modules';
const esbuild = require(path.join(tools, 'esbuild'));
const output = path.join(root, '.firebase/homologacao');
fs.mkdirSync(output, {recursive:true});
function replaceOnce(input, expression, replacement) {
  const matches = [...input.matchAll(new RegExp(expression.source, 'g'))];
  if (matches.length !== 1) throw Error('A base mudou: revisar transformação '+expression);
  return input.replace(expression, replacement);
}
(async()=>{
 let html = fs.readFileSync(path.join(root,'index.html'),'utf8');
 html = replaceOnce(html, /const firebaseConfig = \{[\s\S]*?\n        \};/, 'const firebaseConfig = {apiKey:"demo-local-key",projectId:"demo-prgd-usuarios",authDomain:"demo-prgd-usuarios.firebaseapp.com"};');
 for (const component of ['app','auth','firestore']) {
   html = replaceOnce(html, new RegExp('https://www\\.gstatic\\.com/firebasejs/10\\.8\\.0/firebase-'+component+'\\.js'), './firebase-local.js');
 }
 html = replaceOnce(html, /<script src="https:\/\/cdn.tailwindcss.com"><\/script>/, '<link rel="stylesheet" href="./tailwind.css">');
 html = replaceOnce(html, /https:\/\/cdnjs.cloudflare.com\/ajax\/libs\/font-awesome\/6.4.0\/css\/all.min.css/, './fontawesome/css/all.min.css');
 html = replaceOnce(html, /https:\/\/cdn.jsdelivr.net\/npm\/chart.js/, './chart.js');
 html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, '<title>PRGD — HOMOLOGAÇÃO LOCAL — DADOS FICTÍCIOS</title>');
 html = replaceOnce(html, /<body[^>]*>/, '$&<div style="position:fixed;bottom:0;left:0;right:0;z-index:99999;font-size:12px;background:#fef3c7;color:#78350f;padding:10px;text-align:center">HOMOLOGAÇÃO LOCAL • DADOS FICTÍCIOS • SEM CONEXÃO À PRODUÇÃO</div>');
 if (html.includes('prgd-ati-pe.firebaseapp.com') || html.includes('AIzaSy')) throw Error('Configuração original não removida.');
 await esbuild.build({stdin:{contents:`
 export * from 'firebase/app';
 export * from 'firebase/auth';
 export * from 'firebase/firestore';
 import {initializeApp as initializeBase} from 'firebase/app';
 import {getAuth as authBase,connectAuthEmulator} from 'firebase/auth';
 import {getFirestore as dbBase,connectFirestoreEmulator} from 'firebase/firestore';
 const connectedAuth=new WeakSet(),connectedDb=new WeakSet();
 export function initializeApp(options,name){
   if(options.projectId!=='demo-prgd-usuarios')throw Error('Somente projeto demo local permitido.');
   return initializeBase(options,name);
 }
 export function getAuth(app){const auth=authBase(app);if(!connectedAuth.has(auth)){connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectedAuth.add(auth);}return auth;}
 export function getFirestore(app){const db=dbBase(app);if(!connectedDb.has(db)){connectFirestoreEmulator(db,'127.0.0.1',8080);connectedDb.add(db);}return db;}
 `,resolveDir:root},bundle:true,format:'esm',outfile:path.join(output,'firebase-local.js')});
 await esbuild.build({entryPoints:[path.join(tools,'chart.js/auto/auto.js')],bundle:true,format:'iife',globalName:'ChartBundle',footer:{js:'window.Chart=ChartBundle.default;'},outfile:path.join(output,'chart.js')});
 execFileSync(process.execPath,[path.join(tools,'tailwindcss/lib/cli.js'),'-i',path.join(root,'tests/tailwind-input.css'),'--content',path.join(root,'index.html'),'-o',path.join(output,'tailwind.css'),'--minify'],{stdio:'inherit',cwd:root});
 fs.cpSync(path.join(tools,'@fortawesome/fontawesome-free'),path.join(output,'fontawesome'),{recursive:true});
 fs.writeFileSync(path.join(output,'index.html'),html);
 console.log('Cópia local gerada em .firebase/homologacao; produção preservada.');
})().catch(e=>{console.error(e);process.exitCode=1;});
