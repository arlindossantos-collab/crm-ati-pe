# PRGD v23.5 — Login e migração de perfil corrigidos

Esta versão preserva os módulos da v23.x e corrige o fluxo após a autenticação.

## Correções
- Mantém a autenticação Firebase por e-mail e senha.
- Após senha correta, libera a aplicação imediatamente após a validação do usuário.
- Procura primeiro o perfil em `usuarios/{UID}`.
- Se não existir, procura automaticamente o cadastro legado em `usuarios/{email}`.
- Migra o perfil legado para `usuarios/{UID}`.
- Regras do Firestore permitem que o próprio usuário crie seu documento UID somente com seu e-mail autenticado.
- Uma falha de leitura/renderização do Firestore não devolve o usuário para a tela de login.
- Mensagens de sessão informam a etapa do carregamento.

## Firebase
Verifique no console do Firebase:
1. Authentication > Sign-in method > E-mail/Senha habilitado.
2. Authentication > Users: o usuário deve existir.
3. Authentication > Settings > Authorized domains: o domínio publicado deve estar autorizado.

## Publicação
```bash
firebase deploy --only hosting,firestore:rules
```
Depois, faça `Ctrl+F5` no navegador.

Versão: **23.5**
