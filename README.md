# PRGD ATI-PE — v19.0.1 Firebase Authentication

Esta versão corrige a arquitetura de autenticação: a senha não fica mais armazenada no Firestore. Os usuários criados pelo painel são contas reais do **Firebase Authentication (Email/Password)** e seus dados de perfil ficam no Firestore.

## Principais correções

- Login real com Firebase Authentication.
- Persistência de sessão no navegador com `browserLocalPersistence`.
- Criação de usuário pelo painel usando `createUserWithEmailAndPassword` em uma instância secundária do Firebase, sem derrubar a sessão do administrador.
- Perfil do usuário salvo em `usuarios/{uid}`.
- Índice `usuarios_email/{email}` para apoio à migração.
- Senhas antigas não são mais gravadas/atualizadas no Firestore.
- Dados de cada módulo são carregados por `onSnapshot` e compartilhados automaticamente para os usuários que possuem aquele módulo em `modulosPermitidos`.
- Regras do Firestore impedem que um usuário leia um módulo que não recebeu.
- Tags livres para usuários, incluindo inicialmente `diretor`, `coordenador`, `interno` e `externo`.
- A aba Bases Compartilhadas permite cadastrar novas tags usando a categoria `Tag de Usuário`.
- Exportação CSV passa a incluir Tags.

## Configuração obrigatória no Firebase Console

1. Abra o projeto `prgd-ati-pe`.
2. Vá em **Authentication > Sign-in method**.
3. Ative **Email/Password**.
4. Crie manualmente a primeira conta administrativa no Authentication, por exemplo a conta do administrador responsável.
5. No Firestore, crie o perfil dessa conta na coleção `usuarios`, usando o **UID exibido no Authentication** como ID do documento. Exemplo:

```json
{
  "uid": "UID_DA_CONTA",
  "nome": "Administrador PRGD",
  "email": "admin@exemplo.pe.gov.br",
  "perfil": "admin",
  "ativo": true,
  "tags": ["diretor", "interno"],
  "modulosPermitidos": ["dashboard", "demandas", "eventos", "locais", "orgaos", "fornecedores", "bases", "usuarios"]
}
```

6. Publique as regras:

```bash
firebase deploy --only firestore:rules
```

7. Publique o site:

```bash
firebase deploy --only hosting
```

## Importante sobre usuários antigos

A versão anterior usava documentos por e-mail e armazenava senha no Firestore. Essa prática não deve continuar. O usuário antigo precisa existir no Firebase Authentication. Depois de criado no Authentication com o mesmo e-mail, o PRGD pode aproveitar o cadastro legado e migrar o perfil para `usuarios/{uid}`.

## CSV de usuários

Formato da v19:

```text
NOME;EMAIL;ORGAO;PERFIL;SENHA;TAGS
```

A senha do CSV é utilizada somente no momento da criação da conta no Firebase Authentication; ela não é salva no Firestore.

## Segurança

A `apiKey` presente no HTML é uma chave pública de configuração do Firebase e não substitui as regras de segurança. A proteção real está no Firebase Authentication + Firestore Security Rules. Nunca coloque uma credencial de Service Account no HTML.
