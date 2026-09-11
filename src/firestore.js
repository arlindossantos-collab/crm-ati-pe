import {collection,addDoc,doc,setDoc,updateDoc,deleteDoc,onSnapshot,query,orderBy,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {db} from "./firebase.js";
export const watch=(name,cb)=>onSnapshot(query(collection(db,name),orderBy("criadoEm","desc")),s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))));
export const create=(name,data,uid)=>addDoc(collection(db,name),{...data,criadoPorUid:uid,criadoEm:serverTimestamp(),atualizadoEm:serverTimestamp()});
export const update=(name,id,data)=>updateDoc(doc(db,name,id),{...data,atualizadoEm:serverTimestamp()});
export const remove=(name,id)=>deleteDoc(doc(db,name,id));
export const saveProfile=(uid,data)=>setDoc(doc(db,"usuarios",uid),data,{merge:true});