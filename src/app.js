import {observeSession,login,logout} from "./auth.js"; import {watch,create,update,remove} from "./firestore.js";
const $=id=>document.getElementById(id), loginView=$("login-view"),appView=$("app-view"),error=$("login-error");
$("login-form").addEventListener("submit",async e=>{e.preventDefault();error.textContent="";try{await login($("email").value,$("password").value)}catch(x){error.textContent="Falha no login: "+x.message}});
$("logout").onclick=logout;
const modules=["grupos","demandas","eventos","locais","orgaos","fornecedores"];
let profile;
observeSession((user,p)=>{profile=p;loginView.hidden=!!user;appView.hidden=!user;$("logout").hidden=!user;if(!p)return;$("user-info").textContent=`Usuário: ${p.nome||p.email||user.email}`;renderModules();});
function allowed(m){return profile?.perfil==="admin"||(profile?.modulosPermitidos||[]).includes(m)}
function renderModules(){const nav=$("modules");nav.replaceChildren();modules.filter(allowed).forEach(m=>{const b=document.createElement("button");b.textContent=m;b.onclick=()=>renderCollection(m);nav.append(b)});}
function renderCollection(name){const content=$("content");content.innerHTML=`<h2>${name}</h2><form id="new"><input id="title" required placeholder="Descrição"><button>Adicionar</button></form><div id="rows">Carregando…</div>`;const rows=$("rows");watch(name,items=>{rows.replaceChildren();items.forEach(item=>{const p=document.createElement("p");p.textContent=item.nome||item.titulo||item.descricao||item.id;const del=document.createElement("button");del.textContent="Excluir";del.onclick=()=>remove(name,item.id);p.append(" ",del);rows.append(p)});});$("new").onsubmit=async e=>{e.preventDefault();await create(name,{nome:$("title").value},profile.uid);e.target.reset();};}