# Auditoria técnica — proposta v0.17.0

Validação em 24/10/2026, sobre a reorganização originada de main@113d629c4565a631bd89a5af4c24c3bf40e26a46 (v0.16.0). A proposta não foi publicada nem operou sobre dados reais. Resultado técnico não equivale a homologação institucional de todos os cadastros e fluxos.

## Estrutura verificada

O index.html passou de 4.256 para 48 linhas, com telas/modais em src/views, estilos em src/styles e 41 módulos JavaScript com imports/exports reais. Os 277 IDs de interação da versão anterior são preservados por contrato. O estado compartilhado ficou explícito em app/state; ainda existem dependências entre fluxos e operações específicas de Firestore.

O build gera dist com SDK único, CSS, fontes e gráficos locais. Não publica fonte, scripts, testes, deploy, regras, configuração de servidor, backups ou exportações. O modo demo recusa projeto diferente de demo-prgd-usuarios. O teste de reproducibilidade confere hashes entre dois builds com as mesmas entradas.

## Execuções concluídas

| Verificação | Resultado | Evidência e limite |
| --- | --- | --- |
| npm ci com Node 22 | Aprovado | Lockfile fixado; instalação reproduzida após atualização das dependências |
| npm run check | Aprovado | Sintaxe/imports/identificadores dos 41 módulos, templates e IDs únicos |
| npm test | 154/154 aprovados | 147 regressões preservadas, 3 contratos de build/domínio e 4 testes de auditoria de exportação |
| npm run test:rules | 82/82 aprovados | Regras reais no emulador Firestore, incluindo recusas de escopo, vínculos, projeções, inscrições/capacidade e auditoria |
| npm run test:auth | 3/3 aprovados | Auth real emulado: senha nova, senha incorreta e reconfirmação para exclusão |
| npm run test:browser | 9 suítes aprovadas | ES modules reais com adaptador Firebase substituído; desktop/celular e estados de falha |
| npm run test:integration | Aprovado | Artefato empacotado com SDK Firebase real e Auth/Firestore emulados; zero requisições externas |
| Desenvolvimento local | Aprovado | Modo demo, HTTP, recompilação ao salvar e encerramento de servidor/watchers |
| npm run test:deploy | Aprovado | PostgreSQL 18 e Nginx raiz/subcaminho em containers descartáveis sem portas publicadas |
| git diff --check | Aprovado | Sem erros de whitespace na proposta |

São **239 testes numerados**, mais nove suítes de navegador, o smoke integrado e os ensaios de infraestrutura. Não somar cliques/etapas desses roteiros como novos testes unitários.

As nove suítes são eventos-consulta, inscricoes, layout-perfis, locais, painel-inscricoes, perfis, portal-nsi, seguranca-sessao e usuarios-colaboradores. Não houve remoção de casos funcionais para fazer a extração passar. Os testes antes dependentes de fatias do HTML agora leem as funções reais por AST; a compatibilidade VM aponta para o estado real. Os testes de navegador exercem as dependências entre módulos, que o harness VM não comprova sozinho.

O CI executa check/build, os 239 testes, navegador e integração com emuladores. Guarda artefato site-prgd e capturas interface-prgd. O ensaio Docker é opcional/local e não foi incluído no CI obrigatório. A aprovação remota deve ser conferida no PR, separadamente desta validação local.

## O que funciona nos cenários exercitados

| Área | Cobertura observada | Limite relevante |
| --- | --- | --- |
| Sessão/perfis | Login emulado, F5, logout, troca/perda de papel e respostas atrasadas; escopo por órgão/setor | Não autentica diretório ATI nem comprova política de produção |
| Órgãos/setores | CRUD/regressão, vínculos e referências, ausência de dados sem exemplos fictícios | Dados antigos precisam de revisão humana |
| Pessoas/contas | Cadastro sem criar login, acesso vinculado transacional, associação/desvínculo, projeções e recusas | Criação de conta real de produção não foi executada |
| Eventos/locais | Filtros, período/duração, agenda, situações cadastradas, cadastro/edição e celular | Data passada não prova realização; ocupação real exige dados corretos |
| Inscrições | Cadastro, cancelamento/reativação, vagas e auditoria, isolamento entre órgãos, painel administrativo e comprovante | Não comprova comparecimento; divergências legadas não são corrigidas automaticamente |
| Relatórios | Exportação administrativa, bloqueio com dados incompletos e CSV com neutralização de fórmulas | Não há novo relatório de frequência nem carga de dados reais |
| Demandas/apoio | Funções preservadas; regressões de consultas, formulários, detalhes, gráficos e gravações simuladas | Não houve homologação de cada cadastro com a equipe de negócio |
| Migração/VM | Auditoria offline, payload tipado/precisão/IDs, staging idempotente/restrições/rollback; Nginx HTTP/assets/404 e headers | Não implementa API SQL, autenticação LDAP, TLS/DNS institucional ou restauração real |

O smoke integrado cria colaborador fictício, inscreve/cancela, confere auditoria/vaga, recusa acesso entre órgãos e valida administrador, painel e conta sem vínculo, também em celular. O ensaio usa apenas demo e não substitui a conferência de índices e configuração efetivos no projeto hospedado.

## Problemas encontrados e tratados

- O empacotamento inicial da extração incluía duas cópias do SDK, fazendo o login falhar no SDK real mesmo com testes simulados aprovados. A resolução agora externaliza qualquer importação que chegue ao adaptador único; o build também rejeita dependências SDK duplicadas no bundle da aplicação. O smoke real foi reexecutado e passou.
- A umask privada do workspace gerava arquivos ilegíveis pelo usuário Nginx. O artefato passa a ter diretórios 0755/arquivos 0644, verificados nos testes e no Nginx real.
- O servidor de desenvolvimento precisava encerrar também os watchers. O ciclo iniciar/recompilar/encerrar foi exercitado.
- A publicação anterior copiava a raiz do repositório. Foram preparados dist, workflow Pages e Hosting com raiz explícita. **A fonte atual do serviço Pages ainda é main/raiz**: deve mudar para GitHub Actions com autorização antes de integrar esta arquitetura. Não foi alterada nesta proposta.
- A cópia v0.40 tinha acesso ao mesmo Firebase real. Seu código saiu da árvore publicável e permanece recuperável no Git; a URL passa a orientar o acesso atual, sem SDK. Recursos exclusivos constam na [auditoria do legado](auditoria-legado.md).

## Dependências e alertas restantes

A auditoria npm inicial indicou 30 ocorrências: 1 crítica, 12 altas e 17 moderadas. Após atualizar Firebase para 12.19.0, rules-unit-testing para 5.0.2 e CLI para 15.34.1, renovar dependências transitivas compatíveis e validar novamente, o resultado foi **0 críticas, 0 altas e 8 moderadas**. Contagens incluem dependentes do mesmo aviso e podem mudar com a base pública de advisories.

Firestore fixa gRPC Node em uma linha antiga. O override específico de @firebase/firestore → @grpc/grpc-js 1.14.6 foi registrado em package.json para eliminar os avisos altos dessa dependência. Não se usou npm audit fix --force nem o downgrade incompatível sugerido pelo npm. Regras, Auth, seed e smoke passaram com o lockfile final. Ao atualizar Firestore, reavaliar/remover esse override se o upstream já trouxer a correção.

As oito ocorrências moderadas restantes estão no grafo das ferramentas Firebase CLI/Tailwind, não nos módulos JavaScript entregues ao navegador:

- [OpenTelemetry Core: consumo de memória em Baggage](https://github.com/advisories/GHSA-8988-4f7v-96qf), via Pub/Sub da CLI;
- [PostCSS selector parser: complexidade de parsing](https://github.com/advisories/GHSA-rj75-hqrm-r3gf), via Tailwind 3 e postcss-nested;
- [uuid: limites do buffer](https://github.com/advisories/GHSA-w5hq-g745-h8pq), via gaxios da CLI.

As correções sugeridas pelo npm trocam linhas principais de ferramentas. Permanecem registradas para atualização compatível; esta proposta não declara auditoria sem alertas. Não publicar node_modules nem servir as ferramentas no Nginx. npm ci/npm audit mantêm verificação de integridade/TLS; nenhuma verificação foi desativada.

## Pendências reais

Aceite da GRGD, backup/restauração de Auth/Firestore reais, reconciliação do legado, infraestrutura/certificados ATI, esquema relacional de negócio, backend transacional, provedor OIDC/LDAPS e migração final continuam abertos. As instruções/documentos anexos são referência de planejamento, não evidência de infraestrutura existente ou autorização de alterações nos dados.

Consulte [o mapa do código](mapa-organizacao.md), [a migração](migracao/README.md) e [o procedimento local](planejamento/homologacao-local.md).
