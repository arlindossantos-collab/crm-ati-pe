# System Design Document (SDD): CRM de Relacionamento ATI-PE (v2.0)

## 1. Visão Geral
O **CRM ATI-PE (`crm-ati-pe`)** é uma aplicação Web SPA (Single Page Application) desenvolvida para a Agência Estadual de Tecnologia da Informação (ATI-PE). Seu objetivo é gerenciar o relacionamento, projetos e demandas tecnológicas junto aos órgãos e secretarias do Governo do Estado de Pernambuco.

---

## 2. Controle de Versão e Gestão de Código
Para garantir o rastreamento de alterações, o versionamento oficial do código é realizado via **Git & GitHub** no repositório **`crm-ati-pe`**.

* **Plataforma Recomendada de Controle de Versão:** [GitHub](https://github.com)
* **Fluxo de Trabalho (Workflow):**
  * `main`: Branch de produção conectada diretamente ao **GitHub Pages**.
  * `feat/*` ou `fix/*`: Branches secundárias para criação de funcionalidades ou correção de bugs antes do merge.

---

## 3. Tech Stack & Correções da Versão 2.0

### 3.1. Frontend & UX/UI
* **Linguagem:** HTML5, CSS3, JavaScript (ES6+ Vanilla).
* **Styling:** Tailwind CSS 3.x + Font Awesome 6.x.
* **Recursos Corrigidos na v2.0:**
  * **Edição Completa de Órgãos e Demandas:** Suporte a formulários dinâmicos com carregamento prévio dos campos e persistência de IDs (`org-edit-id` e `dem-edit-id`).
  * **Validação de Exclusão Relacional:** Impede a exclusão acidental de órgãos que possuem demandas ativas vinculadas.
  * **Sanitização (XSS Prevention):** Função de escape em todos os dados dinamicamente inseridos na DOM.
  * **Acessibilidade & UX:** Suporte a fechamento de modais com a tecla `Escape` e clique no backdrop.

### 3.2. Persistência de Dados
* **LocalStorage:** Armazenamento relacional dinâmico utilizando as chaves `ati_crm_orgaos` e `ati_crm_demandas`.

---

## 4. Estrutura do Repositório
```
crm-ati-pe/
├── index.html          # Aplicação completa (Frontend + Scripts de Estado e Modais)
├── SDD_CRM_ATI.md      # System Design Document (v2.0)
└── README.md           # Guia de implantação e controle de versão Git
```

---

## 5. Publicação no GitHub Pages
1. Suba os arquivos atualizados para o seu repositório `crm-ati-pe`.
2. Acesse **Settings > Pages** no GitHub.
3. Configure a branch `main` e diretório `/ (root)`.
4. Salve. O sistema será publicado automaticamente.
