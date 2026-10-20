# Correções de interface e integridade — primeiro lote

Base consultada no GitHub antes da edição: main, commit 44970240ac19a44eb9fc77762044de1c12d9c364.
A aplicação permanece em um único index.html, conforme decisão do usuário de adiar a separação em módulos.

## Correções preparadas

- Demandas ativas excluem concluídas/canceladas e mantêm pausadas. O contador de eventos passa a se chamar Eventos Carregados, refletindo a consulta existente.
- Gráfico de categorias não inventa dados quando a base está vazia; gráficos acompanham novas renderizações.
- Cadastro de local usa a coleção locais. Tipos desconhecidos não criam coleções arbitrárias.
- Navegação mensal não transborda de janeiro/março para o mês errado. O destaque de hoje usa a data local.
- Datas inválidas retornam hífen em vez do texto original para montagem de HTML. Timestamps válidos são exibidos no fuso America/Recife.
- Cores de cards são limitadas às opções da aplicação antes da montagem do HTML.
- Logout e troca de conta limpam dados, buscas, detalhes e formulários anteriores.
- Perfis e snapshots atrasados de outra sessão são ignorados. UID e e-mail autenticados prevalecem sobre valores armazenados no perfil.
- Buscas em locais, fornecedores, usuários e bases e filtros de usuário foram conectados. A coluna de tags passou a ter a célula correspondente.
- O editor genérico mantém números, booleanos e listas de texto. Valores inválidos impedem a gravação. Identidade e metadados de criação são preservados.
- Listas/objetos estruturados não são convertidos em texto ao salvar outros campos. São exibidos como preservados e requerem fluxo específico para edição; histórico vazio também recebe essa proteção.

Não houve migração ou alteração de dados reais durante o desenvolvimento. Documentos anteriormente gravados em locals ou com tipos incorretos não são migrados automaticamente por este lote.

## Preservação

A comparação com a origem confirmou os mesmos 113 identificadores e 58 controles estáticos. Nenhuma das 47 funções originais foi removida. Os demais arquivos existentes do repositório, incluindo as duas versões alternativas e firestore.rules, permanecem preservados.

## Verificação executada

Execute npm test com Node.js 20 ou superior. Não há dependências a instalar. Os 21 testes executam o JavaScript incorporado no HTML com DOM e Firebase simulados.

Foram cobertos cadastro de local, contadores, atualização de gráficos, navegação mensal, datas, validação de cores, cache de eventos, limpeza de sessão, respostas assíncronas atrasadas, identidade, buscas/filtros e edição tipada.

A sintaxe JavaScript foi verificada separadamente. Os testes não fazem login em produção, não acessam o banco real e não substituem inspeção visual nem homologação integrada.

## Conferência antes da publicação

- Conferir aparência e navegação com os mesmos módulos da versão atual.
- Em homologação, testar login/logout e troca de contas com perfis diferentes.
- Criar um local, buscar e confirmar sua persistência após recarregar.
- Alterar grupos, visibilidade e limite de vagas de um registro de teste e conferir os tipos no banco.
- Testar buscas/filtros, calendário e contadores com dados conhecidos.

## Pendências mantidas explícitas

As regras versionadas ainda precisam de revisão e teste no emulador: criação do próprio perfil sem restringir privilégios e regras genéricas de leitura sobrepostas. Este lote não afirma que os problemas de autorização foram resolvidos.

Também continuam pendentes os formulários específicos de eventos/usuários, consultas de eventos restritos, inscrição atômica, fluxo completo de histórico, importação CSV robusta, relatórios e saneamento de dados de demonstração.

O arquivo alternativo v0.3.10 contém fallback de administrador na interface; ele não foi adotado como base nem modificado por este lote. A integração de seus recursos deve ser planejada separadamente.

A proposta anterior de extração de CSS/JavaScript permanece adiada. Esta proposta deve ser revisada independentemente dela.

