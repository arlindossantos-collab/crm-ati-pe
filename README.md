# PRGD - Plataforma de Relacionamento do Governo Digital (v6.0)

A **PRGD** é a solução centralizada da Agência Estadual de Tecnologia da Informação de Pernambuco (ATI-PE) para a gestão de demandas, eventos, locais e fornecedores de TIC do Poder Executivo Estadual.

## 🌩️ Integração Firebase & Cloud
* **Autenticação:** Restrita a e-mails institucionais do domínio **`@*.pe.gov.br`**.
* **Banco de Dados:** Cloud Firestore com sincronização em tempo real (Projeto `prgd-ati-pe`).
* **E-mails Oficiais:** Disparos automatizados assinados por **`relacionamento@ati.pe.gov.br`** via Firebase Trigger Email Extension.

## 📌 Publicação e Deploy
```bash
git add .
git commit -m "v6.0: Integracao com Firebase Auth, Cloud Firestore e Trigger Email para relacionamento@ati.pe.gov.br"
git push origin main
```
