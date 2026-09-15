# PRGD v23.3 — LOGIN DEFINITIVO

Correção focada no problema em que o botão de login não disparava nenhuma ação.

## O que foi corrigido
- Tela de login transformada em formulário HTML real (`login-form`).
- Login executado pelo evento `submit`, inclusive ao pressionar Enter.
- Mantido Firebase Authentication e o mesmo projeto Firebase.
- Mensagens claras para senha/e-mail incorretos, usuário inexistente, usuário desativado, excesso de tentativas, rede e demais erros Firebase.
- Botão mostra “Autenticando...” durante o processo.
- Versão visível corrigida para v23.3 em todos os pontos da aplicação.
- Demais funcionalidades da v23 foram preservadas.

## Publicação
Na pasta onde está este `firebase.json`:

```bash
firebase deploy --only hosting,firestore:rules
```

Depois faça Ctrl+F5. Se o navegador continuar mostrando v23.1, a implantação não está usando esta pasta/arquivo.
