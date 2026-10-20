# Histórico de mudanças da PRGD

Registro das entregas em linguagem de negócio, para consulta da equipe e da gestão.

## v0.6.0 — Locais e planejamento de espaços — proposta

**Resumo para a chefia:** moderniza a aba Locais com indicadores, comparação de espaços, filtros, painel de informações e consulta de conflitos na agenda cadastrada.

- Base independente: main@85e439612962626ffa3783879dab18a8ea383e47 (v0.4.0). O PR #8/v0.5.0 continua separado e pendente do Firebase; não foi incorporado nem publicado.
- v0.6.0 é proposta para esta funcionalidade. Sequência da release e versão anterior efetiva serão conferidas quando a publicação for autorizada. Próxima versão sugerida: v0.6.1 para correções ou v0.7.0 para funcionalidades.
- A aplicação continua em um único HTML. Nenhum dado existente é migrado ou alterado automaticamente.

| Antes | Depois |
| --- | --- |
| Lista simples de locais. | Seis cards: total, capacidade informada, eventos vinculados, gratuitos, pagos e custo previsto informado por evento. |
| Busca básica e nenhum filtro específico. | Busca sem distinção de acentos em nome, endereço e contatos; filtros combinados de tipo, capacidade mínima e recurso. |
| Tabela com seis colunas. | Mantém as colunas originais e acrescenta eventos vinculados e recursos. |
| Detalhes apenas no modal genérico. | Painel abaixo da tabela com endereço, capacidade/área, responsável, recursos e histórico; edição administrativa permanece acessível. |
| Sem consulta de agenda. | Consulta por local, data e horários opcionais; conflitos, agenda parcial e lacunas exibidos explicitamente. |
| Novos locais/eventos só tinham nome e descrição. | Formulários com capacidade, contatos, recursos, tipo/tarifa e vínculo localId, período, situação e custo total da locação por evento. |

### Regras de cálculo e limites

- Capacidade soma apenas números válidos; campos ausentes não são inventados. Gratuito e pago usam o tipo informado ou valor numérico legado; ausência de valor não significa gratuito.
- Eventos vinculam pelo ID; nome legado só é associado em consulta quando corresponde a um único local (ignorando acentos/caixa/espaços). Não há gravação automática desse vínculo. ID órfão e nome duplicado exigem revisão.
- Eventos vinculados inclui todos os períodos e cancelados. Custo previsto soma somente custos totais explicitamente informados por evento vinculado, atual/futuro e não cancelado/realizado. Tarifa do local não é multiplicada por diárias ou horas. Ausências e totais parciais são sinalizados.
- Consulta não é reserva. Sem horários completos, o período inteiro pode estar comprometido. Eventos cancelados não geram conflito. Agendas parciais, erros de carregamento, locais/datas ausentes e vínculos ambíguos impedem afirmar disponibilidade completa.
- Datas com fuso são tratadas no fuso de Pernambuco. Eventos de vários dias são tratados conservadoramente.
- Datas passadas não comprovam realização: o histórico diferencia realização registrada de data encerrada a confirmar.
- Dados de eventos respeitam o acesso existente; somente administrador recebe a agenda completa. Sem módulo Eventos, indicadores de eventos/custo ficam indisponíveis.
- Não muda firestore.rules. Pode ser revisado/testado sem a atualização do Firebase pendente no PR #8. Concessão de novos acessos não faz parte desta entrega.

### Validação

- 70 cenários da aplicação passaram inicialmente em adaptador V8 com dados simulados.
- Execução oficial Node/emuladores e navegador Chromium será registrada no PR. Não confundir simulação com homologação institucional.
- Rotina GitHub Actions inclui testes da aplicação, regras, autenticação e navegador isolado com Firebase interceptado e capturas em desktop/celular.
- Pendências: conferir os resultados completos e revisar os cadastros reais para associar locais e preencher períodos, recursos e custos. Sem publicação nesta etapa.


**Release 01 — v0.4.0:** notas da entrega autorizada para publicação em 20/10/2026. Na conferência anterior à publicação não havia tags nem releases formais. A situação das publicações formais pode ser consultada na [página de releases](https://github.com/arlindossantos-collab/crm-ati-pe/releases); este arquivo não cria uma tag ou release por si só.

<a id="v040"></a>
## Release 01 — v0.4.0 — 20/10/2026

**Resumo para a chefia:** o sistema passou a cadastrar contas internas e externas, vincular os responsáveis GRGD às demandas e permitir que cada pessoa mantenha seu perfil com foto e senha. Também recebeu correções de calendário, consultas, edição e troca de sessão.

- **Versão anterior declarada:** v0.3.4.
- **Nova versão:** v0.4.0.
- **Motivo do incremento:** consolidar funcionalidades adicionadas desde a identificação anterior, além das correções já integradas.
- **Base examinada:** `main@c2c13c3b31b9765930f1e32ea04d416aa79846cf`.
- **Situação:** entrega autorizada para publicação em 20/10/2026. A implantação do site e o registro da release no GitHub são verificações separadas.
- **Próxima versão sugerida:** v0.4.1 se o próximo lote trouxer apenas correções; v0.5.0 se adicionar funcionalidades. Não é compromisso de entrega.

### Antes e depois

| Área | Antes | Depois / benefício |
| --- | --- | --- |
| Cadastro de usuários | O formulário genérico não criava uma conta de acesso vinculada ao perfil. | Cadastro cria login e perfil no mesmo UID, mantendo a sessão do administrador. |
| Tipos e acesso | Não havia distinção explícita entre interno e externo. | Tipos **Interno - GRGD** e **Externo**, com situação, perfil e módulos configuráveis conforme as regras atuais. |
| Responsáveis GRGD | Lista fixa de nomes, sem identificação estável da pessoa. | Seleção de internos ativos por UID; vínculos e nomes anteriores preservados. |
| Perfil pessoal | Usuário não tinha uma área própria para manter seus dados. | Menu Perfil para editar nome, telefone, endereço e foto enviada do computador. |
| Foto e identificação | Identificação visual limitada a nome e iniciais. | Foto circular na conta ativa e nos registros vinculados à pessoa; iniciais continuam como alternativa. |
| Senha | Não havia troca de senha pelo próprio usuário na interface. | Alteração com senha atual e confirmação da nova senha, pelo Firebase Authentication. |
| Dados pessoais | Faltava uma separação própria para os novos dados de contato pessoais. | Telefone e endereço em documento privado; identificação compartilhada contém apenas os dados necessários ao avatar e ao vínculo. |
| Calendário e consultas | Navegação mensal, buscas, contadores e cache tinham inconsistências. | Navegação corrigida, filtros conectados e indicadores/cache ajustados. |
| Edição e sessão | Edição podia converter tipos; respostas antigas podiam permanecer após troca de conta. | Preservação de tipos, limpeza de dados e descarte de respostas de sessões anteriores. |
| Documentação e versão | Código seguia em v0.3.4, com README extenso e parcialmente desatualizado. | Versão sincronizada em HTML e pacotes, README resumido, histórico de mudanças e mapa de organização. |

### Origem das mudanças já integradas

| Entrega | Referência |
| --- | --- |
| Calendário, buscas, edição e isolamento de sessão | [PR #2](https://github.com/arlindossantos-collab/crm-ati-pe/pull/2), integrado em `f5c694e`. |
| Cadastro interno/externo e responsáveis GRGD | [PR #3](https://github.com/arlindossantos-collab/crm-ati-pe/pull/3), integrado em `0c128ff`. |
| Rótulo Interno - GRGD | [PR #4](https://github.com/arlindossantos-collab/crm-ati-pe/pull/4), integrado em `fa041d2`. |
| Perfil pessoal, foto e alteração de senha | [PR #6](https://github.com/arlindossantos-collab/crm-ati-pe/pull/6), integrado em `c2c13c3`. |
| Remoção de HTML experimental, anterior a este mapa | Commits `cbf6b64` e `4f5552a`, com integração do [PR #5](https://github.com/arlindossantos-collab/crm-ati-pe/pull/5). |

As funcionalidades acima já estavam no código examinado. Este lote corrige a identificação de versão e documenta o que foi entregue; não repete sua implementação.

### Validação

- O lote de perfil pessoal registrou **54 testes da aplicação, 25 de regras e 2 de senha**, totalizando 81 aprovações em ambiente de teste.
- Nesta revisão de documentação/versão, **54 testes de regressão passaram**. A comparação confirmou que o HTML muda somente versão, comentário e log; dependências, regras, testes e arquivos históricos permanecem intactos. Sintaxe JavaScript, links locais e diff foram conferidos.
- Os 25 testes de regras e 2 de senha não foram repetidos neste lote, pois suas regras e implementação não mudaram; os resultados do lote anterior estão distinguidos acima.
- Em 20/10/2026, o usuário informou ter publicado as regras no Firebase e confirmou que o cadastro de usuário funcionou. Esse é um relato de validação do cadastro; não comprova todos os fluxos em produção.
- Testes anteriores em Chromium utilizaram Firebase simulado. Homologação institucional completa continua necessária.

### Implantação e retorno

- Esta revisão não muda `firestore.rules` nem configurações do Firebase.
- Conferir login e versão no cabeçalho após integrar e publicar a proposta.
- A tag `v0.4.0` deve identificar o commit final integrado e revisado. A data efetiva e a confirmação da publicação formal ficam na página da release.
- Reverter apenas o código não restaura dados do Firebase. Não aplicar regras históricas sem revisão de compatibilidade e acesso aos novos documentos.

### Pendências

- Acessos externos adicionais, convites e recuperação de senha.
- Regras de eventos, vagas, inscrições concorrentes e relatórios.
- Comparação dos recursos exclusivos de `v0.40/` antes de retirar a cópia antiga da árvore ativa.
- Limpeza das branches concluídas e implantação futura em VM.

## Histórico anterior à consolidação

O histórico possui rótulos como `v0.40`, `v0.3.10` e `v0.3.4`, sem sequência consistente e sem tags/releases formais na consulta realizada. Eles não foram renumerados nem transformados retroativamente em releases.

A referência anterior da aplicação principal é a versão v0.3.4 declarada no HTML. A pasta `v0.40/` representa uma implementação alternativa histórica; seu nome não determina a versão oficial da aplicação principal.

