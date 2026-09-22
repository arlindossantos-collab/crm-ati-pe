# PRGD v40.0 — Plataforma de Relacionamento do Governo Digital (ATI-PE)

## 1. Visão Geral do Projeto
*   **Nome do Sistema:** PRGD - Portal de Relacionamento do Governo Digital
*   **Órgão / Contexto:** Agência Estadual de Tecnologia da Informação de Pernambuco (ATI-PE)
*   **Versão Atual:** v40.0
*   **Objetivo:** Centralizar, gerenciar e auditar o relacionamento interinstitucional da ATI-PE com os clientes do Estado de Pernambuco, contando com o Módulo de Eventos Avançado, controle de demandas, locais/auditórios, fornecedores de TIC, usuários, repositório de bases dinâmicas e relatórios gerenciais fidedignos.

---

## 2. SDD (Specification Driven Development)

### 2.1 Pilha Tecnológica (Tech Stack)
*   **Front-end & Interface:** HTML5, Tailwind CSS (via CDN) e Font Awesome (ícones corporativos).
*   **Lógica & Relatórios:** JavaScript ES6+ (Módulos nativos), Chart.js (Dashboard gerencial principal), QRCode.js (Geração de ficha de presença) e exportação customizável em `.csv`.
*   **Backend & Banco de Dados (Cloud):** Google Firebase (Firestore Database NoSQL em tempo real).
*   **Autenticação e Segurança:** Firebase Authentication (SDK modular v10+, persistência em memória, recuperação de senha e controle estrito de sessões).
*   **Hospedagem & Deploy:** Firebase Hosting com regras de segurança granulares no Firestore.

### 2.2 Principais Novidades da Versão v40.0
1. **Identidade Visual e Tela Inicial:**
   * O título da tela de login foi atualizado de "Acesso Restrito PRGD" para **"Portal de Relacionamento do Governo Digital"**.
2. **Ajustes no Módulo de Clientes:**
   * Remoção da menção "TIC" dos campos "Responsável do Cliente" e "E-mail".
   * Expansão da **Equipe NSI** para suportar o cadastro completo de **até 3 membros** (Nome, E-mail e Telefone).
3. **Auditoria Padronizada em Todos os Módulos:**
   * Inclusão de colunas em todas as tabelas contendo a **data de criação**, **data de modificação** e **quem modificou**.
4. **Módulo de Eventos e Inscrições:**
   * Renomeação do botão de inscrição de "Inscrever-me" para **"Inscrições"**.
   * Correção e robustez na exibição da **Ficha de Presença (QR Code)**, garantindo abertura imediata e renderização correta.
   * Sincronização fidedigna entre o número de pessoas inscritas na coleção de inscrições e o dashboard analítico, eliminando divergências e permitindo extração precisa de relatórios `.csv`.

### 2.3 Requisitos Não Funcionais (Segurança e Governança)
*   **Segurança de Acesso (Firestore Security Rules):** Regras avançadas no banco de dados garantindo que apenas administradores possam gravar ou excluir registros críticos.
*   **Integridade de Dados:** Validação estrita de transações atômicas para controle de vagas em eventos.
*   **Disponibilidade e Performance:** Utilização de *snapshots* em tempo real do Firestore para sincronização instantânea entre múltiplos clientes.

---

## 3. Guia de Publicação e Deploy
Para publicar a aplicação atualizada no Firebase Hosting:

```bash
firebase deploy --only hosting,firestore:rules