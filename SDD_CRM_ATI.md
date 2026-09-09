# System Design Document (SDD): CRM de Relacionamento ATI-PE

## 1. Visão Geral
O **CRM ATI-PE (`crm-ati-pe`)** é uma aplicação Web SPA (Single Page Application) desenvolvida para gerenciar o relacionamento, projetos e demandas tecnológicas entre a Agência Estadual de Tecnologia da Informação (ATI-PE) e as secretarias e órgãos do Governo do Estado de Pernambuco.

---

## 2. Tech Stack & Decisões de Arquitetura

### 2.1. Frontend & UX/UI
* **Linguagem:** HTML5, CSS3, JavaScript (ES6+ Vanilla).
* **Styling Framework:** Tailwind CSS 3.x (via CDN para implantação imediata sem build step).
* **Ícones:** Font Awesome 6.x.
* **Design System / Theme:** *Government Digital Executive* (Tons de Azul Institucional `#1e3a8a`, Slate Gray `#f8fafc` e destaques em verde/amber para status).
* **UX Highlights:**
  * Dashboard de Métricas / KPIs em tempo real.
  * Visão em Lista e Cards para Órgãos e Demandas.
  * Formulários dinâmicos em modais responsivas.
  * Filtros dinâmicos e navegação por abas sem reload.

### 2.2. Persistência de Dados & Backend
* **Prototipagem & GitHub Pages:** Persistência no `LocalStorage` do navegador com estrutura JSON relacional, permitindo que a aplicação rode 100% no cliente sem custo de servidor.
* **Pronto para Produção (Roadmap Backend):**
  * **API:** FastAPI (Python) ou Node.js (TypeScript).
  * **Banco de Dados:** PostgreSQL para armazenamento relacional de órgãos, contatos e histórico de interações.

---

## 3. Modelo de Dados (JSON Schema)

```json
{
  "orgaos": [
    {
      "id": "1",
      "nome": "Secretaria da Fazenda",
      "sigla": "SEFAZ",
      "contato": "Carlos Eduardo",
      "email": "carlos@sefaz.pe.gov.br"
    }
  ],
  "demandas": [
    {
      "id": "101",
      "orgaoId": "1",
      "titulo": "Migração de E-mails Expresso -> SOGo.PE",
      "categoria": "Infraestrutura / E-mail",
      "prioridade": "Alta",
      "status": "Em Andamento"
    }
  ]
}
```

---

## 4. Instruções de Publicação no GitHub Pages
1. Extraia o conteúdo deste `.zip`.
2. Suba o conteúdo para o seu repositório `crm-ati-pe` na branch `main`.
3. No GitHub, acesse **Settings > Pages**.
4. Em **Source**, selecione `Deploy from a branch`, escolha a branch `main` e diretório `/ (root)`.
5. Salve. Em poucos segundos a aplicação estará no ar!
