# Usuários, colaboradores e contatos institucionais — v0.12.0

Primeiro lote do controle de acesso no **crm-ati-pe**, sobre `main@373368974e4175eb585db2a9b0d511c3eb2072a5` (v0.11.0). Publicação autorizada em 23/10/2026, após o usuário informar que publicou as regras do Firestore. Essa informação é uma confirmação do usuário, sem inspeção direta do console. Integração e publicação do site acompanhadas no [PR #18](https://github.com/arlindossantos-collab/crm-ati-pe/pull/18). Mantém HTML único, Firebase Authentication e Firestore. Não usa o repositório prgd-institucional nem implementa sua arquitetura PostgreSQL/OIDC.

## O que muda

- Usuários ganha indicadores de cadastros ativos/inativos, aprovação pendente e vínculos vencidos/revisão pendente; filtros por perfil e situação do acesso, combinados com busca e filtros existentes. Indicadores são totais; a tabela informa o resultado filtrado. Busca e filtros usam os registros carregados na sessão administrativa, sem paginação no servidor nesta entrega.
- O editor organiza dados, perfil e vínculo/validade em blocos. Antes de cadastrar ou salvar, um resumo mostra a pessoa, situação, papel, abrangência, setores, ações e prazos. Voltar mantém os campos; mudança de sessão cancela a confirmação. Responsáveis e referências de aprovação continuam opcionais.
- Administração ganha acesso à aba Colaboradores, com dados de todos os órgãos. Gestores e substitutos permanecem nas consultas do próprio escopo e nas ações liberadas; outros perfis não recebem administração de colaboradores.
- Administrador cadastra e edita colaboradores com o mesmo formato usado pelo gestor. Pesquisa por nome, e-mail, cargo, órgão e setor; filtros por órgão, setor, revisão cadastral e existência de conta vinculada. Não há cópia paralela do cadastro.
- Nome, telefone, cargo, atividade, funções de contato e prazo de revisão podem ser atualizados. Órgão/e-mail permanecem a chave do cadastro. Transferência de setor exige setor válido do mesmo órgão e autorização no setor anterior e no novo; inscrições históricas e permissões da conta não mudam.

## Validade cadastral não é permissão

**Revisar cadastro até** é uma data de atualização dos dados do colaborador. Vencido indica necessidade de revisão e aparece no filtro e no contato institucional. Sem data, mostrar **Sem prazo informado**, nunca inventar vencimento ou considerá-lo atualizado.

Essa data não bloqueia login, não muda a delegação e não cancela inscrições. A validade e a revisão do vínculo de acesso continuam em `usuarios/{uid}.acessoInstitucional`. O novo formulário não inventa prazo institucional padrão. A data cadastral considera o fim do dia em Recife.

## Clientes ligado aos colaboradores

O gestor ou administrador pode marcar as funções de contato: Gestor do órgão, NSI, Telemática, SI, SEI e Ponto focal/substituto. São funções de relacionamento: **não concedem perfil, conta de acesso ou ações administrativas**.

Em Clientes → Detalhes/Editar → Fonte dos contatos institucionais:

1. **Automático pela função institucional:** mostra os colaboradores do próprio órgão marcados com aquela função. Havendo vários ativos, mostra todos, sem escolher silenciosamente uma pessoa. Se restarem somente inativos, sinaliza essa situação.
2. **Pessoa selecionada:** permite escolher pessoas com ao menos uma função institucional indicada e mantém referência ao ID daquele colaborador do órgão; alterações de nome, contato, setor e revisão aparecem nas consultas em tempo real. Referência indisponível gera aviso e não é trocada por outra pessoa ou pelos dados antigos.
3. **Manter somente dados manuais:** conserva os campos anteriores como fonte, sem associação automática.

Campos antigos não são apagados. Sem contato automático, permanecem os dados manuais, identificados como anteriores no painel. A seleção por ID é validada nas regras para o mesmo órgão. Não se deduz vínculo por nome, sigla, e-mail ou nome do setor. Órgão novo deve ser salvo antes de cadastrar seus colaboradores e vincular pessoas a ele.

O resumo vivo atualiza sem reiniciar o editor nem perder alterações em andamento. Cards de detalhes não usam nomes/e-mails fictícios como preenchimento de informações ausentes.

### Projeção de contato

`colaboradores/{id}` continua sendo a origem. `contatosColaboradores/{id}` é uma projeção derivada contendo apenas nome, e-mail institucional, telefone institucional, cargo, órgão, setor, atividade, funções de contato, revisão cadastral, referência à auditoria de origem e horário de atualização. Não contém UID de login, perfil, senha ou dados privados. O campo derivado `divulgavel` só é verdadeiro quando há função de contato indicada. Quem consulta Clientes usa uma consulta filtrada por esse campo; as regras recusam a lista geral e o contato de colaboradores sem função institucional. Administração pode consultar todas as projeções. Remover a última função retira a divulgação; referências explícitas anteriores permanecem registradas e passam a ser sinalizadas como indisponíveis.

A projeção é necessária porque usuários com consulta a Clientes podem consultar os contatos institucionais, mas não ganham acesso ao cadastro completo de colaboradores ou à lista de contas. A consulta a Clientes também permite ler o catálogo de setores para apresentar seus nomes, sem conceder edição. Gestores e substitutos seguem acessando colaboradores no próprio escopo e não recebem listagem global da projeção.

Salvar o colaborador grava origem, projeção e auditoria na mesma transação. Regras exigem igualdade dos campos projetados. Uma projeção existente não pode permanecer desatualizada após alterar a origem. Não há função de servidor ou sincronização por e-mail.

Cadastros anteriores passam a ter projeção ao serem salvos pela nova interface. **Nenhuma migração ou gravação em massa acontece ao abrir a página.** Para disponibilizar um cadastro antigo como contato selecionável, abra-o em Colaboradores, confira os dados/funções e salve. Gestor pode fazer isso no seu escopo. Falha de consulta é sinalizada; não confirma atualização dos dados manuais.

## Colaborador ligado à conta de acesso

Em Colaboradores → Vincular usuário, o administrador pesquisa contas existentes e confirma que se trata da mesma pessoa. E-mail de acesso e e-mail institucional podem ser distintos. Não há fusão automática por nome/e-mail e não se cria login ao cadastrar colaborador.

A associação é recíproca:

- `colaboradores/{id}.usuarioUid` referencia o UID;
- `usuarios/{uid}.colaboradorId` referencia o colaborador.

As regras exigem as duas pontas e os históricos no mesmo envio. A conta não pode permanecer ligada a dois colaboradores. Remover/reassociar preserva pessoa, conta, permissões, inscrições e histórico. Para transferir uma conta já associada a outro colaborador, primeiro revise e remova o vínculo anterior. Esta primeira versão admite **um colaborador por conta**; atuação da mesma pessoa em vários órgãos permanece uma evolução de modelagem, sem duplicar login como contorno.

No detalhe do usuário, os dados do colaborador são lidos da origem associada. Nome/e-mail de login continuam separados dos dados institucionais; não são sobrescritos ao atualizar um contato. A associação não altera o órgão/setores autorizados da conta, não ativa vínculo e não promove a pessoa a gestor.

## Implantação coordenada

**Há alteração de regras; não há novos índices.** GitHub Pages não publica regras Firebase.

1. Usar primeiro um projeto Firebase de homologação separado, com contas e dados fictícios.
2. Publicar o arquivo completo `firestore.rules` desta revisão em Firestore Database → Regras. Não concatenar trechos de versões diferentes.
3. Publicar o HTML correspondente e recarregar os navegadores. Evitar edições de colaboradores na janela entre regras e HTML: depois que a projeção existe, cliente antigo não consegue atualizá-la junto e terá a gravação recusada. Dados anteriores não são apagados.
4. Conferir os filtros e a revisão antes de salvar usuário; cadastrar colaborador em dois órgãos; atualizar contato e conferir Clientes; testar vínculo/desvínculo de conta e as recusas fora do escopo; F5 e logout.
5. Só depois do aceite, coordenar a publicação em produção. Não executar seeds, importação ou atribuição de funções em massa.

Voltar apenas o HTML não restaura dados nem torna a interface antiga compatível com projeções existentes. Para interromper a implantação, suspender edições dos colaboradores afetados e revisar o retorno com os responsáveis; não reabrir permissões restaurando regras antigas automaticamente.

## Validação e limites

115 testes da aplicação, 80 testes de regras Firestore e 3 testes Auth aprovados localmente (198 ao todo), além de sete suítes de navegador Chromium com Firebase simulado. Casos novos cobrem estado de acesso, contatos por ID, alteração em tempo real com editor aberto, projeção sem dados de login, filtros, aprovação com volta ao formulário, vínculos recíprocos, unicidade, desvínculo, escopo por órgão/setor e substituto com cinco setores.

Lote 2 permanece separado: reconfirmação forte para todas as alterações de permissão, auditoria obrigatória de todos esses caminhos e proteção do último administrador em concorrência. Também não entrega revogação global de sessões no Authentication, recuperação administrativa de credenciais, MFA/Authenticator, LDAP/OIDC ou PostgreSQL. F5, exclusão com senha e os demais módulos preservam os controles anteriores.
