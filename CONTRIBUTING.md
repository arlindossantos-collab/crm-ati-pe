# Fluxo de alterações da PRGD

## Base atualizada e preservação

Antes de editar, consultar o código atual da branch alvo no GitHub e registrar o commit de origem. Preservar funcionalidades, telas e campos existentes; diferenças entre versões precisam ser identificadas antes da edição.

A separação foi autorizada pelo usuário na proposta v0.17.0. Fontes vivem em src, com templates/CSS separados, módulos ES por responsabilidade e uma única fronteira Firebase. Não recolocar lógica/CSS no index.html nem copiar código legado para a aplicação sem comparação e testes.

## Descrição de cada alteração

Cada commit deve ter título objetivo e descrição proporcional à mudança:

- **Antes:** falha ou comportamento anterior.
- **Depois:** comportamento após o ajuste e benefício para quem usa o sistema.
- **Validação:** verificações executadas e seus limites.
- **Pendências:** itens relevantes que continuam abertos.

A proposta deve apresentar o mesmo contexto para quem não acompanhou a conversa. Não reescrever commits já enviados apenas para trocar a descrição; complementar a documentação quando necessário.

## Versão em cada entrega

Cada entrega funcional destinada à publicação deve atualizar a versão e registrar suas mudanças. A atualização não pode ficar condicionada à criação de uma página de release.

- Correção de comportamento: incrementar a parte final, como `0.4.0 → 0.4.1`.
- Nova funcionalidade: incrementar a parte intermediária, como `0.4.0 → 0.5.0`.
- Mudança incompatível: avaliar previamente impacto nos dados e acessos. O projeto permanece em desenvolvimento na série `0.x`; a passagem a `1.0.0` precisa ser uma decisão explícita.
- Commits intermediários da mesma entrega não exigem versões diferentes.
- Alterações exclusivamente documentais podem manter a versão funcional, mas devem ser descritas.
- Não usar nomes de pastas antigas nem títulos isolados de commits como fonte da versão oficial.

Sincronizar antes da publicação:

1. `package.json`: campo `version`.
2. `package-lock.json`: versão da raiz e de `packages[""]`; não alterar dependências sem necessidade.
3. `index.html`, templates de sessão/cabeçalho e `src/app/bootstrap.js`: identificação visual e log de inicialização.
4. `README.md`: versão do código e resumo coerente com os recursos presentes.
5. `CHANGELOG.md`: versão, antes/depois, validação e pendências.

O histórico deve começar por um resumo em linguagem simples para a gestão. Separar funcionalidades novas de recursos já integrados cuja numeração está sendo regularizada. Registrar relatos do usuário como relatos, sem apresentá-los como uma homologação integral.

## Revisão e publicação

Preparar alterações em branch própria, conferir preservação e validar os fluxos afetados. Disponibilizar uma prévia adequada quando solicitada, distinguindo demonstração de homologação integrada.

Commit, integração à main, publicação do site e release são etapas distintas. Autorização para commit não autoriza automaticamente integrar ou publicar. A versão de uma proposta não deve ser apresentada como já disponível no site.

Publicar somente dist, gerado por npm run build. Pages deve usar GitHub Actions e o workflow pages.yml; antes da primeira integração desta arquitetura, ajustar a fonte do serviço com autorização. Firebase Hosting também aponta para dist. Não publicar a raiz do checkout nem copiar templates-fonte como site final. Alterações em regras exigem publicação separada no Firebase; informar quando não mudaram.

## Releases

Ao publicar uma release autorizada:

1. Consultar o histórico real de releases e tags, incluindo eventuais rascunhos.
2. Usar a próxima sequência confirmada e a versão funcional já conferida.
3. Nomear a publicação como **Release NN — vX.Y.Z**, como `Release 01 — v0.4.0`.
4. Associar a tag `vX.Y.Z` ao commit final integrado e revisado, nunca a um commit anterior por conveniência.
5. Usar as notas correspondentes do CHANGELOG, com resumo para a chefia, antes/depois, testes, limites, implantação e próxima versão apenas como proposta.
6. Atualizar o estado das notas de proposta para publicada e registrar a data efetiva. Não inventar releases retroativas para commits sem publicação formal.
7. Conferir separadamente a versão servida pelo site; uma release no GitHub não implanta as regras do Firebase.

## Limpeza do repositório

Consultar [o mapa de organização](docs/mapa-organizacao.md) antes de excluir arquivos ou branches. Verificar referências e recursos exclusivos das versões históricas.

Remover uma branch integrada não substitui backup dos dados. Preservar commits e referências necessárias ao retorno. Não reescrever o histórico Git para reduzir um repositório pequeno.

## Validação da estrutura modular

Use Node 22/npm ci. Execute npm run check, npm test, npm run build, testes de regras/Auth em emuladores separados e npm run test:browser (Chromium instalado). npm run test:deploy é opcional quando Docker local estiver disponível e valida os templates/staging descartáveis. Não executar as suítes de regras no mesmo emulador usado para uma demonstração que deva conservar dados fictícios.

Não adicionar SDK Firebase em outro módulo: importe src/services/firebase.js. Estado transitório em app/state não substitui validação/autorização do servidor. Novos módulos devem declarar imports; o check rejeita nomes sem origem e dependências fora da fronteira. A compatibilidade VM dos testes usa as fontes reais com acessores para os nomes legados; o navegador exerce imports ES reais.

Mudanças para PostgreSQL/LDAP devem preservar IDs, modelos de inscrição e auditoria, com staging e reconciliação. Ler docs/migracao antes de conectar serviços institucionais. Exemplos de .env são contratos de requisitos; nunca preencher valores secretos no Git.

## Integração de propostas encadeadas

As PRs #26 e #27 foram preparadas em cadeia. O usuário autorizou integrar e publicar todas as pendentes em 25/10/2026, substituindo a orientação anterior de mantê-las pendentes. A PR #27 contém a reorganização da #26 e é direcionada à main para a integração conjunta, com merge commit e conferência das PRs anteriores.

Próximos incrementos podem partir da ponta da proposta anterior, preservando a cadeia e permitindo revisar somente cada diferença. Na autorização para integrar o conjunto, conferir o diff acumulado contra main, o estado remoto e o CI; evitar squash/reaplicação duplicada. Pages precisa usar Actions antes de integrar esta arquitetura. [Publicação conjunta](docs/publicacao-v0171.md).
