const {test, before, after, beforeEach} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {initializeTestEnvironment, assertSucceeds, assertFails} = require('@firebase/rules-unit-testing');
const {doc, setDoc, getDoc, deleteDoc, updateDoc, collection, getDocs, query, where, writeBatch} = require('firebase/firestore');

// Somente projeto demo e emulador local. Nunca inicializar com o projeto da produção.
const projectId = 'demo-prgd-usuarios';
let env;
const profile = (uid, extra = {}) => ({uid, nome:uid, email:`${uid}@example.invalid`, ativo:true,
    tipoUsuario:'interno', perfil:'comum', modulosPermitidos:['demandas'], tags:[], grupos:[], ...extra});
const db = uid => env.authenticatedContext(uid, {email:`${uid}@example.invalid`}).firestore();
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
    await assertSucceeds(updateDoc(doc(f,'usuarios','legado'),{ativo:false,excluido:true}));
    await assertFails(getDoc(doc(db('legado'),'demandas','d1')));
    await assertFails(deleteDoc(doc(f,'usuarios','legado')));
});
test('exclusão não admite perfil ativo nem autoexclusão nem ação de consulta',async()=>{
    await assertFails(updateDoc(doc(db('admin'),'usuarios','outro'),{excluido:true}));
    await assertFails(updateDoc(doc(db('admin'),'usuarios','admin'),{ativo:false,excluido:true}));
    await assertFails(updateDoc(doc(db('interno'),'usuarios','outro'),{ativo:false,excluido:true}));
    await assertSucceeds(updateDoc(doc(db('admin'),'usuarios','outro'),{ativo:false,excluido:true}));
    await assertFails(updateDoc(doc(db('admin'),'usuarios','outro'),{ativo:true}));
});
