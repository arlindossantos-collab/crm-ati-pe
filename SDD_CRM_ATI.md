# System Design Document (SDD): PRGD - Plataforma de Relacionamento do Governo Digital (v6.0 - Firebase Edition)

## 1. Visão Geral
A **PRGD - Plataforma de Relacionamento do Governo Digital** v6.0 é o sistema oficial de gestão da Agência Estadual de Tecnologia da Informação de Pernambuco (ATI-PE) composto por três módulos integrados:
1. **Gestão de Demandas:** Acompanhamento e histórico de chamados e projetos dos órgãos do Estado de Pernambuco.
2. **Gestão de Eventos & Locais:** Agendamento de eventos, catálogo estrutural de locais e divulgação oficial via `relacionamento@ati.pe.gov.br`.
3. **Gestão de Fornecedores:** Mapeamento categorizado de fornecedores e parceiros de Soluções em TIC.

---

## 2. Autenticação & Regras de Segurança
* **Domínio Restrito:** Autenticação restrita exclusivamente para contas de e-mail com sufixo **`@*.pe.gov.br`** (ex: `@ati.pe.gov.br`, `@sefaz.pe.gov.br`, `@seplag.pe.gov.br`).
* **Firestore Security Rules:** Acesso de leitura e escrita negado para requisições anônimas ou fora do domínio padrão do Estado de Pernambuco.

---

## 3. Disparo Oficial de E-mails (`relacionamento@ati.pe.gov.br`)
* **Mecanismo:** Integração com a extensão **Firebase Trigger Email**.
* **Coleção:** `mail` no Firestore.
* **Remetente Fixo:** `relacionamento@ati.pe.gov.br` configurado através de servidor SMTP institucional.
* **Gatilho:** Inserção automática de documentos ao publicar ou divulgar novos eventos institucionais.

---

## 4. Estrutura das Coleções Firestore

### Coleção `orgaos`
```json
{
  "nome": "Secretaria da Fazenda",
  "sigla": "SEFAZ",
  "contato": "Carlos Eduardo",
  "email": "carlos@sefaz.pe.gov.br",
  "telefone": "(81) 3181-1000"
}
```

### Coleção `eventos`
```json
{
  "titulo": "GOV IN PLAY 2026",
  "data": "2026-10-24T14:00",
  "localId": "loc_123",
  "descricao": "Encontro de gestores de TIC do Estado de Pernambuco.",
  "status": "Agendado",
  "criadoPor": "gestor@ati.pe.gov.br"
}
```

### Coleção `mail` (Trigger Email)
```json
{
  "to": "destinatario@seplag.pe.gov.br",
  "from": "relacionamento@ati.pe.gov.br",
  "message": {
    "subject": "[ATI-PE] Divulgação de Evento: GOV IN PLAY 2026",
    "html": "<p>Convidamos para o evento institucional do Governo Digital...</p>"
  }
}
```
