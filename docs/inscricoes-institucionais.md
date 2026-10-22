# Colaboradores e inscrições institucionais — v0.10.0

Proposta do segundo lote, baseada em `main@d033b8f2b2f76a414a170f7904821357b2b60485` (v0.9.0). Entrega em branch/PR para revisão, sem publicação do HTML ou das regras institucionais. A aplicação continua em um único HTML, como definido em CONTRIBUTING.md.

## Fluxo de operação

1. O administrador revisa as aprovações GRGD/autoridade, os setores, os prazos e as ações do gestor. Marca **Habilitar cadastro e inscrições institucionais após revisão das aprovações**. A alteração retorna o vínculo a pendente e limpa as referências anteriores; as evidências revisadas precisam ser registradas antes da liberação.
2. O gestor abre **Colaboradores**, cadastra nome, e-mail institucional, setor, telefone e cargo/função. Órgão vem do vínculo aprovado. A pessoa não recebe conta nem senha.
3. A GRGD/administração cria um **novo evento**, habilita o modelo institucional e informa órgãos elegíveis, início/fim das inscrições e total de vagas. A lista de órgãos depende da permissão de consulta aos órgãos.
4. Em **Eventos**, o gestor escolhe **Inscrever colaborador**. Somente colaboradores ativos no seu órgão/setores e eventos elegíveis entram no fluxo.
5. **Inscrições do órgão** apresenta beneficiário, evento, situação e protocolo. Cancelar preserva o registro, grava a autoria e libera uma vaga. É possível reinscrever o mesmo colaborador após cancelamento, mantendo o protocolo.
6. **Comprovante** consulta novamente o registro no servidor. **Imprimir / salvar PDF** atualiza a consulta antes de abrir a impressão do navegador. O usuário escolhe o destino PDF no diálogo de impressão.

## Aprovação expressa das novas operações

O vínculo recebe `operacoesVersao: 'v1'` somente após habilitação administrativa. Ausência do campo ou valor vazio conserva consulta e impede as novas escritas, mesmo que ações futuras tivessem sido selecionadas na v0.9.0. Não há promoção automática.

Gestor e substituto precisam de vínculo ativo, das ações de escrita correspondentes e das consultas necessárias. O substituto não ultrapassa ações, setores ou datas do titular; sua liberação operacional depende também da liberação do titular. Suspensão, expiração e revisão vencida são verificadas nas regras.

| Operação | Ações necessárias do gestor/substituto |
| --- | --- |
| Cadastrar colaborador | `participantes.consultar` + `participantes.cadastrar` |
| Editar/inativar colaborador | `participantes.consultar` + `participantes.editar` |
| Inscrever/reinscrever | `participantes.consultar` + `eventos.consultar` + `inscricoes.consultar` + `inscricoes.criar` |
| Cancelar | `eventos.consultar` + `inscricoes.consultar` + `inscricoes.cancelar` |
| Consultar/imprimir comprovante | `comprovantes.consultar`, no mesmo escopo do registro |

O administrador pode cancelar inscrições institucionais pelos detalhes do evento, inclusive quando o gestor foi suspenso. Auditoria autorizada permanece em leitura; não recebe operações de cadastro, inscrição ou cancelamento.

## Dados e integridade

- `colaboradores`: nome, e-mail normalizado, órgão/setor, telefone, cargo, ativo, criação/última atualização e autoria individual. A chave é SHA-256 de órgão + e-mail normalizado. Não contém UID de beneficiário ou senha.
- Órgão, setor e e-mail são imutáveis neste fluxo de edição, preservando os vínculos e o histórico. Correções desses identificadores precisam de revisão específica; não existe transferência automática de registros nesta entrega.
- `eventos`: `modeloInscricao: 'institucional-v1'`, `orgaosElegiveis`, `inscricoesAbertas`, `inscricaoInicio`, `inscricaoFim`, `limiteVagas`, `inscritosCount` e referência da última transição.
- `inscricoes`: ID determinístico por evento + SHA-256 do e-mail normalizado; beneficiário e operador separados, dados do evento na confirmação, situação `confirmada`/`cancelada`, protocolo e datas do servidor.
- Duplicidade significa o mesmo e-mail normalizado no mesmo evento, inclusive entre órgãos. E-mails alternativos ou compartilhados exigem revisão humana; o sistema não deduz identidade civil pelo e-mail. IDs opacos não são segredos e não substituem autorização.
- Inscrição, contador e histórico são confirmados na mesma transação. Regras conferem o participante, o órgão/setor, o evento, a elegibilidade, o período do servidor, a transição de situação, a vaga e a auditoria. O contador exige a inscrição correspondente; não pode ser ajustado manualmente por um cliente.
- Apenas uma transição de inscrição pode ser associada a cada atualização do contador. Disputas por vaga são resolvidas pela transação. Um envio sem histórico ou sem contador é recusado.
- Editar colaborador registra os campos efetivamente modificados. Nenhum histórico guarda valores de senha ou cria uma conta de beneficiário. Trilhas continuam sem edição ou exclusão.
- Cancelar não depende de ler novamente o evento: o decremento atômico é validado pelo servidor. Assim, a retirada posterior da elegibilidade ou o fechamento das inscrições não impede o cancelamento por quem mantém delegação válida.
- Consulta e comprovante de outro órgão/setor são recusados. Leitura de IDs ausentes serve à criação determinística e não permite listar inscrições ou participantes de outro órgão. Conflitos fora do escopo não devolvem os dados do outro registro.
- F5 conserva a aba autorizada. Logout, mudança de escopo, expiração e falha definitiva de consultas protegidas limpam tabelas, formulário, opções de participantes e comprovante. Troca de sessão durante a leitura transacional aborta o envio antes da confirmação.

## Compatibilidade e limites

Eventos anteriores permanecem no fluxo original de inscrição da própria conta. Não podem ser convertidos diretamente no modelo institucional: registros legados não têm a mesma garantia de unicidade/contador. Essa migração precisa ser planejada separadamente. O canal antigo não pode inscrever em um evento institucional.

Eventos institucionais são preservados, inclusive quando não têm inscritos; o cancelamento/encerramento ocorre pela situação do evento e pela abertura de inscrições. A exclusão física é bloqueada para não invalidar os protocolos.

O período numérico de inscrições é a referência de prazo nas regras; a GRGD deve configurá-lo de acordo com a agenda. O navegador apresenta datas/horas conforme seu fuso. Definir os períodos no contexto institucional e conferir os valores em homologação.

O comprovante registra a situação consultada e os dados do evento na inscrição. Não é certificado de presença, não tem assinatura digital, QR de autenticação, consulta pública ou envio automático por e-mail. Um PDF já exportado não é atualizado após cancelamento; uma nova consulta exibe a situação atual. A prévia de perfis continua demonstrativa e sem conexões externas; os fluxos completos são testados na aplicação com Firebase simulado.

LDAP/OIDC e PostgreSQL seguem na migração planejada. Este lote usa a autenticação Firebase existente e não provisiona pessoas no LDAP. Não altera grupos de diretório, infraestrutura ou contatos para conceder privilégios.

## Implantação e conferência

1. Revisar o PR e homologar em projeto Firebase separado, com contas/dados fictícios. Abrir o HTML local com a configuração institucional não isola a produção.
2. Publicar o novo `firestore.rules` de forma coordenada com o HTML. Este lote não acrescenta índices compostos; conserva os três índices por órgão/setor da v0.9.0. A consulta de elegibilidade usa o índice automático de array de `orgaosElegiveis`.
3. Conferir uma conta de gestor e substituto com dois órgãos/setores, inclusive vínculo antigo sem liberação operacional. Habilitar individualmente os vínculos após revisão das duas aprovações.
4. Criar um evento institucional de teste, ocupar a última vaga simultaneamente, cancelar, reinscrever e conferir o histórico. Retirar elegibilidade e confirmar que o cancelamento autorizado ainda funciona.
5. Conferir comprovante confirmado/cancelado, impressão/PDF, F5, logout e expiração. Conferir o evento anterior no canal original.
6. Somente com autorização de publicação, integrar e acompanhar o GitHub Pages. Publicar o HTML não implanta as regras do Firebase.

Retorno: o HTML anterior não opera inscrições institucionais. Fechar novas inscrições e suspender liberações operacionais quando necessário; não restaurar automaticamente regras antigas, que não conhecem o novo modelo. Preservar inscrições, contadores e histórico e planejar qualquer retorno de dados com o responsável.

## Validação

105 testes da aplicação, 69 de regras no emulador `demo-prgd-usuarios` e 3 de Auth, além de quatro suítes de navegador. Casos novos incluem cadastro/edição sem conta, aprovação expressa, escopo, substituição, duplicidade entre órgãos, prazo, lote atômico com histórico, disputa da última vaga, cancelamento repetido, retomada, comprovante, impressão, F5/logout e celular. Nenhum teste altera contas ou dados institucionais.

Referências primárias de implementação: [transações e limites das regras](https://firebase.google.com/docs/firestore/manage-data/transactions), [hashing nas regras](https://firebase.google.com/docs/reference/rules/rules.hashing), [representação de bytes](https://firebase.google.com/docs/reference/rules/rules.Bytes).

Próximas entregas possíveis: revisão/transferência de vínculos de participantes, migração assistida dos eventos legados, frequência e certificados, lista de espera e envio de comunicações com autorização própria.
