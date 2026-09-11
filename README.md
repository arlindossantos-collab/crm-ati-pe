# PRGD ATI-PE — v19.1.0 FIREBASE AUTH — PRESERVAÇÃO COMPLETA

Esta versão corrige a integração com Firebase Authentication sem remover os módulos, campos e formulários existentes da aplicação.

## Mantido
- Dashboard e gráficos
- Demandas, histórico e acompanhamento de status
- Eventos, visibilidade e inscrição
- Locais/auditórios
- Órgãos/Secretarias
- Fornecedores TIC com campos detalhados
- Bases Compartilhadas
- Usuários e permissões
- Importação/exportação CSV
- Modal universal de detalhamento/edição
- Tags de usuário: diretor, coordenador, interno, externo e tags personalizadas

## Autenticação
O login utiliza Firebase Authentication com E-mail/Senha. O perfil, órgão, tags e módulos ficam em `usuarios/{uid}` no Firestore. Senhas não são gravadas no Firestore.

A criação de usuário pela aplicação usa uma segunda instância do Firebase Authentication para não derrubar a sessão do administrador que está criando o usuário.

## Publicação
1. No Firebase Console, habilite Authentication > Sign-in method > Email/Password.
2. Publique `index.html`, `firebase.json` e `firestore.rules` no projeto `prgd-ati-pe`.
3. Para hospedagem Firebase, execute `firebase deploy` na pasta do projeto.
4. Faça um hard refresh no navegador após a publicação (Ctrl+F5).

## Primeiro administrador
O primeiro administrador precisa existir no Firebase Authentication e ter um perfil em `usuarios/{UID}` com `perfil: "admin"`, `ativo: true` e `modulosPermitidos` contendo os módulos necessários.

## Observação
A versão foi validada por sintaxe e estrutura localmente. O login e as leituras/escritas reais dependem da configuração e das regras do projeto Firebase em produção.
