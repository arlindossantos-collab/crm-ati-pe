# PRGD — Plataforma de Relacionamento do Governo Digital

Sistema da Gerência de Relacionamento do Governo Digital (GRGD), da ATI/PE, para acompanhar demandas, órgãos, eventos e cadastros de apoio.

**Versão deste código: v0.14.0 — relatórios de inscrições por evento no painel gerencial.** Base: `main@9e4e7df89cba247e2db07557ef41ab02b01e001e` (v0.13.0 integrada). Os botões de relatório de Eventos passam a exportar CSV com inscrições carregadas, distinguindo registros institucionais dos antigos e inscrições confirmadas de canceladas. A exportação é exclusiva do administrador, não comprova presença e não altera dados, regras ou índices do Firebase. **Entrega em revisão, ainda não publicada no site.** Consulte [funcionamento e limites](docs/relatorios-inscricoes.md).

[Acessar o sistema](https://arlindossantos-collab.github.io/crm-ati-pe/) · [Histórico de mudanças](CHANGELOG.md) · [Mapa de organização](docs/mapa-organizacao.md)

A versão do site depende da integração e da publicação deste código. Uma branch ou um Pull Request em rascunho não atualiza o site. As releases oficiais ficam na [página de versões do GitHub](https://github.com/arlindossantos-collab/crm-ati-pe/releases).

## O que o sistema oferece

| Área | Recursos presentes no código atual |
| --- | --- |
| Demandas | Cadastro, buscas, filtros, prioridades, responsáveis GRGD, calendário e registros de andamento. |
| Clientes e órgãos | Cadastros institucionais, contatos, filtros e importação de CSV. |
| Eventos | Consulta e cadastro de eventos; inscrições associadas ao evento e à pessoa; relatórios CSV geral e por evento, exclusivos do administrador (v0.14.0 em revisão). |
| Locais | Indicadores, filtros, capacidade, contatos, recursos, painel de detalhes, histórico e consulta de agenda. |
| Fornecedores | Cadastros e consultas de apoio às atividades. |
| Colaboradores — painel gerencial | Cadastros e órgãos; matrícula, pesquisa e filtros; contas de acesso e permissões; setores e grupos. |
| Colaboradores — painel externo | Cadastro, edição e inativação no escopo delegado, sem conta de acesso para o beneficiário. |
| Inscrições institucionais | Novos eventos com órgãos elegíveis, período, vagas em transação, cancelamento, retomada e comprovante imprimível. |
| Perfil pessoal | Edição do próprio nome, telefone e endereço, foto enviada do computador e troca de senha com confirmação da senha atual. |
| Identificação | Foto ou iniciais no cabeçalho e nos registros com vínculo ao identificador da pessoa. |
| Histórico de alterações | Consulta administrativa com pessoa, data/hora, registro, ação e campos modificados; busca e carregamento por páginas. |
| Dashboard e bases | Indicadores, gráficos e cadastros auxiliares. |

Usuários internos ativos podem ser selecionados como responsáveis GRGD. O tipo interno não concede administração automaticamente. Registros antigos sem vínculo continuam preservados, sem associação automática por nome.

## O que mudou nesta entrega

A v0.11.0 separa a apresentação do portal do órgão da área de trabalho interna. Gestores de NSI, substitutos, auditoria autorizada e contas externas recebem menu lateral no computador e navegação horizontal no celular. A página Meu órgão mostra somente os indicadores, dados e atalhos permitidos no escopo do vínculo; consulta pendente ou recusada não é apresentada como zero. Cadastros, inscrições, comprovantes e perfil pessoal usam os fluxos existentes.

A interface é escolhida automaticamente pelo perfil cadastrado. Não há seletor de papel na aplicação real nem novas permissões. Administradores e equipe GRGD, inclusive usuários internos legados, continuam na área interna. Ver [mapeamento e validação](docs/layout-por-perfil.md).

### Base v0.10.1


A v0.10.1 corrige reinícios desnecessários dos snapshots quando a ordem dos campos ou metadados muda, mantém o nome do órgão estável, atualiza os setores sem apagar dados digitados, inclui filtro de colaboradores por setor e mantém eventos de hoje em Futuros até o horário final ou fim do dia local. Falha na consulta não é apresentada como ausência de eventos. Veja [causas, validação e implantação](docs/correcoes-portal-nsi.md).

A v0.10.0 habilita o gestor e seu substituto para cadastrar colaboradores e inscrevê-los em novos eventos institucionais, com elegibilidade por órgão, controle atômico de vagas, prevenção de duplicidade por e-mail, cancelamento com liberação da vaga e comprovante consultado no servidor. Cada alteração preserva autoria e histórico.

As operações exigem liberação administrativa expressa, ações e prazos válidos. Na v0.10.1, responsáveis e referências das aprovações são opcionais; a decisão administrativa continua registrada com autoria e horário. Vínculos da v0.9.0 continuam em consulta até revisão individual. Eventos anteriores conservam o fluxo original e não são convertidos automaticamente. Consultar [modelo e roteiro do lote](docs/inscricoes-institucionais.md).

### Base v0.9.0

A v0.9.0 acrescenta vínculos institucionais por órgão e setores, ações por função, referências das aprovações GRGD/autoridade e prazos de validade/revisão. Contatos e autenticação não concedem o papel de NSI automaticamente. O administrador registra as aprovações recebidas e a aplicação protege o escopo também nas regras.

O primeiro lote entregou consultas de Meu órgão, Colaboradores, Inscrições do órgão e Auditoria autorizada, além da edição GRGD nos módulos explicitamente permitidos. A v0.10.0 acrescenta inscrição por representação, cadastro de colaboradores pelo gestor e comprovantes, mediante liberação operacional expressa. Usuários antigos são preservados para revisão individual.

Abrir a [prévia com dados fictícios](previa-perfis.html) para explorar a matriz de perfis sem conexão a serviços. Consultar [modelo, limites, validação e implantação](docs/perfis-vinculos.md). A prévia é ilustrativa; o fluxo completo do novo lote é validado com dados fictícios nas suítes de navegador.

### Entregas anteriores

A v0.8.0 mantém os controles de exclusão visíveis somente para administradores e pede a **senha da própria conta** antes de confirmar. Usuários são retirados do cadastro ativo, com bloqueio da autoexclusão; outros registros seguem a exclusão já existente. As regras passam a exigir autenticação recente para excluir e, na exclusão de usuários, o histórico no mesmo envio. Não altera automaticamente os perfis de acesso cadastrados.

As gravações feitas pela aplicação registram a pessoa, o horário do servidor, a ação e os nomes dos campos alterados. O botão **Histórico de alterações** permite consultar esses registros. Valores de senhas, contatos e fotos não são copiados para o histórico. A troca de senha registra apenas que ocorreu; Authentication e Firestore são serviços separados, portanto uma falha posterior do histórico é informada sem desfazer a nova senha. Não há recuperação retroativa de alterações nem captura de operações feitas diretamente no console ou por outros programas.

Ao atualizar com F5, uma indicação de carregamento aguarda a recuperação da sessão e das permissões, sem exibir o formulário de login no intervalo. A última aba e a visualização de Demandas são restauradas na mesma guia do navegador. **Esta versão altera as regras do Firebase e exige publicação coordenada.** Consulte [implantação e limites](docs/seguranca-auditoria-sessao.md).

A v0.7.0 acrescenta **Editar** e **Excluir** na lista de usuários e **Salvar usuário** no formulário. A sessão principal usa persistência local após F5 e reabertura; **Sair** encerra a sessão. Exclusão lógica exige confirmação, bloqueia a própria conta e preserva histórico, dados pessoais e conta Auth. O e-mail permanece reservado. Armazenamento bloqueado pode impedir a persistência.

A v0.6.3 acrescenta apenas ícones e fundos discretos em azul/verde aos seis indicadores de Locais. A posição da consulta e a organização atual da tela permanecem iguais. Não altera dados, cálculos ou regras do Firebase.

A v0.6.2 desfaz os ajustes visuais da v0.6.1 por solicitação do usuário: restaura os cards anteriores e a consulta de disponibilidade abaixo do conteúdo. Mantém indicadores, filtros, cadastros, histórico e cálculos da v0.6.0. A numeração avança para registrar a reversão sem apagar o histórico. Dados e regras do Firebase não mudam.

A v0.6.0 moderniza Locais com indicadores, filtros, recursos, detalhes abaixo da tabela e consulta de conflitos por data/horário. Eventos ganham vínculo com o local por ID e custo total previsto. Os indicadores respeitam dados ausentes e agenda parcial; consulta não confirma reserva. Não há mudança de regras do Firebase nesta proposta. O histórico abaixo registra a entrega anterior.

A [Release 01 — v0.4.0](CHANGELOG.md#v040) descreve o antes/depois das funcionalidades, as correções, os testes e as pendências para consulta pela gestão.

As funcionalidades foram integradas nos PRs #2, #3, #4 e #6 quando a aplicação ainda mostrava v0.3.4. Esta atualização corrige a identificação da versão e consolida seu histórico; não apresenta esses recursos como desenvolvidos novamente.

## Organização do repositório

| Arquivo ou pasta | Finalidade |
| --- | --- |
| `index.html` | Aplicação atual, com HTML, CSS e JavaScript no mesmo arquivo. |
| `firestore.rules` | Regras de acesso e validação dos dados no Firebase. |
| `firebase.json` | Referência das regras e configuração alternativa de Firebase Hosting. |
| `firebase.test.json` | Configuração dos emuladores locais para testes. |
| `package.json` e `package-lock.json` | Comandos, ferramentas de desenvolvimento e versões das dependências. |
| `tests/` | Testes de regressão, permissões e alteração de senha. |
| `docs/` | Detalhes técnicos das entregas e mapa de organização. |
| `v0.40/` | Versão histórica alternativa, ainda pendente de comparação funcional antes da retirada. |

O mapa registra o que manter, organizar e avaliar para exclusão. A versão antiga não é a base de trabalho atual.

## Documentação para manutenção

- [Governança dos vínculos e telas por perfil](docs/perfis-vinculos.md).
- [Cadastro de usuários e responsáveis GRGD](docs/cadastro-usuarios.md).
- [Perfil pessoal, foto e privacidade dos dados](docs/perfil-pessoal.md).
- [Exclusão com senha, histórico e restauração da sessão](docs/seguranca-auditoria-sessao.md).
- [Registro histórico do primeiro lote de correções](docs/correcoes-primeiro-lote.md).
- [Mapeamento de arquivos, branches e limpeza](docs/mapa-organizacao.md).
- [Como alterar, versionar e publicar](CONTRIBUTING.md).
- [README anterior, preservado no histórico do Git](https://github.com/arlindossantos-collab/crm-ati-pe/blob/c2c13c3b31b9765930f1e32ea04d416aa79846cf/README.md).

Os documentos dos lotes anteriores registram a situação na época de cada entrega. Para o estado consolidado e as atualizações posteriores, consultar este README e o CHANGELOG.

## Executar e testar

A aplicação precisa de um servidor HTTP/HTTPS, internet, acesso às bibliotecas externas e conexão com o Firebase. Abrir o HTML diretamente como arquivo não equivale a testar a hospedagem.

O código usa Firebase Authentication e Cloud Firestore do projeto `prgd-ati-pe`. Para testes funcionais com gravações, configurar um projeto de homologação separado. Um servidor local, por si só, não isola os dados de produção.

Para executar os testes automatizados, utilizar Node.js 22 e, para o emulador Firestore desta configuração, Java 17 ou superior:

```bash
npm ci
npm test
npm run test:rules
npm run test:auth
```

Os testes da aplicação usam dados simulados. Os testes de regras e de senha usam emuladores no projeto de demonstração `demo-prgd-usuarios`. Não equivalem a homologação de todos os fluxos em produção.

## Publicar

O site atual utiliza GitHub Pages. As regras do Firestore são publicadas separadamente no Firebase; publicar o HTML no GitHub não publica essas regras.

Cada entrega funcional publicada deve ter versão sincronizada, descrição no CHANGELOG e, quando autorizada a publicação da release, uma tag e uma página de release no GitHub. Consulte o procedimento em [CONTRIBUTING.md](CONTRIBUTING.md).

A hospedagem futura prevista é uma **VM no DataCenter da ATI**. Essa mudança ainda precisa de planejamento com as equipes responsáveis. Hospedar o HTML na VM não migra automaticamente Authentication nem Firestore.

## Pendências conhecidas

- Homologar os vínculos institucionais e completar cadastro de participantes, inscrições por representação, elegibilidade e comprovantes.
- Evoluir regras de eventos, duplicidade de inscrições e controle concorrente de vagas.
- Homologar integralmente os perfis, fotos e senha no ambiente institucional.
- Revisar relatórios, importação e recursos exclusivos da versão histórica antes de decidir sua incorporação ou retirada.
- Definir a publicação coordenada do HTML e das regras, além da operação futura em VM.

A v0.8.0 altera novamente `firestore.rules`: as regras publicadas para a v0.7.0 não são suficientes para o novo histórico. Em 21/10/2026, o usuário informou ter publicado as regras revisadas antes da liberação do HTML; confirmação baseada no relato, sem verificação direta do console nesta sessão. Durante a transição, a v0.7.0 não consegue excluir usuários porque não envia o histórico exigido; as demais gravações antigas conservam os acessos existentes. GitHub Pages publica somente o site. A validação integrada no projeto institucional continua pendente; os testes não alteram contas reais.
