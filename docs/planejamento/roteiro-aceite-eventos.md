# Roteiro de aceite — Eventos com três órgãos

Estado: preparado para execução pela GRGD; aceite funcional não realizado. Usar exclusivamente `npm run homologacao:iniciar`, dados fictícios e as contas da [homologação local](homologacao-local.md).

## Identificação da avaliação

- Responsável funcional GRGD e apoio técnico: a designar.
- Commit avaliado: preencher com `git rev-parse HEAD`.
- Data, navegador e tamanho de tela: preencher na execução.
- Evidências e divergências: registrar por cenário abaixo.

## Cenários

| ID | Ação | Resultado esperado | Decisão GRGD |
| --- | --- | --- | --- |
| H01 | Administrador cadastra evento, data, local, situação, período, três vagas e órgãos A/B/C | Campos representam o processo real; IDs preservam os vínculos | Pendente |
| H02 | Cada gestor cadastra participante no próprio setor | Cadastro não cria conta de acesso; outro órgão/setor não é exposto | Pendente |
| H03 | A, B e C inscrevem seus participantes | Três protocolos; contador 3/3; autoria e histórico registrados | Pendente |
| H04 | Tentar nova inscrição com lotação e depois duplicar participante com vaga livre | Operação indevida recusada; contador e inscrição anterior preservados | Pendente |
| H05 | B cancela e reinscreve a mesma pessoa | Vaga liberada/ocupada corretamente; mesmo protocolo e histórico preservado | Pendente |
| H06 | B cancela novamente; administrador exporta CSV | Três linhas: duas confirmadas e uma cancelada, sem comprovação de presença | Pendente |
| H07 | Administrador encerra recebimento de inscrições | Portal reflete encerramento; registros e relatório continuam consultáveis | Pendente |
| H08 | Consultar comprovante, recarregar e sair/entrar em desktop e celular | Situação correta; sessões e perfis preservados; interface utilizável | Pendente |
| H09 | Registrar processo de divulgação, realização, presença e fechamento | Definir requisitos e responsáveis; não marcar presença pela inscrição | Pendente |

O teste automático cobre parte de H01–H07. H08 também requer avaliação humana de uso; H09 exige definição funcional. Concorrência de inscrições, infraestrutura e dados legados têm verificações próprias e não devem ser aprovados apenas por este roteiro.

## Decisões a registrar

1. Campos obrigatórios, origem das informações e responsável pelo evento.
2. Situações e transições permitidas; quando divulgar, cancelar, realizar e encerrar.
3. Perfis autorizados a cadastrar, editar, inscrever, cancelar e exportar.
4. Necessidade de presença nesta fase, quem registra e como justificar correções.
5. Regras de guarda e compartilhamento de relatórios com dados pessoais.

## Registro de divergência e aceite

Para cada achado: cenário, perfil, passos, resultado esperado/obtido, gravidade, captura, responsável e reteste. Usar dados fictícios nas evidências.

Decisão final: **pendente**. Aprovação/reprovação, nome do responsável, data, commit e pendências devem ser preenchidos pelo responsável funcional. Falha crítica ou bloqueante exige correção e nova avaliação. O sucesso dos testes automatizados não preenche este aceite.
