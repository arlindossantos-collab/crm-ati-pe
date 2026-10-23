const {chromium}=require('playwright');
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
// Firebase é simulado por inteiro. Esta suíte não acessa pessoas, eventos ou contas institucionais.
const previous=fs.readFileSync('tests/seguranca-sessao.browser.cjs','utf8');
let stub=previous.split('const stub=String.raw`')[1].split('`;\n(async()=>')[0];
stub=stub.replace("(f[ref.collection]||[]).map(d=>snap(d.id||d.uid,d))", "(f[ref.collection]||[]).filter(d=>(ref.args||[]).every(a=>!Array.isArray(a)||a[1]==='=='?(!Array.isArray(a)||d[a[0]]===a[2]):a[1]==='in'?a[2].includes(d[a[0]]):a[1]==='array-contains'?(d[a[0]]||[]).includes(a[2]):true)).map(d=>snap(d.id||d.uid,d))");
stub=stub.replace('const snap=(id,d)=>({id,exists:()=>!!d,data:()=>d});','const snap=(id,d)=>({id,exists:()=>!!d,data:()=>{if(!d)return d;const {id:_id,...data}=d;return data;}});');
stub=stub.replace('export async function getDoc(ref){return read(ref);}','export async function getDoc(ref){globalThis.__reads.push(ref);return read(ref);}');
stub=stub.replace('export async function createUserWithEmailAndPassword(){return {user};}','export async function createUserWithEmailAndPassword(){globalThis.__authCreates++;return {user};}');
stub=stub.replace('export function onSnapshot(ref,cb){','export function onSnapshot(ref,cb){globalThis.__emit=(col)=>watchers.filter(w=>w.active&&w.ref.collection===col).forEach(w=>w.cb(snapshot(w.ref)));');
const now=Date.now(),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const acoes=['orgao.consultar','participantes.consultar','participantes.cadastrar','participantes.editar','eventos.consultar','inscricoes.consultar','inscricoes.criar','inscricoes.cancelar','comprovantes.consultar'];
const vinculo={papel:'gestor_nsi',orgaoId:'orgao-a',setoresIds:['a1'],operacoesVersao:'v1',situacao:'aprovado',inicio:now-60000,fim:now+3600000,revisao:now+1800000,titularUid:'',acoes,aprovacaoGrgd:{responsavel:'GRGD fictícia',referencia:'G1'},aprovacaoAutoridade:{responsavel:'Autoridade fictícia',referencia:'A1'},registradoPorUid:'admin',registradoEm:'fictício'};
const nsi={uid:'nsi',id:'nsi',nome:'Gestor de demonstração',email:'gestor@example.invalid',perfil:'comum',tipoUsuario:'externo',ativo:true,modulosPermitidos:[],acessoInstitucional:vinculo};
const admin={uid:'admin',id:'admin',nome:'Administrador de demonstração',email:'admin@example.invalid',perfil:'admin',tipoUsuario:'interno',ativo:true};
const pessoa={id:sha('orgao-a|pessoa@example.invalid'),nome:'Pessoa de demonstração',emailInstitucional:'pessoa@example.invalid',orgaoId:'orgao-a',setorId:'a1',telefone:'',cargo:'Analista',ativo:true,criadoEm:'fictício',criadoPorUid:'nsi'};
function fixture(me){return {me,usuarios:[admin,me.uid==='nsi'?me:nsi],orgaos:[{id:'orgao-a',nome:'Órgão A fictício'},{id:'orgao-b',nome:'Órgão B fictício'}],setores:[{id:'a1',nome:'NSI A',orgaoId:'orgao-a',ativo:true},{id:'a2',nome:'Setor fora da delegação',orgaoId:'orgao-a',ativo:true}],
 colaboradores:[pessoa,{id:'fora',nome:'Pessoa de outro órgão',orgaoId:'orgao-b',setorId:'b1',ativo:true}],inscricoes:[],historicoAlteracoes:[],
 eventos:[{id:'e1',titulo:'Oficina institucional fictícia',dataInicio:'2099-01-01',modeloInscricao:'institucional-v1',eventoPublico:false,orgaosElegiveis:['orgao-a'],inscricoesAbertas:true,inscricaoInicio:now-60000,inscricaoFim:now+3600000,limiteVagas:1,inscritosCount:0,status:'Confirmado'}]};}
(async()=>{
 fs.mkdirSync('test-results',{recursive:true});const errors=[];let browser;
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync('index.html'));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 async function open(me,width=1440){
  const context=await browser.newContext({viewport:{width,height:1050}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.addInitScript(f=>{globalThis.__fixture=JSON.parse(sessionStorage.getItem('__usuariosFixture')||'null')||f;globalThis.__transactions=[];globalThis.__reads=[];globalThis.__authCreates=0;globalThis.__reauths=0;globalThis.__refreshes=0;},fixture(me));
  await page.route('https://cdn.tailwindcss.com/**',r=>r.fulfill({contentType:'application/javascript',body:''}));
  await page.route('https://www.gstatic.com/firebasejs/**',r=>r.fulfill({contentType:'application/javascript',headers:{'access-control-allow-origin':'*'},body:stub}));
  await page.route('**/*',r=>/googleapis\.com|firebaseio\.com|firebaseapp\.com/.test(r.request().url())?r.abort():r.fallback());
  await page.goto('http://127.0.0.1:'+server.address().port);if(process.env.PRGD_TEST_CSS)await page.addStyleTag({content:fs.readFileSync(process.env.PRGD_TEST_CSS,'utf8')});await page.locator('#main-content').waitFor();return {page,context};
 }
 try{
  browser=await chromium.launch();
  {
   const {page,context}=await open(admin);
   await page.locator('[data-tab="colaboradores"]').click();await page.locator('#admin-colab-lista').getByText('Pessoa de demonstração',{exact:true}).waitFor();
   assert.equal(await page.locator('#colaboradores-portal-area').isVisible(),false);
   await page.locator('#admin-colab-orgao').selectOption('orgao-a');assert.ok(!(await page.locator('#admin-colab-lista').innerText()).includes('outro órgão'));
   await page.locator('[data-colaborador-editar="'+pessoa.id+'"]').click();await page.locator('#colab-nome').fill('Gestora NSI de demonstração');await page.locator('#colab-telefone').fill('81999990000');await page.locator('#colab-validade').fill('2025-01-01');await page.locator('[name="colab-funcao"][value="nsi"]').check();await page.locator('#colab-salvar').click();await page.locator('#modal-colaborador').waitFor({state:'hidden'});
   await page.locator('#admin-colab-lista').getByText('Gestora NSI de demonstração',{exact:true}).waitFor();await page.locator('#admin-colab-situacao').selectOption('vencido');assert.equal(await page.locator('#admin-colab-lista tr').count(),1);
   assert.equal(await page.evaluate(()=>__fixture.contatosColaboradores.find(p=>p.id===__fixture.colaboradores[0].id).nome),'Gestora NSI de demonstração');assert.equal(await page.evaluate(()=>__authCreates),0);
   await page.locator('[data-tab="clientes"]').click();await page.locator('#tabela-clientes').getByText('Órgão A fictício',{exact:true}).waitFor();await page.locator('[data-colecao="orgaos"][data-id="orgao-a"]').click();await page.locator('#orgao-contatos-vivos').getByText(/Gestora NSI de demonstração/).waitFor();
   await page.locator('[data-contato-funcao="nsi"]').selectOption(pessoa.id);await page.locator('#btn-salvar-edicao').click();await page.locator('#modal-detalhes').waitFor({state:'hidden'});
   assert.equal(await page.evaluate(()=>__fixture.orgaos.find(o=>o.id==='orgao-a').contatosVinculados.nsi),pessoa.id);
   await page.locator('[data-colecao="orgaos"][data-id="orgao-a"]').click();await page.locator('#edit-campos-dinamicos input[name="nome"]').fill('Edição ainda não salva');
   await page.evaluate(()=>{const p=__fixture.contatosColaboradores[0];p.nome='Nome atualizado na origem';p.telefone='81888880000';Object.assign(__fixture.colaboradores[0],{nome:p.nome,telefone:p.telefone});__emit('contatosColaboradores');__emit('colaboradores');});
   await page.locator('#orgao-contatos-vivos').getByText(/Nome atualizado na origem/).waitFor();assert.equal(await page.locator('#edit-campos-dinamicos input[name="nome"]').inputValue(),'Edição ainda não salva');
   await page.locator('[data-target="modal-detalhes"]').first().click();await page.locator('[data-tab="colaboradores"]').click();
   await page.locator('[data-colaborador-vincular="'+pessoa.id+'"]').click();await page.locator('#vincular-lista').selectOption('nsi');await page.locator('#vincular-confirmacao').check();await page.locator('#vincular-salvar').click();await page.locator('#modal-vincular-colaborador').waitFor({state:'hidden'});
   assert.equal(await page.evaluate(()=>__fixture.colaboradores[0].usuarioUid),'nsi');assert.equal(await page.evaluate(()=>__fixture.usuarios.find(u=>u.uid==='nsi').colaboradorId),pessoa.id);assert.equal(await page.evaluate(()=>__fixture.usuarios.find(u=>u.uid==='nsi').perfil),'comum');
   await page.screenshot({path:'test-results/colaboradores-administracao.png',fullPage:true});
   await page.locator('[data-tab="usuarios"]').click();await page.locator('[data-usuario-editar="nsi"]').click();await page.locator('#usuario-nome').fill('Nome da conta revisado');await page.locator('#btn-salvar-edicao').click();await page.locator('#modal-revisar-usuario').waitFor();
   assert.equal(await page.evaluate(()=>__fixture.usuarios.find(u=>u.uid==='nsi').nome),'Gestor de demonstração');await page.locator('#revisar-usuario-voltar').click();assert.equal(await page.locator('#usuario-nome').inputValue(),'Nome da conta revisado');await page.locator('#btn-salvar-edicao').click();await page.screenshot({path:'test-results/usuarios-revisar-permissoes.png'});await page.locator('#revisar-usuario-confirmar').click();await page.locator('#modal-detalhes').waitFor({state:'hidden'});
   assert.equal(await page.evaluate(()=>__fixture.usuarios.find(u=>u.uid==='nsi').nome),'Nome da conta revisado');
   await page.locator('#filtro-perfil-usuario').selectOption('gestor_nsi');assert.equal(await page.locator('#tabela-usuarios tr').count(),1);await page.locator('#usuarios-limpar-filtros').click();
   await page.locator('[data-tab="colaboradores"]').click();await page.evaluate(()=>sessionStorage.setItem('__usuariosFixture',JSON.stringify(__fixture)));await page.reload();if(process.env.PRGD_TEST_CSS)await page.addStyleTag({content:fs.readFileSync(process.env.PRGD_TEST_CSS,'utf8')});await page.locator('#aba-colaboradores').waitFor({state:'visible'});assert.equal(await page.locator('#modal-login').isVisible(),false);
   await page.setViewportSize({width:390,height:844});await page.locator('[data-tab="colaboradores"]').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:'test-results/colaboradores-administracao-mobile.png',fullPage:true});
   await page.locator('[data-colaborador-vincular="'+pessoa.id+'"]').click();await page.locator('#vincular-busca').fill('sem resultado');assert.equal(await page.locator('#vincular-lista').inputValue(),'nsi','Pesquisar não pode desvincular silenciosamente.');await page.locator('#vincular-lista').selectOption('');await page.locator('#vincular-confirmacao').check();await page.locator('#vincular-salvar').click();await page.locator('#modal-vincular-colaborador').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>__fixture.usuarios.find(u=>u.uid==='nsi').colaboradorId),'');
   await page.locator('#btn-executar-logout').click();await page.locator('#modal-login').waitFor();assert.equal(await page.locator('#admin-colab-lista').innerHTML(),'');assert.equal(await page.locator('#usuarios-indicadores').innerHTML(),'');await context.close();
  }
  {
   const {page,context}=await open(nsi);await page.locator('[data-tab="colaboradores"]').click();assert.equal(await page.locator('#admin-colaboradores').isVisible(),false);assert.equal(await page.locator('[data-colaborador-vincular]').count(),0);
   await page.locator('[data-colaborador-editar="'+pessoa.id+'"]').click();await page.locator('#colab-nome').fill('Contato atualizado pelo órgão');await page.locator('[name="colab-funcao"][value="sei"]').check();await page.locator('#colab-validade').fill('2027-10-23');await page.locator('#colab-salvar').click();await page.locator('#modal-colaborador').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>__fixture.contatosColaboradores[0].nome),'Contato atualizado pelo órgão');assert.equal(await page.evaluate(()=>__authCreates),0);await context.close();
  }
  assert.deepEqual(errors,[]);console.log('Usuários e colaboradores: administração, revisão, contatos em tempo real, vínculo e desvínculo, isolamento visual, mobile e logout aprovados. Firebase simulado.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
