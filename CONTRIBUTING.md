# Fluxo de alterações da PRGD

## Base atualizada e preservação

Antes de editar, consultar o código atual da branch alvo no GitHub e registrar o commit de origem. Preservar funcionalidades, telas e campos existentes; diferenças entre versões precisam ser identificadas antes da edição.

A aplicação permanece em um único HTML enquanto a separação em módulos estiver adiada. Não aplicar automaticamente a proposta de modularização.

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
3. `index.html`: comentário inicial, tela de login, cabeçalho, comentário do script e log de inicialização.
4. `README.md`: versão do código e resumo coerente com os recursos presentes.
5. `CHANGELOG.md`: versão, antes/depois, validação e pendências.

O histórico deve começar por um resumo em linguagem simples para a gestão. Separar funcionalidades novas de recursos já integrados cuja numeração está sendo regularizada. Registrar relatos do usuário como relatos, sem apresentá-los como uma homologação integral.

## Revisão e publicação

Preparar alterações em branch própria, conferir preservação e validar os fluxos afetados. Disponibilizar uma prévia adequada quando solicitada, distinguindo demonstração de homologação integrada.

Commit, integração à main, publicação do site e release são etapas distintas. Autorização para commit não autoriza automaticamente integrar ou publicar. A versão de uma proposta não deve ser apresentada como já disponível no site.

GitHub Pages publica os arquivos do site. Alterações em regras exigem publicação separada no Firebase, coordenada com o HTML. Informar explicitamente quando as regras não mudaram e não precisam ser republicadas.

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
