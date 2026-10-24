# Lote 01 — homologação local com emuladores

Decisão do usuário: manter somente o projeto Firebase de produção, sem criar um segundo projeto hospedado. Para desenvolvimento, usar os emuladores locais com o identificador reservado `demo-prgd-usuarios`. Isso adapta o Lote 01 do plano: não há prévia pública por PR nem projeto Firebase de homologação na nuvem.

## O que foi preparado

- `prepare.cjs` gera a cópia em `.firebase/homologacao/`, caminho já ignorado pelo Git. O `index.html` de produção não é editado.
- O SDK Firebase 10.8.0 vem das dependências locais e é empacotado sem CDN. Configuração e inicialização exigem o projeto demo; Auth principal e auxiliar conectam ao emulador antes do uso. Firestore conecta ao emulador local.
- CSS, Chart.js e fontes também são locais. O servidor responde somente em loopback, sem cache, com CSP que restringe conexões aos emuladores Auth/Firestore. Não usar esse servidor para publicar o sistema.
- `seed.cjs` cria três órgãos, setores, cinco contas e um evento fictícios. Exige explicitamente os dois hosts locais de emulador; não usa credenciais de produção. Insere apenas documentos ausentes e não apaga dados. Credenciais documentadas aqui são exclusivamente fictícias.
- `smoke.cjs` testa a página gerada com navegador e SDK reais, sem simular Firebase ou interceptar suas requisições. Usa emuladores, não os serviços de produção.

## Preparação

Requisitos: Node 22, Java 21 e bibliotecas de sistema do Chromium. As ferramentas têm versões fixadas no package.json e no lockfile; a instalação externa em `/workspace/tools` deixou de ser necessária.

```bash
npm ci
npx --no-install playwright install chromium
npm run homologacao:iniciar
```

Abrir `http://127.0.0.1:4173`. O comando prepara os ativos, inicia Auth/Firestore, aguarda os serviços, insere dados fictícios e inicia o servidor. Ctrl+C encerra a sessão descartável. Se outra sessão estiver usando as portas, a inicialização é recusada; não se apagam dados para liberar portas. A cópia e os caches dos emuladores ficam em `.firebase/`, ignorada pelo Git.

Em ambientes com diretório pessoal restrito, definir `npm_config_cache=/workspace/.npm` e `PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright` antes de instalar e testar. `XDG_CONFIG_HOME` e `FIREBASE_EMULATORS_PATH` permitem outros caminhos graváveis; não mudar HOME. No Linux, se faltarem bibliotecas de sistema, usar `npx --no-install playwright install --with-deps chromium` em uma máquina com permissão para instalar pacotes.

`PRGD_BROWSER_TOOLS` continua disponível para instalações externas legadas. Sem essa variável, scripts usam as dependências do checkout.

## Inicialização

O comando único acima é o caminho recomendado. Para diagnóstico manual, pode-se preparar a cópia com `npm run homologacao:preparar` e iniciar os componentes separadamente:

```bash
node_modules/.bin/firebase emulators:start --config firebase.homologacao.json --only auth,firestore --project demo-prgd-usuarios
```

Aguardar a mensagem `All emulators ready`. Em outra sessão:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 node scripts/homologacao/seed.cjs
node scripts/homologacao/serve.cjs
```

O servidor da cópia usa a porta local 4173. Este ambiente de onboarding não oferece link de prévia navegável ao usuário. Não expor portas nem publicar a cópia automaticamente. O aceite funcional da GRGD continua pendente.

## Contas fictícias

E-mails: `admin@example.invalid`, `gestor-a@example.invalid`, `gestor-b@example.invalid`, `gestor-c@example.invalid` e `sem-vinculo@example.invalid`. Senha local comum: `Ficticio-local-2026!`. Nunca criar essas contas na produção. Os gestores têm acesso somente aos órgãos A/B/C e setores a1/b1/c1, respectivamente.

Os gestores possuem validade local de 24 horas a partir da primeira carga. O seed não renova nem sobrescreve documentos existentes. Encerrar os emuladores sem exportação descarta a base local; iniciar novamente e executar o seed recria o cenário. Não apontar testes de regras ao mesmo processo de homologação: eles limpam os dados do emulador demo. Encerrar primeiro a homologação e executar as suítes separadamente.

## Validação

Para uma sessão automática independente, encerrar a homologação manual e executar:

```bash
npm run test:homologacao
```

O comando prepara uma sessão nova, executa smoke e piloto, devolve falha se algum cenário falhar e encerra os serviços. Também é executado no CI. O smoke valida login no Auth local; cadastro de colaborador pelo gestor; inscrição e cancelamento no Firestore; recusa do gestor A ao consultar órgão B; administrador; pessoa sem vínculo; inicialização recusada para projeto não demo; Auth auxiliar também emulado; telas desktop e celular; ausência de erros JavaScript e de requisições externas.

O novo `piloto.cjs` cadastra um evento pela interface para três órgãos, ocupa três vagas, verifica cancelamento, duplicidade recusada, reinscrição com mesmo protocolo, recusa de leitura de inscrição entre órgãos, CSV com duas confirmadas e uma cancelada, auditoria e encerramento do recebimento de inscrições. Usa SDK real, sem interceptar Firebase; observa erros JavaScript e requisições externas. Não registra realização ou presença, nem substitui o aceite GRGD.

O smoke cria um colaborador novo e cancela sua inscrição ao terminar. O piloto deixa duas inscrições confirmadas e uma cancelada, com histórico, no evento de teste encerrado para novas inscrições. O comando automático descarta toda a sessão ao encerrar. Em execução manual, se um roteiro interromper após inscrever, investigar ou reiniciar o cenário descartável, sem limpar qualquer serviço remoto.

Capturas ficam em `test-results/` (ignoradas pelo Git). O piloto gera também `piloto-tres-orgaos.csv` e `piloto-tres-orgaos.json`, com dados fictícios e resultado técnico. O CI guarda os arquivos no artefato `interface-prgd`. Os demais testes browser existentes usam Firebase simulado, não emuladores. As duas modalidades são evidências distintas.

## Limites e passagem

Este incremento oferece validação técnica integrada local; não equivale a prévia pública, homologação da GRGD ou backup dos serviços reais. Não houve publicação nem alteração das regras, índices ou configuração de produção. Backup/restauração de Firestore e Authentication de produção continuam pendentes do responsável autorizado. O Lote 00 não está integralmente concluído por causa dessa pendência.

Próximo passo funcional: executar com a GRGD o [roteiro de aceite de Eventos](roteiro-aceite-eventos.md), confirmar campos obrigatórios e transições de estado, registrar divergências e aceite antes de alterar esses fluxos.
