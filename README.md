# PRGD v23.2 — CLOUD CORRIGIDO

Esta versão retoma a autenticação estável da v22.0 e preserva os recursos de detalhamento, eventos, grupos e inscrições da v23.0.

## Correção principal
- Login continua usando Firebase Authentication e `signInWithEmailAndPassword`.
- Perfil é lido primeiro por `usuarios/{UID}`.
- Perfis antigos cujo documento usava o e-mail como ID podem ser migrados automaticamente para `usuarios/{UID}`.
- A sessão não é encerrada apenas porque o perfil ainda não existe.
- Não foi alterada a criação de usuários via Firebase Authentication.

## Publicação
No diretório desta versão:

```bash
firebase deploy --only hosting,firestore:rules
```

Depois da publicação, faça um hard refresh no navegador (Ctrl+F5).


## Correção de login v23.2
- Login Firebase mantido sem alteração de credenciais.
- Mensagem visível para senha incorreta/e-mail incorreto e principais erros do Firebase Auth.
- Botão mostra estado “Autenticando...” durante a tentativa.
- Falhas de leitura do perfil Firestore não encerram mais a sessão autenticada.
- Enter no campo de senha também executa o login.
- Não foi necessário alterar a arquitetura de autenticação.
