# Linha de base — Lote 00

Execução em 23/10/2026, base 4cb768a, Node 22.23.4 e Java 21.

| Verificação | Resultado |
| --- | --- |
| npm ci | Dependências instaladas; lockfile preservado |
| npm test | 125 aprovados; 0 falhas e 0 ignorados |
| npm run test:rules | 82 aprovados; 0 falhas e 0 ignorados |
| npm run test:auth | 3 aprovados; 0 falhas e 0 ignorados |
| Bundle Git e restauração | Verificação, clone, HEAD, fsck e comparação de index.html concluídos |
| Sete suítes browser do CI | Não executadas neste incremento documental |
| Homologação funcional GRGD | Não realizada |
| Backup/restauração Firestore e Authentication reais | Não realizados |

As três suítes de testes terminaram com código 0. As duas suítes Firebase usaram o projeto `demo-prgd-usuarios` e emuladores locais, sem login no Firebase real. O teste de regras usa Firestore; o de autenticação usa Authentication.

A primeira instalação usou Node 24 e emitiu aviso de incompatibilidade de superstatic. Foi instalado Node 22 fora do checkout e as três suítes foram executadas com ele. A primeira tentativa dos emuladores falhou ao gravar caches/configuração no diretório pessoal; os caminhos suportados FIREBASE_EMULATORS_PATH e XDG_CONFIG_HOME corrigiram o problema. Não foi necessário fornecer token ou desativar verificações de download/TLS.

## Reproduzir as verificações neste ambiente

```bash
cd /workspace/crm-ati-pe
export PATH=/workspace/tools/prgd-node22/node_modules/node/bin:$PATH
export XDG_CONFIG_HOME=/workspace/.config
export FIREBASE_EMULATORS_PATH=/workspace/.cache/firebase/emulators
npm test
npm run test:rules
npm run test:auth
```

Executar os emuladores sequencialmente: compartilham as portas do hub. Não publicar HTML, regras ou índices como parte desses comandos. Não interpretar estes resultados como validação de dados legados ou aceite do piloto.

Os logs desta execução estão em /tmp/prgd-regression.log, /tmp/prgd-rules.log e /tmp/prgd-auth.log; são evidências locais temporárias.

## Atualização — incremento do Lote 01

Após preparar a cópia local:

- As sete suítes browser do CI passaram (locais, seguranca-sessao, perfis, inscricoes, portal-nsi, layout-perfis e usuarios-colaboradores), com Firebase simulado e CSS local. Os resultados anteriores de “não executadas” acima se referem ao incremento inicial.
- A regressão foi repetida: 125 aprovados, sem falhas ou ignorados.
- O novo smoke integrado passou com SDK Firebase real e emuladores Auth/Firestore: cadastro, inscrição, cancelamento, recusa entre órgãos, perfis, Auth auxiliar e projeto não demo rejeitado. Zero requisições externas observadas; sem erros JavaScript.
- Geração da cópia e seed foram executados novamente para verificar repetibilidade; o smoke também passou novamente após incluir os testes do Auth auxiliar e de projeto não demo.
- Produção: index.html, firestore.rules, firestore.indexes.json, package.json e package-lock.json sem alterações.
- A primeira tentativa do novo smoke clicava antes de o módulo local estar pronto. O teste passou a aguardar __PRGD_MODULE_OK antes de interagir; a aplicação não precisou de alteração.

Não há aceite funcional GRGD, teste de dados legados ou backup/restauração dos serviços reais nesta atualização.
