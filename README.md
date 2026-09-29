# PRGD — Plataforma de Relacionamento do Governo Digital

**Versão da aplicação:** v0.42  
**Identificação:** PRGD  
**Plataforma:** Web responsiva  
**Idioma da interface:** Português do Brasil (`pt-BR`)  
**Backend:** Firebase Authentication + Cloud Firestore  
**Frontend:** HTML5 + JavaScript ES Modules + Tailwind CSS  
**Objetivo:** Apoiar a gestão do relacionamento institucional, demandas (com visões de calendário, backlog, horários, datas limite de acompanhamento e controle de versões), clientes/órgãos, eventos, locais, fornecedores, usuários, grupos e bases dinâmicas da ATI-PE.

---

## 1. Visão Geral das Atualizações (v0.42)

A versão **v0.42** traz melhorias importantes e correções solicitadas:

1. **Correção de Versionamento e Erro de Pilha:** Correção definitiva do erro `Maximum call stack size exceeded` através de cópias planas JSON, salvando com sucesso status, prioridades e versões anteriores (`versoesAnteriores`) no Firestore.
2. **Cores Fixas por Responsável (GRGD):** Identificação visual por crachás de iniciais com cores dedicadas por colaborador (ex: *José Pacheco* em Azul, *Arlindo Santos* em Verde e *Clarissa Borba* em Rosa).
3. **Tooltip no Histórico de Andamentos:** Ao passar o mouse sobre o ícone de andamentos na tabela, é exibido o último status/observação registada.
4. **Reestruturação da Tabela de Demandas:** A coluna "Observações" foi renomeada para **"Detalhes"** e reposicionada imediatamente para o lado esquerdo, ao lado da coluna **"Demanda"**.
5. **Horários e Prazos Limite Inteligentes:** No backlog ou calendário, define-se o horário da atividade, além da **Data Final de Acompanhamento** (`dataLimite`), cujos cartões mudam de cor dinamicamente (alerta visual de aproximação ou vencimento do prazo).

---

## 2. Controle de Versão

| Versão | Descrição |
|---|---|
| v0.40 | Versão base com arquitetura de 8 módulos e integrações Firestore |
| v0.41 | Introdução do módulo de demandas com calendário, backlog e iniciais |
| **v0.42** | **Correção de salvamento de status, cores fixas por usuário, coluna detalhes ao lado da demanda e alertas de prazo** |

---

**Documento:** README.md  
**Sistema:** PRGD — Plataforma de Relacionamento do Governo Digital  
**Versão documentada:** v0.42