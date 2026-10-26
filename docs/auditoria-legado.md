# Inventário de legado e decisões de limpeza

Base examinada: `113d629c4565a631bd89a5af4c24c3bf40e26a46` (v0.16.0). Esta revisão reorganiza o código; não afirma homologação integral nem altera dados do Firebase.

| Material | Evidência | Decisão nesta revisão |
| --- | --- | --- |
| index.html atual | Aplicação publicada; mais de quatro mil linhas incluindo script e CSS | Extrair sem reescrever regras: shell, templates, CSS e módulos ES |
| firestore.rules e índices | Controle efetivo de acesso e transações; suítes nativas | Preservar sem alteração; não são lixo nem substituídos pela divisão do front |
| package-lock.json | Instalação reproduzível | Preservar e atualizar com versões exatas das ferramentas de build/auditoria |
| tests/ | Regressão, regras, Auth e nove suítes de navegador | Preservar cenários; adaptar leitura de fonte e servidor de assets à estrutura real |
| scripts/homologacao | Build isolado, seed descartável, servidor e smoke SDK real | Reutilizar o build único; retirar empacotamento e regex duplicados |
| previa-perfis.html | Link no sistema/README e teste de perfis; CSP sem conexões | Mover para public/ mantendo URL previa-perfis.html no artefato |
| v0.40/index.html | Implementação alternativa independente; mesma configuração Firebase de produção | Retirar código antigo da árvore ativa/publicável. Preservar no Git e bundle externo; URL antiga recebe página informativa sem Firebase |
| v0.40/README.md | Documentação extensa de implementação histórica | Retirar junto do HTML antigo; referência imutável preservada |
| Documentos de lotes | Registram decisões, versões e quantidades de testes da época | Manter como histórico; README e mapa passam a descrever o estado atual |
| Plano diretor extraído | Documento fornecido pelo usuário e backlog | Manter para rastreabilidade; não faz parte do artefato do site |
| node_modules, .firebase, dist, test-results | Dependências e saídas geradas | Ignorar no Git; publicar somente dist; não apagar arquivos pessoais para reduzir tamanho |
| Branches/tags | Histórico e possíveis entregas alternativas | Preservar referências remotas. Não reescrever histórico nem apagar trabalho apenas pelo nome da branch |

## Diferenças funcionais de v0.40

Não foi encontrada importação do HTML antigo pela aplicação atual ou pelos testes. Isso não prova ausência de uso do endereço antigo, por isso a URL será mantida com orientação para o sistema atual.

A versão antiga contém implementações diferentes ou recursos sem equivalência integral comprovada: recuperação de senha por e-mail, ficha com QR Code, integração de calendário, seleção de campos para relatórios, importação/exportação de usuários e manutenção de grupos. Não foram incorporados automaticamente. Não se deve tratar esse código como homologado com as regras atuais nem copiá-lo sobre a base nova.

Referência imutável dos dois arquivos: https://github.com/arlindossantos-collab/crm-ati-pe/tree/113d629c4565a631bd89a5af4c24c3bf40e26a46/v0.40/ . A recuperação é possível com `git show <commit>:v0.40/index.html`, fora da árvore publicável. O bundle completo anterior à limpeza foi verificado em `/workspace/preservation/organizacao-v0170/base-v0160.bundle`; é uma preservação local de código, não backup de Firestore/Auth nem armazenamento externo garantido.

## O que não foi classificado como irrelevante

Demandas, Locais, Fornecedores e Bases têm funções em uso e testes. Permanecem separados em módulos, mesmo fora da prioridade de Eventos. Identidade, pessoa, colaborador, contatos e autorização continuam distintos. Testes, regras, lockfile e histórico não foram removidos para diminuir o número de arquivos.
