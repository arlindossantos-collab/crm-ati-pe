# Governança dos vínculos e telas por perfil - v0.9.0

Modelo do primeiro lote, baseado em `main@61cdbf259b283071d8d6be8cb27abefc835eaa5e` (v0.8.0). A v0.9.0 foi integrada e publicada pelo PR #14. As operações adicionais da v0.10.0 estão em [inscrições institucionais](inscricoes-institucionais.md); este documento descreve o primeiro lote de governança.

**Ajuste na v0.10.1:** por solicitação do usuário em 23/10/2026, responsáveis e referências das aprovações são opcionais. A decisão de ativar permanece administrativa, com autoria e horário; papel, órgão/setores, ações, validade, revisão e limites do substituto continuam obrigatórios. O texto histórico abaixo sobre registrar duas referências descreve a implantação anterior. Ver [correções do portal](correcoes-portal-nsi.md).

**Apresentação na v0.11.0 (em revisão):** gestores de NSI, substitutos, auditoria e contas externas recebem uma área visual própria; administradores e equipe GRGD mantêm a área interna. O layout não altera papéis, ações ou escopos. Ver [mapeamento do layout](layout-por-perfil.md).

## Modelo adotado

Autenticação identifica a pessoa. Cadastro de contato não concede acesso. O administrador registra um vínculo aprovado com papel, órgão, setores, ações, período, próxima revisão e referências das aprovações. Não há associação automática por nome, e-mail, domínio ou posição no LDAP.

| Perfil | Escopo e comportamento neste lote |
| --- | --- |
| Administrador da PRGD | Configuração de negócio: usuários, setores e vínculos; preserva a auditoria e a exclusão protegida. Não cria privilégios de infraestrutura ou LDAP. |
| Equipe GRGD | Consulta, criação e edição somente nos módulos expressamente autorizados. Editar exige também consultar o módulo. Não recebe administração de usuários nem exclusão física. |
| Gestor de NSI | Consultas do próprio órgão e dos setores delegados; eventos públicos disponíveis no fluxo atual. Cadastro de participantes e inscrições por representação estão reservados para o próximo lote. |
| Substituto | Ações, setores e validade não podem exceder os do titular NSI. Suspensão, vencimento ou revisão pendente do titular bloqueiam as consultas protegidas no servidor. |
| Participante sem login | É beneficiário de uma futura inscrição; não é um perfil de acesso e não recebe conta por esse motivo. |
| Auditoria autorizada | Somente leitura de trilhas e listagens de inscrições no órgão/setores aprovados. Não recebe lista de participantes, cadastro de usuários, edição de trilhas nem concessão de acesso. |

Contatos de gestor do órgão, NSI, Telemática, SI e SEI já existentes permanecem dados institucionais. A ligação com uma identidade de acesso requer validação expressa. Usuários antigos sem `acessoInstitucional` preservam os acessos anteriores; não são promovidos nem classificados automaticamente.

## Aprovações e revisão

1. A GRGD e a autoridade indicada pelo órgão aprovam o titular, substitutos, ações, setores e prazos pelos canais institucionais.
2. Um administrador autorizado registra os responsáveis e as referências das duas aprovações, por exemplo o protocolo institucional. Para GRGD e auditoria, a autoridade competente é a indicada pela ATI.
3. Somente a situação **aprovado**, dentro do início, validade e revisão, libera os módulos. Pendente ou suspenso não herda os módulos legados.
4. Mudança de papel, órgão, setores, ações, titular ou datas coloca o formulário em pendente e limpa as referências anteriores; o administrador deve revisar e registrar novamente as aprovações recebidas.
5. Revisão vencida bloqueia as consultas. A suspensão preserva o vínculo e seu histórico, inclusive quando órgão ou setor anterior não está mais disponível.

O formulário registra aprovações já recebidas; não implementa assinatura eletrônica nem comprova sozinho a autenticidade de um protocolo. A validação das evidências cabe aos responsáveis institucionais. O usuário beneficiário não pode aprovar ou editar o próprio vínculo.

## Dados e permissões

`usuarios/{uid}.acessoInstitucional` contém:

- `papel`: `grgd`, `gestor_nsi`, `substituto` ou `auditoria`. A administração permanece no perfil técnico já existente, sem acumular outro papel nesse formulário.
- `orgaoId`: ID do documento institucional, sem associação por sigla ou nome. GRGD tem atuação institucional por módulo e usa órgão vazio; os demais papéis têm um órgão explícito.
- `setoresIds`: até cinco IDs de setores na integração inicial com Firestore. Lista vazia significa delegação integral do órgão, que precisa estar aprovada. O limite é desta implementação inicial, não uma regra organizacional para a futura API.
- `acoes`: lista de ações permitidas para o papel. Ações futuras de cadastro, inscrição, cancelamento e comprovantes são identificadas como próximo lote e ainda não liberam gravação.
- `situacao`, `inicio`, `fim` e `revisao`: situação e instantes em milissegundos; não se presume sessão indefinida nem delegação sem prazo.
- `titularUid`: identidade individual do titular, obrigatória no substituto.
- `aprovacaoGrgd` e `aprovacaoAutoridade`: responsável e referência de cada aprovação.
- `registradoPorUid` e `registradoEm`: autor do registro e horário do servidor; atualização junto ao histórico de alterações.

`setores/{id}` contém nome, órgão por ID e situação. O cadastro de setores é administrativo e não apaga o histórico. Referências indisponíveis não são descartadas automaticamente ao abrir um formulário, para evitar ampliar o escopo para todo o órgão.

Dados pessoais da própria conta permanecem no fluxo existente, sem permitir editar papel, vínculo ou aprovações. As restrições de auditoria se referem aos cadastros institucionais e às trilhas protegidas.

O primeiro lote mantém um vínculo institucional por conta e um órgão por vínculo. Múltiplos órgãos por pessoa, alternância de contexto e delegações por registros separados deverão ser modelados com a API/PostgreSQL. Não duplicar identidades nem ampliar o perfil administrativo para contornar esse limite.

## Telas e consultas

- Usuários exibe o novo papel, órgão, setores e situação do vínculo e permite filtrar por órgão/setor.
- Meu órgão apresenta o contexto autorizado e os prazos.
- Colaboradores, Inscrições do órgão e Auditoria do órgão usam consultas filtradas por `orgaoId` e, quando aplicável, `setorId in setoresIds`.
- Inscrições legadas aceitam somente os campos da própria conta e do evento; não aceitam órgão, setor, participante ou operador informados arbitrariamente. O histórico legado exige o registro da própria conta, e a escrita institucional por representação continua bloqueada neste lote.
- Regras recusam consultas gerais, acesso por ID fora do escopo e uso do UID para contornar o órgão de uma inscrição institucional.
- Falha de uma consulta limpa seus dados e apresenta uma mensagem. Troca de acesso, expiração, revisão e logout limpam os dados locais; F5 restaura somente uma aba permitida.
- O substituto é revalidado no servidor contra o titular; revogar o titular não exige trocar a senha do substituto. A interface apresenta erro e limpa a consulta quando o servidor deixa de confirmá-la.
- Auditoria de registros antigos sem órgão/setor identificável não é atribuída ficticiamente a um órgão; continua disponível ao administrador pelo histórico existente.

## Prévia visual

Abrir `previa-perfis.html` pelo servidor local ou pelo link na aba Usuários. A página é autônoma, não carrega bibliotecas externas e bloqueia conexões com `connect-src 'none'`. O seletor permite explorar os seis contextos, incluindo o participante sem login, apenas com dados fictícios. A confirmação de aprovação no exemplo altera somente a memória dessa página.

O seletor de perfis não existe na aplicação de produção. A prévia não autentica no LDAP, não consulta Firebase/PostgreSQL e não valida acessos reais.

## Implantação coordenada

Em 22/10/2026, o usuário autorizou a publicação e informou que publicou as regras e os índices no Firebase. Essa informação é baseada no relato do usuário, sem verificação direta do console nesta sessão. A integração e a implantação do GitHub Pages são acompanhadas no PR #14; a homologação institucional continua pendente. O roteiro abaixo permanece como referência para implantação e conferência.

1. Revisar este PR e os campos com a GRGD e a autoridade responsável pela governança.
2. Usar projeto Firebase de homologação separado, com dados e contas de teste; servir o HTML local não isola a produção por si só.
3. Publicar as novas regras e os índices no projeto de homologação e testar uma conta de cada papel com dois órgãos e diferentes setores.
4. Homologar as evidências de aprovação e a operação administrativa, incluindo substituto, suspensão, revisão, expiração, F5 e troca de conta.
5. Somente após autorização de publicação, coordenar regras, índices e HTML no ambiente institucional. GitHub Pages publica apenas o site.
6. Classificar e habilitar vínculos individualmente; não executar promoção em massa de contatos ou usuários existentes.

O retorno ao HTML anterior restringe a interface antiga aos módulos legados, mas não desfaz vínculos gravados. Suspender concessões novas quando necessário; não restaurar regras antigas de forma automática, pois elas não reconhecem o novo modelo de governança. Planejar retorno de regras e dados com os responsáveis antes da implantação.

## Validação e próximos lotes

Validação local: 95 testes da aplicação, 48 testes de regras e 3 de Auth (146 ao todo), além das três suítes de navegador. Testes de regressão da aplicação, regras no emulador `demo-prgd-usuarios`, alteração de senha no emulador Auth e testes de navegador com Firebase interceptado. Os casos novos verificam aprovação, escopo por órgão/setor, consulta por ID, delegação, revisão, expiração, edição GRGD, auditoria, limpeza de dados e gravação com cinco setores/identidade/auditoria no mesmo lote. A prévia também é testada sem solicitações externas e em largura de celular. Para inspeção visual offline da aplicação atual, `PRGD_TEST_CSS` pode fornecer CSS Tailwind compilado localmente, sem modificar o CSS publicado.

Próximo lote: cadastrar participantes sem conta, inscrever/cancelar por representação, público elegível por órgão, comprovantes, prevenção de duplicidade e vagas em transação. A integração LDAP/OIDC e a persistência PostgreSQL continuam pertencendo à migração; os nomes dos perfis não simulam essa integração.
