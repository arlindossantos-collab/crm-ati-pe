# Publicação conjunta — v0.17.1

Integração e publicação de todas as PRs pendentes autorizadas pelo usuário em 25/10/2026, no fuso America/Sao_Paulo. Essa autorização substitui a orientação anterior de manter as propostas pendentes.

## Conjunto preparado

- [PR #26](https://github.com/arlindossantos-collab/crm-ati-pe/pull/26): organização modular e preparação da infraestrutura, commit fd2c4340711637bd6c8cf178281b807a322c0f80.
- [PR #27](https://github.com/arlindossantos-collab/crm-ati-pe/pull/27): correção da legibilidade, commit funcional 3521bdc989250d040e5188666017ce52125e5ebb, descendente da #26.
- Base publicada antes da integração: main@113d629c4565a631bd89a5af4c24c3bf40e26a46, v0.16.0.

O conjunto permanece v0.17.1: não há publicação isolada de v0.17.0 nem releases retroativas para versões intermediárias. O histórico formal contém Release 01 — v0.4.0; a próxima publicação formal confirmada deve ser Release 02 — v0.17.1, vinculada ao commit final integrado.

## Validação e publicação

O código funcional teve [CI aprovado](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/40141960648): 247 testes numerados (162 aplicação/build/migração, 82 regras e três Auth), dez suítes de navegador e smoke com SDK real em emuladores. O artefato dist foi reconstruído e conferido para a publicação: versão 0.17.1, templates expandidos e recursos locais. A atualização documental deve passar pelo CI da PR antes da integração.

Para publicar:

1. Confirmar Pages em **GitHub Actions**, com artefato dist. A integração recebeu HTTP 403 em 25/10/2026 ao tentar mudar a fonte do serviço; um administrador deve ajustar Settings → Pages → Build and deployment → Source. Não integrar a árvore modular enquanto Pages copiar main/raiz.
2. Conferir a PR #27 contra main, seu SHA e CI; integrar por merge commit, preservando os commits das duas PRs.
3. Acompanhar [Publicar PRGD](https://github.com/arlindossantos-collab/crm-ati-pe/actions/workflows/pages.yml) e a validação da main. Conferir o estado das PRs #26/#27 e a ancestralidade dos commits, sem reaplicar os lotes.
4. Verificar a versão e os recursos no [site servido](https://arlindossantos-collab.github.io/crm-ati-pe/), inclusive login/celular sem autenticar contas reais ou gravar dados para testar.
5. Após a implantação confirmada, registrar a tag/release v0.17.1 no commit final integrado, com as notas de publicação efetiva e os links de CI/Pages. Ver [releases](https://github.com/arlindossantos-collab/crm-ati-pe/releases).

Este documento registra a entrega autorizada e o procedimento. Sucesso de build, merge, deploy e verificação do site são estados distintos; consultar a conclusão dos runs e da release para confirmar a publicação efetiva.

## Escopo preservado

Nenhum dado de negócio, regra, índice, conta ou credencial Firebase é migrado nesta entrega. O site continua usando Firebase Authentication/Firestore. PostgreSQL, LDAP/OIDC e VM institucional permanecem preparados/documentados, sem integração operacional ou corte de dados. Homologação GRGD e backups/restauração reais continuam separados da publicação do front.

Não excluir branches ou reescrever histórico para publicar. O commit anterior e o bundle de preservação de código permanecem disponíveis; isso não é backup dos bancos reais.
