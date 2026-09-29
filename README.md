# PRGD — Plataforma de Relacionamento do Governo Digital

**Versão da aplicação:** v0.42  
**Identificação:** PRGD  
**Plataforma:** Web responsiva  
**Idioma da interface:** Português do Brasil (`pt-BR`)  
**Backend:** Firebase Authentication + Cloud Firestore  
**Frontend:** HTML5 + JavaScript ES Modules + Tailwind CSS  
**Objetivo:** Apoiar a gestão do relacionamento institucional, demandas (com visões de calendário, backlog, horários, legendas de prioridade por cores, datas limite e controle de versões), clientes/órgãos, eventos, locadoras, fornecedores, usuários, grupos e bases dinâmicas da ATI-PE.

---

## 1. Visão Geral das Atualizações (v0.42)

A versão **v0.42** refina o Módulo de Demandas com os seguintes ajustes:

1. **Legenda e Indicadores de Prioridade por Cores:** Adicionada legenda de prioridades (🔴 Vermelho para Alta, 🟡 Amarelo para Média e 🟢 Verde para Baixa) acima do cabeçalho, substituindo os textos na coluna de prioridade por crachás circulares coloridos.
2. **Remoção de Alerta de Cor nas Linhas:** Retirada a alteração dinâmica de cor de fundo nas linhas da tabela de demandas.
3. **Cores Fixas por Responsável (GRGD):** Identificação visual por crachás de iniciais com cores dedicadas por colaborador (ex: *José Pacheco* em Azul, *Arlindo Santos* em Verde e *Clarissa Borba* em Rosa).
4. **Tooltip no Histórico de Andamentos:** Exibição do último status ou andamento registado ao passar o mouse sobre o ícone correspondente.

---

## 2. Controle de Versão

| Versão | Descrição |
|---|---|
| v0.40 | Versão base com arquitetura de 8 módulos e integrações Firestore |
| v0.41 | Introdução do módulo de demandas com calendário e backlog |
| **v0.42** | **Refinamento com legenda de prioridade por bolinhas coloridas, remoção de cor nas linhas e cores fixas por usuário** |

---

**Documento:** README.md  
**Sistema:** PRGD — Plataforma de Relacionamento do Governo Digital  
**Versão documentada:** v0.42