const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercita o módulo real com DOM/Firebase simulados, sem acessar serviços ou dados reais.
function app() {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const source = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1]
        .replace(/^\s*import .*?;\s*$/gm, '');
    const nodes = new Map(), writes = [], charts = [], listeners = new Map(), snapshots = [];
    const element = id => {
        if (!nodes.has(id)) nodes.set(id, {
            value: '', textContent: '', innerHTML: '', style: {}, dataset: {},
            classList: { add() {}, remove() {}, toggle() {} },
            addEventListener(type, fn) { listeners.set(id + ':' + type, fn); },
            appendChild() {},
            getContext() { return {}; }
        });
        return nodes.get(id);
    };
    const context = vm.createContext({
        console: { info() {}, warn() {} }, window: {},
        document: { getElementById: element, createElement() { return {}; }, querySelectorAll() { return []; }, querySelector() { return null; }, addEventListener() {} },
        alert() {}, confirm() { return true; },
        initializeApp() { return {}; }, getFirestore() { return {}; }, getAuth() { return {}; },
        inMemoryPersistence: {}, setPersistence() { return Promise.resolve(); },
        signInWithEmailAndPassword() { return Promise.resolve(); }, signOut() { return Promise.resolve(); },
        collection(db, name) { return name; }, doc(db, collection, id) { return { collection, id }; },
        async addDoc(collection, data) { writes.push({ collection, data }); },
        async setDoc(ref, data) { writes.push({ collection: ref.collection, data }); }, async deleteDoc() {},
        onSnapshot(ref, callback, error) { const sub = {ref, callback, error}; snapshots.push(sub); return () => {}; }, async getDoc() { return { exists() { return false; } }; },
        query(...args) { return args; }, where(...args) { return args; }, async getDocs() { return { docs: [] }; },
        onAuthStateChanged(auth, callback) { context.authCallback = callback; },
        Chart: function(ctx, config) { charts.push(config); this.destroy = () => {}; }
    });
    vm.runInContext(source, context);
    return { run: code => vm.runInContext(code, context), element, writes, charts, listeners, snapshots, context };
}

test('cadastro de local grava na mesma coleção lida pelo módulo', async () => {
    const a = app(); a.element('form-univ-tipo').value = 'local'; a.element('uc-1').value = 'Auditório';
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
    const a=app();a.run("currentUser={perfil:'admin'};dbData.eventos=[{firestoreId:'ev',gruposPermitidos:['grupo, especial','comum']}]");
    a.element('edit-colecao').value='eventos';a.element('edit-doc-id').value='ev';
    a.context.editEvent={preventDefault(){},target:{querySelectorAll:()=>[{name:'gruposPermitidos',value:'grupo, especial, comum',dataset:{fieldType:'string-list'}}]}};
    await a.run('salvarEdicaoAdmin(editEvent)');assert.deepEqual(Array.from(a.writes[0].data.gruposPermitidos),['grupo, especial','comum']);
});
