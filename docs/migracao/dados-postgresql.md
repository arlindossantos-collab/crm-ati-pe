# Dados — exportação auditável e staging PostgreSQL

## Inventário e relações a preservar

| Coleção | Papel | Relações e regras a reconciliar |
| --- | --- | --- |
| orgaos, setores | Estrutura institucional | ID Firestore distinto de id comercial antigo; setor pertence ao órgão |
| colaboradores | Pessoa participante | orgaoId/setorId; usuário vinculado opcional; cadastro não cria conta |
| usuarios | Conta/perfil/autorização | UID Firebase, acessoInstitucional, ações, prazos e vínculo recíproco colaboradorId |
| usuarios/{uid}/privado/perfil | Dados pessoais privados | Preservar subcoleção e restrição de acesso; não achatar em lista pública |
| identidadesUsuarios | Projeção pública mínima | Mesmo UID; nome/foto/tipo/ativo, sem privilégios inferidos |
| contatosColaboradores | Projeção de contatos | ID da origem; funções institucionais não concedem acesso |
| eventos | Agenda e elegibilidade | localId, órgãos elegíveis, prazos, capacidade e contador institucional |
| inscricoes | Relação evento/participante | ID/protocolo original; unicidade institucional por evento/e-mail normalizado; cancelamento/reinscrição preservam história |
| historicoAlteracoes | Trilha funcional | Autoria, horário e campos; somente acrescentar; não perder histórico nem importar segredos |
| demandas, locais, fornecedores, bases, grupos | Apoio ativo | Preservar IDs, vínculos/responsáveis e campos legados; não apagar por estarem fora do Marco de Eventos |

O modelo relacional futuro deve separar pessoas, contas/identidades e vínculos institucionais. Organizações/setores, eventos, inscrições e auditoria requerem FKs, unicidade e transações. IDs originais entram em tabela de correspondência imutável; nomes/e-mails não unem pessoas automaticamente. Dados desconhecidos devem ser preservados em staging e revisados antes da normalização.

## Formato de auditoria offline

`scripts/migration/audit-export.mjs` aceita JSON:

```json
{"format":"prgd-export-v1","source":{"projectId":"demo-prgd-usuarios","exportedAt":"2026-10-24T12:00:00Z"},"documents":[{"path":"orgaos/o1","fields":{"nome":{"stringValue":"Órgão fictício"}}}]}
```

`fields` usa valores tipados no formato REST do Firestore: stringValue, integerValue (string decimal), doubleValue, timestampValue, mapValue, arrayValue, booleanValue, nullValue, bytesValue, referenceValue e geoPointValue. Não converter inteiros de 64 bits em Number; não reduzir timestamps ao milissegundo nem perder campos legados. Referências a aliases comerciais antigos são pendência de reconciliação, não autorização para substituir IDs.

Um backup gerenciado Firestore não é esse JSON: um administrador precisa exportar/converter pelo procedimento aprovado. Esta ferramenta não exporta Firebase, não lê segredos, não acessa rede e não importa Auth/senhas.

```bash
node scripts/migration/audit-export.mjs --input /caminho-protegido/exportacao.json
```

Saída: hash SHA-256 do arquivo, contagens, tipos inválidos, duplicidades e índices de documentos para revisão, sem valores pessoais. Código 0 significa estrutura/referências aptas a staging; 2 indica formato inválido; 3 indica revisão de referências/coleções. `readyForStaging` não significa que as regras de negócio, contas Auth ou migração institucional estão homologadas. Arquivos acima de 64 MiB devem ser divididos pelo processo de exportação/conversão aprovado; a ferramenta evita carga ilimitada em memória.

## Schema e ensaio

`deploy/postgres/staging.sql` cria somente prgd_staging, com lotes de importação, documentos tipados e mapeamento de identidade revisado. A PK combina lote e path, preservando subcoleções. O payload JSONB mantém os valores tipados, inclusive inteiros grandes como strings. Hashes declarados por registro devem ser calculados/conferidos pelo futuro carregador; o schema não comprova sozinho a origem dos dados.

```bash
psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -f deploy/postgres/staging.sql
```

Executar apenas em banco dedicado a ensaio. A credencial de aplicação institucional não deve ser proprietária nem usar postgres. O schema é idempotente e não contém DROP, transformação de legado, cadastro de superusuário ou alteração de banco real. O carregador final e o esquema relacional de negócio ainda não foram implementados/aprovados.

`npm run test:deploy` usa PostgreSQL 18 descartável, isolado por Docker, para conferir criação repetida, precisão, restrições e rollback. Não publica portas nem usa bancos existentes. O ensaio não substitui backup/restauração reais, reconciliação da base completa ou teste de concorrência da futura API SQL.
