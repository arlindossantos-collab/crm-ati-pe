const {chromium}=require('playwright');
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
// Firebase inteiramente simulado; não há acesso a dados de produção.
let stub=fs.readFileSync('tests/seguranca-sessao.browser.cjs','utf8').split('const stub=String.raw`')[1].split('`;\n(async()=>')[0];
stub=stub.replace('(f[ref.collection]||[]).map(d=>snap(d.id||d.uid,d))',"(f[ref.collection]||[]).filter(d=>(ref.args||[]).every(a=>!Array.isArray(a)||a[1]!=='=='||d[a[0]]===a[2])).map(d=>snap(d.id||d.uid,d))");
stub=stub.replace('export function onSnapshot(ref,cb){','export function onSnapshot(ref,cb,onError){globalThis.__emit=col=>watchers.filter(w=>w.active&&w.ref.collection===col).forEach(w=>w.cb(snapshot(w.ref)));globalThis.__falhar=col=>watchers.filter(w=>w.active&&w.ref.collection===col).forEach(w=>w.onError?.({code:"permission-denied"}));').replace('const w={ref,cb,active:true}','const w={ref,cb,onError,active:true}');
const admin={id:'admin',uid:'admin',nome:'Admin fictício',perfil:'admin',tipoUsuario:'interno',ativo:true};
const viewer={id:'leitor',uid:'leitor',nome:'Leitor fictício',perfil:'comum',tipoUsuario:'interno',ativo:true,grupos:[],modulosPermitidos:['eventos']};
function fixture(me){return {me,usuarios:[me],orgaos:[{id:'a',nome:'Órgão A fictício'},{id:'b',nome:'Órgão B fictício'}],setores:[{id:'s',nome:'Setor fictício',orgaoId:'a',ativo:true}],
 eventos:[{id:'e',titulo:'Oficina fictícia',dataInicio:'2099-01-01',modeloInscricao:'institucional-v1',limiteVagas:4,inscritosCount:2,eventoPublico:true},{id:'antigo',titulo:'Evento antigo',dataInicio:'2099-01-02',eventoPublico:true}],
 inscricoes:[{id:'i1',eventId:'e',modeloInscricao:'institucional-v1',participanteNome:'João fictício',emailInstitucional:'joao@example.invalid',orgaoId:'a',setorId:'s',situacao:'confirmada',protocolo:'PROTO-A'},
 {id:'i2',eventId:'e',modeloInscricao:'institucional-v1',participanteNome:'Pessoa cancelada',orgaoId:'a',situacao:'cancelada'},
 {id:'i3',eventId:'e',modeloInscricao:'institucional-v1',participanteNome:'Ana fictícia',orgaoId:'b',situacao:'confirmada'},
 {id:'i4',eventId:'antigo',nome:'Pessoa do fluxo antigo',situacao:'confirmada'}]};}
(async()=>{
 fs.mkdirSync('test-results',{recursive:true});const errors=[];let browser;
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync('index.html'));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 async function open(me){const context=await browser.newContext({locale:'pt-BR',viewport:{width:1440,height:1000}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(f=>{globalThis.__fixture=f;globalThis.__transactions=[];globalThis.__reauths=0;globalThis.__refreshes=0;},fixture(me));
  await page.route('**/*',r=>{const u=r.request().url();if(u.includes('www.gstatic.com/firebasejs/'))return r.fulfill({contentType:'application/javascript',headers:{'access-control-allow-origin':'*'},body:stub});if(u.includes('chart.js'))return r.fulfill({contentType:'application/javascript',body:'globalThis.Chart=class {destroy(){}};'});if(u.startsWith('http://127.0.0.1:'))return r.continue();return r.fulfill({contentType:u.endsWith('.css')?'text/css':'text/javascript',body:''});});
  await page.goto('http://127.0.0.1:'+server.address().port);if(process.env.PRGD_TEST_CSS)await page.addStyleTag({content:fs.readFileSync(process.env.PRGD_TEST_CSS,'utf8')});await page.locator('#main-content').waitFor({state:'visible'});await page.locator('[data-tab="eventos"]').click();return {page,context};
 }
 try{browser=await chromium.launch();
  {
   const {page,context}=await open(admin);await page.locator('[data-painel-inscricoes="e"]').click();
   const panel=page.locator('#painel-inscricoes-evento'),rows=page.locator('#painel-inscricoes-lista article');
   await rows.first().waitFor();assert.equal(await rows.count(),3);
   assert.equal(await panel.locator('[data-inscricoes-total="confirmadas"]').innerText(),'2');assert.equal(await panel.locator('[data-inscricoes-total="vagas"]').innerText(),'2');
   await page.locator('#painel-inscricoes-busca').fill('JOAO');await page.locator('#painel-inscricoes-situacao').selectOption('confirmada');await page.locator('#painel-inscricoes-orgao').selectOption('a');assert.equal(await rows.count(),1);assert.match(await rows.innerText(),/PROTO-A/);assert.match(await page.locator('#painel-inscricoes-status').innerText(),/1 de 3/);
   await panel.scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/painel-inscricoes-desktop.png'});
   await page.locator('#edit-campos-dinamicos input[name="titulo"]').fill('Edição ainda não salva');
   await page.evaluate(()=>{__fixture.inscricoes[0].situacao='cancelada';__fixture.eventos[0].inscritosCount=1;__emit('inscricoes');__emit('eventos');});
   await page.waitForFunction(()=>document.querySelector('[data-inscricoes-total="confirmadas"]').textContent==='1');assert.equal(await page.locator('#painel-inscricoes-busca').inputValue(),'JOAO');assert.equal(await rows.count(),0);assert.equal(await page.locator('#edit-campos-dinamicos input[name="titulo"]').inputValue(),'Edição ainda não salva');
   await page.locator('#painel-inscricoes-limpar').click();assert.equal(await rows.count(),3);assert.equal(await panel.locator('[data-inscricoes-total="vagas"]').innerText(),'3');
   await page.evaluate(()=>{__fixture.eventos[0].inscritosCount=2;__emit('eventos');});await page.waitForFunction(()=>document.querySelector('#painel-inscricoes-conferencia').textContent.includes('Contagem em conferência'));assert.equal(await panel.locator('[data-inscricoes-total="vagas"]').innerText(),'Não confirmadas');
   await page.setViewportSize({width:390,height:844});await panel.scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/painel-inscricoes-celular.png'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.evaluate(()=>__falhar('inscricoes'));await page.waitForFunction(()=>document.querySelector('#painel-inscricoes-status').textContent.includes('removidos'));assert.equal(await rows.count(),0);assert.equal(await page.locator('#painel-inscricoes-resumo').innerHTML(),'');assert.equal(await page.locator('#painel-inscricoes-csv').isDisabled(),true);
   await page.evaluate(()=>__emit('inscricoes'));await rows.first().waitFor();
   await page.locator('[data-target="modal-detalhes"]').first().click();await page.locator('[data-painel-inscricoes="antigo"]').click();await page.getByText('Pessoa do fluxo antigo',{exact:true}).waitFor();assert.match(await panel.innerText(),/Fluxo anterior — situação não confirmada/);assert.equal(await panel.locator('[data-inscricoes-total="confirmadas"]').innerText(),'0');assert.equal(await panel.locator('[data-inscricoes-total="legadas"]').innerText(),'1');
   await page.locator('[data-target="modal-detalhes"]').first().click();await page.locator('#btn-executar-logout').click();await page.locator('#modal-login').waitFor({state:'visible'});assert.equal(await page.locator('#detalhe-conteudo').innerHTML(),'');assert.equal(await page.evaluate(()=>__transactions.length),0);await context.close();
  }
  {const {page,context}=await open(viewer);assert.equal(await page.locator('[data-painel-inscricoes]').count(),0);await context.close();}
  assert.deepEqual(errors,[]);console.log('Painel de inscrições: totais, filtros, atualização sem perder edição, conferência de vagas, legado, falha de consulta, perfis, logout e celular aprovados.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
