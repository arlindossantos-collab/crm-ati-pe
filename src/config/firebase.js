// Configuração pública do cliente Firebase; não é credencial de servidor.
const production = {
  apiKey: "AIzaSyA2OoAqzaki4ijS_wQDD5T07KKRtVDNl2E",
  authDomain: "prgd-ati-pe.firebaseapp.com",
  projectId: "prgd-ati-pe",
  storageBucket: "prgd-ati-pe.firebasestorage.app",
  messagingSenderId: "798768232646",
  appId: "1:798768232646:web:31b80951f237b4af17bfc7",
  measurementId: "G-MWES9XN421",
};
const demo = {
  apiKey: "demo-local-key",
  projectId: "demo-prgd-usuarios",
  authDomain: "demo-prgd-usuarios.firebaseapp.com",
};
export function firebaseConfiguration() {
  return typeof __PRGD_DEMO__ !== "undefined" && __PRGD_DEMO__
    ? demo
    : production;
}
