# SDD - Specification Driven Development
## Plataforma de Relacionamento do Governo Digital (PRGD | ATI-PE)

---

## 1. Visão Geral do Projeto
*   **Nome do Sistema:** PRGD - Plataforma de Relacionamento do Governo Digital
*   **Órgão / Contexto:** Agência Estadual de Tecnologia da Informação de Pernambuco (ATI-PE)
*   **Objetivo:** Centralizar, gerenciar e auditar o relacionamento interinstitucional da ATI-PE com os órgãos do Estado de Pernambuco, controlando demandas tecnológicas, agendamento de eventos, mapeamento de locais/auditórios, cadastro de fornecedores e bases de conhecimento.

---

## 2. Pilha Tecnológica (Tech Stack)
*   **Front-end & Interface:** HTML5, Tailwind CSS (via CDN) e Font Awesome (ícones).
*   **Lógica de Apresentação:** JavaScript ES6+ (Módulos nativos), Chart.js (Dashboard gerencial e estatísticas em tempo real).
*   **Backend & Banco de Dados (Cloud):** Google Firebase (Firestore Database para persistência NoSQL em tempo real).
*   **Autenticação e Segurança:** Firebase Authentication (SDK modular v10+, persistência local segura, recuperação de senha e controle estrito de sessões).
*   **Hospedagem & Deploy:** Firebase Hosting com regras de segurança granulares no Firestore.

---

## 3. Requisitos de Design (UX / UI)
*   **Design System:** Interface corporativa limpa baseada no Tailwind CSS, seguindo padrões governamentais (tons de azul institucional, cinza neutro e destaques em verde/âmbar para status).
*   **Responsividade:** Layout totalmente adaptável para dispositivos móveis, tablets e desktops (suporte a tabelas com rolagem horizontal e grids flexíveis).
*   **Feedback Visual:** Modais dinâmicos para edição, alertas de sucesso/erro contextuais, contadores dinâmicos nas abas e crachás de perfil visíveis.

---

## 4. Escopo do Projeto

### 4.1 Escopo Positivo (O que faz parte da solução)
*   **Autenticação Unificada:** Sistema seguro de login por e-mail e senha, com verificação de perfil (`admin` ou `comum`) e migração transparente de dados legados do Firestore.
*   **Módulos de Gestão Completos:**
    *   *Dashboard:* Indicadores em tempo real (KPIs) e gráficos analíticos (Demandas por Categoria, Status e Tipos Jurídicos de Órgãos).
    *   *Demandas:* Acompanhamento de solicitações tecnológicas por órgão e responsável na ATI.
    *   *Eventos:* Programação de eventos com controle de vagas, validação de lotação, inscrições de usuários e geração de links de integração com o Google Agenda.
    *   *Locais:* Cadastro de auditórios e espaços físicos com especificações detalhadas (capacidade, metragem, climatização, acessibilidade, estacionamento e valores).
    *   *Órgãos:* Mapeamento de secretarias e autarquias estaduais com tipos jurídicos, responsáveis de TIC e importação via CSV.
    *   *Fornecedores:* Registro de empresas parceiras de TIC, faixas de valor e portfólio de atendimento.
    *   *Bases & Usuários:* Gestão de parâmetros globais e controle refinado de permissões por grupos e tags.
*   **Trilha de Auditoria Completa:** Registro automático de data/hora de **Criação/Edição** e identificação do autor (`Criado/Editado por`) em todas as operações dos módulos.
*   **Exportação e Importação:** Recursos para exportar toda a base de dados em formato CSV e importar registros em lote.

### 4.2 Escopo Negativo (O que NÃO faz parte da solução)
*   Processamento direto de pagamentos ou transações financeiras via gateway bancário.
*   Emissão de notas fiscais ou contratos eletrônicos juridicamente vinculantes (o sistema armazena apenas metadados e referências de fornecedores).
*   Mecanismo próprio de envio de e-mails em massa (utiliza os serviços nativos do Firebase Auth para recuperação de senha).
*   Suporte a múltiplos tenants externos fora da administração pública estadual de Pernambuco na versão atual.

---

## 5. Requisitos Não Funcionais (Foco em Segurança e Governança)
*   **Segurança de Acesso (Firestore Security Rules):** Regras avançadas no banco de dados garantindo que apenas administradores possam gravar ou excluir registros críticos, enquanto usuários comuns possuem permissões restritas baseadas em seus vínculos de grupo e órgão[cite: 3].
*   **Integridade de Dados:** Validação estrita de transações atômicas para controle de vagas em eventos (evitando *overbooking*).
*   **Disponibilidade e Performance:** Utilização de *snapshots* em tempo real do Firestore para sincronização instantânea entre múltiplos clientes sem recarregamento de página.
*   **Conformidade:** Adequação às diretrizes de segurança da informação da ATI-PE, mantendo sigilo de credenciais e isolando perfis administrativos de usuários comuns.