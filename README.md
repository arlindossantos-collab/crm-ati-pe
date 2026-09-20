# PRGD v39.0 — Plataforma de Relacionamento do Governo Digital (ATI-PE)

## 1. Visão Geral do Projeto
*   **Nome do Sistema:** PRGD - Plataforma de Relacionamento do Governo Digital
*   **Órgão / Contexto:** Agência Estadual de Tecnologia da Informação de Pernambuco (ATI-PE)
*   **Versão Atual:** v39.0
*   **Objetivo:** Centralizar, gerenciar e auditar o relacionamento interinstitucional da ATI-PE com os clientes do Estado de Pernambuco, contando com o Módulo de Eventos Avançado, controle de demandas, locais/auditórios, fornecedores de TIC, usuários e o **Repositório Centralizado de Bases Dinâmicas**.

---

## 2. SDD (Specification Driven Development)

### 2.1 Pilha Tecnológica (Tech Stack)
*   **Front-end & Interface:** HTML5, Tailwind CSS (via CDN) e Font Awesome (ícones corporativos).
*   **Lógica & Relatórios:** JavaScript ES6+ (Módulos nativos), Chart.js (Dashboard gerencial principal), QRCode.js (Geração de ficha de presença) e exportação customizável em `.csv`.
*   **Backend & Banco de Dados (Cloud):** Google Firebase (Firestore Database NoSQL em tempo real).
*   **Autenticação e Segurança:** Firebase Authentication (SDK modular v10+, persistência em memória, recuperação de senha e controle estrito de sessões).
*   **Hospedagem & Deploy:** Firebase Hosting com regras de segurança granulares no Firestore.

### 2.2 Principais Novidades da Versão v39.0
1. **Reestruturação das Abas e Módulos:**
   * **Exclusão** da aba de Clientes antiga e **Renomeação** da aba de Órgãos para **Clientes**.
   * **Reorganização de Posicionamento:** A aba **Bases** foi movida para o final do menu de navegação (após Usuários).
2. **Atualização em Demandas:**
   * A coluna `RESP. GRGD / ATI` foi simplificada para **`RESP. GRGD`**.
3. **Repositório Centralizado de Bases Dinâmicas (`Bases`):**
   * A aba Bases agora funciona como um repositório universal onde administradores cadastram parâmetros e categorias compartilhadas (ex: `Tipo de Evento` com opções como *Capacita +ATI*, *Encontro de Gestores*, *Palestra*, *Apresentação*, etc.).
   * Os dropdowns dos demais módulos (como o tipo de evento em Eventos) consomem dinamicamente essas bases cadastradas em tempo real.

### 2.3 Requisitos Não Funcionais (Segurança e Governança)
*   **Segurança de Acesso (Firestore Security Rules):** Regras avançadas no banco de dados garantindo que apenas administradores possam gravar ou excluir registros críticos.
*   **Integridade de Dados:** Validação estrita de transações atômicas para controle de vagas em eventos.
*   **Disponibilidade e Performance:** Utilização de *snapshots* em tempo real do Firestore para sincronização instantânea entre múltiplos clientes.

---

## 3. Guia de Publicação e Deploy
Para publicar a aplicação atualizada no Firebase Hosting:

```bash
firebase deploy --only hosting,firestore:rules