# Histórico de mudanças da PRGD

Registro das entregas em linguagem de negócio, para consulta da equipe e da gestão.

## v0.7.0 — Gestão de usuários e sessão persistente — entrega de 21/10/2026

**Resumo para a chefia:** facilita editar e retirar usuários do cadastro ativo e preserva o login após atualizar a página. Parte da v0.6.3 e mantém os ícones, tons suaves e disposição atual de Locais.

| Antes | Depois |
| --- | --- |
| Edição acessível em Detalhes. | Editar diretamente na lista e Salvar usuário no formulário. |
| Inativação mantinha o cadastro na lista. | Excluir exige confirmação, marca ativo=false/excluido=true e retira da lista e contadores. |
| F5 descartava a sessão em memória. | Persistência local na sessão principal; cadastro auxiliar permanece isolado em memória. |

**Limites:** somente administradores podem excluir; autoexclusão bloqueada. Conta Auth, dados pessoais, e-mail reservado e histórico permanecem. Exclusão definitiva exige implementação administrativa separada.

**Validação:** [GitHub Actions aprovado](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/39476011701), commit `d38143255337955aeddc3013e2022f2cb4f9f499`: **75 testes da aplicação, 27 de regras e 2 de autenticação, total 104 aprovações sem falhas**. Locais também aprovado em Chromium, incluindo layout móvel, com Firebase totalmente simulado. Regras e autenticação verificadas em emuladores. Persistência real e homologação institucional permanecem pendentes.

**Implantação:** publicação autorizada em 21/10/2026 após o usuário informar que publicou as regras do Firestore. Confirmação das regras baseada no relato do usuário; o console Firebase não pôde ser verificado diretamente nesta sessão. Integração à main e implantação do GitHub Pages são etapas separadas, acompanhadas no PR #8. Confirmar login, F5, reabertura, Sair, edição e exclusão no ambiente institucional; nenhum usuário real foi excluído pela preparação desta entrega. Próximas versões possíveis: v0.7.1 para correções ou v0.8.0 para novas funcionalidades.

## v0.6.3 — Ícones e tons suaves nos indicadores de Locais — entrega de 20/10/2026

**Resumo para a chefia:** melhora a identificação dos seis indicadores, mantendo a disposição atual da tela.

- Versão anterior: v0.6.2. Nova versão: v0.6.3. Publicação autorizada em 20/10/2026; conferir integração e GitHub Pages separadamente.
- Antes: cards brancos com rótulos sem ícones.
- Depois: um ícone por indicador e fundos discretos alternando somente azul e verde, com opacidade de 5,5% e borda de 16%. Texto, números e notas mantêm as cores anteriores.
- Ícones: edifício, pessoas, calendário, presente, cartão e moedas, na ordem dos indicadores. Ícones decorativos; nomes preservados para leitura e acessibilidade.
- Sem agenda lateral, nova identidade roxa, cores fortes ou reorganização. HTML estático do corpo preservado integralmente após normalizar apenas a versão.
- Alteração limitada aos seis cards: demais campos, tabela, cabeçalho, consulta, cálculos, cadastros, permissões e regras do Firebase preservados.
- Teste de navegador verifica seis ícones, moedas no custo, somente azul/verde, baixa opacidade e consulta abaixo do painel, além dos fluxos anteriores.
- [Execução completa aprovada no GitHub Actions](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/39473507112), commit `bbfee522ef9e3b54dc7c1355b2958fee3250389a`: 70 testes da aplicação, 25 de regras e 2 de autenticação, totalizando **97 aprovações**. Chromium aprovado em desktop e celular: seis ícones, moedas no custo, apenas azul/verde, baixa opacidade e consulta mantida abaixo do painel. Dados simulados; não equivale a homologação em produção.
- Publicação autorizada. Não exige alteração no Firebase; PR #8 continua separado.
- Próxima versão sugerida: v0.6.4 para ajustes ou v0.7.0 para funcionalidades; sequência formal a conferir ao publicar.



## v0.6.2 — Restauração do layout anterior de Locais — 20/10/2026

**Resumo para a chefia:** restaura a interface de Locais da v0.6.0, desfazendo a apresentação visual da v0.6.1 conforme solicitação do usuário.

- Versão anterior publicada: v0.6.1. Nova versão: v0.6.2. O número avança para registrar a reversão; a aparência retorna à v0.6.0.
- Antes: indicadores com seis cores/ícones, identidade roxa e disponibilidade na lateral direita.
- Depois: cards, cores e disposição da v0.6.0, com consulta de disponibilidade abaixo do conteúdo.
- Mantidos: modernização original de Locais, indicadores, filtros, informações, histórico, cadastros e cálculos.
- Código da interface restaurado a partir de `5efc60fad20ce2bb6376e301eeb4e4bb01389da3`; no HTML só a identificação da versão difere daquela referência.
- Teste de navegador retorna à validação anterior, que verifica os fluxos e a largura de celular. Conferir resultados da execução vinculada ao PR de reversão.
- Reversão e publicação autorizadas pelo usuário em 20/10/2026. Confirmar integração e GitHub Pages separadamente.
- Nenhuma alteração nos dados ou regras do Firebase. PR #8 permanece separado.
- Próxima versão sugerida: v0.6.3 para ajustes ou v0.7.0 para novas funcionalidades; sequência formal de release a conferir quando registrada.


## v0.6.1 — Identificação visual de Locais — entrega de 20/10/2026

**Resumo para a chefia:** facilita reconhecer os indicadores e consultar a agenda enquanto se examina um local.

- Versão anterior: v0.6.0. Nova versão: v0.6.1, ajuste de interface sem nova regra de negócio. Publicação autorizada em 20/10/2026; conferir GitHub Pages separadamente.
- Próxima versão sugerida: v0.6.2 para ajustes ou v0.7.0 para novas funcionalidades. Sequência da release será conferida quando a publicação for autorizada.
- Base: main@5efc60fad20ce2bb6376e301eeb4e4bb01389da3. Alteração de usuários do PR #8 permanece separada.

| Antes | Depois |
| --- | --- |
| Cards semelhantes, com nomes sem ícones. | Cada indicador combina nome, ícone temático e uma cor própria. |
| Destaques predominantemente azuis. | Identidade roxa restrita ao módulo Locais, com cores distintas nos indicadores. |
| Consulta de disponibilidade abaixo de todo o conteúdo. | Painel na lateral direita a partir de 1024 px; abaixo do conteúdo em telas menores. |
| Rótulos de campos e tabela só em texto. | Ícones também nos cabeçalhos, informações do local, formulário e consulta, preservando os nomes. |

### Identificação dos indicadores

| Indicador | Ícone | Cor |
| --- | --- | --- |
| Locais cadastrados | Edifício | Roxo |
| Capacidade total | Pessoas | Azul |
| Eventos vinculados | Calendário | Índigo |
| Locais gratuitos | Presente | Verde |
| Locais pagos | Cartão | Âmbar |
| Custo total previsto | Moedas | Rosa |

Os ícones são decorativos para leitores de tela; os nomes permanecem presentes. Cores não substituem os rótulos. Estilos restritos a Locais e aos seus campos no modal.

### Validação e limites

- Sintaxe JavaScript conferida; IDs existentes preservados, sem duplicação.
- Testes de navegador verificam seis fundos distintos, ícones, ícone de moedas no custo, agenda à direita no computador e abaixo no celular, além dos fluxos anteriores.
- [Execução completa aprovada no GitHub Actions](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/39470701865), commit `7cb9e1a6bb2bc6f34b96be04850be282defc82b2`: 70 testes da aplicação, 25 de regras e 2 de autenticação, totalizando **97 aprovações**. Chromium também aprovado: seis cores distintas, ícones, moedas no custo, agenda à direita no computador, abaixo no celular e fluxos existentes. Dados simulados; não é homologação em produção.
- Cálculos, vínculos, permissões, campos, gravações e regras do Firebase preservados. Não exige atualização do Firebase.
- Entrega autorizada para publicação. O ajuste segue a descrição textual do usuário. Integração, implantação do site e página formal de release são etapas distintas.


## v0.6.0 — Locais e planejamento de espaços — entrega de 20/10/2026

**Resumo para a chefia:** moderniza a aba Locais com indicadores, comparação de espaços, filtros, painel de informações e consulta de conflitos na agenda cadastrada.

- Base independente: main@85e439612962626ffa3783879dab18a8ea383e47 (v0.4.0). O PR #8/v0.5.0 continua separado e pendente do Firebase; não foi incorporado nem publicado.
- Publicação autorizada em 20/10/2026. Versão anterior publicada: v0.4.0; nova versão: v0.6.0. A identificação v0.5.0 pertence ao PR #8, ainda não publicado; deverá ser ajustada antes da sua integração para não reduzir a versão do sistema.
- Próxima página formal prevista: **Release 02 — v0.6.0**, conforme histórico consultado com apenas Release 01 — v0.4.0. Este arquivo não cria tag/release. Integração, GitHub Pages e release formal são verificações separadas.
- Próxima versão sugerida: v0.6.1 para correções ou v0.7.0 para funcionalidades.
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

- [Execução completa aprovada no GitHub Actions](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/39465560736), commit `2b92110ada190203b3464e09740e85fb98993c7c`: **70 testes da aplicação, 25 de regras e 2 de autenticação, total de 97 aprovações sem falhas**.
- Chromium aprovado com Firebase totalmente interceptado: seis cards, filtros, busca de contato, painel/histórico, conflito por horário, horários adjacentes sem conflito, edição e criação de local.
- Capturas de desktop (1440 px) e celular (390 px) guardadas no artefato locais-interface da execução. Verificado que a página não transborda na largura do celular; tabela e abas têm rolagem própria. O teste inicial revelou transbordamento da navegação, corrigido antes desta aprovação.
- Nenhuma operação de teste acessou os dados do Firebase real. A prova inicial V8 foi complementada pela execução oficial; isso não equivale a homologação institucional.
- Conferência estática preservou todos os 138 IDs originais do HTML; nova página tem 153 IDs, sem duplicação.
- Pendências: homologar com usuários e revisar os cadastros reais para associar locais e preencher períodos, recursos e custos. Publicação autorizada; conferir a implantação do GitHub Pages separadamente.


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

