# Mapa de organização do repositório PRGD

**Data:** 20/10/2026. **Base:** `main@c2c13c3b31b9765930f1e32ea04d416aa79846cf`.

Este documento distingue diagnóstico de execução. Nenhum arquivo, branch, tag ou registro do Firebase foi excluído nesta revisão. As alterações preparadas são de documentação e identificação da versão.

## Resultado para a gestão

O repositório é pequeno: **17 arquivos rastreados, 853.843 bytes no total (aproximadamente 834 KiB)**, além do histórico Git. O problema principal é a mistura entre material histórico e atual, documentação desatualizada e falta de releases formais.

A pasta `v0.40/` ocupa **211.879 bytes, cerca de 25% dos arquivos atuais**. A retirada futura desses dois arquivos deixaria 15 arquivos na base examinada, antes de contar os novos documentos desta revisão. Isso reduz cópias e confusão; não implica melhora direta de desempenho da página principal.

`package-lock.json` é o maior arquivo, mas é necessário para repetir instalações com as mesmas dependências. Não é um arquivo inútil.

## Inventário completo dos 17 arquivos da base

| Arquivo | Tamanho em bytes | Decisão proposta | Motivo |
| --- | ---: | --- | --- |
| `index.html` | 205.689 | Manter | Aplicação principal em uso. A separação em módulos continua adiada. |
| `firestore.rules` | 7.224 | Manter | Controla acesso e validação no banco; necessário para o cadastro funcionar. |
| `firebase.json` | 152 | Manter e revisar o bloco de hospedagem futuramente | Aponta para as regras. O bloco Hosting não é a publicação atual por GitHub Pages. |
| `firebase.test.json` | 235 | Manter | Configura os emuladores usados pelos testes de regras e de senha. |
| `package.json` | 634 | Manter | Comandos de teste, ferramentas e versão funcional. |
| `package-lock.json` | 319.170 | Manter | Fixa as versões necessárias a instalações reproduzíveis. |
| `.gitignore` | 37 | Manter | Evita incluir dependências e arquivos locais gerados no repositório. |
| `tests/regression.test.cjs` | 34.586 | Manter | Verifica comportamentos da aplicação e preservação das correções. |
| `tests/firestore.rules.test.cjs` | 14.947 | Manter | Verifica permissões e proteção de perfis/dados pessoais no emulador. |
| `tests/auth-profile.test.cjs` | 3.528 | Manter | Verifica troca de senha e rejeição da senha atual incorreta no emulador. |
| `README.md` | 35.391 | Resumir e atualizar | Tinha 737 linhas, referências a anexos ausentes e descrições anteriores às últimas correções. |
| `CONTRIBUTING.md` | 2.183 | Atualizar o processo de versões | A regra anterior condicionava incremento de versão à solicitação de release. |
| `docs/cadastro-usuarios.md` | 7.152 | Manter como registro do lote e revisar informações superadas | Explica vínculo por UID, permissões e preservação. O diretório descrito foi alterado pelo lote de perfil. |
| `docs/perfil-pessoal.md` | 6.855 | Manter | Explica foto, senha, dados privados e identificação compartilhada. |
| `docs/correcoes-primeiro-lote.md` | 4.181 | Manter como registro histórico | Pendências e totais de testes retratam o primeiro lote, não o estado atual consolidado. |
| `v0.40/index.html` | 159.761 | Avaliar retirada após comparar recursos | Cópia alternativa antiga, independente da aplicação atual, mas com recursos exclusivos. |
| `v0.40/README.md` | 52.118 | Retirar junto da cópia antiga após decisão | Documenta a implementação alternativa; não deve orientar a operação atual. |

Os tamanhos acima pertencem à base examinada, antes da atualização de README, CONTRIBUTING, versões e criação deste mapa/CHANGELOG.

## O que exige cuidado antes de excluir

Não foi encontrada referência da aplicação principal ou dos testes ao HTML de `v0.40/`. O site principal não o importa. Isso indica independência técnica; não comprova que ninguém utilize o endereço antigo.

Em 20/10/2026, a consulta HTTP confirmou resposta 200 tanto no [site principal](https://arlindossantos-collab.github.io/crm-ati-pe/) quanto no [endereço histórico v0.40](https://arlindossantos-collab.github.io/crm-ati-pe/v0.40/), com as respectivas identificações v0.3.4 e v0.40. A versão alternativa ainda pode ser aberta pela internet.

A comparação estática encontrou 25 nomes de funções definidos na versão antiga e não definidos com o mesmo nome na atual. Parte são auxiliares; não representam necessariamente 25 funcionalidades diferentes.

Exemplos de código que merece comparação funcional:

- recuperação de senha por e-mail (`sendPasswordResetEmail`);
- ficha de presença com QR Code (`abrirFichaPresencaQR`);
- comprovante e cancelamento de inscrição;
- inscrição utilizando `runTransaction`;
- seleção de campos e relatórios de eventos;
- importação/exportação de usuários e manutenção de grupos.

Isso não certifica que os fluxos antigos funcionem com os dados e regras atuais. Não copiar o HTML antigo sobre o atual. A retirada da pasta pode ser feita depois de decidir quais recursos recuperar e de registrar o commit histórico necessário.

O arquivo experimental `gemini-code-1792431399542.html` já havia sido excluído antes desta análise. Não há ação pendente sobre ele.

## Branches

Foram encontradas seis branches. A comparação de ancestralidade confirmou que as cinco branches diferentes de `main` não possuem commits exclusivos fora da `main`.

| Branch | Situação verificada | Proposta |
| --- | --- | --- |
| `main` | Base atual do sistema | Manter. |
| `codex/corrigir-falhas-interface-20261020` | Trabalho integrado; PRs #2 e #5 encerrados | Pode ser removida da lista ativa. |
| `feat/usuarios-internos-externos-grgd-20261020` | PR #3 integrado | Pode ser removida da lista ativa. |
| `fix/rotulo-interno-grgd-20261020` | PR #4 integrado | Pode ser removida da lista ativa. |
| `feat/perfil-pessoal-foto-20261020` | PR #6 integrado | Pode ser removida da lista ativa. |
| `backup/antes-correcoes-20261020` | Referência explícita de retorno para `4497024` | Manter até organizar uma referência histórica e conferir o procedimento de retorno. |

Não havia PR aberto na consulta. O PR #1 de modularização está fechado, não integrado, e sua branch não aparece entre as branches atuais. Não deve ser reaberto automaticamente.

Excluir uma branch integrada remove um nome da lista, não as mudanças já integradas na main. Isso não oferece ganho relevante de espaço neste repositório. O backup de código não substitui backup dos dados do Firebase.

## Documentação e versões

Problemas confirmados antes desta revisão:

1. HTML, `package.json` e raiz do lockfile ainda declaravam v0.3.4.
2. Os últimos lotes adicionaram recursos mantendo essa identificação.
3. O README afirmava existir fallback de perfil após erro, embora o código atual bloqueie perfil ausente/inativo.
4. O README não descrevia adequadamente o novo cadastro e o perfil com foto.
5. O README dizia que regras/testes não haviam sido fornecidos, embora esses arquivos já estejam no repositório.
6. Documentos de lotes anteriores ainda incluem pendências resolvidas por lotes posteriores.
7. Não foram encontradas tags pelo Git nem releases pela consulta do GitHub. Títulos antigos de commits não equivalem a releases.

A proposta **v0.4.0** consolida os recursos recentes da aplicação principal. Não tenta ordenar retroativamente os rótulos históricos incompatíveis entre si.

O novo CHANGELOG começa com uma descrição para a chefia e registra origem, antes/depois, validação, limites e próxima versão sugerida. A primeira publicação formal proposta é **Release 01 — v0.4.0**, sujeita à conferência do histórico imediatamente antes de publicá-la.

## Sequência de execução proposta

1. **Nesta proposta:** sincronizar versão, resumir README, atualizar CONTRIBUTING e registrar CHANGELOG/mapa. Sem exclusões e sem alteração funcional.
2. **Limpeza de branches:** remover as quatro branches concluídas indicadas na tabela, conferindo novamente se não receberam novos commits.
3. **Comparação funcional:** avaliar os recursos exclusivos de `v0.40/`, registrar o que será aproveitado e verificar uso do endereço histórico.
4. **Retirada da cópia antiga:** excluir os dois arquivos de `v0.40/` em uma alteração própria. Manter o commit histórico acessível e conferir os links/publicação.
5. **Documentos históricos:** identificar explicitamente o contexto dos lotes anteriores e manter o estado consolidado no README/CHANGELOG.
6. **Hospedagem:** revisar a configuração alternativa de Firebase Hosting, que aponta `public` para a raiz. Se vier a ser usada, publicar somente os arquivos públicos necessários. A VM futura continua no planejamento, sem migração nesta etapa.

Não excluir testes, lockfile ou regras para reduzir a quantidade de arquivos. Não reescrever o histórico Git ou criar pastas com novas cópias integrais de cada versão. As tags/releases devem guardar os marcos publicados.

## Verificação desta revisão

- Árvore recursiva completa do GitHub e clone local no mesmo commit.
- Leitura de arquivos de configuração, documentação, testes e trechos relevantes das duas implementações.
- Busca de referências aos arquivos históricos, dependências locais e pontos de versão.
- Comparação de ancestralidade de todas as branches e consulta a PRs, tags e releases.
- **54 testes de regressão aprovados** nesta revisão.
- Versões sincronizadas e sintaxe JavaScript válida. Comparação integral confirmou somente versão/comentário/log no HTML, sem alteração funcional, e preservação de dependências, regras, testes e legado.
- Links locais conferidos; README reduzido de 737 para 91 linhas, com link para a versão anterior no histórico Git. Diff sem erros de espaço.
- Nenhum acesso a contas ou dados reais do Firebase; nenhum arquivo ou branch excluído.
