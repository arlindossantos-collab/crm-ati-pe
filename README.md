# PRGD v0.40 — Portal de Relacionamento do Governo Digital
**Agência Estadual de Tecnologia da Informação de Pernambuco (ATI-PE)**

---

## 1. Visão Geral do Projeto
O **PRGD (Plataforma de Relacionamento do Governo Digital)** é o sistema centralizador da ATI-PE projetado para gerenciar o ecossistema de relacionamento interinstitucional com os órgãos, secretarias, autarquias e fundações do Estado de Pernambuco[cite: 3, 9]. A versão **v0.40** consolida uma arquitetura moderna baseada em nuvem, oferecendo governança de dados avançada, módulos de capacitação com controle fidedigno de vagas e rastreabilidade total (auditoria por registro)[cite: 3, 9].

---

## 2. Pilha Tecnológica e Arquitetura de Software (Tech Stack)

A aplicação adota uma arquitetura desacoplada (*Serverless / Cloud-native*), otimizada para performance imediata e segurança em tempo real:

*   **Front-end & Componentização:** 
    *   **HTML5 & Tailwind CSS (via CDN):** Design responsivo, utilitário e voltado para alta densidade de informação corporativa[cite: 3, 9].
    *   **Font Awesome v6.4.0:** Biblioteca de ícones institucionais[cite: 3, 9].
    *   **Chart.js:** Renderização de gráficos analíticos em tempo real no Dashboard gerencial e nos painéis de eventos[cite: 3, 9].
    *   **QRCode.js:** Geração dinâmica de QR Codes para fichas de presença e check-in em eventos[cite: 3, 9].
*   **Camada de Lógica & Processamento:** 
    *   JavaScript ES6+ nativo estruturado em módulos assíncronos[cite: 3, 9].
    *   Manipulação de streams de dados, transações atômicas e exportação automatizada de relatórios em `.csv`[cite: 3, 9].
*   **Backend & Banco de Dados (Cloud):** 
    *   **Google Firebase Firestore:** Banco de dados NoSQL orientado a documentos com sincronização reativa (*real-time listeners*)[cite: 3, 9].
*   **Identidade e Controle de Acesso (IAM):** 
    *   **Firebase Authentication:** SDK modular v10+, com política de persistência em memória, recuperação de credenciais por e-mail e isolamento por perfis de acesso (*Admin* vs. *Comum*)[cite: 3, 9].
*   **Infraestrutura de Deploy:** 
    *   **Firebase Hosting** com regras de segurança granulares aplicadas diretamente no Firestore Security Rules[cite: 3, 9].

---

## 3. Especificação Funcional por Módulos

### 3.1 Módulo de Autenticação e Segurança
*   **Controle de Acesso Baseado em Perfis (RBAC):** Restrição automática de rotas e elementos visuais com base nas permissões do usuário autenticado (Administrador ou Comum)[cite: 10].
*   **Tela de Login Institucional:** Interface blindada com o título oficial *"Portal de Relacionamento do Governo Digital"* e campo de preenchimento otimizado (*"informe seu e-mail"*)[cite: 10].
*   **Recuperação e Gestão de Sessão:** Suporte a redefinição de senha via Firebase Auth e sincronização reativa do perfil do usuário em tempo real.

### 3.2 Módulo de Clientes (Órgãos e Secretarias)
*   **Cadastro Institucional Extendido:** Gerenciamento de siglas, nomes oficiais, tipos jurídicos (*Secretaria Estadual, Autarquia, Fundação Pública, Empresa Pública, Órgão Autônomo*) e endereços físicos[cite: 10].
*   **Gestão de Gestores e Equipe NSI:** Estrutura dedicada para o cadastro do Gestor NSI (Nome, E-mail, Telefone) e suporte inédito para **até 3 membros da Equipe NSI** (Nome, E-mail e Telefone por membro)[cite: 10].
*   **Importação em Massa:** Ferramenta de leitura e importação de bases de órgãos via arquivos `.csv`[cite: 10].

### 3.3 Módulo de Demandas
*   **Fluxo de Solicitações:** Acompanhamento de demandas interinstitucionais classificadas por categorias, prioridades (*Baixa, Normal, Alta, Urgente*) e status (*Pendente, Em Andamento, Concluído*)[cite: 10].
*   **Histórico de Ações:** Log interativo integrado a cada demanda, permitindo registrar o andamento técnico com carimbo de data e autor da nota[cite: 10].

### 3.4 Módulo de Eventos, Capacitações e Inscrições
*   **Gestão de Trilhas Digitais:** Cadastro de eventos com suporte a upload de capas de card (validação de limite de 500 KB), definição de palestrantes, locais e controle de emissão de certificados[cite: 10].
*   **Restrição por Grupos:** Capacidade de segmentar a visualização de eventos apenas para grupos específicos de usuários autenticados ou liberá-los publicamente[cite: 10].
*   **Contagem Fidedigna de Vagas:** Transações atômicas no Firestore que evitam *overbooking*, cruzando dados diretamente com a coleção centralizada de inscrições[cite: 10].
*   **Check-in e Ficha de Presença (QR Code):** Geração instantânea de QR Code direcionado para o link de validação de presença do evento[cite: 10].
*   **Exportação Analítica:** Extração de relatórios de inscritos em formato `.csv` com filtragem personalizada de colunas e painel analítico por órgão[cite: 10].

### 3.5 Módulo de Governança, Auditoria e Bases Dinâmicas
*   **Auditoria Transversal:** Exibição obrigatória de metadados de rastreabilidade em todos os registros do sistema (Data de Criação, Data da Última Modificação e Autor da Alteração)[cite: 10].
*   **Repositório de Bases Dinâmicas:** Central de parâmetros e domínios compartilhados que alimentam dinamicamente os menus suspensos (*dropdowns*) de todo o sistema.

---

## 4. Guia de Instalação, Execução e Deploy

### 4.1 Requisitos Prévios
*   Navegador web moderno com suporte a ES6 Modules.
*   Projeto configurado no console do Google Firebase (com os serviços de *Firestore*, *Authentication* e *Hosting* ativados).
*   Node.js e Firebase CLI instalados localmente (caso deseje realizar o deploy via linha de comando).

### 4.2 Execução Local
Para testar a aplicação localmente, basta clonar o repositório contendo o arquivo `index.html` e executá-lo através de um servidor local estático (como a extensão *Live Server* do VS Code ou `npx serve`).

### 4.3 Comandos de Deploy (Firebase)
Para publicar a versão mais recente da aplicação e atualizar as regras de segurança na nuvem[cite: 10]:

```bash
# Autenticação na CLI do Firebase
firebase login

# Execução do deploy direcionado para Hosting e Regras do Firestore
firebase deploy --only hosting,firestore:rules