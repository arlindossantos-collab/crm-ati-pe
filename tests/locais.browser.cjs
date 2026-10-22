
const {chromium}=require('playwright');
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
const fixture={
 admin:{uid:'admin',nome:'Administrador de teste',email:'admin@example.invalid',perfil:'admin',tipoUsuario:'interno',ativo:true},
 locais:[
 {id:'l1',nome:'Auditório Azul',endereco:'Av. Exemplo, Recife',capacidade:120,area:'200 m²',tipoLocacao:'gratuito',valorAluguel:0,contatoResponsavel:'Ana',telefone:'81 99999-0000',recursos:['Projetor','Wi-Fi','Acessibilidade'],descricao:'Espaço para encontros.'},
 {id:'l2',nome:'Sala Verde',endereco:'Centro, Recife',capacidade:40,tipoLocacao:'pago',valorAluguel:800,periodicidadeLocacao:'diária',recursos:['TV','Ar-condicionado']},
 {id:'l3',nome:'Espaço sem informações'}],
 eventos:[
 {id:'e1',titulo:'Encontro GRGD',localId:'l1',localEvento:'Auditório Azul',dataInicio:'2030-01-01',horaInicio:'09:00',horaFim:'11:00',custoLocacaoPrevisto:0,eventoPublico:true},
 {id:'e2',titulo:'Oficina de relacionamento',localId:'l2',localEvento:'Sala Verde',dataInicio:'2030-01-02',custoLocacaoPrevisto:800,eventoPublico:true},
 {id:'e3',titulo:'Evento passado sem confirmação',localId:'l1',dataInicio:'2020-01-01',eventoPublico:true}]
};
const stub="\nconst fixture=globalThis.__locaisFixture;\nexport const inMemoryPersistence={};\nexport const browserLocalPersistence={};\nexport function initializeApp(config,name){return {name:name||'default'};}\nexport function getApps(){return [];}\nexport function getAuth(){return {currentUser:fixture.admin};}\nexport function getFirestore(){return {};}\nexport function setPersistence(){return Promise.resolve();}\nexport function collection(db,name){return {collection:name};}\nlet seq=0;export function doc(db,collection,id,...rest){if(arguments.length===1){collection=db.collection;id='novo-'+(++seq);}return {collection,id,path:[collection,id,...rest].join('/')};}\nexport function query(ref,...args){return {...ref,args};}\nexport function where(...args){return args;}\nconst snap=(id,d)=>({id,exists:()=>!!d,data:()=>d});\nexport function getDoc(ref){return Promise.resolve(snap(ref.id,ref.collection==='usuarios'?fixture.admin:{}));}\nexport function getDocs(){return Promise.resolve({docs:[]});}\nexport function onSnapshot(ref,callback){let active=true;queueMicrotask(()=>{\n if(!active)return;\n if(ref.collection==='usuarios'&&ref.id)callback(snap(ref.id,fixture.admin));\n else callback({docs:(fixture[ref.collection]||[]).map(d=>snap(d.id,d))});\n });return ()=>{active=false;};}\nexport function onAuthStateChanged(auth,callback){queueMicrotask(()=>callback(fixture.admin));return ()=>{};}\nexport function signOut(){return Promise.resolve();}\nexport function signInWithEmailAndPassword(){return Promise.resolve({user:fixture.admin});}\nexport function createUserWithEmailAndPassword(){return Promise.resolve({user:fixture.admin});}\nexport function deleteUser(){return Promise.resolve();}\nexport function updatePassword(){return Promise.resolve();}\nexport function reauthenticateWithCredential(){return Promise.resolve();}\nexport const EmailAuthProvider={credential:()=>({})};\nexport async function addDoc(ref,data){globalThis.__testWrites.push({collection:ref.collection,data});return {id:'new-id'};}\nexport async function setDoc(ref,data){globalThis.__testWrites.push({...ref,data});}\nexport async function deleteDoc(ref){globalThis.__testWrites.push({removed:ref});}\nexport function writeBatch(){return {set(){},commit:()=>Promise.resolve()};}\n\nexport function serverTimestamp(){return {toDate:()=>new Date()};}\nexport function orderBy(...args){return args;}\nexport function limit(n){return n;}\nexport function startAfter(v){return v;}\nexport async function runTransaction(db,fn){const writes=[];await fn({get:getDoc,set:(ref,data)=>writes.push({...ref,data}),delete:ref=>writes.push({removed:ref})});globalThis.__testWrites.push(...writes);}\n";
(async()=>{
 fs.mkdirSync('test-results',{recursive:true});
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync('index.html'));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await chromium.launch();
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.addInitScript(f=>{globalThis.__locaisFixture=f;globalThis.__testWrites=[];},fixture);
  // Firebase totalmente interceptado: nenhum acesso ao projeto real.
  await page.route('https://www.gstatic.com/firebasejs/**',r=>r.fulfill({contentType:'application/javascript',headers:{'access-control-allow-origin':'*'},body:stub}));
  await page.route('**/*',async r=>{
   const url=r.request().url();
   if(/googleapis\.com|firebaseio\.com|firebaseapp\.com/.test(url))return r.abort();
   return r.fallback();
  });
  await page.goto('http://127.0.0.1:'+server.address().port);
  if(process.env.PRGD_TEST_CSS)await page.addStyleTag({content:fs.readFileSync(process.env.PRGD_TEST_CSS,'utf8')});
  await page.locator('#main-content').waitFor({state:'visible'});
  await page.locator('[data-tab="locais"]').click();
  await page.locator('#locais-qualidade').filter({hasText:'Agenda cadastrada carregada'}).waitFor();
  assert.equal(await page.locator('#tabela-locais tr').count(),3);
  assert.equal(await page.locator('#locais-indicadores > div').count(),6);
  assert.equal(await page.locator('#locais-indicadores .local-card-icone[aria-hidden="true"]').count(),6);
  assert.equal(await page.locator('.local-card-suave').filter({hasText:'Custo total previsto'}).locator('.fa-coins').count(),1);
  const tons=await page.locator('#locais-indicadores .local-card-suave').evaluateAll(cards=>cards.map(c=>({tom:c.dataset.tone,fundo:getComputedStyle(c).backgroundColor})));
  assert.deepEqual([...new Set(tons.map(c=>c.tom))].sort(),['azul','verde']);
  for(const c of tons){
    const alpha=Number(c.fundo.split(',').at(-1).replace(')',''));
    assert.ok(alpha>0 && alpha<=0.1,'O fundo deve manter baixa opacidade.');
  }
  const posicao=await page.evaluate(()=>{
    const painel=document.getElementById('local-painel').getBoundingClientRect();
    const agenda=document.getElementById('form-disponibilidade-local').parentElement.getBoundingClientRect();
    return {fimPainel:painel.bottom,inicioAgenda:agenda.top};
  });
  assert.ok(posicao.inicioAgenda>=posicao.fimPainel,'A consulta permanece abaixo, sem mudar o layout.');
  await page.locator('#btn-filtros-locais').click();
  assert.equal(await page.locator('#btn-filtros-locais').getAttribute('aria-expanded'),'true');
  await page.locator('#local-filtro-tipo').selectOption('gratuito');
  assert.equal(await page.locator('#tabela-locais tr').count(),1);
  await page.locator('#local-limpar-filtros').click();
  await page.locator('#busca-locais').fill('Ana');
  assert.equal(await page.locator('#tabela-locais tr').count(),1);
  await page.locator('[data-local-detalhes="l1"]').click();
  await page.locator('#local-painel').getByRole('heading',{name:'Auditório Azul',exact:true}).waitFor();
  assert.ok((await page.locator('#local-painel').innerText()).includes('realização a confirmar'));
  await page.locator('#disponibilidade-data').fill('2030-01-01');
  await page.locator('#disponibilidade-inicio').fill('10:00');
  await page.locator('#disponibilidade-fim').fill('12:00');
  await page.locator('#form-disponibilidade-local button').click();
  assert.ok((await page.locator('#disponibilidade-resultado').innerText()).includes('Possíveis conflitos'));
  await page.locator('#disponibilidade-inicio').fill('11:00');
  await page.locator('#disponibilidade-fim').fill('12:00');
  await page.locator('#form-disponibilidade-local button').click();
  assert.ok((await page.locator('#disponibilidade-resultado').innerText()).includes('Nenhum conflito'));
  await page.locator('[data-local-editar="l1"]').click();
  await page.locator('#editar-local-nome').fill('Auditório atualizado');
  await page.locator('#btn-salvar-edicao').click();
  assert.ok(await page.evaluate(()=>globalThis.__testWrites.some(w=>w.collection==='locais'&&w.data.nome==='Auditório atualizado')));
  await page.locator('[data-modal-target="local"]').click();
  await page.locator('#uc-1').fill('Novo local de teste');
  await page.locator('#novo-local-capacidade').fill('60');
  await page.locator('#novo-local-recursos').fill('TV, Wi-Fi');
  await page.locator('#btn-salvar-cadastro').click();
  assert.ok(await page.evaluate(()=>globalThis.__testWrites.some(w=>w.collection==='locais'&&w.data.capacidade===60&&Array.isArray(w.data.recursos))));
  await page.locator('#local-limpar-filtros').click();
  await page.locator('#aba-locais').screenshot({path:'test-results/locais-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.locator('#aba-locais').screenshot({path:'test-results/locais-mobile.png'});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
  if(overflow)console.log('Elementos fora da tela:',await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1&&!el.closest('.overflow-x-auto');}).slice(0,20).map(el=>({tag:el.tagName,id:el.id,classe:el.className,largura:el.getBoundingClientRect().width}))));
  assert.equal(overflow,false,'A página não deve transbordar no celular; tabela tem rolagem própria.');
  assert.deepEqual(errors,[]);
  console.log('Navegador: indicadores, filtros, busca, painel, agenda, edição, cadastro e layout móvel aprovados. Firebase totalmente simulado.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
