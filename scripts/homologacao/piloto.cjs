// Jornada técnica com três órgãos e SDK real; não substitui o aceite da GRGD.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {chromium} = require(path.join(process.env.PRGD_BROWSER_TOOLS || path.resolve(__dirname, '../../node_modules'), 'playwright'));
const sha = text => crypto.createHash('sha256').update(text).digest('hex');

(async () => {
  const browser = await chromium.launch();
  const contexts = [], external = [], errors = [];
  const evidence = {tipo:'piloto técnico local; aceite GRGD pendente', projeto:'demo-prgd-usuarios', cenarios:[]};
  fs.mkdirSync('test-results', {recursive:true});
  async function login(name) {
    const context = await browser.newContext({viewport:{width:1440, height:1000}});
    contexts.push(context);
    context.on('request', request => {if (new URL(request.url()).hostname !== '127.0.0.1') external.push(request.url());});
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    await page.goto('http://127.0.0.1:4173');
    await page.waitForFunction(() => window.__PRGD_MODULE_OK === true);
    await page.locator('#modal-login').waitFor({state:'visible'});
    await page.locator('#login-email').fill(name+'@example.invalid');
    await page.locator('#login-senha').fill('Ficticio-local-2026!');
    await page.locator('#login-form button[type="submit"]').click();
    await page.locator('#main-content').waitFor({state:'visible'});
    return page;
  }
  async function read(page, collection, id) {
    return page.evaluate(async ({collection, id}) => {
      const sdk = await import('./firebase-local.js');
      return (await sdk.getDoc(sdk.doc(sdk.getFirestore(sdk.getApps()[0]), collection, id))).data();
    }, {collection, id});
  }
  try {
    const admin = await login('admin'), stamp = Date.now(), title = 'Piloto três órgãos '+stamp;
    // O formulário usa os cadastros já carregados pela aplicação, não apenas o login.
    await admin.locator('[data-tab="clientes"]').click();
    for (const letter of ['a','b','c']) await admin.locator(`[data-colecao="orgaos"][data-id="orgao-${letter}"]`).first().waitFor();
    await admin.locator('[data-tab="eventos"]').click();
    await admin.locator('[data-modal-target="evento"]').click();
    await admin.locator('#uc-1').fill(title);
    await admin.locator('#evt-data-inicio').fill('2099-02-01');
    await admin.locator('#evt-status').selectOption('Confirmado');
    await admin.locator('#evt-institucional').check();
    await admin.locator('#evt-inscricao-inicio').fill(new Date(stamp-86400000).toISOString().slice(0,16));
    await admin.locator('#evt-inscricao-fim').fill(new Date(stamp+86400000).toISOString().slice(0,16));
    await admin.locator('#evt-limite-vagas').fill('3');
    await admin.locator('#evt-orgaos-elegiveis').selectOption(['orgao-a','orgao-b','orgao-c']);
    await admin.locator('#btn-salvar-cadastro').click();
    await admin.locator('#modal-form-universal').waitFor({state:'hidden'});
    const eventId = await admin.evaluate(async title => {
      const sdk = await import('./firebase-local.js'), db = sdk.getFirestore(sdk.getApps()[0]);
      return (await sdk.getDocs(sdk.query(sdk.collection(db,'eventos'), sdk.where('titulo','==',title)))).docs[0].id;
    }, title);
    evidence.eventoId = eventId;
    evidence.cenarios.push('Evento cadastrado pela interface com três órgãos elegíveis e três vagas');
    const managers = [];
    async function register(manager) {
      const page = manager.page;
      await page.locator('[data-tab="eventos"]').click();
      await page.locator(`[data-inscrever-colaborador="${eventId}"]`).click();
      await page.locator('#insc-participante').selectOption(manager.personId);
      await page.locator('#insc-confirmar').click();
    }
    async function cancel(manager) {
      await manager.page.locator('[data-tab="inscricoes_orgao"]').click();
      await manager.page.locator(`[data-inscricao-cancelar="${manager.registrationId}"]`).click();
      await manager.page.locator(`[data-inscricao-cancelar="${manager.registrationId}"]`).waitFor({state:'hidden'});
    }
    for (const letter of ['a','b','c']) {
      const page = await login('gestor-'+letter), email = `piloto-${letter}-${stamp}@example.invalid`;
      await page.locator('[data-tab="colaboradores"]').click();
      await page.locator('#btn-novo-colaborador').click();
      await page.locator('#colab-nome').fill('Participante fictício '+letter.toUpperCase());
      await page.locator('#colab-emailInstitucional').fill(email);
      await page.locator('#colab-setorId').selectOption(letter+'1');
      await page.locator('#colab-salvar').click();
      await page.locator('#modal-colaborador').waitFor({state:'hidden'});
      const manager = {page, personId:sha(`orgao-${letter}|${email}`), registrationId:eventId+'__'+sha(email)};
      managers.push(manager);
      await page.locator(`[data-colaborador-editar="${manager.personId}"]`).waitFor();
      await register(manager);
      await page.locator('#modal-inscricao-institucional').waitFor({state:'hidden'});
      assert.equal((await read(admin,'inscricoes',manager.registrationId)).situacao, 'confirmada');
    }
    assert.equal((await read(admin,'eventos',eventId)).inscritosCount, 3);
    await managers[0].page.locator(`[data-inscrever-colaborador="${eventId}"]`).waitFor({state:'hidden'});
    evidence.cenarios.push('Três inscrições confirmadas; evento lotado sem oferta de nova inscrição');

    const denied = await managers[0].page.evaluate(async id => {
      const sdk = await import('./firebase-local.js');
      try {await sdk.getDoc(sdk.doc(sdk.getFirestore(sdk.getApps()[0]),'inscricoes',id)); return false;}
      catch (error) {return error.code === 'permission-denied';}
    }, managers[1].registrationId);
    assert.equal(denied,true);
    await cancel(managers[1]);
    assert.equal((await read(admin,'eventos',eventId)).inscritosCount, 2);
    await register(managers[0]);
    await managers[0].page.locator('#insc-erro').getByText('Já existe inscrição', {exact:false}).waitFor();
    await managers[0].page.locator('[data-target="modal-inscricao-institucional"]').click();
    assert.equal((await read(admin,'eventos',eventId)).inscritosCount, 2);
    await register(managers[1]);
    await managers[1].page.locator('#modal-inscricao-institucional').waitFor({state:'hidden'});
    assert.equal((await read(admin,'eventos',eventId)).inscritosCount, 3);
    await cancel(managers[1]);
    assert.equal((await read(admin,'eventos',eventId)).inscritosCount, 2);
    evidence.cenarios.push('Leitura entre órgãos recusada; cancelamento libera vaga; duplicidade recusada; reinscrição preserva protocolo');

    const button = admin.locator(`[data-relatorio-evento="${eventId}"]`);
    await admin.waitForFunction(id => document.querySelector(`[data-relatorio-evento="${id}"]`)?.disabled === false, eventId);
    const downloadPending = admin.waitForEvent('download');
    await button.click();
    const download = await downloadPending, csvPath = path.resolve('test-results/piloto-tres-orgaos.csv');
    await download.saveAs(csvPath);
    const csv = fs.readFileSync(csvPath,'utf8'), lines = csv.trim().split('\r\n');
    assert.equal(lines.length,4);
    assert.equal((csv.match(/"confirmada"/g)||[]).length,2);
    assert.equal((csv.match(/"cancelada"/g)||[]).length,1);
    for (const letter of ['A','B','C']) assert.ok(csv.includes('Órgão '+letter+' fictício'));
    assert.ok(!/presente|compareceu/i.test(csv));
    for (const manager of managers) {
      const registration = await read(admin,'inscricoes',manager.registrationId);
      assert.equal(registration.protocolo, manager.registrationId);
      const audit = await read(admin,'historicoAlteracoes',registration.ultimaAuditoriaId);
      assert.equal(audit.registroId,manager.registrationId);
      assert.equal(audit.colecao,'inscricoes');
    }
    evidence.cenarios.push('CSV com duas confirmadas e uma cancelada; protocolos e auditoria conferidos; inscrição não comprova presença');
    await admin.screenshot({path:'test-results/piloto-tres-orgaos-desktop.png'});

    await admin.locator(`[data-colecao="eventos"][data-id="${eventId}"]`).click();
    await admin.locator('#evt-inscricoes-abertas').uncheck();
    await admin.locator('#btn-salvar-edicao').click();
    await admin.locator('#modal-detalhes').waitFor({state:'hidden'});
    assert.equal((await read(admin,'eventos',eventId)).inscricoesAbertas,false);
    await managers[2].page.locator('[data-tab="eventos"]').click();
    await managers[2].page.locator(`[data-inscrever-colaborador="${eventId}"]`).waitFor({state:'hidden'});
    await managers[2].page.setViewportSize({width:390,height:844});
    await managers[2].page.screenshot({path:'test-results/piloto-tres-orgaos-celular.png'});
    evidence.cenarios.push('Recebimento de inscrições encerrado pelo administrador; portal atualizado');
    assert.deepEqual(external,[]);
    assert.deepEqual(errors,[]);
    evidence.requisicoesExternas = external.length;
    evidence.errosJavaScript = errors.length;
    evidence.resultado = 'aprovado tecnicamente';
    evidence.executadoEm = new Date().toISOString();
    fs.writeFileSync('test-results/piloto-tres-orgaos.json', JSON.stringify(evidence,null,2)+'\n');
    console.log('PASSOU: piloto técnico com três órgãos, vagas, duplicidade, cancelamento/reinscrição, isolamento, CSV, auditoria e encerramento das inscrições.');
  } finally {
    await Promise.all(contexts.map(context => context.close()));
    await browser.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
