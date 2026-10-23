const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function vinculoTeste(extra={}) {
    const agora=Date.now();
    return {papel:'gestor_nsi',situacao:'aprovado',orgaoId:'orgao-a',setoresIds:['a1'],
        inicio:agora-60000,fim:agora+3600000,revisao:agora+1800000,titularUid:'',
        acoes:['orgao.consultar','participantes.consultar','eventos.consultar','inscricoes.consultar'],
        aprovacaoGrgd:{responsavel:'GRGD de teste',referencia:'Protocolo fictício G1'},
        aprovacaoAutoridade:{responsavel:'Autoridade de teste',referencia:'Protocolo fictício A1'},...extra};
}

// Exercita o módulo real com DOM/Firebase simulados, sem acessar serviços ou dados reais.
function app({revisaoAutomatica=true}={}) {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const source = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1]
        .replace(/^\s*import .*?;\s*$/gm, '');
    const nodes = new Map(), writes = [], audits = [], charts = [], listeners = new Map(), snapshots = [], storage = new Map();
    let autoId = 0;
    const element = id => {
        if (!nodes.has(id)) nodes.set(id, {
            value: '', textContent: '', innerHTML: '', style: {}, dataset: {},
            classList: { values:new Set(), add(...v) {v.forEach(x=>this.values.add(x));}, remove(...v) {v.forEach(x=>this.values.delete(x));}, toggle(v,force) { const on=force ?? !this.values.has(v);on?this.values.add(v):this.values.delete(v); }, contains(v){return this.values.has(v);} },
            addEventListener(type, fn) { listeners.set(id + ':' + type, fn); },
            click() { listeners.get(id + ':click')?.(); },
            setAttribute() {},
            appendChild() {},
            getContext() { return {}; }
        });
        return nodes.get(id);
    };
    const context = vm.createContext({
        console: { info() {}, warn() {} }, window: {}, crypto:require("node:crypto").webcrypto,TextEncoder, setTimeout(){return 1;},clearTimeout(){},
        document: { body:{setAttribute(){}},getElementById: element, createElement() { return {}; }, querySelectorAll() { return []; }, querySelector() { return null; }, addEventListener() {} },
        sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
        alert() {}, confirm() { return true; },
        initializeApp(config, name = '[DEFAULT]') { return {name}; }, getApps() { return []; }, getFirestore() { return {}; }, getAuth(app) { return app; },
        async createUserWithEmailAndPassword(auth, email, password) { return {user:{uid:'novo-uid'}}; }, async deleteUser() {},
        browserLocalPersistence: {tipo:'local'}, inMemoryPersistence: {tipo:'memory'}, setPersistence() { return Promise.resolve(); },
        signInWithEmailAndPassword() { return Promise.resolve(); }, signOut() { return Promise.resolve(); },
        collection(db, name) { return name; }, doc(db, collection, id, ...segments) { if(arguments.length===1){collection=db;id='auto-'+(++autoId);} return { collection, id, path:[collection,id,...segments].join('/') }; },
        increment(n){return {__increment:n};},serverTimestamp(){return {servidor:true};},orderBy(...v){return v;},limit(n){return n;},startAfter(v){return v;},
        async runTransaction(db, fn) {const pending=[];await fn({get:ref=>context.getDoc(ref),set:(ref,data,options)=>pending.push({ref,data,options}),delete:ref=>pending.push({ref,remover:true})});for(const w of pending){if(w.ref.collection==='historicoAlteracoes')audits.push(w.data);else if(w.remover)await context.deleteDoc(w.ref);else await context.setDoc(w.ref,w.data,w.options);}},
        writeBatch() { const pending=[]; return {set(ref,data,options){pending.push({ref,data,options});},async commit(){ for(const w of pending)await context.setDoc(w.ref,w.data,w.options); }}; },
        EmailAuthProvider:{credential(email,password){return {email,password};}}, async reauthenticateWithCredential(){},async updatePassword(){},
        async addDoc(collection, data) { writes.push({ collection, data }); },
        async setDoc(ref, data, options) { writes.push({ collection: ref.collection, id:ref.id, path:ref.path, data, options }); }, async deleteDoc() {},
        onSnapshot(ref, callback, error) { const sub = {ref, callback, error}; snapshots.push(sub); return () => {}; }, async getDoc() { return { exists() { return false; } }; },
        query(...args) { return args; }, where(...args) { return args; }, async getDocs() { return { docs: [] }; },
        onAuthStateChanged(auth, callback) { context.authCallback = callback; },
        Chart: function(ctx, config) { charts.push(config); this.destroy = () => {}; }
    });
    vm.runInContext(source, context);
    if(revisaoAutomatica)vm.runInContext("revisarUsuario=async()=>true",context);
    return { run: code => vm.runInContext(code, context), element, writes, audits, charts, listeners, snapshots, context,storage };
}

async function confirmarExclusaoTeste(a) {
    a.run("auth.currentUser={uid:currentUser.uid,email:'admin@example.invalid',getIdToken:async()=>''}");
    await a.run('excluirRegistroUniversal()');a.element('exclusao-senha').value='senha-de-teste';
    await a.run('confirmarExclusao({preventDefault(){}})');
}

test('cadastro de local grava na mesma coleção lida pelo módulo', async () => {
    const a = app(); a.run("currentUser={uid:'admin',perfil:'admin',tipoUsuario:'interno'}"); a.element('form-univ-tipo').value = 'local'; a.element('uc-1').value = 'Auditório';
    await a.run('salvarCadastroUniversal({preventDefault(){}})');
    assert.equal(a.writes[0].collection, 'locais');
});

test('tipo de cadastro desconhecido não cria coleção', async () => {
    const a = app(); a.element('form-univ-tipo').value = 'desconhecido';
    await a.run('salvarCadastroUniversal({preventDefault(){}})'); assert.equal(a.writes.length, 0);
});

test('demandas ativas excluem concluídas e canceladas, preservando pausadas', () => {
    const a = app(); a.run("dbData.demandas=[{status:'Concluído'},{status:'Concluido'},{status:'Cancelado'},{status:'Pausado'},{status:'Em Andamento'}];renderDashboardKPIs()");
    assert.equal(a.element('dash-tot-demandas').textContent, 2);
});

test('gráfico sem demandas não inventa categoria ou quantidade', () => {
    const a = app(); a.run('renderCharts()');
    assert.equal(a.charts[0].data.labels.length, 0); assert.equal(a.charts[0].data.datasets[0].data.length, 0);
});

test('renderização após atualização dos dados atualiza os gráficos', () => {
    const a = app(); a.run("dbData.demandas=[{categoria:'Suporte',status:'Pausado'}];renderizarTudo()");
    assert.equal(a.charts[0].data.labels[0], 'Suporte'); assert.equal(a.charts[0].data.datasets[0].data[0], 1);
});

test('próximo mês a partir de 31 de janeiro não pula fevereiro', () => {
    const a = app(); a.run('dataMensalAtual=new Date(2026,0,31)'); a.listeners.get('btn-mes-proximo:click')();
    assert.equal(a.run('dataMensalAtual.getMonth()'), 1); assert.equal(a.run('dataMensalAtual.getDate()'), 1);
});

test('mês anterior a partir de 31 de março não permanece em março', () => {
    const a = app(); a.run('dataMensalAtual=new Date(2026,2,31)'); a.listeners.get('btn-mes-anterior:click')();
    assert.equal(a.run('dataMensalAtual.getMonth()'), 1);
});

test('datas inválidas não retornam HTML para inserção nas telas', () => {
    const a = app(); assert.equal(a.run('formatarData("<b>marcador</b>")'), '-');
    assert.equal(a.run('formatarData("2026-02-30")'), '-'); assert.equal(a.run('formatarData(null)'), '-');
});

test('datas válidas e timestamps continuam sendo formatados', () => {
    const a = app(); assert.equal(a.run('formatarData("2026-10-19")'), '19/10/2026');
    assert.equal(a.run('formatarData("2026-10-19T15:00:00Z")'), '19/10/2026');
});

test('cor arbitrária não injeta atributos nos cards', () => {
    const a = app(); const h = a.run('criarPostItHtml({titulo:"Teste",corCard:\'x" data-audit-marker="unsafe\'})');
    assert.equal(h.includes('data-audit-marker='), false);
    assert.equal(a.run("obterClasseCorCard(CORES_CARD_DEMANDA[0].id)"), a.run('CORES_CARD_DEMANDA[0].id'));
});

test('snapshot remove evento que deixou de constar no resultado e atualiza contadores', () => {
    const a = app(); a.run("atualizarEventosVisiveis([{id:'ev1',firestoreId:'doc1',eventoPublico:true,titulo:'Evento',dataInicio:'2099-01-01'}])");
    assert.equal(a.element('cnt-tab-eventos').textContent, 1);
    a.run('atualizarEventosVisiveis([])'); assert.equal(a.run('dbData.eventos.length'), 0);
    assert.equal(a.element('dash-tot-eventos').textContent, 0);
});

test('logout limpa dados, detalhes de registros e campos de observações', async () => {
    const a = app(); a.run("dbData.orgaos=[{nome:'Conta anterior'}];dbData.inscricoes=[{uid:'antigo'}]");
    a.element('detalhe-conteudo').innerHTML = 'Contato da conta anterior'; a.element('obs-demanda-id').value = 'antigo';
    a.element('busca-usuarios').value = 'Pessoa da conta anterior'; a.run("buscaUsuariosVal='pessoa anterior'");
    await a.context.authCallback(null);
    assert.equal(a.run('dbData.orgaos.length + dbData.inscricoes.length'), 0);
    assert.equal(a.element('detalhe-conteudo').innerHTML, ''); assert.equal(a.element('obs-demanda-id').value, '');
    assert.equal(a.element('busca-usuarios').value, ''); assert.equal(a.run('buscaUsuariosVal'), '');
});

test('perfil da conta anterior não substitui a conta atual quando retorna atrasado', async () => {
    const a = app(); let resolveAnterior;
    a.context.getDoc = ref => ref.id === 'conta-a'
        ? new Promise(resolve => { resolveAnterior = resolve; })
        : Promise.resolve({ exists: () => true, data: () => ({nome:'Conta B',perfil:'comum'}) });
    const anterior = a.context.authCallback({uid:'conta-a',email:'a@example.invalid'});
    await a.context.authCallback({uid:'conta-b',email:'b@example.invalid'});
    resolveAnterior({exists:()=>true,data:()=>({nome:'Conta A',perfil:'admin'})});
    await anterior;
    assert.equal(a.run('currentUser.uid'), 'conta-b');
    assert.equal(a.element('user-name-display').textContent, 'Conta B');
});

test('snapshot da sessão anterior é ignorado após logout', async () => {
    const a = app(); a.run("currentUser={uid:'a',perfil:'admin'};iniciarSnapshotFirestore()");
    const anterior = a.snapshots.find(x => x.ref === 'orgaos');
    await a.context.authCallback(null);
    anterior.callback({docs:[{id:'antigo',data:()=>({nome:'Dado anterior'})}]});
    assert.equal(a.run('dbData.orgaos.length'), 0);
});

test('identidade autenticada prevalece sobre uid e e-mail armazenados no perfil', async () => {
    const a = app(); a.context.getDoc = async () => ({exists:()=>true,data:()=>({uid:'outro',email:'outro@example.invalid',perfil:'comum'})});
    await a.context.authCallback({uid:'real',email:'real@example.invalid'});
    assert.equal(a.run('currentUser.uid'), 'real'); assert.equal(a.run('currentUser.email'), 'real@example.invalid');
});

test('buscas existentes filtram locais, fornecedores e bases', () => {
    const a = app();
    a.run("dbData.locais=[{nome:'Auditório Norte'},{nome:'Sala Sul'}];dbData.fornecedores=[{nome:'Empresa Norte',cnpj:'123'},{nome:'Empresa Sul',cnpj:'456'}];dbData.bases=[{nome:'Norte',categoria:'Região'},{nome:'Sul',categoria:'Região'}]");
    a.listeners.get('busca-locais:input')({target:{value:'norte'}});
    assert.equal(a.element('count-locais').textContent, 1); assert.ok(!a.element('tabela-locais').innerHTML.includes('Sala Sul'));
    a.listeners.get('busca-fornecedores:input')({target:{value:'456'}});
    assert.equal(a.element('count-fornecedores').textContent, 1); assert.ok(!a.element('tabela-fornecedores').innerHTML.includes('Empresa Norte'));
    a.listeners.get('busca-bases:input')({target:{value:'norte'}});
    assert.equal(a.element('count-bases').textContent, 1);
});

test('busca e filtros de usuários funcionam em conjunto', () => {
    const a = app(); a.run("dbData.usuarios=[{nome:'Ana',email:'a@example.invalid',orgao:'A',tags:['Internos ATI']},{nome:'Bruno',email:'b@example.invalid',orgao:'B',tags:['Externos']}]");
    a.listeners.get('filtro-orgao-usuario:change')({target:{value:'A'}});
    assert.equal(a.element('count-usuarios').textContent, 1);
    a.listeners.get('filtro-tag-usuario:change')({target:{value:'Externos'}});
    assert.equal(a.element('count-usuarios').textContent, 0);
    a.listeners.get('filtro-orgao-usuario:change')({target:{value:''}});
    a.listeners.get('busca-usuarios:input')({target:{value:'bruno'}});
    assert.equal(a.element('count-usuarios').textContent, 1);
    assert.ok(a.element('tabela-usuarios').innerHTML.includes('Externos'));
});

test('editor mantém controles booleanos e numéricos e protege histórico estruturado', () => {
    const a = app(); a.run("montarEdicaoEstruturada('eventos',{eventoPublico:true,limiteVagas:0,gruposPermitidos:['g1','g2'],historicoAcoes:[]})");
    const markup = a.element('edit-campos-dinamicos').innerHTML;
    assert.ok(markup.includes('data-field-type="boolean"')); assert.ok(markup.includes('type="number"'));
    assert.ok(markup.includes('value="0"')); assert.ok(markup.includes('data-field-type="string-list"'));
    assert.ok(!markup.includes('name="historicoAcoes"'));
});

test('salvar edição preserva tipos e metadados de criação', async () => {
    const a = app(); a.run("currentUser={uid:'admin',perfil:'admin',nome:'Admin'};dbData.eventos=[{firestoreId:'ev',eventoPublico:true,limiteVagas:10,gruposPermitidos:['g1'],criadoEm:'2026-01-01',criadoPor:'Original',uid:'fixo'}]");
    a.element('edit-colecao').value='eventos'; a.element('edit-doc-id').value='ev';
    const fields=[['eventoPublico','false','boolean'],['limiteVagas','0','number'],['gruposPermitidos','g1, g2','string-list'],['criadoPor','Alterado',''],['uid','alterado','']].map(([name,value,fieldType])=>({name,value,dataset:{fieldType}}));
    await a.run('Promise.resolve()');
    a.context.editEvent={preventDefault(){},target:{querySelectorAll:()=>fields}};
    await a.run('salvarEdicaoAdmin(editEvent)');
    const data=a.writes[0].data;
    assert.equal(data.eventoPublico,false); assert.equal(data.limiteVagas,0);
    assert.deepEqual(Array.from(data.gruposPermitidos),['g1','g2']);
    assert.equal(data.criadoPor,'Original'); assert.equal(data.criadoEm,'2026-01-01'); assert.equal(data.uid,undefined);
});

test('número inválido impede a gravação inteira da edição', async () => {
    const a = app(); a.run("currentUser={perfil:'admin'};dbData.eventos=[{firestoreId:'ev',limiteVagas:10}]");
    a.element('edit-colecao').value='eventos';a.element('edit-doc-id').value='ev';
    a.context.editEvent={preventDefault(){},target:{querySelectorAll:()=>[{name:'limiteVagas',value:'inválido',dataset:{fieldType:'number'}}]}};
    await a.run('salvarEdicaoAdmin(editEvent)');assert.equal(a.writes.length,0);
});

test('lista não alterada mantém itens que já contêm vírgulas', async () => {
    const a=app();a.run("currentUser={uid:'admin',perfil:'admin'};dbData.eventos=[{firestoreId:'ev',gruposPermitidos:['grupo, especial','comum']}]");
    a.element('edit-colecao').value='eventos';a.element('edit-doc-id').value='ev';
    a.context.editEvent={preventDefault(){},target:{querySelectorAll:()=>[{name:'gruposPermitidos',value:'grupo, especial, comum',dataset:{fieldType:'string-list'}}]}};
    await a.run('salvarEdicaoAdmin(editEvent)');assert.deepEqual(Array.from(a.writes[0].data.gruposPermitidos),['grupo, especial','comum']);
});


function preencherUsuario(a, dados = {}) {
    const valores = {nome:'Ana Silva', email:'ana@example.invalid', tipo:'interno', perfil:'comum', ativo:'true', orgao:'ATI', tags:'Equipe', senha:'senha-simulada', ...dados};
    for (const [chave, valor] of Object.entries(valores)) a.element('usuario-'+chave).value = valor;
    a.element('usuario-grupos').selectedOptions = [];
    a.context.document.querySelectorAll = () => [];
}

test('tipo não concede administração e externo não recebe módulos internos', () => {
    const a = app();
    assert.equal(a.run("ehAdministrador({tipoUsuario:'interno',perfil:'comum'})"),false);
    assert.equal(a.run("ehAdministrador({tipoUsuario:'externo',perfil:'admin'})"),false);
    assert.equal(a.run("ehAdministrador({tipoUsuario:'interno',perfil:'admin',ativo:false})"),false);
    assert.deepEqual(Array.from(a.run("modulosDoUsuario({tipoUsuario:'externo',perfil:'admin',modulosPermitidos:['usuarios','demandas','eventos']})")),['eventos']);
    assert.deepEqual(Array.from(a.run("modulosDoUsuario({tipoUsuario:'interno',perfil:'comum',modulosPermitidos:[]})")),[]);
    assert.equal(a.run("ehAdministrador({perfil:'admin'})"),true);
});

test('lista GRGD contém apenas internos explicitamente ativos e distingue nomes iguais', () => {
    const a=app(); a.run("dbData.usuarios=[{firestoreId:'a',nome:'Ana',tipoUsuario:'interno',ativo:true},{firestoreId:'b',nome:'Ana',tipoUsuario:'interno',ativo:true},{firestoreId:'x',tipoUsuario:'externo',ativo:true},{firestoreId:'i',tipoUsuario:'interno',ativo:false},{firestoreId:'legado',nome:'Ana'}]");
    assert.deepEqual(Array.from(a.run('internosAtivos().map(uidCadastro)')),['a','b']);
    const h=a.run("camposResponsaveis('teste',{responsavelGrgd:['Ana']})");
    assert.ok(h.includes('value="a"'));assert.ok(h.includes('value="b"'));
    assert.ok(!h.includes('value="a" data-legado="false" checked'));
    assert.ok(h.includes('value="Ana" data-legado="true" checked'));
});

test('renomear responsável mantém UID e exibe o novo nome com fallback histórico', () => {
    const a=app();a.run("dbData.usuarios=[{firestoreId:'u',nome:'Nome novo',tipoUsuario:'interno',ativo:true}];dbData.demandas=[{responsaveisGrgdIds:['u'],responsaveisGrgdSnapshot:[{uid:'u',nome:'Nome original'}],responsaveisGrgdLegados:['Nome legado']}]");
    assert.deepEqual(Array.from(a.run('nomesResponsaveis(dbData.demandas[0])')),['Nome novo','Nome legado']);
    a.run('dbData.usuarios=[]');assert.deepEqual(Array.from(a.run('nomesResponsaveis(dbData.demandas[0])')),['Nome original','Nome legado']);
});

test('vínculo inativo anterior e nomes legados são preservados ao salvar demanda', () => {
    const a=app();a.run("dbData.usuarios=[{firestoreId:'novo',nome:'Novo',email:'n@example.invalid',tipoUsuario:'interno',ativo:true}]");
    const dados=a.run("lerResponsaveis([{value:'novo',dataset:{}},{value:'antigo',dataset:{}},{value:'Legado',dataset:{legado:'true'}}],{responsaveisGrgdIds:['antigo'],responsaveisGrgdSnapshot:[{uid:'antigo',nome:'Original'}],responsaveisGrgdLegados:['Legado']})");
    assert.deepEqual(Array.from(dados.responsaveisGrgdIds),['novo','antigo']);
    assert.deepEqual(Array.from(dados.responsavelGrgd),['Novo','Original','Legado']);
});

test('externo, inativo e nome forjado não podem receber uma nova atribuição GRGD', () => {
    const a=app();a.run("dbData.usuarios=[{firestoreId:'e',tipoUsuario:'externo',ativo:true},{firestoreId:'i',tipoUsuario:'interno',ativo:false}]");
    for(const uid of ['e','i','inexistente']) assert.throws(()=>a.run(`lerResponsaveis([{value:'${uid}',dataset:{}}])`));
    assert.throws(()=>a.run("lerResponsaveis([{value:'forjado',dataset:{legado:'true'}}],{responsavelGrgd:['Original']})"));
});

test('interno novo cria login e perfil no mesmo UID sem desconectar o administrador', async () => {
    const a=app(); preencherUsuario(a); a.run("currentUser={uid:'admin',perfil:'admin',nome:'Admin'}");
    const desconexoes=[];let criouEm;
    a.context.createUserWithEmailAndPassword=async(auth,email,senha)=>{criouEm=auth.name;return {user:{uid:'novo-uid'}};};
    a.context.signOut=async auth=>desconexoes.push(auth.name);
    await a.run('criarCadastroUsuario()');
    assert.equal(criouEm,'prgd-cadastro');assert.deepEqual(desconexoes,['prgd-cadastro']);
    assert.equal(a.run('currentUser.uid'),'admin'); assert.equal(a.writes[0].id,'novo-uid');
    assert.equal(a.writes[0].data.uid,'novo-uid');assert.equal(a.writes[0].data.tipoUsuario,'interno');
    assert.equal(a.writes[0].data.senha,undefined);assert.equal(a.writes[0].data.password,undefined);
    assert.equal(a.element('usuario-senha').value,'');
});

test('falha ao gravar perfil remove a conta Auth recém-criada', async () => {
    const a=app();preencherUsuario(a);a.run("currentUser={uid:'admin',perfil:'admin'}");
    const removidas=[];a.context.setDoc=async()=>{throw new Error('permission-denied');};
    a.context.deleteUser=async user=>removidas.push(user.uid);
    await assert.rejects(a.run('criarCadastroUsuario()'),/permission-denied/);
    assert.deepEqual(removidas,['novo-uid']);assert.equal(a.run('cadastroUsuarioEmAndamento'),false);
});

test('cadastro externo começa sem permissões internas e perfil inválido impede criar Auth', async () => {
    const a=app();preencherUsuario(a,{tipo:'externo'});a.run("currentUser={uid:'admin',perfil:'admin'}");
    await a.run('criarCadastroUsuario()');
    assert.equal(a.writes[0].data.perfil,'comum');assert.equal(a.writes[0].data.modulosPermitidos.length,0);
    preencherUsuario(a,{tipo:'externo',perfil:'admin'});
    await assert.rejects(a.run('criarCadastroUsuario()'),/Somente usuários internos/);
    assert.equal(a.writes.filter(w=>w.collection==='usuarios').length,1);
});

test('cadastro preserva lista de tags que contém vírgula e valida módulos por tipo', () => {
    const a=app();preencherUsuario(a,{tags:'grupo, especial, comum'});a.run("currentUser={uid:'admin',perfil:'admin'}");
    const dados=a.run("lerDadosUsuario({tags:['grupo, especial','comum']})");
    assert.deepEqual(Array.from(dados.tags),['grupo, especial','comum']);
    preencherUsuario(a,{tipo:'externo'});a.context.document.querySelectorAll=()=>[{value:'demandas'}];
    assert.throws(()=>a.run('lerDadosUsuario()'),/Módulo não permitido/);
});

test('editar usuário legado mantém documento, metadados e campos desconhecidos via merge', async () => {
    const a=app();preencherUsuario(a);a.run("currentUser={uid:'admin',perfil:'admin',nome:'Admin'};dbData.usuarios=[{firestoreId:'legado',nome:'Original',criadoEm:'2025-01-01',criadoPor:'Origem',campoLegado:'preservado'}]");
    a.element('edit-colecao').value='usuarios';a.element('edit-doc-id').value='legado';
    a.context.editEvent={preventDefault(){},target:{querySelectorAll(){return [];}}};
    await a.run('salvarEdicaoAdmin(editEvent)');
    assert.equal(a.writes[0].id,'legado');assert.equal(a.writes[0].data.uid,'legado');assert.equal(a.writes[0].options.merge,true);
    assert.equal(a.writes[0].data.criadoEm,'2025-01-01');assert.equal(a.writes[0].data.criadoPor,'Origem');
});

test('administrador não inativa nem rebaixa a própria conta', async () => {
    const a=app();preencherUsuario(a,{ativo:'false'});a.run("currentUser={uid:'admin',perfil:'admin'}");
    assert.throws(()=>a.run("lerDadosUsuario({firestoreId:'admin'})"),/própria conta/);
    a.element('edit-colecao').value='usuarios';a.element('edit-doc-id').value='admin';
    await a.run('excluirRegistroUniversal()');assert.equal(a.writes.length,0);
});

test('inativar usuário preserva o documento e não apaga conta nem demandas', async () => {
    const a=app();a.run("currentUser={uid:'admin',perfil:'admin',nome:'Admin'};dbData.usuarios=[{firestoreId:'interno',uid:'interno',nome:'Interno'}]");
    a.element('edit-colecao').value='usuarios';a.element('edit-doc-id').value='interno';
    a.context.deleteDoc=async()=>{throw new Error('Não deve excluir');};
    await confirmarExclusaoTeste(a);
    assert.equal(a.writes[0].data.ativo,false);assert.equal(a.writes[0].id,'interno');assert.equal(a.writes[0].options.merge,true);
});

test('conta sem perfil ou inativa não ganha permissões por fallback', async () => {
    for(const perfil of [null,{perfil:'admin',ativo:false}]) {
        const a=app();a.context.getDoc=async()=>({exists:()=>!!perfil,data:()=>perfil});
        await a.context.authCallback({uid:'u',email:'u@example.invalid'});
        assert.equal(a.run('currentUser'),null);assert.equal(a.snapshots.length,0);
        assert.ok(a.element('login-msg').textContent.includes('inativo'));
    }
});

test('externo sem módulos consulta apenas o próprio perfil e seus dados privados', () => {
    const a=app();a.run("currentUser={uid:'externo',tipoUsuario:'externo',perfil:'comum',ativo:true,modulosPermitidos:[]};iniciarSnapshotFirestore()");
    assert.equal(a.snapshots.length,2);assert.equal(a.snapshots[0].ref.collection,'usuarios');assert.equal(a.snapshots[0].ref.id,'externo');
    a.run("mudarAba('demandas')");assert.notEqual(a.run('abaAtual'),'demandas');
});

test('interno com Demandas consulta somente o diretório interno ativo', () => {
    const a=app();a.run("currentUser={uid:'interno',tipoUsuario:'interno',perfil:'comum',ativo:true,modulosPermitidos:['demandas']};iniciarSnapshotFirestore()");
    assert.ok(a.snapshots.some(s=>s.ref==='demandas'));
    const diretorio=a.snapshots.find(s=>Array.isArray(s.ref)&&s.ref[0]==='identidadesUsuarios');
    assert.deepEqual(diretorio.ref,[ 'identidadesUsuarios',['tipoUsuario','==','interno'],['ativo','==',true] ]);
    assert.ok(!a.snapshots.some(s=>s.ref==='grupos'||s.ref==='inscricoes'||s.ref==='orgaos'));
});

test('revogar permissão limpa dados e ignora callbacks anteriores na mesma sessão', async () => {
    const a=app();a.run("currentUser={uid:'u',email:'u@example.invalid',tipoUsuario:'interno',perfil:'comum',ativo:true,modulosPermitidos:['demandas']};dbData.demandas=[{titulo:'Sigiloso'}];iniciarSnapshotFirestore()");
    const antigo=a.snapshots.find(s=>s.ref==='demandas');
    const perfil=a.snapshots.find(s=>s.ref.collection==='usuarios');
    await perfil.callback({id:'u',exists:()=>true,data:()=>({tipoUsuario:'interno',perfil:'comum',ativo:true,modulosPermitidos:[]})});
    antigo.callback({docs:[{id:'d',data:()=>({titulo:'Atrasado'})}]});
    assert.equal(a.run('dbData.demandas.length'),0);assert.equal(a.run('modulosDoUsuario().length'),0);
});

test('filtro de tipo distingue legado sem usar tags como classificação', () => {
    const a=app();a.run("dbData.usuarios=[{nome:'Interno',tipoUsuario:'interno'},{nome:'Legado',tags:['Internos ATI']},{nome:'Externo',tipoUsuario:'externo'}]");
    a.listeners.get('filtro-tipo-usuario:change')({target:{value:'interno'}});
    assert.equal(a.element('count-usuarios').textContent,1);assert.ok(!a.element('tabela-usuarios').innerHTML.includes('Legado'));
    a.listeners.get('filtro-tipo-usuario:change')({target:{value:'legado'}});
    assert.equal(a.element('count-usuarios').textContent,1);assert.ok(a.element('tabela-usuarios').innerHTML.includes('A definir'));
});

test('formulário de conta nova não herda permissões de cadastros legados', () => {
    const a=app();const html=a.run('camposUsuario({},true)');
    assert.ok(!/name="usuario-modulo"[^>]*checked/.test(html));
});


function perfilAberto(a) {
    a.run("currentUser={uid:'pessoa',nome:'Original',email:'pessoa@example.invalid',tipoUsuario:'interno',perfil:'comum',ativo:true,modulosPermitidos:['demandas']};dadosPessoaisPerfil={telefone:'111',endereco:'Original'};abrirMeuPerfil()");
}

test('perfil pessoal salva nome e foto sem alterar permissões e separa endereço/telefone', async () => {
    const a=app();perfilAberto(a);a.element('perfil-nome').value='Novo nome';a.element('perfil-telefone').value='(81) 99999-1111';a.element('perfil-endereco').value='Rua de teste';
    await a.run('salvarMeuPerfil({preventDefault(){}})');
    assert.equal(a.writes.length,3);
    const root=a.writes.find(w=>w.path==='usuarios/pessoa');const privado=a.writes.find(w=>w.path==='usuarios/pessoa/privado/perfil');const identidade=a.writes.find(w=>w.collection==='identidadesUsuarios');
    assert.equal(root.data.nome,'Novo nome');assert.equal(root.data.perfil,undefined);assert.equal(root.data.modulosPermitidos,undefined);assert.equal(root.data.telefone,undefined);
    assert.equal(privado.data.telefone,'(81) 99999-1111');assert.equal(privado.data.endereco,'Rua de teste');
    assert.deepEqual(Object.keys(identidade.data).sort(),['ativo','fotoPerfil','nome','tipoUsuario','uid']);
    assert.equal(a.run('currentUser.perfil'),'comum');assert.equal(a.run('currentUser.nome'),'Novo nome');
});
test('dados privados ainda não carregados e foto sendo processada impedem salvar', async () => {
    const a=app();a.run("currentUser={uid:'u',nome:'Pessoa'};abrirMeuPerfil()");
    await a.run('salvarMeuPerfil({preventDefault(){}})');assert.equal(a.writes.length,0);
    perfilAberto(a);a.run('perfilEmEdicao.carregandoFoto=true');await a.run('salvarMeuPerfil({preventDefault(){}})');assert.equal(a.writes.length,0);
});
test('falha ao salvar perfil não troca foto/nome no cache local', async () => {
    const a=app();perfilAberto(a);a.context.setDoc=async()=>{throw new Error('permission-denied');};a.element('perfil-nome').value='Não confirmado';
    await a.run('salvarMeuPerfil({preventDefault(){}})');assert.equal(a.run('currentUser.nome'),'Original');assert.ok(a.element('perfil-msg').textContent.includes('Permissão negada'));
});
test('fotos remotas, SVG, HTML e imagens acima do limite não entram no avatar', () => {
    const a=app();for(const foto of ['javascript:alert(1)','https://externo/foto.jpg','data:image/svg+xml;base64,PHN2Zz4=','data:image/jpeg;base64,AA==" onload="x','data:image/jpeg;base64,'+'A'.repeat(45000)])assert.equal(a.run(`fotoPerfilSegura(${JSON.stringify(foto)})`),'');
    const html=a.run("avatarUsuario({nome:'<img src=x>',fotoPerfil:'data:image/svg+xml;base64,PHN2Zz4='})");
    assert.ok(html.includes('&lt;img src=x&gt;'));assert.ok(!html.includes('<img'));
});
test('mesmo nome não associa foto de outra pessoa; UID mantém responsável correto', () => {
    const a=app();a.run("identidadesUsuarios=[{uid:'a',nome:'Ana',fotoPerfil:'data:image/jpeg;base64,QQ=='},{uid:'b',nome:'Ana',fotoPerfil:'data:image/jpeg;base64,Qg=='}]");
    assert.ok(a.run("avatarUsuario({uid:'b',nome:'Ana'})").includes('Qg=='));
    assert.ok(!a.run("avatarUsuario({nome:'Ana'})").includes('<img'));
    assert.ok(a.run("renderizarBadgesResponsaveis(pessoasResponsaveis({responsaveisGrgdIds:['a'],responsaveisGrgdSnapshot:[{uid:'a',nome:'Ana'}]}))").includes('QQ=='));
});
test('avatar é reutilizado na listagem, autoria e histórico com UID', () => {
    const a=app();a.run("dbData.usuarios=[{firestoreId:'a',nome:'Ana',fotoPerfil:'data:image/jpeg;base64,QQ=='}];renderUsuarios()");
    assert.ok(a.element('tabela-usuarios').innerHTML.includes('data-avatar'));
    assert.ok(a.run("renderAuditInfo({editadoPor:'Ana',editadoPorUid:'a'}).autorHtml").includes('QQ=='));
    assert.ok(!a.run("renderAuditInfo({editadoPor:'Ana',criadoPorUid:'a'}).autorHtml").includes('<img'));
    assert.ok(a.run("historicoDemandaHtml({historicoAcoes:[{autor:'Ana',autorUid:'a',texto:'<b>texto</b>'}]})").includes('QQ=='));
    assert.ok(a.run("historicoDemandaHtml({historicoAcoes:[{autor:'Ana',texto:'<b>texto</b>'}]})").includes('&lt;b&gt;texto&lt;/b&gt;'));
});
test('upload rejeita tipo e tamanho inválidos antes de decodificar', async () => {
    const a=app();let decodificou=false;a.context.createImageBitmap=async()=>{decodificou=true;};
    for(const arquivo of [{type:'image/svg+xml',size:10},{type:'image/jpeg',size:9*1024*1024}])await assert.rejects(a.run(`prepararFotoPerfil(${JSON.stringify(arquivo)})`));
    assert.equal(decodificou,false);
});
test('upload recorta e reduz imagem para JPEG pequeno e libera bitmap', async () => {
    const a=app();let fechado=false;const chamadas=[];
    a.context.createImageBitmap=async()=>({width:800,height:400,close(){fechado=true;}});
    a.context.document.createElement=()=>({getContext:()=>({fillRect(){},drawImage(...args){chamadas.push(args.slice(1));}}),toDataURL:()=>'data:image/jpeg;base64,QQ=='});
    const foto=await a.run("prepararFotoPerfil({type:'image/png',size:1000})");
    assert.equal(foto,'data:image/jpeg;base64,QQ==');assert.equal(fechado,true);assert.deepEqual(chamadas[0],[200,0,400,400,0,0,192,192]);
});
test('upload atrasado não altera novo modal nem outra sessão', async () => {
    const a=app();perfilAberto(a);let resolver;a.context.createImageBitmap=()=>new Promise(resolve=>{resolver=resolve;});
    a.context.document.createElement=()=>({getContext:()=>({fillRect(){},drawImage(){}}),toDataURL:()=>'data:image/jpeg;base64,QQ=='});
    a.context.fileEvent={target:{files:[{type:'image/png',size:100}],value:'foto'}};
    const pendente=a.run('selecionarFotoPerfil(fileEvent)');a.run("fecharModal('modal-perfil');abrirMeuPerfil()");
    resolver({width:10,height:10,close(){}});await pendente;
    assert.equal(a.run('perfilEmEdicao.foto'),'');assert.equal(a.writes.length,0);
});
test('remover foto exige salvar para persistir e volta às iniciais', async () => {
    const a=app();perfilAberto(a);a.run("perfilEmEdicao.foto='data:image/jpeg;base64,QQ==';removerFotoPerfil()");
    assert.equal(a.writes.length,0);assert.equal(a.run('perfilEmEdicao.foto'),'');
    await a.run('salvarMeuPerfil({preventDefault(){}})');assert.equal(a.writes[0].data.fotoPerfil,'');
});
test('troca de senha reautentica a própria conta, usa Auth e limpa campos secretos', async () => {
    const a=app();perfilAberto(a);a.run("auth.currentUser={uid:'pessoa',email:'pessoa@example.invalid',getIdToken:async()=>''}");
    a.element('perfil-senha-atual').value='senha-atual';a.element('perfil-senha-nova').value='senha-nova';a.element('perfil-senha-confirmar').value='senha-nova';
    const chamadas=[];a.context.reauthenticateWithCredential=async(u,c)=>chamadas.push(['confirmar',u.uid,c.password]);a.context.updatePassword=async(u,p)=>chamadas.push(['trocar',u.uid,p]);
    await a.run('alterarMinhaSenha({preventDefault(){}})');
    assert.deepEqual(chamadas,[['confirmar','pessoa','senha-atual'],['trocar','pessoa','senha-nova']]);assert.equal(a.writes.length,0);assert.equal(a.element('perfil-senha-atual').value,'');assert.equal(a.element('perfil-senha-nova').value,'');
    assert.equal(a.audits.length,1);assert.equal(a.audits[0].acao,'alterar_senha');assert.equal(a.audits[0].autorUid,'pessoa');
    assert.deepEqual(Array.from(a.audits[0].campos),['senha']);assert.ok(!JSON.stringify(a.audits).includes('senha-atual'));assert.ok(!JSON.stringify(a.audits).includes('senha-nova'));
});
test('falha no histórico após trocar senha informa que a nova senha já está em vigor', async () => {
    const a=app();perfilAberto(a);a.run("auth.currentUser={uid:'pessoa',email:'pessoa@example.invalid',getIdToken:async()=>''}");
    a.element('perfil-senha-atual').value='senha-atual';a.element('perfil-senha-nova').value='senha-nova';a.element('perfil-senha-confirmar').value='senha-nova';
    let alterou=false;a.context.updatePassword=async()=>{alterou=true;};a.context.runTransaction=async()=>{throw new Error('permission-denied');};
    await a.run('alterarMinhaSenha({preventDefault(){}})');
    assert.equal(alterou,true);assert.match(a.element('perfil-senha-msg').textContent,/Senha alterada.*histórico.*nova senha/);
    assert.equal(a.element('perfil-senha-atual').value,'');assert.equal(a.element('perfil-senha-nova').value,'');assert.equal(a.audits.length,0);
});
test('senha atual incorreta e confirmação divergente não alteram a senha', async () => {
    const a=app();perfilAberto(a);a.run("auth.currentUser={uid:'pessoa',email:'pessoa@example.invalid',getIdToken:async()=>''}");let alterou=false;
    a.context.updatePassword=async()=>{alterou=true;};a.context.reauthenticateWithCredential=async()=>{throw {code:'auth/wrong-password'};};
    for(const [atual,nova,confirmar] of [['atual','nova-senha','diferente'],['atual','nova-senha','nova-senha']]){
        a.element('perfil-senha-atual').value=atual;a.element('perfil-senha-nova').value=nova;a.element('perfil-senha-confirmar').value=confirmar;await a.run('alterarMinhaSenha({preventDefault(){}})');
    }
    assert.equal(alterou,false);assert.ok(a.element('perfil-senha-msg').textContent.includes('incorreta'));assert.equal(a.element('perfil-senha-atual').value,'');
});
test('troca de conta durante confirmação não altera senha nem campos da nova sessão', async () => {
    const a=app();perfilAberto(a);a.run("auth.currentUser={uid:'pessoa',email:'pessoa@example.invalid',getIdToken:async()=>''}");
    a.element('perfil-senha-atual').value='atual';a.element('perfil-senha-nova').value='nova-senha';a.element('perfil-senha-confirmar').value='nova-senha';
    let resolver,alterou=false;a.context.reauthenticateWithCredential=()=>new Promise(resolve=>{resolver=resolve;});a.context.updatePassword=async()=>{alterou=true;};
    const pendente=a.run('alterarMinhaSenha({preventDefault(){}})');
    a.run("++versaoSessao;currentUser={uid:'outra'};auth.currentUser={uid:'outra'}");a.element('perfil-senha-atual').value='outra sessão';resolver();await pendente;
    assert.equal(alterou,false);assert.equal(a.element('perfil-senha-atual').value,'outra sessão');
});
test('logout limpa foto em edição, dados pessoais e senhas', async () => {
    const a=app();perfilAberto(a);a.element('perfil-senha-atual').value='secreta';a.run("perfilEmEdicao.foto='data:image/jpeg;base64,QQ=='");
    await a.context.authCallback(null);
    assert.equal(a.run('dadosPessoaisPerfil'),null);assert.equal(a.run('perfilEmEdicao'),null);assert.equal(a.element('perfil-telefone').value,'');assert.equal(a.element('perfil-senha-atual').value,'');assert.equal(a.element('user-avatar').innerHTML,'');
});

test('locais e fornecedores mostram autoria com foto nas colunas existentes', () => {
    const a=app();a.run("identidadesUsuarios=[{uid:'u',nome:'Usuário',fotoPerfil:'data:image/jpeg;base64,QQ=='}];dbData.locais=[{nome:'Local',editadoPor:'Usuário',editadoPorUid:'u'}];dbData.fornecedores=[{nome:'Fornecedor',editadoPor:'Usuário',editadoPorUid:'u'}];renderLocais();renderFornecedores()");
    for(const id of ['tabela-locais','tabela-fornecedores'])assert.ok(a.element(id).innerHTML.includes('data-avatar'));
});

test('sessão principal persiste e cadastro auxiliar continua em memória', () => {
    const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
    assert.ok(html.includes('setPersistence(auth, browserLocalPersistence)'));
    assert.ok(html.includes('setPersistence(authCadastro, inMemoryPersistence)'));
});
test('usuário excluído sai da lista e do contador, preservando os dados carregados', () => {
    const a=app();
    a.run("currentUser={uid:'admin',perfil:'admin',tipoUsuario:'interno'};dbData.usuarios=[{firestoreId:'a',nome:'Ana'},{firestoreId:'b',nome:'Bruno',ativo:false,excluido:true}];renderizarTudo()");
    assert.equal(a.element('count-usuarios').textContent,1);
    assert.equal(a.element('cnt-tab-usuarios').textContent,1);
    assert.doesNotMatch(a.element('tabela-usuarios').innerHTML,/Bruno/);
    assert.equal(a.run('dbData.usuarios.length'),2);
});
test('exclusão lógica bloqueia acesso e mantém identidade e histórico', async () => {
    const a=app();a.element('edit-colecao').value='usuarios';a.element('edit-doc-id').value='outro';
    a.run("currentUser={uid:'admin',perfil:'admin',tipoUsuario:'interno',nome:'Admin'};dbData.usuarios=[{uid:'outro',nome:'Outro',tipoUsuario:'interno'}]");
    await confirmarExclusaoTeste(a);
    assert.equal(a.writes[0].data.ativo,false);assert.equal(a.writes[0].data.excluido,true);
    assert.equal(a.writes[1].data.ativo,false);assert.equal(a.writes[1].data.nome,'Outro');
});
test('administrador não exclui a própria conta', async () => {
    const a=app();a.element('edit-colecao').value='usuarios';a.element('edit-doc-id').value='admin';
    a.run("currentUser={uid:'admin',perfil:'admin',tipoUsuario:'interno'}");
    await a.run('excluirRegistroUniversal()');assert.equal(a.writes.length,0);
});
test('consulta não exclui usuários', async () => {
    const a=app();a.element('edit-colecao').value='usuarios';a.element('edit-doc-id').value='outro';
    a.run("currentUser={uid:'comum',perfil:'comum',tipoUsuario:'interno'}");
    await a.run('excluirRegistroUniversal()');assert.equal(a.writes.length,0);
});

function agendaLocalTeste(a) {
    a.run("currentUser={uid:'admin',perfil:'admin',tipoUsuario:'interno'};agendaLocaisEstado='completa';dbData.locais=[{firestoreId:'l1',nome:'Auditório Azul',capacidade:100,valorAluguel:0,recursos:['Projetor','Wi-Fi']},{firestoreId:'l2',nome:'Sala Verde',capacidade:null,valorAluguel:'1.200,00',endereco:'Recife',contato:'Ana'}];");
}
test('locais diferenciam valor zero, falta de valor e moeda brasileira sem extrair números de textos',()=>{
    const a=app();for(const [v,n] of [[null,null],['',null],[0,0],['R$ 1.234,50',1234.5],['50.25',50.25],['a combinar',null],['100 por dia',null],[-1,null],['12,345',null]])assert.equal(a.run('numeroLocal('+JSON.stringify(v)+')'),n);
    assert.equal(a.run("tipoLocacaoLocal({valorAluguel:0})"),'gratuito');
    assert.equal(a.run("tipoLocacaoLocal({})"),'nao-informado');
});
test('indicadores usam custos explícitos por evento, não multiplicam tarifa e expõem lacunas',()=>{
    const a=app();agendaLocalTeste(a);
    a.run("dbData.eventos=[{localId:'l1',dataInicio:'2030-01-01',custoLocacaoPrevisto:0},{localId:'l2',dataInicio:'2030-01-01',custoLocacaoPrevisto:'1.500,00'},{localId:'l2',dataInicio:'2030-01-02'},{localId:'l2',dataInicio:'2030-01-02',status:'Cancelado',custoLocacaoPrevisto:900},{localId:'l1',dataInicio:'2020-01-01',custoLocacaoPrevisto:500},{localId:'l1',custoLocacaoPrevisto:200},{titulo:'Sem local',dataInicio:'2030-01-01'}]");
    const k=a.run("indicadoresLocais(dbData.locais,dbData.eventos,'2026-10-20')");
    assert.equal(k.total,2);assert.equal(k.capacidade,100);assert.equal(k.semCapacidade,1);assert.equal(k.gratuitos,1);assert.equal(k.pagos,1);assert.equal(k.vinculados,6);assert.equal(k.custo,1500);assert.equal(k.semCusto,1);assert.equal(k.semVinculo,1);assert.equal(k.semData,1);
});
test('vínculo por ID sobrevive a renomeação; nomes duplicados e IDs órfãos não são associados',()=>{
    const a=app();agendaLocalTeste(a);
    assert.equal(a.run("vinculoEventoLocal({localId:'l1',localEvento:'Nome antigo'}).id"),'l1');
    assert.equal(a.run("vinculoEventoLocal({localEvento:'AUDITORIO AZUL'}).id"),'l1');
    a.run("dbData.locais.push({firestoreId:'l3',nome:'Auditório Azul'})");
    assert.equal(a.run("vinculoEventoLocal({localEvento:'Auditório Azul'}).origem"),'ambiguo');
    assert.equal(a.run("vinculoEventoLocal({localId:'removido',localEvento:'Sala Verde'}).id"),'');
});
test('conflitos consideram sobreposição, limites adjacentes, dia inteiro e cancelamentos',()=>{
    const a=app();agendaLocalTeste(a);
    a.run("dbData.eventos=[{localId:'l1',dataInicio:'2030-01-01',horaInicio:'09:00',horaFim:'11:00'},{localId:'l1',dataInicio:'2030-01-01',status:'Cancelado'},{localId:'l2',dataInicio:'2030-01-01'}]");
    assert.equal(a.run("consultarConflitosLocal('l1','2030-01-01','10:00','12:00').conflitos.length"),1);
    assert.equal(a.run("consultarConflitosLocal('l1','2030-01-01','11:00','12:00').conflitos.length"),0);
    assert.equal(a.run("consultarConflitosLocal('l1','2030-01-01').conflitos.length"),1);
    a.run("dbData.eventos.push({localId:'l1',dataInicio:'2030-01-01'})");
    assert.equal(a.run("consultarConflitosLocal('l1','2030-01-01','15:00','16:00').conflitos.length"),1);
});
test('eventos de vários dias e dados incompletos não produzem disponibilidade falsa',()=>{
    const a=app();agendaLocalTeste(a);
    a.run("dbData.eventos=[{localId:'l1',dataInicio:'2030-01-01',dataFim:'2030-01-03'},{localId:'l1'},{localEvento:'Desconhecido',dataInicio:'2030-01-02'}]");
    const r=a.run("consultarConflitosLocal('l1','2030-01-02')");
    assert.equal(r.conflitos.length,1);assert.equal(r.pendencias.length,2);
    a.run("agendaLocaisEstado='parcial'");
    assert.equal(a.run("consultarConflitosLocal('l1','2030-01-02').completa"),false);
    a.run("agendaLocaisEstado='erro'");
    assert.equal(a.run("consultarConflitosLocal('l1','2030-01-02').completa"),false);
});
test('consulta valida data real, existência do local e par de horários',()=>{
    const a=app();agendaLocalTeste(a);
    for(const code of ["consultarConflitosLocal('l1','2030-02-30')","consultarConflitosLocal('naoexiste','2030-01-01')","consultarConflitosLocal('l1','2030-01-01','10:00','')","consultarConflitosLocal('l1','2030-01-01','10:00','09:00')","consultarConflitosLocal('l1','2030-01-01','29:00','30:00')"])assert.throws(()=>a.run(code));
});
test('consulta sem módulo Eventos nunca declara agenda completa',()=>{
    const a=app();agendaLocalTeste(a);a.run("currentUser={uid:'u',perfil:'comum',tipoUsuario:'interno',modulosPermitidos:['locais']}");
    assert.equal(a.run("consultarConflitosLocal('l1','2030-01-01').completa"),false);
    assert.ok(a.run('textoAgendaLocais()').includes('Sem acesso'));
});
test('filtros combinam capacidade, recursos, tipo e busca de endereço ou contato sem acento',()=>{
    const a=app();agendaLocalTeste(a);
    a.element('local-filtro-capacidade').value='50';a.element('local-filtro-recurso').value='projetor';a.element('local-filtro-tipo').value='gratuito';a.run('renderLocais()');
    assert.equal(a.element('count-locais').textContent,1);
    a.element('local-filtro-capacidade').value='';a.element('local-filtro-recurso').value='';a.element('local-filtro-tipo').value='';
    a.run("buscaLocaisVal='recife';renderLocais()");assert.equal(a.element('count-locais').textContent,1);
    a.run("buscaLocaisVal='ana';renderLocais()");assert.ok(a.element('tabela-locais').innerHTML.includes('Sala Verde'));
});
test('painel preserva dados legados e não chama data passada de realização confirmada',()=>{
    const a=app();agendaLocalTeste(a);a.run("dbData.locais[0].campoAntigo='Preservado';dbData.eventos=[{localId:'l1',titulo:'Evento <antigo>',dataInicio:'2020-01-01'}];localSelecionadoId='l1';renderPainelLocal()");
    const html=a.element('local-painel').innerHTML;
    assert.ok(html.includes('Preservado'));assert.ok(html.includes('realização a confirmar'));assert.ok(html.includes('&lt;antigo&gt;'));
});
test('renderização de local escapa nomes, contatos e recursos',()=>{
    const a=app();agendaLocalTeste(a);a.run("dbData.locais=[{firestoreId:'l1',nome:'<img onerror=1>',recursos:['<script>ruim</script>']}];renderLocais()");
    const html=a.element('tabela-locais').innerHTML;assert.ok(html.includes('&lt;img'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>ruim'));
});
test('edição estruturada disponibiliza campos opcionais sem substituir o cadastro inteiro',()=>{
    const a=app();a.run("montarEdicaoEstruturada('locais',{nome:'Local',capacidade:0,valorAluguel:0})");
    const html=a.element('edit-campos-dinamicos').innerHTML;assert.ok(html.includes('editar-local-recursos'));assert.ok(html.includes('editar-local-endereco'));assert.ok(html.includes('value="0"'));
});
test('novo local grava capacidade e recursos tipados e não inventa valor desconhecido',async()=>{
    const a=app();agendaLocalTeste(a);a.element('form-univ-tipo').value='local';a.element('uc-1').value='Novo';a.element('novo-local-capacidade').value='60';a.element('novo-local-recursos').value='Projetor, Wi-Fi\nProjetor';
    await a.run('salvarCadastroUniversal({preventDefault(){}})');
    assert.equal(a.writes[0].collection,'locais');assert.equal(a.writes[0].data.capacidade,60);assert.equal(a.writes[0].data.valorAluguel,null);assert.deepEqual(Array.from(a.writes[0].data.recursos),['Projetor','Wi-Fi']);
});
test('formulário de local recusa capacidade fracionária e gratuidade com tarifa positiva',()=>{
    const a=app();a.element('uc-1').value='Local';a.element('novo-local-capacidade').value='1.5';assert.throws(()=>a.run('lerCadastroLocal(true)'));
    a.element('novo-local-capacidade').value='100';a.element('novo-local-tipoLocacao').value='gratuito';a.element('novo-local-valorAluguel').value='100';assert.throws(()=>a.run('lerCadastroLocal(true)'));
});
test('evento cadastrado vincula local por ID e registra custo total sem tarifa implícita',async()=>{
    const a=app();agendaLocalTeste(a);a.element('form-univ-tipo').value='evento';a.element('uc-1').value='Novo evento';a.element('evt-local-id').value='l2';a.element('evt-data-inicio').value='2030-01-01';a.element('evt-custo').value='900,50';
    await a.run('salvarCadastroUniversal({preventDefault(){}})');
    assert.equal(a.writes[0].collection,'eventos');assert.equal(a.writes[0].data.localId,'l2');assert.equal(a.writes[0].data.localEvento,'Sala Verde');assert.equal(a.writes[0].data.custoLocacaoPrevisto,900.5);
});
test('datas UTC são consultadas no fuso de Pernambuco',()=>{
    const a=app();
    assert.equal(a.run("diaEventoLocal('2030-01-02T01:00:00Z')"),'2030-01-01');
    assert.equal(a.run("horarioEventoLocal({dataInicio:'2030-01-02T01:00:00Z'},'dataInicio')"),'22:00');
});
test('logout limpa painel, filtros e consulta de locais',async()=>{
    const a=app();agendaLocalTeste(a);a.run("localSelecionadoId='l1';consultaLocalAtiva=true");a.element('disponibilidade-data').value='2030-01-01';a.element('local-filtro-tipo').value='pago';
    await a.context.authCallback(null);
    assert.equal(a.run('localSelecionadoId'),'');assert.equal(a.run('consultaLocalAtiva'),false);assert.equal(a.element('disponibilidade-data').value,'');assert.equal(a.element('local-filtro-tipo').value,'');
});

test('clicar em excluir apenas abre confirmação e nunca grava de imediato',async()=>{
    const a=app();a.run("currentUser={uid:'admin',perfil:'admin'};dbData.usuarios=[{firestoreId:'outro',nome:'Outro'}]");
    a.element('edit-colecao').value='usuarios';a.element('edit-doc-id').value='outro';
    a.run('excluirRegistroUniversal()');assert.equal(a.writes.length,0);assert.equal(a.audits.length,0);
    assert.equal(a.run('exclusaoPendente.id'),'outro');assert.equal(a.element('exclusao-senha').value,'');
    a.element('exclusao-senha').value='segredo';a.run('cancelarExclusao()');
    assert.equal(a.run('exclusaoPendente'),null);assert.equal(a.element('exclusao-senha').value,'');
});
test('senha incorreta impede exclusão e é removida do campo',async()=>{
    const a=app();a.run("currentUser={uid:'admin',perfil:'admin'};dbData.usuarios=[{firestoreId:'outro',nome:'Outro'}]");
    a.element('edit-colecao').value='usuarios';a.element('edit-doc-id').value='outro';
    a.context.reauthenticateWithCredential=async()=>{throw {code:'auth/wrong-password'};};
    await confirmarExclusaoTeste(a);assert.equal(a.writes.length,0);assert.equal(a.audits.length,0);
    assert.ok(a.element('exclusao-erro').textContent);assert.equal(a.element('exclusao-senha').value,'');
});
test('confirmação usa a conta do autor e o alvo capturado; duplo envio não duplica',async()=>{
    const a=app(),chamadas=[];let resolver;
    a.run("currentUser={uid:'admin',perfil:'admin',nome:'Admin'};auth.currentUser={uid:'admin',email:'admin@example.invalid',getIdToken:async()=>{}};dbData.usuarios=[{firestoreId:'outro',nome:'Outro'}]");
    a.element('edit-colecao').value='usuarios';a.element('edit-doc-id').value='outro';a.run('excluirRegistroUniversal()');
    a.element('edit-doc-id').value='alvo-forjado';a.element('exclusao-senha').value='senha-do-admin';
    a.context.reauthenticateWithCredential=(user,cred)=>{chamadas.push([user.uid,cred.email,cred.password]);return new Promise(r=>resolver=r);};
    const primeiro=a.run('confirmarExclusao({preventDefault(){}})');await a.run('confirmarExclusao({preventDefault(){}})');resolver();await primeiro;
    assert.deepEqual(chamadas,[['admin','admin@example.invalid','senha-do-admin']]);
    assert.equal(a.writes[0].id,'outro');assert.equal(a.audits.length,1);assert.equal(a.audits[0].acao,'excluir_usuario');
    assert.ok(!JSON.stringify(a.audits).includes('senha-do-admin'));
});
test('troca de sessão durante reautenticação cancela a exclusão',async()=>{
    const a=app();let resolver;
    a.run("currentUser={uid:'admin',perfil:'admin'};auth.currentUser={uid:'admin',email:'a@example.invalid',getIdToken:async()=>{}};dbData.usuarios=[{firestoreId:'outro'}]");
    a.element('edit-colecao').value='usuarios';a.element('edit-doc-id').value='outro';a.run('excluirRegistroUniversal()');a.element('exclusao-senha').value='segredo';
    a.context.reauthenticateWithCredential=()=>new Promise(r=>resolver=r);
    const pendente=a.run('confirmarExclusao({preventDefault(){}})');a.run("++versaoSessao;currentUser={uid:'nova',perfil:'admin'};auth.currentUser={uid:'nova'}");resolver();await pendente;
    assert.equal(a.writes.length,0);assert.equal(a.audits.length,0);
});
test('revogar administração fecha confirmação e histórico já abertos',()=>{
    const a=app();a.run("currentUser={uid:'a',perfil:'admin'};exclusaoPendente={id:'outro'};historicoRegistros=[{autorNome:'Restrito'}]");
    a.element('historico-registros').innerHTML='Restrito';a.run("currentUser={uid:'a',perfil:'comum'};atualizarVisibilidadeAbas()");
    assert.equal(a.run('exclusaoPendente'),null);assert.equal(a.element('historico-registros').innerHTML,'');
    assert.ok(a.element('modal-historico-alteracoes').classList.contains('hidden'));assert.equal(a.element('btn-excluir-registro').disabled,true);
});
test('auditoria identifica campos alterados sem copiar valores pessoais',async()=>{
    const a=app();a.run("currentUser={uid:'a',nome:'Autor',perfil:'admin'}");
    a.context.getDoc=async()=>({exists:()=>true,data:()=>({telefone:'8199999',endereco:'Endereço confidencial',nome:'Antigo',criadoEm:'original'})});
    await a.run("salvarComHistorico(doc(db,'orgaos','o'),{nome:'Novo',atualizadoEm:'agora'},{merge:true})");
    assert.equal(a.writes[0].data.nome,'Novo');assert.equal(a.audits[0].autorUid,'a');assert.equal(a.audits[0].acao,'editar');
    assert.deepEqual(Array.from(a.audits[0].campos),['nome']);
    assert.ok(!JSON.stringify(a.audits).includes('8199999'));assert.ok(!JSON.stringify(a.audits).includes('confidencial'));
});
test('histórico de perfil privado identifica campos sem guardar telefone ou endereço',async()=>{
    const a=app();a.run("currentUser={uid:'pessoa',nome:'Pessoa',perfil:'comum'}");
    await a.run("salvarComHistorico(doc(db,'usuarios','pessoa','privado','perfil'),{telefone:'819999999',endereco:'Rua privada',atualizadoEm:'agora'})");
    assert.equal(a.audits[0].colecao,'perfilPrivado');assert.equal(a.audits[0].registroId,'pessoa');
    assert.ok(!JSON.stringify(a.audits).includes('819999999'));assert.ok(!JSON.stringify(a.audits).includes('Rua privada'));
});
test('restauração mantém aba e visão permitidas por usuário',async()=>{
    const a=app();a.storage.set('prgd:navegacao:u',JSON.stringify({aba:'demandas',visao:'calendario'}));
    a.context.getDoc=async()=>({exists:()=>true,data:()=>({nome:'Usuário',perfil:'comum',tipoUsuario:'interno',modulosPermitidos:['demandas','locais']})});
    await a.context.authCallback({uid:'u',email:'u@example.invalid'});
    assert.equal(a.run('abaAtual'),'demandas');assert.equal(a.run('visaoDemandasAtual'),'calendario');
    assert.ok(a.element('modal-login').classList.contains('hidden'));assert.ok(a.element('sessao-carregando').classList.contains('hidden'));
});
test('aba salva proibida é descartada e logout remove navegação da conta',async()=>{
    const a=app();a.storage.set('prgd:navegacao:u',JSON.stringify({aba:'usuarios'}));
    a.context.getDoc=async()=>({exists:()=>true,data:()=>({nome:'Consulta',perfil:'comum',modulosPermitidos:['eventos'],tipoUsuario:'externo'})});
    await a.context.authCallback({uid:'u',email:'u@example.invalid'});assert.equal(a.run('abaAtual'),'eventos');
    await a.context.authCallback(null);assert.equal(a.storage.has('prgd:navegacao:u'),false);assert.equal(a.run('currentUser'),null);
});
test('callback da mesma conta não limpa a tela nem a confirmação atual',async()=>{
    const a=app();a.run("currentUser={uid:'a',ativo:true};exclusaoPendente={id:'outro'};abaAtual='locais'");
    await a.context.authCallback({uid:'a'});assert.equal(a.run('abaAtual'),'locais');assert.equal(a.run('exclusaoPendente.id'),'outro');
});
test('retorno atrasado do histórico após logout não expõe dados',async()=>{
    const a=app();let resolver;a.run("currentUser={uid:'a',perfil:'admin'}");
    a.context.getDocs=()=>new Promise(r=>resolver=r);
    const pendente=a.run('carregarHistoricoAlteracoes(true)');await a.context.authCallback(null);
    resolver({docs:[{id:'h',data:()=>({autorNome:'Restrito'})}]});await pendente;
    assert.equal(a.run('historicoRegistros.length'),0);assert.equal(a.element('historico-registros').innerHTML,'');
});

test('vínculo pendente, vencido ou com revisão vencida não herda módulos antigos',()=>{
    const a=app();a.context.vinculo=vinculoTeste();
    a.run("currentUser={uid:'nsi',ativo:true,tipoUsuario:'externo',perfil:'comum',modulosPermitidos:['eventos'],acessoInstitucional:vinculo}");
    assert.deepEqual(Array.from(a.run('modulosDoUsuario()')),['meu_orgao','colaboradores','eventos','inscricoes_orgao']);
    for(const code of ["currentUser.acessoInstitucional.situacao='pendente'","currentUser.acessoInstitucional.fim=Date.now()-1","currentUser.acessoInstitucional.revisao=Date.now()-1"]){
        a.context.vinculo=vinculoTeste();a.run('currentUser.acessoInstitucional=vinculo');a.run(code);
        assert.equal(a.run('modulosDoUsuario().length'),0);
    }
});
test('papel NSI não concede administração, edição institucional nem inscrição da própria conta',()=>{
    const a=app();a.context.vinculo=vinculoTeste();a.run("currentUser={uid:'nsi',ativo:true,tipoUsuario:'externo',perfil:'comum',acessoInstitucional:vinculo}");
    assert.equal(a.run('ehAdministrador()'),false);
    assert.equal(a.run("podeAlterarColecao('usuarios')"),false);
    assert.equal(a.run("podeAlterarColecao('eventos')"),false);
    assert.equal(a.run("podeAcao('inscricoes','propria')"),false);
});
test('GRGD edita apenas módulos com consulta e edição delegadas, sem excluir ou administrar usuários',()=>{
    const a=app();a.context.vinculo=vinculoTeste({papel:'grgd',orgaoId:'',setoresIds:[],acoes:['eventos.consultar','eventos.editar']});
    a.run("currentUser={uid:'grgd',ativo:true,tipoUsuario:'interno',perfil:'comum',acessoInstitucional:vinculo}");
    assert.equal(a.run("podeAlterarColecao('eventos')"),true);
    for(const code of ["podeAlterarColecao('eventos','criar')","podeAlterarColecao('eventos','excluir')","podeAlterarColecao('usuarios')","podeAlterarColecao('demandas')"])assert.equal(a.run(code),false);
});
test('auditoria só recebe consultas do escopo e não acessa participantes, usuários nem edição',()=>{
    const a=app();a.context.vinculo=vinculoTeste({papel:'auditoria',acoes:['auditoria.consultar','relatorios.consultar']});
    a.run("currentUser={uid:'auditor',ativo:true,tipoUsuario:'interno',perfil:'comum',acessoInstitucional:vinculo}");
    assert.deepEqual(Array.from(a.run('modulosDoUsuario()')),['inscricoes_orgao','auditoria_orgao']);
    assert.equal(a.run("podeAcao('participantes')"),false);
    assert.equal(a.run("podeAlterarColecao('usuarios')"),false);
});
test('consultas do portal são filtradas por órgão e setores e não assinam coleções internas',()=>{
    const a=app();a.context.vinculo=vinculoTeste();a.context.setTimeout=()=>1;
    a.run("currentUser={uid:'nsi',ativo:true,tipoUsuario:'externo',perfil:'comum',acessoInstitucional:vinculo};iniciarSnapshotFirestore()");
    const cols=a.snapshots.map(s=>s.ref);
    assert.ok(cols.some(r=>JSON.stringify(r).includes('["orgaoId","==","orgao-a"]')&&JSON.stringify(r).includes('["setorId","in",["a1"]]')));
    assert.ok(!cols.some(r=>r==='usuarios'||r==='demandas'||r==='fornecedores'));
    assert.equal(a.run("registroNoEscopo({orgaoId:'orgao-b',setorId:'a1'})"),false);
    assert.equal(a.run("registroNoEscopo({orgaoId:'orgao-a',setorId:'a2'})"),false);
    assert.equal(a.run("registroNoEscopo({orgaoId:'orgao-a',setorId:'a1'})"),true);
});
test('aprovação não pode ser apagada pelo formulário para reativar acesso legado',()=>{
    const a=app();a.element('vinculo-papel').value='';a.context.anterior={acessoInstitucional:vinculoTeste()};
    assert.throws(()=>a.run('lerVinculoInstitucional(anterior)'),/suspenda/);
});

test('filtro administrativo usa órgão por ID e setor delegado, sem deduzir vínculo pelo texto antigo',()=>{
    const a=app();a.context.vinculo=vinculoTeste();a.run("dbData.setores=[{id:'a1',orgaoId:'orgao-a',nome:'NSI A'}];dbData.usuarios=[{uid:'nsi',tipoUsuario:'externo',perfil:'comum',nome:'NSI',acessoInstitucional:vinculo},{uid:'legado',nome:'Legado',orgao:'orgao-a'}];filtroOrgaoUsuarioAtual='orgao-a';filtroSetorUsuarioAtual='a1';renderUsuarios()");
    assert.equal(a.element('count-usuarios').textContent,1);
    assert.match(a.element('tabela-usuarios').innerHTML,/Gestor de NSI/);
    assert.ok(!a.element('tabela-usuarios').innerHTML.includes('Legado'));
});
test('prazo do vínculo remove os dados e a navegação mesmo sem recarregar a página',()=>{
    const a=app();let deadline;a.context.setTimeout=fn=>{deadline=fn;return 1;};a.context.vinculo=vinculoTeste();
    a.run("currentUser={uid:'nsi',ativo:true,tipoUsuario:'externo',perfil:'comum',acessoInstitucional:vinculo};programarRevisaoAcesso();dbData.colaboradores=[{nome:'Registro privado'}]");
    a.element('portal-colaboradores').innerHTML='Registro privado';a.run('currentUser.acessoInstitucional.fim=Date.now()-1');deadline();
    assert.equal(a.run('modulosDoUsuario().length'),0);assert.equal(a.run('dbData.colaboradores.length'),0);assert.equal(a.element('portal-colaboradores').innerHTML,'');
});

function usuarioGestorLote2(a,extra={}) {
    a.run(`currentUser={uid:'gestor',nome:'Gestor de teste',email:'gestor@example.invalid',ativo:true,tipoUsuario:'externo',perfil:'comum',acessoInstitucional:${JSON.stringify(vinculoTeste({operacoesVersao:'v1',acoes:['orgao.consultar','participantes.consultar','participantes.cadastrar','participantes.editar','eventos.consultar','inscricoes.consultar','inscricoes.criar','inscricoes.cancelar','comprovantes.consultar'],...extra}))}};dbData.setores=[{id:'a1',nome:'NSI A',orgaoId:'orgao-a',ativo:true}];`);
}
test('chaves institucionais normalizam e-mail sem criar conta e preservam unicidade por evento',async()=>{
    const a=app();const x=await a.run("chaveColaborador('orgao-a',' PESSOA@EXAMPLE.INVALID ')");const y=await a.run("chaveColaborador('orgao-a','pessoa@example.invalid')");
    assert.equal(x,y);assert.match(x,/^[a-f0-9]{64}$/);assert.notEqual(x,await a.run("chaveColaborador('orgao-b','pessoa@example.invalid')"));
    assert.equal(await a.run("chaveInscricao('evento',' PESSOA@EXAMPLE.INVALID ')"),await a.run("chaveInscricao('evento','pessoa@example.invalid')"));
});
test('elegibilidade institucional exige órgão aprovado, período aberto, vagas e evento ativo',()=>{
    const a=app();usuarioGestorLote2(a);const e={modeloInscricao:'institucional-v1',orgaosElegiveis:['orgao-a'],inscricoesAbertas:true,inscricaoInicio:100,inscricaoFim:200,limiteVagas:1,inscritosCount:0};
    assert.equal(a.run(`eventoElegivelInstitucional(${JSON.stringify(e)},150)`),true);
    for(const patch of [{orgaosElegiveis:['orgao-b']},{inscricoesAbertas:false},{inscritosCount:1},{inscritosCount:-1},{status:'Cancelado'},{status:'Realizado'},{modeloInscricao:''}])assert.equal(a.run(`eventoElegivelInstitucional(${JSON.stringify({...e,...patch})},150)`),false);
    assert.equal(a.run(`eventoElegivelInstitucional(${JSON.stringify(e)},200)`),false);
});
test('permissão de escrita isolada não substitui consulta, aprovação ou validade do gestor',()=>{
    const a=app();usuarioGestorLote2(a);assert.equal(a.run("gestorPode('inscricoes.criar')"),true);
    usuarioGestorLote2(a,{acoes:['inscricoes.criar']});assert.equal(a.run("gestorPode('inscricoes.criar')"),false);
    usuarioGestorLote2(a,{situacao:'pendente'});assert.equal(a.run("gestorPode('participantes.cadastrar')"),false);
    usuarioGestorLote2(a,{fim:Date.now()-1});assert.equal(a.run("gestorPode('inscricoes.cancelar')"),false);
    usuarioGestorLote2(a,{operacoesVersao:''});assert.equal(a.run("gestorPode('inscricoes.criar')"),false);
});
test('cadastro pelo formulário grava colaborador, projeção de contato e auditoria sem conta de login',async()=>{
    const a=app();usuarioGestorLote2(a);for(const [k,v] of Object.entries({nome:'Pessoa de teste',emailInstitucional:' PESSOA@EXAMPLE.INVALID ',setorId:'a1',telefone:'81999999999',cargo:'Analista'}))a.element('colab-'+k).value=v;
    a.element('colab-ativo').checked=true;await a.run('salvarColaborador({preventDefault(){}})');
    assert.equal(a.element('colab-erro').textContent,'');assert.equal(a.writes.length,2);const registro=a.writes.find(w=>w.collection==='colaboradores');assert.equal(registro.data.orgaoId,'orgao-a');assert.equal(registro.data.emailInstitucional,'pessoa@example.invalid');assert.ok(a.writes.some(w=>w.collection==='contatosColaboradores'));assert.ok(!a.writes.some(w=>w.collection==='usuarios'));assert.equal(a.audits.length,1);assert.equal(a.audits[0].colecao,'colaboradores');
});
test('setor fora da delegação é recusado antes de gravar colaborador',async()=>{
    const a=app();usuarioGestorLote2(a);a.element('colab-nome').value='Pessoa';a.element('colab-emailInstitucional').value='pessoa@example.invalid';a.element('colab-setorId').value='b1';a.element('colab-ativo').checked=true;
    await a.run('salvarColaborador({preventDefault(){}})');assert.equal(a.writes.length,0);assert.match(a.element('colab-erro').textContent,/setor/i);
});
async function prepararInscricaoLote2(a) {
    usuarioGestorLote2(a);const p={nome:'Pessoa fictícia',emailInstitucional:'pessoa@example.invalid',orgaoId:'orgao-a',setorId:'a1',ativo:true};const id=await a.run(`chaveColaborador('orgao-a','pessoa@example.invalid')`);
    a.run(`dbData.colaboradores=[${JSON.stringify({...p,id})}];`);
    const evento={titulo:'Evento fictício',dataInicio:'2099-01-01',modeloInscricao:'institucional-v1',orgaosElegiveis:['orgao-a'],inscricoesAbertas:true,inscricaoInicio:Date.now()-10000,inscricaoFim:Date.now()+3600000,limiteVagas:1,inscritosCount:0};
    a.context.getDoc=async ref=>({exists:()=>ref.collection!=='inscricoes',data:()=>ref.collection==='eventos'?evento:p});return {id,p,evento};
}
test('cliente confirma inscrição, contador e autoria do operador no mesmo fluxo transacional',async()=>{
    const a=app(),{id}=await prepararInscricaoLote2(a);await a.run(`gravarInscricaoInstitucional('e1','${id}')`);
    assert.equal(a.writes.length,2);const registro=a.writes.find(w=>w.collection==='inscricoes'),evento=a.writes.find(w=>w.collection==='eventos');
    assert.equal(registro.data.participanteNome,'Pessoa fictícia');assert.equal(registro.data.criadoPorUid,'gestor');assert.equal(registro.data.uid,undefined);assert.equal(registro.data.protocolo,registro.id);assert.equal(evento.data.inscritosCount,1);assert.equal(a.audits[0].acao,'inscrever');
});
test('mudança de sessão durante a transação não confirma inscrição nem contador',async()=>{
    const a=app(),{id}=await prepararInscricaoLote2(a),get=a.context.getDoc;a.context.getDoc=async ref=>{a.run('++versaoSessao');return get(ref);};
    await assert.rejects(a.run(`gravarInscricaoInstitucional('e1','${id}')`),/sessão/);assert.equal(a.writes.length,0);assert.equal(a.audits.length,0);
});
test('comprovante recusa registro de outro órgão e limpa conteúdo anterior',async()=>{
    const a=app();usuarioGestorLote2(a);a.element('comprovante-conteudo').innerHTML='conteúdo anterior';a.context.getDoc=async()=>({exists:()=>true,data:()=>({modeloInscricao:'institucional-v1',orgaoId:'orgao-b',setorId:'b1'})});
    await a.run("consultarComprovante('fora')");assert.equal(a.element('comprovante-conteudo').innerHTML,'');assert.match(a.element('portal-operacao-msg').textContent,/escopo/);
});
test('logout apaga formulários, mensagem e comprovante do portal',()=>{
    const a=app();usuarioGestorLote2(a);a.element('colab-nome').value='Pessoa';a.element('comprovante-conteudo').innerHTML='Documento';a.run('limparDadosSessao()');
    assert.equal(a.element('colab-nome').value,'');assert.equal(a.element('comprovante-conteudo').innerHTML,'');assert.equal(a.run('comprovanteAtualId'), '');
});
test('falha de consulta protegida apaga comprovante e opções de participantes do formulário',()=>{
    const a=app();usuarioGestorLote2(a);a.run("observarPortal('inscricoes',collection(db,'inscricoes'))");
    a.element('comprovante-conteudo').innerHTML='Pessoa anterior';a.element('insc-participante').innerHTML='<option>Pessoa anterior</option>';
    a.snapshots.at(-1).error({message:'permission-denied'});
    assert.equal(a.element('comprovante-conteudo').innerHTML,'');assert.equal(a.element('insc-participante').innerHTML,'');
    assert.equal(a.element('modal-comprovante').classList.contains('hidden'),true);
});

test('permissões equivalentes não mudam com ordem dos campos, ações ou metadados de aprovação',()=>{
    const a=app(),v=vinculoTeste();
    a.context.u1={uid:'nsi',ativo:true,tipoUsuario:'externo',perfil:'comum',acessoInstitucional:v};
    a.context.u2={...a.context.u1,acessoInstitucional:{...Object.fromEntries(Object.entries(v).reverse()),acoes:[...v.acoes].reverse(),registradoEm:'atualização documental',aprovacaoGrgd:{responsavel:'Responsável revisado',referencia:'Referência revisada'}}};
    assert.equal(a.run('assinaturaAcesso(u1)'),a.run('assinaturaAcesso(u2)'));
    a.context.u2.acessoInstitucional.orgaoId='orgao-b';assert.notEqual(a.run('assinaturaAcesso(u1)'),a.run('assinaturaAcesso(u2)'));
});
test('evento de hoje permanece futuro até o horário final e respeita situação realizada',()=>{
    const a=app();
    assert.equal(a.run("eventoEncerrado({dataInicio:'2026-10-23'},new Date(2026,9,23,15))"),false);
    assert.equal(a.run("eventoEncerrado({dataInicio:'2026-10-23',horaFim:'16:00'},new Date(2026,9,23,15))"),false);
    assert.equal(a.run("eventoEncerrado({dataInicio:'2026-10-23',horaFim:'14:00'},new Date(2026,9,23,15))"),true);
    assert.equal(a.run("eventoEncerrado({dataInicio:'2026-10-22'},new Date(2026,9,23,15))"),true);
    assert.equal(a.run("eventoEncerrado({dataInicio:'2026-10-23',status:'Realizado'},new Date(2026,9,23,15))"),true);
    assert.equal(a.run("eventoEncerrado({dataInicio:'2020-01-01T15:00:00Z'},new Date('2026-10-23T15:00:00Z'))"),true);
    assert.equal(a.run("eventoEncerrado({dataInicio:'2099-01-01T15:00:00Z'},new Date('2026-10-23T15:00:00Z'))"),false);
});

test('referências e responsáveis opcionais não bloqueiam vínculo aprovado pelo administrador',()=>{
    const a=app();a.context.vinculo=vinculoTeste();delete a.context.vinculo.aprovacaoGrgd;delete a.context.vinculo.aprovacaoAutoridade;
    a.run("currentUser={uid:'nsi',ativo:true,tipoUsuario:'externo',perfil:'comum',acessoInstitucional:vinculo}");
    assert.equal(a.run('acessoInstitucionalAtivo()'),true);assert.ok(a.run('modulosDoUsuario().includes("colaboradores")'));
    a.run("currentUser.acessoInstitucional.situacao='pendente'");assert.equal(a.run('modulosDoUsuario().length'),0);
});

test('lista real de eventos mantém o encontro de hoje em Futuros durante o dia',()=>{
    const a=app();
    a.context.Date=class extends Date {constructor(...args){super(...(args.length?args:[2026,9,23,15,0]));}static now(){return new Date(2026,9,23,15,0).getTime();}};
    a.run("currentUser={uid:'admin',perfil:'admin',ativo:true};dbData.eventos=[{id:'hoje',titulo:'Encontro hoje',dataInicio:'2026-10-23',eventoPublico:true}];filtroEventoAtual='futuros';renderEventos()");
    assert.equal(a.element('count-eventos').textContent,1);assert.match(a.element('grid-eventos').innerHTML,/Encontro hoje/);
});

test('situação de acesso separa cadastro, validade do vínculo, revisão e módulos',()=>{
    const a=app(),base={uid:'u',ativo:true,tipoUsuario:'externo',perfil:'comum',modulosPermitidos:[],acessoInstitucional:vinculoTeste()};
    for(const [patch,estado]of [[{ativo:false},'inativo'],[{acessoInstitucional:{...base.acessoInstitucional,fim:Date.now()-1}},'vencido'],[{acessoInstitucional:{...base.acessoInstitucional,revisao:Date.now()-1}},'revisao'],[{acessoInstitucional:{...base.acessoInstitucional,situacao:'pendente'}},'pendente'],[{acessoInstitucional:{...base.acessoInstitucional,situacao:'suspenso'}},'suspenso']]){
        a.context.usuario={...base,...patch};assert.equal(a.run('estadoAcessoUsuario(usuario).id'),estado);
    }
    a.context.usuario={...base,acessoInstitucional:null};assert.equal(a.run('estadoAcessoUsuario(usuario).id'),'sem_modulos');
});
test('contato do cliente acompanha colaborador por ID e preserva dados manuais sem vínculo',()=>{
    const a=app();a.run("dbData.contatosColaboradores=[{id:'p',orgaoId:'o',nome:'Atual',emailInstitucional:'p@example.invalid',telefone:'81999',cargo:'Analista',funcoesContato:['nsi'],ativo:true}]");
    let o=a.run("orgaoComContatos({id:'o',gestorNsi:'Antigo',gestorSei:'Manual'})");assert.equal(o.gestorNsi,'Atual');assert.equal(o.gestorSei,'Manual');
    a.run("dbData.contatosColaboradores[0].nome='Atualizado'");o=a.run("orgaoComContatos({id:'o',contatosVinculados:{nsi:'p'}})");assert.equal(o.gestorNsi,'Atualizado');
    assert.equal(a.run("orgaoComContatos({id:'outro',contatosVinculados:{nsi:'p'},gestorNsi:'Antigo'}).gestorNsi"),'Contato vinculado indisponível');
    assert.equal(a.run("orgaoComContatos({id:'o',gestorNsi:'Manual',contatosVinculados:{nsi:'manual'}}).gestorNsi"),'Manual');
});
test('contato com revisão vencida é sinalizado e função NSI não cria autorização',()=>{
    const a=app();a.run("dbData.contatosColaboradores=[{id:'p',orgaoId:'o',nome:'Pessoa',funcoesContato:['nsi'],ativo:true,validadeCadastro:1}]");
    assert.match(a.run("orgaoComContatos({id:'o'}).gestorNsi"),/revisão vencida/);
    assert.equal(a.run("situacaoCadastroColaborador({ativo:true}).id"),'sem_prazo');
    assert.equal(a.run("modulosDoUsuario({ativo:true,tipoUsuario:'externo',perfil:'comum',funcoesContato:['nsi'],modulosPermitidos:[]}).length"),0);
});
test('projeção de contato não compartilha UID de login, senha nem perfil',()=>{
    const a=app();const p=a.run("projecaoContato({nome:'Pessoa',orgaoId:'o',setorId:'s',usuarioUid:'login',perfil:'admin',senha:'nunca',emailInstitucional:'p@example.invalid',telefone:'',cargo:'',ativo:true,atualizadoEm:'agora'})");
    assert.equal(p.usuarioUid,undefined);assert.equal(p.perfil,undefined);assert.equal(p.senha,undefined);
});
test('admin vê colaboradores e gestor permanece limitado ao seu escopo',()=>{
    const a=app();a.run("currentUser={uid:'admin',perfil:'admin',tipoUsuario:'interno',ativo:true}");assert.ok(a.run('modulosDoUsuario()').includes('colaboradores'));
    usuarioGestorLote2(a);assert.equal(a.run("registroNoEscopo({orgaoId:'orgao-b',setorId:'b1'})"),false);
});
test('cancelar revisão de usuário não grava cadastro e mudança de sessão invalida confirmação',async()=>{
    const a=app({revisaoAutomatica:false});a.run("currentUser={uid:'admin',perfil:'admin',ativo:true,tipoUsuario:'interno'}");
    const dados="{nome:'Pessoa',email:'p@example.invalid',ativo:true,tipoUsuario:'externo',perfil:'comum',modulosPermitidos:[]}";
    let promessa=a.run('revisarUsuario('+dados+')');assert.equal(a.element('modal-revisar-usuario').classList.contains('hidden'),false);a.run('cancelarRevisaoUsuario()');assert.equal(await promessa,false);assert.equal(a.writes.length,0);
    promessa=a.run('revisarUsuario('+dados+')');a.run('versaoSessao++');a.listeners.get('revisar-usuario-confirmar:click')();assert.equal(await promessa,false);
});
