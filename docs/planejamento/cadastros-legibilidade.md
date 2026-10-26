# Legibilidade dos cadastros — proposta v0.17.1

Incremento dependente da [PR #26](https://github.com/arlindossantos-collab/crm-ati-pe/pull/26), sobre fd2c4340711637bd6c8cf178281b807a322c0f80. O usuário pediu varredura geral, com prioridade nas telas de cadastro, e manter a PR #26 pendente para integração conjunta futura. Esse foi o estado da preparação de 24/10/2026. Em 25/10/2026 o usuário autorizou integrar/publicar todas as pendentes; consulte [o roteiro de publicação](../publicacao-v0171.md).

## Falhas reproduzidas e correções

O novo roteiro de navegador foi executado contra uma cópia isolada do commit da PR #26. Ele falhou ao encontrar Invalid Date na tabela de fornecedores; a captura dos detalhes também mostra RAZAOSOCIAL, PRODUTOSERVICOPRINCIPAL, false, [object Object] e UID como informações principais. A mesma fixture passa na versão corrigida.

| Antes | Depois |
| --- | --- |
| Chaves do banco usadas como rótulos nos detalhes e edição | Razão social, Produto ou serviço principal, Criado em e outros nomes legíveis; fallback separa palavras de campos adicionais |
| Booleanos, timestamps, arrays/objetos convertidos diretamente para texto | Sim/Não, datas brasileiras no fuso America/Recife, listas e dados estruturados organizados; zero continua zero |
| Campos técnicos/UIDs misturados ao cadastro | Referências técnicas recolhidas, identificadas e consultáveis, sem apagar o valor original |
| Grupos editados como lista de códigos | Seleção por nomes; referências anteriores indisponíveis permanecem selecionadas e identificadas como pendência |
| Código de órgão/setor/evento ocupando o lugar do nome | Nome já disponível no escopo ou mensagem explícita de indisponibilidade; sem buscar dados de outro órgão |
| Permissões e campos de histórico mostrados por código | Ações e nomes de campos traduzidos; códigos permanecem disponíveis para busca/referência administrativa |
| SDK/erros nativos e nomes internos em mensagens | Mensagens de conexão, sessão, autorização e validação legíveis; sem expor detalhes técnicos inesperados |
| Texto pequeno/uppercase e longas sequências no celular | Rótulos legíveis, campos com fonte de 16px no celular, quebra de texto sem cobrir controles |
| Regra .hidden anulava a exibição responsiva da identificação no desktop | Fallback de baixa prioridade, mantendo os seletores forçados dos modais e da sessão |
| Datas inválidas impediam abrir determinados cadastros de vínculo | Cadastro abre para revisão; datas indicam conferência e controles não recebem Invalid Date |
| Situação desconhecida em comprovante aparecia como cancelada | Situação não informada, sem presumir confirmação/cancelamento |
| Ícone fa-calendar-star ausente no Font Awesome Free instalado | Ícone de calendário disponível na biblioteca local |

A correção não interpreta HTML cadastrado como código executável, não altera valores na leitura e não tenta reescrever a codificação dos registros antigos. As fontes ativas são UTF-8; a fixture confere São José, Conceição, Ação e participação. Texto histórico efetivamente corrompido na base ainda exigiria identificar o registro e revisar seu conteúdo, sem conversão em massa por suposição.

## Preservação

Os names/value dos controles continuam correspondendo às chaves persistidas. O novo controle de referências salva IDs, preservando ordem/repetições anteriores quando a seleção não muda, inclusive IDs com vírgula e nomes ausentes. O merge preserva estruturas e metadados não editados; máscaras e os formulários especializados de órgãos, locais, pessoas e eventos continuam em uso.

As consultas continuam usando somente os dados carregados para o perfil. Regras, índices, credenciais e coleções não mudaram. Protocolo e referências administrativas continuam disponíveis; um código não é apagado ou transformado em nome inventado. O CSV existente mantém seu contrato.

## Validação

- 162 testes de regressão/build/migração, incluindo oito cenários novos de apresentação, escape, referências, preservação na edição, erros e histórico.
- 82 testes de regras Firestore e três de Auth em emuladores (247 testes numerados no total).
- Dez suítes de navegador com Firebase simulado; a nova suíte percorre Fornecedores, Bases, Eventos, Acessos e Histórico, com edição, desktop/celular e nenhuma requisição externa.
- Smoke com SDK Firebase real e Auth/Firestore emulados, incluindo inscrição/cancelamento, contador, auditoria, perfis e isolamento entre órgãos.

Os testes com Firebase simulado não são prova da integração hospedada. Emuladores não são homologação GRGD nem revisão de todos os registros reais. Capturas ficam no artefato interface-prgd do CI, incluindo legibilidade-fornecedor-desktop.png e legibilidade-fornecedor-celular.png. A captura da base comparativa ficou fora do repositório, em /tmp/prgd-legibilidade-base/test-results.

## Revisão e integração conjunta

Na revisão incremental, a PR #27 teve como base refactor/organizacao-migracao-v0170, mostrando somente a correção. Seu branch contém os commits da PR #26. Após a autorização de 25/10/2026, a base é direcionada à main para integrar o conjunto. O CI valida PRs para qualquer branch base, mantendo a publicação restrita à main.

Novas propostas seguem a mesma cadeia. Quando o usuário autorizar integrar o conjunto, a última proposta pode ser direcionada à main, revisando o diff acumulado, o CI e o estado remoto. Preferir merge commit para preservar a ancestralidade das propostas; conferir o encerramento das PRs anteriores depois. Não fazer squash/reaplicar cada lote sem avaliar a cadeia.

A configuração Pages foi confirmada em GitHub Actions em 26/10/2026; publicar somente dist. Na preparação, a produção permaneceu na v0.16.0. As PRs #26/#27 foram integradas em 26/10/2026 e a implantação v0.17.1 foi confirmada separadamente do merge, conforme as evidências no roteiro de publicação.
