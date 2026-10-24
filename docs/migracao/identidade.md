# Identidade institucional — contrato antes de LDAP/OIDC

Hoje o login e a senha são do Firebase Authentication. Separar os arquivos ou hospedar na VM não troca esse provedor. O exemplo deploy/server.env.example documenta variáveis do futuro servidor; o front atual não as lê e não contém credenciais de banco/LDAP.

## Caminhos técnicos

Preferir o provedor institucional OIDC quando existir, inclusive se ele integrar o LDAP/AD internamente. A ATI precisa confirmar emissor, audiência/cliente, certificados, abrangência das contas externas, MFA e recuperação. O retorno deve validar assinatura, emissor, destinatário, state, nonce, PKCE e evidência de autenticação requerida; horário recente sozinho não prova MFA.

Se a opção acordada for LDAP direto, implementar no backend por LDAPS ou StartTLS com validação de CA, timeout e limites de tentativas. Nunca enviar senha de bind ao navegador nem implementar consulta LDAP direta no cliente. Filtros devem escapar o usuário como valor, não interpolar entrada como expressão LDAP. Conta de pesquisa terá o mínimo privilégio, segredo fora do Git e rotação definida. Nenhuma conexão real foi realizada nesta revisão.

## Contrato de dados e autorização

- Preservar o UID Firebase como referência de origem. Mapear para OIDC (issuer, sub) ou LDAP/AD (entryUUID/objectGUID conforme política) por revisão administrativa.
- Não associar por coincidência de nome/e-mail. Não tornar usuário administrador apenas por autenticar no diretório ou pertencer a um órgão.
- Pessoa, conta de login, colaborador participante, projeção pública e vínculo institucional continuam distintos.
- O backend deve revalidar perfil, órgão/setor, ações, início/fim/revisão e substituição em toda leitura e escrita. Não confiar nesses campos enviados pelo navegador.
- Sessão de servidor com cookie HttpOnly/Secure/SameSite, proteção CSRF, expiração e invalidação; não copiar tokens Firebase para uma “sessão LDAP” sem contrato.
- Alterações sensíveis exigem reconfirmação conforme política aprovada; recuperação/desligamento precisam invalidar as sessões pertinentes e preservar auditoria.

## API futura mínima (a implementar)

GET /api/session; POST /auth/login e /auth/logout conforme o provedor; consultas de órgãos/setores/eventos limitadas ao escopo; comandos transacionais de colaborador, inscrição, cancelamento e alteração de acesso. Erros de autenticação, escopo, sessão expirada, conflito e indisponibilidade devem ser explícitos para a interface.

A API deve atribuir autor/horário de auditoria no servidor. Inscrição, contador e histórico ficam na mesma transação SQL, com unicidade e disputa por última vaga testadas em conexões concorrentes. Acesso ao diretório e autorização de negócio são operações distintas.

Pendências da ATI/gestão: provedor aprovado, endpoints/certificados, IDs estáveis, contas de serviço, MFA, suporte, retenção, desligamento e responsáveis. A reorganização prepara esses pontos de integração; não afirma LDAP, SSO ou MFA funcionando no sistema atual.
