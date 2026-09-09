# CRM Relacionamento de Governo Digital - ATI/PE (`crm-ati-pe`) v4.1

Sistema de Gerenciamento de Relacionamento de Clientes (CRM) desenvolvido para a Agência Estadual de Tecnologia da Informação de Pernambuco (ATI-PE).

## 🚀 Novidades da Versão 4.1
* **Definição Clara de Escopo (Positivo vs. Negativo):** Mapeamento explícito de escopo positivo (MVP funcional) e escopo negativo no arquivo SDD para direcionamento rigoroso de geração via IAs Agentivas (Entigraft, Cursor, Codex, Cloud Code).
* **Requisitos Não Funcionais & Diretrizes de Segurança:** Adicionadas especificações de sanitização contra XSS, armazenamento seguro local e diretrizes de acessibilidade e segurança da informação.
* **Modal de Histórico da Demanda:** Clique em qualquer demanda para visualizar a descrição completa, linha do tempo de atendimentos e adicione pareceres/notas de reunião.
* **Perfil da Secretaria / Órgão:** Clique no card da secretaria para ver contatos, telefones/ramais, atribuições institucionais e todos os chamados vinculados.
* **Histórico Automático:** Alterações de status geram carimbos automáticos de data/hora na linha do tempo do projeto.

## 📌 Atualização no GitHub
```bash
git add .
git commit -m "v4.1: Ajustes de SDD com Escopo Positivo/Negativo, Segurança e RNF conforme orientacoes do Prof. Alvaro"
git push origin main
```