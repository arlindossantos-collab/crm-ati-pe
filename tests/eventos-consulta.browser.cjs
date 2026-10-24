const {chromium}=require('playwright');
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
// Caracteriza filtros e apresentação com Firebase simulado; nenhum acesso ao projeto real.
let stub=fs.readFileSync('tests/seguranca-sessao.browser.cjs','utf8').split('const stub=String.raw`')[1].split('`;\n(async()=>')[0];
stub=stub.replace('(f[ref.collection]||[]).map(d=>snap(d.id||d.uid,d))',"(f[ref.collection]||[]).filter(d=>(ref.args||[]).every(a=>!Array.isArray(a)||a[1]!=='=='||d[a[0]]===a[2])).map(d=>snap(d.id||d.uid,d))");
const admin={id:'admin',uid:'admin',nome:'Admin fictício',perfil:'admin',tipoUsuario:'interno',ativo:true};
const viewer={id:'leitor',uid:'leitor',nome:'Leitor fictício',perfil:'comum',tipoUsuario:'interno',ativo:true,grupos:[],modulosPermitidos:['eventos']};
const eventos=[
 {id:'oficina',titulo:'Formação digital',palestrante:'João de teste',localEvento:'Auditório local',tipoEvento:'Oficina',status:'Confirmado',dataInicio:'2099-02-10',dataFim:'2099-02-12',eventoPublico:true},
 {id:'planejado',titulo:'Encontro planejado',tipoEvento:'Encontro',status:'Planejado',dataInicio:'2099-02-15',eventoPublico:true},
 {id:'cancelado',titulo:'Evento cancelado',tipoEvento:'Encontro',status:'Cancelado',dataInicio:'2099-02-20',eventoPublico:true},
 {id:'passado',titulo:'Agenda passada',tipoEvento:'Oficina',status:'Planejado',dataInicio:'2000-01-01',eventoPublico:true},
 {id:'realizado',titulo:'Encontro realizado',tipoEvento:'Encontro',status:'Realizado',dataInicio:'2000-01-02',eventoPublico:true},
 {id:'incompleto',titulo:'Legado sem dados',eventoPublico:true},
 {id:'restrito',titulo:'Evento de grupo restrito',tipoEvento:'Tipo reservado',status:'Estado reservado',dataInicio:'2099-03-01',eventoPublico:false,gruposPermitidos:['outro-grupo']}
];
(async()=>{
 fs.mkdirSync('test-results',{recursive:true});const errors=[];
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync('index.html'));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 async function open(me){
  const context=await browser.newContext({locale:'pt-BR',viewport:{width:1440,height:1000}}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(f=>{globalThis.__fixture=f;globalThis.__transactions=[];globalThis.__reauths=0;globalThis.__refreshes=0;},{me,usuarios:[me],eventos,inscricoes:[],orgaos:[],locais:[]});
  await page.route('**/*',route=>{
   const url=route.request().url();
   if(url.includes('www.gstatic.com/firebasejs/'))return route.fulfill({contentType:'application/javascript',headers:{'access-control-allow-origin':'*'},body:stub});
   if(url.includes('chart.js'))return route.fulfill({contentType:'application/javascript',body:'globalThis.Chart=class {destroy(){}};'});
   if(url.startsWith('http://127.0.0.1:'))return route.continue();
   return route.fulfill({contentType:url.endsWith('.css')?'text/css':'text/javascript',body:''});
  });
  await page.goto('http://127.0.0.1:'+server.address().port);
  if(process.env.PRGD_TEST_CSS)await page.addStyleTag({content:fs.readFileSync(process.env.PRGD_TEST_CSS,'utf8')});
  await page.locator('#main-content').waitFor({state:'visible'});await page.locator('[data-tab="eventos"]').click();
  return {page,context};
 }
 try{
  browser=await chromium.launch();
  {
   const {page,context}=await open(admin),cards=page.locator('#grid-eventos article');
   await page.locator('#filtro-evento-todos').click();assert.equal(await cards.count(),7);
   await page.locator('#busca-eventos').fill('FORMACAO');assert.equal(await cards.count(),1);
   await page.locator('#busca-eventos').fill('joao');assert.equal(await cards.count(),1);
   await page.locator('#busca-eventos').fill('auditorio');assert.equal(await cards.count(),1);
   await page.locator('#filtro-evento-status').selectOption('Confirmado');await page.locator('#filtro-evento-tipo').selectOption('Oficina');
   await page.locator('#filtro-evento-de').fill('2099-02-11');await page.locator('#filtro-evento-ate').fill('2099-02-11');
   assert.equal(await cards.count(),1);assert.match(await page.locator('#eventos-resultado-consulta').innerText(),/1 de 7/);
   await page.screenshot({path:'test-results/eventos-consulta-desktop.png'});
   await page.locator('#filtro-evento-de').fill('2099-02-12');assert.match(await page.locator('#eventos-filtros-erro').innerText(),/posterior/);assert.equal(await cards.count(),0);
   await page.locator('#limpar-filtros-eventos').click();assert.equal(await page.locator('#busca-eventos').inputValue(),'');assert.equal(await page.locator('#filtro-evento-status').inputValue(),'');
   assert.equal(await page.locator('#filtro-evento-futuros').getAttribute('aria-pressed'),'true');
   await page.locator('#filtro-evento-realizados').click();assert.deepEqual(await page.locator('#grid-eventos article h4').allTextContents(),['Encontro realizado','Agenda passada']);
   await page.locator('#ordenacao-eventos').selectOption('crescente');assert.deepEqual(await page.locator('#grid-eventos article h4').allTextContents(),['Agenda passada','Encontro realizado']);
   const passado=cards.filter({hasText:'Agenda passada'});assert.match(await passado.innerText(),/Planejado/);assert.doesNotMatch(await passado.innerText(),/Realizado/);
   await page.locator('#filtro-evento-todos').click();await page.locator('#filtro-evento-status').selectOption('Cancelado');assert.equal(await cards.count(),1);assert.match(await cards.innerText(),/Cancelado/);
   await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/eventos-consulta-celular.png'});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Consulta não deve criar rolagem horizontal no celular.');
   await page.locator('#busca-eventos').fill('inexistente');assert.equal(await cards.count(),0);assert.match(await page.locator('#grid-eventos').innerText(),/Revise os filtros/);
   await page.locator('#btn-executar-logout').click();await page.locator('#modal-login').waitFor({state:'visible'});assert.equal(await page.locator('#filtro-evento-status').inputValue(),'');assert.equal(await page.locator('#filtro-evento-de').inputValue(),'');
   assert.equal(await page.evaluate(()=>__transactions.length),0,'Consultar e filtrar não grava dados.');await context.close();
  }
  {
   const {page,context}=await open(viewer);await page.locator('#filtro-evento-todos').click();assert.equal(await page.locator('#grid-eventos article').count(),6);
   assert.ok(!(await page.locator('#filtro-evento-tipo').innerText()).includes('Tipo reservado'));assert.ok(!(await page.locator('#filtro-evento-status').innerText()).includes('Estado reservado'));
   await page.locator('#busca-eventos').fill('grupo restrito');assert.equal(await page.locator('#grid-eventos article').count(),0);await context.close();
  }
  assert.deepEqual(errors,[]);console.log('Eventos: filtros combinados, período/duração, ordenação, situações preservadas, perfis, logout e desktop/celular aprovados. Firebase simulado.');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
