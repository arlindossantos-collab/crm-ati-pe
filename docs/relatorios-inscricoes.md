# Relatórios de inscrições — v0.14.0 (publicada em 23/10/2026)

**Base:** `main@9e4e7df89cba247e2db07557ef41ab02b01e001e`. Implementação sobre o HTML e Firebase existentes. Nenhuma nova regra ou índice necessário.

## Problema identificado

Em Eventos, os botões **Relatório Geral de Inscrições** e **Relatório** de cada evento estavam visíveis para a administração, mas não tinham ação de clique conectada.

## O que foi implementado

- **CSV geral:** todas as inscrições do snapshot administrativo `inscricoes`, incluindo o fluxo institucional e registros anteriores.
- **CSV por evento:** somente inscrições vinculadas ao evento, seja pelo ID documental ou ID persistido.
- Colunas: evento, ID do evento, participante, e-mail, órgão, setor, situação, protocolo, criação, atualização e modelo de inscrição. Dados ausentes permanecem vazios ou explicitamente desconhecidos.
- Registros legados sem situação exibem `Não informada (fluxo anterior)`: não presumir confirmação.
- CSV UTF-8 com BOM e separador ponto e vírgula; campos com potencial fórmula são neutralizados. Nome do arquivo usa o nome normalizado do evento ou `geral` e a data.
- A exportação só fica disponível após o carregamento de **eventos e inscrições**. Falha de consulta impede exportação de uma base aparentemente vazia ou parcial; conjunto realmente vazio gera aviso, não arquivo.

## Segurança, limites e preservação

A exportação com dados pessoais é **exclusiva do administrador ativo e interno**, usando `ehAdministrador()`. Perfil GRGD não-administrador, gestor, substituto, auditoria e usuários externos não recebem essa função. A regra Firestore continua limitando a leitura; a interface não concede privilégios.

O lote **não grava, não exclui, não migra, não altera regras, não cria índices e não envia o relatório a servidores de terceiros**. Dados existentes e legado permanecem intocados. O relatório baixado contém dados pessoais e deve ser guardado somente em local autorizado.

**Inscrição não é presença.** Esta versão não implanta confirmação de frequência, assinatura, QR, certificado ou comunicações automáticas. Isso exige uma proposta própria de negócio, privacidade, regras e responsáveis.

## Validação e publicação

- A [validação automatizada do PR #20](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/40030540444) foi **aprovada**: testes da aplicação, regras do Firestore, Auth e sete suítes Chromium com Firebase simulado.
- O usuário autorizou a publicação. O [PR #20](https://github.com/arlindossantos-collab/crm-ati-pe/pull/20) foi integrado à `main` no commit `5014da060ceb36f4f5c250dea1b394f6bd183e84`.
- A [implantação do GitHub Pages](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/40032116247) foi confirmada pelo GitHub como bem-sucedida em 23/10/2026.
- Não houve alteração de `firestore.rules`; essa entrega não exige republicação de regras ou índices.
- **Pendente de validação institucional com dados fictícios em ambiente isolado:** conferir os CSVs no Excel/LibreOffice, perfis, eventos legados, falhas de leitura e visualização na interface. Os testes automatizados não equivalem a homologação em produção.
- **Pendente:** criação de tag e release formal, processo separado da implantação do site. Nenhuma foi declarada como criada nesta entrega.
