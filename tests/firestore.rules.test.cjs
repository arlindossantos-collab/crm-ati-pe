const {test, before, after, beforeEach} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {initializeTestEnvironment, assertSucceeds, assertFails} = require('@firebase/rules-unit-testing');
const {doc, setDoc, getDoc, deleteDoc, updateDoc, collection, getDocs, query, where} = require('firebase/firestore');

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
            'grupos/grupo':{nome:'Grupo interno'}
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
    const resultado=await assertSucceeds(getDocs(query(collection(f,'usuarios'),where('tipoUsuario','==','interno'),where('ativo','==',true))));
    assert.ok(resultado.docs.some(d=>d.id==='outro'));
    await assertFails(getDocs(collection(f,'usuarios')));
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
