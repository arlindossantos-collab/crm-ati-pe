# Preparação da VM, PostgreSQL e identidade institucional

## Estado real

A aplicação continua usando Firebase Authentication e Cloud Firestore. A reorganização cria módulos, build estático e fronteiras identificadas; não migra dados, não instala um backend de negócio e não conecta LDAP. Nenhum endereço, conta, certificado ou política institucional foi inventado.

| Item | Preparado/validável agora | Ainda exige decisão/implementação |
| --- | --- | --- |
| Front | HTML/CSS/ES modules separados; build dist com recursos locais | Homologação funcional antes de publicar esta organização |
| VM | Templates Nginx para raiz/subcaminho; teste de HTTP/404/assets | VM/SO, DNS, HTTPS, domínio autorizado no Firebase, operação ATI |
| Dados | Inventário de relações; auditor offline tipado; schema staging | Export autorizado, carga reconciliada e esquema relacional de negócio aprovado |
| Identidade | Contrato de UID/provedor/escopo e exemplo de configuração servidor | IdP OIDC ou LDAPS, backend/sessão, MFA e recuperação acordados |
| Retorno | Artefatos por versão e preservação Git; staging isolado | Ensaio de backup/restauração reais e aceite de retorno da ATI |

## Fronteiras do código

- `src/views` e `src/styles`: interface declarativa e aparência.
- `src/modules`: fluxos de acessos, perfil, órgãos, colaboradores, eventos, inscrições, auditoria, demandas, locais e apoio.
- `src/domain`: funções de agenda e CSV sem DOM/Firebase, reutilizáveis em um futuro servidor.
- `src/services/firebase.js`: única importação do SDK; inicialização principal e auxiliar, com modo demo forçado aos emuladores.
- `src/services/subscriptions.js`: aquisição/atualização dos dados atualmente autorizados.
- `src/app/state.js`: estado transitório da sessão/UI. Não é banco, autorização no servidor ou persistência de segredos.
- `src/app/bootstrap.js` e listeners: inicialização na ordem preservada; eventos da interface separados por responsabilidade.

Algumas regras/fluxos continuam acoplados ao modelo Firestore e compartilham estado explícito. A extração não transforma chamadas Firestore em SQL nem autoriza reutilizar validação do navegador como segurança do backend. Os pontos de substituição prioritários são: subscriptions, operações de inscrições, gravações com auditoria e ciclo de contas/sessão. A lógica de autorização deve ser portada e testada no servidor antes de ativar um provedor novo.

## Sequência de migração

1. Confirmar responsáveis de negócio, infraestrutura, identidade e dados; manter desenvolvimento fictício separado.
2. Instalar somente dist em homologação da VM, com TLS e domínio Firebase autorizados. Essa etapa ainda usa Firebase.
3. Exportar Firestore/Auth por administrador autorizado; preservar originais, hashes, permissões e retenção em armazenamento protegido.
4. Converter a exportação para o formato tipado documentado; auditar arquivos offline e resolver referências/aliases sem fusão automática.
5. Carregar staging em PostgreSQL exclusivo e reconciliar quantidades, IDs, precisão, estados e histórico.
6. Aprovar modelo relacional e implementar API/repositórios transacionais, com as mesmas recusas e testes concorrentes.
7. Integrar OIDC/LDAPS no servidor, vincular identidades por identificador estável com revisão e validar sessões/recuperação.
8. Ensaiar importação final, isolamento entre órgãos/setores, última vaga, auditoria, backup/restauração e retorno.
9. Autorizar corte de gravação, migração definitiva, acompanhamento e produção. Não escrever simultaneamente em duas bases sem protocolo definido.

Não há comando neste repositório que faça migração real automaticamente. [Dados e staging](dados-postgresql.md), [identidade](identidade.md) e [operação VM](vm.md) detalham os contratos.
