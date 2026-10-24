const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch();const external=[],errors=[];
 fs.mkdirSync('test-results',{recursive:true});
 const context=await browser.newContext();
 // Observar tentativas externas; NÃO interceptar requisições Firebase. CSP e SDK local devem isolar a página.
 context.on('request',request=>{if(!['127.0.0.1'].includes(new URL(request.url()).hostname))external.push(request.url());});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 page.setDefaultTimeout(15000);
 async function login(name){
  await page.goto('http://127.0.0.1:4173');await page.waitForFunction(()=>window.__PRGD_MODULE_OK===true);await page.locator('#modal-login').waitFor({state:'visible'});
  await page.locator('#login-email').fill(name+'@example.invalid');await page.locator('#login-senha').fill('Ficticio-local-2026!');
  await page.locator('#login-form button[type="submit"]').click();await page.locator('#main-content').waitFor({state:'visible'});
 }
 try{
  await login('gestor-a');
  await page.locator('[data-tab="colaboradores"]').click();await page.locator('#btn-novo-colaborador').click();
  const stamp=Date.now(),email=`pessoa-${stamp}@example.invalid`;
  await page.locator('#colab-nome').fill('Pessoa fictícia '+stamp);await page.locator('#colab-emailInstitucional').fill(email);
  await page.locator('#colab-setorId').selectOption('a1');await page.locator('#colab-cargo').fill('Teste local');await page.locator('#colab-salvar').click();
  await page.locator('#modal-colaborador').waitFor({state:'hidden'});
  const id=require('node:crypto').createHash('sha256').update('orgao-a|'+email).digest('hex');
  await page.locator(`[data-colaborador-editar="${id}"]`).waitFor();
  await page.locator('[data-tab="eventos"]').click();
  await page.locator('#filtro-evento-todos').click();await page.locator('#busca-eventos').fill('formacao');
  await page.locator('#filtro-evento-status').selectOption('Planejado');await page.locator('#filtro-evento-tipo').selectOption('Seminário');
  await page.locator('#filtro-evento-de').fill('2099-02-11');await page.locator('#filtro-evento-ate').fill('2099-02-11');
  assert.equal(await page.locator('#grid-eventos article').count(),1);
  assert.match(await page.locator('#grid-eventos').innerText(),/Agenda local — formação digital/);
  await page.screenshot({path:'test-results/eventos-emuladores-desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/eventos-emuladores-celular.png'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.locator('#limpar-filtros-eventos').click();await page.locator('#filtro-evento-realizados').click();
  await page.locator('#busca-eventos').fill('Agenda local — evento passado');
  assert.match(await page.locator('#grid-eventos').innerText(),/Confirmado/);assert.doesNotMatch(await page.locator('#grid-eventos').innerText(),/Realizado/);
  await page.locator('#limpar-filtros-eventos').click();await page.setViewportSize({width:1440,height:1000});
  await page.locator('[data-inscrever-colaborador="evento-local"]').click();
  await page.locator('#insc-participante').selectOption(id);await page.locator('#insc-confirmar').click();await page.locator('#modal-inscricao-institucional').waitFor({state:'hidden'});
  await page.locator('[data-tab="inscricoes_orgao"]').click();await page.getByRole('button',{name:'Cancelar inscrição',exact:true}).last().waitFor();
  await page.screenshot({path:'test-results/homologacao-emuladores-desktop.png'});
  page.on('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Cancelar inscrição',exact:true}).last().click();
  await page.locator('#portal-inscricoes').getByText('cancelada',{exact:true}).first().waitFor();
  const denied=await page.evaluate(async()=>{
   const sdk=await import('./firebase-local.js'),db=sdk.getFirestore(sdk.getApps()[0]);
   try{await sdk.getDoc(sdk.doc(db,'orgaos','orgao-b'));return false;}catch(e){return e.code==='permission-denied';}
  });assert.equal(denied,true,'Gestor A deve ser impedido de consultar órgão B.');
  await page.setViewportSize({width:390,height:844});await page.locator('[data-tab="colaboradores"]').click();
  await page.screenshot({path:'test-results/homologacao-emuladores-celular.png'});
  // Reinscrever pelo gestor para verificar o cancelamento administrativo no novo painel.
  await page.locator('[data-tab="eventos"]').click();await page.locator('[data-inscrever-colaborador="evento-local"]').click();
  await page.locator('#insc-participante').selectOption(id);await page.locator('#insc-confirmar').click();await page.locator('#modal-inscricao-institucional').waitFor({state:'hidden'});
  await page.locator('#btn-executar-logout').click();await page.locator('#modal-login').waitFor({state:'visible'});
  await login('admin');assert.equal(await page.locator('body').getAttribute('data-admin'),'true');
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('[data-tab="eventos"]').click();await page.locator('[data-painel-inscricoes="evento-local"]').click();
  const panel=page.locator('#painel-inscricoes-evento');await panel.locator('#painel-inscricoes-lista article').first().waitFor();
  await page.locator('#painel-inscricoes-busca').fill(email);assert.equal(await panel.locator('article').count(),1);
  const confirmedBefore=Number(await panel.locator('[data-inscricoes-total="confirmadas"]').innerText());
  const vagasBefore=Number(await panel.locator('[data-inscricoes-total="vagas"]').innerText());
  await page.locator('#edit-campos-dinamicos input[name="titulo"]').fill('Edição ainda não salva');
  await panel.scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/painel-inscricoes-emuladores-desktop.png'});
  await page.setViewportSize({width:390,height:844});await panel.scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/painel-inscricoes-emuladores-celular.png'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.setViewportSize({width:1440,height:1000});
  await panel.getByRole('button',{name:'Cancelar inscrição',exact:true}).click();await panel.getByText('Cancelada',{exact:true}).waitFor();
  await page.waitForFunction(n=>document.querySelector('[data-inscricoes-total="confirmadas"]').textContent===String(n),confirmedBefore-1);
  assert.equal(Number(await panel.locator('[data-inscricoes-total="vagas"]').innerText()),vagasBefore+1);
  assert.equal(await page.locator('#painel-inscricoes-busca').inputValue(),email);
  assert.equal(await page.locator('#edit-campos-dinamicos input[name="titulo"]').inputValue(),'Edição ainda não salva');
  const audit=await page.evaluate(async participantId=>{
   const sdk=await import('./firebase-local.js'),db=sdk.getFirestore(sdk.getApps()[0]);
   const event=(await sdk.getDoc(sdk.doc(db,'eventos','evento-local'))).data();
   const records=(await sdk.getDocs(sdk.collection(db,'historicoAlteracoes'))).docs.map(d=>d.data());
   return {title:event.titulo,cancels:records.filter(i=>i.acao==='cancelar_inscricao'&&i.registroId.endsWith(participantId)).length};
  },require('node:crypto').createHash('sha256').update(email).digest('hex'));
  assert.equal(audit.title,'Oficina de homologação fictícia');assert.ok(audit.cancels>=2,'Cancelamentos devem preservar auditoria.');
  await page.locator('[data-target="modal-detalhes"]').first().click();
  await page.locator('[data-tab="clientes"]').click();await page.locator('[data-modal-target="cliente"]').click();
  const orgName='Órgão sem localização '+Date.now();await page.locator('#uc-1').fill(orgName);
  await page.locator('#btn-salvar-cadastro').click();await page.locator('#modal-form-universal').waitFor({state:'hidden'});
  const org=await page.evaluate(async name=>{
   const sdk=await import('./firebase-local.js'),db=sdk.getFirestore(sdk.getApps()[0]);
   const snapshot=await sdk.getDocs(sdk.query(sdk.collection(db,'orgaos'),sdk.where('nome','==',name)));
   return {id:snapshot.docs[0].id,...snapshot.docs[0].data()};
  },orgName);
  assert.equal(org.endereco,'');assert.equal(org.geolocalizacao,'');assert.equal(org.fotoFachada,'');
  // O identificador de detalhe usa o ID Firestore, preservando o ID de negócio no documento.
  const orgId=await page.evaluate(async name=>{const sdk=await import('./firebase-local.js'),db=sdk.getFirestore(sdk.getApps()[0]);return (await sdk.getDocs(sdk.query(sdk.collection(db,'orgaos'),sdk.where('nome','==',name)))).docs[0].id;},orgName);
  await page.locator(`[data-colecao="orgaos"][data-id="${orgId}"]`).click();
  const details=page.locator('#detalhe-conteudo');await details.getByText('Endereço não informado',{exact:true}).waitFor();
  assert.equal(await details.locator('a[href*="google.com/maps"]').count(),0);assert.equal(await details.locator('img').count(),0);
  assert.ok(!(await details.innerText()).includes('Fernanda Alves'));
  await page.screenshot({path:'test-results/orgao-sem-localizacao-desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/orgao-sem-localizacao-celular.png'});
  await page.locator('[data-target="modal-detalhes"]').first().click();

  const isolated=await page.evaluate(async()=>{
   const sdk=await import('./firebase-local.js');let rejected=false;
   try{sdk.initializeApp({projectId:'projeto-nao-demo'},'negado');}catch{rejected=true;}
   const app=sdk.initializeApp({apiKey:'demo-local-key',projectId:'demo-prgd-usuarios'},'teste-secundario');
   const auth=sdk.getAuth(app);await sdk.setPersistence(auth,sdk.inMemoryPersistence);
   await sdk.signInWithEmailAndPassword(auth,'gestor-b@example.invalid','Ficticio-local-2026!');
   const secondary=auth.currentUser.email==='gestor-b@example.invalid';await sdk.signOut(auth);await sdk.deleteApp(app);
   return {rejected,secondary};
  });assert.deepEqual(isolated,{rejected:true,secondary:true});

  await page.locator('#btn-executar-logout').click();await page.locator('#modal-login').waitFor({state:'visible'});
  await login('sem-vinculo');await page.locator('#aviso-sem-modulos').waitFor({state:'visible'});
  assert.deepEqual(external,[],'Nenhuma requisição externa deve ocorrer.');assert.deepEqual(errors,[]);
  console.log('PASSOU: painel de inscrições com cancelamento administrativo, vaga liberada e auditoria, filtros da agenda e situações nos emuladores, login real local, cadastro, inscrição, cancelamento, recusa entre órgãos, admin, sem vínculo e desktop/celular; zero requisições externas.');
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
