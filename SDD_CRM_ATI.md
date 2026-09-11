# System Design Document (SDD): PRGD - Plataforma de Relacionamento do Governo Digital (v7.0 - Local Users DB)

## 1. Arquitetura de Autenticação em Banco Local
Na versão **v7.0**, a autenticação foi portada para uma **coleção local dedicada no Firestore (`usuarios`)**, eliminando a dependência do serviço externo de provedores do Firebase Auth.

---

## 2. Estrutura da Coleção `usuarios`

```json
{
  "nome": "Arlindo Santos",
  "email": "arlindo.santos@ati.pe.gov.br",
  "senhaHash": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
  "ativo": true,
  "criadoEm": "2026-09-09T11:50:00.000Z"
}
```

---

## 3. Fluxo de Segurança
1. **Validação de Domínio:** O e-mail informado deve possuir obrigatoriamente a terminação `@*.pe.gov.br`.
2. **Hash da Senha:** As senhas são submetidas a um algoritmo local de hashing SHA-256 (`crypto.subtle.digest`) antes de serem armazenadas ou consultadas na coleção `usuarios`.
3. **Consulta de Credenciais:** O login executa uma busca condicional (`where("email", "==", email)` e `where("senhaHash", "==", hash)`).
