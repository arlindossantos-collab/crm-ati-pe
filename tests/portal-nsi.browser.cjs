const {chromium}=require('playwright');
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
// Exercita snapshots independentes/atrasados e mudanças semânticas; todo Firebase permanece simulado.
const previous=fs.readFileSync('tests/seguranca-sessao.browser.cjs','utf8');
let stub=previous.split('const stub=String.raw`')[1].split('`;\n(async()=>')[0];
stub=stub.replace("(f[ref.collection]||[]).map(d=>snap(d.id||d.uid,d))","(f[ref.collection]||[]).filter(d=>(ref.args||[]).every(a=>!Array.isArray(a)||a[1]==='=='?(!Array.isArray(a)||d[a[0]]===a[2]):a[1]==='in'?a[2].includes(d[a[0]]):a[1]==='array-contains'?(d[a[0]]||[]).includes(a[2]):true)).map(d=>snap(d.id||d.uid,d))");
stub=stub.replace('const snap=(id,d)=>({id,exists:()=>!!d,data:()=>d});',`function copy(d){if(Array.isArray(d))return d.map(copy);if(d&&typeof d==='object')return Object.fromEntries((globalThis.__reverseRows?Object.entries(d).reverse():Object.entries(d)).map(([k,v])=>[k,copy(v)]));return d;}
const snap=(id,d)=>({id,exists:()=>!!d,data:()=>{if(!d)return d;const {id:_id,...data}=d;return copy(data);}});`);
const old='export function onSnapshot(ref,cb){const w={ref,cb,active:true};watchers.push(w);queueMicrotask(()=>{if(w.active)cb(snapshot(ref));});return ()=>w.active=false;}';
assert.ok(stub.includes(old));
stub=stub.replace(old,`export function onSnapshot(ref,cb,error){globalThis.__emit=emit;globalThis.__fail=fail;globalThis.__queries.push(ref);const w={ref,cb,error,active:true};watchers.push(w);queueMicrotask(()=>{if(w.active&&!(ref.collection==='setores'&&f.holdSectors))cb(snapshot(ref));});return ()=>w.active=false;}
function emit(col,id){return watchers.filter(w=>w.active&&w.ref.collection===col&&(!id||w.ref.id===id)).forEach(w=>w.cb(snapshot(w.ref)));}
function fail(col,field){return watchers.filter(w=>w.active&&w.ref.collection===col&&(!field||(w.ref.args||[]).some(a=>a[0]===field))).forEach(w=>w.error?.({code:'permission-denied',message:'Consulta recusada no teste'}));}`);
const now=Date.now(),localToday=new Date(now-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
const actions=['orgao.consultar','participantes.consultar','participantes.cadastrar','participantes.editar','eventos.consultar','inscricoes.consultar','inscricoes.criar','inscricoes.cancelar','comprovantes.consultar'];
const link={papel:'gestor_nsi',orgaoId:'a',setoresIds:[],situacao:'aprovado',inicio:now-60000,fim:now+3600000,revisao:now+1800000,titularUid:'',acoes:actions,operacoesVersao:'v1',aprovacaoGrgd:{responsavel:'',referencia:''},aprovacaoAutoridade:{responsavel:'',referencia:''},registradoPorUid:'admin',registradoEm:'fictício'};
const nsi={id:'nsi',uid:'nsi',nome:'Gestor fictício',email:'nsi@example.invalid',ativo:true,perfil:'comum',tipoUsuario:'externo',modulosPermitidos:[],acessoInstitucional:link};
const admin={id:'admin',uid:'admin',nome:'Administrador fictício',email:'admin@example.invalid',ativo:true,perfil:'admin',tipoUsuario:'interno'};
function fixture(me,extra={}){return {me,usuarios:[admin,nsi],orgaos:[{id:'a',nome:'Órgão A de demonstração',sigla:'DEMO-A'},{id:'b',nome:'Órgão B reservado'}],setores:[{id:'a1',nome:'Núcleo de TIC',orgaoId:'a',ativo:true},{id:'a2',nome:'Diretoria administrativa',orgaoId:'a',ativo:true},{id:'b1',nome:'Setor de outro órgão',orgaoId:'b',ativo:true}],colaboradores:[],inscricoes:[],historicoAlteracoes:[],eventos:[{id:'hoje',titulo:'Disponível hoje para o órgão A',dataInicio:localToday,eventoPublico:false,modeloInscricao:'institucional-v1',orgaosElegiveis:['a'],inscricoesAbertas:true,inscricaoInicio:now-60000,inscricaoFim:now+3600000,limiteVagas:10,inscritosCount:0,status:'Confirmado'},{id:'publico',titulo:'Evento público de demonstração',dataInicio:'2099-01-01',eventoPublico:true},{id:'privado-b',titulo:'Evento reservado do órgão B',dataInicio:'2099-01-01',eventoPublico:false,orgaosElegiveis:['b']}],...extra};}
(async()=>{
 fs.mkdirSync('test-results',{recursive:true});let browser;const errors=[];
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync('index.html'));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 async function open(me,extra={}){
  const context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.addInitScript(f=>{globalThis.__fixture=f;globalThis.__queries=[];globalThis.__transactions=[];globalThis.__refreshes=0;globalThis.__reauths=0;globalThis.__reverseRows=false;},fixture(me,extra));
  await page.route('https://cdn.tailwindcss.com/**',r=>r.fulfill({contentType:'application/javascript',body:''}));
  await page.route('https://www.gstatic.com/firebasejs/**',r=>r.fulfill({contentType:'application/javascript',headers:{'access-control-allow-origin':'*'},body:stub}));
  await page.route('**/*',r=>/googleapis\.com|firebaseio\.com|firebaseapp\.com/.test(r.request().url())?r.abort():r.fallback());
  await page.goto('http://127.0.0.1:'+server.address().port);if(process.env.PRGD_TEST_CSS)await page.addStyleTag({content:fs.readFileSync(process.env.PRGD_TEST_CSS,'utf8')});await page.locator('#main-content').waitFor({state:'visible'});return {context,page};
 }
 try{
  browser=await chromium.launch();
  {
   const {context,page}=await open(nsi,{holdSectors:true});
   await page.locator('#portal-resumo h3').filter({hasText:'Órgão A de demonstração'}).waitFor();
   await page.evaluate(()=>{globalThis.__titulos=[];new MutationObserver(()=>__titulos.push(document.querySelector('#portal-resumo h3')?.textContent||'')).observe(document.getElementById('portal-resumo'),{childList:true,subtree:true});});
   const assinaturas=await page.evaluate(()=>__queries.length);
   await page.locator('[data-tab="colaboradores"]').click();await page.locator('#btn-novo-colaborador').click();await page.locator('#colab-nome').fill('Colaboradora da diretoria');
   assert.equal(await page.locator('#colab-setorId').isDisabled(),true);assert.match(await page.locator('#colab-setores-msg').innerText(),/carregamento/);
   for(let i=0;i<3;i++)await page.evaluate(()=>{__reverseRows=!__reverseRows;__fixture.usuarios.find(u=>u.uid==='nsi').acessoInstitucional.registradoEm='metadado documental';__emit('usuarios','nsi');});
   assert.equal(await page.evaluate(()=>__queries.length),assinaturas,'Metadados e ordem dos campos não podem reiniciar as consultas.');
   assert.equal(await page.locator('#colab-nome').inputValue(),'Colaboradora da diretoria');assert.equal(await page.locator('#modal-colaborador').isVisible(),true);assert.deepEqual(await page.evaluate(()=>__titulos),[],'Nome confirmado deve permanecer estável.');
   await page.evaluate(()=>{__fixture.holdSectors=false;__emit('setores');});
   await page.locator('#colab-setorId option[value="a2"]').waitFor({state:'attached'});assert.equal(await page.locator('#colab-setorId option[value="b1"]').count(),0);
   assert.equal(await page.locator('#colab-nome').inputValue(),'Colaboradora da diretoria');await page.locator('#colab-setorId').selectOption('a2');await page.locator('#colab-emailInstitucional').fill('diretoria@example.invalid');await page.locator('#colab-salvar').click();await page.locator('#modal-colaborador').waitFor({state:'hidden'});
   const pessoa=await page.evaluate(()=>__fixture.colaboradores[0]);assert.equal(pessoa.setorId,'a2');assert.equal(pessoa.orgaoId,'a');
   await page.locator('#colaborador-setor-filtro').selectOption('a2');await page.locator('#portal-colaboradores').getByText(pessoa.nome,{exact:true}).waitFor();
   await page.locator('#colaborador-setor-filtro').selectOption('a1');assert.equal(await page.locator('#portal-colaboradores').getByText(pessoa.nome,{exact:true}).count(),0);await page.locator('#colaborador-setor-filtro').selectOption('');
   await page.screenshot({animations:'disabled',path:'test-results/portal-nsi-setores.png'});
   await page.locator('[data-tab="eventos"]').click();await page.locator('[data-inscrever-colaborador="hoje"]').waitFor();assert.match(await page.locator('#grid-eventos').innerText(),/Disponível hoje/);assert.ok(!(await page.locator('#grid-eventos').innerText()).includes('órgão B'));
   await page.screenshot({animations:'disabled',path:'test-results/portal-nsi-eventos.png'});
   await page.locator('[data-inscrever-colaborador="hoje"]').click();await page.locator('#insc-participante').selectOption(pessoa.id);await page.locator('#insc-confirmar').click();await page.locator('#modal-inscricao-institucional').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>__fixture.inscricoes[0].setorId),'a2');
   await page.evaluate(()=>__fail('eventos','orgaosElegiveis'));assert.equal(await page.locator('#grid-eventos article').count(),1);assert.match(await page.locator('#grid-eventos').innerText(),/Evento público/);assert.ok(!(await page.locator('#grid-eventos').innerText()).includes('Disponível hoje'));assert.match(await page.locator('#eventos-portal-status').innerText(),/Não foi possível/);
   await page.evaluate(()=>__emit('eventos'));await page.locator('[data-inscrever-colaborador="hoje"]').waitFor();
   await page.locator('[data-tab="meu_orgao"]').click();await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({animations:'disabled',path:'test-results/portal-nsi-mobile.png'});
   await page.evaluate(()=>{__fixture.usuarios.find(u=>u.uid==='nsi').acessoInstitucional.setoresIds=['a1'];__emit('usuarios','nsi');});
   await page.locator('[data-tab="colaboradores"]').click();assert.equal(await page.locator('#portal-colaboradores').getByText(pessoa.nome,{exact:true}).count(),0);
   await page.locator('#btn-novo-colaborador').click();assert.equal(await page.locator('#colab-setorId option[value="a2"]').count(),0);
   await page.locator('[data-target="modal-colaborador"]').click();await page.locator('#btn-executar-logout').click();await page.locator('#modal-login').waitFor({state:'visible'});assert.equal(await page.locator('#portal-resumo').innerHTML(),'');assert.equal(await page.locator('#portal-colaboradores').innerHTML(),'');assert.equal(await page.locator('#colab-nome').inputValue(),'');await context.close();
  }
  {
   const {context,page}=await open(nsi,{setores:[]});await page.locator('[data-tab="colaboradores"]').click();await page.locator('#btn-novo-colaborador').click();assert.equal(await page.locator('#colab-salvar').isDisabled(),true);assert.match(await page.locator('#colab-setores-msg').innerText(),/Usuários → Setores por órgão/);
   await page.evaluate(()=>__fail('setores'));assert.match(await page.locator('#colab-setores-msg').innerText(),/confirmar os setores/);assert.equal(await page.locator('#colab-salvar').isDisabled(),true);await context.close();
  }
  {
   const {context,page}=await open(admin);await page.locator('[data-tab="usuarios"]').click();await page.locator('[data-usuario-editar="nsi"]').click();
   for(const id of ['grgd-nome','grgd-ref','autoridade-nome','autoridade-ref'])assert.equal(await page.locator('#vinculo-'+id).inputValue(),'');
   await page.locator('#btn-salvar-edicao').click();await page.locator('#modal-detalhes').waitFor({state:'hidden'});
   assert.equal(await page.evaluate(()=>__fixture.usuarios.find(u=>u.uid==='nsi').acessoInstitucional.situacao),'aprovado');await context.close();
  }
  assert.deepEqual(errors,[]);console.log('Portal NSI: nome estável, snapshots independentes, setores atrasados/filtro/cadastro, eventos de hoje/elegibilidade, falhas, alteração real de escopo, referências opcionais e celular aprovados.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
