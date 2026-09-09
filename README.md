# PRGD - Plataforma de Relacionamento do Governo Digital (v7.0)

A **PRGD** é a solução centralizada da Agência Estadual de Tecnologia da Informação de Pernambuco (ATI-PE) para a gestão de demandas, eventos, locais e fornecedores de TIC do Poder Executivo Estadual.

## 🗄️ Base de Usuários Local no Firestore
* **Gestão de Usuários:** Cadastro e login direto na coleção `usuarios` do banco Firestore.
* **Criptografia:** Senhas gravadas via SHA-256 (`crypto.subtle.digest`).
* **Validação:** Acesso restrito a e-mails institucionais **`@*.pe.gov.br`**.

## 📌 Publicação
```bash
git add .
git commit -m "v7.0: Migracao da autenticacao para colecao local de usuarios no Firestore"
git push origin main
```
