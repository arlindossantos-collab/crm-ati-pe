# PRGD v19.0 — Firebase como fonte única da base de usuários

## Objetivo

A v19.0 elimina a ideia de uma base local de usuários no HTML. A coleção Firestore `usuarios` é a fonte de dados do cadastro do PRGD e cada documento deve usar o UID do Firebase Authentication como ID:

`usuarios/{UID}`

## O que mudou

- Lista de usuários carregada diretamente do Firestore via `onSnapshot`.
- Novo usuário: cria conta no Firebase Authentication e, em seguida, cria o perfil em `usuarios/{UID}`.
- Edição de usuário: altera nome, órgão, perfil, situação e módulos diretamente no Firestore.
- E-mail é tratado como identidade do Firebase e fica bloqueado na edição.
- Senha de usuário não é gravada no Firestore; o administrador pode enviar e-mail de redefinição.
- Desativação de usuário é feita por `ativo:false`, preservando a conta Authentication.
- Botão “Sincronizar Firebase” remove somente documentos legados/duplicados identificáveis (`LEGACY_*` e documentos antigos cujo ID é o e-mail e que possuem correspondente `usuarios/{UID}`).
- O HTML não contém uma lista fixa de usuários.
- Auditoria registra operações administrativas.

## Limitação importante do Firebase Web SDK

Uma página web não pode listar todos os usuários do Firebase Authentication nem excluir/alterar a senha de outro usuário com privilégios administrativos. Por isso:

- Firestore fornece a base de perfis/permissões exibida no PRGD.
- Criação de novas contas usa o fluxo atual com app secundário.
- Alteração de senha de terceiros usa o fluxo oficial de redefinição por e-mail.
- Para sincronização completa entre “usuários existentes no Firebase Authentication” e Firestore, inclusive descoberta de contas Authentication sem perfil Firestore, alteração de e-mail e exclusão definitiva, recomenda-se uma Cloud Function com Firebase Admin SDK.

## Implantação das Rules

Use o arquivo `firestore_v19.rules` no Firebase Console ou Firebase CLI. As regras negam tudo por padrão e concedem acesso por perfil/módulo.

## Atenção ao primeiro administrador

Antes de aplicar regras que exigem `usuarios/{UID}`, garanta que a conta administrativa atual tenha um documento com seu UID e `perfil: "admin"`, `ativo: true` e `modulosPermitidos` contendo os módulos necessários.

## Estrutura mínima do perfil

```json
{
  "uid": "UID_DO_FIREBASE_AUTH",
  "nome": "Nome do usuário",
  "email": "usuario@ati.pe.gov.br",
  "subgrupoId": "ATI",
  "perfil": "admin",
  "ativo": true,
  "modulosPermitidos": ["dashboard", "usuarios"],
  "criadoEm": "timestamp",
  "criadoPorUid": "UID_ADMIN",
  "atualizadoEm": "timestamp",
  "atualizadoPorUid": "UID_ADMIN"
}
```
