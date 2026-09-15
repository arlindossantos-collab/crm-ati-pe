# PRGD v23.6 — Login Firebase unificado

## Correção desta versão
A v23.5 ainda mantinha um código de autenticação Firebase Compat separado do SDK modular. Isso podia autenticar a senha em uma instância e deixar o PRGD aguardando a sessão em outra.

A v23.6 elimina completamente essa duplicidade. Existe agora uma única instância modular do Firebase Authentication, usada pelo formulário de login, pelo `onAuthStateChanged`, pelo logout, pela recuperação de senha e pela criação de usuários.

Também foi preservada a migração de perfis antigos `usuarios/{email}` para `usuarios/{UID}` e a abertura da aplicação mesmo quando uma leitura secundária do Firestore falhar.

## Publicação
```bash
firebase deploy --only hosting,firestore:rules
```
Depois faça `Ctrl+F5`.

## Firebase
- Authentication > Sign-in method: E-mail/Senha habilitado.
- Authentication > Users: o usuário precisa existir.
- Não é necessário recriar um usuário que já exista.
