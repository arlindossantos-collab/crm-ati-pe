import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const firebaseConfig={apiKey:"AIzaSyA2OoAqzaki4ijS_wQDD5T07KKRtVDNl2E",authDomain:"prgd-ati-pe.firebaseapp.com",projectId:"prgd-ati-pe",storageBucket:prgd-ati-pe.firebasestorage.app",messagingSenderId:"798768232646",appId:"1:798768232646:web:31b80951f237b4af17bfc7E"};
const app=initializeApp(firebaseConfig); export const auth=getAuth(app); export const db=getFirestore(app);