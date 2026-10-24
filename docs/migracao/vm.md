# VM ATI — artefato e operação

## Instalação do front

Node 22/npm são necessários no build/CI, não no Nginx que serve os arquivos gerados. Execute npm ci, npm run check, npm test e npm run build. Distribua **somente dist/**, com diretórios 0755 e arquivos 0644. Não copie o checkout, node_modules, exports, backups, .env ou credenciais para a área web.

Os templates deploy/nginx/root.conf e subpath.conf servem o mesmo artefato em / ou /prgd/. O segundo espera dist em /srv/prgd/www/prgd; o primeiro em /srv/prgd/current. URLs de assets são relativas e arquivos ausentes retornam 404. Não há backend institucional em /api; o template não finge um serviço implementado.

São templates HTTP interno na porta 8080. A ATI deve definir TLS no proxy de entrada ou configurar certificados no Nginx, DNS, firewall, relógio sincronizado, observabilidade, domínio autorizado no Firebase e atualização. Não expor login institucional sem HTTPS. Os templates foram destinados a ensaio; certificados e rede reais não foram disponibilizados.

`npm run test:deploy` verifica sintaxe e HTTP dos dois layouts em Nginx descartável e sem rede externa, além do staging PostgreSQL. O Wget usa conexão direta somente ao loopback dentro do container de teste; downloads externos continuam usando as configurações normais de proxy/TLS.

## GitHub Pages após esta reorganização

A publicação deve passar a usar **GitHub Actions / artefato dist**, conforme .github/workflows/pages.yml. A configuração atual do serviço Pages não é alterada por esta branch. Antes de integrar/publicar, com autorização do usuário, mudar a fonte do Pages de branch/raiz para workflow e acompanhar o deploy do artefato. Não integrar a nova árvore e deixar a publicação antiga copiar os templates-fonte como se fossem o site pronto.

O Firebase Hosting alternativo também aponta para dist. Publicar o site não publica regras/índices Firebase, que não mudaram nesta revisão. CI gera artefato revisável site-prgd e capturas interface-prgd. Nenhuma publicação foi realizada como parte da limpeza.

## Retorno e dados

Manter releases estáticas por versão fora do webroot e um apontamento current; fazer a troca somente após validação. Uma reversão do front não reverte dados nem deve restaurar contadores/inscrições. O backup de código Git não substitui Firestore/Auth, PostgreSQL, arquivos, segredos e configuração do futuro provedor de identidade.

A implantação completa requer responsáveis por backup/restauração, monitoração, incidentes, atualização e retenção. Ensaio local de staging e Nginx é evidência técnica, não aprovação da infraestrutura da ATI ou migração concluída.
