# Eventos — consulta da agenda (v0.15.0)

Incremento do Lote 06 do plano diretor, a partir de main@d965a91771f7f1be9cd6d2299819dc0b866aab6c (v0.14.1 publicada). Branch feat/eventos-consulta-agenda-v0150. Publicada com autorização do usuário pelo PR #24, em 24/10/2026, com GitHub Pages e HTML servido conferidos. Homologação funcional do módulo ainda pendente.

## Resultado

A GRGD pode localizar os eventos acessíveis por título, palestrante ou local, sem diferenciar acentos e maiúsculas; combinar situação, tipo e datas; ordenar a agenda e limpar a consulta. Os seletores mostram valores cadastrados nos eventos disponíveis ao perfil, sem carregar metadados de eventos não acessíveis.

Futuros mantém o agrupamento existente, incluindo eventos de hoje ainda não encerrados e legados sem data conhecida. Encerrados substitui o antigo rótulo Realizados e reúne eventos com data/horário final já passado ou situação explícita Realizado. Todos permite pesquisar os dois grupos juntos. Cancelado continua sendo situação distinta; a data do evento determina seu grupo temporal.

O card informa a situação cadastrada, inclusive Planejado ou Cancelado, sem converter uma data passada em Realizado. Ausência de situação ou tipo é indicada explicitamente. Os horários e os controles de inscrição existentes são preservados. Esta entrega não cria nem altera transições de situação no banco.

## Período e ordenação

Datas inicial e final do filtro são inclusivas. O evento aparece quando seu período cruza o intervalo escolhido, inclusive se começou antes do filtro e termina dentro dele. Os timestamps com fuso usam America/Recife, como os utilitários de agenda existentes. Evento sem data inicial válida, com data final inválida ou intervalo invertido não entra em uma consulta com filtro de datas; continua consultável sem esse filtro.

Sem filtro de datas, os legados são preservados. A ordem automática mostra datas crescentes em Futuros/Todos e decrescentes em Encerrados. Ordenação explícita vale nos três grupos. Datas ausentes ficam no final; horário, título e identificador resolvem empates. Não há reordenação dos registros de origem nem gravação dessa preferência.

## Dados, relatórios e limites

A consulta é local sobre os snapshots já permitidos ao usuário, não uma nova pesquisa ou paginação no servidor. A contagem refere-se aos eventos carregados naquele acesso, não ao total da instituição. Estados existentes de carregamento, consulta parcial e erro continuam exibidos.

Relatório Geral de Inscrições continua exportando todas as inscrições carregadas e autorizadas ao administrador, sem seguir os novos filtros. A interface informa esse escopo. Inscrição não comprova comparecimento. Não há migração, mudança de dependência, regra ou índice Firebase. Identificadores e dados existentes são preservados.

Limpar filtros volta a Futuros; logout também limpa texto, seletores, período e ordem. Preferências não são persistidas entre sessões.

## Roteiro de aceite

1. Entrar como administrador ou GRGD autorizado e abrir Eventos.
2. Escolher Todos, buscar título/palestrante/local com e sem acentos e combinar situação/tipo.
3. Selecionar um dia dentro de um evento de vários dias; conferir que o evento aparece.
4. Inverter as datas do filtro; conferir mensagem e ausência de resultados parciais.
5. Abrir Encerrados e comparar as duas ordens. Conferir que um evento passado com situação Planejado continua Planejado.
6. Filtrar Cancelado em Todos e conferir a situação vermelha no card.
7. Conferir ausência de resultados, Limpar filtros e uso no celular sem rolagem horizontal.
8. Entrar com perfil limitado e confirmar que evento restrito e seus valores de tipo/situação não entram na consulta.
9. Sair e conferir que a próxima sessão não conserva os filtros.

Usar somente dados fictícios/emuladores para testes com gravações. O usuário manteve somente o projeto de produção na nuvem; o ambiente local descrito em homologacao-local.md não é um segundo projeto Firebase hospedado.

## Verificação técnica

- Regressão: 139 testes, incluindo combinação de critérios, fuso, limites, duração, datas inválidas, ordenação, privacidade de opções, situações, limpeza e escape de valores.
- Nova suíte tests/eventos-consulta.browser.cjs incluída no CI: controles reais da interface com Firebase simulado, perfis, desktop e celular.
- scripts/homologacao/smoke.cjs ampliado para testar filtros com Auth/Firestore emulados e SDK real. O seed acrescenta três eventos fictícios, sem sobrescrever os existentes.
- Capturas em test-results/eventos-consulta-desktop.png, eventos-consulta-celular.png e eventos-emuladores-*.png. Resultados consolidados após a execução final abaixo.

## Publicação e retorno

O usuário autorizou integrar e publicar esta versão. PR #24 e Pages confirmados: https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/40111702674 . A autorização não antecipa a publicação de novas versões.

Após autorização, somente site e documentação precisam ser publicados; regras e índices não mudaram. Reverter o HTML ao commit anterior restaura a consulta antiga sem restaurar/migrar dados, pois os filtros não fazem gravações. Nenhum lote é considerado homologado só pelos testes automatizados.

### Execução final local

Passaram os 139 testes de regressão, as oito suítes de navegador (as sete existentes e a nova de Eventos) e o smoke integrado ampliado. Todos terminaram com código 0. O navegador do smoke integrado não efetuou requisições externas. Capturas desktop/celular foram revisadas; não houve rolagem horizontal na consulta móvel. Regras/índices/configuração Firebase de produção permanecem sem alteração; o lockfile mudou somente a versão da raiz. A execução no CI do PR será conferida separadamente.
