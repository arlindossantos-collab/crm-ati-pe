# Homologação local com emuladores

Procedimento atualizado na proposta v0.17.0. O usuário decidiu manter somente o projeto Firebase hospedado de produção. O desenvolvimento usa os emuladores locais com o identificador reservado `demo-prgd-usuarios`; não cria um segundo projeto na nuvem nem altera os dados reais.

## Preparação

Requisitos: Node 22, npm e Java 21. Instale na raiz do repositório:

```bash
npm ci
npx playwright install chromium
```

Em ambientes gerenciados, preservar as variáveis de proxy e os certificados. Caches/configuração devem usar diretórios graváveis; XDG_CONFIG_HOME, FIREBASE_EMULATORS_PATH e PLAYWRIGHT_BROWSERS_PATH podem ser configurados conforme o ambiente. Não é necessário instalar ferramentas em outro projeto ou prefixo: as versões estão fixadas no lockfile deste repositório.

## Inicialização

No primeiro terminal:

```bash
npx firebase emulators:start --config firebase.homologacao.json --only auth,firestore --project demo-prgd-usuarios
```

Aguardar `All emulators ready`. Em outro terminal:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 node scripts/homologacao/seed.cjs
npm run dev
```

O servidor responde em loopback na porta 4173. O watcher recompila src e o shell ao salvar; atualizar o navegador após a mensagem de build. Para validar apenas um artefato estável, substituir npm run dev por:

```bash
node scripts/homologacao/prepare.cjs
node scripts/homologacao/serve.cjs
```

prepare.cjs chama o mesmo build da produção em modo demo. A saída .firebase/homologacao/ é ignorada pelo Git. O SDK único, gráficos, estilos e fontes são locais. O adaptador recusa outro projeto e conecta Auth principal/auxiliar e Firestore aos emuladores antes do uso. A página mostra uma faixa de dados fictícios. O servidor aplica CSP que restringe conexões aos emuladores; não é um servidor de produção.

seed.cjs exige os dois hosts locais, cria somente documentos ausentes e não apaga dados. Contas fictícias: `admin@example.invalid`, `gestor-a@example.invalid`, `gestor-b@example.invalid` e `sem-vinculo@example.invalid`. Senha exclusivamente local: `Ficticio-local-2026!`.

Os vínculos dos gestores duram 24 horas desde a primeira carga. O seed não renova registros existentes. Encerrar os emuladores sem exportar descarta a base; iniciar novamente e executar o seed recria o cenário.

## Validação integrada

Com servidor e emuladores prontos:

```bash
node scripts/homologacao/smoke.cjs
```

O roteiro usa navegador e SDK Firebase reais contra emuladores, sem substituir as respostas Firebase. Verifica login, colaborador do gestor, inscrição/cancelamento e auditoria, isolamento entre órgãos, administrador e painel de inscrições, usuário sem vínculo, recusa de projeto não demo, Auth auxiliar, desktop/celular e ausência de requisições externas/erros JavaScript. Capturas ficam em test-results/.

A repetição cria outro colaborador fictício e termina com a inscrição cancelada. Se interromper após a inscrição, investigar a vaga local ou reiniciar o cenário descartável. Nunca apontar este roteiro para serviços remotos.

Para um ensaio automático descartável, encerrar antes o servidor local e os emuladores e executar `npm run test:integration`. Esse comando inicia os emuladores, gera o artefato, prepara a base fictícia, testa com SDK real e encerra os processos que criou. Ele também integra o CI.

## Outras suítes

Encerrar os emuladores de demonstração antes de executar regras e Auth: as suítes isoladas usam o mesmo identificador demo e limpam os dados.

```bash
npm run check
npm run build
npm test
npm run test:rules
npm run test:auth
npm run test:browser
```

Os testes de navegador por módulo substituem somente o adaptador Firebase e exercem os imports ES reais. Eles não comprovam a integração com o serviço. O smoke acima cobre o artefato empacotado com SDK real; são evidências complementares.

## Limites

Emuladores não comprovam configuração, índices efetivos ou restauração dos serviços de produção. Não há prévia pública por PR nem acesso institucional nesta validação. Backup real de Auth/Firestore, roteiro com a GRGD e aceite funcional continuam pendentes. A limpeza não altera regras, índices ou dados remotos. Veja [auditoria técnica](../auditoria-testes.md) e [preparação de migração](../migracao/README.md).
