# PRGD v28.0 — Plataforma de Relacionamento do Governo Digital (ATI-PE)

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
*   **Autenticação e Segurança:** Firebase Authentication (SDK modular v10+, persistência local segura, recuperação de senha e controle estrito de sessões).
*   **Hospedagem & Deploy:** Firebase Hosting com regras de segurança granulares no Firestore.

### 2.2 Escopo do Projeto

#### Escopo Positivo (O que a aplicação faz)
*   **Autenticação e Permissões Unificadas:** Login seguro por e-mail e senha, migração automática de perfis legados, distinção estrita entre perfis `admin` e `comum`, e isolamento de acesso por grupos de usuários.
*   **Módulo de Eventos Avançado:**
    *   *Capas Padrão:* Suporte a upload de imagem otimizada e URLs para capas de eventos exibidas no topo externo dos cards.
    *   *Segmentação por Grupos:* Criação de eventos públicos institucionais ou restritos a grupos específicos de usuários.
    *   *Inscrições Validadas:* Modal interativo de confirmação de dados do participante, prevenção rígida contra inscrições duplicadas pelo mesmo login/UID, simulação de envio de confirmação por e-mail, geração de código único de inscrição e botão de integração direta com a Agenda do Google.
    *   *Links e Materiais:* Suporte a links externos de inscrição e repositórios de apoio.
*   **Gestão Administrativa Total:** O administrador possui controle completo para cadastrar, editar, excluir registros em qualquer módulo, remover inscrições e **extrair relatórios gerenciais em CSV** (por evento individual ou consolidados de todas as inscrições).
*   **Trilha de Auditoria Completa:** Registro automático de data/hora de **Criação/Edição** e identificação do autor (`Criado/Editado por`) em todas as operações dos módulos.

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