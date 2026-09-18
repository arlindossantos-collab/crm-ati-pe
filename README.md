# PRGD v38.0 — Plataforma de Relacionamento do Governo Digital (ATI-PE)

## 1. Visão Geral do Projeto
*   **Nome do Sistema:** PRGD - Plataforma de Relacionamento do Governo Digital
*   **Órgão / Contexto:** Agência Estadual de Tecnologia da Informação de Pernambuco (ATI-PE)
*   **Versão Atual:** v38.0
*   **Objetivo:** Centralizar, gerenciar e auditar o relacionamento interinstitucional da ATI-PE com os órgãos do Estado de Pernambuco, contando com o Módulo de Eventos Avançado, controle de demandas, clientes, locais/auditórios, órgãos estaduais, fornecedores de TIC, bases e usuários.

---

## 2. SDD (Specification Driven Development)

### 2.1 Pilha Tecnológica (Tech Stack)
*   **Front-end & Interface:** HTML5, Tailwind CSS (via CDN) e Font Awesome (ícones corporativos).
*   **Lógica & Relatórios:** JavaScript ES6+ (Módulos nativos), Chart.js (Dashboard gerencial principal), QRCode.js (Geração de ficha de presença) e exportação customizável em `.csv`.
*   **Backend & Banco de Dados (Cloud):** Google Firebase (Firestore Database NoSQL em tempo real).
*   **Autenticação e Segurança:** Firebase Authentication (SDK modular v10+, persistência em memória, recuperação de senha e controle estrito de sessões).
*   **Hospedagem & Deploy:** Firebase Hosting com regras de segurança granulares no Firestore.

### 2.2 Principais Novidades da Versão v38.0
1. **Nomenclatura Limpa da Versão:** Exibição do número da versão de forma limpa (ex: `v38.0`), sem descrições textuais acopladas.
2. **Reordenação dos Módulos:** Sequência atualizada para: `Dashboard`, `Demandas`, `Clientes`, `Órgãos`, `Eventos`, `Locais`, `Fornecedores`, `Bases` e `Usuários`.
3. **Melhorias no Módulo de Demandas:**
   * Inclusão da coluna **Responsável GRGD**.
   * Cores dinâmicas para Prioridade (ex: Verde para baixa, Azul para normal, Amarelo para alta, Vermelho para urgente/crítica) e Status.
   * Restrição do clique apenas ao botão/item de detalhes (removido o comportamento de linha inteiramente clicável).
   * Histórico completo de ações realizadas na demanda mantido e interativo.
4. **Módulo de Eventos Aprimorado:**
   * **Ficha de Presença (QR Code):** Geração dinâmica de QR Code de check-in para os eventos.
   * **Exportação Seletiva de Inscritos:** Modal interativo permitindo escolher quais campos exportar no relatório `.csv`.
   * **Novos Campos:** Tipo de evento (dropdown), Quem realiza, Demandante do evento e indicador de emissão de certificado.
5. **Módulo de Órgãos Expandido:**
   * Inclusão de colunas detalhadas para o **Gestor NSI** (Nome, E-mail, Telefone) e **Equipe NSI** (Nome, E-mail, Telefone).

### 2.3 Requisitos Não Funcionais (Segurança e Governança)
*   **Segurança de Acesso (Firestore Security Rules):** Regras avançadas no banco de dados garantindo que apenas administradores possam gravar ou excluir registros críticos.
*   **Integridade de Dados:** Validação estrita de transações atômicas para controle de vagas em eventos (evitando *overbooking*).
*   **Disponibilidade e Performance:** Utilização de *snapshots* em tempo real do Firestore para sincronização instantânea entre múltiplos clientes.

---

## 3. Guia de Publicação e Deploy
Para publicar a aplicação atualizada no Firebase Hosting:

```bash
firebase deploy --only hosting,firestore:rules