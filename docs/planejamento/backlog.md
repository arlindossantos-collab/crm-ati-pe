# Backlog de execução do plano

Base desta continuidade: `d965a91771f7f1be9cd6d2299819dc0b866aab6c`, v0.14.1, conferida com a main remota em 23/10/2026. Prioridades ordenam trabalho; não constituem prazo ou designação nominal. Nenhum lote recebeu aceite institucional.

| ID / prioridade | Lote | Entrega verificável | Responsabilidade proposta | Dependência / situação |
| --- | --- | --- | --- | --- |
| P00-01 / P0 | 00 | Bundle verificado, clonado e HTML comparado | Desenvolvimento | Executado localmente nesta continuidade |
| P00-02 / P0 | 00 | Backup de Firestore/Auth; restauração separada; reconciliação de IDs, vínculos e contagens | Administrador Firebase + dados | Pendente; responsável e acesso a designar |
| P00-03 / P0 | 00 | Inventário e regressão da base atual registrados | Desenvolvimento | Inventário existente; ver validacao-continuidade.md |
| P01-01 / P0 | 01 | Dependências no lockfile; inicialização/teste por comando; CI com três órgãos | Desenvolvimento | Implementado nesta branch; ver evidências |
| P01-02 / P0 | 01 | GRGD executa roteiro isolado e registra divergências | GRGD + desenvolvimento | Roteiro preparado; responsável a designar |
| P02-01 / P1 | 02 | Primeiro módulo caracterizado, extraído e comparado em PR pequena | Desenvolvimento | Extração adiada no CONTRIBUTING; retomada deliberada após base/aceite |
| P03-01 / P1 | 03 | Fonte oficial, duplicidade, retificação/inativação e referências de órgãos | GRGD + cadastro institucional | Após preservação; dados ausentes já corrigidos, sem aceite integral |
| P04-01 / P1 | 04 | Pessoa, setor, conta e participante distintos; troca de vínculo preserva inscrições antigas | GRGD + desenvolvimento | P03-01; validar legado e duplicidades |
| P05-01 / P1 | 05 | Matriz por perfil/ação/escopo, testes positivos/negativos e auditoria aprovados | GRGD + segurança | Perfis existentes; aceite pendente |
| P06-01 / P1 | 06 | Campos, agenda, responsáveis, elegibilidade e transições homologados | GRGD + desenvolvimento | P01-02, cadastros e acessos |
| P07-01 / P1 | 07 | Vagas, concorrência, duplicidade, cancelamento/reinscrição e legado verificados | Desenvolvimento + GRGD | P06-01; piloto cobre fluxo sequencial, sem concluir concorrência |
| P08-01 / P1 | 08 | Relatórios conciliados; decisão sobre presença e correções registrada | GRGD + desenvolvimento | P07-01; inscrição não equivale a presença |
| P09-01 / P1 | 09 | Jornada real aceita; sem bloqueantes; suporte e retorno definidos | Responsável funcional GRGD | Lotes 00–08; piloto técnico não substitui aceite |
| P10-01 / P2 | 10 | VM, DNS/HTTPS, observabilidade, backup e operação aprovados | Infraestrutura ATI | Levantamento permitido; implantação depende de definições institucionais |
| P11-01 / P2 | 11 | Identidade/persistência escolhidas; integração/migração ensaiada e reconciliada | Identidade, segurança e dados ATI | Sem assumir LDAP, OIDC ou PostgreSQL disponíveis/aprovados |

## Recuperação dos serviços reais — P00-02

O administrador deve registrar projeto e escopo autorizados, coleções/contas e dependências externas, destino controlado e retenção, data/hora, versão de regras/índices e responsável. Executar exportação pelos mecanismos suportados do Firestore e Authentication e restaurar em destino isolado autorizado. Conferir contagens, IDs, relações entre usuários/pessoas/órgãos/eventos/inscrições, permissões e autenticação no destino; anexar evidência de retorno e limitações.

Não copiar segredos nem dados pessoais para issues, PRs ou artefatos públicos. A cópia Git desta continuidade é local e temporária: recupera código/histórico, não serviços reais. Nenhum backup real foi executado aqui.

## Critério de avanço

Registrar por entrega requisitos, antes/depois, arquivos e dados afetados, testes, evidências, responsável funcional e pendências. Merge e produção têm decisões próprias; esta branch não os realiza. As propostas do PDF orientam o trabalho e não comprovam aprovação da ATI ou recursos disponíveis.
