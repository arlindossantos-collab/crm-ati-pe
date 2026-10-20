const {test,before,after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {initializeApp,deleteApp} = require('firebase/app');
const {getAuth,connectAuthEmulator,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,updatePassword,reauthenticateWithCredential,EmailAuthProvider} = require('firebase/auth');
let firebaseApp,auth;
before(()=>{
    const host=process.env.FIREBASE_AUTH_EMULATOR_HOST;
    assert.ok(host && /^(127\.0\.0\.1|localhost):\d+$/.test(host),'Execute apenas com npm run test:auth e emulador local.');
    firebaseApp=initializeApp({apiKey:'fake-emulator-key',projectId:'demo-prgd-usuarios'},'teste-perfil');
    auth=getAuth(firebaseApp);connectAuthEmulator(auth,'http://'+host,{disableWarnings:true});
});
after(async()=>{if(firebaseApp)await deleteApp(firebaseApp);});
function fluxoReal(uid) {
    const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
    const inicio=html.indexOf('        async function alterarMinhaSenha(e)');
    const fim=html.indexOf('        const CORES_CARD_DEMANDA',inicio);
    assert.ok(inicio>0 && fim>inicio,'Função real de troca de senha deve existir.');
    const nodes=new Map(),mensagens=[];
    const element=id=>{if(!nodes.has(id))nodes.set(id,{value:'',disabled:false});return nodes.get(id);};
    const context=vm.createContext({auth,currentUser:{uid},versaoSessao:1,salvandoSenhaPerfil:false,EmailAuthProvider,reauthenticateWithCredential,updatePassword,
        document:{getElementById:element},mensagemPerfil:(texto,erro)=>mensagens.push({texto,erro}),traduzirErroSistema:err=>err.code,
        limparSenhasPerfil:()=>['perfil-senha-atual','perfil-senha-nova','perfil-senha-confirmar'].forEach(id=>{element(id).value='';})});
    vm.runInContext(html.slice(inicio,fim),context);
    return {element,mensagens,executar:()=>vm.runInContext('alterarMinhaSenha({preventDefault(){}})',context)};
}
test('senha inicial é substituída pela nova e o login anterior deixa de funcionar',async()=>{
    const email='perfil-senha@example.invalid',inicial='senha-inicial-teste',nova='senha-nova-teste';
    const {user}=await createUserWithEmailAndPassword(auth,email,inicial),fluxo=fluxoReal(user.uid);
    fluxo.element('perfil-senha-atual').value=inicial;fluxo.element('perfil-senha-nova').value=nova;fluxo.element('perfil-senha-confirmar').value=nova;
    await fluxo.executar();assert.ok(fluxo.mensagens.some(m=>m.texto.includes('sucesso')&&!m.erro));
    assert.equal(fluxo.element('perfil-senha-atual').value,'');await signOut(auth);
    await assert.rejects(signInWithEmailAndPassword(auth,email,inicial));
    const entrada=await signInWithEmailAndPassword(auth,email,nova);assert.equal(entrada.user.uid,user.uid);await signOut(auth);
});
test('senha atual incorreta não altera o login existente',async()=>{
    const email='perfil-erro@example.invalid',inicial='senha-inicial-teste';
    const {user}=await createUserWithEmailAndPassword(auth,email,inicial),fluxo=fluxoReal(user.uid);
    fluxo.element('perfil-senha-atual').value='senha-incorreta';fluxo.element('perfil-senha-nova').value='senha-nova-teste';fluxo.element('perfil-senha-confirmar').value='senha-nova-teste';
    await fluxo.executar();assert.ok(fluxo.mensagens.some(m=>m.erro));await signOut(auth);
    const entrada=await signInWithEmailAndPassword(auth,email,inicial);assert.equal(entrada.user.uid,user.uid);await signOut(auth);
});
