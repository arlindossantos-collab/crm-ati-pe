# Evidências da continuidade — Lotes 00/01

Execução em 23/10/2026, horário de São Paulo (UTC−03), sobre `d965a91771f7f1be9cd6d2299819dc0b866aab6c`, v0.14.1. Base conferida com a main remota antes das alterações e novamente antes da entrega. Node 22.23.4, Java 21, Playwright 1.56.1 e SDK Firebase 10.8.0.

## Preservação do código

Criados `codigo.bundle` e `codigo.tar.gz` em `/workspace/preservation/prgd-d965a91/`. O bundle foi verificado e clonado em `restauracao/`; o HEAD restaurado é o commit acima e `index.html` confere byte a byte. `git fsck --full` concluiu sem corrupção; referências históricas dangling não são falha de recuperação.

| Artefato | SHA-256 |
| --- | --- |
| `codigo.bundle` | `145dbca6369831c15bdc5604a6ee9f8b92f9851471b17b8f08f7ee7db4c9bc22` |
| `codigo.tar.gz` | `9fb36415dc3ffd7a5e71f0b18e58801af9c0ca880dbcb9e9584bfc07d3babf74` |
| PDF fornecido | `936bb69b29d5ecf184bf8ae0c7b5a0f62319d93ca69d4580cdd6e9f4c4645879` |

É uma cópia local temporária de código/histórico. Não inclui Firestore, Authentication, arquivos externos, configuração de serviços ou segredos; não garante armazenamento externo durável. A recuperação dos serviços reais continua pendente.

## Verificações

| Verificação | Resultado |
| --- | --- |
| `npm ci` | Instalação limpa concluída pelo lockfile, com 733 pacotes |
| `npm test` | 131 aprovados; zero falhas/ignorados |
| `npm run test:rules` | 82 aprovados; zero falhas/ignorados |
| `npm run test:auth` | 3 aprovados; zero falhas/ignorados |
| Sete suítes browser existentes | Todas aprovadas com Firebase simulado e CSS local |
| `npm run test:homologacao` | Smoke e piloto com três órgãos aprovados; SDK real e emuladores Auth/Firestore |
| Proteções de inicialização | Host remoto, argumentos de projeto e porta ocupada recusados antes da preparação |
| Preservação de produção | `git diff --exit-code HEAD -- index.html firestore.rules firestore.indexes.json firebase.json` sem diferenças |
| Lockfile | Nenhuma versão transitiva preexistente alterada; ferramentas novas fixadas |
| `git diff --check` | Sem erros |

O piloto terminou às 21:01:24 de 23/10/2026 (São Paulo), com **zero requisições externas do navegador e zero erros JavaScript**. As requisições Firebase não foram interceptadas. Validou cadastro de evento e participantes, três vagas, cancelamento e reinscrição, duplicidade recusada, leitura entre órgãos recusada pelas regras, protocolos, auditoria e encerramento do recebimento de inscrições.

O CSV contém três participantes fictícios: A e C confirmados, B cancelado; o contador final é 2/3. Inscrição não foi tratada como presença. Capturas desktop/celular, CSV e relatório JSON estão em `test-results/`, ignorado pelo Git e coletado como artefato `interface-prgd` no CI.

A primeira execução do piloto abriu o formulário antes do carregamento dos órgãos. O roteiro passou a aguardar os três cadastros na interface antes de abrir o formulário. A repetição completa foi aprovada; não foi necessária alteração na aplicação.

## Reproduzir e avaliar

Seguir [homologação local](homologacao-local.md) para instalação e comandos únicos. Testes de regras, Auth e homologação devem executar sequencialmente, pois compartilham portas do Firebase. As suítes browser existentes usam simulação e são distintas do novo piloto integrado.

O workflow foi ampliado para executar o mesmo comando de integração depois de instalar ferramentas pelo lockfile. O resultado remoto fica nos checks da PR; esta evidência descreve a execução local.

Sem homologação GRGD, validação de dados legados, teste de concorrência no novo piloto, presença, publicação ou recuperação dos serviços reais. O [backlog](backlog.md) mantém essas pendências e o [roteiro de aceite](roteiro-aceite-eventos.md) está preparado para o responsável funcional.
