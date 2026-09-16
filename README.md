# PRGD v33.0 — Plataforma de Relacionamento do Governo Digital (ATI-PE)

## 1. Visão Geral do Projeto
*   **Nome do Sistema:** PRGD - Plataforma de Relacionamento do Governo Digital
*   **Órgão / Contexto:** Agência Estadual de Tecnologia da Informação de Pernambuco (ATI-PE)
*   **Objetivo:** Centralizar, gerenciar e auditar o relacionamento interinstitucional da ATI-PE com os órgãos do Estado de Pernambuco, com forte ênfase no **Módulo de Eventos Avançado** (capacitações, trilhas de transformação digital e encontros de gestores), controle de demandas, locais/auditórios, órgãos estaduais, fornecedores de TIC, bases e usuários.

---

## 2. SDD (Specification Driven Development)

### 2.1 Pilha Tecnológica (Tech Stack)
*   **Front-end & Interface:** HTML5, Tailwind CSS (via CDN para carregamento rápido e responsivo) e Font Awesome (ícones corporativos).
*   **Lógica de Apresentação & Relatórios:** JavaScript ES6+ (Módulos nativos), Chart.js (Dashboard gerencial e estatísticas em tempo real), exportação nativa em CSV para relatórios gerenciais e operacionais.
*   **Backend & Banco de Dados (Cloud):** Google Firebase (Firestore Database NoSQL em tempo real).
*   **Autenticação e Segurança:** Firebase Authentication (SDK modular v10+, persistência otimizada em memória para evitar estouro de cota, recuperação de senha e controle estrito de sessões).
*   **Hospedagem & Deploy:** Firebase Hosting com regras de segurança granulares no Firestore.

### 2.2 Escopo do Projeto

#### Escopo Positivo (O que a aplicação faz)
*   **Autenticação e Permissões Unificadas:** Login seguro por e-mail e senha, migração automática de perfis legados, distinção estrita entre perfis `admin` e `comum`, e isolamento de acesso por grupos de usuários.
*   **Módulo de Eventos Avançado (v33.0):**
    *   *Filtro Padrão por Data:* Ao acessar o módulo de eventos, o sistema exibe automaticamente por padrão apenas os **eventos futuros**. Eventos passados ficam restritos exclusivamente à aba/botão **Realizados**.
    *   *Remoção de Links em Eventos Realizados:* Para eventos finalizados, links de inscrição e botões de chamada são removidos, exibindo apenas o status de encerramento e detalhes.
    *   *Design Diferenciado:* Cards de eventos passados contam com paleta de cores sóbria (tons de cinza/slate) para distingui-los visualmente dos eventos ativos.
    *   *Inscrições Validadas por E-mail (Fluxo 100% Funcional):* Modal interativo de confirmação vinculado ao e-mail autenticado do usuário (`currentUser.email`), prevenção contra duplicidade por UID/e-mail, comprovante com código único e inserção direta na Agenda do Google.
*   **Gestão Administrativa Total:** O administrador possui controle completo para cadastrar, editar, excluir registros em qualquer módulo, remover inscrições e **extrair relatórios gerenciais em CSV** (por evento individual ou consolidados de todas as inscrições).
*   **Trilha de Auditoria Completa:** Registro automático de data/hora de **Criação/Edição** e identificação do autor (`Criado/Editado por`) em todas as operações dos módulos.
*   **Gerenciamento de Armazenamento Local (v33.0):** Implementação do `inMemoryPersistence` para evitar erros de limite de cota do navegador (`Failed to execute 'setItem' on 'Storage'`).

#### Escopo Negativo (O que NÃO faz parte da solução)
*   Processamento direto de pagamentos ou transações financeiras via gateway bancário.
*   Emissão de contratos formais ou notas fiscais juridicamente vinculantes.
*   Mecanismo próprio de disparos de e-mail em massa (utiliza os serviços nativos do Firebase Auth apenas para recuperação de senha).
*   Suporte a múltiplos tenants externos fora da administração pública do Estado de Pernambuco na versão atual.

### 2.3 Requisitos Não Funcionais (Foco em Segurança e Governança)
*   **Segurança de Acesso (Firestore Security Rules):** Regras avançadas no banco de dados garantindo que apenas administradores possam gravar ou excluir registros críticos, enquanto usuários comuns possuem permissões restritas baseadas em seus vínculos de grupo e órgãos.
*   **Integridade de Dados:** Validação estrita de transações atômicas para controle de vagas em eventos (evitando *overbooking*).
*   **Disponibilidade e Performance:** Utilização de *snapshots* em tempo real do Firestore para sincronização instantânea entre múltiplos clientes sem recarregamento de página.

---

## 3. Guia de Publicação e Deploy
Para publicar a aplicação atualizada no Firebase Hosting:

```bash
firebase deploy --only hosting,firestore:rules