# PRGD — Plataforma de Relacionamento do Governo Digital

**Versão da aplicação:** v0.40  
**Identificação:** PRGD  
**Plataforma:** Web responsiva  
**Idioma da interface:** Português do Brasil (`pt-BR`)  
**Backend:** Firebase Authentication + Cloud Firestore  
**Frontend:** HTML5 + JavaScript ES Modules + Tailwind CSS  
**Objetivo:** apoiar a gestão do relacionamento institucional, demandas, clientes/órgãos, eventos, locais, fornecedores, usuários, grupos e bases dinâmicas da ATI-PE.

---

## 1. Visão geral

O PRGD é uma aplicação web de gestão integrada construída em uma única página HTML, com interface responsiva e persistência em nuvem pelo Firebase.

A aplicação organiza o trabalho em oito módulos principais:

1. Dashboard
2. Demandas
3. Clientes
4. Eventos
5. Locais
6. Fornecedores
7. Usuários
8. Bases

Além desses módulos, existem recursos transversais de:

- autenticação por e-mail e senha;
- recuperação de senha;
- controle de perfil;
- controle de módulos permitidos;
- grupos de usuários;
- tags/categorias de usuários;
- sincronização em tempo real com Firestore;
- auditoria de criação e alteração;
- edição detalhada de registros;
- exclusão de registros;
- importação de clientes por CSV;
- importação de usuários por CSV;
- exportação de dados em CSV;
- inscrições em eventos;
- cancelamento de inscrições;
- comprovante de inscrição;
- integração do comprovante com Google Agenda;
- controle de vagas;
- relatórios de inscrições;
- dashboard analítico individual de eventos;
- geração de QR Code para ficha de presença;
- repositório de bases dinâmicas para alimentar campos do sistema.

A versão declarada no código-fonte é **v0.40**.

---

# 2. SSD — Especificação de Sistema de Software

## 2.1 Identificação

| Item | Especificação |
|---|---|
| Nome | PRGD — Plataforma de Relacionamento do Governo Digital |
| Sigla | PRGD |
| Versão | v0.40 |
| Tipo | Aplicação Web de gestão |
| Arquitetura | SPA/Single Page Application em HTML + JavaScript |
| Frontend | HTML5, CSS, JavaScript ES Modules |
| Estilização | Tailwind CSS via CDN |
| Ícones | Font Awesome 6.4.0 |
| Gráficos | Chart.js |
| QR Code | QRCode.js |
| Autenticação | Firebase Authentication |
| Banco | Cloud Firestore |
| Persistência de sessão | `inMemoryPersistence` |
| Sincronização | Firestore `onSnapshot` |
| Projeto Firebase | `prgd-ati-pe` |
| Região/ambiente | Definidos pelo projeto Firebase |
| Idioma | pt-BR |

---

## 2.2 Objetivo do sistema

O sistema tem como finalidade centralizar informações necessárias ao relacionamento e à gestão operacional da área responsável pelo relacionamento do Governo Digital.

O PRGD permite manter, em uma única aplicação:

- cadastro dos clientes/órgãos;
- responsáveis e equipes NSI;
- demandas e seu histórico;
- agenda e gestão de eventos;
- inscrições;
- informações de locais;
- informações de fornecedores;
- usuários e respectivos perfis;
- grupos de acesso;
- tags e categorias;
- parâmetros reutilizáveis;
- indicadores gerenciais.

---

# 3. Arquitetura da solução

## 3.1 Arquitetura lógica

```text
┌─────────────────────────────────────────────┐
│                  USUÁRIO                    │
│       Navegador / Desktop / Mobile         │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              FRONTEND PRGD v0.40            │
│                                             │
│ HTML5 + JavaScript ES Modules               │
│ Tailwind CSS + Font Awesome                 │
│ Chart.js + QRCode.js                        │
└───────────────┬─────────────────────────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
┌───────────────┐  ┌────────────────────────┐
│ Firebase Auth │  │ Cloud Firestore        │
│               │  │                        │
│ Login         │  │ demandas               │
│ Logout        │  │ eventos                │
│ Reset senha   │  │ inscricoes             │
│ Criação conta │  │ orgaos                 │
└───────────────┘  │ locais                 │
                   │ fornecedores           │
                   │ usuarios               │
                   │ grupos                 │
                   │ bases                  │
                   └────────────────────────┘
```

---

## 3.2 Componentes externos utilizados

### Tailwind CSS

Carregado por CDN para construção da interface responsiva.

### Font Awesome

Utilizado para ícones de navegação, ações, indicadores e botões.

### Chart.js

Utilizado no Dashboard para:

- demandas por categoria;
- status das solicitações;
- tipos jurídicos dos clientes.

### QRCode.js

Utilizado para gerar o QR Code da ficha de presença dos eventos.

### Firebase Authentication

Responsável pela autenticação por e-mail e senha.

### Cloud Firestore

Responsável pelo armazenamento dos dados e pela sincronização em tempo real.

---

# 4. Autenticação

## 4.1 Tela de login

O acesso ao sistema é bloqueado até que exista um usuário autenticado.

A tela contém:

- identificação PRGD;
- nome da plataforma;
- campo de e-mail institucional;
- campo de senha;
- mensagem de erro;
- botão **Autenticar e Entrar**;
- botão **Esqueci minha senha**;
- identificação da versão.

Enquanto não há usuário autenticado:

- o conteúdo principal permanece oculto;
- o modal de login permanece visível.

---

## 4.2 Login

O sistema utiliza:

```text
signInWithEmailAndPassword()
```

O usuário informa:

- e-mail;
- senha.

Em caso de credencial inválida, o sistema apresenta uma mensagem amigável.

---

## 4.3 Recuperação de senha

A opção **Esqueci minha senha** utiliza:

```text
sendPasswordResetEmail()
```

O endereço informado no campo de login recebe as instruções de recuperação do Firebase Authentication.

---

## 4.4 Logout

O botão **Sair** executa:

```text
signOut()
```

Após o logout:

- a sessão é encerrada;
- o conteúdo principal é ocultado;
- a tela de autenticação volta a ser apresentada;
- os listeners/snapshots são interrompidos.

---

## 4.5 Persistência da autenticação

A aplicação configura:

```text
setPersistence(auth, inMemoryPersistence)
```

Portanto, a persistência da autenticação é mantida em memória do contexto atual, em vez de ser configurada pelo código como persistência local permanente.

---

# 5. Perfis e permissões

Existem dois perfis principais implementados:

- `admin`
- `comum`

## 5.1 Administrador

O administrador possui acesso a todos os módulos:

- Dashboard
- Demandas
- Clientes
- Eventos
- Locais
- Fornecedores
- Usuários
- Bases

Além disso, os controles `btn-admin-only` ficam disponíveis.

O administrador pode, conforme as regras e funções implementadas:

- criar registros;
- editar registros;
- excluir registros;
- criar usuários;
- gerenciar grupos;
- importar dados;
- exportar relatórios;
- acessar recursos administrativos;
- consultar informações de inscrições.

---

## 5.2 Usuário comum

O usuário comum recebe os módulos definidos em:

```text
modulosPermitidos
```

Quando o campo não está disponível, o código utiliza como padrão:

```text
dashboard
demandas
eventos
```

O perfil comum não recebe os controles administrativos da interface.

Importante: o controle de interface não substitui as regras de segurança do Firestore. A autorização efetiva das operações é determinada pelas regras publicadas no backend.

---

# 6. Módulos do sistema

# 6.1 Dashboard

O Dashboard apresenta indicadores consolidados.

## KPIs

São apresentados:

- Demandas Ativas;
- Eventos Programados;
- Locais/Auditórios;
- Clientes Cadastrados;
- Fornecedores TIC.

## Gráficos

### Demandas por Categoria

Gráfico de barras baseado no campo:

```text
categoria
```

### Status das Solicitações

Gráfico em formato doughnut com:

- Pendentes;
- Em Andamento;
- Concluídos.

### Tipos Jurídicos de Clientes

Gráfico de pizza baseado no campo:

```text
tipoJuridico
```

Os gráficos são reconstruídos quando o Dashboard é renderizado.

---

# 6.2 Demandas

O módulo de Demandas é destinado ao registro e acompanhamento de solicitações.

## Listagem

A tabela apresenta:

- Cliente / Solicitante;
- Título da Demanda;
- Responsável GRGD;
- Prioridade;
- Status;
- Data de criação;
- Data de modificação;
- Usuário que modificou;
- Ações.

## Pesquisa

Permite pesquisar por:

- título;
- cliente/órgão;
- solicitante;
- responsável GRGD.

## Filtro

Filtro por status:

- Pendente;
- Em Andamento;
- Concluído.

## Cadastro

Campos:

- Título da Demanda;
- Cliente / Órgão Solicitante;
- Quem Solicitou;
- Responsável GRGD;
- Categoria;
- Prioridade;
- Descrição detalhada.

Prioridades disponíveis:

- Baixa;
- Normal;
- Alta;
- Urgente.

A demanda é criada com status inicial:

```text
Em Andamento
```

## Histórico de ações

Cada demanda possui:

```text
historicoAcoes
```

O histórico registra:

- data;
- autor;
- texto da ação.

O usuário administrador pode adicionar novas ações ao histórico.

---

# 6.3 Clientes

O módulo de Clientes utiliza a coleção:

```text
orgaos
```

O conceito de cliente é utilizado para representar secretarias, autarquias, fundações, empresas públicas, órgãos autônomos e outros clientes institucionais.

## Pesquisa

Pesquisa por:

- sigla;
- nome;
- responsável;
- gestor NSI.

## Filtro

Filtro por tipo jurídico.

Tipos previstos:

- Secretaria Estadual;
- Autarquia;
- Fundação Pública;
- Empresa Pública;
- Órgão Autônomo;
- Outros.

## Dados cadastrais

### Identificação

- Sigla;
- Nome do cliente/secretaria;
- Tipo jurídico.

### Responsável do cliente

- Nome;
- E-mail.

### Institucional

- Site;
- Redes sociais;
- Endereço físico.

### Gestor NSI

- Nome;
- E-mail;
- Telefone.

### Equipe NSI

O sistema suporta até três membros:

#### Membro 1
- Nome;
- E-mail;
- Telefone.

#### Membro 2
- Nome;
- E-mail;
- Telefone.

#### Membro 3
- Nome;
- E-mail;
- Telefone.

---

## Importação de clientes

Existe recurso de importação CSV.

O arquivo é processado linha a linha utilizando `;` como separador.

A estrutura esperada inclui:

```text
Sigla;
Nome;
Tipo Jurídico;
Responsável;
E-mail;
Site;
Redes Sociais;
Endereço;
Gestor NSI Nome;
Gestor NSI E-mail;
Gestor NSI Telefone
```

Os dados são gravados na coleção `orgaos`, utilizando a sigla como identificador do documento.

---

# 6.4 Eventos

O módulo de Eventos é um dos componentes centrais do PRGD.

Destina-se à gestão de:

- capacitações;
- encontros;
- palestras;
- apresentações;
- workshops;
- seminários;
- outros eventos configurados nas Bases.

## Classificação

O sistema separa os eventos em:

- Futuros;
- Realizados.

Um evento é considerado realizado quando sua data de término, ou sua data de início quando não houver término, já passou.

## Pesquisa

Pesquisa por:

- título;
- palestrante;
- local;
- tipo de evento.

---

## Cadastro de evento

Campos implementados:

- Capa do evento;
- Título;
- Tipo de evento;
- Palestrante / responsável;
- Data e hora de início;
- Data e hora de término;
- Local;
- Quem realiza;
- Demandante do evento;
- Emissão de certificado;
- Limite de vagas;
- Link de inscrição/material;
- Descrição;
- Grupos permitidos;
- Público ou restrito;
- Texto do card.

### Capa do evento

A capa pode ser informada por:

- URL;
- upload de imagem.

O código estabelece limite de:

```text
500 KB
```

A imagem é convertida para Data URL e armazenada no próprio documento.

A recomendação informada na interface é:

```text
800 x 450 pixels
```

---

## Tipos de evento

O sistema inicialmente utiliza:

- Capacitação;
- Encontro de Gestores;
- Palestra;
- Apresentação;
- Workshop;
- Seminário.

Entretanto, o campo pode ser alimentado pela coleção `bases`, utilizando a categoria:

```text
Tipo de Evento
```

---

## Público e restrito

Um evento pode ser:

### Público

Disponível aos usuários autenticados.

### Restrito

Pode ser associado a grupos específicos por meio de:

```text
gruposPermitidos
```

A aplicação também mantém o campo:

```text
visibilidade
```

com valores derivados de:

- Público;
- Restrito por grupos.

---

# 6.5 Inscrições em eventos

A inscrição é vinculada ao usuário autenticado.

Antes da inscrição, o sistema verifica se o usuário já possui inscrição para o evento.

## Dados solicitados

- Nome completo;
- E-mail institucional;
- Cliente / Secretaria;
- Telefone / WhatsApp.

O e-mail utilizado é o e-mail autenticado.

---

## Identificação da inscrição

O documento de inscrição utiliza o padrão:

```text
<ID_DO_EVENTO>_<UID_DO_USUARIO>
```

Isso fornece uma chave determinística para a combinação:

```text
evento + usuário
```

---

## Controle de vagas

O evento pode ter:

```text
limiteVagas
```

Quando o limite é zero, o sistema considera o evento sem limite definido.

Quando existe limite:

```text
inscritos >= limiteVagas
```

o evento é apresentado como:

```text
Vagas esgotadas
```

---

## Contagem real

A versão v0.40 busca calcular a ocupação a partir da coleção real:

```text
inscricoes
```

em vez de depender exclusivamente do contador armazenado no evento.

O documento do evento também mantém:

```text
inscritosCount
```

Esse campo é atualizado nas operações de inscrição/cancelamento.

---

## Cancelamento

O usuário pode cancelar sua própria inscrição.

O sistema:

1. localiza a inscrição;
2. calcula novamente a quantidade;
3. exclui o documento da inscrição;
4. atualiza `inscritosCount`;
5. atualiza a interface.

---

# 6.6 Comprovante de inscrição

Após uma inscrição bem-sucedida, o sistema apresenta um comprovante contendo:

- evento;
- participante;
- cliente;
- e-mail;
- data;
- código da inscrição.

O código é derivado do identificador da inscrição.

Também é disponibilizado um botão para adicionar o evento ao:

```text
Google Agenda
```

O sistema monta dinamicamente o link de criação de evento do Google Calendar.

---

# 6.7 Dashboard analítico do evento

Ao abrir os detalhes de um evento, o administrador visualiza um painel específico.

Indicadores:

- inscritos;
- vagas;
- taxa de ocupação;
- status da vaga.

O sistema também apresenta:

### Inscritos por cliente

Agrupamento das inscrições por:

```text
orgao
```

### Ações rápidas

Inclui opção de exportação personalizada dos inscritos.

---

# 6.8 Relatórios de inscrições

## Relatório individual

O administrador pode selecionar quais campos deseja exportar.

Campos disponíveis:

- Nome;
- E-mail;
- Cliente;
- Telefone;
- Data da inscrição.

O resultado é um CSV.

## Relatório geral

Existe também o relatório geral:

```text
relatorio_geral_inscricoes.csv
```

Contendo:

- Evento;
- Nome;
- E-mail;
- Cliente;
- Telefone;
- Data da Inscrição.

---

# 6.9 QR Code / Ficha de Presença

O sistema possui recurso para gerar uma ficha de presença com QR Code.

O QR Code aponta para uma URL no formato:

```text
<URL_DA_APLICAÇÃO>?checkin=<ID_DO_EVENTO>
```

A interface apresenta:

- nome do evento;
- QR Code;
- link direto;
- botão de fechamento.

## Observação importante sobre o escopo implementado

No código analisado, o recurso de QR Code está implementado como **geração de URL/ficha de presença**.

Não foi localizada, no HTML analisado, uma implementação completa de processamento do parâmetro:

```text
checkin
```

nem uma coleção específica de presença/check-in, nem uma rotina que grave a presença do participante ao acessar a URL.

Portanto, no estado v0.40 analisado, o QR Code funciona como mecanismo de geração do endereço de check-in, mas o fluxo completo de registro automático de presença não está implementado no arquivo analisado.

---

# 6.10 Locais / Auditórios

O módulo permite manter um catálogo de locais para eventos.

## Dados básicos

- Nome do local;
- Tipo de espaço;
- Capacidade;
- Área em m²;
- Valor do aluguel;
- Endereço;
- Contato;
- Site;
- Observações.

## Infraestrutura

O sistema possui campos estruturados para:

### Estacionamento

Opções:

- Não possui;
- Próprio;
- Terceirizado;
- Vagas limitadas;
- Vagas amplas.

### Climatização

- Não possui;
- Ar-condicionado;
- Climatização central;
- Ventiladores;
- Climatização parcial.

### Som / PA

- Não possui;
- Sistema próprio;
- Sistema profissional;
- Mesa de som;
- Microfones;
- Som terceirizado.

### Cadeiras / Mesas

- Não possui;
- Cadeiras;
- Mesas;
- Cadeiras e mesas;
- Mobiliário modular.

### Palco / Iluminação

- Não possui;
- Palco fixo;
- Palco móvel;
- Iluminação cênica;
- Iluminação profissional.

### Cozinha / Cafeteria

- Não possui;
- Cozinha equipada;
- Copa;
- Cafeteria;
- Catering autorizado.

### Espaço para estandes

- Não possui;
- Sim;
- Área modular;
- Área externa;
- Área interna.

### Banheiros

Campo com:

- Sim;
- Não;
- Outros.

### Acessibilidade

Opções:

- Sim;
- Não;
- Parcial;
- Outros.

Os campos de infraestrutura também permitem informar valores personalizados em determinadas categorias.

---

# 6.11 Fornecedores

O módulo de Fornecedores mantém informações de empresas e prestadores relevantes.

## Identificação

- Razão Social / Nome;
- Nome Fantasia;
- CNPJ;
- Categoria.

## Categoria

Opções previstas:

- TIC;
- Infraestrutura;
- Eventos;
- Comunicação;
- Consultoria;
- Software;
- Hardware;
- Cloud;
- Audiovisual;
- Serviços gerais.

Também existe opção de:

```text
Outros
```

## Serviços

- O que faz / especialidades;
- Produto/serviço principal.

## Faixa de valor

- Até R$ 1.000;
- R$ 1.001 a R$ 5.000;
- R$ 5.001 a R$ 10.000;
- R$ 10.001 a R$ 50.000;
- Acima de R$ 50.000;
- Sob consulta;
- Outros.

## Contatos

- Contato principal;
- Telefone / E-mail;
- Site;
- Redes sociais.

## Histórico

- Eventos dos quais participou;
- Experiência com Governo / Referências;
- Observações.

---

# 6.12 Usuários

O módulo de Usuários permite administrar os usuários cadastrados no PRGD.

## Listagem

A tabela apresenta:

- Nome;
- E-mail institucional;
- Cliente;
- Tags;
- Perfil;
- Criação;
- Modificação;
- Modificado por;
- Ações.

## Pesquisa

Pesquisa por:

- nome;
- e-mail.

## Filtros

Pode filtrar por:

- Cliente / Secretaria;
- Tag / Categoria.

---

## Cadastro de usuário

Campos:

- Nome completo;
- E-mail institucional;
- Senha inicial;
- Cliente / Secretaria;
- Perfil de acesso;
- Grupos;
- Tags;
- Módulos permitidos.

A criação utiliza uma segunda instância do Firebase Authentication:

```text
prgdUserCreator
```

Essa abordagem permite que a aplicação administrativa crie uma conta sem substituir a sessão principal do administrador.

A senha mínima implementada no frontend é:

```text
6 caracteres
```

---

# 6.13 Tags de usuários

As tags disponíveis no código são:

- Internos ATI;
- Externos;
- Terceirizados;
- Fornecedores;
- Gerentes;
- Coordenadores;
- Diretores;
- Convidados.

As tags são armazenadas no campo:

```text
tags
```

como lista.

---

# 6.14 Grupos de usuários

Os grupos são utilizados principalmente para controle de visibilidade de eventos.

O administrador pode:

- criar grupo;
- informar nome;
- informar descrição;
- editar grupo.

A coleção utilizada é:

```text
grupos
```

Cada grupo possui um identificador.

Exemplo conceitual:

```json
{
  "id": "GRP-...",
  "nome": "Gestores",
  "descricao": "Grupo de gestores",
  "ativo": true,
  "criadoEm": "..."
}
```

---

# 6.15 Bases dinâmicas

O módulo de Bases funciona como um repositório de parâmetros compartilhados.

Objetivo:

> permitir que categorias e opções cadastradas no Firestore alimentem automaticamente campos de seleção do sistema.

A estrutura principal é:

```text
categoria
sigla
nome
```

Exemplo:

```text
Categoria: Tipo de Evento
Sigla: TEV-01
Nome: Workshop
```

A função:

```text
obterOpcoesBase()
```

consulta a coleção `bases`.

Se não houver registros para determinada categoria, o sistema utiliza valores padrão definidos no código.

Isso cria uma combinação entre:

- valores administráveis no Firestore;
- valores padrão embutidos no frontend.

---

# 7. Auditoria

A aplicação implementa uma estrutura de auditoria padronizada.

Campos principais:

```text
criadoEm
atualizadoEm
criadoPor
editadoPor
```

A função:

```text
renderAuditInfo()
```

é utilizada para apresentar:

- data de criação;
- data de modificação;
- usuário responsável.

A auditoria está presente nos principais módulos.

---

# 8. Sincronização em tempo real

O PRGD utiliza:

```text
onSnapshot()
```

para acompanhar alterações no Firestore.

Coleções acompanhadas diretamente:

- demandas;
- locais;
- orgaos;
- fornecedores;
- bases;
- usuarios;
- grupos;
- inscricoes.

Eventos utilizam listeners específicos por:

- eventos públicos;
- grupos permitidos;
- eventos sem grupo;
- administrador.

O perfil do usuário também é monitorado em tempo real.

Isso permite que alterações realizadas no Firestore sejam refletidas na aplicação sem necessidade de atualização manual da página.

---

# 9. Modelo de dados

## 9.1 Coleções

```text
usuarios
grupos
demandas
orgaos
eventos
inscricoes
locais
fornecedores
bases
```

---

## 9.2 `usuarios`

Campos observados no código:

```text
uid
nome
email
orgao
perfil
tags[]
grupos[]
modulosPermitidos[]
criadoEm
atualizadoEm
criadoPor
editadoPor
```

---

## 9.3 `grupos`

Campos:

```text
id
nome
descricao
ativo
criadoEm
```

---

## 9.4 `demandas`

Campos:

```text
id
titulo
orgao
solicitante
responsavelGrgd
categoria
prioridade
status
descricao
historicoAcoes[]
criadoEm
atualizadoEm
criadoPor
editadoPor
```

---

## 9.5 `orgaos`

Campos:

```text
id
sigla
nome
tipoJuridico
responsavel
email
site
redesSociais
endereco

gestorNsiNome
gestorNsiEmail
gestorNsiTel

equipe1Nome
equipe1Email
equipe1Tel

equipe2Nome
equipe2Email
equipe2Tel

equipe3Nome
equipe3Email
equipe3Tel

criadoEm
atualizadoEm
criadoPor
editadoPor
```

---

## 9.6 `eventos`

Campos observados:

```text
id
titulo
tipoEvento
palestrante
dataInicio
dataFim
localEvento
realizador
demandanteEvento
emiteCertificado
contatoEvento
linkInscricao
linkDivulgacao
imagemCard
limiteVagas
inscritosCount
status
descricao
textoCard
gruposPermitidos[]
eventoPublico
visibilidade
criadoEm
atualizadoEm
criadoPor
editadoPor
```

---

## 9.7 `inscricoes`

Campos:

```text
id
eventId
uid
nome
email
orgao
telefone
inscritoEm
eventoTitulo
```

O identificador segue:

```text
eventId_uid
```

---

## 9.8 `locais`

Campos principais:

```text
id
nome
tipoEspaco
capacidade
metrosQuadrados
valorAluguel
endereco
contato
site

banheiro
acessibilidade
estacionamento
climatizacao
somPA
cadeirasMesas
palcoIluminacao
cozinhaCafeteria
espacoEstandes

observacoes

criadoEm
atualizadoEm
criadoPor
editadoPor
```

---

## 9.9 `fornecedores`

Campos:

```text
id
nome
nomeFantasia
cnpj
categoria
especialidades
produtoServicoPrincipal
faixaValor
contatoPrincipal
telefoneEmail
site
redesSociais
eventosParticipou
experienciaGoverno
observacoes
criadoEm
atualizadoEm
criadoPor
editadoPor
```

---

## 9.10 `bases`

Campos:

```text
id
categoria
sigla
nome
criadoEm
atualizadoEm
criadoPor
editadoPor
```

---

# 10. Regras de segurança Firestore

O arquivo analisado utiliza:

```text
rules_version = '2';
```

e:

```text
service cloud.firestore
```

---

## 10.1 Função `signedIn()`

Define usuário autenticado:

```text
request.auth != null
```

---

## 10.2 Função `profile()`

Obtém o documento do usuário autenticado:

```text
usuarios/{request.auth.uid}
```

---

## 10.3 Função `isAdmin()`

Um usuário é administrador quando:

1. está autenticado;
2. existe documento de perfil;
3. `perfil == 'admin'`.

---

# 11. Segurança da coleção `usuarios`

## Leitura

Permitida quando:

- usuário é administrador;
- usuário está lendo o próprio documento;
- o e-mail do documento corresponde ao e-mail autenticado.

## Criação

Permitida:

- para administrador;
- pelo próprio usuário quando o UID e e-mail correspondem ao usuário autenticado.

## Atualização

Permitida:

- para administrador;
- pelo próprio usuário, mas somente quando a alteração afeta exclusivamente o campo `nome`.

## Exclusão

Somente administrador.

---

# 12. Segurança da coleção `grupos`

Usuários autenticados podem ler grupos.

Somente administradores podem:

- criar;
- atualizar;
- excluir.

---

# 13. Segurança da coleção `eventos`

## Leitura

A leitura é permitida quando:

- administrador;
- evento público;
- evento não possui restrição de grupo;
- lista de grupos está vazia;
- existe interseção entre grupos do evento e grupos do usuário.

## Criação

Somente administrador.

## Exclusão

Somente administrador.

## Atualização

Pode ser feita:

- pelo administrador;
- ou em situação específica de alteração de `inscritosCount`, vinculada a uma inscrição do usuário autenticado.

A regra exige que a alteração afete somente:

```text
inscritosCount
```

e que o valor permaneça:

- numérico;
- >= 0;
- dentro do limite de vagas quando aplicável.

---

# 14. Segurança da coleção `inscricoes`

## Leitura

Permitida para:

- administrador;
- próprio participante.

## Criação

Permitida quando:

- usuário está autenticado;
- `uid` da inscrição corresponde ao usuário autenticado;
- `eventId` é string;
- o evento existe;
- o usuário tem permissão para ler o evento.

## Exclusão

Permitida para:

- administrador;
- próprio participante.

## Atualização

Explicitamente bloqueada:

```text
allow update: if false;
```

Isso significa que uma inscrição existente não pode ser alterada por uma operação normal de update conforme as regras apresentadas.

---

# 15. Regra genérica do Firestore

Existe uma regra genérica:

```text
match /{collection}/{id}
```

Ela permite leitura a usuários autenticados em situações como:

- administrador;
- registro público;
- registro sem restrição;
- registro sem grupos;
- grupo permitido;
- tag permitida;
- registro pertencente ao órgão do usuário;
- órgão incluído em `orgaosPermitidos`.

Criação, atualização e exclusão nessa regra genérica são reservadas a administradores.

## Importante

As coleções que possuem regras específicas, como `usuarios`, `grupos`, `eventos` e `inscricoes`, devem ser avaliadas pelas respectivas regras específicas.

A regra genérica não deve ser interpretada como uma política universal para todas as coleções.

---

# 16. Controle de acesso em duas camadas

O sistema possui duas camadas distintas:

## Camada 1 — Interface

O JavaScript decide quais abas e botões aparecem.

Exemplo:

```text
perfil == admin
```

ou:

```text
modulosPermitidos
```

## Camada 2 — Firestore Rules

O backend determina se a operação pode efetivamente ocorrer.

Essa segunda camada é a proteção real contra operações não autorizadas.

---

# 17. Importação e exportação

## Importação de usuários

CSV separado por `;`.

Campos processados:

```text
Nome
E-mail
Órgão
Perfil
```

Os usuários importados recebem:

```text
dashboard
demandas
eventos
```

como módulos padrão.

---

## Importação de clientes

CSV separado por `;`.

Permite importar dados cadastrais e dados básicos do NSI.

---

## Exportação geral

O botão:

```text
Exportar Dados
```

é ligado à função de exportação geral de usuários/dados administrativos implementada no frontend.

---

# 18. Pesquisa e filtros

O sistema implementa pesquisa em tempo real no frontend.

## Demandas

- texto;
- status.

## Clientes

- texto;
- tipo jurídico.

## Eventos

- texto;
- futuros/realizados.

## Locais

- texto.

## Fornecedores

- texto.

## Usuários

- texto;
- órgão;
- tag.

## Bases

- texto.

---

# 19. UX/UI

## Identidade visual

A interface utiliza:

- azul institucional como cor predominante;
- cartões brancos;
- fundo `slate`;
- bordas suaves;
- sombras discretas;
- badges;
- ícones Font Awesome;
- componentes responsivos.

## Navegação

A navegação principal utiliza abas.

Cada aba corresponde a um módulo.

## Responsividade

A interface usa classes responsivas do Tailwind para adaptar:

- grids;
- tabelas;
- formulários;
- botões;
- cabeçalhos;
- cartões.

Tabelas extensas utilizam rolagem horizontal em telas menores.

---

# 20. Modais

A aplicação utiliza modais para:

- login;
- detalhamento;
- edição;
- cadastro;
- inscrição;
- comprovante;
- exportação personalizada;
- ficha de presença.

O modal de detalhamento permite visualizar o registro e, para administradores, editar ou excluir.

---

# 21. Tratamento de erros

Existe uma função central:

```text
traduzirErroSistema()
```

Ela transforma alguns erros técnicos em mensagens amigáveis.

Exemplos:

### Imagem muito grande

```text
A imagem selecionada é muito pesada para o banco de dados.
Limite máximo: 500 KB.
```

### Permissão

```text
Permissão negada.
Você não tem autorização para realizar esta operação.
```

### Autenticação

```text
E-mail ou senha incorretos.
Verifique suas credenciais.
```

---

# 22. Normalização de URLs

A função:

```text
normalizarUrl()
```

adiciona automaticamente:

```text
https://
```

quando o endereço não começa com:

- `http://`;
- `https://`;
- `data:image`.

É utilizada em campos como:

- sites;
- links de eventos;
- imagens.

---

# 23. Formatação de moeda

A função:

```text
formatarMoeda()
```

utiliza:

```text
pt-BR
BRL
```

para apresentar valores como:

```text
R$ 1.500,00
```

---

# 24. Formatação de datas

A função:

```text
formatarData()
```

converte datas para o padrão local:

```text
pt-BR
```

com data e hora.

---

# 25. Segurança de conteúdo na interface

A aplicação possui a função:

```text
esc()
```

para escapar caracteres HTML:

- `&`
- `<`
- `>`
- `"`
- `'`

Ela é utilizada na montagem dinâmica de vários componentes HTML para reduzir riscos de injeção de HTML.

---

# 26. Ciclo de inicialização

A sequência principal é:

```text
1. Carregar HTML
2. Carregar bibliotecas CDN
3. Inicializar Firebase
4. Inicializar Firestore
5. Inicializar Firebase Authentication
6. Configurar persistência em memória
7. Configurar eventos da interface
8. Aguardar onAuthStateChanged()
9. Identificar usuário
10. Carregar perfil em usuarios/{uid}
11. Aplicar perfil/permissões
12. Iniciar listeners do Firestore
13. Renderizar módulos
14. Atualizar indicadores
```

---

# 27. Fluxo de autenticação

```text
                ┌──────────────┐
                │ Abrir PRGD   │
                └──────┬───────┘
                       ▼
                ┌──────────────┐
                │ Está logado? │
                └───┬──────┬───┘
                  Não      Sim
                   │        │
                   ▼        ▼
             ┌─────────┐  ┌──────────────┐
             │  Login  │  │ Carregar      │
             └────┬────┘  │ perfil        │
                  │       └──────┬───────┘
                  │              ▼
                  │       ┌──────────────┐
                  └──────►│ Aplicar      │
                          │ permissões   │
                          └──────┬───────┘
                                 ▼
                          ┌──────────────┐
                          │ Carregar     │
                          │ Firestore    │
                          └──────┬───────┘
                                 ▼
                          ┌──────────────┐
                          │ Sistema      │
                          │ disponível   │
                          └──────────────┘
```

---

# 28. Fluxo de inscrição

```text
Usuário autenticado
        │
        ▼
Visualiza evento permitido
        │
        ▼
Clica em "Inscrições"
        │
        ▼
Sistema verifica inscrição existente
        │
        ├── Sim ──► Bloqueia nova inscrição
        │
        └── Não
             │
             ▼
       Confirma dados
             │
             ▼
      Transação Firestore
             │
             ├── Verifica inscrição
             ├── Verifica evento
             ├── Conta inscrições
             ├── Verifica limite
             ├── Cria inscrição
             └── Atualiza contador
             │
             ▼
      Comprovante de inscrição
```

---

# 29. Fluxo de cancelamento

```text
Usuário inscrito
      │
      ▼
Cancelar inscrição
      │
      ▼
Confirmação
      │
      ▼
Transação Firestore
      │
      ├── Busca evento
      ├── Busca inscrição
      ├── Conta inscrições
      ├── Exclui inscrição
      └── Atualiza inscritosCount
      │
      ▼
Interface atualizada
```

---

# 30. Identificadores de documentos

O código utiliza identificadores próprios em vários módulos.

Exemplos:

```text
DEM-{timestamp}
EV-{timestamp}
LOC-{timestamp}
FOR-{timestamp}
BAS-{timestamp}
GRP-{timestamp}
```

Usuários utilizam o UID gerado pelo Firebase Authentication.

Clientes utilizam a sigla como identificador do documento.

Inscrições utilizam:

```text
eventId_uid
```

---

# 31. Dados em tempo real

O sistema mantém um cache local:

```javascript
dbData = {
  demandas: [],
  eventos: [],
  locais: [],
  orgaos: [],
  fornecedores: [],
  bases: [],
  usuarios: [],
  grupos: [],
  inscricoes: []
}
```

Esse objeto é atualizado a partir dos snapshots do Firestore.

A interface é então renderizada novamente.

---

# 32. Escopo positivo

O escopo positivo da versão v0.40 compreende:

- autenticação;
- recuperação de senha;
- logout;
- controle de perfil;
- controle de módulos;
- Dashboard;
- indicadores;
- gráficos;
- gestão de demandas;
- histórico de demandas;
- gestão de clientes;
- gestão de equipes NSI;
- gestão de eventos;
- eventos públicos;
- eventos restritos por grupos;
- gestão de inscrições;
- controle de vagas;
- cancelamento de inscrições;
- comprovante;
- Google Agenda;
- relatórios CSV;
- QR Code;
- cadastro de locais;
- cadastro de infraestrutura dos locais;
- cadastro de fornecedores;
- cadastro de usuários;
- tags;
- grupos;
- bases dinâmicas;
- importação CSV;
- exportação CSV;
- auditoria;
- sincronização em tempo real;
- edição administrativa;
- exclusão administrativa;
- interface responsiva.

---

# 33. Escopo negativo / não escopo identificado

Com base exclusivamente no HTML e no `firestore.rules` analisados, não estão plenamente implementados ou não foram identificados como componentes completos:

## 33.1 Gestão completa de presença

O QR Code é gerado, mas não foi identificada rotina completa de gravação da presença.

Não foi identificada coleção:

```text
presencas
```

nem uma rotina de check-in vinculada ao parâmetro `checkin`.

---

## 33.2 Emissão de certificados

Existe o campo:

```text
emiteCertificado
```

porém o código analisado não apresenta módulo completo para:

- gerar certificado;
- assinar certificado;
- validar certificado;
- emitir PDF;
- controlar código de validação.

---

## 33.3 Armazenamento de arquivos dedicado

Não foi identificada utilização efetiva de Firebase Storage.

As imagens são tratadas no frontend como Data URL e gravadas no Firestore.

---

## 33.4 Notificações

Não foi identificada implementação completa de:

- notificações push;
- e-mail automático de inscrição;
- e-mail de alteração de evento;
- notificações de demanda;
- WhatsApp;
- SMS.

---

## 33.5 Workflow formal de demandas

O módulo possui status e histórico, porém não foi identificado um motor formal de workflow com:

- SLA;
- escalonamento;
- notificações;
- aprovação;
- fila;
- regras automáticas;
- cronômetros;
- alertas de vencimento.

---

## 33.6 Relatórios gerenciais avançados

O Dashboard possui KPIs e três gráficos.

Não foi identificado um módulo completo de:

- BI;
- filtros avançados;
- séries temporais;
- indicadores históricos;
- exportação dos gráficos;
- relatórios parametrizados gerais.

---

## 33.7 Integração com sistemas externos

Não foram identificadas integrações completas com:

- SEI;
- Active Directory/LDAP;
- SOGo;
- Microsoft 365;
- Google Workspace;
- sistemas corporativos da ATI;
- sistemas de protocolo;
- APIs externas institucionais.

O sistema utiliza Firebase Authentication como mecanismo de autenticação.

---

# 34. Pontos de atenção técnicos

## 34.1 Dados e regras devem ser mantidos sincronizados

O frontend assume determinados campos, como:

```text
perfil
grupos
tags
modulosPermitidos
orgao
```

As Firestore Rules também dependem desses campos.

Alterações no modelo de dados devem ser acompanhadas por revisão das regras.

---

## 34.2 Regras de segurança são a autoridade final

Ocultar um botão no frontend não é mecanismo suficiente de segurança.

A proteção real está nas regras do Firestore.

---

## 34.3 Imagens dentro do Firestore

O limite de 500 KB é imposto pelo frontend.

O sistema não utiliza Storage para as imagens analisadas.

Essa arquitetura deve ser considerada quando o volume de eventos crescer.

---

## 34.4 Consultas de inscrições

O código realiza consultas:

```text
where('eventId', '==', ...)
```

para calcular inscrições.

Com grande volume de dados, esse padrão pode exigir atenção a:

- índices;
- custos de leitura;
- concorrência;
- escalabilidade.

---

## 34.5 Contador e coleção de inscrições

O sistema mantém dois conceitos:

```text
inscricoes
inscritosCount
```

A coleção é a fonte utilizada para contagem real no frontend, enquanto o contador serve como campo agregado no evento.

Essa duplicidade exige consistência entre as operações.

---

# 35. Considerações sobre concorrência

A inscrição utiliza:

```text
runTransaction()
```

para:

- verificar duplicidade;
- verificar evento;
- verificar limite;
- criar inscrição;
- atualizar contador.

A intenção é garantir maior consistência durante inscrições concorrentes.

Entretanto, o desenho deve ser validado em ambiente de produção com múltiplos usuários simultâneos, especialmente em eventos com poucas vagas.

---

# 36. Dependências

A aplicação utiliza CDN para:

```text
Tailwind CSS
Font Awesome 6.4.0
Chart.js
QRCode.js
```

e módulos Firebase:

```text
firebase-app 10.8.0
firebase-firestore 10.8.0
firebase-auth 10.8.0
```

---

# 37. Configuração Firebase

O frontend contém configuração do projeto:

```text
projectId: prgd-ati-pe
authDomain: prgd-ati-pe.firebaseapp.com
```

O sistema também define:

```text
storageBucket
messagingSenderId
appId
measurementId
```

A configuração deve ser entendida como identificação pública do projeto Firebase; a segurança efetiva depende das regras do Authentication e Firestore e da configuração do projeto.

---

# 38. Estrutura funcional resumida

```text
PRGD
│
├── Autenticação
│   ├── Login
│   ├── Logout
│   └── Recuperação de senha
│
├── Dashboard
│   ├── KPIs
│   ├── Demandas por categoria
│   ├── Status
│   └── Tipos jurídicos
│
├── Demandas
│   ├── Cadastro
│   ├── Pesquisa
│   ├── Filtro
│   ├── Status
│   └── Histórico
│
├── Clientes
│   ├── Cadastro
│   ├── Pesquisa
│   ├── Tipo jurídico
│   ├── Gestor NSI
│   └── Equipe NSI
│
├── Eventos
│   ├── Cadastro
│   ├── Capa
│   ├── Público/Restrito
│   ├── Grupos
│   ├── Inscrições
│   ├── Vagas
│   ├── Comprovante
│   ├── Google Agenda
│   ├── Relatórios
│   └── QR Code
│
├── Locais
│   ├── Espaços
│   ├── Capacidade
│   ├── Valor
│   └── Infraestrutura
│
├── Fornecedores
│   ├── Cadastro
│   ├── Categoria
│   ├── Serviços
│   ├── Faixa de valor
│   └── Histórico
│
├── Usuários
│   ├── Cadastro
│   ├── Perfil
│   ├── Tags
│   ├── Grupos
│   └── Módulos
│
└── Bases
    ├── Categorias
    ├── Siglas
    └── Opções dinâmicas
```

---

# 39. Matriz de funcionalidades

| Funcionalidade | Implementação |
|---|---|
| Login | Sim |
| Logout | Sim |
| Recuperação de senha | Sim |
| Firebase Authentication | Sim |
| Firestore | Sim |
| Tempo real | Sim |
| Dashboard | Sim |
| Gráficos | Sim |
| Demandas | Sim |
| Histórico de demandas | Sim |
| Clientes | Sim |
| Equipe NSI até 3 membros | Sim |
| Eventos | Sim |
| Eventos públicos | Sim |
| Eventos por grupos | Sim |
| Inscrições | Sim |
| Cancelamento | Sim |
| Controle de vagas | Sim |
| Comprovante | Sim |
| Google Agenda | Sim |
| Relatório individual | Sim |
| Relatório geral | Sim |
| QR Code | Sim |
| Registro efetivo de presença | Não identificado no código |
| Locais | Sim |
| Infraestrutura de locais | Sim |
| Fornecedores | Sim |
| Usuários | Sim |
| Tags | Sim |
| Grupos | Sim |
| Bases dinâmicas | Sim |
| Importação de usuários | Sim |
| Importação de clientes | Sim |
| Exportação CSV | Sim |
| Auditoria | Sim |
| Certificação automática | Não identificado |
| Firebase Storage | Não identificado |
| Workflow formal de demandas | Não identificado |
| Notificações automáticas | Não identificado |
| Integrações corporativas externas | Não identificado |

---

# 40. Matriz de permissões

| Operação | Admin | Usuário autenticado |
|---|---:|---:|
| Acessar sistema | Sim | Sim |
| Dashboard | Sim | Conforme módulos |
| Demandas — leitura | Sim | Conforme regras |
| Demandas — criação | Sim | Não pelas regras genéricas |
| Demandas — edição | Sim | Não pelas regras genéricas |
| Demandas — exclusão | Sim | Não pelas regras genéricas |
| Clientes — leitura | Sim | Conforme regras |
| Clientes — administração | Sim | Não |
| Eventos — leitura | Sim | Eventos permitidos |
| Eventos — criação | Sim | Não |
| Eventos — exclusão | Sim | Não |
| Eventos — atualização administrativa | Sim | Não |
| Inscrição | Sim | Sim, quando autorizada |
| Cancelamento da própria inscrição | Sim | Sim |
| Leitura das próprias inscrições | Sim | Sim |
| Leitura de todas as inscrições | Sim | Não |
| Grupos — leitura | Sim | Sim |
| Grupos — criação | Sim | Não |
| Grupos — edição | Sim | Não |
| Grupos — exclusão | Sim | Não |
| Usuários — administração | Sim | Não |
| Bases — administração | Sim | Não |
| Importações | Sim | Não |
| Relatórios administrativos | Sim | Não |

> A matriz acima representa a combinação entre a interface e as Firestore Rules analisadas. As regras do backend são a referência definitiva para autorização.

---

# 41. Requisitos funcionais

## RF01 — Autenticar usuário

O sistema deve permitir autenticação por e-mail e senha.

## RF02 — Recuperar senha

O sistema deve permitir solicitar recuperação de senha por e-mail.

## RF03 — Encerrar sessão

O sistema deve permitir logout.

## RF04 — Carregar perfil

O sistema deve carregar o perfil Firestore associado ao UID autenticado.

## RF05 — Controlar módulos

O sistema deve exibir módulos conforme o perfil e `modulosPermitidos`.

## RF06 — Gerenciar demandas

Administradores devem poder cadastrar, editar e excluir demandas conforme as regras.

## RF07 — Registrar histórico

O sistema deve registrar ações relacionadas às demandas.

## RF08 — Gerenciar clientes

O sistema deve manter cadastro dos órgãos/clientes.

## RF09 — Gerenciar equipe NSI

O sistema deve permitir registrar gestor e até três membros da equipe NSI.

## RF10 — Gerenciar eventos

O sistema deve permitir cadastro e manutenção de eventos.

## RF11 — Restringir eventos

O sistema deve permitir eventos públicos ou restritos por grupos.

## RF12 — Inscrever participante

Usuário autenticado autorizado deve poder realizar inscrição.

## RF13 — Controlar vagas

O sistema deve impedir novas inscrições quando o limite estiver atingido.

## RF14 — Cancelar inscrição

Usuário deve poder cancelar sua própria inscrição.

## RF15 — Gerar comprovante

O sistema deve apresentar comprovante após inscrição.

## RF16 — Gerar relatórios

Administradores devem poder exportar inscrições.

## RF17 — Gerar QR Code

O sistema deve gerar QR Code para a ficha de presença.

## RF18 — Gerenciar locais

O sistema deve permitir cadastrar locais e infraestrutura.

## RF19 — Gerenciar fornecedores

O sistema deve permitir cadastrar fornecedores e suas informações.

## RF20 — Gerenciar usuários

Administradores devem poder criar e administrar usuários.

## RF21 — Gerenciar grupos

Administradores devem poder criar e editar grupos.

## RF22 — Gerenciar bases

Administradores devem poder manter opções dinâmicas.

## RF23 — Sincronizar dados

O sistema deve atualizar a interface a partir de snapshots do Firestore.

---

# 42. Requisitos não funcionais

## RNF01 — Responsividade

A aplicação deve funcionar em diferentes larguras de tela.

## RNF02 — Segurança

Operações administrativas devem ser protegidas por Firestore Rules.

## RNF03 — Sincronização

Alterações relevantes devem ser refletidas em tempo real.

## RNF04 — Usabilidade

A interface deve utilizar navegação por abas, filtros, pesquisa e modais.

## RNF05 — Rastreabilidade

Registros devem possuir dados de criação e modificação quando criados pelas rotinas estruturadas.

## RNF06 — Internacionalização regional

A interface utiliza padrões brasileiros de:

- idioma;
- moeda;
- data;
- hora.

---

# 43. Critérios de aceite sugeridos

## Autenticação

- [ ] Usuário válido consegue entrar.
- [ ] Usuário inválido recebe mensagem.
- [ ] Logout encerra acesso.
- [ ] Recuperação de senha funciona.

## Permissões

- [ ] Admin visualiza todos os módulos.
- [ ] Usuário comum recebe apenas os módulos permitidos.
- [ ] Operações administrativas são recusadas no backend quando não autorizadas.

## Demandas

- [ ] Cadastro funciona.
- [ ] Pesquisa funciona.
- [ ] Filtro por status funciona.
- [ ] Histórico funciona.
- [ ] Auditoria aparece.

## Clientes

- [ ] Cadastro funciona.
- [ ] Importação funciona.
- [ ] Gestor NSI funciona.
- [ ] Três membros NSI podem ser cadastrados.

## Eventos

- [ ] Cadastro funciona.
- [ ] Capa funciona.
- [ ] Público/restrito funciona.
- [ ] Grupo de acesso funciona.
- [ ] Filtro futuro/realizado funciona.
- [ ] Inscrição funciona.
- [ ] Cancelamento funciona.
- [ ] Limite de vagas funciona.
- [ ] Comprovante funciona.
- [ ] Relatórios funcionam.
- [ ] QR Code é gerado.

## Dados

- [ ] Firestore sincroniza em tempo real.
- [ ] Auditoria é atualizada.
- [ ] Exclusão respeita as regras.

---

# 44. Pontos de evolução recomendados para uma próxima versão

Esta seção não descreve funcionalidades já existentes; trata-se de uma proposta técnica de evolução baseada nas lacunas observadas no código.

## Evolução 1 — Check-in real

Criar:

```text
checkins
presencas
```

ou estrutura equivalente.

Fluxo:

```text
QR Code
   ↓
Página pública/controlada de check-in
   ↓
Identificação do participante
   ↓
Validação do evento
   ↓
Registro de presença
   ↓
Data/hora
   ↓
Relatório
```

---

## Evolução 2 — Certificados

Adicionar:

- modelo de certificado;
- geração PDF;
- código único;
- página de validação;
- controle de emissão;
- situação do participante.

---

## Evolução 3 — Firebase Storage

Separar:

```text
dados estruturados → Firestore
arquivos/imagens → Storage
```

Isso evita concentrar imagens em documentos Firestore.

---

## Evolução 4 — Workflow de demandas

Adicionar:

- SLA;
- prazo;
- responsável;
- fila;
- prioridade;
- escalonamento;
- notificações;
- histórico formal;
- encerramento;
- reabertura.

---

## Evolução 5 — Notificações

Adicionar:

- confirmação de inscrição;
- lembrete de evento;
- alteração de data;
- cancelamento;
- demanda criada;
- demanda atualizada;
- alerta de prazo.

---

## Evolução 6 — Relatórios gerenciais

Adicionar:

- filtros por período;
- cliente;
- categoria;
- responsável;
- status;
- evento;
- fornecedor;
- indicadores históricos.

---

# 45. Conclusão técnica

A versão v0.40 representa uma aplicação web integrada de relacionamento e gestão, com uma arquitetura relativamente compacta baseada em frontend JavaScript e serviços Firebase.

O sistema já contempla um conjunto amplo de funcionalidades operacionais:

- gestão de relacionamento;
- gestão de demandas;
- gestão de clientes;
- gestão de eventos;
- inscrições;
- gestão de locais;
- fornecedores;
- usuários;
- grupos;
- bases dinâmicas;
- auditoria;
- relatórios;
- sincronização em tempo real.

O desenho de segurança está concentrado nas Firestore Rules, com distinção entre administrador, usuário autenticado, próprio usuário, grupos e eventos públicos/restritos.

A análise do código também demonstra uma preocupação explícita com consistência de inscrições, auditoria, contagem real de participantes, controle de acesso por grupos e modularização da interface.

Ao mesmo tempo, existem fronteiras claras no escopo atual, especialmente em relação a check-in efetivo de presença, emissão de certificados, armazenamento dedicado de imagens, notificações e workflows avançados.

Este documento descreve o estado da aplicação **conforme o HTML `index.html` e o arquivo `firestore(1).rules` analisados**, sem assumir como implementadas funcionalidades que não foram encontradas nesses arquivos.

---

## 46. Arquivos principais analisados

```text
index.html
firestore(1).rules
```

### Aplicação

```text
PRGD v0.40
Plataforma de Relacionamento do Governo Digital
```

### Backend

```text
Firebase Authentication
Cloud Firestore
```

### Coleções principais

```text
usuarios
grupos
demandas
orgaos
eventos
inscricoes
locais
fornecedores
bases
```

---

## 47. Controle de versão

| Versão | Descrição |
|---|---|
| v0.40 | Versão analisada neste documento |

O próprio HTML identifica a aplicação como:

```text
PRGD v0.40
```

---

**Documento:** README.md  
**Sistema:** PRGD — Plataforma de Relacionamento do Governo Digital  
**Versão documentada:** v0.40  
**Base documental:** `index.html` + `firestore(1).rules`
