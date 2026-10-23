const {chromium}=require('playwright');
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
// Testa as duas áreas com os mesmos fluxos reais da aplicação e Firebase inteiramente simulado.
const previous=fs.readFileSync('tests/seguranca-sessao.browser.cjs','utf8');
let stub=previous.split('const stub=String.raw`')[1].split('`;\n(async()=>')[0];
stub=stub.replace("(f[ref.collection]||[]).map(d=>snap(d.id||d.uid,d))","(f[ref.collection]||[]).filter(d=>(ref.args||[]).every(a=>!Array.isArray(a)||a[1]==='=='?(!Array.isArray(a)||d[a[0]]===a[2]):a[1]==='in'?a[2].includes(d[a[0]]):a[1]==='array-contains'?(d[a[0]]||[]).includes(a[2]):true)).map(d=>snap(d.id||d.uid,d))");
stub=stub.replace('const snap=(id,d)=>({id,exists:()=>!!d,data:()=>d});','const snap=(id,d)=>({id,exists:()=>!!d,data:()=>{if(!d)return d;const {id:_id,...data}=d;return data;}});');
stub=stub.replace('const w={ref,cb,active:true};','const w={ref,cb,error,active:true};');
stub=stub.replace('export function onSnapshot(ref,cb){','export function onSnapshot(ref,cb,error){globalThis.__fail=col=>watchers.filter(w=>w.active&&w.ref.collection===col).forEach(w=>w.error?.({code:"permission-denied",message:"Consulta recusada no teste"}));globalThis.__emit=(col,id)=>watchers.filter(w=>w.active&&w.ref.collection===col&&(!id||w.ref.id===id)).forEach(w=>w.cb(snapshot(w.ref)));globalThis.__queries.push(ref);');
const now=Date.now(),day=days=>new Date(now+days*86400000).toISOString().slice(0,10);
const acoes=['orgao.consultar','participantes.consultar','participantes.cadastrar','participantes.editar','eventos.consultar','inscricoes.consultar','inscricoes.criar','inscricoes.cancelar','comprovantes.consultar'];
const link={papel:'gestor_nsi',orgaoId:'orgao-a',setoresIds:['a1'],situacao:'aprovado',inicio:now-60000,fim:now+86400000*60,revisao:now+86400000*30,titularUid:'',acoes,operacoesVersao:'v1',aprovacaoGrgd:{responsavel:'',referencia:''},aprovacaoAutoridade:{responsavel:'',referencia:''},registradoPorUid:'admin',registradoEm:'fictício'};
const user=(uid,extra={})=>({id:uid,uid,nome:'Ana de demonstração',email:uid+'@example.invalid',ativo:true,perfil:'comum',tipoUsuario:'externo',modulosPermitidos:[],...extra});
const nsi=user('nsi',{acessoInstitucional:link}),sub=user('sub',{acessoInstitucional:{...link,papel:'substituto',titularUid:'nsi'}}),auditor=user('auditor',{tipoUsuario:'interno',acessoInstitucional:{...link,papel:'auditoria',operacoesVersao:'',acoes:['auditoria.consultar','relatorios.consultar']}});
const admin=user('admin',{perfil:'admin',tipoUsuario:'interno'}),grgd=user('grgd',{tipoUsuario:'interno',acessoInstitucional:{...link,papel:'grgd',orgaoId:'',setoresIds:[],operacoesVersao:'',acoes:['eventos.consultar','eventos.editar']}}),interno=user('interno',{tipoUsuario:'interno',modulosPermitidos:['eventos','demandas']}),externo=user('externo',{modulosPermitidos:['eventos']});
function fixture(me){return {me,usuarios:[me,...[admin,nsi,sub,auditor,grgd,interno,externo].filter(u=>u.uid!==me?.uid)],orgaos:[{id:'orgao-a',nome:'Secretaria de demonstração',sigla:'DEMO'},{id:'orgao-b',nome:'Órgão B reservado'}],setores:[{id:'a1',orgaoId:'orgao-a',nome:'Núcleo de TIC',ativo:true},{id:'a2',orgaoId:'orgao-a',nome:'Outro setor reservado',ativo:true}],
 colaboradores:[{id:'p1',nome:'Colaborador autorizado',emailInstitucional:'pessoa@example.invalid',orgaoId:'orgao-a',setorId:'a1',ativo:true},{id:'p2',nome:'Pessoa fora da delegação',orgaoId:'orgao-a',setorId:'a2',ativo:true}],
 inscricoes:[{id:'i1',eventId:'e1',orgaoId:'orgao-a',setorId:'a1',participanteNome:'Colaborador autorizado',situacao:'confirmada',protocolo:'DEMO-001'}],historicoAlteracoes:[{id:'h1',orgaoId:'orgao-a',setorId:'a1',autorNome:'Autor fictício',acao:'editar',registroNome:'Registro de demonstração'}],
 eventos:[{id:'e1',titulo:'Oficina de Governo Digital',dataInicio:day(7),eventoPublico:false,modeloInscricao:'institucional-v1',orgaosElegiveis:['orgao-a'],inscricoesAbertas:true,inscricaoInicio:now-60000,inscricaoFim:now+86400000,limiteVagas:40,inscritosCount:1,status:'Confirmado'},{id:'e2',titulo:'Encontro de relacionamento',dataInicio:day(14),eventoPublico:true},{id:'e3',titulo:'Evento reservado do órgão B',dataInicio:day(14),eventoPublico:false,orgaosElegiveis:['orgao-b']}]};}
(async()=>{
 fs.mkdirSync('test-results',{recursive:true});let browser;const errors=[];
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync('index.html'));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 async function open(me){
  const context=await browser.newContext({viewport:{width:1440,height:1060}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.addInitScript(f=>{globalThis.__fixture=JSON.parse(sessionStorage.getItem('__layoutFixture')||'null')||f;globalThis.__queries=[];globalThis.__transactions=[];globalThis.__reauths=0;globalThis.__refreshes=0;},fixture(me));
  await page.route('https://cdn.tailwindcss.com/**',r=>r.fulfill({contentType:'application/javascript',body:''}));
  await page.route('https://www.gstatic.com/firebasejs/**',r=>r.fulfill({contentType:'application/javascript',headers:{'access-control-allow-origin':'*'},body:stub}));
  await page.route('**/*',r=>/googleapis\.com|firebaseio\.com|firebaseapp\.com/.test(r.request().url())?r.abort():r.fallback());
  await page.goto('http://127.0.0.1:'+server.address().port);if(process.env.PRGD_TEST_CSS)await page.addStyleTag({content:fs.readFileSync(process.env.PRGD_TEST_CSS,'utf8')});await page.locator(me?'#main-content':'#modal-login').waitFor({state:'visible'});return {page,context};
 }
 const shot=(page,name)=>page.screenshot({animations:'disabled',path:'test-results/'+name+'.png',fullPage:true});
 try{
  browser=await chromium.launch();
  {
   const {page,context}=await open(nsi);await page.locator('#portal-orgao-nome').getByText('Secretaria de demonstração',{exact:true}).waitFor();
   assert.equal(await page.locator('body').getAttribute('data-layout'),'portal');assert.equal(await page.locator('#status-sessao').isVisible(),false);
   assert.equal(await page.locator('#portal-pagina-titulo').innerText(),'Meu órgão');assert.equal(await page.locator('[data-tab="usuarios"]').isVisible(),false);assert.equal(await page.locator('#btn-export-csv').isVisible(),false);
   const rect=await page.evaluate(()=>({nav:document.getElementById('app-navegacao').getBoundingClientRect().right,content:document.getElementById('app-conteudo').getBoundingClientRect().left}));assert.ok(rect.nav<=rect.content+1,'Menu ao lado do conteúdo no computador.');
   for(const [label,n]of [['Eventos disponíveis','2'],['Colaboradores ativos','1'],['Inscrições confirmadas','1']])assert.equal(await page.locator('.portal-card').filter({hasText:label}).locator('strong').innerText(),n);
   assert.ok(!(await page.locator('#portal-eventos-resumo').innerText()).includes('órgão B'));
   await shot(page,'portal-externo-inicio');
   await page.locator('[data-portal-cadastrar]').click();await page.locator('#modal-colaborador').waitFor({state:'visible'});assert.equal(await page.locator('[data-tab="colaboradores"]').getAttribute('aria-current'),'page');
   await page.locator('#colab-nome').fill('Nova pessoa pelo portal');await page.locator('#colab-emailInstitucional').fill('nova@example.invalid');await page.locator('#colab-setorId').selectOption('a1');await page.locator('#colab-salvar').click();await page.locator('#modal-colaborador').waitFor({state:'hidden'});await page.locator('#portal-colaboradores').getByText('Nova pessoa pelo portal',{exact:true}).waitFor();
   await shot(page,'portal-externo-colaboradores');await page.locator('[data-tab="meu_orgao"]').click();assert.equal(await page.locator('.portal-card').filter({hasText:'Colaboradores ativos'}).locator('strong').innerText(),'2');
   await page.locator('[data-portal-aba="eventos"]').click();await page.locator('[data-inscrever-colaborador="e1"]').waitFor();assert.equal(await page.locator('#portal-pagina-titulo').innerText(),'Eventos');await shot(page,'portal-externo-eventos');
   await page.evaluate(()=>sessionStorage.setItem('__layoutFixture',JSON.stringify(__fixture)));await page.reload();if(process.env.PRGD_TEST_CSS)await page.addStyleTag({content:fs.readFileSync(process.env.PRGD_TEST_CSS,'utf8')});await page.locator('#aba-eventos').waitFor({state:'visible'});assert.equal(await page.locator('body').getAttribute('data-layout'),'portal');assert.equal(await page.locator('[data-tab="eventos"]').getAttribute('aria-current'),'page');
   await page.setViewportSize({width:390,height:844});await page.locator('[data-tab="meu_orgao"]').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot(page,'portal-externo-mobile');
   await page.locator('[data-tab="colaboradores"]').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot(page,'portal-externo-colaboradores-mobile');
   await page.locator('#btn-meu-perfil').click();await page.locator('#modal-perfil').waitFor({state:'visible'});await page.locator('[data-target="modal-perfil"]').click();
   await page.locator('[data-tab="meu_orgao"]').click();await page.evaluate(()=>__fail('colaboradores'));assert.equal(await page.locator('.portal-card').filter({hasText:'Colaboradores ativos'}).locator('strong').innerText(),'—');
   await page.locator('#btn-executar-logout').click();await page.locator('#modal-login').waitFor({state:'visible'});assert.equal(await page.locator('#portal-orgao-nome').textContent(),'');assert.equal(await page.locator('#portal-indicadores').innerHTML(),'');assert.equal(await page.locator('#portal-eventos-resumo').innerHTML(),'');await context.close();
  }
  for(const me of [admin,grgd,interno]){
   const {page,context}=await open(me);assert.equal(await page.locator('body').getAttribute('data-layout'),'interna');assert.equal(await page.locator('#portal-topo').isVisible(),false);assert.equal(await page.locator('#status-sessao').isVisible(),true);if(me.uid==='admin'){assert.equal(await page.locator('[data-tab="usuarios"]').isVisible(),true);await shot(page,'area-interna-admin');}await context.close();
  }
  for(const me of [sub,auditor,externo]){
   const {page,context}=await open(me);assert.equal(await page.locator('body').getAttribute('data-layout'),'portal');assert.equal(await page.locator('[data-tab="usuarios"]').isVisible(),false);
   if(me.uid==='sub')assert.equal(await page.locator('#portal-pagina-titulo').innerText(),'Minha delegação');
   if(me.uid==='auditor'){await page.locator('[data-tab="auditoria_orgao"]').click();await page.locator('#portal-auditoria').getByText('Autor fictício').waitFor();assert.equal(await page.locator('[data-portal-cadastrar]').count(),0);assert.ok(!(await page.evaluate(()=>__queries)).some(q=>q.collection==='orgaos'));await shot(page,'portal-externo-auditoria');}
   if(me.uid==='externo'){assert.equal(await page.locator('#portal-pagina-titulo').innerText(),'Eventos');assert.equal(await page.locator('[data-tab="colaboradores"]').isVisible(),false);await page.locator('[data-acao-inscricao="e2"]').waitFor();}
   await context.close();
  }
  {
   const {page,context}=await open({...nsi,acessoInstitucional:{...link,situacao:'pendente'}});assert.equal(await page.locator('body').getAttribute('data-layout'),'portal');assert.equal(await page.locator('#aviso-sem-modulos').isVisible(),true);assert.equal(await page.locator('#portal-pagina-titulo').innerText(),'Acesso em análise');assert.equal(await page.locator('#portal-indicadores').innerHTML(),'');await context.close();
  }
  {
   const {page,context}=await open(nsi);await page.locator('#portal-orgao-nome').getByText('Secretaria de demonstração').waitFor();
   await page.evaluate(()=>{const u=__fixture.usuarios.find(u=>u.uid==='nsi');u.tipoUsuario='interno';u.acessoInstitucional={...u.acessoInstitucional,papel:'grgd',orgaoId:'',setoresIds:[],operacoesVersao:'',acoes:['eventos.consultar']};__emit('usuarios','nsi');});
   await page.waitForFunction(()=>document.body.dataset.layout==='interna');assert.equal(await page.locator('#portal-topo').isVisible(),false);assert.equal(await page.locator('#portal-indicadores').innerHTML(),'');assert.equal(await page.locator('[data-tab="colaboradores"]').isVisible(),false);await context.close();
  }
  assert.deepEqual(errors,[]);console.log('Layout por perfil: portal NSI/substituto/auditoria/externo, área interna admin/GRGD/legado, indicadores com escopo, atalhos reais, F5, perfil, troca de papel, logout e celular aprovados.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
