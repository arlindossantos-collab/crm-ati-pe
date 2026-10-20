# Perfil pessoal e identificação com foto

Base conferida: `main@afdbd6c1d9046500e968c8f82b1c515643086d2c`. Aplicação mantida em um HTML e na versão v0.3.4; sem release neste lote.

## Antes

O cabeçalho mostrava nome/perfil e Sair, sem edição pessoal. Responsáveis GRGD apareciam com iniciais. Cadastros e autoria utilizavam nomes, com parte dos vínculos já registrada por UID. Não havia upload de foto, campos pessoais ou alteração de senha pela interface.

## Depois

- Botão **Perfil** no canto superior direito, com foto circular do usuário autenticado. Está disponível também para usuários de consulta e externos sem módulos liberados.
- Edição do próprio nome, telefone e endereço. E-mail é exibido para identificação e permanece somente leitura. Permissões, tipo, grupos e situação continuam no cadastro administrativo.
- Upload de JPG, PNG e WebP do computador, com prévia, substituição e remoção. Fonte até 8 MB; recorte quadrado central, JPEG de 192 × 192 e no máximo 45.000 caracteres na representação salva. Fotos transparentes recebem fundo branco. Não há upload da imagem original nem envio a serviços externos de imagem.
- A foto é confirmada em **Salvar perfil**; fechar a janela descarta a seleção ainda não salva. Falhas de leitura dos dados pessoais bloqueiam a gravação, evitando apagar campos que ainda não foram carregados.
- **Alterar senha** é uma ação separada: exige senha atual, nova senha diferente com 8+ caracteres e confirmação. Reautentica a própria conta antes de alterar no Firebase Authentication. A política adicional do projeto continua sendo aplicada pelo Firebase. Senhas não são gravadas no Firestore nem em arquivos/logs da aplicação.
- Um mesmo componente mostra foto ou iniciais no menu, usuários, responsáveis nas visões de tabela/calendário/detalhes, seleção GRGD e autoria dos registros. Os detalhes de demandas mostram os autores de andamentos; os detalhes de eventos mostram as inscrições disponíveis para a sessão, com identificação.
- Novas autorias/andamentos guardam UID, mantendo os nomes históricos. Não se associa foto a pessoa por igualdade de nome. Nomes antigos sem vínculo continuam com iniciais até a vinculação assistida. Quem não tem foto ou tem imagem indisponível também usa iniciais.

## Organização dos dados

O diretório mínimo substitui a leitura de perfis de acesso completos por colaboradores nas demandas. Esta descrição atualiza o comportamento do diretório registrado no lote anterior, em `cadastro-usuarios.md`.

| Caminho | Conteúdo e acesso |
| --- | --- |
| `usuarios/{uid}` | Perfil de acesso existente, nome e foto pequena. Leitura pelo titular ou administrador. Edição própria limitada a nome, foto e data da edição pessoal; permissões administrativas preservadas. |
| `usuarios/{uid}/privado/perfil` | Telefone, endereço e data. Leitura/escrita apenas pelo titular ativo, inclusive para impedir acesso de outro administrador pela aplicação. Sem senhas ou outros campos. |
| `identidadesUsuarios/{uid}` | Projeção de UID, nome, foto, tipo e situação. Não contém telefone, endereço, e-mail ou permissões. Administradores consultam o conjunto; internos e usuários com Eventos consultam identificações GRGD ativas. O titular pode consultar sua identificação. |

Salvar o perfil grava os três documentos atomicamente com `writeBatch`. Criação/edição/inativação administrativa atualiza perfil e identificação no mesmo lote. As regras validam o conteúdo compartilhado contra o perfil após o lote. Uma falha de regras não deixa nome/foto/contatos parcialmente salvos.

O código não usa Cloud Storage nem exige novo serviço para arquivos: a foto já reduzida fica no Firestore. Isso mantém esta primeira etapa compatível com a hospedagem atual e futura VM. Há duas cópias pequenas (perfil e identificação); a imagem não é copiada para cada demanda ou autor.

## Validação executada

- `npm test`: **54 testes aprovados**, incluindo os 39 anteriores e novos testes de perfil, foto, sessões, senha e preservação de permissões.
- `npm run test:rules`: **25 testes aprovados** no Firestore Emulator, projeto demo isolado. Cobrem isolamento de dados pessoais, projeção mínima, rejeição de escalada de permissões, tipos/tamanhos de foto e atomicidade das gravações.
- `npm run test:auth`: **2 testes aprovados** no Authentication Emulator, executando a função de troca de senha do HTML com o SDK real. Verifica rejeição da senha antiga após troca e preservação da senha quando a atual está incorreta.
- Chromium com DOM e processamento real de imagens; Firebase simulado no navegador. Upload, prévia, salvar/remover/cancelar, erros, alteração de senha, fotos nas identificações e logout. Conferência visual em desktop e celular (390 e 320 px).
- Nenhum teste lê ou altera dados/contas reais de produção. Não houve implantação de regras nem publicação neste lote.

Para repetir: `npm ci`, `npm test`, `npm run test:rules`, `npm run test:auth`. Emuladores exigem Java 17+ para Firestore, Node 20/22 recomendado e rede para o primeiro download. Os testes usam somente `demo-prgd-usuarios`; os testes de Auth recusam execução sem host local de emulador. O teste do navegador foi executado no ambiente de trabalho com dados sintéticos.

## Implantação e limites

1. Revisar o PR e homologar em projeto Firebase separado, configurando o HTML para esse projeto. Testar contas interna/externa/administrativa, foto, leitura de telefone/endereço, senha e demandas antigas.
2. Publicar as novas regras do Firestore no projeto correto, de forma coordenada com o HTML, e recarregar as sessões. GitHub Pages publica o HTML, **não as regras**. Com regras antigas, salvar foto/dados pessoais será recusado.
3. Perfis antigos não são migrados em massa. A projeção compartilhada é criada ao salvar o perfil ou pelo cadastro administrativo. Fotos só são associadas onde o usuário tem vínculo por UID; não há dedução por nome, inclusive em históricos antigos.
4. Operações diretas no Console/Admin SDK precisam manter a projeção de identificação sincronizada. A identificação compartilhada não concede acesso: módulos e situação continuam sendo verificados no perfil de acesso.
5. Confirmar em homologação a política de senha, domínios autorizados e funcionamento de imagens no navegador usado pela equipe. O emulador não substitui essa validação de configuração.
6. Não reverter para regras antigas que liberem perfis ou dados pessoais. Retorno de HTML/regras deve considerar os novos documentos e preservar seus dados.

A migração para VM, os demais acessos externos, convites/recuperação de senha, relatórios e regras de vagas/duplicidade de inscrições permanecem fora deste lote.
