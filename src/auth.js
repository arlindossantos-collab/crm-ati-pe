import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from "./firebase.js";
export const login=(email,password)=>signInWithEmailAndPassword(auth,email,password);
export const logout=()=>signOut(auth);
export function observeSession(callback){return onAuthStateChanged(auth,async user=>{if(!user)return callback(null,null);const snap=await getDoc(doc(db,"usuarios",user.uid));if(!snap.exists()||snap.data().ativo===false) {await logout();throw new Error("Perfil inexistente ou inativo.");}callback(user,{uid:user.uid,...snap.data()});});}