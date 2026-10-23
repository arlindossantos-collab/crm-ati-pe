# Correções do portal do gestor de NSI — v0.10.1

Proposta de 23/10/2026, baseada em `main@53f51a33f6b027f8643438e2724c01a016ac1fbc` (v0.10.0). Sem publicação automática do site ou das regras.

## Comportamento corrigido

- A comparação do perfil agora usa somente permissões efetivas, com ordem estável dos setores e ações. A ordem dos campos do snapshot e metadados de aprovação não reiniciam consultas equivalentes. Alteração real de órgão, setores, ações, situação, validade, revisão ou liberação operacional continua removendo dados anteriores e reiniciando as consultas. O nome do órgão confirmado não é reescrito quando o conteúdo do resumo é igual.
- Setores carregados depois de abrir o formulário atualizam o seletor sem apagar nome, e-mail ou outros dados digitados. Há filtro de colaboradores por setor autorizado. Carregamento, falha de acesso e ausência de setores ativos têm mensagens distintas. Não é possível salvar sem um setor válido.
- Eventos de hoje permanecem em Futuros até o horário final informado ou o fim do dia local. A situação Realizado também os classifica como encerrados. Datas legadas em formato ISO com horário conservam a comparação pelo instante informado. As fontes de eventos públicos e elegíveis são independentes; uma falha remove os dados daquela consulta e aparece como erro, sem ser confundida com lista vazia.
- A pedido do usuário, responsáveis e referências da aprovação GRGD/autoridade são opcionais no formulário, prévia e regras. Campos ausentes ou vazios não bloqueiam um vínculo aprovado. Quando preenchidos, mantêm validação de tipo e tamanho. Essa mudança altera a condição técnica anterior que exigia quatro textos não vazios; as formalidades institucionais continuam sob responsabilidade da ATI/GRGD.

A interface não deduz permissões pelo nome, domínio de e-mail ou texto informado pelo usuário. A situação aprovado, a liberação operacional v1, as ações, os prazos e os limites do substituto permanecem. Somente o administrador pode alterar vínculos; metadados de autor/horário e histórico continuam registrados. A implantação não altera a situação cadastrada nem a liberação operacional em lote. Vínculos que já estejam aprovados e nos prazos passam a funcionar mesmo com os campos textuais vazios; pendentes e suspensos continuam bloqueados.

## Configuração dos cadastros existentes

1. Como administrador, em **Usuários → Setores por órgão**, cadastrar os setores reais do órgão, ativos e associados ao ID institucional correto. O gestor continua sem permissão para criar setores ou ampliar a própria delegação.
2. No usuário do gestor, selecionar órgão, setores delegados (ou todo o órgão), ações, datas e situação **aprovado**. Para escrever, marcar **Habilitar cadastro e inscrições institucionais**. Responsáveis e referências podem ficar em branco. Alterar escopo retorna a pendente e exige nova decisão administrativa; o substituto continua limitado ao titular.
3. Como GRGD/administração autorizada, criar um **novo evento institucional** e selecionar o órgão em **Órgãos elegíveis**; configurar abertura, período e vagas. Eventos legados não são convertidos automaticamente. Um evento público pode ser consultado sem permitir inscrição por representação; essa inscrição exige o modelo institucional e a elegibilidade explícita.
4. Como gestor, abrir **Colaboradores**, escolher o setor no cadastro e salvar. O filtro por setor altera somente a listagem; não amplia a delegação. Em **Eventos → Futuros**, conferir os eventos destinados ao órgão e o botão **Inscrever colaborador** quando os requisitos estiverem válidos.

## Validação e limites

109 testes de aplicação, 71 de regras Firestore e 3 de Auth (183), além de cinco suítes de navegador. A nova suíte varia a ordem das propriedades, emite metadados repetidos, atrasa setores enquanto há formulário aberto, cadastra e inscreve por setor, consulta evento privado elegível de hoje, recusa outro órgão, simula falha de consultas, restringe a delegação e verifica limpeza no logout, referências em branco e largura de celular.

As duas regressões de comparação do perfil e classificação de eventos foram reproduzidas antes da correção; os cenários corrigidos passam. Não houve acesso às contas nem aos dados institucionais. As causas verificadas no código não confirmam quais condições específicas ocorreram no Firebase do usuário; a conferência dos setores, elegibilidade e índices existentes deve seguir o roteiro acima.

## Implantação e retorno

Este lote altera `firestore.rules`, sem novos índices. Publicar as novas regras antes do HTML; a publicação do GitHub Pages não implanta o Firebase. Homologar em ambiente separado, coordenar a publicação e conferir os cadastros existentes. A versão publicada permanece v0.10.0 até autorização e implantação deste lote.

Não restaurar regras antigas automaticamente: elas voltariam a exigir os campos textuais e podem bloquear vínculos salvos com campos vazios. Preservar usuários, inscrições, contadores e histórico; qualquer retorno deve considerar a nova política de ativação. LDAP/PostgreSQL permanecem na migração separada.
