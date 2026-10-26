# Publicação confirmada — v0.17.1

Integração e publicação de todas as PRs pendentes autorizadas pelo usuário em 25/10/2026, no fuso America/Sao_Paulo. Essa autorização substitui a orientação anterior de manter as propostas pendentes.

## Conjunto integrado

- [PR #26](https://github.com/arlindossantos-collab/crm-ati-pe/pull/26): organização modular e preparação da infraestrutura, commit fd2c4340711637bd6c8cf178281b807a322c0f80.
- [PR #27](https://github.com/arlindossantos-collab/crm-ati-pe/pull/27): correção da legibilidade, commit funcional 3521bdc989250d040e5188666017ce52125e5ebb, descendente da #26.
- Base publicada antes da integração: main@113d629c4565a631bd89a5af4c24c3bf40e26a46, v0.16.0.

O conjunto permanece v0.17.1: não há publicação isolada de v0.17.0 nem releases retroativas para versões intermediárias. A identificação do rodapé do login também foi sincronizada no fechamento desta entrega. A publicação formal corresponde à [Release 02 — v0.17.1](https://github.com/arlindossantos-collab/crm-ati-pe/releases/tag/v0.17.1), vinculada ao commit final integrado após a conferência do deploy; a sequência anterior é Release 01 — v0.4.0.

## Validação e publicação

O conjunto preparado teve [CI aprovado](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/40217732083) em 9c434c5: 247 testes numerados (162 aplicação/build/migração, 82 regras e três Auth), dez suítes de navegador e smoke com SDK real em emuladores. O artefato dist foi reconstruído e conferido para a publicação: versão 0.17.1, templates expandidos e recursos locais. [Validação da main após a integração](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/40323335740).

Evidências de 26/10/2026, no fuso America/Sao_Paulo:

- Pages confirmado pela API com build_type workflow, após o usuário informar o ajuste administrativo. O HTTP 403 de 25/10/2026 foi uma limitação da integração para alterar essa configuração; a publicação já está habilitada.
- PR #27 integrada por merge commit 34e33d1d043f118225aace959a244ad3353a23e8. PRs #26 e #27 confirmadas como merged; fd2c434 e 3521bdc preservados como ancestrais da main.
- [Primeira implantação da entrega](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/40323336103) concluída com sucesso nesse commit. O endereço público respondeu HTTP 200, com v0.17.1 e referência ao bundle compilado assets/app.js.
- O commit final, os resultados da conferência do site e os links da implantação de fechamento são registrados na release. Esta atualização de documentação não é uma nova migração ou entrega funcional.

Para próximas publicações:

1. Confirmar Pages em **GitHub Actions**, com artefato dist; manter a configuração já aplicada. Não publicar templates-fonte pela raiz.
2. Conferir a proposta contra main, seu SHA e CI; em propostas encadeadas, integrar por merge commit, preservando a ancestralidade.
3. Acompanhar [Publicar PRGD](https://github.com/arlindossantos-collab/crm-ati-pe/actions/workflows/pages.yml) e a validação da main. Conferir o estado das PRs integradas e a ancestralidade dos commits, sem reaplicar os lotes.
4. Verificar a versão e os recursos no [site servido](https://arlindossantos-collab.github.io/crm-ati-pe/), inclusive login/celular sem autenticar contas reais ou gravar dados para testar.
5. Após a implantação confirmada, registrar a tag/release v0.17.1 no commit final integrado, com as notas de publicação efetiva e os links de CI/Pages. Ver [releases](https://github.com/arlindossantos-collab/crm-ati-pe/releases).

Este documento registra a publicação inicial confirmada e o procedimento de manutenção. Sucesso de build, merge, deploy e verificação do site são estados distintos; os runs e a release registram a implantação efetiva e seu commit.

## Escopo preservado

Nenhum dado de negócio, regra, índice, conta ou credencial Firebase é migrado nesta entrega. O site continua usando Firebase Authentication/Firestore. PostgreSQL, LDAP/OIDC e VM institucional permanecem preparados/documentados, sem integração operacional ou corte de dados. Homologação GRGD e backups/restauração reais continuam separados da publicação do front.

Não excluir branches ou reescrever histórico para publicar. O commit anterior e o bundle de preservação de código permanecem disponíveis; isso não é backup dos bancos reais.
