# Órgãos — dados ausentes sem informações de exemplo

Incremento do Lote 03 identificado durante a revisão do plano. Base: main@4cb768a. Versão v0.14.1 com publicação autorizada pelo usuário nesta sessão; implantação em acompanhamento. Aceite funcional GRGD ainda não registrado.

## Problema reproduzido e resultado

Cadastrar órgão sem endereço, coordenadas ou fachada gravava valores fixos de exemplo. Consultar um órgão sem esses campos exibia localização de exemplo e link para esse mapa. O modal também apresentava CNPJ, pessoa, cargo, e-mail, telefone e Diário Oficial como fonte quando não havia informação cadastrada.

Agora, novos cadastros mantêm localização e imagem vazias quando não informadas. O modal mostra endereço, coordenadas, imagem e contatos ausentes explicitamente. O mapa utiliza as coordenadas cadastradas; na ausência delas, utiliza o endereço informado; sem ambos, o link não aparece. A imagem cadastrada não é apresentada como comprovação de fachada oficial.

Informações manuais e contatos vinculados continuam sendo exibidos. Nenhum dado foi excluído, associado automaticamente ou migrado. Valores de exemplo já persistidos não podem ser removidos automaticamente: alguns podem ser legítimos. Essa revisão cabe ao responsável pelo cadastro.

## Critérios de aceite e evidências técnicas

- Cadastro vazio mantém endereco, geolocalizacao e fotoFachada vazios, com auditoria existente preservada.
- Cadastro preenchido mantém os valores informados.
- Detalhes sem localização não exibem imagem ou mapa de exemplo nem efetuam gravações.
- Endereço e coordenadas cadastrados geram o link esperado; texto continua escapado no HTML.
- Ausência de fonte e ponto focal não inventa contato; informações manuais existentes são preservadas.
- Os 131 testes de regressão passaram. Os novos casos de ausência de localização falharam antes da correção; o caso de valores informados já passava.
- O smoke integrado inclui cadastro de órgão pelo administrador, leitura do documento no emulador, detalhes sem imagem/mapa e capturas desktop/celular. Auth e Firestore reais do SDK conectados aos emuladores; zero requisições externas observadas.

Capturas locais: test-results/orgao-sem-localizacao-desktop.png e test-results/orgao-sem-localizacao-celular.png. Elas usam dados fictícios.

## Escopo preservado e revisão

Não altera regras, índices, dependências, permissões, IDs, vínculos, importação de CSV ou fluxo de eventos/inscrições. A versão da raiz do lockfile acompanha a proposta; versões de dependências permanecem iguais. As ferramentas de homologação local e o inventário foram preparados em incrementos anteriores e permanecem na mesma branch de trabalho, ainda sem commit.

O Lote 03 não está concluído por esta correção: origem oficial dos órgãos, duplicidade, inativação/reorganização e aceite funcional ainda precisam de trabalho. Situação de contato e validação institucional também precisam de definição; esta mudança não altera a política existente.

## Publicação e retorno

O usuário autorizou enviar as alterações ao GitHub, integrar e publicar a correção. A implantação será conferida separadamente. A correção exige publicar somente o HTML; não exige republicar regras ou índices. Reverter o código não migra nem restaura dados: os campos vazios criados após a correção permanecem vazios. Preferir suspender a publicação se houver divergência de aceite, sem restaurar valores fictícios no banco.
