# PRGD v0.40 — Plataforma de Relacionamento do Governo Digital (ATI-PE)

## 1. Visão Geral do Projeto
*   **Nome do Sistema:** PRGD - Portal de Relacionamento do Governo Digital[cite: 3, 9]
*   **Órgão / Contexto:** Agência Estadual de Tecnologia da Informação de Pernambuco (ATI-PE)[cite: 3, 9]
*   **Versão Atual:** v0.40[cite: 3, 9]
*   **Objetivo:** Centralizar, gerenciar e auditar o relacionamento interinstitucional da ATI-PE com os clientes do Estado de Pernambuco, contando com o Módulo de Eventos Avançado, controle de demandas, locais/auditórios, fornecedores de TIC, usuários, repositório de bases dinâmicas e relatórios gerenciais fidedignos[cite: 3, 9].

---

## 2. SDD (Specification Driven Development)

### 2.1 Pilha Tecnológica (Tech Stack)
*   **Front-end & Interface:** HTML5, Tailwind CSS (via CDN) e Font Awesome (ícones corporativos)[cite: 3, 9].
*   **Lógica & Relatórios:** JavaScript ES6+ (Módulos nativos), Chart.js (Dashboard gerencial principal), QRCode.js (Geração de ficha de presença) e exportação customizável em `.csv`[cite: 3, 9].
*   **Backend & Banco de Dados (Cloud):** Google Firebase (Firestore Database NoSQL em tempo real)[cite: 3, 9].
*   **Autenticação e Segurança:** Firebase Authentication (SDK modular v10+, persistência em memória, recuperação de senha e controle estrito de sessões)[cite: 3, 9].
*   **Hospedagem & Deploy:** Firebase Hosting com regras de segurança granulares no Firestore[cite: 3, 9].

### 2.2 Principais Novidades da Versão v0.40
1. **Identidade Visual e Tela Inicial:** Atualização do título da tela de login para "Portal de Relacionamento do Governo Digital"[cite: 3, 10]. O campo de e-mail agora exibe o texto amigável **"informe seu e-mail"**.
2. **Ajustes no Módulo de Clientes:** Remoção da menção "TIC" dos campos de responsável e e-mail, e suporte completo à Equipe NSI com **3 membros** (Nome, E-mail e Telefone)[cite: 3, 10].
3. **Auditoria Padronizada:** Inclusão de colunas de rastreabilidade (criação, modificação e autor) em **todos** os módulos[cite: 3, 10].
4. **Módulo de Eventos e Inscrições:** Botão renomeado para "Inscrições", correção do QR Code de presença e sincronização estrita de inscritos com o dashboard analítico[cite: 3, 10].