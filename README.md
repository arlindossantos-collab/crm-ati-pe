# CRM Relacionamento de Governo Digital - ATI/PE (`crm-ati-pe`) v2.0

Sistema de Gerenciamento de Relacionamento de Clientes (CRM) desenvolvido para a Agência Estadual de Tecnologia da Informação de Pernambuco (ATI-PE).

## 🛠️ O que mudou na Versão 2.0?
* **Edição de Registros:** Adicionada a funcionalidade de editar tanto órgãos cadastrados quanto demandas existentes.
* **Integridade de Dados:** Validação para evitar o cadastro de siglas duplicadas e bloqueio de exclusão de órgãos que tenham demandas ativas vinculadas.
* **Segurança:** Sanitização de dados de entrada contra vulnerabilidades de script (XSS).
* **Usabilidade:** Melhores interações em modais (tecla ESC, foco automático, mensagens informativas de busca vazia).

## 📌 Controle de Versão com Git
Para gerenciar alterações e manter o histórico do código:

```bash
# Clonar o repositório existente
git clone https://github.com/SEU-USUARIO/crm-ati-pe.git
cd crm-ati-pe

# Adicionar as novas alterações
git add .

# Registrar a alteração com uma mensagem descritiva
git commit -m "v2.0: Adicionada edição de órgãos/demandas e melhorias na integridade de dados"

# Enviar para o GitHub
git push origin main
```

## 🌐 Publicação no GitHub Pages
No seu repositório do GitHub:
1. Acesse **Settings** > **Pages**.
2. Em **Source**, selecione `Deploy from a branch` (Branch: `main`, Pasta: `/ (root)`).
3. Salve. A aplicação estará ativa em `https://<seu-usuario>.github.io/crm-ati-pe/`.
