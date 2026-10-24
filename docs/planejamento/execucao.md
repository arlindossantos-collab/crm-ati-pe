# Execução do plano diretor — PRGD

> Estado atual: a v0.16.0 foi publicada pelo PR #25. A proposta v0.17.0 reorganiza o código e prepara a migração; consulte [o mapa atual](../mapa-organizacao.md) e [a auditoria](../auditoria-testes.md). O inventário abaixo registra a base examinada quando o plano foi iniciado.

Início: 23/10/2026. Estado: Lote 00 em execução, sem aceite institucional.
Base: `4cb768a6ea8d2f9cd307c9cf9c265f356c1aff02`, v0.14.0, repositório `arlindossantos-collab/crm-ati-pe`.
Branch de trabalho: `docs/plano-evolucao-lote-00`.

## Documento de referência

O usuário escolheu trabalhar o Plano de Ação de Evolução PRGD ATI/PE. A [transcrição do PDF](plano-diretor-extraido.txt) preserva o conteúdo para consulta; tabelas e diagramação devem ser conferidas no original.
SHA-256 do PDF: `936bb69b29d5ecf184bf8ae0c7b5a0f62319d93ca69d4580cdd6e9f4c4645879`.
As recomendações do documento são propostas. Não constituem aprovação institucional ou confirmação de infraestrutura disponível.

## Inventário e dependências

| Componente | Evidência | Dependências e limites |
| --- | --- | --- |
| Aplicação | `index.html`, 4.127 linhas | HTML/CSS/JS juntos; SDK Firebase 10.8.0 via CDN; configuração aponta para prgd-ati-pe |
| Identidade e autorização | Firebase Authentication, usuarios, identidadesUsuarios, grupos | Autenticação separada de cadastro e autorização; não associar por nome/e-mail automaticamente |
| Cadastros | orgaos, setores, colaboradores, contatosColaboradores | Referências institucionais e projeção de contatos; preservar IDs e histórico |
| Eventos e inscrições | eventos, inscricoes | Elegibilidade, vagas e transações; separar registros legados e institucional-v1 |
| Apoio | demandas, locais, fornecedores, bases | Preservar funcionamento; expansão funcional fora do incremento inicial |
| Auditoria | historicoAlteracoes; regras específicas em firestore.rules | Não equivale a backup nem captura todas as alterações externas |
| Persistência | firestore.rules, firestore.indexes.json | Regras e índices publicados separadamente do site |
| Hospedagem | GitHub Pages; firebase.json alternativo | Hosting alternativo aponta para raiz; revisar lista de ativos antes de utilizá-lo |
| Testes | regression, firestore.rules, auth-profile e sete arquivos browser | Node 22 no CI; Java 21; navegador usa Firebase simulado |
| Histórico alternativo | v0.40/ | Não é base atual; não remover sem comparação |

## Preservação executada

O HEAD foi conferido com a main remota antes da edição. Foi criado bundle completo e arquivo do código em `/workspace/preservation/crm-ati-pe-lote00/`. O bundle foi verificado e clonado em `restauracao/`; HEAD e index.html conferem com a origem. `git fsck --full` não indicou corrupção (há commits dangling preservados no bundle).

Esse ensaio recupera **código e histórico Git**. Não recupera dados do Firestore, contas do Authentication, arquivos externos, configuração de serviços ou segredos. A cópia é local a este ambiente, sem garantia de armazenamento externo durável.

Não houve leitura de registros, exportação ou alteração do Firebase de produção. Backup dos dados e restauração em ambiente separado permanecem pendentes do administrador autorizado.

## Backlog e critérios de passagem

| Lote | Situação inicial | Próxima entrega / critério de aceite |
| --- | --- | --- |
| 00 — diagnóstico | Em execução | Inventário e regressão registrados; backup de dados e restauração demonstrados com responsável autorizado |
| 01 — homologação | Validação local preparada; aceite pendente | Decisão do usuário: manter somente produção na nuvem e usar emuladores locais; ver homologacao-local.md. Sem prévia pública por PR |
| 02 — organização | Planejado | Caracterização antes de extração; PR pequena; preservar IDs, regras e comportamentos. CONTRIBUTING adia modularização automática |
| 03 — órgãos | Recursos existentes, sem aceite integral | Validar fonte oficial, duplicidade, edição e inativação com vínculos preservados |
| 04 — pessoas e setores | Recursos existentes, sem aceite integral | Validar cadastro, associação segura, setores e distinção pessoa/conta/participante |
| 05 — acessos | Recursos existentes, sem aceite integral | Homologar matriz de perfis e ações permitidas/negadas, validade e histórico |
| 06 — eventos | Recursos existentes, sem aceite integral | GRGD valida campos, agenda, transições de estado, responsáveis e elegibilidade |
| 07 — inscrições | Recursos existentes, sem aceite integral | Concorrência, duplicidade, cancelamento, reinscrição e legado verificados |
| 08 — presença/relatórios | CSV existente; presença a definir | Não inferir presença da inscrição; definir correções e consolidação com GRGD |
| 09 — piloto | Pendente | Jornada com três órgãos fictícios e aceite funcional registrado |
| 10 — VM | Futuro | Rede, HTTPS, operação, backup e retorno acordados com ATI |
| 11 — identidade/dados | Futuro | Decisões institucionais e migração ensaiada; sem assumir LDAP ou PostgreSQL aprovados |

Nenhum lote está homologado por este documento. PR, merge e implantação são etapas distintas; não publicar automaticamente.

## Riscos e decisões necessárias

1. Servir index.html localmente continua conectando à produção: não usar esse método para homologação com gravações.
2. Backup de código não substitui backup de Firestore e Authentication. Definir administrador, escopo, retenção e destino seguro dos backups.
3. Definir responsável funcional GRGD e registrar fluxo real de criar, divulgar, inscrever, executar e encerrar evento, com campos obrigatórios e transições aceitas.
4. Decisão posterior do usuário: manter somente produção na nuvem. Homologação técnica usa emuladores locais; acesso funcional e aceite GRGD ainda precisam ser organizados.
5. Dependências antigas emitem avisos de descontinuação. Revisão de atualização deve ser separada e testada; lockfile preservado neste incremento.

## Evidências de validação

Ver [linha de base](validacao-lote00.md). Testes automatizados não substituem homologação funcional, teste com dados legados ou recuperação dos serviços reais.

## Incremento do Lote 01

Ver [homologação local](homologacao-local.md) para instalação, inicialização, contas fictícias, validação e limitações. A decisão do usuário sobre um único projeto hospedado substitui a proposta original de Firebase separado; os dados dos testes ficam nos emuladores.

## Incremento de Órgãos

Revisão encontrou e corrigiu o uso de localização, fonte e ponto focal de exemplo em dados ausentes. Ver [proposta v0.14.1](orgaos-dados-ausentes.md). Este incremento não conclui o Lote 03 nem substitui a pendência de backup real do Lote 00.

## Incremento de consulta da agenda de Eventos

A proposta v0.15.0 acrescenta filtros por situação/tipo/período, ordenação e Todos, mantendo a situação cadastrada distinta de data encerrada. Ver [consulta da agenda](eventos-consulta-agenda.md). Este incremento não conclui o Lote 06 nem altera a pendência de backup dos dados reais ou de aceite funcional.

## Incremento do Lote 07 — inscrições e vagas

A v0.16.0 publicada acrescenta painel administrativo por evento, filtros e conferência de capacidade/contador, preservando registros antigos e as operações de comprovante/cancelamento. Ver [painel de inscrições e vagas](painel-inscricoes-vagas.md). Não conclui a homologação integral do Lote 07, nem a revisão dos dados legados ou o backup real do Lote 00.
