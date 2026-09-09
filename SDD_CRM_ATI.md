# System Design Document (SDD): CRM de Relacionamento ATI-PE (v4.0)

## 1. Visão Geral
O **CRM ATI-PE (`crm-ati-pe`)** v4.0 evoluiu para incluir visualização detalhada de contexto, registros de interações (histórico de atendimentos/pareceres) por demanda e painel de informações executivas por secretaria/órgão do Governo do Estado de Pernambuco.

---

## 2. Novas Funcionalidades da Versão 4.0

### 2.1. Visão Detalhada & Histórico da Demanda
* **Clique na Linha da Demanda:** Ao clicar em qualquer demanda na tabela principal, é aberto o modal de **Visão Detalhada**.
* **Timeline de Atendimentos:** Exibe todo o histórico de alterações de status, reuniões e pareceres emitidos pela equipe da ATI-PE.
* **Inclusão de Pareceres:** Permite que o gestor adicione novas notas e atualizações de forma rápida, ficando registradas com carimbo de data/hora.

### 2.2. Perfil Executivo do Órgão / Secretaria
* **Clique no Card da Secretaria:** Exibe a descrição completa do órgão, atribuições, contatos do ponto focal, telefone/ramal e e-mail institucional.
* **Filtro de Chamados por Órgão:** Mostra instantaneamente a lista de todas as demandas vinculadas àquela secretaria com atalho direto para abrir o histórico do chamado.

---

## 3. Modelo de Dados Atualizado (v4.0)

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
