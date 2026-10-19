# PRGD — Plataforma de Relacionamento do Governo Digital

> **Aplicação institucional da ATI-PE para relacionamento, demandas e organização de eventos.**

| Informação | Descrição |
|---|---|
| Nome | Plataforma de Relacionamento do Governo Digital |
| Sigla | PRGD |
| Versão identificada no HTML analisado | **v0.3.4** |
| Interface | Web responsiva, em português do Brasil (`pt-BR`) |
| Frontend | HTML5, CSS e JavaScript ES Modules |
| Estilização | Tailwind CSS via CDN |
| Ícones | Font Awesome 6.4.0 via CDN |
| Gráficos | Chart.js via CDN |
| Autenticação e dados | Firebase Authentication e Cloud Firestore |
| Hospedagem informada | GitHub Pages |
| URL informada | <https://arlindossantos-collab.github.io/crm-ati-pe/> |

> **Nota sobre a versão:** o README anterior descrevia a versão **v0.43** e recursos como Drag & Drop, QRCode.js, histórico `versoesAnteriores[]` e recuperação de senha. O HTML anexado nesta análise identifica-se como **v0.3.4**. A documentação abaixo prioriza o código efetivamente enviado; funcionalidades descritas no README anterior que não foram localizadas nesse HTML não são apresentadas como implementadas. A versão exibida na interface, no comentário inicial e no log do módulo JavaScript deve ser mantida sincronizada com o código publicado.

---

## 1. Visão geral

O PRGD centraliza informações de relacionamento institucional da ATI-PE, acompanhamento de demandas, cadastro de órgãos/clientes, planejamento de eventos, catálogo de locais, fornecedores, usuários, grupos e bases de dados auxiliares.

A aplicação é uma página web que executa no navegador e utiliza serviços Firebase para autenticação e persistência. Os dados são recebidos por listeners do Firestore, permitindo atualizar as telas quando há alterações na base.

### Objetivos funcionais

- Consolidar dados de órgãos e contatos institucionais.
- Organizar demandas, responsáveis, prioridades, status e calendário semanal.
- Apoiar a divulgação e a gestão de eventos.
- Registrar inscrições de usuários em eventos.
- Manter catálogos de locais e fornecedores.
- Administrar usuários, perfis, módulos permitidos, grupos e tags.
- Exibir indicadores gerenciais e permitir exportação de dados.

### Público-alvo funcional

- Equipes de relacionamento e gestão da ATI-PE.
- Usuários institucionais autorizados a consultar os módulos liberados para seu perfil.
- Administradores responsáveis pela manutenção dos cadastros e permissões.

O público-alvo acima descreve a finalidade da aplicação; a concessão efetiva de acesso depende da configuração do Firebase Authentication, do perfil cadastrado e das regras do Firestore.

---

## 2. Escopo desta documentação e ressalvas

Este README foi elaborado a partir de dois artefatos fornecidos:

1. `index (22).html` — código HTML/JavaScript da aplicação analisada.
2. `README_old (1).md` — documentação anterior, utilizada como referência e atualizada para evitar atribuir ao código atual funcionalidades não confirmadas.

O endereço publicado foi considerado como referência de implantação, mas a documentação técnica não equivale a um teste funcional autenticado da aplicação em produção. Não foram fornecidas as regras publicadas do Firestore, a configuração completa do projeto Firebase no Console, nem credenciais de teste. Portanto:

- não se afirma que as regras de segurança atualmente publicadas sejam adequadas;
- não se afirma que todos os fluxos funcionem em produção apenas por existirem no HTML;
- a documentação distingue recursos visíveis no código de itens que precisam de validação no ambiente Firebase;
- não foram incluídos dados reais, credenciais ou senhas de usuários.

---

## 3. Arquitetura

### 3.1 Visão lógica

```text
┌─────────────────────────────────────────────┐
│ Usuário                                     │
│ Navegador desktop / dispositivo móvel       │
└──────────────────────┬──────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────┐
│ Frontend PRGD                               │
│ HTML5 + CSS + JavaScript ES Modules         │
│ Tailwind CSS + Font Awesome + Chart.js      │
│ Navegação, formulários, filtros e tabelas   │
└───────────────────┬─────────────────────────┘
                    │ SDK Firebase para Web
          ┌─────────┴──────────┐
          ▼                    ▼
┌─────────────────────┐  ┌────────────────────────┐
│ Firebase Auth       │  │ Cloud Firestore        │
│ Login e logout      │  │ Dados dos módulos      │
│ Estado da sessão    │  │ Listeners em tempo real│
└─────────────────────┘  └────────────────────────┘
```

### 3.2 Tecnologias identificadas

| Tecnologia | Uso observado |
|---|---|
| HTML5 | Estrutura das telas e formulários |
| CSS | Estilos complementares e ajustes de interface |
| Tailwind CSS | Classes utilitárias para layout e responsividade, carregadas por CDN |
| Font Awesome 6.4.0 | Ícones de navegação, ações e indicadores |
| Chart.js | Gráficos do Dashboard |
| Firebase JavaScript SDK 10.8.0 | Integração com autenticação e banco de dados |
| Firebase Authentication | Login por e-mail e senha, logout e observação do estado da sessão |
| Cloud Firestore | Persistência e sincronização dos registros |

**Não identificado no HTML enviado:** framework frontend como React/Vue/Angular, backend próprio com API REST, servidor de aplicação dedicado, QRCode.js, Firebase Storage ou biblioteca de testes automatizados.

### 3.3 Modelo de execução

A aplicação é composta por um único arquivo HTML com JavaScript modular incorporado. As bibliotecas visuais são carregadas externamente por CDN e o código importa módulos Firebase diretamente de `gstatic.com`.

Consequências práticas:

- é necessário acesso à internet para carregar a página, os CDNs e os serviços Firebase;
- indisponibilidade ou bloqueio de uma dependência externa pode afetar parte da interface;
- alterações de código exigem republicação do HTML no repositório de hospedagem;
- a lógica executada no navegador não deve ser tratada como fronteira de segurança: as regras do Firestore precisam validar cada operação.

---

## 4. Publicação e configuração

### 4.1 Hospedagem

A URL informada para a aplicação é:

<https://arlindossantos-collab.github.io/crm-ati-pe/>

O projeto aparenta seguir o modelo de publicação estática do GitHub Pages. Para confirmar o processo real de deploy, devem ser verificados no repositório as configurações de Pages, a branch/pasta de publicação e eventuais workflows.

### 4.2 Firebase utilizado pelo HTML

O código contém configuração de cliente para o projeto Firebase `prgd-ati-pe`, incluindo:

- `authDomain`;
- `projectId`;
- `storageBucket`;
- `messagingSenderId`;
- `appId`;
- `measurementId`.

A configuração está declarada no próprio HTML, como é comum em aplicações web Firebase. A `apiKey` de configuração de cliente não deve ser confundida com uma credencial administrativa de servidor. Ainda assim, a proteção real dos dados depende das regras do Firestore, da configuração do Authentication, das restrições de API aplicáveis e da gestão adequada de permissões.

**Não copie chaves privadas, tokens, senhas ou credenciais de serviço para o frontend.** Credenciais administrativas devem permanecer em ambiente de servidor seguro, nunca no HTML publicado.

### 4.3 Requisitos para executar

- Navegador moderno com suporte a JavaScript ES Modules.
- Conectividade com os CDNs utilizados e com o Firebase.
- Projeto Firebase configurado e ativo.
- Firebase Authentication configurado para e-mail e senha.
- Cloud Firestore criado e com regras compatíveis com os fluxos autorizados.
- Usuários previamente cadastrados no Authentication e perfis correspondentes na coleção `usuarios`.

### 4.4 Procedimento de publicação recomendado

1. Revisar o HTML e o número da versão.
2. Testar login, logout e os módulos afetados em ambiente de homologação.
3. Conferir as regras do Firestore e testar operações permitidas e negadas.
4. Publicar a alteração no repositório GitHub.
5. Aguardar a atualização do GitHub Pages.
6. Testar a URL publicada em janela anônima e em um navegador/dispositivo diferente.
7. Registrar a versão publicada e as mudanças no histórico deste README.

---

## 5. Autenticação e sessão

### 5.1 Login

A tela inicial apresenta:

- identificação PRGD;
- campo de e-mail institucional;
- campo de senha;
- botão **Autenticar e Entrar**;
- área de mensagem de erro;
- identificação da versão.

O código utiliza `signInWithEmailAndPassword()` do Firebase Authentication. O conteúdo principal permanece oculto até que o Firebase informe uma sessão autenticada.

### 5.2 Carregamento do perfil

Após a autenticação, a aplicação consulta o documento correspondente ao UID do usuário na coleção `usuarios`. Quando o documento existe, seus dados são combinados com o e-mail autenticado.

Quando não é possível carregar o perfil, o código adota um perfil de contingência com acesso comum e módulos predefinidos. Esse comportamento merece atenção: o perfil de contingência é uma decisão da interface e não deve ampliar permissões no Firestore. As regras do banco devem continuar negando operações que não estejam autorizadas.

### 5.3 Persistência da sessão

O código configura:

```javascript
setPersistence(auth, inMemoryPersistence)
```

Assim, a persistência é definida em memória para o contexto atual. Não se deve documentar o comportamento como uma sessão local permanente entre reinicializações do navegador.

### 5.4 Logout

O botão **Sair** utiliza `signOut()`. A aplicação acompanha o estado da autenticação por `onAuthStateChanged()` e interrompe os listeners anteriores antes de iniciar os listeners da sessão corrente.

### 5.5 Recuperação de senha

**Não foi localizada no HTML analisado** uma chamada a `sendPasswordResetEmail()` nem um fluxo de recuperação de senha visível na tela de login. Se a funcionalidade for necessária, deverá ser implementada e testada explicitamente.

---

## 6. Perfis, módulos e autorização

O código trabalha com os perfis `admin` e `comum`.

### 6.1 Administrador

Os elementos com a classe `btn-admin-only` são destinados a operações administrativas, como criação, edição, exclusão, importação e relatórios, conforme o módulo e a função implementada.

### 6.2 Usuário comum

O conjunto de módulos visíveis é controlado pelo campo `modulosPermitidos` do perfil. O código utiliza uma configuração padrão quando não há perfil carregado, incluindo os módulos `dashboard`, `demandas`, `eventos` e `clientes`.

### 6.3 Módulos conhecidos pelo frontend

| Identificador | Nome apresentado |
|---|---|
| `dashboard` | Dashboard |
| `demandas` | Demandas |
| `clientes` | Clientes |
| `eventos` | Eventos |
| `locais` | Locais |
| `fornecedores` | Fornecedores |
| `usuarios` | Usuários |
| `bases` | Bases |

### 6.4 Princípio de segurança

Ocultar abas e botões é apenas controle de interface. **Não substitui regras de segurança do Firestore.** O banco deve validar identidade, perfil e permissões em cada leitura ou gravação. É necessário revisar as regras efetivamente publicadas antes de considerar o sistema pronto para dados institucionais.

---

## 7. Módulos funcionais

### 7.1 Dashboard

Apresenta indicadores consolidados para acompanhamento da operação:

- demandas ativas;
- eventos programados;
- locais/auditórios;
- clientes cadastrados;
- fornecedores TIC.

O HTML contém áreas de gráfico para:

- demandas por categoria;
- status das solicitações;
- tipos jurídicos de clientes.

Os gráficos utilizam Chart.js. A exatidão dos indicadores depende da consistência dos dados e da lógica de contagem do frontend.

### 7.2 Demandas

O módulo permite acompanhar solicitações e atividades da área de relacionamento.

#### Recursos identificados na interface

- tabela de demandas;
- busca textual;
- filtro por status;
- filtro por prioridade;
- ordenação por recentes, antigas ou prioridade;
- alternância entre visão de tabela e visão **Calendário & Backlog**;
- cadastro de nova demanda, restrito pela interface aos administradores;
- exibição de solicitante, demanda, detalhes, responsável GRGD, data específica, dia da semana, prioridade e status;
- legenda de prioridades e status.

#### Status apresentados

- Em Andamento;
- Pausado;
- Cancelado;
- Concluído.

#### Prioridades apresentadas

- Alta;
- Média;
- Baixa.

#### Calendário e backlog

A interface contempla:

- backlog de atividades pendentes;
- calendário semanal de segunda a sexta-feira;
- calendário mensal com navegação para mês anterior, próximo mês e retorno ao mês atual.

O código contém uma ação para alterar o `diaSemana` da demanda e gravar o registro atualizado com informações de atualização e autor. A mudança pode ser feita pelo controle de seleção de dia presente na interface.

**Limite importante:** no HTML analisado não foram encontrados os atributos/eventos `draggable` ou `dragstart`, nem o campo `versoesAnteriores`. Portanto, não se deve considerar implementados neste arquivo o Drag & Drop e o versionamento histórico descritos no README anterior. A movimentação por seleção de dia não equivale a arrastar e soltar.

#### Campos e auditoria

O código grava dados de criação/atualização e, em determinadas operações, registra entradas em `historicoAcoes`, com data, autor e texto do andamento. A estrutura exata dos campos pode variar conforme a operação e deve ser validada na função de cadastro/edição correspondente.

### 7.3 Clientes / órgãos

O módulo apresenta os órgãos como clientes institucionais e oferece:

- busca por nome, sigla ou gestor;
- filtro por modalidade de gestor;
- filtro por situação cadastral;
- tabela com identificação, telefones, gestor, e-mail, situação e atualização;
- importação de CSV;
- criação de novo cliente;
- ação administrativa para limpar a base de clientes.

As modalidades de gestor visíveis incluem:

- Gestor do Órgão (principal);
- Gestor do NSI;
- Gestor de Telemática;
- Gestor de SI;
- Gestor do SEI.

A coleção utilizada é `orgaos`. A interface contém lógica para persistir a modalidade selecionada e os dados do órgão.

**Atenção operacional:** a ação **Limpar Todos** é destrutiva e pode apagar registros da coleção na nuvem. Deve ser protegida por autorização no Firestore, confirmação explícita, cópia de segurança e procedimento de recuperação.

#### Importação CSV

O módulo disponibiliza seleção de arquivo `.csv`. A estrutura de colunas, separador, codificação e política de duplicidade devem ser confirmados no código do importador e testados com uma cópia da planilha antes de importar dados de produção. Não se deve presumir que qualquer CSV será aceito.

### 7.4 Eventos

O módulo de eventos inclui:

- busca por evento, palestrante e local;
- alternância entre eventos futuros e realizados;
- cards de eventos;
- cadastro de evento;
- relatório geral de inscrições, disponível pela interface administrativa.

O formulário de eventos deve ser usado para registrar as informações previstas no próprio formulário, incluindo dados de identificação, período, local e demais campos disponíveis na versão publicada.

O código mantém consultas relacionadas a eventos e inscrições no Firestore. O comportamento de visibilidade de eventos deve ser confirmado com as regras do banco e com os perfis de teste.

### 7.5 Inscrições

O HTML contém ação de inscrição que grava um documento na coleção `inscricoes`, incluindo identificador do evento, UID do usuário, nome, e-mail e data de criação.

A estrutura observada no fluxo simples de inscrição inclui:

```javascript
{
  eventId: "...",
  uid: "...",
  nome: "...",
  email: "...",
  criadoEm: "..."
}
```

A coleção também é acompanhada por listener em tempo real.

**Pontos a validar antes de uso operacional:**

- prevenção de inscrições duplicadas;
- aplicação consistente do limite de vagas;
- cancelamento de inscrição;
- sincronização segura do contador de inscritos;
- autorização para leitura de dados pessoais dos participantes;
- exportação dos relatórios;
- comportamento em inscrições concorrentes.

O README anterior descrevia controles mais completos de inscrição, cancelamento, comprovante e contagem. Esses fluxos devem ser considerados confirmados somente após revisão do código completo correspondente e testes de ponta a ponta; não devem ser presumidos a partir da simples existência da coleção `inscricoes`.

### 7.6 Locais / auditórios

A interface contém módulo próprio para cadastro e consulta de locais. Ele deve funcionar como catálogo de espaços disponíveis para atividades e eventos. Os campos efetivamente disponíveis devem ser conferidos no formulário da versão publicada antes de se definir um modelo de importação ou integração.

### 7.7 Fornecedores

A interface contém módulo próprio para cadastro e consulta de fornecedores, com formulário de criação e listagem. Recomenda-se manter padronizados os nomes, categorias, contatos e demais campos para facilitar pesquisa, relatórios e futura importação.

### 7.8 Usuários

O módulo apresenta pesquisa e filtros de usuários, além de campos administrativos para cadastro. O código consulta a coleção `usuarios` para carregar o perfil da sessão e acompanha alterações do perfil do usuário autenticado.

O gerenciamento de contas no Firebase Authentication e o cadastro de perfil no Firestore são operações distintas. Deve existir um procedimento administrativo para evitar contas autenticáveis sem perfil correspondente ou perfis sem conta válida.

### 7.9 Grupos

A coleção `grupos` é carregada pelo código. Os grupos podem apoiar a organização de usuários e a definição de visibilidade de informações, conforme a lógica de tela e os campos cadastrados.

A presença da coleção no frontend não garante, por si só, que a restrição por grupos esteja aplicada no banco. Essa regra precisa ser validada no Firestore.

### 7.10 Bases dinâmicas

A aplicação possui módulo de Bases e carrega a coleção `bases`. Essa coleção pode servir como fonte de valores de referência usados em formulários. A consistência dos valores cadastrados é importante para impedir variações de nomenclatura que prejudiquem filtros e relatórios.

---

## 8. Coleções do Cloud Firestore

As coleções encontradas nas chamadas de acesso do HTML incluem:

| Coleção | Finalidade observada |
|---|---|
| `demandas` | Registros de demandas e atividades |
| `eventos` | Cadastro e consulta de eventos |
| `inscricoes` | Inscrições de participantes em eventos |
| `orgaos` | Clientes/órgãos institucionais |
| `locais` | Catálogo de locais |
| `fornecedores` | Cadastro de fornecedores |
| `usuarios` | Perfis e dados de usuários |
| `grupos` | Cadastro/consulta de grupos |
| `bases` | Valores de referência e bases dinâmicas |

### 8.1 Identificadores

O código utiliza identificadores de documentos do Firestore e, em alguns fluxos, campos `id` de negócio. A aplicação também expõe `firestoreId` na memória do frontend para identificar o documento original.

É importante manter a distinção entre:

- **ID do documento Firestore:** identificador real usado nas operações `doc(db, coleção, id)`;
- **campo `id` do registro:** identificador adicional armazenado nos dados;
- **UID do Firebase Authentication:** identificador da conta autenticada.

Esses valores não são necessariamente iguais. Importações, exclusões e atualizações devem usar o identificador correto.

### 8.2 Sincronização

O código usa `onSnapshot()` para acompanhar coleções e alguns documentos/consultas. Isso permite atualizar os dados da interface sem recarregar a página, desde que a conexão esteja disponível e as regras autorizem a leitura.

Listeners devem ser encerrados quando a sessão muda ou quando deixam de ser necessários, para evitar assinaturas duplicadas e leituras desnecessárias.

---

## 9. Importação, exportação e relatórios

### Importação

A interface disponibiliza importação CSV para clientes/órgãos e outro controle de importação em módulo administrativo. Antes de usar:

1. faça cópia de segurança dos dados atuais;
2. confirme o cabeçalho e o separador esperado;
3. normalize acentos, espaços, telefones e siglas;
4. teste com poucas linhas;
5. verifique duplicidades e resultados;
6. registre a data e o responsável pela importação.

### Exportação

Existe um botão global **Exportar Dados** e ações de relatório em módulos específicos. O formato, o conjunto de coleções exportadas e os campos incluídos devem ser conferidos na implementação correspondente e validados com dados de teste.

Arquivos exportados podem conter dados pessoais ou informações institucionais. Devem ser guardados em local autorizado e compartilhados somente com pessoas que tenham necessidade de acesso.

---

## 10. Interface e experiência de uso

### 10.1 Identidade visual

A interface utiliza azul escuro como cor institucional predominante, com cartões brancos, fundos em tons claros, indicadores coloridos e ícones Font Awesome.

### 10.2 Navegação

A navegação principal é organizada em abas:

1. Dashboard;
2. Demandas;
3. Clientes;
4. Eventos;
5. Locais;
6. Fornecedores;
7. Usuários;
8. Bases.

### 10.3 Responsividade

O layout usa classes responsivas do Tailwind CSS, com mudanças de grade e alinhamento para diferentes larguras. Algumas tabelas têm largura mínima e rolagem horizontal, comportamento esperado para preservar colunas em telas estreitas.

### 10.4 Acessibilidade e usabilidade

Há uso de rótulos, campos obrigatórios em formulários, mensagens de alerta e alguns atributos ARIA. Recomenda-se validar por teste:

- navegação completa por teclado;
- foco visível nos modais;
- leitura dos avisos por tecnologias assistivas;
- contraste de cores;
- comportamento em zoom;
- operação em dispositivos móveis;
- mensagens de erro claras e não técnicas.

---

## 11. Segurança, privacidade e proteção de dados

A aplicação lida potencialmente com nomes, e-mails, telefones, dados de órgãos e informações de participantes de eventos. A operação deve observar as políticas institucionais e os requisitos aplicáveis de proteção de dados.

### Recomendações prioritárias

- revisar as regras publicadas do Firestore;
- negar leitura e gravação por padrão e liberar apenas o necessário;
- testar cada coleção com usuário comum, administrador e usuário não autenticado;
- restringir a leitura de inscrições aos perfis que realmente precisam dela;
- impedir que usuários alterem o próprio perfil para obter privilégios;
- validar permissões no backend, e não apenas por classes CSS ou abas ocultas;
- manter cópias de segurança e procedimento de recuperação;
- evitar armazenar dados pessoais em campos livres sem necessidade;
- definir prazo de retenção e rotina de revisão de cadastros;
- monitorar erros de permissão e acessos inesperados.

### Limites desta análise

O arquivo fornecido não inclui o conteúdo das regras do Firestore publicadas no Firebase Console. Portanto, não é possível atestar a segurança efetiva do banco apenas com o HTML.

---

## 12. Limitações e itens não confirmados

Os itens abaixo constavam ou eram sugeridos no README anterior, mas **não foram confirmados no HTML v0.3.4 analisado**:

- Drag & Drop dos cards (`draggable`/`dragstart`);
- histórico de versões anteriores no campo `versoesAnteriores[]`;
- biblioteca QRCode.js e geração funcional de QR Code;
- recuperação de senha por `sendPasswordResetEmail()`;
- fluxo completo de check-in com gravação de presença;
- emissão automática de certificados;
- Firebase Storage para arquivos;
- notificações por e-mail, SMS ou push;
- workflow formal com aprovações;
- integrações externas por API;
- regras de segurança do Firestore, pois o arquivo de regras não foi fornecido.

Esses recursos podem existir em outra versão ou em arquivos não anexados, mas não devem ser descritos como disponíveis com base apenas no HTML analisado.

### Observações técnicas adicionais

- A configuração de autenticação usa persistência em memória.
- O perfil de contingência é definido no frontend quando a consulta ao perfil não retorna dados utilizáveis; as regras do banco precisam impedir qualquer escalada de privilégio.
- O fluxo simples de inscrição identificado grava um documento em `inscricoes`; limites de vagas e prevenção de duplicidade precisam de validação explícita.
- A importação e a exclusão em massa merecem testes de integridade e recuperação.
- O HTML carrega dependências externas via CDN, o que cria dependência de conectividade e disponibilidade dos provedores.

---

## 13. Matriz resumida de funcionalidades

| Módulo | Recursos observados no HTML | Observações |
|---|---|---|
| Autenticação | Login, logout, observação de sessão | Persistência em memória |
| Dashboard | Indicadores e áreas de gráficos | Depende da qualidade dos dados |
| Demandas | Listagem, busca, filtros, ordenação, calendário semanal/mensal, backlog | Drag & Drop e histórico de versões não confirmados |
| Clientes | Busca, filtros, cadastro e importação CSV | Ação de limpar todos exige proteção rigorosa |
| Eventos | Busca, futuros/realizados, cards e cadastro | Validar regras de visibilidade |
| Inscrições | Gravação de inscrição na coleção `inscricoes` | Validar duplicidade, vagas e cancelamento |
| Locais | Módulo de cadastro/listagem | Conferir campos no formulário atual |
| Fornecedores | Módulo de cadastro/listagem | Conferir campos no formulário atual |
| Usuários | Consulta de perfil e módulo administrativo | Authentication e perfil Firestore são distintos |
| Grupos | Carregamento da coleção | Restrição efetiva depende das regras |
| Bases | Carregamento de dados de referência | Padronizar valores para evitar divergências |
| Exportação | Controle global e relatórios específicos | Confirmar formato e escopo no código |

---

## 14. Requisitos funcionais resumidos

- **RF01 — Autenticação:** permitir login por e-mail e senha.
- **RF02 — Encerramento de sessão:** permitir logout.
- **RF03 — Carregamento de perfil:** consultar perfil na coleção `usuarios`.
- **RF04 — Controle de módulos:** exibir as abas conforme `modulosPermitidos`.
- **RF05 — Dashboard:** apresentar indicadores e gráficos gerenciais.
- **RF06 — Demandas:** consultar, filtrar, ordenar e cadastrar demandas.
- **RF07 — Calendário:** organizar demandas por dia da semana e exibir backlog.
- **RF08 — Clientes/órgãos:** consultar, cadastrar e importar dados.
- **RF09 — Eventos:** consultar, classificar e cadastrar eventos.
- **RF10 — Inscrições:** registrar inscrições associadas a usuário e evento.
- **RF11 — Locais:** manter catálogo de locais.
- **RF12 — Fornecedores:** manter catálogo de fornecedores.
- **RF13 — Usuários:** administrar dados de perfil.
- **RF14 — Grupos:** manter dados de grupos.
- **RF15 — Bases dinâmicas:** manter valores de referência.
- **RF16 — Sincronização:** atualizar dados via listeners do Firestore.
- **RF17 — Exportação:** disponibilizar exportação de dados/relatórios conforme as ações existentes na interface.

A validação de cada requisito deve ser feita por teste funcional no ambiente de homologação, incluindo permissões negativas.

---

## 15. Requisitos não funcionais

- **RNF01 — Responsividade:** interface adaptável a desktop e dispositivos móveis.
- **RNF02 — Segurança:** autorização efetiva no Firebase, além do controle de interface.
- **RNF03 — Integridade:** identificadores e relacionamentos consistentes entre coleções.
- **RNF04 — Disponibilidade:** dependência dos serviços Firebase e das bibliotecas externas.
- **RNF05 — Usabilidade:** formulários claros, filtros e mensagens compreensíveis.
- **RNF06 — Rastreabilidade:** registro de criação/atualização e histórico de ações onde implementado.
- **RNF07 — Manutenibilidade:** manter código, documentação e versão sincronizados.
- **RNF08 — Privacidade:** limitar coleta, acesso, exportação e retenção de dados pessoais.

---

## 16. Plano mínimo de testes antes de publicar

### Autenticação e permissões

- [ ] Login com credenciais válidas.
- [ ] Mensagem apropriada para credenciais inválidas.
- [ ] Logout e ocultação do conteúdo principal.
- [ ] Perfil de administrador e perfil comum.
- [ ] Usuário comum não consegue executar operações administrativas diretamente no Firestore.
- [ ] Usuário não autenticado não consegue ler ou gravar dados protegidos.
- [ ] Falha ao carregar perfil não concede privilégios administrativos.

### Demandas

- [ ] Criar e consultar demanda.
- [ ] Pesquisar por termos e combinar filtros.
- [ ] Ordenar por data e prioridade.
- [ ] Alterar dia da semana e confirmar persistência.
- [ ] Verificar backlog e calendários.
- [ ] Confirmar que status e prioridade exibidos correspondem ao banco.
- [ ] Verificar histórico de ações, quando aplicável.

### Clientes e importação

- [ ] Importar CSV pequeno e válido.
- [ ] Testar CSV com acentos, campos vazios e linhas inválidas.
- [ ] Verificar duplicidades.
- [ ] Confirmar que a operação de limpar clientes está protegida por permissão e confirmação.
- [ ] Validar a recuperação dos dados a partir de backup.

### Eventos e inscrições

- [ ] Criar e consultar evento.
- [ ] Verificar separação entre futuros e realizados.
- [ ] Registrar inscrição com usuário autenticado.
- [ ] Testar inscrição repetida para o mesmo evento.
- [ ] Testar concorrência no limite de vagas.
- [ ] Confirmar autorização de leitura de dados dos inscritos.
- [ ] Testar relatórios e exportações com dados de teste.

### Publicação e interface

- [ ] Conferir versão no comentário, log e interface.
- [ ] Testar em desktop e dispositivo móvel.
- [ ] Testar com dependências externas bloqueadas ou indisponíveis.
- [ ] Verificar console do navegador e erros do Firebase.
- [ ] Confirmar que nenhuma credencial sensível foi publicada.

---

## 17. Melhorias recomendadas

### Prioridade alta — segurança e integridade

1. Revisar e versionar as regras do Firestore junto ao projeto.
2. Testar autorização por perfil e por coleção.
3. Garantir que criação de usuário e criação de perfil tenham fluxo consistente.
4. Implementar transações ou operações atômicas para controle de vagas e inscrições concorrentes.
5. Definir backup, restauração e auditoria de operações destrutivas.
6. Validar todos os campos recebidos em formulários e arquivos CSV.

### Prioridade média — confiabilidade e manutenção

1. Separar HTML, CSS e JavaScript em arquivos menores e versionados.
2. Adotar um ambiente de homologação separado da produção.
3. Criar testes automatizados para regras e operações críticas.
4. Padronizar IDs, datas, status e nomes de campos.
5. Documentar precisamente o esquema de cada coleção.
6. Implementar tratamento centralizado de erros e logs sem expor dados pessoais.

### Prioridade funcional — evoluções possíveis

- recuperação de senha;
- check-in de presença com registro persistente;
- geração e validação de certificados, se necessário;
- armazenamento de imagens em serviço apropriado, evitando documentos excessivamente grandes;
- relatórios configuráveis;
- notificações;
- workflow formal para demandas;
- trilha de auditoria com histórico de alterações;
- importação com pré-visualização, validação e relatório de erros.

As sugestões acima são propostas de evolução, não funcionalidades confirmadas na versão analisada.

---

## 18. Controle de versão

A versão do sistema deve ser atualizada de forma consistente em todos os pontos relevantes do projeto.

| Versão/documento | Situação |
|---|---|
| HTML anexado | Identifica-se como **v0.3.4** |
| README anterior | Descrevia **v0.43**, com recursos que não foram todos confirmados no HTML anexado |
| README atualizado | Documenta o HTML analisado e explicita limitações e pontos de validação |

### Procedimento para cada release

1. Atualizar o identificador de versão no HTML.
2. Atualizar o comentário inicial e o log do módulo JavaScript.
3. Atualizar a versão mostrada na tela de login e no cabeçalho.
4. Atualizar este README com recursos realmente implementados.
5. Executar os testes mínimos da seção 16.
6. Registrar mudanças, correções conhecidas e migrações de dados.
7. Publicar e validar a versão final no GitHub Pages.

Não usar o número da versão como substituto de testes ou de registro de mudanças.

---

## 19. Arquivos analisados

- `index (22).html` — implementação frontend fornecida para análise.
- `README_old (1).md` — documentação anterior, usada como base de atualização.

### Artefatos importantes que devem acompanhar o projeto

Para uma documentação de manutenção completa, recomenda-se manter no repositório, quando aplicável:

- `README.md`;
- `index.html` ou arquivos frontend organizados;
- regras do Firestore (`firestore.rules`);
- índices do Firestore (`firestore.indexes.json`), se houver;
- configuração de deploy do GitHub Pages;
- dados fictícios para testes;
- roteiro de homologação;
- histórico de alterações;
- instruções de backup e restauração.

---

## 20. Conclusão

O PRGD oferece uma base web integrada para apoiar relacionamento institucional, demandas, eventos e cadastros de apoio da ATI-PE. O frontend combina HTML/JavaScript com Firebase Authentication e Cloud Firestore, com atualização de dados por listeners e navegação modular.

O principal cuidado para a evolução é manter **código, regras de segurança, dados e documentação alinhados**. A análise do HTML entregue identificou divergência relevante entre a versão registrada no código (`v0.3.4`) e a versão documentada anteriormente (`v0.43`). Antes de divulgar recursos ou operar dados institucionais em produção, é recomendável confirmar a versão publicada, revisar as regras do Firestore e executar os testes funcionais e de autorização descritos neste documento.
