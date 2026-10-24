// Somente emuladores locais, sem credenciais institucionais e sem apagar dados.
const assert=require('node:assert/strict');
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');
const {doc,getDoc,setDoc}=require('firebase/firestore');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8080');
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST,'127.0.0.1:9099');
const fs=require('node:fs'),path=require('node:path');
const projectId='demo-prgd-usuarios',password='Ficticio-local-2026!';
async function account(name){
 const email=name+'@example.invalid';
 let response=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-local-key',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
 let body=await response.json();
 if(body.error?.message==='EMAIL_EXISTS'){
  response=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-local-key',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});body=await response.json();
 }
 assert.ok(response.ok,'Falha ao preparar conta fictícia: '+name);return {uid:body.localId,email};
}
(async()=>{
 const accounts={};for(const name of ['admin','gestor-a','gestor-b','sem-vinculo'])accounts[name]=await account(name);
 const env=await initializeTestEnvironment({projectId,firestore:{rules:fs.readFileSync(path.resolve(__dirname,'../../firestore.rules'),'utf8')}});
 try{await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.firestore(),now=Date.now();
  const rows={
   'orgaos/orgao-a':{nome:'Órgão A fictício',sigla:'TESTE-A',ativo:true},
   'orgaos/orgao-b':{nome:'Órgão B fictício',sigla:'TESTE-B',ativo:true},
   'setores/a1':{nome:'Setor A fictício',orgaoId:'orgao-a',ativo:true},
   'setores/b1':{nome:'Setor B fictício',orgaoId:'orgao-b',ativo:true},
   'eventos/consulta-planejado':{titulo:'Agenda local — formação digital',tipoEvento:'Seminário',palestrante:'João fictício',localEvento:'Auditório fictício',status:'Planejado',dataInicio:'2099-02-10',dataFim:'2099-02-12',eventoPublico:true},
   'eventos/consulta-cancelado':{titulo:'Agenda local — evento cancelado',tipoEvento:'Oficina',status:'Cancelado',dataInicio:'2099-02-15',eventoPublico:true},
   'eventos/consulta-passado':{titulo:'Agenda local — evento passado',tipoEvento:'Oficina',status:'Confirmado',dataInicio:'2000-01-01',eventoPublico:true},
   'eventos/evento-local':{titulo:'Oficina de homologação fictícia',dataInicio:'2099-01-01',modeloInscricao:'institucional-v1',eventoPublico:false,orgaosElegiveis:['orgao-a'],inscricoesAbertas:true,inscricaoInicio:now-60000,inscricaoFim:now+86400000,limiteVagas:3,inscritosCount:0,status:'Confirmado'}
  };
  for(const [name,a] of Object.entries(accounts)){
   const admin=name==='admin',manager=name.startsWith('gestor-'),org=name==='gestor-b'?'orgao-b':'orgao-a';
   const profile={...a,nome:name+' fictício',ativo:true,perfil:admin?'admin':'comum',tipoUsuario:admin?'interno':'externo',modulosPermitidos:admin?['usuarios','clientes','eventos','demandas']:[],tags:[],grupos:[]};
   if(manager)profile.acessoInstitucional={papel:'gestor_nsi',orgaoId:org,setoresIds:[org==='orgao-a'?'a1':'b1'],operacoesVersao:'v1',situacao:'aprovado',inicio:now-60000,fim:now+86400000,revisao:now+43200000,titularUid:'',acoes:['orgao.consultar','participantes.consultar','participantes.cadastrar','participantes.editar','eventos.consultar','inscricoes.consultar','inscricoes.criar','inscricoes.cancelar','comprovantes.consultar'],aprovacaoGrgd:{responsavel:'GRGD fictícia',referencia:'LOCAL'},aprovacaoAutoridade:{responsavel:'Autoridade fictícia',referencia:'LOCAL'},registradoPorUid:accounts.admin.uid,registradoEm:new Date().toISOString()};
   rows['usuarios/'+a.uid]=profile;
   rows['identidadesUsuarios/'+a.uid]={uid:a.uid,nome:profile.nome,fotoPerfil:'',tipoUsuario:profile.tipoUsuario,ativo:true};
  }
  for(const [key,data] of Object.entries(rows))if(!(await getDoc(doc(db,key))).exists())await setDoc(doc(db,key),data);
 });}finally{await env.cleanup();}
 console.log('Dados fictícios preparados: admin, gestor-a, gestor-b e sem-vinculo (@example.invalid).');
})().catch(e=>{console.error(e);process.exitCode=1;});
