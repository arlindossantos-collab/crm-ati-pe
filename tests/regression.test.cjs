const { test } = require('node:test');
const assert = require('node:assert/strict');
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
    const source = require('../scripts/lib/source.cjs').readApplicationSource();
    const nodes = new Map(), writes = [], audits = [], charts = [], listeners = new Map(), snapshots = [], storage = new Map(), persistence = [];
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
        browserLocalPersistence: {tipo:'local'}, inMemoryPersistence: {tipo:'memory'}, setPersistence(auth,kind) { persistence.push({auth,kind});return Promise.resolve(); },
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
    return { run: code => vm.runInContext(code, context), element, writes, audits, charts, listeners, snapshots, context,storage,persistence };
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
    assert.ok(markup.includes('value="0"')); assert.ok(markup.includes('data-field-type="reference-list"'));
    assert.ok(markup.includes('value="g1" selected')); assert.ok(markup.includes('value="g2" selected'));
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

test('sessão principal persiste e cadastro auxiliar continua em memória', async () => {
    const a=app();preencherUsuario(a);a.run("currentUser={uid:'admin',perfil:'admin',nome:'Admin'}");
    assert.equal(a.persistence[0].kind.tipo,'local');
    await a.run('criarCadastroUsuario()');
    assert.equal(a.persistence[1].kind.tipo,'memory');
    assert.equal(a.persistence[1].auth.name,'prgd-cadastro');
    assert.equal(a.run('currentUser.uid'),'admin');
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
    assert.equal(a.run("perfilFiltroUsuario({perfil:'admin',tipoUsuario:'interno',ativo:false})"),'admin');
});
test('contato do cliente acompanha colaborador por ID e preserva dados manuais sem vínculo',()=>{
    const a=app();a.run("dbData.contatosColaboradores=[{id:'p',orgaoId:'o',nome:'Atual',emailInstitucional:'p@example.invalid',telefone:'81999',cargo:'Analista',funcoesContato:['nsi'],divulgavel:true,ativo:true}]");
    let o=a.run("orgaoComContatos({id:'o',gestorNsi:'Antigo',gestorSei:'Manual'})");assert.equal(o.gestorNsi,'Atual');assert.equal(o.gestorSei,'Manual');
    a.run("dbData.contatosColaboradores[0].nome='Atualizado'");o=a.run("orgaoComContatos({id:'o',contatosVinculados:{nsi:'p'}})");assert.equal(o.gestorNsi,'Atualizado');
    assert.equal(a.run("orgaoComContatos({id:'outro',contatosVinculados:{nsi:'p'},gestorNsi:'Antigo'}).gestorNsi"),'Contato vinculado indisponível');
    assert.equal(a.run("orgaoComContatos({id:'o',gestorNsi:'Manual',contatosVinculados:{nsi:'manual'}}).gestorNsi"),'Manual');
});
test('contato com revisão vencida é sinalizado e função NSI não cria autorização',()=>{
    const a=app();a.run("dbData.contatosColaboradores=[{id:'p',orgaoId:'o',nome:'Pessoa',funcoesContato:['nsi'],divulgavel:true,ativo:true,validadeCadastro:1}]");
    assert.match(a.run("orgaoComContatos({id:'o'}).gestorNsi"),/revisão vencida/);
    assert.equal(a.run("situacaoCadastroColaborador({ativo:true}).id"),'sem_prazo');
    assert.equal(a.run("modulosDoUsuario({ativo:true,tipoUsuario:'externo',perfil:'comum',funcoesContato:['nsi'],modulosPermitidos:[]}).length"),0);
});
test('projeção de contato não compartilha UID de login, senha nem perfil',()=>{
    const a=app();const p=a.run("projecaoContato({nome:'Pessoa',orgaoId:'o',setorId:'s',usuarioUid:'login',perfil:'admin',senha:'nunca',emailInstitucional:'p@example.invalid',telefone:'',cargo:'',ativo:true,atualizadoEm:'agora'})");
    assert.equal(p.usuarioUid,undefined);assert.equal(p.perfil,undefined);assert.equal(p.senha,undefined);
    a.element('colab-validade').value='2027-10-23';a.element('colab-funcoes').innerHTML='dados anteriores';a.element('colab-orgao').innerHTML='órgão anterior';a.run('limparDadosSessao()');assert.equal(a.element('colab-validade').value,'');assert.equal(a.element('colab-funcoes').innerHTML,'');assert.equal(a.element('colab-orgao').innerHTML,'');
});
test('admin vê colaboradores e gestor permanece limitado ao seu escopo',()=>{
    const a=app();a.run("currentUser={uid:'admin',perfil:'admin',tipoUsuario:'interno',ativo:true}");assert.ok(a.run('modulosDoUsuario()').includes('colaboradores'));
    usuarioGestorLote2(a);assert.equal(a.run("registroNoEscopo({orgaoId:'orgao-b',setorId:'b1'})"),false);
});
test('cancelar revisão de usuário não grava cadastro e mudança de sessão invalida confirmação',async()=>{
    const a=app({revisaoAutomatica:false});a.run("currentUser={uid:'admin',perfil:'admin',ativo:true,tipoUsuario:'interno'}");
    const dados="{nome:'Pessoa',email:'p@example.invalid',ativo:true,tipoUsuario:'externo',perfil:'comum',modulosPermitidos:[]}";
    let promessa=a.run('revisarUsuario('+dados+')');assert.equal(a.element('modal-revisar-usuario').classList.contains('hidden'),false);a.run('cancelarRevisaoUsuario()');assert.equal(await promessa,false);assert.equal(a.writes.length,0);assert.equal(a.element('revisar-usuario-resumo').innerHTML,'');
    promessa=a.run('revisarUsuario('+dados+')');a.run('versaoSessao++');a.listeners.get('revisar-usuario-confirmar:click')();assert.equal(await promessa,false);
});

test('painel gerencial unifica contas e estrutura em Colaboradores, preservando rota antiga',()=>{
 const a=app();a.run("currentUser={uid:'admin',ativo:true,tipoUsuario:'interno',perfil:'admin'};mudarAba('usuarios')");
 assert.equal(a.run('abaAtual'),'colaboradores');assert.equal(a.run('secaoColaboradores'),'acessos');assert.equal(a.element('aba-usuarios').classList.contains('hidden'),false);
 a.run("mostrarSecaoColaboradores('estrutura')");assert.equal(a.element('aba-usuarios').classList.contains('hidden'),true);assert.equal(a.element('colaboradores-estrutura').classList.contains('hidden'),false);
 assert.equal(a.element('painel-identificacao').textContent,'Painel gerencial');
});
test('matrícula é pesquisável pelo admin e não integra a projeção institucional',()=>{
 const a=app();a.run("currentUser={uid:'admin',perfil:'admin',ativo:true};dbData.colaboradores=[{id:'p',nome:'Pessoa',matricula:'ATI-001',orgaoId:'o',setorId:'s',emailInstitucional:'p@example.invalid'}]");
 a.element('admin-colab-busca').value='ati-001';a.run('renderColaboradoresAdmin()');assert.match(a.element('admin-colab-lista').innerHTML,/ATI-001/);
 a.element('admin-colab-busca').value='outra';a.run('renderColaboradoresAdmin()');assert.doesNotMatch(a.element('admin-colab-lista').innerHTML,/ATI-001/);
 assert.equal(a.run("Object.hasOwn(projecaoContato({matricula:'ATI-001'}),'matricula')"),false);
});
test('acesso do colaborador exige vínculo recíproco e considera bloqueio da conta',()=>{
 const a=app();a.run("dbData.usuarios=[{uid:'u',colaboradorId:'p',nome:'Pessoa',ativo:true,tipoUsuario:'externo',modulosPermitidos:['eventos']}]");
 assert.equal(a.run("acessoDoColaborador({id:'p',usuarioUid:'u'}).liberado"),true);
 a.run('dbData.usuarios[0].ativo=false');assert.equal(a.run("acessoDoColaborador({id:'p',usuarioUid:'u'}).liberado"),false);
 assert.equal(a.run("acessoDoColaborador({id:'outra',usuarioUid:'u'}).usuario"),null);
});
test('cadastro e login vinculados são gravados juntos com projeção e duas auditorias',async()=>{
 const a=app();a.run("currentUser={uid:'admin',nome:'Admin',perfil:'admin',ativo:true};");
 a.context.getDoc=async ref=>ref.collection==='colaboradores'?{exists:()=>true,data:()=>({nome:'Pessoa',ativo:true,orgaoId:'o',setorId:'s',emailInstitucional:'p@example.invalid',telefone:'',cargo:''})}:{exists:()=>false};
 await a.run("criarContaDoColaborador('novo',{nome:'Pessoa',perfil:'comum',ativo:true},{id:'p',uid:'admin',sessao:versaoSessao})");
 assert.equal(a.writes.find(w=>w.collection==='colaboradores').data.usuarioUid,'novo');assert.equal(a.writes.find(w=>w.collection==='usuarios').data.colaboradorId,'p');assert.equal(a.audits.length,2);
 assert.ok(a.writes.some(w=>w.collection==='contatosColaboradores'));assert.ok(a.writes.some(w=>w.collection==='identidadesUsuarios'));
});
test('criação de acesso recusa sessão trocada, colaborador inativo e conta já vinculada',async()=>{
 for(const pessoa of [{ativo:false},{ativo:true,usuarioUid:'outro'}]){
  const a=app();a.run("currentUser={uid:'admin',perfil:'admin',ativo:true}");a.context.getDoc=async ref=>({exists:()=>ref.collection==='colaboradores',data:()=>pessoa});
  await assert.rejects(a.run("criarContaDoColaborador('novo',{},{id:'p',uid:'admin',sessao:versaoSessao})"),/cadastro mudou/);assert.equal(a.writes.length,0);
 }
 const a=app();a.run("currentUser={uid:'admin',perfil:'admin',ativo:true}");
 await assert.rejects(a.run("criarContaDoColaborador('novo',{},{id:'p',uid:'outra',sessao:versaoSessao})"),/sessão mudou/);assert.equal(a.writes.length,0);
});

test('CSV por evento distingue inscrições atuais, canceladas e legadas, sem inventar frequência',()=>{
    const a=app();a.run("currentUser={uid:'master',ativo:true,tipoUsuario:'interno',perfil:'admin'};agendaLocaisEstado='completa';inscricoesRelatorioEstado='pronto'");
    a.context.dadosEventos=[{id:'e1',firestoreId:'doc-e1',titulo:'Oficina fictícia'},{id:'e2',titulo:'Outro evento'}];
    a.context.dadosInscricoes=[
        {id:'i1',eventId:'doc-e1',modeloInscricao:'institucional-v1',participanteNome:'Pessoa A',emailInstitucional:'a@example.invalid',orgaoId:'o1',setorId:'s1',situacao:'confirmada',protocolo:'PROTO-A'},
        {id:'i2',eventId:'e1',nome:'Pessoa antiga',email:'legado@example.invalid'},
        {id:'i3',eventId:'e2',participanteNome:'Pessoa B',situacao:'cancelada'}
    ];
    a.run("dbData.eventos=dadosEventos;dbData.inscricoes=dadosInscricoes;dbData.orgaos=[{id:'o1',nome:'Órgão A'}];dbData.setores=[{id:'s1',nome:'Setor A'}]");
    const porEvento=a.run("prepararRelatorioInscricoes('e1')");
    assert.equal(porEvento.total,2);assert.match(porEvento.csv,/Órgão A/);assert.match(porEvento.csv,/Setor A/);
    assert.match(porEvento.csv,/Não informada \(fluxo anterior\)/);assert.doesNotMatch(porEvento.csv,/Pessoa B/);
    assert.equal(a.run("prepararRelatorioInscricoes('doc-e1').total"),2);
    const geral=a.run('prepararRelatorioInscricoes()');assert.equal(geral.total,3);assert.match(geral.csv,/cancelada/);
    assert.doesNotMatch(geral.csv,/Presença confirmada|Certificado emitido/);
});
test('exportação geral de participantes é só do administrador ativo, não GRGD, gestor ou auditoria',()=>{
    const a=app();a.run("agendaLocaisEstado='completa';inscricoesRelatorioEstado='pronto'");
    for(const usuario of [
        {uid:'nsi',ativo:true,tipoUsuario:'externo',perfil:'comum',acessoInstitucional:vinculoTeste()},
        {uid:'grgd',ativo:true,tipoUsuario:'interno',perfil:'comum',acessoInstitucional:vinculoTeste({papel:'grgd',orgaoId:'',acoes:['relatorios.consultar']})},
        {uid:'aud',ativo:true,tipoUsuario:'externo',perfil:'comum',acessoInstitucional:vinculoTeste({papel:'auditoria',acoes:['relatorios.consultar']})},
        {uid:'admin',ativo:false,tipoUsuario:'interno',perfil:'admin'}
    ]){
        a.context.usuario=usuario;a.run('currentUser=usuario');
        assert.throws(()=>a.run('prepararRelatorioInscricoes()'),/Somente o administrador/);
    }
});
test('erro e carregamento incompleto bloqueiam relatório e desabilitam controles',()=>{
    const a=app();a.run("currentUser={uid:'master',ativo:true,tipoUsuario:'interno',perfil:'admin'};dbData.eventos=[{id:'e1',titulo:'Evento'}]");
    for(const estado of ['aguardando','carregando','erro']){
        a.run("agendaLocaisEstado='completa';inscricoesRelatorioEstado='"+estado+"';dbData.inscricoes=[{nome:'Não exportar'}]");
        assert.throws(()=>a.run('prepararRelatorioInscricoes()'),/carregamento completo/);
        a.run('renderEventos()');assert.equal(a.element('btn-relatorio-geral-eventos').disabled,true);
    }
    a.run("inscricoesRelatorioEstado='pronto';agendaLocaisEstado='erro'");
    assert.throws(()=>a.run('prepararRelatorioInscricoes()'),/carregamento completo/);
    a.run("agendaLocaisEstado='completa'");
    assert.throws(()=>a.run("prepararRelatorioInscricoes('inexistente')"),/Evento não encontrado/);
    a.run('renderEventos()');assert.equal(a.element('btn-relatorio-geral-eventos').disabled,false);
});
test('CSV é UTF-8, separador ponto e vírgula, com neutralização de fórmulas e aspas',()=>{
    const a=app();a.run("currentUser={uid:'master',ativo:true,tipoUsuario:'interno',perfil:'admin'};agendaLocaisEstado='completa';inscricoesRelatorioEstado='pronto'");
    a.context.inscricoesFicticias=[{eventId:'e',participanteNome:' =2+2 ',email:'"@cmd"',orgaoId:'-2',situacao:'confirmada'}];
    a.run("dbData.eventos=[{id:'e',titulo:'Oficina / TI'}];dbData.inscricoes=inscricoesFicticias");
    const rel=a.run('prepararRelatorioInscricoes()');
    assert.equal(rel.csv.charCodeAt(0),0xFEFF);
    assert.match(rel.csv,/"'=2\+2"/);assert.match(rel.csv,/'-2/);
    assert.match(rel.csv,/"\u0022\u0022@cmd\u0022\u0022"/);
    assert.match(rel.csv,/";"/);assert.match(rel.nomeArquivo,/prgd-inscricoes-geral-/);
    assert.equal(a.run("campoCsvRelatorio(' =SOMA(1;2)\\nlinha')"),'"\'=SOMA(1;2) linha"');
});
test('clique geral produz download sem escrita, e logout impede exportação posterior',()=>{
    const a=app();a.run("currentUser={uid:'master',ativo:true,tipoUsuario:'interno',perfil:'admin'};agendaLocaisEstado='completa';inscricoesRelatorioEstado='pronto';dbData.eventos=[{id:'e',titulo:'Teste'}];dbData.inscricoes=[{eventId:'e',nome:'Pessoa'}]");
    const arquivos=[];a.context.Blob=Blob;
    a.context.URL={createObjectURL:blob=>{arquivos.push(blob);return 'blob:relatorio';},revokeObjectURL(){}};
    a.context.document.createElement=()=>({click(){},remove(){},set href(v){this.link=v},set download(v){a.context.arquivoNome=v}});
    a.context.document.body.appendChild=()=>{};
    a.listeners.get('btn-relatorio-geral-eventos:click')();
    assert.equal(arquivos.length,1);assert.match(a.context.arquivoNome,/\.csv$/);assert.equal(a.writes.length,0);
    a.run('limparDadosSessao()');
    assert.throws(()=>a.run('prepararRelatorioInscricoes()'),/Somente o administrador/);
});

test('novo órgão sem localização não grava endereço, coordenadas ou foto de exemplo', async()=>{
    const a=app();a.run("currentUser={uid:'admin',perfil:'admin',tipoUsuario:'interno'}");
    a.element('form-univ-tipo').value='cliente';a.element('uc-1').value='Órgão fictício';
    await a.run('salvarCadastroUniversal({preventDefault(){}})');
    const record=a.writes.find(w=>w.collection==='orgaos').data;
    assert.equal(record.endereco,'');assert.equal(record.geolocalizacao,'');assert.equal(record.fotoFachada,'');
    assert.equal(a.audits.length,1);assert.equal(a.audits[0].colecao,'orgaos');
});
test('cadastro de órgão preserva localização e foto informadas',async()=>{
    const a=app();a.run("currentUser={uid:'admin',perfil:'admin',tipoUsuario:'interno'}");
    for(const [id,value]of Object.entries({'form-univ-tipo':'cliente','uc-1':'Órgão fictício','uc-endereco':'Rua informada, 10','uc-geo':'-8.1, -34.9','uc-fachada':'https://example.invalid/fachada.jpg'}))a.element(id).value=value;
    await a.run('salvarCadastroUniversal({preventDefault(){}})');const record=a.writes.find(w=>w.collection==='orgaos').data;
    assert.equal(record.endereco,'Rua informada, 10');assert.equal(record.geolocalizacao,'-8.1, -34.9');assert.equal(record.fotoFachada,'https://example.invalid/fachada.jpg');
});
test('detalhes de órgão sem localização mostram ausência sem inventar fachada ou mapa',()=>{
    const a=app();a.run("dbData.orgaos=[{id:'o',nome:'Órgão fictício',endereco:'  ',geolocalizacao:'  ',fotoFachada:'  '}];detalharRegistro('orgaos','o')");
    const html=a.element('detalhe-conteudo').innerHTML;
    assert.match(html,/Endereço não informado/);assert.match(html,/Coordenadas não informadas/);assert.match(html,/Fachada não informada/);
    assert.doesNotMatch(html,/google.com\/maps|images.unsplash.com|Rio Capibaribe|<img /);
    assert.equal(a.run("dbData.orgaos[0].endereco"),'  ');assert.equal(a.writes.length,0);
});
test('mapa de órgão usa coordenadas cadastradas ou endereço disponível, sem alterar o registro',()=>{
    const a=app();a.context.orgaos=[{id:'coordenadas',nome:'A',endereco:'Rua A',geolocalizacao:'-8.1, -34.9',fotoFachada:'https://example.invalid/foto.jpg'},{id:'endereco',nome:'B',endereco:'Rua B, 20 & Centro'}];a.run('dbData.orgaos=orgaos');
    a.run("detalharRegistro('orgaos','coordenadas')");let html=a.element('detalhe-conteudo').innerHTML;
    assert.ok(html.includes(encodeURIComponent('-8.1, -34.9')));assert.match(html,/src="https:\/\/example.invalid\/foto.jpg"/);
    a.run("detalharRegistro('orgaos','endereco')");html=a.element('detalhe-conteudo').innerHTML;
    assert.ok(html.includes(encodeURIComponent('Rua B, 20 & Centro')));assert.match(html,/Coordenadas não informadas/);assert.match(html,/Rua B, 20 &amp; Centro/);assert.equal(a.writes.length,0);
});
test('órgão sem ponto focal ou fonte não exibe pessoa, contato ou fonte fictícios',()=>{
    const a=app();a.run("dbData.orgaos=[{id:'o',nome:'Órgão fictício'}];detalharRegistro('orgaos','o')");
    const html=a.element('detalhe-conteudo').innerHTML;
    assert.doesNotMatch(html,/Fernanda Alves|Analista de Suporte|fernanda.alves|9655-7788|Diário Oficial|10\.123\.456/);
    assert.match(html,/Não informado/);assert.equal(a.writes.length,0);
});
test('órgão preserva fonte, ponto focal e referências manuais informadas',()=>{
    const a=app();a.context.registro={id:'o',nome:'Órgão fictício',cnpj:'CNPJ cadastrado',fonteInformacao:'Fonte registrada',pontoFocalNome:'Pessoa cadastrada',pontoFocalCargo:'Cargo cadastrado',pontoFocalEmail:'pessoa@example.invalid',pontoFocalTel:'Telefone cadastrado'};
    a.run("dbData.orgaos=[registro];detalharRegistro('orgaos','o')");const html=a.element('detalhe-conteudo').innerHTML;
    for(const value of ['CNPJ cadastrado','Fonte registrada','Pessoa cadastrada','Cargo cadastrado','pessoa@example.invalid','Telefone cadastrado'])assert.ok(html.includes(value));
    assert.equal(a.writes.length,0);
});

test('consulta de eventos combina busca sem acentos, tipo, situação e duração no período',()=>{
    const a=app();a.context.agenda=[
        {id:'ok',titulo:'Formação digital',palestrante:'João',localEvento:'Auditório',tipoEvento:'Oficina',status:'Confirmado',dataInicio:'2099-01-10',dataFim:'2099-01-13'},
        {id:'cancelado',titulo:'Formação digital',tipoEvento:'Oficina',status:'Cancelado',dataInicio:'2099-01-11'},
        {id:'outro',titulo:'Outra formação',tipoEvento:'Encontro',status:'Confirmado',dataInicio:'2099-01-12'}
    ];
    const options={periodo:'todos',busca:'FORMACAO',tipo:'Oficina',status:'Confirmado',de:'2099-01-12',ate:'2099-01-12'};a.context.filtros=options;
    assert.deepEqual(Array.from(a.run('consultarAgendaEventos(agenda,filtros).eventos'),e=>e.id),['ok']);
    for(const text of ['joao','auditorio']){a.context.texto=text;assert.equal(a.run('consultarAgendaEventos(agenda,{periodo:"todos",busca:texto}).eventos[0].id'),'ok');}
    assert.equal(a.run('agenda[0].dataInicio'),'2099-01-10');assert.equal(a.writes.length,0);
});
test('filtro de período inclui limites, converte timestamps no fuso institucional e exclui datas ausentes',()=>{
    const a=app();a.context.agenda=[
        {id:'timestamp',dataInicio:'2099-01-13T01:00:00Z'},
        {id:'limite',dataInicio:'2099-01-12'},
        {id:'fora',dataInicio:'2099-01-13'},
        {id:'sem-data'}, {id:'invalida',dataInicio:'2099-02-30'},
        {id:'invertida',dataInicio:'2099-01-12',dataFim:'2099-01-11'}, {id:'fim-invalido',dataInicio:'2099-01-12',dataFim:'invalida'}
    ];
    assert.deepEqual(Array.from(a.run('consultarAgendaEventos(agenda,{periodo:"todos",de:"2099-01-12",ate:"2099-01-12"}).eventos'),e=>e.id),['limite','timestamp']);
    assert.equal(a.run('consultarAgendaEventos(agenda,{periodo:"todos"}).eventos.length'),7);
});
test('período de consulta inválido explica o erro e não devolve resultados parciais',()=>{
    const a=app();a.context.agenda=[{dataInicio:'2099-01-10'}];
    for(const filtros of [{de:'2099-02-30'},{ate:'data-invalida'},{de:'2099-01-12',ate:'2099-01-10'}]){
        a.context.filtros=filtros;assert.ok(a.run('consultarAgendaEventos(agenda,filtros).erro'));assert.equal(a.run('consultarAgendaEventos(agenda,filtros).eventos.length'),0);
    }
});
test('ordem da agenda é previsível e mantém eventos sem data por último, sem reordenar a origem',()=>{
    const a=app();a.context.agenda=[{id:'z',titulo:'Sem data'},{id:'b',dataInicio:'2020-01-02',horaInicio:'10:00'},{id:'a',dataInicio:'2020-01-02',horaInicio:'09:00'},{id:'c',dataInicio:'2020-01-03'}];
    assert.deepEqual(Array.from(a.run('consultarAgendaEventos(agenda,{periodo:"todos",ordem:"crescente"}).eventos'),e=>e.id),['a','b','c','z']);
    assert.deepEqual(Array.from(a.run('consultarAgendaEventos(agenda,{periodo:"realizados"}).eventos'),e=>e.id),['c','b','a']);
    assert.deepEqual(Array.from(a.run('agenda'),e=>e.id),['z','b','a','c']);
});
test('filtros e opções de Eventos não incluem metadados de eventos fora do perfil',()=>{
    const a=app();a.run("currentUser={uid:'u',ativo:true,tipoUsuario:'interno',perfil:'comum',grupos:[]};dbData.eventos=[{id:'publico',titulo:'Visível',eventoPublico:true,tipoEvento:'Oficina',status:'Confirmado',dataInicio:'2099-01-01'},{id:'restrito',titulo:'Título restrito',gruposPermitidos:['outro'],tipoEvento:'Tipo restrito',status:'Situação restrita',dataInicio:'2099-01-01'}];filtroEventoAtual='todos';renderEventos()");
    assert.equal(a.element('count-eventos').textContent,1);
    assert.doesNotMatch(a.element('grid-eventos').innerHTML,/Título restrito/);
    assert.doesNotMatch(a.element('filtro-evento-tipo').innerHTML,/Tipo restrito/);
    assert.doesNotMatch(a.element('filtro-evento-status').innerHTML,/Situação restrita/);
});
test('eventos passados ou cancelados não ganham situação Realizado automaticamente',()=>{
    const a=app();a.run("currentUser={uid:'admin',perfil:'admin',ativo:true};dbData.eventos=[{id:'antigo',titulo:'Evento passado',dataInicio:'2020-01-01',status:'Planejado'},{id:'cancelado',titulo:'Evento cancelado',dataInicio:'2099-01-01',status:'Cancelado'},{id:'sem',titulo:'Registro incompleto',dataInicio:'2020-01-02'}];filtroEventoAtual='todos';renderEventos()");
    const html=a.element('grid-eventos').innerHTML;
    assert.match(html,/Planejado/);assert.match(html,/Cancelado/);assert.match(html,/Situação não informada/);assert.match(html,/Tipo não informado/);assert.doesNotMatch(html,/>Realizado</);
    assert.equal(a.run('dbData.eventos[0].status'),'Planejado');assert.equal(a.writes.length,0);
});
test('limpar filtros e encerrar sessão limpam consulta, ordenação e período da agenda',()=>{
    const a=app();
    for(const finalizar of [false,true]){
        for(const id of ['busca-eventos','filtro-evento-status','filtro-evento-tipo','filtro-evento-de','filtro-evento-ate','ordenacao-eventos'])a.element(id).value='anterior';
        a.run("buscaEventosVal='busca anterior';filtroEventoAtual='todos'");
        if(finalizar)a.run('limparDadosSessao()');else a.listeners.get('limpar-filtros-eventos:click')();
        for(const id of ['busca-eventos','filtro-evento-status','filtro-evento-tipo','filtro-evento-de','filtro-evento-ate','ordenacao-eventos'])assert.equal(a.element(id).value,'');
        assert.equal(a.run('filtroEventoAtual'),'futuros');assert.equal(a.run('buscaEventosVal'),'');
    }
});
test('rótulos de filtros e tipos vindos do banco continuam escapados no HTML',()=>{
    const a=app();a.run(`currentUser={uid:'admin',perfil:'admin',ativo:true};dbData.eventos=[{id:'e',titulo:'Evento',status:'<img src=x>',tipoEvento:'\"<svg onload=alert(1)>',dataInicio:'2099-01-01'}];renderEventos()`);
    assert.doesNotMatch(a.element('filtro-evento-status').innerHTML,/<img/);assert.match(a.element('filtro-evento-status').innerHTML,/&lt;img/);
    assert.doesNotMatch(a.element('filtro-evento-tipo').innerHTML,/<svg/);assert.match(a.element('filtro-evento-tipo').innerHTML,/&quot;/);
});

function painelInscricoesFixture() {
    const a=app();a.run("currentUser={uid:'admin',perfil:'admin',tipoUsuario:'interno',ativo:true};agendaLocaisEstado='completa';inscricoesRelatorioEstado='pronto';dbData.eventos=[{id:'e',firestoreId:'doc-e',titulo:'Evento fictício',modeloInscricao:'institucional-v1',limiteVagas:4,inscritosCount:2}];dbData.orgaos=[{id:'a',nome:'Órgão A'},{id:'b',nome:'Órgão B'}];dbData.setores=[{id:'s',nome:'Setor fictício'}]");
    a.context.registros=[
        {id:'i1',eventId:'doc-e',modeloInscricao:'institucional-v1',participanteNome:'João',emailInstitucional:'joao@example.invalid',orgaoId:'a',setorId:'s',situacao:'confirmada',protocolo:'PROTO-1'},
        {id:'i2',eventId:'e',modeloInscricao:'institucional-v1',participanteNome:'Ana',orgaoId:'b',situacao:'confirmada',protocolo:'PROTO-2'},
        {id:'i3',eventId:'doc-e',modeloInscricao:'institucional-v1',participanteNome:'Cancelada',orgaoId:'a',situacao:'cancelada'},
        {id:'i4',eventId:'e',nome:'Pessoa do fluxo anterior',situacao:'confirmada'},
        {id:'i5',eventId:'doc-e',modeloInscricao:'institucional-v1',participanteNome:'Situação desconhecida',situacao:'outro'},
        {id:'fora',eventId:'outro',participanteNome:'Outro evento',situacao:'confirmada'}
    ];a.run('dbData.inscricoes=registros');return a;
}
test('painel separa confirmadas, canceladas, legado e situação desconhecida sem inferir presença',()=>{
    const a=painelInscricoesFixture(),d=a.run("dadosPainelInscricoes('doc-e')");
    assert.equal(d.total,5);assert.equal(d.confirmadas,2);assert.equal(d.canceladas,1);assert.equal(d.legadas,1);assert.equal(d.indefinidas,1);
    assert.equal(d.vagas,null);assert.equal(d.conferir,true);assert.equal(a.writes.length,0);
    assert.equal(a.run("dadosPainelInscricoes('e').total"),5);assert.throws(()=>a.run("dadosPainelInscricoes('outro')"),/não encontrado/);
});
test('busca do painel combina nome sem acento, protocolo, órgão e situação sem filtrar os totais',()=>{
    const a=painelInscricoesFixture();
    const d=a.run("dadosPainelInscricoes('e',{busca:'JOAO',situacao:'confirmada',orgao:'a'})");
    assert.equal(d.registros.length,1);assert.equal(d.registros[0].nome,'João');assert.equal(d.total,5);assert.equal(d.confirmadas,2);
    assert.equal(a.run("dadosPainelInscricoes('e',{busca:'PROTO-2'}).registros[0].nome"),'Ana');
    assert.equal(a.run("dadosPainelInscricoes('e',{busca:'setor ficticio'}).registros.length"),1);
    assert.equal(a.run("dadosPainelInscricoes('e',{situacao:'legada'}).registros.length"),1);
    assert.equal(a.run("dadosPainelInscricoes('e',{orgao:'sem-inscricoes'}).registros.length"),0);
});
test('vagas do painel exigem contador e inscrições conciliados e capacidade válida',()=>{
    const a=painelInscricoesFixture();a.run("dbData.inscricoes=dbData.inscricoes.filter(i=>!['i4','i5'].includes(i.id))");
    let d=a.run("dadosPainelInscricoes('e')");assert.equal(d.vagas,2);assert.equal(d.conferir,false);
    for(const patch of [{inscritosCount:3},{inscritosCount:-1},{inscritosCount:'2'},{limiteVagas:1},{limiteVagas:0},{limiteVagas:null}]){
        a.context.patch=patch;a.run("Object.assign(dbData.eventos[0],{inscritosCount:2,limiteVagas:4},patch)");
        d=a.run("dadosPainelInscricoes('e')");assert.equal(d.vagas,null);assert.equal(d.conferir,true);
    }assert.equal(a.writes.length,0);
});
test('evento antigo não calcula vagas ou converte inscrições pelo rótulo de situação',()=>{
    const a=painelInscricoesFixture();a.run('delete dbData.eventos[0].modeloInscricao');
    const d=a.run("dadosPainelInscricoes('e')");assert.equal(d.vagas,null);assert.equal(d.institucional,false);assert.equal(d.conferir,false);assert.equal(d.legadas,1);
});
test('painel geral recusa gestor, GRGD, auditoria e administrador inativo',()=>{
    const a=painelInscricoesFixture();
    for(const usuario of [{uid:'x',perfil:'comum',ativo:true},{uid:'g',perfil:'comum',ativo:true,acessoInstitucional:vinculoTeste({papel:'grgd',acoes:['eventos.consultar','relatorios.consultar']})},{uid:'u',perfil:'admin',ativo:false}]){
        a.context.usuario=usuario;a.run('currentUser=usuario');assert.throws(()=>a.run("dadosPainelInscricoes('e')"),/Somente o administrador/);
    }
});
test('painel não mostra contagem zero quando eventos ou inscrições não estão confirmados',()=>{
    const a=painelInscricoesFixture();const painel=a.element('painel-inscricoes-evento');painel.getAttribute=()=> 'doc-e';painel.removeAttribute=()=>{};
    a.run('atualizarPainelInscricoesEvento()');assert.match(a.element('painel-inscricoes-lista').innerHTML,/João/);
    for(const state of ['carregando','erro']){
        a.context.state=state;a.run('inscricoesRelatorioEstado=state;atualizarPainelInscricoesEvento()');
        assert.equal(a.element('painel-inscricoes-lista').innerHTML,'');assert.equal(a.element('painel-inscricoes-resumo').innerHTML,'');assert.equal(a.element('painel-inscricoes-csv').disabled,true);
        assert.doesNotMatch(a.element('painel-inscricoes-status').textContent,/0 de 0/);
    }
    a.run("inscricoesRelatorioEstado='pronto';agendaLocaisEstado='erro'");assert.throws(()=>a.run("dadosPainelInscricoes('doc-e')"),/Aguarde/);
});
test('painel elimina dados pessoais após perda do papel administrador e ao fechar os detalhes',()=>{
    const a=painelInscricoesFixture(),panel=a.element('painel-inscricoes-evento');let id='doc-e';panel.getAttribute=()=>id;panel.removeAttribute=()=>{id='';};
    panel.innerHTML='dados pessoais';a.run("currentUser={uid:'u',perfil:'comum',ativo:true};atualizarPainelInscricoesEvento()");assert.equal(panel.innerHTML,'');assert.equal(id,'');
    panel.innerHTML='dados pessoais';a.run("fecharModal('modal-detalhes')");assert.equal(panel.innerHTML,'');
});
test('dados pessoais no painel são escapados e CSV mantém todas as inscrições do evento',()=>{
    const a=painelInscricoesFixture();a.run("dbData.inscricoes[0].participanteNome='<img src=x onerror=alert(1)>';dbData.inscricoes[0].emailInstitucional='a\"<svg>@example.invalid'");
    const panel=a.element('painel-inscricoes-evento');panel.getAttribute=()=> 'doc-e';
    a.element('painel-inscricoes-situacao').value='confirmada';a.run('atualizarPainelInscricoesEvento()');
    assert.doesNotMatch(a.element('painel-inscricoes-lista').innerHTML,/<img|<svg/);assert.match(a.element('painel-inscricoes-lista').innerHTML,/&lt;img/);
    assert.equal(a.run("prepararRelatorioInscricoes('doc-e').total"),5);assert.equal(a.writes.length,0);
});

test('cadastros apresentam rótulos, booleanos e datas sem serializar estruturas como código',()=>{
    const a=app();a.run("currentUser={uid:'admin',perfil:'admin'};dbData.fornecedores=[{firestoreId:'f',nome:'São José',razaoSocial:'Órgãos e Ações',ativo:false,valorContrato:0,criadoEm:{seconds:1792843200},criadoPorUid:'codigo-interno',contatos:[{nome:'Conceição',telefone:'81 99999-0000'}]}];detalharRegistro('fornecedores','f')");
    const html=a.element('detalhe-conteudo').innerHTML;
    assert.match(html,/Razão social/);assert.match(html,/Órgãos e Ações/);assert.match(html,/24\/10\/2026/);assert.match(html,/>Não</);assert.match(html,/>0</);assert.match(html,/Conceição/);
    assert.doesNotMatch(html,/\[object Object\]|Invalid Date|Timestamp\(/);
    assert.match(html,/<details[^>]*><summary[^>]*>Referências técnicas/);assert.match(html,/codigo-interno/);
    assert.equal(a.element('detalhe-titulo-modal').textContent,'Detalhes de fornecedor');
});
test('formatação de cadastro escapa textos e rótulos e não interpreta HTML cadastrado',()=>{
    const a=app();a.run("currentUser={uid:'admin',perfil:'admin'}");
    const html=a.run("detalhesCadastroHtml({'campo<svg>':{nome:'<img src=x onerror=alert(1)>',ativo:true},criadoEm:'data inválida',valor:0})");
    assert.doesNotMatch(html,/<svg>|<img src=x/);assert.match(html,/&lt;img/);assert.match(html,/Data a conferir/);assert.match(html,/>Sim</);assert.match(html,/>0</);
    assert.equal(a.run("formatarDataExibicao('2026-02-30T12:00:00Z')"),'Data a conferir');
    assert.equal(a.run("formatarDataExibicao('2024-02-29T00:30:00Z')"),'28/02/2024');
});
test('editar listas de referências preserva IDs, vírgulas e repetições quando não há alteração',async()=>{
    const a=app();a.run("currentUser={uid:'admin',perfil:'admin',nome:'Admin'};dbData.bases=[{firestoreId:'b',nome:'Original',grupos:['g,1','g2','g,1']}]");
    a.element('edit-colecao').value='bases';a.element('edit-doc-id').value='b';
    a.context.editEvent={preventDefault(){},target:{querySelectorAll:()=>[{name:'nome',value:'Novo',dataset:{}},{name:'grupos',dataset:{fieldType:'reference-list'},selectedOptions:[{value:'g,1'},{value:'g2'}]}]}};
    await a.run('salvarEdicaoAdmin(editEvent)');assert.deepEqual(Array.from(a.writes[0].data.grupos),['g,1','g2','g,1']);assert.equal(a.writes[0].data.nome,'Novo');
});
test('referências sem nome não expõem códigos como órgão ou setor e não carregam novos dados',()=>{
    const a=app();const before=a.snapshots.length;
    assert.equal(a.run("nomeReferencia('setores','HASH-DO-SETOR')"),'Setor indisponível nesta consulta');
    a.run("dbData.orgaos=[{firestoreId:'a',nome:'Secretaria de Administração'}]");
    assert.equal(a.run("nomeReferencia('orgaos','a')"),'Secretaria de Administração');assert.equal(a.snapshots.length,before);
});
test('mensagens preservam validação de negócio e traduzem erros técnicos sem mostrar códigos',()=>{
    const a=app();assert.equal(a.run("traduzirErroSistema(new Error('Não há vagas disponíveis.'))"),'Não há vagas disponíveis.');
    for(const code of ['auth/network-request-failed','unavailable','auth/internal-error','permission-denied']){
        a.context.uiError={code,message:'FirebaseError: INTERNAL_SQL_CODIGO'};
        assert.doesNotMatch(a.run('traduzirErroSistema(uiError)'),/Firebase|SQL|auth\/|INTERNAL|undefined/);
    }
    assert.doesNotMatch(a.run("traduzirErroSistema(new TypeError('x is not a function'))"),/TypeError|function/);
});
test('histórico exibe nomes de campos legíveis e mantém os códigos para busca e referência',()=>{
    const a=app();a.run("currentUser={uid:'admin',perfil:'admin'};historicoRegistros=[{autorNome:'João',autorUid:'UID-TECNICO',acao:'editar',colecao:'fornecedores',registroNome:'São José',registroId:'REGISTRO',campos:['produtoServicoPrincipal','criadoEm'],criadoEm:{seconds:1792843200}}];renderHistoricoAlteracoes()");
    const html=a.element('historico-registros').innerHTML;assert.match(html,/Produto ou serviço principal/);assert.match(html,/Criado em/);assert.match(html,/24\/10\/2026/);assert.match(html,/<details/);assert.match(html,/UID-TECNICO/);
    a.element('historico-busca').value='produto ou serviço';a.run('renderHistoricoAlteracoes()');assert.match(a.element('historico-registros').innerHTML,/São José/);
});
test('datas inválidas em vínculo não impedem abrir o cadastro nem aparecem como Invalid Date',()=>{
    const a=app();a.run("currentUser={uid:'admin',perfil:'admin'};dbData.usuarios=[{firestoreId:'u',uid:'u',nome:'Pessoa',perfil:'comum',tipoUsuario:'externo',acessoInstitucional:{papel:'gestor_nsi',situacao:'aprovado',setoresIds:[],acoes:[],inicio:Date.now(),fim:'data inválida',revisao:'data inválida'}}];detalharRegistro('usuarios','u')");
    assert.match(a.element('detalhe-conteudo').innerHTML,/Data a conferir/);assert.doesNotMatch(a.element('detalhe-conteudo').innerHTML,/Invalid Date/);
    assert.equal(a.run("dataHoraLocalFormulario('data inválida')"),'');
});
test('comprovante com situação desconhecida não é apresentado como cancelado ou confirmado',async()=>{
    const a=app();a.run("currentUser={uid:'admin',perfil:'admin'}");a.context.getDoc=async()=>({exists:()=>true,data:()=>({modeloInscricao:'institucional-v1',situacao:'a-conferir',participanteNome:'Pessoa',eventoTitulo:'Evento',orgaoId:'org-inacessivel',setorId:'setor-inacessivel'})});
    await a.run("consultarComprovante('i')");const html=a.element('comprovante-conteudo').innerHTML;
    assert.match(html,/Situação da inscrição não informada/);assert.doesNotMatch(html,/Inscrição cancelada|Inscrição confirmada|org-inacessivel|setor-inacessivel/);
});
