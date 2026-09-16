# PRGD v37.0 — Plataforma de Relacionamento do Governo Digital (ATI-PE)

## 1. Visão Geral do Projeto
*   **Nome do Sistema:** PRGD - Plataforma de Relacionamento do Governo Digital
*   **Órgão / Contexto:** Agência Estadual de Tecnologia da Informação de Pernambuco (ATI-PE)
*   **Objetivo:** Centralizar, gerenciar e auditar o relacionamento interinstitucional da ATI-PE com os órgãos do Estado de Pernambuco, contando com o **Módulo de Eventos Avançado**, controle de demandas, locais/auditórios, órgãos estaduais, fornecedores de TIC, bases e usuários.

---

## 2. SDD (Specification Driven Development)

### 2.1 Pilha Tecnológica (Tech Stack)
*   **Front-end & Interface:** HTML5, Tailwind CSS (via CDN) e Font Awesome (ícones corporativos).
*   **Lógica & Relatórios:** JavaScript ES6+ (Módulos nativos), Chart.js (Dashboard gerencial principal), exportação nativa em CSV para relatórios operacionais.
*   **Backend & Banco de Dados (Cloud):** Google Firebase (Firestore Database NoSQL em tempo real).
*   **Autenticação e Segurança:** Firebase Authentication (SDK modular v10+, persistência em memória, recuperação de senha e controle estrito de sessões).
*   **Hospedagem & Deploy:** Firebase Hosting com regras de segurança granulares no Firestore.

### 2.2 Escopo do Projeto

#### Escopo Positivo (O que a aplicação faz)
*   **Autenticação e Permissões Unificadas:** Login seguro por e-mail e senha, migração automática de perfis legados, distinção estrita entre perfis `admin` e `comum`, e isolamento de acesso por grupos de usuários.
*   **Módulo de Eventos Avançado & Dashboard Analítico (v37.0):**
    *   *Filtro Padrão por Data:* Ao acessar o módulo de eventos, o sistema exibe automaticamente por padrão apenas os **eventos futuros**. Eventos passados ficam restritos exclusivamente à aba/botão **Realizados** com paleta de cores diferenciada e desativação de links de inscrição.
    *   *Dashboard de Detalhes do Evento (Novo v37.0):* Ao clicar em "Gerenciar" em um evento, o administrador visualiza um painel gerencial contendo:
        *   **KPIs de Ocupação:** Total de inscritos, limite de vagas e taxa de ocupação percentual em tempo real.
        *   **Distribuição por Órgão:** Relatório segmentado indicando quais secretarias e autarquias possuem maior representatividade de público inscrito.
        *   **Ações Rápidas:** Extração direta da lista nominal de inscritos em formato `.csv` específica para o evento.
    *   *Inscrições Validadas por E-mail:* Modal interativo de confirmação vinculado ao e-mail autenticado (`currentUser.email`), prevenção contra duplicidade e busca flexível em 3 camadas no Firestore (`eventId` direto, query por campo `id` e cache local) para eliminar erros de localização de registros.
*   **Gestão Administrativa Total:** O administrador possui controle completo para cadastrar, editar, excluir registros em qualquer módulo, remover inscrições e extrair relatórios gerais em `.csv`.
*   **Trilha de Auditoria Completa:** Registro automático de data/hora de **Criação/Edição** e identificação do autor (`Criado/Editado por`) em todas as operações dos módulos.
*   **Otimização de Armazenamento Local:** Utilização da persistência em memória (`inMemoryPersistence`) para prevenir erros de cota de armazenamento no navegador.

#### Escopo Negativo (O que NÃO faz parte da solução)
*   Processamento direto de pagamentos ou transações financeiras via gateway bancário.
*   Emissão de contratos formais ou notas fiscais juridicamente vinculantes.
*   Mecanismo próprio de disparos de e-mail em massa transacional na camada front-end (utiliza modais de comprovante e integração opcional com a Agenda do Google).
*   Suporte a múltiplos tenants externos fora da administração pública do Estado de Pernambuco na versão atual.

### 2.3 Requisitos Não Funcionais (Segurança e Governança)
*   **Segurança de Acesso (Firestore Security Rules):** Regras avançadas no banco de dados garantindo que apenas administradores possam gravar ou excluir registros críticos, enquanto usuários comuns possuem permissões restritas baseadas em seus vínculos de grupo e órgãos.
*   **Integridade de Dados:** Validação estrita de transações atômicas para controle de vagas em eventos (evitando *overbooking*).
*   **Disponibilidade e Performance:** Utilização de *snapshots* em tempo real do Firestore para sincronização instantânea entre múltiplos clientes sem recarregamento de página.

---

## 3. Guia de Publicação e Deploy
Para publicar a aplicação atualizada no Firebase Hosting:

```bash
firebase deploy --only hosting,firestore:rules