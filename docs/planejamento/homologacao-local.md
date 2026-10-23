# Lote 01 — homologação local com emuladores

Decisão do usuário: manter somente o projeto Firebase de produção, sem criar um segundo projeto hospedado. Para desenvolvimento, usar os emuladores locais com o identificador reservado `demo-prgd-usuarios`. Isso adapta o Lote 01 do plano: não há prévia pública por PR nem projeto Firebase de homologação na nuvem.

## O que foi preparado

- `prepare.cjs` gera a cópia em `.firebase/homologacao/`, caminho já ignorado pelo Git. O `index.html` de produção não é editado.
- O SDK Firebase 10.8.0 vem das dependências locais e é empacotado sem CDN. Configuração e inicialização exigem o projeto demo; Auth principal e auxiliar conectam ao emulador antes do uso. Firestore conecta ao emulador local.
- CSS, Chart.js e fontes também são locais. O servidor responde somente em loopback, sem cache, com CSP que restringe conexões aos emuladores Auth/Firestore. Não usar esse servidor para publicar o sistema.
- `seed.cjs` cria dois órgãos, setores, quatro contas e um evento fictícios. Exige explicitamente os dois hosts locais de emulador; não usa credenciais de produção. Insere apenas documentos ausentes e não apaga dados. Credenciais documentadas aqui são exclusivamente fictícias.
- `smoke.cjs` testa a página gerada com navegador e SDK reais, sem simular Firebase ou interceptar suas requisições. Usa emuladores, não os serviços de produção.

## Preparação

Requisitos: Node 22, Java 21 e dependências do repositório. Neste ambiente, Node está em `/workspace/tools/prgd-node22/node_modules/node/bin`.

```bash
cd /workspace/crm-ati-pe
export PATH=/workspace/tools/prgd-node22/node_modules/node/bin:$PATH
export XDG_CONFIG_HOME=/workspace/.config
export FIREBASE_EMULATORS_PATH=/workspace/.cache/firebase/emulators
export PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright
mkdir -p "$XDG_CONFIG_HOME" "$FIREBASE_EMULATORS_PATH"
npm ci --cache /workspace/.npm
npm install --prefix /workspace/tools/prgd-browser --cache /workspace/.npm --no-package-lock --no-audit --no-fund playwright@1.56.1 esbuild@0.25.12 tailwindcss@3.4.17 chart.js@4.5.1 @fortawesome/fontawesome-free@6.4.0
/workspace/tools/prgd-browser/node_modules/.bin/playwright install chromium
node scripts/homologacao/prepare.cjs
```

Ferramentas adicionais ficam fora do checkout, sem modificar package.json ou package-lock.json. Em outro caminho, PRGD_BROWSER_TOOLS deve apontar ao node_modules dessas ferramentas.

## Inicialização

Na raiz do repositório e com as variáveis acima, iniciar em sessão persistente:

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

E-mails: `admin@example.invalid`, `gestor-a@example.invalid`, `gestor-b@example.invalid` e `sem-vinculo@example.invalid`. Senha local comum: `Ficticio-local-2026!`. Nunca criar essas contas na produção.

Os gestores possuem validade local de 24 horas a partir da primeira carga. O seed não renova nem sobrescreve documentos existentes. Encerrar os emuladores sem exportação descarta a base local; iniciar novamente e executar o seed recria o cenário. Não apontar testes de regras ao mesmo processo de homologação: eles limpam os dados do emulador demo. Encerrar primeiro a homologação e executar as suítes separadamente.

## Validação

Com emuladores e servidor iniciados:

```bash
PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright node scripts/homologacao/smoke.cjs
```

O roteiro valida login no Auth local; cadastro de colaborador pelo gestor; inscrição e cancelamento no Firestore; recusa do gestor A ao consultar órgão B; administrador; pessoa sem vínculo; inicialização recusada para projeto não demo; Auth auxiliar também emulado; telas desktop e celular; ausência de erros JavaScript e de requisições externas.

A repetição cria um colaborador fictício novo, preserva o histórico e cancela a inscrição ao terminar. Se o teste interromper após inscrever, a vaga local pode continuar ocupada: investigar ou reiniciar o cenário descartável, sem limpar qualquer serviço remoto.

Capturas ficam em `test-results/homologacao-emuladores-desktop.png` e `test-results/homologacao-emuladores-celular.png` (ignoradas pelo Git). Os demais testes browser existentes usam Firebase simulado, não emuladores. As duas modalidades são evidências distintas.

## Limites e passagem

Este incremento oferece validação técnica integrada local; não equivale a prévia pública, homologação da GRGD ou backup dos serviços reais. Não houve publicação nem alteração das regras, índices ou configuração de produção. Backup/restauração de Firestore e Authentication de produção continuam pendentes do responsável autorizado. O Lote 00 não está integralmente concluído por causa dessa pendência.

Próximo passo funcional: executar com a GRGD o roteiro de Evento para três órgãos do plano, confirmar campos obrigatórios e transições de estado, registrar divergências e aceite antes de alterar esses fluxos.
