# Exclusão com senha, histórico e restauração da sessão

Entrega v0.8.0, preparada em 21/10/2026 sobre a v0.7.0 (`5f444af75e9b35a8f5e67e9efdca573f5c83ae3f`). Em 21/10/2026, o usuário confirmou a publicação das novas regras no Firebase e autorizou a publicação do site. Confirmação das regras baseada no relato do usuário, sem verificação direta do console nesta sessão. Integração e GitHub Pages acompanhados no PR #13. A aplicação continua concentrada em `index.html`.

## Comportamento para a equipe

- Excluir aparece somente para contas internas ativas com perfil `admin`. O tipo interno, sozinho, não concede administração. Contas já cadastradas não têm o perfil alterado nesta entrega.
- Ao clicar, um painel identifica o registro e pede a senha da pessoa que está operando o sistema. Senha incorreta mantém os dados. Cancelar limpa a senha. Envios repetidos e troca de conta durante a confirmação são bloqueados.
- Usuários continuam com exclusão lógica: `ativo=false` e `excluido=true`. Autoexclusão permanece proibida; a conta do Authentication, dados pessoais e vínculos anteriores são preservados. Outros cadastros mantêm sua exclusão física já existente, agora com confirmação de senha.
- O botão **Histórico de alterações**, restrito à administração, mostra pessoa, UID, data/hora de Pernambuco, ação, registro e campos modificados. Carrega 50 entradas por vez; a busca considera as entradas já carregadas.
- F5 aguarda a restauração do Firebase em uma tela de carregamento. A última aba permitida e a visualização de Demandas são recuperadas na mesma guia. Sem sessão válida, o login é exibido; sem permissão para a aba anterior, abre um módulo permitido.

## Gravações e proteções

As gravações dos cadastros, perfil, inscrições, importações e exclusões feitas pela aplicação passam por transações do Firestore. Cada transação envia a mudança e sua entrada em `historicoAlteracoes` juntas. Se o histórico for recusado, a mudança daquele registro também não é confirmada. Importação e limpeza em lote continuam sequenciais: registros anteriores já confirmados não são desfeitos se um posterior falhar.

O horário vem de `serverTimestamp()`. As regras vinculam o autor ao UID autenticado e ao nome atual do perfil. O histórico não permite edição ou remoção pelos clientes, inclusive administradores; somente a administração pode consultá-lo. A exclusão lógica de um usuário exige, nas regras, um histórico novo e correspondente no mesmo envio. Exclusões exigem autenticação realizada há menos de cinco minutos, além da senha solicitada em cada confirmação pela interface.

O histórico guarda nomes de campos modificados e identificação do registro. Não replica valores anteriores/novos, telefone, endereço, foto ou senha. O nome de um registro e o nome/UID do autor ficam no histórico mesmo depois de sua exclusão. A projeção de identificação usada nos avatares é derivada do perfil e acompanha sua gravação, sem criar uma entrada duplicada.

Troca de senha registra apenas o evento `alterar_senha`. A senha muda no Authentication antes da tentativa de registrar o evento no Firestore. Não existe transação entre esses dois serviços: se o histórico falhar, a tela informa que a senha já mudou e orienta usar a nova senha e comunicar a administração. Nenhum valor de senha é enviado ao histórico.

O histórico começa com a implantação. Operações feitas no console Firebase, via Admin SDK ou por programas externos não são capturadas automaticamente. As demais regras de cadastro conservam seus acessos; a obrigação de um histórico correspondente é imposta no servidor especificamente à exclusão de usuários. Uma captura obrigatória de toda alteração por qualquer cliente exige uma implementação futura no servidor, por exemplo com Cloud Functions. Esta entrega não apresenta o histórico da interface como auditoria integral do Firebase.

Somente o identificador da aba e a visualização de Demandas são guardados em `sessionStorage`, por UID. Perfil, dados de negócio e senhas não são copiados para esse armazenamento. Logout apaga essa navegação e limpa dados carregados. Bloqueio do armazenamento pelo navegador pode impedir a restauração. Formulários em andamento, buscas e posição de rolagem não são recuperados.

## Implantação coordenada

1. Revisar o PR e obter autorização para publicar esta entrega.
2. Abrir o projeto **prgd-ati-pe** no [Firebase Console](https://console.firebase.google.com/), entrar em **Firestore Database → Regras** e substituir pelo conteúdo completo de `firestore.rules` desta versão revisada. Publicar as regras.
3. Integrar o PR autorizado à `main` e conferir a conclusão do GitHub Pages. O GitHub não publica as regras do Firebase.
4. Recarregar o site e conferir **v0.8.0** no cabeçalho. Com uma conta de teste administrativa, verificar cancelar, senha incorreta, exclusão de um cadastro de teste e a entrada no histórico. Não usar a própria conta para o teste de exclusão.
5. Com uma conta comum, verificar que os controles de exclusão e o histórico não aparecem. Se uma conta que deveria ser comum estiver como `admin`, a administração deve revisar o perfil em Usuários.
6. Em uma aba diferente da inicial, pressionar F5: deve voltar à mesma aba, sem mostrar o formulário de login durante a recuperação. Conferir também Sair e um novo acesso.

Durante o intervalo entre as regras e o HTML, a v0.7.0 não consegue excluir usuários, pois não envia o histórico obrigatório. Esse bloqueio é esperado. Evitar operações administrativas nesse intervalo. O novo HTML com as regras antigas também terá gravações recusadas por falta de permissão para o histórico; não publicar o HTML antes das regras.

## Validação e retorno

Os testes da aplicação usam o código real com DOM e Firebase simulados. Os testes de regras usam o emulador Firestore; os de senha usam o emulador Authentication e verificam rejeição de senha incorreta. Os testes Chromium interceptam completamente o Firebase, sem ler ou gravar dados institucionais. Capturas ficam no artefato `interface-prgd` da execução do GitHub Actions.

Para retorno, restaurar o HTML da v0.7.0 preservando as regras mais restritivas; a exclusão de usuários permanecerá bloqueada no cliente antigo. Planejar qualquer mudança adicional nas regras após revisão de acesso. Reverter código não restaura usuários ou registros excluídos. O histórico já criado deve permanecer preservado.
