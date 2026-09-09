# CRM Relacionamento de Governo Digital - ATI/PE (`crm-ati-pe`) v3.0

Sistema de Gerenciamento de Relacionamento de Clientes (CRM) desenvolvido para a Agência Estadual de Tecnologia da Informação de Pernambuco (ATI-PE).

## 🛠️ Correção de Erros da Versão 3.0
* **Resiliência de Armazenamento:** Tratamento do bloqueio de cookies de terceiros / LocalStorage em ambientes incorporados (iframes e previewers).
* **Mapeamento de IDs (N/A Corrigido):** Correção do mapeamento de IDs padrão (`org-1`, `org-2`, `org-3`) que causavam a exibição de "N/A - Órgão não encontrado".
* **Fallbacks na Memória:** A aplicação roda e permite manipulação de dados mesmo quando o armazenamento do navegador é bloqueado pelo sistema de segurança do cliente.

## 📌 Atualização via Git
```bash
git add .
git commit -m "v3.0: Correcao do LocalStorage e mapeamento relacional dos órgãos"
git push origin main
```
