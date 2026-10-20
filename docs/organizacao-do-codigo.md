# Organização do código — primeira etapa

Base: main, commit 44970240ac19a44eb9fc77762044de1c12d9c364.

Esta mudança extrai os dois blocos embutidos no index.html para arquivos próprios. O conteúdo dos blocos foi mantido, desconsiderando apenas espaços no início e no fim do bloco.

| Arquivo | Responsabilidade |
|---|---|
| index.html | Estrutura das telas, carregamento das bibliotecas e inicialização do módulo principal |
| assets/css/app.css | Estilos próprios anteriormente dentro de style |
| assets/js/app.js | Código JavaScript anteriormente dentro de script type=module |

Os módulos funcionais continuam com as mesmas funções. Não foram incorporadas correções de comportamento, mudança de banco ou alterações de permissão. Os arquivos v0.40/index.html e gemini-code-1792431399542.html permanecem como referências independentes, sem substituição automática.

## Publicação e visualização

O index.html e a pasta assets precisam ser publicados juntos, preservando os caminhos relativos. A estrutura funciona em subdiretórios de hospedagem, incluindo o caminho crm-ati-pe do GitHub Pages, e pode ser servida por um servidor web em VM.

Para teste integrado, utilize um servidor HTTP/HTTPS e um ambiente Firebase apropriado à homologação. Abrir o HTML diretamente por file:// não é uma verificação confiável para módulos externos. Uma prévia em arquivo único pode ser gerada separadamente, identificando claramente o que utiliza dados de demonstração e o que acessa serviços reais.

## Verificação da extração

- Comparação do conteúdo integral do CSS e do JavaScript antes/depois.
- Reconstrução do HTML com os blocos externos reinseridos e comparação com a origem.
- Mesmos identificadores, campos, botões, textos e scripts externos na estrutura da página.
- Resolução dos caminhos dos novos arquivos tanto na raiz como no subdiretório de hospedagem.
- Sintaxe do JavaScript extraído verificada com Node.js.

Essas verificações confirmam a extração estrutural. Não substituem homologação autenticada, inspeção visual no navegador ou testes do Firebase.

## Próximas extrações propostas

Separar os utilitários de formatação, depois acesso aos dados e autenticação, e em seguida módulos funcionais. Cada etapa deve partir do código atualizado e preservar o inventário de funcionalidades. Regras de acesso, correções funcionais e melhorias visuais devem ser revisadas em mudanças próprias para que seus efeitos sejam identificáveis.
