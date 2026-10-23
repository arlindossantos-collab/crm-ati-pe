const {test, before, after, beforeEach} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {initializeTestEnvironment, assertSucceeds, assertFails} = require('@firebase/rules-unit-testing');
const {doc, setDoc, getDoc, deleteDoc, updateDoc, collection, getDocs, query, where, writeBatch, serverTimestamp} = require('firebase/firestore');

function institutionalAccess(extra={}) {
    const agora=Date.now();
    return {papel:'gestor_nsi',orgaoId:'orgao-a',setoresIds:['a1'],situacao:'aprovado',inicio:agora-60000,fim:agora+3600000,revisao:agora+1800000,
        titularUid:'',acoes:['orgao.consultar','participantes.consultar','eventos.consultar','inscricoes.consultar'],
        aprovacaoGrgd:{responsavel:'GRGD de teste',referencia:'G1'},aprovacaoAutoridade:{responsavel:'Autoridade de teste',referencia:'A1'},
        registradoPorUid:'admin',registradoEm:new Date(),...extra};
}
async function seedInstitutional() {
    const titular=profile('titular',{tipoUsuario:'externo',modulosPermitidos:[],acessoInstitucional:institutionalAccess()});
    await env.withSecurityRulesDisabled(async ctx=>{
        const f=ctx.firestore();
        const rows={
            'orgaos/orgao-a':{nome:'Órgão A fictício'},'orgaos/orgao-b':{nome:'Órgão B fictício'},
            'setores/a1':{nome:'Setor A1',orgaoId:'orgao-a',ativo:true},'setores/a2':{nome:'Setor A2',orgaoId:'orgao-a',ativo:true},'setores/b1':{nome:'Setor B1',orgaoId:'orgao-b',ativo:true},
            'usuarios/titular':titular,
            'usuarios/sub':profile('sub',{tipoUsuario:'externo',modulosPermitidos:[],acessoInstitucional:institutionalAccess({papel:'substituto',titularUid:'titular',fim:titular.acessoInstitucional.fim-1000,revisao:titular.acessoInstitucional.revisao-1000})}),
            'usuarios/auditor':profile('auditor',{modulosPermitidos:[],acessoInstitucional:institutionalAccess({papel:'auditoria',acoes:['auditoria.consultar','relatorios.consultar']})}),
            'usuarios/operador':profile('operador',{modulosPermitidos:[],acessoInstitucional:institutionalAccess({papel:'grgd',orgaoId:'',setoresIds:[],acoes:['eventos.consultar','eventos.editar']})}),
            'colaboradores/a1':{nome:'Participante A1',orgaoId:'orgao-a',setorId:'a1'},'colaboradores/a2':{nome:'Participante A2',orgaoId:'orgao-a',setorId:'a2'},'colaboradores/b1':{nome:'Participante B1',orgaoId:'orgao-b',setorId:'b1'},
            'inscricoes/a1':{uid:'participante-sem-login',eventId:'e1',orgaoId:'orgao-a',setorId:'a1'},'inscricoes/b1':{uid:'titular',eventId:'e1',orgaoId:'orgao-b',setorId:'b1'},
            'historicoAlteracoes/a1':{orgaoId:'orgao-a',setorId:'a1',autorUid:'admin',acao:'editar'},'historicoAlteracoes/b1':{orgaoId:'orgao-b',setorId:'b1',autorUid:'admin',acao:'editar'}
        };
        await Promise.all(Object.entries(rows).map(([p,data])=>setDoc(doc(f,p),data)));
    });
    return titular;
}

// Somente projeto demo e emulador local. Nunca inicializar com o projeto da produção.
const projectId = 'demo-prgd-usuarios';
let env;
const profile = (uid, extra = {}) => ({uid, nome:uid, email:`${uid}@example.invalid`, ativo:true,
    tipoUsuario:'interno', perfil:'comum', modulosPermitidos:['demandas'], tags:[], grupos:[], ...extra});
const db = (uid, auth_time = Math.floor(Date.now()/1000)) => env.authenticatedContext(uid, {email:`${uid}@example.invalid`,auth_time}).firestore();
function excluirComLog(f,uid,extraLog={}) {
    const lote=writeBatch(f),log=doc(collection(f,'historicoAlteracoes'));
    lote.update(doc(f,'usuarios',uid),{ativo:false,excluido:true,ultimaAuditoriaId:log.id});
    lote.set(log,{autorUid:'admin',autorNome:'admin',criadoEm:serverTimestamp(),colecao:'usuarios',registroId:uid,registroNome:uid,acao:'excluir_usuario',campos:['ativo','excluido'],...extraLog});
    return lote.commit();
}
before(async () => {
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Execute com npm run test:rules, nunca contra produção.');
    env = await initializeTestEnvironment({projectId, firestore:{rules:fs.readFileSync(path.join(__dirname,'..','firestore.rules'),'utf8')}});
});
after(async()=>{if(env)await env.cleanup();});
beforeEach(async()=>{
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async context=>{
        const firestore=context.firestore();
        const records={
            'usuarios/admin':profile('admin',{perfil:'admin',modulosPermitidos:['usuarios','demandas','eventos']}),
            'usuarios/interno':profile('interno'),
            'usuarios/outro':profile('outro'),
            'usuarios/inativo':profile('inativo',{perfil:'admin',ativo:false}),
            'usuarios/externo':profile('externo',{tipoUsuario:'externo',modulosPermitidos:[]}),
            'usuarios/eventos':profile('eventos',{tipoUsuario:'externo',modulosPermitidos:['eventos']}),
            'usuarios/legado':{nome:'Legado',perfil:'admin'},
            'demandas/d1':{titulo:'Demanda interna'},
            'demandas/publica':{titulo:'Exige permissão do módulo',publico:true},
            'orgaos/o1':{nome:'Cliente'},
            'eventos/e1':{titulo:'Evento público',eventoPublico:true},
            'eventos/restrito':{titulo:'Restrito',eventoPublico:false,gruposPermitidos:['grupo']},
            'inscricoes/uma':{uid:'interno',eventId:'e1'},
            'inscricoes/minha':{uid:'eventos',eventId:'e1'},
            'grupos/grupo':{nome:'Grupo interno'},
            'usuarios/interno/privado/perfil':{telefone:'81999990000',endereco:'Endereço privado',atualizadoEm:'2026-10-20'},
            'identidadesUsuarios/outro':{uid:'outro',nome:'outro',fotoPerfil:'',tipoUsuario:'interno',ativo:true},
            'identidadesUsuarios/interno':{uid:'interno',nome:'interno',fotoPerfil:'',tipoUsuario:'interno',ativo:true},
            'identidadesUsuarios/externo':{uid:'externo',nome:'externo',fotoPerfil:'',tipoUsuario:'externo',ativo:true}
        };
        await Promise.all(Object.entries(records).map(([p,data])=>setDoc(doc(firestore,p),data)));
    });
});

test('sem autenticação não acessa usuários nem demandas',async()=>{
    const anon=env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anon,'usuarios','admin')));
    await assertFails(getDoc(doc(anon,'demandas','d1')));
});
test('conta Auth sem perfil não cria administrador nem consulta dados',async()=>{
    const f=db('semperfil');
    await assertFails(setDoc(doc(f,'usuarios','semperfil'),profile('semperfil',{perfil:'admin'})));
    await assertFails(setDoc(doc(f,'usuarios','semperfil'),profile('semperfil')));
    await assertFails(getDoc(doc(f,'demandas','d1')));
});
test('comum não se promove, muda módulos nem cadastra outro usuário',async()=>{
    const f=db('interno');
    await assertFails(updateDoc(doc(f,'usuarios','interno'),{perfil:'admin'}));
    await assertFails(updateDoc(doc(f,'usuarios','interno'),{modulosPermitidos:['usuarios','demandas']}));
    await assertFails(setDoc(doc(f,'usuarios','novo'),profile('novo')));
    await assertSucceeds(updateDoc(doc(f,'usuarios','interno'),{nome:'Nome atualizado'}));
});
test('administrador cria interno e externo e edita as permissões',async()=>{
    const f=db('admin');
    await assertSucceeds(setDoc(doc(f,'usuarios','novo'),profile('novo')));
    await assertSucceeds(updateDoc(doc(f,'usuarios','novo'),{modulosPermitidos:['eventos','clientes']}));
    await assertSucceeds(setDoc(doc(f,'usuarios','novoexterno'),profile('novoexterno',{tipoUsuario:'externo',modulosPermitidos:[]})));
});
test('regras recusam externo administrador, módulos internos, senha ou UID divergente',async()=>{
    const f=db('admin');
    const invalidos=[{tipoUsuario:'externo',perfil:'admin',modulosPermitidos:[]},
        {tipoUsuario:'externo',modulosPermitidos:['demandas']},{perfil:'comum',modulosPermitidos:['usuarios']},
        {uid:'outro'},{senha:'nao-gravar'},{password:'nao-gravar'}];
    for(const extra of invalidos)await assertFails(setDoc(doc(f,'usuarios','novo'),profile('novo',extra)));
});
test('interno consulta diretório ativo por consulta filtrada, sem listar todos os usuários',async()=>{
    const f=db('interno');
    const resultado=await assertSucceeds(getDocs(query(collection(f,'identidadesUsuarios'),where('tipoUsuario','==','interno'),where('ativo','==',true))));
    assert.ok(resultado.docs.some(d=>d.id==='outro'));
    await assertFails(getDocs(collection(f,'usuarios')));
    await assertFails(getDoc(doc(f,'usuarios','outro')));
    await assertFails(getDoc(doc(f,'usuarios','externo')));
    await assertFails(getDoc(doc(f,'usuarios','inativo')));
});
test('externo sem módulos consulta seu perfil e não recebe dados internos',async()=>{
    const f=db('externo');
    await assertSucceeds(getDoc(doc(f,'usuarios','externo')));
    for(const p of ['usuarios/admin','demandas/d1','demandas/publica','orgaos/o1','grupos/grupo','eventos/e1'])await assertFails(getDoc(doc(f,p)));
});
test('consulta por módulo não permite alterar demanda nem ler módulo diferente',async()=>{
    const f=db('interno');
    await assertSucceeds(getDoc(doc(f,'demandas','d1')));
    await assertFails(updateDoc(doc(f,'demandas','d1'),{titulo:'Alterado'}));
    await assertFails(getDoc(doc(f,'orgaos','o1')));
});
test('inativo perde leituras e alterações mesmo com perfil administrador',async()=>{
    const f=db('inativo');
    await assertSucceeds(getDoc(doc(f,'usuarios','inativo')));
    await assertFails(getDoc(doc(f,'demandas','d1')));
    await assertFails(updateDoc(doc(f,'usuarios','inativo'),{ativo:true}));
    await assertFails(updateDoc(doc(f,'demandas','d1'),{titulo:'Alterado'}));
});
test('admin inativa perfil legado preservando registros e não apaga usuário',async()=>{
    const f=db('admin');
    await assertSucceeds(updateDoc(doc(f,'usuarios','legado'),{ativo:false,editadoPor:'Admin'}));
    await assertFails(deleteDoc(doc(f,'usuarios','outro')));
});
test('admin não desativa nem rebaixa a si mesmo',async()=>{
    const f=db('admin');
    await assertFails(updateDoc(doc(f,'usuarios','admin'),{ativo:false}));
    await assertFails(updateDoc(doc(f,'usuarios','admin'),{perfil:'comum'}));
    await assertFails(updateDoc(doc(f,'usuarios','admin'),{tipoUsuario:'externo',perfil:'comum',modulosPermitidos:[]}));
});
test('administrador legado mantém acesso e pode classificar a própria conta',async()=>{
    const f=db('legado');
    await assertSucceeds(getDocs(collection(f,'usuarios')));
    await assertSucceeds(setDoc(doc(f,'usuarios','legado'),profile('legado',{perfil:'admin'}),{merge:true}));
});
test('eventos liberados permitem apenas eventos públicos e inscrições próprias',async()=>{
    const f=db('eventos');
    await assertSucceeds(getDocs(query(collection(f,'eventos'),where('eventoPublico','==',true))));
    await assertFails(getDoc(doc(f,'eventos','restrito')));
    await assertSucceeds(getDocs(query(collection(f,'inscricoes'),where('uid','==','eventos'))));
    await assertFails(getDocs(collection(f,'inscricoes')));
    await assertFails(getDoc(doc(f,'inscricoes','uma')));
    await assertSucceeds(setDoc(doc(f,'inscricoes','nova'),{uid:'eventos',eventId:'e1'}));
    await assertFails(setDoc(doc(f,'inscricoes','forjada'),{uid:'admin',eventId:'e1'}));
});
test('revogação de módulo ou inativação vale nas próximas requisições',async()=>{
    const f=db('interno'), admin=db('admin');
    await assertSucceeds(getDoc(doc(f,'demandas','d1')));
    await assertSucceeds(updateDoc(doc(admin,'usuarios','interno'),{modulosPermitidos:[]}));
    await assertFails(getDoc(doc(f,'demandas','d1')));
    await assertSucceeds(updateDoc(doc(admin,'usuarios','interno'),{modulosPermitidos:['demandas'],ativo:false}));
    await assertFails(getDoc(doc(f,'demandas','d1')));
});
test('regra genérica não abre coleções desconhecidas nem sobrescreve regras específicas',async()=>{
    const f=db('admin');
    await assertFails(setDoc(doc(f,'desconhecida','id'),{publico:true}));
    await assertFails(deleteDoc(doc(f,'usuarios','outro')));
    await assertFails(updateDoc(doc(db('eventos'),'eventos','e1'),{inscritosCount:999}));
});


const avatar='data:image/jpeg;base64,QQ==';
const identidade=(uid,extra={})=>({uid,nome:uid,fotoPerfil:'',tipoUsuario:'interno',ativo:true,...extra});
test('usuário comum salva nome/foto, identificação mínima e contatos privados no mesmo lote',async()=>{
    const f=db('interno'),lote=writeBatch(f);
    lote.update(doc(f,'usuarios','interno'),{nome:'Nome novo',fotoPerfil:avatar,perfilAtualizadoEm:'2026-10-20'});
    lote.set(doc(f,'identidadesUsuarios','interno'),identidade('interno',{nome:'Nome novo',fotoPerfil:avatar}));
    lote.set(doc(f,'usuarios','interno','privado','perfil'),{telefone:'81',endereco:'Rua pessoal',atualizadoEm:'2026-10-20'});
    await assertSucceeds(lote.commit());
    const root=await getDoc(doc(f,'usuarios','interno'));assert.equal(root.data().nome,'Nome novo');assert.equal(root.data().telefone,undefined);assert.equal(root.data().perfil,'comum');
});
test('dados pessoais só podem ser lidos e alterados pelo titular ativo',async()=>{
    await assertSucceeds(getDoc(doc(db('interno'),'usuarios','interno','privado','perfil')));
    for(const uid of ['outro','externo','admin']){
        await assertFails(getDoc(doc(db(uid),'usuarios','interno','privado','perfil')));
        await assertFails(setDoc(doc(db(uid),'usuarios','interno','privado','perfil'),{telefone:'81',endereco:'Outro',atualizadoEm:'2026'}));
    }
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'usuarios','interno','privado','perfil')));
});
test('autoe edição não altera permissões, identidade de login nem publica endereço na raiz',async()=>{
    const f=db('interno');
    for(const patch of [{perfil:'admin'},{ativo:false},{tipoUsuario:'externo'},{email:'outro@example.invalid'},{uid:'outro'},{orgao:'Outro'},{grupos:['grupo']},{telefone:'81999'},{endereco:'Privado'}])await assertFails(updateDoc(doc(f,'usuarios','interno'),patch));
});
test('perfil privado rejeita campos desconhecidos, senhas e valores fora dos limites',async()=>{
    const f=db('interno'),ref=doc(f,'usuarios','interno','privado','perfil');
    for(const patch of [{telefone:'A'.repeat(41)},{endereco:'A'.repeat(401)},{senha:'nunca gravar'},{perfil:'admin'}])await assertFails(setDoc(ref,{telefone:'',endereco:'',atualizadoEm:'2026',...patch}));
    await assertFails(setDoc(doc(f,'usuarios','interno','privado','outro'),{telefone:'',endereco:'',atualizadoEm:'2026'}));
});
test('foto aceita somente JPEG limitado e permite remoção sem apagar perfil',async()=>{
    const f=db('interno');
    await assertSucceeds(updateDoc(doc(f,'usuarios','interno'),{fotoPerfil:avatar}));
    for(const foto of ['https://externo/foto.jpg','data:image/svg+xml;base64,QQ==','data:image/jpeg;base64,'+'A'.repeat(45000)])await assertFails(updateDoc(doc(f,'usuarios','interno'),{fotoPerfil:foto}));
    await assertSucceeds(updateDoc(doc(f,'usuarios','interno'),{fotoPerfil:''}));
    await assertFails(updateDoc(doc(db('admin'),'usuarios','interno'),{fotoPerfil:'javascript:alert(1)'}));
});
test('identidade compartilhada não permite personificar outro UID nem incluir dados privados',async()=>{
    const f=db('interno');
    await assertFails(setDoc(doc(f,'identidadesUsuarios','outro'),identidade('outro')));
    for(const extra of [{nome:'Outra pessoa'},{uid:'admin'},{tipoUsuario:'externo'},{ativo:false},{telefone:'8199'},{endereco:'Rua'},{fotoPerfil:avatar}])await assertFails(setDoc(doc(f,'identidadesUsuarios','interno'),identidade('interno',extra)));
});
test('externo com eventos lê identificações GRGD ativas e não contatos ou permissões do cadastro',async()=>{
    const f=db('eventos');
    const lista=await assertSucceeds(getDocs(query(collection(f,'identidadesUsuarios'),where('tipoUsuario','==','interno'),where('ativo','==',true))));
    assert.equal(lista.docs[0].id,'interno');assert.deepEqual(Object.keys(lista.docs[0].data()).sort(),['ativo','fotoPerfil','nome','tipoUsuario','uid']);
    await assertFails(getDoc(doc(f,'usuarios','interno')));
    await assertFails(getDoc(doc(f,'usuarios','interno','privado','perfil')));
    await assertFails(getDocs(collection(f,'identidadesUsuarios')));
    await assertFails(getDoc(doc(db('externo'),'identidadesUsuarios','interno')));
});
test('batch inválido não salva parcialmente nome, foto e dados pessoais',async()=>{
    const f=db('interno'),lote=writeBatch(f);
    lote.update(doc(f,'usuarios','interno'),{nome:'Não confirmado',fotoPerfil:avatar});
    lote.set(doc(f,'identidadesUsuarios','interno'),identidade('interno',{nome:'Não confirmado',fotoPerfil:avatar}));
    lote.set(doc(f,'usuarios','interno','privado','perfil'),{telefone:'81',endereco:'Rua',senha:'campo proibido',atualizadoEm:'2026'});
    await assertFails(lote.commit());
    const usuario=(await getDoc(doc(f,'usuarios','interno'))).data();assert.equal(usuario.nome,'interno');assert.equal(usuario.fotoPerfil,undefined);
    assert.equal((await getDoc(doc(f,'usuarios','interno','privado','perfil'))).data().endereco,'Endereço privado');
});
test('inativação sincroniza identificação e bloqueia dados pessoais do titular',async()=>{
    const f=db('admin'),lote=writeBatch(f);
    lote.update(doc(f,'usuarios','interno'),{ativo:false});lote.set(doc(f,'identidadesUsuarios','interno'),identidade('interno',{ativo:false}));
    await assertSucceeds(lote.commit());
    await assertFails(getDoc(doc(db('interno'),'usuarios','interno','privado','perfil')));
    await assertFails(getDoc(doc(db('outro'),'identidadesUsuarios','interno')));
});
test('administrador cria conta de perfil e identificação consistente em lote',async()=>{
    const f=db('admin'),lote=writeBatch(f);
    lote.set(doc(f,'usuarios','novo'),profile('novo'));lote.set(doc(f,'identidadesUsuarios','novo'),identidade('novo'));
    await assertSucceeds(lote.commit());
});

test('administrador exclui logicamente cadastro legado sem apagar histórico',async()=>{
    const f=db('admin');
    await assertSucceeds(excluirComLog(f,'legado'));
    await assertFails(getDoc(doc(db('legado'),'demandas','d1')));
    await assertFails(deleteDoc(doc(f,'usuarios','legado')));
});
test('exclusão não admite perfil ativo nem autoexclusão nem ação de consulta',async()=>{
    await assertFails(updateDoc(doc(db('admin'),'usuarios','outro'),{excluido:true}));
    await assertFails(updateDoc(doc(db('admin'),'usuarios','admin'),{ativo:false,excluido:true}));
    await assertFails(updateDoc(doc(db('interno'),'usuarios','outro'),{ativo:false,excluido:true}));
    await assertSucceeds(excluirComLog(db('admin'),'outro'));
    await assertFails(updateDoc(doc(db('admin'),'usuarios','outro'),{ativo:true}));
});

test('exclusão de usuário exige autenticação recente e auditoria atômica',async()=>{
    await assertFails(excluirComLog(db('admin',Math.floor(Date.now()/1000)-3600),'outro'));
    await assertFails(excluirComLog(db('admin',Math.floor(Date.now()/1000)+3600),'outro'));
    await assertFails(updateDoc(doc(db('admin'),'usuarios','outro'),{ativo:false,excluido:true}));
    assert.equal((await getDoc(doc(db('admin'),'usuarios','outro'))).data().ativo,true);
    await assertSucceeds(excluirComLog(db('admin'),'outro'));
});
test('auditoria rejeita autor ou horário forjado e reverte a exclusão inteira',async()=>{
    const f=db('admin');
    await assertFails(excluirComLog(f,'outro',{autorUid:'interno'}));
    await assertFails(excluirComLog(f,'outro',{autorNome:'Outra pessoa'}));
    await assertFails(excluirComLog(f,'outro',{criadoEm:new Date('2000-01-01')}));
    assert.equal((await getDoc(doc(f,'usuarios','outro'))).data().ativo,true);
    assert.equal((await getDocs(collection(f,'historicoAlteracoes'))).size,0);
});
test('histórico é somente leitura para administração e não pode ser editado ou apagado',async()=>{
    const f=db('admin');await assertSucceeds(excluirComLog(f,'outro'));
    const registro=(await getDocs(collection(f,'historicoAlteracoes'))).docs[0];
    await assertFails(updateDoc(registro.ref,{autorNome:'Apagar rastros'}));
    await assertFails(deleteDoc(registro.ref));
    await assertFails(getDocs(collection(db('interno'),'historicoAlteracoes')));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'historicoAlteracoes',registro.id)));
});
test('comum registra a própria edição mas não pode atribuir ação a outro usuário',async()=>{
    const f=db('interno'),data={autorUid:'interno',autorNome:'interno',criadoEm:serverTimestamp(),colecao:'usuarios',registroId:'interno',registroNome:'interno',acao:'editar',campos:['nome']};
    await assertSucceeds(setDoc(doc(collection(f,'historicoAlteracoes')),data));
    await assertFails(setDoc(doc(collection(f,'historicoAlteracoes')),{...data,registroId:'outro'}));
    await assertFails(setDoc(doc(collection(f,'historicoAlteracoes')),{...data,colecao:'demandas'}));
});
test('log inválido impede atualização de negócio no mesmo lote',async()=>{
    const f=db('admin'),lote=writeBatch(f);
    lote.update(doc(f,'demandas','d1'),{titulo:'Não confirmado'});
    lote.set(doc(collection(f,'historicoAlteracoes')),{autorUid:'falso'});
    await assertFails(lote.commit());assert.equal((await getDoc(doc(f,'demandas','d1'))).data().titulo,'Demanda interna');
});
test('exclusão física de negócio exige administrador com autenticação recente',async()=>{
    await assertFails(deleteDoc(doc(db('admin',0),'demandas','d1')));
    await assertFails(deleteDoc(doc(db('interno'),'demandas','d1')));
    await assertSucceeds(deleteDoc(doc(db('admin'),'demandas','d1')));
});
test('registro de troca de senha exige a própria conta com autenticação recente e não aceita valores secretos',async()=>{
    const data={autorUid:'interno',autorNome:'interno',criadoEm:serverTimestamp(),colecao:'autenticacao',registroId:'interno',registroNome:'Conta de acesso',acao:'alterar_senha',campos:['senha']};
    await assertSucceeds(setDoc(doc(collection(db('interno'),'historicoAlteracoes')),data));
    await assertFails(setDoc(doc(collection(db('interno',0),'historicoAlteracoes')),data));
    await assertFails(setDoc(doc(collection(db('interno'),'historicoAlteracoes')),{...data,registroId:'outro'}));
    await assertFails(setDoc(doc(collection(db('interno'),'historicoAlteracoes')),{...data,senha:'valor-secreto'}));
});

test('NSI lê somente o órgão e os setores aprovados, inclusive por ID e consulta',async()=>{
    await seedInstitutional();const f=db('titular');
    await assertSucceeds(getDoc(doc(f,'orgaos','orgao-a')));
    await assertFails(getDoc(doc(f,'orgaos','orgao-b')));
    await assertSucceeds(getDoc(doc(f,'colaboradores','a1')));
    await assertFails(getDoc(doc(f,'colaboradores','a2')));
    await assertFails(getDoc(doc(f,'colaboradores','b1')));
    await assertFails(getDocs(collection(f,'colaboradores')));
    const q=query(collection(f,'colaboradores'),where('orgaoId','==','orgao-a'),where('setorId','in',['a1']));
    const result=await assertSucceeds(getDocs(q));assert.equal(result.size,1);
    await assertFails(getDocs(query(collection(f,'colaboradores'),where('orgaoId','==','orgao-a'))));
    await assertFails(getDocs(collection(f,'usuarios')));
});
test('inscrição institucional distingue participante e operador e não usa UID para escapar do escopo',async()=>{
    await seedInstitutional();const f=db('titular');
    await assertSucceeds(getDoc(doc(f,'inscricoes','a1')));
    await assertFails(getDoc(doc(f,'inscricoes','b1')));
    await assertFails(setDoc(doc(f,'inscricoes','nova'),{uid:'titular',eventId:'e1'}));
    await assertFails(setDoc(doc(f,'colaboradores','novo'),{nome:'Novo',orgaoId:'orgao-a',setorId:'a1'}));
});
test('autenticação não supera ativação pendente, suspensão, expiração ou revisão vencida',async()=>{
    await seedInstitutional();
    for(const extra of [{situacao:'pendente'},{situacao:'suspenso'},{fim:Date.now()-1},{revisao:Date.now()-1}]){
        await env.withSecurityRulesDisabled(ctx=>updateDoc(doc(ctx.firestore(),'usuarios','titular'),{acessoInstitucional:institutionalAccess(extra)}));
        await assertFails(getDoc(doc(db('titular'),'colaboradores','a1')));
        await assertFails(getDoc(doc(db('titular'),'eventos','e1')));
    }
});
test('substituto fica limitado ao titular e perde acesso quando o titular é suspenso',async()=>{
    await seedInstitutional();const f=db('sub');
    await assertSucceeds(getDoc(doc(f,'colaboradores','a1')));
    await assertFails(getDoc(doc(f,'colaboradores','a2')));
    await env.withSecurityRulesDisabled(ctx=>updateDoc(doc(ctx.firestore(),'usuarios','titular'),{'acessoInstitucional.situacao':'suspenso'}));
    await assertFails(getDoc(doc(f,'colaboradores','a1')));
    await assertFails(getDoc(doc(f,'eventos','e1')));
});
test('auditoria é leitura no escopo, sem escrita de logs, acesso a participantes ou concessão de privilégios',async()=>{
    await seedInstitutional();const f=db('auditor');
    await assertSucceeds(getDoc(doc(f,'historicoAlteracoes','a1')));
    await assertFails(getDoc(doc(f,'historicoAlteracoes','b1')));
    await assertFails(getDocs(collection(f,'historicoAlteracoes')));
    await assertSucceeds(getDocs(query(collection(f,'historicoAlteracoes'),where('orgaoId','==','orgao-a'),where('setorId','in',['a1']))));
    await assertSucceeds(getDoc(doc(f,'inscricoes','a1')));
    await assertFails(getDoc(doc(f,'colaboradores','a1')));
    await assertFails(setDoc(doc(f,'historicoAlteracoes','forjado'),{orgaoId:'orgao-a',setorId:'a1',autorUid:'auditor',acao:'editar'}));
    await assertFails(updateDoc(doc(f,'usuarios','auditor'),{perfil:'admin'}));
});
test('GRGD pode editar evento autorizado sem receber criação, exclusão, usuários ou outros módulos',async()=>{
    await seedInstitutional();const f=db('operador');
    await assertSucceeds(getDoc(doc(f,'eventos','restrito')));
    await assertSucceeds(updateDoc(doc(f,'eventos','e1'),{titulo:'Atualizado pela GRGD'}));
    await assertFails(setDoc(doc(f,'eventos','novo'),{titulo:'Não permitido'}));
    await assertFails(deleteDoc(doc(f,'eventos','e1')));
    await assertFails(updateDoc(doc(f,'demandas','d1'),{titulo:'Não permitido'}));
    await assertFails(updateDoc(doc(f,'usuarios','outro'),{perfil:'admin'}));
});
test('administrador registra vínculo com órgão real, evidências opcionais e metadados do autor',async()=>{
    await seedInstitutional();const f=db('admin');
    const v=institutionalAccess({registradoEm:serverTimestamp()});
    await assertSucceeds(setDoc(doc(f,'usuarios','novo-nsi'),profile('novo-nsi',{tipoUsuario:'externo',modulosPermitidos:[],acessoInstitucional:v})));
    for(const extra of [{aprovacaoAutoridade:{responsavel:42,referencia:''}},{aprovacaoGrgd:{responsavel:'Nome',referencia:'x'.repeat(301)}},{orgaoId:'inexistente'},{setoresIds:['b1']},{acoes:['usuarios.editar']},{registradoPorUid:'outro'}]){
        await assertFails(setDoc(doc(f,'usuarios','novo-negado'),profile('novo-negado',{tipoUsuario:'externo',modulosPermitidos:[],acessoInstitucional:{...v,...extra}})));
    }
    await assertFails(updateDoc(doc(f,'usuarios','novo-nsi'),{acessoInstitucional:null,modulosPermitidos:['eventos']}));
    await assertFails(updateDoc(doc(db('novo-nsi'),'usuarios','novo-nsi'),{'acessoInstitucional.acoes':['usuarios.editar']}));
});
test('aprovação de substituto não pode ampliar setores, ações, órgão ou validade do titular',async()=>{
    const titular=await seedInstitutional();const f=db('admin');
    const v=institutionalAccess({papel:'substituto',titularUid:'titular',fim:titular.acessoInstitucional.fim-1000,revisao:titular.acessoInstitucional.revisao-1000,registradoEm:serverTimestamp()});
    await assertSucceeds(setDoc(doc(f,'usuarios','sub-novo'),profile('sub-novo',{tipoUsuario:'externo',modulosPermitidos:[],acessoInstitucional:v})));
    for(const extra of [{setoresIds:[]},{setoresIds:['a2']},{orgaoId:'orgao-b',setoresIds:[]},{fim:titular.acessoInstitucional.fim+1000},{inicio:titular.acessoInstitucional.inicio-1000},{revisao:titular.acessoInstitucional.revisao+1000},{acoes:['participantes.editar']}]){
        await assertFails(setDoc(doc(f,'usuarios','sub-negado'),profile('sub-negado',{tipoUsuario:'externo',modulosPermitidos:[],acessoInstitucional:{...v,...extra}})));
    }
});

test('cadastro com cinco setores e identidade pública é confirmado junto da auditoria',async()=>{
    await seedInstitutional();
    await env.withSecurityRulesDisabled(async ctx=>{const f=ctx.firestore();for(const id of ['a3','a4','a5'])await setDoc(doc(f,'setores',id),{nome:id,orgaoId:'orgao-a',ativo:true});});
    const f=db('admin'),batch=writeBatch(f),uid='nsi-cinco';
    const pessoa=profile(uid,{tipoUsuario:'externo',modulosPermitidos:[],acessoInstitucional:institutionalAccess({setoresIds:['a1','a2','a3','a4','a5'],registradoEm:serverTimestamp()})});
    batch.set(doc(f,'usuarios',uid),pessoa);
    batch.set(doc(f,'identidadesUsuarios',uid),{uid,nome:uid,fotoPerfil:'',tipoUsuario:'externo',ativo:true});
    batch.set(doc(f,'historicoAlteracoes','aprovacao-cinco'),{autorUid:'admin',autorNome:'admin',criadoEm:serverTimestamp(),colecao:'usuarios',registroId:uid,registroNome:uid,acao:'criar',campos:['acessoInstitucional']});
    await assertSucceeds(batch.commit());
});

test('NSI e auditoria não recebem o diretório interno de identidades da GRGD',async()=>{
    await seedInstitutional();
    for(const uid of ['titular','auditor']){
        await assertFails(getDoc(doc(db(uid),'identidadesUsuarios','outro')));
        await assertFails(getDocs(query(collection(db(uid),'identidadesUsuarios'),where('tipoUsuario','==','interno'),where('ativo','==',true))));
    }
    await assertSucceeds(getDoc(doc(db('operador'),'identidadesUsuarios','outro')));
});

test('escopo da auditoria corresponde ao registro alterado e não aceita atribuição a outro órgão',async()=>{
    await seedInstitutional();const f=db('admin');
    const log={autorUid:'admin',autorNome:'admin',criadoEm:serverTimestamp(),colecao:'colaboradores',registroId:'a1',registroNome:'Pessoa fictícia',acao:'editar',campos:['nome'],orgaoId:'orgao-a',setorId:'a1'};
    // Usa um evento de negócio com escopo explícito e coleção já auditada.
    await env.withSecurityRulesDisabled(ctx=>setDoc(doc(ctx.firestore(),'eventos','com-escopo'),{titulo:'Evento fictício',orgaoId:'orgao-a',setorId:'a1'}));
    log.colecao='eventos';log.registroId='com-escopo';
    await assertSucceeds(setDoc(doc(f,'historicoAlteracoes','correto'),log));
    await assertFails(setDoc(doc(f,'historicoAlteracoes','outro-orgao'),{...log,orgaoId:'orgao-b'}));
    await assertFails(setDoc(doc(f,'historicoAlteracoes','outro-setor'),{...log,setorId:'a2'}));
});

test('edição GRGD e auditoria com escopo são confirmadas na mesma transação de negócio',async()=>{
    await seedInstitutional();
    await env.withSecurityRulesDisabled(ctx=>updateDoc(doc(ctx.firestore(),'eventos','e1'),{orgaoId:'orgao-a',setorId:'a1'}));
    const f=db('operador'),batch=writeBatch(f);
    batch.update(doc(f,'eventos','e1'),{titulo:'Edição com autoria individual'});
    batch.set(doc(f,'historicoAlteracoes','edicao-grgd'),{autorUid:'operador',autorNome:'operador',criadoEm:serverTimestamp(),colecao:'eventos',registroId:'e1',registroNome:'Evento fictício',acao:'editar',campos:['titulo'],orgaoId:'orgao-a',setorId:'a1'});
    await assertSucceeds(batch.commit());
});

test('inscrição legada não aceita órgão, setor ou participante arbitrário e mantém criação com histórico próprio',async()=>{
    await seedInstitutional();const f=db('eventos'),base={uid:'eventos',eventId:'e1',nome:'eventos',email:'eventos@example.invalid',criadoEm:'2026-10-22'};
    for(const extra of [{orgaoId:'orgao-a'},{setorId:'a1'},{participanteId:'outro'},{operadorUid:'titular'}])await assertFails(setDoc(doc(f,'inscricoes','forjada'),{...base,...extra}));
    const batch=writeBatch(f);batch.set(doc(f,'inscricoes','propria-nova'),base);
    batch.set(doc(f,'historicoAlteracoes','inscricao-propria'),{autorUid:'eventos',autorNome:'eventos',criadoEm:serverTimestamp(),colecao:'inscricoes',registroId:'propria-nova',registroNome:'Minha inscrição',acao:'criar',campos:['eventId','uid','nome','email','criadoEm']});
    await assertSucceeds(batch.commit());
});
test('histórico de inscrição recusa outro titular e os papéis institucionais ainda sem escrita por representação',async()=>{
    await seedInstitutional();
    const log=uid=>({autorUid:uid,autorNome:uid,criadoEm:serverTimestamp(),colecao:'inscricoes',registroId:'a1',registroNome:'Registro fictício',acao:'criar',campos:['eventId']});
    await assertFails(setDoc(doc(db('eventos'),'historicoAlteracoes','outro-titular'),log('eventos')));
    await assertFails(setDoc(doc(db('titular'),'historicoAlteracoes','sem-fluxo'),log('titular')));
    await assertSucceeds(setDoc(doc(db('admin'),'historicoAlteracoes','administrativo'),log('admin')));
});

// Lote institucional: todos os casos usam somente o emulador demo.
const hashLote2=s=>require('node:crypto').createHash('sha256').update(s).digest('hex');
const pessoaLote2=(email='pessoa@example.invalid',extra={})=>({nome:'Pessoa fictícia',emailInstitucional:email,orgaoId:'orgao-a',setorId:'a1',telefone:'',cargo:'Analista',ativo:true,criadoEm:new Date(),criadoPorUid:'titular',atualizadoEm:new Date(),atualizadoPorUid:'titular',ultimaAuditoriaId:'semente',...extra});
const idPessoaLote2=p=>hashLote2(p.orgaoId+'|'+p.emailInstitucional);
const idInscricaoLote2=(eventId,p)=>eventId+'__'+hashLote2(p.emailInstitucional);
async function seedLote2(extraEvento={}) {
    const titular=await seedInstitutional();
    const acoes=['orgao.consultar','participantes.consultar','participantes.cadastrar','participantes.editar','eventos.consultar','inscricoes.consultar','inscricoes.criar','inscricoes.cancelar','comprovantes.consultar'];
    const p=pessoaLote2(),p2=pessoaLote2('segunda@example.invalid'),outro=pessoaLote2('outra@example.invalid',{orgaoId:'orgao-b',setorId:'b1'});
    const evento={titulo:'Encontro institucional fictício',dataInicio:'2099-01-01',eventoPublico:false,modeloInscricao:'institucional-v1',inscricoesAbertas:true,inscricaoInicio:Date.now()-60000,inscricaoFim:Date.now()+3600000,limiteVagas:1,inscritosCount:0,orgaosElegiveis:['orgao-a'],status:'Confirmado',...extraEvento};
    await env.withSecurityRulesDisabled(async ctx=>{
        const f=ctx.firestore();
        await updateDoc(doc(f,'usuarios','titular'),{'acessoInstitucional.acoes':acoes,'acessoInstitucional.operacoesVersao':'v1'});
        await updateDoc(doc(f,'usuarios','sub'),{'acessoInstitucional.acoes':acoes,'acessoInstitucional.operacoesVersao':'v1'});
        await setDoc(doc(f,'usuarios','gestorB'),profile('gestorB',{tipoUsuario:'externo',modulosPermitidos:[],acessoInstitucional:institutionalAccess({orgaoId:'orgao-b',setoresIds:['b1'],acoes,operacoesVersao:'v1'})}));
        await Promise.all([setDoc(doc(f,'eventos','institucional'),evento),...[p,p2,outro].map(p=>setDoc(doc(f,'colaboradores',idPessoaLote2(p)),p))]);
    });
    return {p,p2,outro,evento,titular};
}
function auditoriaLote2(uid,col,id,d,acao) {return {autorUid:uid,autorNome:uid,criadoEm:serverTimestamp(),colecao:col,registroId:id,registroNome:d.nome||d.participanteNome||'Fictício',acao,campos:['situacao'],orgaoId:d.orgaoId,setorId:d.setorId};}
async function gravarPessoaLote2(uid,p,extra={}) {
    const f=db(uid),id=extra.id||idPessoaLote2(p),ref=doc(f,'colaboradores',id),log=doc(collection(f,'historicoAlteracoes')),b=writeBatch(f);
    const dados={...p,criadoEm:serverTimestamp(),criadoPorUid:uid,atualizadoEm:serverTimestamp(),atualizadoPorUid:uid,ultimaAuditoriaId:log.id,...extra.dados};
    b.set(ref,dados);if(!extra.semLog)b.set(log,{...auditoriaLote2(uid,'colaboradores',id,dados,'criar'),campos:extra.campos||Object.keys(p).filter(k=>!['criadoEm','criadoPorUid','atualizadoEm','atualizadoPorUid','ultimaAuditoriaId'].includes(k))});return b.commit();
}
async function inscreverLote2(uid,p,{cancelar=false,semLog=false,semContador=false,dados={},delta,protocolo,id,acao,eventId='institucional'}={}) {
    const f=db(uid),regId=id||idInscricaoLote2(eventId,p),ref=doc(f,'inscricoes',regId),evt=doc(f,'eventos',eventId),log=doc(collection(f,'historicoAlteracoes'));
    return require('firebase/firestore').runTransaction(f,async t=>{
        const [eSnap,iSnap]=await Promise.all([cancelar?Promise.resolve(null):t.get(evt),t.get(ref)]),e=eSnap?.data(),antes=iSnap.exists()?iSnap.data():null;
        if(!cancelar&&e.inscritosCount>=e.limiteVagas)throw new Error('lotado');
        if(!cancelar&&antes?.situacao==='confirmada')throw new Error('duplicada');
        const d=cancelar?{...antes,situacao:'cancelada'}:{modeloInscricao:'institucional-v1',eventId,participanteId:idPessoaLote2(p),emailInstitucional:p.emailInstitucional,participanteNome:p.nome,orgaoId:p.orgaoId,setorId:p.setorId,eventoTitulo:e.titulo,eventoData:e.dataInicio,protocolo:protocolo||regId,situacao:'confirmada',criadoEm:antes?.criadoEm||serverTimestamp(),criadoPorUid:antes?.criadoPorUid||uid};
        Object.assign(d,{atualizadoEm:serverTimestamp(),atualizadoPorUid:uid,ultimaAuditoriaId:log.id},dados);
        t.set(ref,d);if(!semContador)t.update(evt,{inscritosCount:cancelar?require('firebase/firestore').increment(delta??-1):e.inscritosCount+(delta??1),ultimaInscricaoId:regId});
        if(!semLog)t.set(log,auditoriaLote2(uid,'inscricoes',regId,d,acao||(cancelar?'cancelar_inscricao':'inscrever')));
    });
}
test('gestor cadastra colaborador sem conta Auth com identidade determinística e histórico atômico',async()=>{
    await seedLote2();const p=pessoaLote2('nova@example.invalid');await assertSucceeds(gravarPessoaLote2('titular',p));
    const snap=await getDoc(doc(db('titular'),'colaboradores',idPessoaLote2(p)));assert.equal(snap.data().criadoPorUid,'titular');
    await assertFails(gravarPessoaLote2('titular',p));
});
test('cadastro recusa órgão/setor de fora do escopo, identidade arbitrária e ausência de histórico',async()=>{
    await seedLote2();const p=pessoaLote2('nova@example.invalid');
    await assertFails(gravarPessoaLote2('titular',{...p,orgaoId:'orgao-b',setorId:'b1'}));
    await assertFails(gravarPessoaLote2('titular',{...p,setorId:'a2'}));
    await assertFails(gravarPessoaLote2('titular',p,{id:'id-livre'}));
    await assertFails(gravarPessoaLote2('titular',p,{semLog:true}));
    await assertFails(gravarPessoaLote2('titular',p,{campos:['senha']}));
    await assertFails(gravarPessoaLote2('titular',p,{dados:{emailInstitucional:'NOVA@example.invalid'}}));
});
test('auditoria e usuário legado não cadastram colaboradores, mesmo enviando vínculo no payload',async()=>{
    await seedLote2();for(const uid of ['auditor','eventos'])await assertFails(gravarPessoaLote2(uid,pessoaLote2('nova@example.invalid')));
});
test('editar colaborador preserva órgão, setor, e-mail e criação; permite inativação com autoria',async()=>{
    const {p}=await seedLote2();const f=db('titular'),id=idPessoaLote2(p),log=doc(collection(f,'historicoAlteracoes'));
    const change=patch=>{const b=writeBatch(f),d={...p,...patch,atualizadoEm:serverTimestamp(),atualizadoPorUid:'titular',ultimaAuditoriaId:log.id};b.set(doc(f,'colaboradores',id),d);b.set(log,{...auditoriaLote2('titular','colaboradores',id,d,'editar'),campos:Object.keys(patch).filter(k=>!['criadoEm','criadoPorUid','atualizadoEm','atualizadoPorUid','ultimaAuditoriaId'].includes(k))});return b.commit();};
    await assertFails(change({setorId:'a2'}));await assertFails(change({criadoPorUid:'outra-conta'}));await assertSucceeds(change({nome:'Nome corrigido',ativo:false}));
    await assertFails(deleteDoc(doc(f,'colaboradores',id)));
});
test('gestor inscreve beneficiário sem login e consome vaga com histórico; substituto pode cancelar',async()=>{
    const {p}=await seedLote2();await assertSucceeds(inscreverLote2('titular',p));
    const id=idInscricaoLote2('institucional',p),r=await getDoc(doc(db('titular'),'inscricoes',id));assert.equal(r.data().participanteNome,p.nome);assert.equal(r.data().criadoPorUid,'titular');assert.equal(r.data().uid,undefined);
    await assertSucceeds(inscreverLote2('sub',p,{cancelar:true}));assert.equal((await getDoc(doc(db('admin'),'eventos','institucional'))).data().inscritosCount,0);
    assert.equal((await getDoc(doc(db('titular'),'inscricoes',id))).data().situacao,'cancelada');
    await assertSucceeds(inscreverLote2('titular',p));assert.equal((await getDoc(doc(db('admin'),'eventos','institucional'))).data().inscritosCount,1);
});
test('inscrição recusa contador ausente/forjado, histórico ausente e protocolo diferente do ID',async()=>{
    const {p}=await seedLote2();for(const opts of [{semLog:true},{semContador:true},{delta:0},{protocolo:'protocolo-forjado'}])await assertFails(inscreverLote2('titular',p,opts));
    await assertSucceeds(inscreverLote2('titular',p));
});
test('dados do beneficiário e do evento não podem ser falsificados na inscrição',async()=>{
    const {p}=await seedLote2();for(const dados of [{participanteNome:'Outro nome'},{orgaoId:'orgao-b'},{setorId:'a2'},{participanteId:'outro'},{eventoTitulo:'Evento falso'},{eventoData:'2020-01-01'},{criadoPorUid:'sub'}])await assertFails(inscreverLote2('titular',p,{dados}));
});
test('órgão sem elegibilidade, período fechado e colaborador inativo não recebem inscrição',async()=>{
    const {p,outro}=await seedLote2();await assertFails(getDoc(doc(db('gestorB'),'eventos','institucional')));
    await assertFails(inscreverLote2('gestorB',outro));
    for(const patch of [{inscricoesAbertas:false},{inscricaoInicio:Date.now()+3600000},{inscricaoFim:Date.now()-1},{status:'Cancelado'},{status:'Realizado'}]){
        await seedLote2(patch);await assertFails(inscreverLote2('titular',p));
    }
    await seedLote2();await env.withSecurityRulesDisabled(c=>updateDoc(doc(c.firestore(),'colaboradores',idPessoaLote2(p)),{ativo:false}));await assertFails(inscreverLote2('titular',p));
});
test('evento privado é consultado por elegibilidade e consultas gerais continuam bloqueadas',async()=>{
    await seedLote2();const f=db('titular');await assertSucceeds(getDocs(query(collection(f,'eventos'),where('orgaosElegiveis','array-contains','orgao-a'))));
    await assertFails(getDocs(collection(f,'eventos')));await assertFails(getDoc(doc(db('gestorB'),'colaboradores',idPessoaLote2(pessoaLote2()))));
});
test('duas inscrições simultâneas disputando a última vaga confirmam apenas uma',async()=>{
    const {p,p2}=await seedLote2();const outcomes=await Promise.allSettled([inscreverLote2('titular',p),inscreverLote2('sub',p2)]);
    assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);
    assert.equal((await getDoc(doc(db('admin'),'eventos','institucional'))).data().inscritosCount,1);
    const rows=await getDocs(query(collection(db('admin'),'inscricoes'),where('eventId','==','institucional')));assert.equal(rows.size,1);
});
test('cancelamento repetido e exclusão física não liberam vagas indevidas',async()=>{
    const {p}=await seedLote2();await inscreverLote2('titular',p);await inscreverLote2('titular',p,{cancelar:true});
    await assertFails(inscreverLote2('titular',p,{cancelar:true}));const id=idInscricaoLote2('institucional',p);
    await assertFails(deleteDoc(doc(db('titular'),'inscricoes',id)));await assertFails(deleteDoc(doc(db('admin'),'inscricoes',id)));
    await assertFails(updateDoc(doc(db('titular'),'eventos','institucional'),{inscritosCount:0,ultimaInscricaoId:id}));
});
test('substituição suspensa ou vencida bloqueia inscrição e cancelamento no servidor',async()=>{
    const {p}=await seedLote2();await inscreverLote2('titular',p);await env.withSecurityRulesDisabled(c=>updateDoc(doc(c.firestore(),'usuarios','titular'),{'acessoInstitucional.situacao':'suspenso'}));
    await assertFails(inscreverLote2('sub',p,{cancelar:true}));await assertFails(gravarPessoaLote2('sub',pessoaLote2('nova@example.invalid')));
});
test('comprovante consulta apenas registros do escopo; auditoria permanece sem escrita',async()=>{
    const {p,outro}=await seedLote2({orgaosElegiveis:['orgao-a','orgao-b'],limiteVagas:2});await inscreverLote2('titular',p);await inscreverLote2('gestorB',outro);
    await assertSucceeds(getDoc(doc(db('titular'),'inscricoes',idInscricaoLote2('institucional',p))));
    await assertFails(getDoc(doc(db('titular'),'inscricoes',idInscricaoLote2('institucional',outro))));
    await assertSucceeds(getDoc(doc(db('auditor'),'inscricoes',idInscricaoLote2('institucional',p))));await assertFails(inscreverLote2('auditor',p,{cancelar:true}));
});
test('canal legado não inscreve em evento institucional e continua funcionando em evento anterior',async()=>{
    await seedLote2();const f=db('eventos'),base={uid:'eventos',nome:'eventos',email:'eventos@example.invalid',criadoEm:'2026-10-22'};
    await assertFails(setDoc(doc(f,'inscricoes','atalho'),{...base,eventId:'institucional'}));await assertSucceeds(setDoc(doc(f,'inscricoes','legada-preservada'),{...base,eventId:'e1'}));
});
test('contador não é editável manualmente e modelo institucional não pode ser ativado em evento legado',async()=>{
    const {evento,p}=await seedLote2();const f=db('admin');await assertFails(updateDoc(doc(f,'eventos','institucional'),{inscritosCount:1}));
    await assertFails(updateDoc(doc(f,'eventos','e1'),evento));await assertSucceeds(setDoc(doc(f,'eventos','novo-institucional'),evento));
    await assertFails(setDoc(doc(f,'eventos','novo-contador-falso'),{...evento,inscritosCount:1}));await assertFails(deleteDoc(doc(f,'eventos','institucional')));
    await inscreverLote2('titular',p);await assertFails(updateDoc(doc(f,'eventos','institucional'),{limiteVagas:0}));await assertSucceeds(updateDoc(doc(f,'eventos','institucional'),{inscricoesAbertas:false}));
});
test('histórico institucional isolado, adulterado ou com autoria falsa é negado',async()=>{
    const {p}=await seedLote2();const f=db('titular'),id=idInscricaoLote2('institucional',p);
    await assertFails(setDoc(doc(f,'historicoAlteracoes','solto'),auditoriaLote2('titular','inscricoes',id,p,'inscrever')));
    await assertFails(inscreverLote2('titular',p,{acao:'cancelar_inscricao'}));await inscreverLote2('titular',p);
    const r=await getDoc(doc(f,'inscricoes',id));await assertFails(updateDoc(doc(db('admin'),'historicoAlteracoes',r.data().ultimaAuditoriaId),{autorUid:'outro'}));
    await assertFails(setDoc(doc(db('admin'),'historicoAlteracoes','cancelamento-sem-transicao'),auditoriaLote2('admin','inscricoes',id,r.data(),'cancelar_inscricao')));
});

test('vínculo anterior sem liberação expressa não ganha escrita automaticamente',async()=>{
    const {p}=await seedLote2();await env.withSecurityRulesDisabled(c=>updateDoc(doc(c.firestore(),'usuarios','titular'),{'acessoInstitucional.operacoesVersao':''}));
    await assertFails(gravarPessoaLote2('titular',pessoaLote2('nova@example.invalid')));await assertFails(inscreverLote2('titular',p));
    // O substituto não pode usar a versão operacional que não está habilitada no titular.
    await assertFails(inscreverLote2('sub',p));
});
test('substituto liberado com cinco setores cadastra e inscreve com autoria própria',async()=>{
    const {p}=await seedLote2();
    await env.withSecurityRulesDisabled(async c=>{const f=c.firestore();await Promise.all(['a3','a4','a5'].map(id=>setDoc(doc(f,'setores',id),{nome:id,orgaoId:'orgao-a',ativo:true})));for(const uid of ['titular','sub'])await updateDoc(doc(f,'usuarios',uid),{'acessoInstitucional.setoresIds':['a1','a2','a3','a4','a5']});});
    await assertSucceeds(gravarPessoaLote2('sub',pessoaLote2('sub-cadastro@example.invalid')));await assertSucceeds(inscreverLote2('sub',p));
    assert.equal((await getDoc(doc(db('admin'),'inscricoes',idInscricaoLote2('institucional',p)))).data().criadoPorUid,'sub');
});
test('cancelar continua permitido após retirada da elegibilidade e encerramento das inscrições',async()=>{
    const {p}=await seedLote2();await inscreverLote2('titular',p);
    await env.withSecurityRulesDisabled(c=>updateDoc(doc(c.firestore(),'eventos','institucional'),{orgaosElegiveis:['orgao-b'],inscricoesAbertas:false}));
    await assertFails(getDoc(doc(db('titular'),'eventos','institucional')));
    await assertSucceeds(inscreverLote2('titular',p,{cancelar:true}));
    assert.equal((await getDoc(doc(db('admin'),'eventos','institucional'))).data().inscritosCount,0);
});
test('administrador cancela inscrição quando o vínculo do gestor foi suspenso',async()=>{
    const {p}=await seedLote2();await inscreverLote2('titular',p);
    await env.withSecurityRulesDisabled(c=>updateDoc(doc(c.firestore(),'usuarios','titular'),{'acessoInstitucional.situacao':'suspenso'}));
    await assertSucceeds(inscreverLote2('admin',p,{cancelar:true}));
});
test('mesmo e-mail em dois órgãos não gera duas inscrições no mesmo evento',async()=>{
    const {p}=await seedLote2({orgaosElegiveis:['orgao-a','orgao-b'],limiteVagas:3});
    const b={...p,orgaoId:'orgao-b',setorId:'b1'};await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'colaboradores',idPessoaLote2(b)),b));
    await inscreverLote2('titular',p);await assertFails(inscreverLote2('gestorB',b));
    assert.equal((await getDoc(doc(db('admin'),'eventos','institucional'))).data().inscritosCount,1);
});


test('administrador ativa vínculo sem responsáveis ou referências; NSI não pode se autoativar',async()=>{
    await seedInstitutional();const f=db('admin');
    for(const omitir of [false,true]){
        const v=institutionalAccess({registradoEm:serverTimestamp(),aprovacaoGrgd:{responsavel:'',referencia:''},aprovacaoAutoridade:{responsavel:'',referencia:''}});
        if(omitir){delete v.aprovacaoGrgd;delete v.aprovacaoAutoridade;}
        const uid=omitir?'nsi-sem-mapas':'nsi-sem-ref';
        await assertSucceeds(setDoc(doc(f,'usuarios',uid),profile(uid,{tipoUsuario:'externo',modulosPermitidos:[],acessoInstitucional:v})));
        await assertSucceeds(getDoc(doc(db(uid),'orgaos','orgao-a')));
        await assertSucceeds(getDocs(query(collection(db(uid),'setores'),where('orgaoId','==','orgao-a'))));
        await assertFails(getDoc(doc(db(uid),'orgaos','orgao-b')));
    }
    await assertFails(updateDoc(doc(db('nsi-sem-ref'),'usuarios','nsi-sem-ref'),{'acessoInstitucional.setoresIds':[]}));
    await env.withSecurityRulesDisabled(c=>updateDoc(doc(c.firestore(),'usuarios','nsi-sem-ref'),{'acessoInstitucional.situacao':'pendente'}));
    await assertFails(updateDoc(doc(db('nsi-sem-ref'),'usuarios','nsi-sem-ref'),{'acessoInstitucional.situacao':'aprovado'}));
    await assertFails(getDoc(doc(db('nsi-sem-ref'),'orgaos','orgao-a')));
});
test('portal sem referências consulta fontes de eventos e setores, preservando órgão elegível',async()=>{
    await seedLote2();
    await env.withSecurityRulesDisabled(async c=>{
        const f=c.firestore();await updateDoc(doc(f,'usuarios','titular'),{'acessoInstitucional.aprovacaoGrgd':{},'acessoInstitucional.aprovacaoAutoridade':{}});
        await setDoc(doc(f,'eventos','publico-hoje'),{titulo:'Público',eventoPublico:true,dataInicio:new Date().toISOString().slice(0,10)});
        await setDoc(doc(f,'eventos','outro-orgao'),{titulo:'Privado B',eventoPublico:false,orgaosElegiveis:['orgao-b']});
    });
    const f=db('titular');
    const eventos=await assertSucceeds(getDocs(query(collection(f,'eventos'),where('orgaosElegiveis','array-contains','orgao-a'))));assert.equal(eventos.size,1);
    await assertSucceeds(getDocs(query(collection(f,'eventos'),where('eventoPublico','==',true))));
    await assertFails(getDocs(query(collection(f,'eventos'),where('orgaosElegiveis','array-contains','orgao-b'))));
    await assertSucceeds(getDocs(query(collection(f,'setores'),where('orgaoId','==','orgao-a'))));
    await assertFails(getDocs(query(collection(f,'setores'),where('orgaoId','==','orgao-b'))));
});

function contatoProjetado(p){return {nome:p.nome,emailInstitucional:p.emailInstitucional,telefone:p.telefone,cargo:p.cargo,orgaoId:p.orgaoId,setorId:p.setorId,ativo:p.ativo,validadeCadastro:p.validadeCadastro??null,funcoesContato:p.funcoesContato||[],atualizadoEm:p.atualizadoEm};}
async function atualizarPessoaV012(uid,p,patch,{projetar=true,projecaoExtra={},somentePessoa=false}={}){
    const f=db(uid),id=idPessoaLote2(p),log=doc(collection(f,'historicoAlteracoes')),b=writeBatch(f);
    const novo={...p,...patch,atualizadoEm:serverTimestamp(),atualizadoPorUid:uid,ultimaAuditoriaId:log.id};
    b.set(doc(f,'colaboradores',id),novo);if(projetar)b.set(doc(f,'contatosColaboradores',id),{...contatoProjetado(novo),...projecaoExtra});
    if(!somentePessoa)b.set(log,{...auditoriaLote2(uid,'colaboradores',id,novo,'editar'),campos:Object.keys(patch)});
    return b.commit();
}
async function vincularPessoaV012(p,usuarioId,{espelhar=true,logUsuario=true}={}){
    const f=db('admin'),id=idPessoaLote2(p),log=doc(collection(f,'historicoAlteracoes')),b=writeBatch(f),novo={...p,usuarioUid:usuarioId,atualizadoEm:serverTimestamp(),atualizadoPorUid:'admin',ultimaAuditoriaId:log.id};
    b.set(doc(f,'colaboradores',id),novo);b.set(doc(f,'contatosColaboradores',id),contatoProjetado(novo));b.set(log,{...auditoriaLote2('admin','colaboradores',id,novo,'editar'),campos:['usuarioUid']});
    if(espelhar){const lu=doc(collection(f,'historicoAlteracoes'));b.update(doc(f,'usuarios',usuarioId),{colaboradorId:id,ultimaAuditoriaId:lu.id});if(logUsuario)b.set(lu,{autorUid:'admin',autorNome:'admin',criadoEm:serverTimestamp(),colecao:'usuarios',registroId:usuarioId,registroNome:usuarioId,acao:'editar',campos:['colaboradorId']});}
    return b.commit();
}
test('gestor atualiza funções e revisão com projeção correspondente; admin consulta todos os colaboradores',async()=>{
    const {p}=await seedLote2();await assertSucceeds(atualizarPessoaV012('titular',p,{funcoesContato:['nsi','sei'],validadeCadastro:Date.now()+86400000}));
    await assertSucceeds(getDocs(collection(db('admin'),'colaboradores')));
    await assertFails(getDocs(collection(db('titular'),'colaboradores')));
    await assertFails(atualizarPessoaV012('gestorB',p,{funcoesContato:['nsi']}));
});
test('projeção não aceita contato falsificado, UID ou promoção de acesso',async()=>{
    const {p}=await seedLote2();
    for(const projecaoExtra of [{nome:'Forjado'},{orgaoId:'orgao-b'},{usuarioUid:'admin'}])await assertFails(atualizarPessoaV012('titular',p,{funcoesContato:['nsi']},{projecaoExtra}));
    await assertFails(atualizarPessoaV012('titular',p,{funcoesContato:['admin']}));
    await assertFails(atualizarPessoaV012('titular',p,{usuarioUid:'admin'}));
    await assertFails(atualizarPessoaV012('titular',p,{validadeCadastro:'texto'}));
});
test('contato já projetado não pode ficar desatualizado quando a origem muda',async()=>{
    const {p}=await seedLote2();await assertSucceeds(atualizarPessoaV012('titular',p,{funcoesContato:['nsi']}));
    const atual=(await getDoc(doc(db('admin'),'colaboradores',idPessoaLote2(p)))).data();
    await assertFails(atualizarPessoaV012('titular',atual,{telefone:'81999999999'},{projetar:false}));
    await assertSucceeds(atualizarPessoaV012('titular',atual,{telefone:'81999999999'}));
});
test('consulta de clientes recebe somente projeção institucional e vínculo não aceita outro órgão',async()=>{
    const {p,outro}=await seedLote2();await assertSucceeds(atualizarPessoaV012('admin',p,{funcoesContato:['nsi']}));await assertSucceeds(atualizarPessoaV012('admin',outro,{funcoesContato:['sei']}));
    await env.withSecurityRulesDisabled(c=>updateDoc(doc(c.firestore(),'usuarios','interno'),{modulosPermitidos:['clientes']}));
    await assertSucceeds(getDocs(collection(db('interno'),'contatosColaboradores')));
    await assertSucceeds(getDocs(collection(db('interno'),'setores')));
    await assertFails(getDocs(collection(db('titular'),'setores')));
    await assertFails(getDocs(collection(db('interno'),'colaboradores')));
    await assertFails(getDocs(collection(db('titular'),'contatosColaboradores')));
    await assertFails(updateDoc(doc(db('admin'),'orgaos','orgao-a'),{contatosVinculados:{nsi:idPessoaLote2(outro)}}));
    await assertSucceeds(updateDoc(doc(db('admin'),'orgaos','orgao-a'),{contatosVinculados:{nsi:idPessoaLote2(p)}}));
});
test('associação de usuário exige espelho e auditoria; não altera permissões',async()=>{
    const {p}=await seedLote2();await assertFails(vincularPessoaV012(p,'titular',{espelhar:false}));await assertFails(vincularPessoaV012(p,'titular',{logUsuario:false}));
    await assertSucceeds(vincularPessoaV012(p,'titular'));
    const u=(await getDoc(doc(db('admin'),'usuarios','titular'))).data();assert.equal(u.perfil,'comum');assert.equal(u.acessoInstitucional.papel,'gestor_nsi');assert.equal(u.colaboradorId,idPessoaLote2(p));
    await assertFails(updateDoc(doc(db('titular'),'usuarios','titular'),{colaboradorId:'outro'}));
});
test('duas pessoas não podem manter o mesmo usuário e associação incompleta é recusada',async()=>{
    const {p,p2}=await seedLote2();await assertSucceeds(vincularPessoaV012(p,'titular'));await assertFails(vincularPessoaV012(p2,'titular'));
    await assertFails(updateDoc(doc(db('admin'),'usuarios','titular'),{colaboradorId:''}));
});
test('substituto com cinco setores atualiza contato projetado dentro dos limites de regras',async()=>{
    const {p,titular}=await seedLote2();
    await env.withSecurityRulesDisabled(async c=>{const f=c.firestore();for(const id of ['a3','a4','a5'])await setDoc(doc(f,'setores',id),{nome:id,orgaoId:'orgao-a',ativo:true});for(const uid of ['titular','sub'])await updateDoc(doc(f,'usuarios',uid),{'acessoInstitucional.setoresIds':['a1','a2','a3','a4','a5']});});
    await assertSucceeds(atualizarPessoaV012('sub',p,{funcoesContato:['sei'],validadeCadastro:Date.now()+86400000}));
});

test('transferência de setor exige escopo anterior e novo, preservando órgão e inscrições',async()=>{
    const {p}=await seedLote2();await assertFails(atualizarPessoaV012('titular',p,{setorId:'a2'}));await assertFails(atualizarPessoaV012('admin',p,{setorId:'b1'}));
    await assertSucceeds(atualizarPessoaV012('admin',p,{setorId:'a2'}));
    const atual=(await getDoc(doc(db('admin'),'colaboradores',idPessoaLote2(p)))).data();assert.equal(atual.orgaoId,'orgao-a');assert.equal(atual.setorId,'a2');
    await assertFails(atualizarPessoaV012('titular',atual,{setorId:'a1'}));
});
test('desvínculo completo preserva conta, colaborador e permissões com histórico atômico',async()=>{
    const {p}=await seedLote2();await assertSucceeds(vincularPessoaV012(p,'titular'));
    const f=db('admin'),id=idPessoaLote2(p),log=doc(collection(f,'historicoAlteracoes')),lu=doc(collection(f,'historicoAlteracoes')),b=writeBatch(f);
    const atual=(await getDoc(doc(f,'colaboradores',id))).data(),novo={...atual,usuarioUid:'',atualizadoEm:serverTimestamp(),atualizadoPorUid:'admin',ultimaAuditoriaId:log.id};
    b.set(doc(f,'colaboradores',id),novo);b.set(doc(f,'contatosColaboradores',id),contatoProjetado(novo));b.set(log,{...auditoriaLote2('admin','colaboradores',id,novo,'editar'),campos:['usuarioUid']});
    b.update(doc(f,'usuarios','titular'),{colaboradorId:'',ultimaAuditoriaId:lu.id});b.set(lu,{autorUid:'admin',autorNome:'admin',criadoEm:serverTimestamp(),colecao:'usuarios',registroId:'titular',registroNome:'titular',acao:'editar',campos:['colaboradorId']});await assertSucceeds(b.commit());
    assert.equal((await getDoc(doc(f,'usuarios','titular'))).data().acessoInstitucional.papel,'gestor_nsi');assert.equal((await getDoc(doc(f,'colaboradores',id))).data().ativo,true);
});
