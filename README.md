# PRGD — Plataforma de Relacionamento do Governo Digital

Sistema da GRGD/ATI-PE para órgãos, colaboradores, acessos, eventos, inscrições e cadastros de apoio.

**Proposta v0.17.0 — organização modular e preparação de migração. Ainda não publicada.** A versão pública confirmada é a v0.16.0, integrada no [PR #25](https://github.com/arlindossantos-collab/crm-ati-pe/pull/25), com [Pages verificado](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/40131869055). [Histórico](CHANGELOG.md).

## Onde está cada responsabilidade

| Caminho | Conteúdo |
| --- | --- |
| index.html | Shell curto; inclui templates no build, sem lógica/CSS inline |
| src/views/ | Telas, navegação e modais, com os IDs preservados |
| src/styles/ | Estilos próprios e impressão |
| src/modules/ | Acessos, perfil, órgãos, colaboradores, eventos, inscrições, auditoria, demandas, locais e apoio |
| src/domain/ | Agenda e CSV sem dependência de DOM/Firebase |
| src/services/ | Fronteira única Firebase e assinaturas dos dados |
| src/app/ | Estado transitório, inicialização, listeners e formulários compartilhados |
| public/ | Prévia fictícia e orientação para a versão histórica |
| scripts/ | Build, validação, homologação e auditoria offline da migração |
| deploy/ | Templates Nginx, staging PostgreSQL e contrato de variáveis do futuro servidor |
| tests/ | Regressão, contratos de build/migração, regras, Auth e navegador |
| docs/ | Arquitetura, auditorias, migração e decisões/histórico de lotes |
| dist/ | Artefato gerado; único diretório publicável, fora do Git |

O código antigo de v0.40 foi retirado da árvore ativa após comparação. A [auditoria do legado](docs/auditoria-legado.md) registra recursos exclusivos e a referência Git para recuperação. A URL histórica recebe uma página informativa sem acesso ao Firebase. A [prévia de perfis](public/previa-perfis.html) continua preservada e sem conexão a serviços.

## O que está implementado

- Cadastros institucionais, setores e colaboradores; participante não recebe conta automaticamente.
- Contas de acesso, vínculos, escopo por órgão/setor e projeções de contatos, com auditoria.
- Eventos e agenda, busca/filtros, inscrições institucionais, cancelamento/reinscrição, vagas transacionais e comprovantes.
- Painel administrativo de inscrições e relatórios CSV, sem inferir comparecimento.
- Demandas, Locais, Fornecedores e Bases preservados.
- Perfil, foto, troca de senha, restauração da sessão e limpeza de dados ao perder acesso.

Essas capacidades têm cobertura técnica; não são uma declaração de homologação integral da GRGD, dados legados ou infraestrutura institucional. Consulte [o que foi verificado e seus limites](docs/auditoria-testes.md).

## Desenvolver e testar com isolamento

Requisitos: Node.js 22 (ver .nvmrc), npm e Java 21 para emuladores. Docker é opcional para os ensaios de Nginx/PostgreSQL. Dependências ficam fixadas no lockfile.

```bash
npm ci
npm run check
npm run build
npm test
npm run test:rules
npm run test:auth
npx playwright install chromium
npm run test:browser
npm run test:integration
```

O build é estático, com JavaScript, SDK, CSS, fontes e gráficos locais. Não exige CDN para carregar os recursos da interface. **O modo de produção ainda depende do Firebase para autenticação e dados**; fotos/URLs cadastradas também podem depender de serviços externos.

Para desenvolvimento funcional, usar emuladores. Em um terminal, aguardar a prontidão:

```bash
npx firebase emulators:start --config firebase.homologacao.json --only auth,firestore --project demo-prgd-usuarios
```

Em outro terminal, preparar a base fictícia e iniciar o front:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 node scripts/homologacao/seed.cjs
npm run dev
```

O servidor local usa a porta 4173 e recompila as fontes; atualizar o navegador após a mensagem de build. Nunca apontar testes de escrita ao projeto real. Testes de regras limpam a base demo: encerrá-la antes de rodar suítes isoladas. [Homologação local](docs/planejamento/homologacao-local.md).

## Publicar e preparar a VM

Publicar somente dist, conforme [CONTRIBUTING](CONTRIBUTING.md). A reorganização muda o Pages para artefato de GitHub Actions; a configuração do serviço deve ser ajustada com autorização antes de integrar. Firebase Hosting também passa a usar dist. Site e regras/índices são publicações diferentes; regras e índices não foram alterados nesta proposta.

Os templates Nginx suportam raiz/subcaminho, assets relativos e 404. `npm run test:deploy` ensaia Nginx e staging PostgreSQL em containers descartáveis sem publicar portas. [VM e retorno](docs/migracao/vm.md).

## PostgreSQL e LDAP: preparado não significa migrado

A base atual continua Firebase Authentication/Firestore. Foram preparados mapeamento, auditor offline de exportação tipada, staging PostgreSQL, contratos de identidade e variáveis do futuro backend. Não há API SQL/LDAP operacional nem migração automática.

```bash
npm run audit:export -- --input /caminho-protegido/exportacao.json
```

LDAP deve ser integrado por servidor seguro/LDAPS ou por provedor institucional OIDC. Não colocar senha de bind ou credencial PostgreSQL no navegador/Git. IDs, pessoas, contas, vínculos e histórico exigem reconciliação; nomes/e-mails não unem registros automaticamente.

[Preparação da migração](docs/migracao/README.md) · [Dados/PostgreSQL](docs/migracao/dados-postgresql.md) · [Identidade](docs/migracao/identidade.md) · [Mapa atual](docs/mapa-organizacao.md).

Backups reais, restauração, endpoints/certificados, modelo institucional, MFA/recuperação e aceite operacional ainda precisam da ATI/GRGD. As referências de entregas antigas permanecem em docs e no CHANGELOG; números de testes/publicação desses documentos retratam a época de cada lote.
