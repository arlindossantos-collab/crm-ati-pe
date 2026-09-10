# PRGD v18.0 — Segurança Firebase / Firestore

## Arquivos

- `index_PRGD_v18.0.html` — aplicação web atualizada.
- `firestore.rules` — regras de segurança recomendadas para publicação no Firestore.

## Mudanças principais

1. Perfis passam a ser vinculados ao UID do Firebase Authentication:
   `usuarios/{uid}`.
2. Usuários antigos em `usuarios/{email}` podem ser migrados automaticamente no primeiro login.
3. Não existe mais acesso completo por padrão quando o documento do usuário não existe.
4. O perfil `admin` vem exclusivamente do Firestore; não há e-mail de administrador fixo no código.
5. Usuários comuns não podem criar, editar ou excluir perfis de usuários.
6. Exclusão de registros é restrita ao administrador.
7. Permissões de módulos são verificadas no frontend e, principalmente, nas regras do Firestore.
8. Registros passam a carregar metadados de autoria (`criadoPorUid`, `criadoEm`, `atualizadoPorUid`, `atualizadoEm`).
9. Foi adicionada coleção de auditoria para registrar CREATE, UPDATE, DELETE e alterações de status.
10. Importação de usuários via CSV não cria contas do Firebase Authentication. Ela gera registros pendentes (`LEGACY_<email>`) para evitar a falsa impressão de que a conta já pode fazer login.
11. O dashboard continua usando dados reais do Firestore.
12. Listeners do Firestore são encerrados ao trocar de sessão.
13. Conteúdo exibido dinamicamente é tratado para reduzir risco de XSS.

## Publicação das regras

No Firebase Console:

1. Abra o projeto `prgd-ati-pe`.
2. Acesse Firestore Database → Rules.
3. Substitua as regras atuais pelo conteúdo de `firestore.rules`.
4. Publique.

## Atenção antes da publicação

Faça primeiro um teste com uma conta administrativa e uma conta comum.

A primeira autenticação de um usuário existente no formato antigo (`usuarios/{email}`) tentará criar automaticamente `usuarios/{uid}`. Depois disso, a aplicação passa a usar o UID.

## Criação de usuários

A criação de usuários pela interface continua usando um app Firebase secundário para não deslogar o administrador. Para produção, a arquitetura ideal é mover o provisionamento de contas para uma Cloud Function usando Firebase Admin SDK.

## Importação CSV de usuários

A importação não deve ser usada como substituta da criação da conta no Firebase Authentication. Após importar, o administrador deve provisionar as credenciais e o perfil definitivo.

## Observação de segurança

As regras são a camada efetiva de segurança do banco. Ocultar abas no HTML não é considerado controle de acesso.
