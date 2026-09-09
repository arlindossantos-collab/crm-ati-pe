# System Design Document (SDD): PRGD - Plataforma de Relacionamento do Governo Digital (v5.1)

## 1. Visão Geral
A **PRGD - Plataforma de Relacionamento do Governo Digital** v5.1 é o sistema oficial de gestão da Agência Estadual de Tecnologia da Informação de Pernambuco (ATI-PE) composto por três módulos integrados:
1. **Gestão de Demandas:** Acompanhamento e histórico de chamados e projetos dos órgãos do Estado de Pernambuco.
2. **Gestão de Eventos & Locais:** Agendamento de eventos, catálogo estrutural de locais e divulgação oficial via `relacionamento@ati.pe.gov.br`.
3. **Gestão de Fornecedores:** Mapeamento categorizado de fornecedores e parceiros de Soluções em TIC.

---

## 2. Instruções para Ferramentas Agentivas (Entigraft, Cursor, Codex, SpecOpen)

> **DIRETRIZ DE EXECUÇÃO:** 
> O agente de código deve implementar **estritamente** os requisitos e componentes marcados como **`[ESCOPO POSITIVO]`**.
> Qualquer item rotulado como **`[ESCOPO NEGATIVO]`** deve ser desconsiderado na build atual.

---

## 3. Especificação dos Módulos

### 3.1. Módulo 1: Gestão de Demandas
* **[ESCOPO POSITIVO] Painel & Indicadores:** Painel geral de órgãos solicitantes, categorias de projeto, prioridade e status (`Pendente`, `Em Andamento`, `Concluído`).
* **[ESCOPO POSITIVO] Linha do Tempo de Atendimento:** Registro contínuo de pareceres técnicos e atas de reunião com carimbo automático de data/hora.

### 3.2. Módulo 2: Gestão de Eventos & Locais
* **[ESCOPO POSITIVO] Cadastro de Espaços / Locais de Eventos:** Ficha detalhada contendo:
  * Endereço completo e geolocalização básica
  * Capacidade total de lugares
  * Infraestrutura: Estacionamento, sistema de som, iluminação, palco, climatização, cozinha, banheiros, acessibilidade PCD e conectividade/Wi-Fi
  * Esfera / Propriedade: Público vs. Privado | Municipal (Prefeitura) vs. Estadual vs. Federal
* **[ESCOPO POSITIVO] Calendário de Eventos & Card Padronizado:** Exibição em grid de cards com dimensões fixas (320x240px / layout responsivo).
* **[ESCOPO POSITIVO] Painel Admin Restrito:** Autenticação de gestores por domínio de e-mail institucional `@ati.pe.gov.br`.
* **[ESCOPO POSITIVO] Divulgação Oficial:** Geração de links públicos e disparo automático formatado em Português do Brasil a partir do e-mail `relacionamento@ati.pe.gov.br`.
* **[ESCOPO POSITIVO] Histórico & Filtros:** Filtro avançado por data, local e status (Agendado vs. Realizado).

### 3.3. Módulo 3: Gestão de Fornecedores
* **[ESCOPO POSITIVO] Cadastro de Fornecedores:** Razão social, CNPJ, ponto focal, contatos e status contratual (`Ativo`, `Em Renovação`, `Encerrado`).
* **[ESCOPO POSITIVO] Categorização por Tipo de Fornecimento:** Classificação por segmento (*Licenciamento*, *Nuvem/Infraestrutura*, *Telecom/Conectividade*, *Segurança da Informação*, *Consultoria*).

---

## 4. Escopo Negativo (Fora do Escopo Atual)

* **[ESCOPO NEGATIVO] Comercialização de Ingressos:** Todos os eventos da PRGD são estritamente institucionais e gratuitos.
* **[ESCOPO NEGATIVO] Servidor SMTP Nativo:** Os disparos do e-mail `relacionamento@ati.pe.gov.br` utilizam protocolo `mailto:` client-side no MVP.
* **[ESCOPO NEGATIVO] Assinatura Digital de Contratos:** Apenas cadastro e metadados dos fornecedores.

---

## 5. Requisitos Não Funcionais & Segurança da Informação

* **RNF-01 (Sanitização XSS):** Escapamento obrigatório de entidades HTML em todos os inputs de formulários antes da inserção na DOM.
* **RNF-02 (Validação de Domínio Institucional):** Restrição estrita do painel admin para contas `@ati.pe.gov.br`.
* **RNF-03 (Desempenho & Interface):** UI/UX reativa em Tailwind CSS otimizada para navegação em desktop e dispositivos móveis.
