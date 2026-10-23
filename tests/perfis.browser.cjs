const {chromium}=require('playwright');
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
// Reutiliza o Firebase simulado da regressão: nenhum SDK acessa o projeto institucional.
const previous=fs.readFileSync('tests/seguranca-sessao.browser.cjs','utf8');
let stub=previous.split('const stub=String.raw`')[1].split('`;\n(async()=>')[0];
assert.ok(stub.includes('function snapshot(ref)'));
stub=stub.replace("(f[ref.collection]||[]).map(d=>snap(d.id||d.uid,d))", "(f[ref.collection]||[]).filter(d=>(ref.args||[]).every(a=>!Array.isArray(a)||a[1]==='=='?(!Array.isArray(a)||d[a[0]]===a[2]):a[1]==='in'?a[2].includes(d[a[0]]):true)).map(d=>snap(d.id||d.uid,d))");
stub=stub.replace('export function onSnapshot(ref,cb){','export function onSnapshot(ref,cb){globalThis.__queries.push(ref);');
const now=Date.now();
const access=(papel='gestor_nsi',extra={})=>({papel,orgaoId:'orgao-a',setoresIds:['a1'],situacao:'aprovado',inicio:now-60000,fim:now+3600000,revisao:now+1800000,titularUid:papel==='substituto'?'nsi':'',
    acoes:papel==='auditoria'?['auditoria.consultar','relatorios.consultar']:papel==='grgd'?['eventos.consultar','eventos.editar']:['orgao.consultar','participantes.consultar','eventos.consultar','inscricoes.consultar'],
    aprovacaoGrgd:{responsavel:'GRGD fictícia',referencia:'G1'},aprovacaoAutoridade:{responsavel:'Autoridade fictícia',referencia:'A1'},registradoPorUid:'admin',registradoEm:'data fictícia',...extra});
const user=(uid,extra={})=>({id:uid,uid,nome:uid+' de demonstração',email:uid+'@example.invalid',ativo:true,tipoUsuario:'externo',perfil:'comum',modulosPermitidos:[],...extra});
const admin=user('admin',{perfil:'admin',tipoUsuario:'interno'}),nsi=user('nsi',{acessoInstitucional:access()}),auditor=user('auditor',{tipoUsuario:'interno',acessoInstitucional:access('auditoria')}),grgd=user('grgd',{tipoUsuario:'interno',acessoInstitucional:access('grgd',{orgaoId:'',setoresIds:[]})});
const fixture=me=>({me,usuarios:[admin,nsi,auditor,grgd,user('novo')],
    orgaos:[{id:'orgao-a',nome:'Órgão A fictício',sigla:'DEMO-A'},{id:'orgao-b',nome:'Órgão B fictício',sigla:'DEMO-B'}],
    setores:[{id:'a1',nome:'NSI A',orgaoId:'orgao-a',ativo:true},{id:'a2',nome:'Setor A2',orgaoId:'orgao-a',ativo:true},{id:'b1',nome:'NSI B',orgaoId:'orgao-b',ativo:true}],
    colaboradores:[{id:'c1',nome:'Pessoa A1 fictícia',emailInstitucional:'a1@example.invalid',orgaoId:'orgao-a',setorId:'a1'},{id:'c2',nome:'Pessoa A2 não autorizada',orgaoId:'orgao-a',setorId:'a2'},{id:'c3',nome:'Pessoa B não autorizada',orgaoId:'orgao-b',setorId:'b1'}],
    eventos:[{id:'e1',titulo:'Evento fictício',eventoPublico:true,dataInicio:'2099-01-01'}],
    inscricoes:[{id:'i1',orgaoId:'orgao-a',setorId:'a1',eventId:'e1',participanteNome:'Pessoa A1 fictícia',situacao:'Confirmada',protocolo:'DEMO-001'},{id:'i2',orgaoId:'orgao-b',setorId:'b1',eventId:'e1',participanteNome:'Pessoa B não autorizada'}],
    historicoAlteracoes:[{id:'h1',orgaoId:'orgao-a',setorId:'a1',autorNome:'Autor de demonstração',acao:'editar',registroNome:'Registro de demonstração'}]});
(async()=>{
    fs.mkdirSync('test-results',{recursive:true});
    const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(req.url.split('?')[0]==='/previa-perfis.html'?'previa-perfis.html':'index.html'));});
    await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
    const base='http://127.0.0.1:'+server.address().port,errors=[];
    async function appPage(me){
        const context=await browser.newContext({viewport:{width:1440,height:1100}}),page=await context.newPage();
        page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
        await page.addInitScript(f=>{globalThis.__fixture=f;globalThis.__queries=[];globalThis.__transactions=[];globalThis.__reauths=0;globalThis.__refreshes=0;},fixture(me));
        await page.route('https://www.gstatic.com/firebasejs/**',r=>r.fulfill({contentType:'application/javascript',headers:{'access-control-allow-origin':'*'},body:stub}));
        await page.route('**/*',r=>/googleapis\.com|firebaseio\.com|firebaseapp\.com/.test(r.request().url())?r.abort():r.fallback());
        await page.goto(base);if(process.env.PRGD_TEST_CSS)await page.addStyleTag({content:fs.readFileSync(process.env.PRGD_TEST_CSS,'utf8')});await page.locator('#main-content').waitFor({state:'visible'});return {page,context};
    }
    try{
        browser=await chromium.launch();
        {
            const {page,context}=await appPage(nsi);
            await page.locator('#portal-resumo').getByRole('heading',{name:'Órgão A fictício'}).waitFor();
            assert.equal(await page.locator('[data-tab="usuarios"]').isVisible(),false);
            assert.equal(await page.locator('[data-tab="fornecedores"]').isVisible(),false);
            await page.locator('[data-tab="colaboradores"]').click();await page.locator('#portal-colaboradores').getByText('Pessoa A1 fictícia').waitFor();
            assert.ok(!(await page.locator('#portal-colaboradores').innerText()).includes('não autorizada'));
            await page.reload();if(process.env.PRGD_TEST_CSS)await page.addStyleTag({content:fs.readFileSync(process.env.PRGD_TEST_CSS,'utf8')});await page.locator('#aba-colaboradores').waitFor({state:'visible'});
            await page.locator('#portal-colaboradores').getByText('Pessoa A1 fictícia').waitFor();
            assert.ok((await page.evaluate(()=>__queries)).filter(r=>r.collection==='colaboradores').every(r=>r.args.some(a=>a[0]==='orgaoId'&&a[2]==='orgao-a')));
            await page.screenshot({path:'test-results/perfil-nsi.png'});
            await page.locator('[data-tab="eventos"]').click();assert.equal(await page.locator('[data-acao-inscricao]').count(),0);
            await page.locator('#btn-executar-logout').click();await page.locator('#modal-login').waitFor({state:'visible'});
            assert.equal(await page.locator('#portal-colaboradores').innerHTML(),'');
            await context.close();
        }
        {
            const {page,context}=await appPage(auditor);
            assert.equal(await page.locator('[data-tab="colaboradores"]').isVisible(),false);
            assert.equal(await page.locator('[data-tab="usuarios"]').isVisible(),false);
            await page.locator('[data-tab="auditoria_orgao"]').click();await page.locator('#portal-auditoria').getByText('Autor de demonstração').waitFor();
            await page.screenshot({path:'test-results/perfil-auditoria.png'});await context.close();
        }
        {
            const {page,context}=await appPage(grgd);
            assert.equal(await page.locator('[data-tab="usuarios"]').isVisible(),false);
            await page.locator('[data-tab="eventos"]').click();
            assert.equal(await page.locator('[data-modal-target="evento"]').isVisible(),false);
            await page.getByRole('button',{name:'Detalhes',exact:true}).click();
            assert.equal(await page.locator('#detalhe-area-admin').isVisible(),true);
            assert.equal(await page.locator('#btn-excluir-registro').isVisible(),false);
            await context.close();
        }
        {
            const {page,context}=await appPage(admin);
            await page.locator('[data-tab="colaboradores"]').click();await page.locator('[data-colab-secao="acessos"]').click();await page.locator('[data-usuario-editar="novo"]').click();
            await page.locator('#vinculo-papel').selectOption('gestor_nsi');await page.locator('#vinculo-orgao').selectOption('orgao-a');
            await page.locator('#vinculo-setores').selectOption(['a1']);
            for(const a of ['orgao.consultar','participantes.consultar','eventos.consultar','inscricoes.consultar'])await page.locator('[name="vinculo-acao"][value="'+a+'"]').check();
            const fmt=t=>new Date(t-new Date(t).getTimezoneOffset()*60000).toISOString().slice(0,16);
            for(const [id,time]of [['inicio',now-60000],['fim',now+3600000],['revisao',now+1800000]])await page.locator('#vinculo-'+id).fill(fmt(time));
            await page.locator('#vinculo-situacao').selectOption('aprovado');
            for(const id of ['grgd-nome','grgd-ref','autoridade-nome','autoridade-ref'])await page.locator('#vinculo-'+id).fill('Referência fictícia '+id);
            await page.locator('#edit-campos-dinamicos').evaluate(el=>el.scrollTop=0);await page.screenshot({path:'test-results/formulario-vinculo.png'});
            await page.locator('#btn-salvar-edicao').click();await page.locator('#revisar-usuario-confirmar').click();await page.locator('#modal-detalhes').waitFor({state:'hidden'});
            const v=await page.evaluate(()=>__fixture.usuarios.find(u=>u.uid==='novo').acessoInstitucional);
            assert.equal(v.situacao,'aprovado');assert.equal(v.orgaoId,'orgao-a');assert.deepEqual(v.setoresIds,['a1']);assert.equal(v.registradoPorUid,'admin');
            assert.ok((await page.evaluate(()=>__transactions.at(-1))).some(op=>op.ref.collection==='historicoAlteracoes'&&op.data.campos.includes('acessoInstitucional')));
            await page.locator('[data-usuario-editar="novo"]').click();await page.locator('#vinculo-setores').selectOption(['a2']);
            assert.equal(await page.locator('#vinculo-situacao').inputValue(),'pendente');assert.equal(await page.locator('#vinculo-grgd-ref').inputValue(),'');assert.equal(await page.locator('#vinculo-autoridade-ref').inputValue(),'');
            await page.locator('#btn-salvar-edicao').click();await page.locator('#revisar-usuario-confirmar').click();await page.locator('#modal-detalhes').waitFor({state:'hidden'});
            assert.equal(await page.evaluate(()=>__fixture.usuarios.find(u=>u.uid==='novo').acessoInstitucional.situacao),'pendente');
            await context.close();
        }
        {
            const context=await browser.newContext(),page=await context.newPage(),outbound=[];
            page.on('request',r=>{if(!r.url().startsWith(base))outbound.push(r.url());});
            page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/previa-perfis.html');
            for(const role of ['admin','grgd','gestor_nsi','substituto','auditoria','participante']){await page.locator('#perfil').selectOption(role);assert.ok(await page.locator('h2').innerText());}
            await page.locator('#perfil').selectOption('admin');await page.getByRole('button',{name:'Vínculos e aprovações',exact:true}).click();
            await page.getByRole('button',{name:'Revisar vínculo fictício'}).click();await page.getByRole('button',{name:'Confirmar no exemplo'}).click();
            assert.match(await page.locator('#feedback').innerText(),/somente nesta demonstração/);
            await page.screenshot({path:'test-results/previa-governanca.png',fullPage:true});
            await page.setViewportSize({width:390,height:844});await page.locator('#perfil').selectOption('gestor_nsi');
            assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
            await page.screenshot({path:'test-results/previa-mobile.png',fullPage:true});
            assert.deepEqual(outbound,[]);await context.close();
        }
        assert.deepEqual(errors,[]);console.log('Perfis: escopo, F5, logout, auditoria, edição GRGD, aprovação e prévia isolada aprovados.');
    }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(err=>{console.error(err);process.exitCode=1;});
