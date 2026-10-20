# Cadastro de usuários internos e externos

Base: `main` no commit `f5c694e8391e559a2625d57c3e61ec257285f18b`. A aplicação permanece em um HTML. Não há release ou mudança de versão neste lote.

## Antes e depois

Antes, Novo Usuário gravava nome e descrição em documento aleatório, sem criar login. Os responsáveis GRGD eram nomes fixos no HTML. Não havia formulário próprio de tipo, situação, perfil e módulos. A aplicação consultava coleções inteiras, e perfis ausentes recebiam acesso por fallback. As regras permitiam autocadastro com papel arbitrário e uma regra genérica se sobrepunha às regras de usuários e inscrições.

Agora:

| Conceito | Comportamento |
| --- | --- |
| Interno | Perfil Administrador ou Consulta; módulos configuráveis. Se explicitamente ativo, aparece na seleção GRGD. |
| Externo | Perfil Consulta. Começa sem módulos; consulta a eventos públicos pode ser liberada. Demais acessos externos ainda serão definidos. |
| Administrador | Acesso e edição de todos os módulos, incluindo Usuários. |
| Consulta | Leitura dos módulos selecionados; não altera dados internos. Usuários é exclusivo de administradores. |
| Inativo | Acesso aos dados bloqueado; cadastro e vínculos anteriores preservados. |

O tipo não concede administração. Mantivemos os perfis existentes; permissões separadas de criar/editar/excluir por módulo não foram introduzidas. O formulário inclui nome, e-mail de acesso, tipo, situação, perfil, módulos, cliente/secretaria, tags e grupos.

Cadastros novos criam login de e-mail/senha no Authentication e perfil em `usuarios/{uid}`. Autenticação secundária preserva a sessão do administrador. A senha inicial exige 8 caracteres, não é gravada no perfil nem enviada por mensagem. Se a gravação do perfil falhar, tenta-se remover a conta Auth criada. As operações não são uma transação única: em falhas de rede ou cancelamento, conferir Authentication e Firestore antes de repetir. O erro de cancelamento informa o UID. A conta secundária é desconectada e a senha do formulário é limpa.

Módulos limitam tanto consultas como permissões no Firestore. Mudanças de acesso limpam os dados e reiniciam as consultas, descartando callbacks antigos. Perfis ausentes, inativos ou não confirmados não recebem acesso de emergência. A própria conta administrativa não pode ser inativada/rebaixada pela interface nem pelas regras.

## Demandas e preservação dos dados

Novas atribuições usam somente cadastros `tipoUsuario: interno` e `ativo: true`. Nomes iguais são diferenciados por e-mail e UID. Os campos são:

- `responsaveisGrgdIds`: identificadores estáveis;
- `responsaveisGrgdSnapshot`: nome/e-mail ao salvar, para fallback se o perfil ficar indisponível;
- `responsaveisGrgdLegados`: nomes antigos ainda sem vínculo;
- `responsavelGrgd`: nomes mantidos para compatibilidade com a versão anterior.

A tela resolve nomes atuais pelo UID. Inativar ou reclassificar alguém remove novas escolhas sem apagar vínculos anteriores. Ao editar a demanda, esses vínculos continuam marcados e podem ser mantidos/removidos. Cadastros sem tipo aparecem como **A definir**. Não há classificação por tags nem associação automática por nome. Para vincular um nome antigo, marque a pessoa correta e desmarque o nome antigo na demanda. Metadados de criação e campos não editados são preservados com merge.

Classificar um documento antigo com ID aleatório não cria seu login. Antes de implantar, conferir quais documentos correspondem ao UID real no Authentication. Contas Auth existentes sem perfil no UID exigem correção administrativa assistida no Firebase; o formulário não cria segunda conta com o mesmo e-mail. Não apagar nem remapear documentos por semelhança de nome.

## Testes

`npm test` executa testes da aplicação com DOM/Firebase simulados, sem dados reais. `npm ci` e `npm run test:rules` executam testes reais de autorização no Firestore Emulator, projeto `demo-prgd-usuarios`. Exigem Java 17+ e Node 20/22; o primeiro download exige rede. `firebase.test.json` é exclusivo dos testes, sem mudar o hosting. Os testes de regras cobrem autocadastro, promoção de perfil, módulos, diretório, inativação e inscrições próprias. Não validam o provisionamento real do Authentication nem as configurações de produção.

Validação deste lote (20/10/2026): **39 testes da aplicação e 15 testes de regras aprovados**. Conferência adicional em Chromium, com DOM real e Firebase simulado: cadastro, edição, sessão administrativa, seleção GRGD por UID, preservação de legados, cancelamento e consulta; formulário conferido em desktop e celular. Nenhuma chamada a dados reais nesses testes.

## Implantação coordenada após revisão

1. Exportar perfis/demandas e conferir o UID de duas contas administrativas no Authentication. Garantir perfis em `usuarios/{uid}` antes de retirar o fallback. Nunca colocar senhas no repositório.
2. Em projeto Firebase de homologação separado, configurar o HTML, habilitar e-mail/senha, autorizar o domínio e aplicar as regras propostas. Testar criação e login de interno/externo/admin, permissões, inativação e demandas antigas. Validar a política de senha e restrições do Authentication.
3. Classificar manualmente os cadastros que serão responsáveis GRGD; não migrar vínculos por nome.
4. Coordenar a atualização de regras e HTML: publicar as regras com Console/CLI no projeto explicitamente correto, atualizar o HTML em seguida e exigir recarregamento. Clientes com HTML antigo podem receber erros de permissão na transição.
5. Conferir cada tipo/perfil após publicar. Merge/publicação no GitHub Pages **não publica regras do Firestore**. Este PR não implanta regras nem altera dados reais.

## Pendências e limites

- Definir acessos externos além da consulta opcional a eventos públicos. Convites, recuperação de senha e alteração de e-mail de login não foram implementados.
- Homologar no Firebase antes de implantar, incluindo contas antigas sem perfil no UID.
- Eventos por grupos, controle transacional de vagas, inscrições duplicadas, listas de espera e relatórios não foram redesenhados. Consulta recebe eventos públicos; grupos dos perfis são preservados. Outros inscritos não são expostos. Sem contador disponível, a tela mostra somente capacidade.
- A restrição existente por documento nas coleções internas foi preservada. Consultas amplas podem ser recusadas se houver registros restritos que o usuário não possa ler; isso exige consultas específicas em etapa própria.
- O diretório GRGD permite aos internos com Demandas ler perfis dos internos ativos, incluindo nome/e-mail, sem senhas. Uma projeção mínima separada pode ser criada com backend próprio.
- Authentication e Firestore permanecem no Firebase. Hospedar o HTML na VM não migra esses serviços automaticamente.
- Não restaurar as regras antigas inseguras como retorno. Avaliar compatibilidade das regras e novos perfis antes de reverter o HTML. Os nomes das demandas foram mantidos para facilitar compatibilidade.
