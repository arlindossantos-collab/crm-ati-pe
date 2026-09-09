# System Design Document (SDD): CRM de Relacionamento ATI-PE (v4.1)

## 1. Visão Geral
O **CRM ATI-PE (`crm-ati-pe`)** v4.1 evoluiu para incluir visualização detalhada de contexto, registros de interações (histórico de atendimentos/pareceres) por demanda e painel de informações executivas por secretaria/órgão do Governo do Estado de Pernambuco, seguindo a metodologia de desenvolvimento orientada por especificação (SDD / MDD).

---

## 2. Instruções para Ferramenta Agentiva / Agente de Código

> **INSTRUÇÃO PARA O AGENTE (Ex: Entigraft, Codex, Cursor, Cloud Code, SpecOpen):**
> Na geração e execução de código desta aplicação, você deve processar e implementar **estritamente** os requisitos e funcionalidades rotulados sob a marcação **`[ESCOPO POSITIVO]`**.
> Qualquer item rotulado como **`[ESCOPO NEGATIVO]`** deve ser **ignorado/desconsiderado** nesta etapa de construção e build.

---

## 3. Definição de Escopo

### 3.1. Escopo Positivo (Incluso na Aplicação / Build)
* **[ESCOPO POSITIVO] Painel Principal e KPIs:** Indicadores em tempo real para total de órgãos, total de demandas, projetos em andamento e concluídos.
* **[ESCOPO POSITIVO] Gestão de Órgãos e Secretarias:** Cadastro, listagem, edição e exclusão de secretarias do Governo de Pernambuco (com sigla, nome, contato principal, e-mail, telefone/ramal e atribuições).
* **[ESCOPO POSITIVO] Gestão de Demandas & Chamados:** Cadastro, listagem em tabela, edição, exclusão e transição rápida de status (`Pendente`, `Em Andamento`, `Concluído`).
* **[ESCOPO POSITIVO] Modal de Visão Detalhada e Timeline de Interações:** Clique na demanda para exibição completa de escopo e inclusão de pareceres/notas de reunião com carimbo automático de data/hora.
* **[ESCOPO POSITIVO] Perfil Executivo da Secretaria:** Visualização detalhada da secretaria com agrupamento e filtro dinâmico de todos os chamados e projetos vinculados àquele órgão.
* **[ESCOPO POSITIVO] Busca Global Dinâmica:** Filtragem em tempo real por nome do órgão, sigla, chamado, responsável ou palavra-chave.
* **[ESCOPO POSITIVO] Resiliência de Armazenamento:** Persistência automática via `LocalStorage` com suporte retrocompatível a modo de memória em ambiente restrito.

### 3.2. Escopo Negativo (Fora do Escopo Atual / Versões Futuras)
* **[ESCOPO NEGATIVO] Autenticação Externa / Single Sign-On:** Integração com ecossistema Gov.br, OAuth2 ou LDAP/Active Directory do Estado.
* **[ESCOPO NEGATIVO] Persistência em Banco de Dados Relacional Externo:** Comunicação com PostgreSQL, Oracle ou APIs REST externas na nuvem.
* **[ESCOPO NEGATIVO] Notificações em Tempo Real por E-mail:** Disparo automático de e-mails via servidores SMTP para atualização de chamados.
* **[ESCOPO NEGATIVO] Anexo de Arquivos Pesados:** Upload e armazenamento de documentos PDF/DOCX no banco do navegador.

---

## 4. Requisitos Não Funcionais & Segurança da Informação

* **RNF-01 (Segurança & Prevenção XSS):** Todos os dados inseridos por usuários e renderizados na interface devem passar por sanitização HTML (escape de entidades HTML) para prevenção total de vulnerabilidades do tipo *Cross-Site Scripting* (XSS).
* **RNF-02 (Privacidade e Armazenamento Seguro):** Os dados mantidos localmente via `LocalStorage` não devem conter senhas ou tokens sensíveis sem devido tratamento, garantindo execução client-side segura e isolada.
* **RNF-03 (Desempenho & Acessibilidade):** Interface responsiva estruturada em Tailwind CSS, otimizada para carregamento instantâneo em navegadores modernos sem dependências pesadas de backend.
* **RNF-04 (Usabilidade / UI & UX):** Componentização em modais intuitivos com atalhos de navegação via teclado (tecla `Escape` para fechar modais) e feedback claro ao usuário.

---

## 5. Modelo de Dados (JSON Schema)

```json
{
  "orgaos": [
    {
      "id": "org-1",
      "nome": "Secretaria da Fazenda",
      "sigla": "SEFAZ",
      "contato": "Carlos Eduardo",
      "email": "carlos@sefaz.pe.gov.br",
      "telefone": "(81) 3181-1000",
      "descricao": "Gestão financeira e arrecadação tributária do Estado."
    }
  ],
  "demandas": [
    {
      "id": "dem-101",
      "orgaoId": "org-1",
      "titulo": "Migração de E-mails Expresso -> SOGo.PE",
      "categoria": "Infraestrutura / E-mail",
      "prioridade": "Alta",
      "status": "Em Andamento",
      "descricao": "Migração de 120.000 contas institucionais.",
      "historico": [
        {
          "data": "2026-08-10 09:30",
          "texto": "Reunião técnica com alinhamento de infraestrutura."
        }
      ]
    }
  ]
}
```