# PRGD Firebase v2
Implementação modular com Firebase Authentication (Email/Senha), perfis em `usuarios/{uid}`, Firestore em tempo real e regras por módulo.

## Configuração
1. Crie/seleciona o projeto Firebase.
2. Ative Authentication > Email/Password.
3. Copie a configuração Web para `src/firebase.js`.
4. Crie o primeiro perfil admin em `usuarios/{UID}` com `perfil:"admin"`, `ativo:true` e `modulosPermitidos:[]`.
5. Publique as regras: `firebase deploy --only firestore:rules`.
6. Sirva por HTTP(S), nunca por `file://`.

## Segurança
Não coloque service account JSON no repositório. Criação administrativa de usuários deve ser feita pelo Console ou por Cloud Functions/Admin SDK. O frontend não armazena senha no Firestore.

## Observações
O arquivo `legacy-index.html` preserva a aplicação anterior para migração gradual. A nova interface usa listeners `onSnapshot`; operações são persistidas diretamente no Firestore e respeitam as regras.
