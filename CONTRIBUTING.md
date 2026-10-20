# Fluxo de alterações da PRGD

## Base atualizada e preservação

Antes de editar, consultar o código atual da branch alvo no GitHub e registrar o commit de origem. Preservar funcionalidades, telas e campos existentes; diferenças entre versões precisam ser identificadas antes da edição.

A aplicação permanece em um único HTML enquanto a separação em módulos estiver adiada. Não aplicar automaticamente a proposta de modularização.

## Descrição de cada alteração

Cada commit deve ter um título objetivo e uma descrição proporcional à mudança:

- Antes: falha ou comportamento anterior.
- Depois: comportamento após o ajuste.
- Validação: verificações executadas e seus limites.
- Pendências: itens relevantes que continuam abertos.

A proposta de alteração deve apresentar o mesmo contexto para quem não acompanhou a conversa. Evitar commits vazios ou reescrever commits já enviados somente para alterar a descrição; complementar a documentação e a proposta quando necessário.

## Revisão e publicação

Preparar alterações em branch própria, conferir preservação e validar os fluxos afetados. Disponibilizar uma prévia adequada quando solicitada, distinguindo demonstração de homologação integrada.

Commit, integração à main e publicação são etapas distintas. Não interpretar autorização para commit como autorização automática para integrar ou publicar.

## Releases

Quando houver solicitação de release:

1. Consultar o histórico de releases, tags e a versão oficial da aplicação.
2. Definir a próxima versão e a sequência sem usar automaticamente nomes de arquivos alternativos como versão oficial.
3. Nomear a publicação no padrão Release NN — vX.Y.Z, usando a sequência seguinte do histórico confirmado.
4. Informar versão anterior, nova versão, correções, antes/depois, validação, limitações e instruções relevantes de implantação.
5. Associar a release ao commit revisado e à tag correspondente.
6. Registrar a próxima versão planejada como proposta quando ainda não estiver aprovada.

Não criar release ou incrementar a versão como efeito colateral de um commit comum.
