// Única fronteira de SDK. Não implementa autorização institucional no navegador.
export { getApps, deleteApp } from "firebase/app";
export {
  setPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  deleteUser,
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
export {
  collection,
  doc,
  onSnapshot,
  getDoc,
  query,
  where,
  getDocs,
  runTransaction,
  increment,
  serverTimestamp,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { initializeApp as initializeBase } from "firebase/app";
import { getAuth as authBase, connectAuthEmulator } from "firebase/auth";
import {
  getFirestore as databaseBase,
  connectFirestoreEmulator,
} from "firebase/firestore";
const demo = typeof __PRGD_DEMO__ !== "undefined" && __PRGD_DEMO__;
const connectedAuth = new WeakSet(),
  connectedDatabase = new WeakSet();
export function initializeApp(options, name) {
  if (demo && options.projectId !== "demo-prgd-usuarios")
    throw new Error("Somente projeto demo local permitido.");
  return initializeBase(options, name);
}
export function getAuth(app) {
  const auth = authBase(app);
  if (demo && !connectedAuth.has(auth)) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectedAuth.add(auth);
  }
  return auth;
}
export function getFirestore(app) {
  const db = databaseBase(app);
  if (demo && !connectedDatabase.has(db)) {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectedDatabase.add(db);
  }
  return db;
}
