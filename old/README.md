# PRGD v22.0 — Cloud Multidispositivo

Versão reconstruída sobre a base PRGD v20 fornecida, preservando a navegação e os módulos e corrigindo a autenticação/sincronização.

## Principais correções
- Firebase Authentication real para login em qualquer dispositivo.
- Perfil de usuário vinculado a `usuarios/{UID}`.
- Criação de usuário pelo próprio aplicativo usando uma segunda instância Firebase Auth, sem derrubar a sessão do administrador.
- Listeners Firestore iniciados somente após autenticação.
- Usuários comuns não tentam ler a coleção inteira de usuários.
- Delegação de eventos para que botões de tabelas continuem funcionando após atualizações em tempo real.
- Edição/detalhamento/exclusão preservados.
- Formulários ampliados para fornecedores e locais de eventos.

## Firebase
1. Authentication > Sign-in method > habilite Email/Password.
2. Garanta que exista pelo menos um usuário administrador no Authentication.
3. Crie `usuarios/{UID_DO_ADMIN}` com `perfil: "admin"`, e campos como `nome`, `email`, `orgao`, `modulosPermitidos` e `tags`.
4. Publique hosting e regras: `firebase deploy --only hosting,firestore:rules`.

## Observação importante
O código não contém uma chave de serviço/Admin SDK. A criação do usuário é feita pelo SDK Web em uma segunda instância de Auth; as regras do Firestore continuam controlando a gravação do perfil. Para ambiente corporativo de produção, uma Cloud Function/Admin SDK pode ser adotada posteriormente para endurecer essa operação.
