# Painel gerencial e Colaboradores — v0.13.0

Entrega no repositório crm-ati-pe, baseada em `main@ecb2b0db473bdeb25b22844d27bfa63024316436`. Publicação autorizada em 23/10/2026, após o usuário confirmar a publicação das novas regras do Firestore (relato do usuário, sem inspeção direta do console). Integração e GitHub Pages acompanhados no [PR #19](https://github.com/arlindossantos-collab/crm-ati-pe/pull/19).

## Nomes e abrangência

- **Painel gerencial:** área interna da equipe PRGD e administradores. O módulo administrativo Colaboradores é exclusivo do Administrador PRGD atual, chamado master nesta entrega. Tipo interno, setor NSI ou matrícula não concedem administração.
- **Painel externo:** área dos gestores, substitutos, auditoria autorizada e demais usuários externos. Permanece limitado ao órgão, setores e ações aprovados.

## Módulo único no painel gerencial

1. **Cadastros e órgãos:** colaboradores mantidos no mesmo cadastro utilizado pelo gestor; matrícula opcional de até 50 caracteres; busca por nome, matrícula, e-mail, cargo, órgão ou setor; filtros por órgão, setor, revisão cadastral e conta/acesso. O resumo por órgão considera os filtros; os indicadores gerais mantêm o total da base consultada.
2. **Acessos e permissões:** contas existentes, inclusive contas ainda sem colaborador associado; filtros, edição de papel, abrangência, validade e ações com resumo antes de confirmar; exclusão protegida pela senha do próprio administrador e impedimento de autoexclusão mantidos.
3. **Setores e grupos:** configuração de setores dos órgãos e grupos usados para elegibilidade em eventos.

Uma única entrada de menu. A rota antiga Usuários é direcionada a Colaboradores → Acessos e permissões. F5 mantém a área selecionada por usuário. Encerramento ou troca de sessão limpa os novos resumos e contextos.

## Conceder acesso a uma pessoa

No cadastro do colaborador, **Criar acesso** abre o formulário com nome e e-mail preenchidos, inicialmente como externo e sem módulos liberados. O administrador revisa o tipo, o papel, o órgão/setores e as ações, define a senha inicial e confirma o resumo. Não preencher papel ou módulos mantém a pessoa sem acesso funcional.

O Auth cria a conta auxiliar sem trocar a sessão do administrador. Uma transação Firestore confirma conta, identidade, vínculo nos dois sentidos, contato projetado e duas trilhas. A transação recusa colaborador removido, inativo ou já vinculado, conta existente e sessão trocada. Se falhar, a conta recém-criada no Auth é removida; se essa compensação falhar, a interface informa o UID para revisão no console. Auth e Firestore são serviços distintos e não compartilham uma transação global.

**Vincular conta existente** permanece disponível para uma conta já cadastrada, com confirmação de identidade. Em pessoa vinculada, **Gerenciar permissões** abre a conta correspondente somente após confirmar o vínculo recíproco; a indicação de acesso considera situação da conta e módulos efetivamente liberados. Revisão cadastral vencida não suspende login por si só.

Matrícula identifica o cadastro da pessoa, não é identificador de login nem garantia de unicidade; órgãos podem repetir matrículas. Ela fica fora da projeção de contato de Clientes. Gestor autorizado pode mantê-la no próprio escopo. Não há novo índice.

## Implantação

Publicar as regras desta versão antes de integrar o HTML. A diferença de regras aceita e valida o campo opcional `matricula` no colaborador, mantendo a compatibilidade com registros anteriores e o controle administrativo de contas. A confirmação de publicação das regras da v0.12.0 não se aplica automaticamente a esta nova diferença. Após autorização de publicação, acompanhar testes, integração e GitHub Pages e verificar a versão servida.

## Preservação dos dados existentes

O usuário confirmou que todos os dados devem ser preservados. Esta entrega mantém colaboradores, contas de acesso, vínculos recíprocos, contatos dos órgãos, delegações, responsáveis, inscrições e históricos. Não há limpeza, migração destrutiva nem exclusão automática na atualização do site. Contas ainda sem colaborador associado continuam disponíveis em Acessos e permissões para revisão individual. O controle de exclusão individual já existente mantém autenticação recente, auditoria e impedimento de autoexclusão.
