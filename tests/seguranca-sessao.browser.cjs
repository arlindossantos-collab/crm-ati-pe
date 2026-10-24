const {chromium}=require('playwright');
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');

// Todo o Firebase é interceptado. Não lê nem altera contas ou dados de produção.
const base={
  me:{uid:'admin',nome:'Administrador de teste',email:'admin@example.invalid',perfil:'admin',tipoUsuario:'interno',ativo:true},
  usuarios:[{id:'admin',uid:'admin',nome:'Administrador de teste',email:'admin@example.invalid',perfil:'admin',tipoUsuario:'interno',ativo:true},
    {id:'outro',uid:'outro',nome:'Usuário de teste',email:'outro@example.invalid',perfil:'comum',tipoUsuario:'interno',ativo:true,modulosPermitidos:['eventos']}],
  locais:[{id:'l1',nome:'Auditório de teste',capacidade:80,tipoLocacao:'gratuito',recursos:['Projetor']}],
  demandas:[{id:'d1',titulo:'Demanda de teste',nome:'Demanda de teste',status:'Em Andamento',prioridade:'Média'}],
  eventos:[],historicoAlteracoes:[]
};
const stub=String.raw`
const f=globalThis.__fixture;const watchers=[];let seq=0;
const user=f.me?{...f.me,getIdToken:async()=>{globalThis.__refreshes++;return 'token-de-teste';}}:null;
const auth={currentUser:user};let authCallback;
export const browserLocalPersistence={},inMemoryPersistence={};
export function initializeApp(config,name){return {name};}export function getApps(){return [];}
export function getFirestore(){return {};}export function getAuth(){return auth;}
export function setPersistence(){return Promise.resolve();}
export function collection(db,name){return {collection:name};}
export function doc(db,col,id,...rest){if(arguments.length===1){col=db.collection;id='gerado-'+(++seq);}return {collection:col,id,path:[col,id,...rest].join('/')};}
export function query(ref,...args){return {...ref,args};}export function where(...args){return args;}
export function orderBy(...args){return args;}export function limit(n){return n;}export function startAfter(s){return s;}
export function increment(n){return {__increment:n};}
export function serverTimestamp(){return {toDate:()=>new Date('2026-10-21T15:00:00Z')};}
const snap=(id,d)=>({id,exists:()=>!!d,data:()=>d});
function read(ref){if(ref.path?.includes('/privado/'))return snap(ref.id,{});return snap(ref.id,(f[ref.collection]||[]).find(d=>(d.id||d.uid)===ref.id));}
function snapshot(ref){return ref.id?read(ref):{docs:(f[ref.collection]||[]).map(d=>snap(d.id||d.uid,d))};}
export async function getDoc(ref){return read(ref);}export async function getDocs(ref){return snapshot(ref);}
export function onSnapshot(ref,cb){const w={ref,cb,active:true};watchers.push(w);queueMicrotask(()=>{if(w.active)cb(snapshot(ref));});return ()=>w.active=false;}
export function onAuthStateChanged(a,cb){authCallback=cb;setTimeout(()=>cb(user),500);return ()=>{};}
export async function signOut(){auth.currentUser=null;await authCallback?.(null);}
export async function signInWithEmailAndPassword(){return {user};}
export const EmailAuthProvider={credential:(email,password)=>({email,password})};
export async function reauthenticateWithCredential(a,c){globalThis.__reauths++;if(c.password!=='senha-valida')throw {code:'auth/wrong-password'};}
export async function updatePassword(){}export async function createUserWithEmailAndPassword(){return {user};}export async function deleteUser(){}
export async function runTransaction(db,fn){
 const changes=[];await fn({get:getDoc,set:(ref,data,options)=>changes.push({ref,data,options}),delete:ref=>changes.push({ref,remover:true})});
 globalThis.__transactions.push(changes);
 for(const op of changes){
  const {ref}=op;if(ref.path.includes('/privado/'))continue;
  const rows=f[ref.collection]||(f[ref.collection]=[]),i=rows.findIndex(d=>(d.id||d.uid)===ref.id);
  if(op.remover){if(i>=0)rows.splice(i,1);continue;}
  const data={...(op.options?.merge&&i>=0?rows[i]:{}),...op.data,id:ref.id};for(const [k,v] of Object.entries(data))if(v&&typeof v==='object'&&'__increment' in v)data[k]=(rows[i]?.[k]||0)+v.__increment;
  if(i>=0)rows[i]=data;else rows.push(data);
 }
 watchers.filter(w=>w.active).forEach(w=>w.cb(snapshot(w.ref)));
}
`;
(async()=>{
 fs.mkdirSync('test-results',{recursive:true});
 const server=http.createServer(require('./helpers/browser.cjs').serveProjectAsset);
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 const errors=[];
 async function pageFor(fixture){
   const context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage();
   page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
   await page.addInitScript(f=>{
     globalThis.__fixture=f;globalThis.__transactions=[];globalThis.__reauths=0;globalThis.__refreshes=0;globalThis.__loginApareceu=false;globalThis.__loginFrames=[];
     new MutationObserver(()=>{const el=document.getElementById('modal-login');if(el&&getComputedStyle(el).display!=='none'){globalThis.__loginApareceu=true;if(globalThis.__loginFrames.length<5)globalThis.__loginFrames.push({classe:el.className,display:getComputedStyle(el).display,documento:document.readyState});}}).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
   },fixture);
   // Reproduz utilitários de display chegando após o HTML, durante os 500ms de restauração simulada.
   await page.route('https://cdn.tailwindcss.com/**',r=>r.fulfill({contentType:'application/javascript',body:"document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{const s=document.createElement('style');s.textContent='.flex{display:flex}';document.head.appendChild(s);},50));"}));
   await page.route('**/src/services/firebase.js',r=>r.fulfill({contentType:'application/javascript',headers:{'access-control-allow-origin':'*'},body:stub}));
   await page.route('**/*',r=>/googleapis\.com|firebaseio\.com|firebaseapp\.com/.test(r.request().url())?r.abort():r.fallback());
   await page.goto('http://127.0.0.1:'+server.address().port);if(process.env.PRGD_TEST_CSS)await page.addStyleTag({content:fs.readFileSync(process.env.PRGD_TEST_CSS,'utf8')});return {page,context};
 }
 try{
   browser=await chromium.launch();
   const {page,context}=await pageFor(base);
   await page.locator('#main-content').waitFor({state:'visible'});
   assert.equal(await page.evaluate(()=>globalThis.__loginApareceu),false,'Login não pode aparecer enquanto a sessão é recuperada: '+JSON.stringify(await page.evaluate(()=>globalThis.__loginFrames)));
   assert.equal(await page.locator('#user-name-display').isVisible(),true,'Identificação permanece visível no computador.');
   assert.equal(await page.getByRole('heading',{name:'Plataforma de Relacionamento do Governo Digital',exact:true}).isVisible(),true);
   await page.locator('[data-tab="colaboradores"]').click();await page.locator('[data-colab-secao="acessos"]').click();
   assert.equal(await page.locator('[data-usuario-excluir="admin"]').isDisabled(),true);
   await page.locator('[data-usuario-editar="outro"]').click();
   await page.locator('#usuario-nome').fill('Nome atualizado');await page.locator('#btn-salvar-edicao').click();await page.locator('#revisar-usuario-confirmar').click();
   await page.locator('#modal-detalhes').waitFor({state:'hidden'});
   await page.locator('#btn-historico-alteracoes').click();
   await page.locator('#historico-registros tr').filter({hasText:'Nome atualizado'}).waitFor();
   const historico=await page.locator('#historico-registros').innerText();
   assert.match(historico,/Administrador de teste/);assert.match(historico,/nome/);assert.match(historico,/21\/10\/2026/);
   await page.screenshot({path:'test-results/historico-alteracoes.png'});
   await page.locator('[data-target="modal-historico-alteracoes"]').click();
   await page.locator('[data-usuario-excluir="outro"]').click();
   assert.equal(await page.evaluate(()=>globalThis.__reauths),0);
   await page.locator('#exclusao-senha').fill('senha-incorreta');await page.locator('#exclusao-confirmar').click();
   await page.locator('#exclusao-erro').filter({hasText:/senha|credenciais|inválid/i}).waitFor();
   assert.equal(await page.locator('#exclusao-senha').inputValue(),'');
   assert.equal(await page.evaluate(()=>globalThis.__fixture.usuarios.find(u=>u.id==='outro').ativo),true);
   await page.locator('#exclusao-cancelar').click();
   await page.locator('#modal-detalhes [data-target="modal-detalhes"]').click();
   await page.locator('[data-usuario-excluir="outro"]').click();
   await page.screenshot({path:'test-results/confirmacao-exclusao.png'});
   await page.locator('#exclusao-senha').fill('senha-valida');await page.locator('#exclusao-confirmar').click();
   await page.locator('#modal-confirmar-exclusao').waitFor({state:'hidden'});
   assert.equal(await page.locator('[data-usuario-excluir="outro"]').count(),0);
   const lote=await page.evaluate(()=>globalThis.__transactions.at(-1));
   assert.ok(lote.some(op=>op.ref.collection==='historicoAlteracoes'&&op.data.acao==='excluir_usuario'));
   assert.ok(lote.some(op=>op.ref.collection==='usuarios'&&op.data.excluido===true));
   assert.ok(!JSON.stringify(lote).includes('senha-valida'));
   await page.locator('[data-tab="locais"]').click();await page.reload();if(process.env.PRGD_TEST_CSS)await page.addStyleTag({content:fs.readFileSync(process.env.PRGD_TEST_CSS,'utf8')});
   await page.locator('#main-content').waitFor({state:'visible'});
   assert.equal(await page.locator('#aba-locais').isVisible(),true,'F5 deve restaurar a mesma aba.');
   assert.equal(await page.evaluate(()=>globalThis.__loginApareceu),false,'F5 não deve mostrar o formulário de login.');
   await page.screenshot({path:'test-results/sessao-apos-f5.png'});
   await context.close();

   const comum=JSON.parse(JSON.stringify(base));comum.usuarios[1].modulosPermitidos=['demandas','locais','eventos'];comum.me={...comum.usuarios[1]};
   const leitura=await pageFor(comum);await leitura.page.locator('#main-content').waitFor({state:'visible'});
   assert.equal(await leitura.page.locator('#btn-historico-alteracoes').isVisible(),false);
   assert.equal(await leitura.page.locator('[data-usuario-excluir]').count(),0);
   await leitura.page.locator('[data-tab="demandas"]').click();
   await leitura.page.locator('.tr-detalhe[data-colecao="demandas"]').first().click();
   assert.equal(await leitura.page.locator('#btn-excluir-registro').isVisible(),false);
   await leitura.page.evaluate(()=>document.getElementById('btn-excluir-registro').classList.remove('hidden'));
   assert.equal(await leitura.page.locator('#btn-excluir-registro').isVisible(),false,'CSS impede visibilidade fora de administração.');
   await leitura.page.screenshot({path:'test-results/consulta-sem-exclusao.png'});await leitura.context.close();

   const semSessao=await pageFor({...base,me:null});await semSessao.page.locator('#modal-login').waitFor({state:'visible'});
   assert.equal(await semSessao.page.locator('#main-content').isVisible(),false);await semSessao.context.close();
   assert.deepEqual(errors,[]);
   console.log('Navegador: exclusão com senha, cancelamento, histórico, consulta sem exclusão e F5 sem login com mesma aba aprovados. Firebase simulado.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
