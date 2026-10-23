# Histórico de mudanças da PRGD

Registro das entregas em linguagem de negócio, para consulta da equipe e da gestão.

## v0.12.0 — Usuários, colaboradores e contatos vinculados — entrega de 23/10/2026

**Resumo para a chefia:** melhora a identificação de quem pode acessar a PRGD e conecta os contatos de Clientes aos colaboradores mantidos pelos órgãos, reduzindo redigitação. Administração ganha consulta de colaboradores por órgão, setor e revisão cadastral e pode associar a pessoa à sua conta existente. Base: `main@373368974e4175eb585db2a9b0d511c3eb2072a5`. Publicação autorizada pelo usuário em 23/10/2026, após informar que publicou as regras do Firestore (confirmação do usuário, sem inspeção direta do console). Integração e GitHub Pages acompanhados no [PR #18](https://github.com/arlindossantos-collab/crm-ati-pe/pull/18).

| Antes | Depois |
| --- | --- |
| Situação da conta e do vínculo distribuídas na tabela; poucos filtros. | Indicadores e filtros de perfil/situação do acesso, com motivos de bloqueio e revisão antes de salvar. |
| Colaboradores acessíveis somente no portal do órgão. | Administração consulta e cadastra no mesmo repositório, filtrando órgão, setor, revisão e conta vinculada. |
| Contatos NSI, SEI e demais funções digitados separadamente em Clientes. | Funções do colaborador alimentam automaticamente os contatos; seleção explícita por ID também disponível. Dados manuais anteriores preservados. |
| Colaborador e usuário não têm associação explícita. | Vínculo recíproco confirmado por administrador, sem promoção de perfil ou criação de login. |
| Sem prazo de revisão cadastral do colaborador. | Data opcional, sinalização de vencimento e filtro; separada da validade de acesso. |

**Validação:** 115 testes da aplicação, 80 de regras Firestore e 3 de Auth aprovados localmente (198 ao todo), além de sete suítes de navegador com dados fictícios. [Verificação remota aprovada](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/40000001532) no código funcional final; resultados e publicação registrados no PR. Inclui origem/projeção/auditoria atômicas, tentativa de associação incompleta, duplicidade de conta, desvínculo, transferência de setor com escopo e atualização de contato sem perder o formulário aberto.

**Implantação e limites:** exige novas regras, sem novos índices. Publicar regras e HTML de forma coordenada; nenhum cadastro ou perfil é migrado em massa. Cadastros anteriores geram projeção ao serem revisados/salvos na interface nova. Associação não altera permissões ou e-mail de login. Prazo cadastral não bloqueia login nem cancela inscrições. Esta entrega não implementa a arquitetura do outro repositório, MFA, revogação global de sessões ou as proteções administrativas reservadas ao lote 2. [Roteiro e limites](docs/usuarios-colaboradores.md).

## v0.11.0 — Áreas externa e interna por perfil — entrega de 23/10/2026

**Resumo para a chefia:** apresenta um portal próprio para gestores de NSI, substitutos, auditoria e usuários externos, inspirado na prévia de perfis. O menu lateral, os indicadores e os atalhos ajudam a distinguir a área do órgão da área de trabalho GRGD/administração. Base: `main@ffd3ce8a463e51b8f43536e91bf75e25caf2f489`. Publicação autorizada pelo usuário em 23/10/2026; integração e GitHub Pages acompanhados no [PR #17](https://github.com/arlindossantos-collab/crm-ati-pe/pull/17).

| Antes | Depois |
| --- | --- |
| Mesma organização horizontal para todos os perfis. | Portal externo com menu lateral, contexto do órgão, título/descrição por página e cores suaves. Equipe GRGD e administração usam a área interna. |
| Meu órgão mostra somente o vínculo. | Indicadores de eventos disponíveis, colaboradores ativos e inscrições confirmadas, exibidos conforme permissões e escopo; atalhos e resumo de próximos eventos. |
| Portal sem hierarquia própria para telas e ações. | Cabeçalho de contexto, uma única navegação com aba atual identificada, formulários e ações existentes integrados ao portal. |
| Uma mesma apresentação também no celular. | Menu horizontal com rolagem no portal móvel, cards empilhados e tabelas com rolagem interna. |

**Validação:** [GitHub Actions aprovado na revisão funcional `de00d79`](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/39970697273): 183 testes e seis suítes de navegador. Localmente, 109 testes de regressão da aplicação e seis suítes de navegador. Nova suíte verifica perfis externo/NSI/substituto/auditoria e interno/GRGD/administração, indicadores com escopo, cadastro por atalho, F5, perfil pessoal, troca de papel, limpeza no logout, falha de consulta e celular. CI também executa os 71 testes de regras e 3 de Auth existentes, totalizando 183 testes além das seis suítes. Dados fictícios, sem acesso a contas institucionais.

**Implantação e limites:** não altera regras ou índices do Firebase; não é necessário republicá-los. Não modifica perfis, vínculos ou direitos cadastrados. Eventos disponíveis significam eventos futuros públicos ou destinados ao órgão; a possibilidade de inscrição depende de elegibilidade, período, vagas e ação autorizada. Indicadores refletem as consultas do próprio usuário. A página de prévia continua demonstrativa e sem conexão aos dados reais. Ver [layout por perfil](docs/layout-por-perfil.md).

## v0.10.1 — Correções do portal do gestor de NSI — entrega de 23/10/2026

**Resumo para a chefia:** estabiliza o nome do órgão e as consultas do portal, melhora o cadastro e o filtro de colaboradores por setor e corrige eventos de hoje na lista de futuros. A pedido do usuário, responsáveis e referências de aprovação passam a ser opcionais, mantendo ativação administrativa, órgão/setores, ações, validade, revisão e histórico. Base: `main@53f51a33f6b027f8643438e2724c01a016ac1fbc`. Publicação autorizada pelo usuário em 23/10/2026 após informar que publicou as regras da v0.10.1 no Firebase. Relato do usuário, sem verificação direta do console. Integração e GitHub Pages acompanhados no [PR #16](https://github.com/arlindossantos-collab/crm-ati-pe/pull/16).

| Antes | Depois |
| --- | --- |
| Comparação textual do vínculo inclui ordem dos mapas e metadados; pode limpar e reiniciar consultas equivalentes. | Compara permissões efetivas em ordem estável; metadados não apagam o formulário nem o nome já carregado. Mudança real de acesso continua limpando os dados. |
| Setores carregados após abrir o formulário não atualizam o seletor. | Seletor atualizado sem perder os dados digitados, filtro por setor e mensagens distintas de carregamento, falha e ausência de setores ativos. |
| Evento de hoje é passado desde meia-noite. | Permanece em Futuros até o horário final ou fim do dia local; situação Realizado continua respeitada. |
| Campos textuais das aprovações impedem ativação. | Campos opcionais no formulário, prévia e regras; somente o administrador mantém a decisão e o registro de autoria. |

**Validação:** 109 testes da aplicação, 71 de regras Firestore e 3 de Auth, totalizando 183, além de cinco suítes de navegador com dados fictícios. Nova suíte exercita ordem variável dos snapshots, metadados, setores atrasados, criação por setor, filtros, evento elegível de hoje, falhas, alteração real de escopo, referências em branco e celular. Não equivale à homologação com o cadastro institucional do usuário.

**Implantação:** novas regras da v0.10.1 informadas como publicadas pelo usuário em 23/10/2026; sem alteração de índices. Homologação institucional e conferência dos setores/elegibilidade existentes continuam necessárias. Não cria setores, não altera situações ou libera operações em lote, não converte eventos legados nem deduz órgão pelo texto ou e-mail. Vínculos já aprovados passam a funcionar com os campos textuais vazios, respeitados os demais limites. Setores continuam cadastrados pelo administrador em Usuários → Setores por órgão. Detalhes em [correções do portal](docs/correcoes-portal-nsi.md).

## v0.10.0 — Colaboradores e inscrições institucionais — entrega de 23/10/2026

**Resumo para a chefia:** permite que o gestor do órgão e seu substituto cadastrem colaboradores sem criar contas de acesso e façam inscrições em eventos elegíveis. Entrega controle de vagas, cancelamento e comprovante com autoria individual. Base: `main@d033b8f2b2f76a414a170f7904821357b2b60485` (v0.9.0). Publicação autorizada pelo usuário em 23/10/2026, após informar que publicou as novas regras no Firebase. Confirmação baseada no relato do usuário, sem verificação direta do console. Integração e GitHub Pages acompanhados no [PR #15](https://github.com/arlindossantos-collab/crm-ati-pe/pull/15).

| Antes | Depois |
| --- | --- |
| Portal do órgão em consulta; operações futuras sem escrita. | Liberação expressa após revisão das aprovações, preservando vínculos anteriores em consulta. |
| Colaboradores sem formulário operacional. | Cadastro, edição de dados de contato e inativação por gestor/substituto, no órgão/setores delegados, sem Authentication. |
| Inscrição somente da própria conta. | Novos eventos institucionais com órgãos elegíveis, período e vagas; beneficiário separado do operador. Eventos anteriores preservados. |
| Sem garantia transacional de vaga por representação. | Registro determinístico por evento/e-mail, contador e histórico no mesmo lote, inclusive disputa da última vaga. |
| Sem cancelamento institucional ou comprovante. | Cancelamento preserva protocolo e libera vaga; retomada usa o mesmo registro. Comprovante consultado novamente antes de imprimir/salvar PDF. |

**Validação:** 105 testes da aplicação, 69 de regras e 3 de Auth, além das quatro suítes de navegador com Firebase simulado. Casos incluem escopo, revisão operacional, substituição, concorrência, auditoria, duplicidade entre órgãos, cancelamento após retirada da elegibilidade, comprovantes, F5/logout e celular. Dados fictícios e projeto de demonstração; nenhuma conta institucional alterada.

**Restauração da sessão:** a verificação final identificou uma disputa na ordem de chegada do CSS: o login podia estar com a classe de ocultação e ainda receber `display:flex`. Uma regra local prioritária protege login, modais e área de restauração. O teste simula utilitários CSS chegando após o HTML, sem dispensar a verificação de F5 sem exibir login.

**Implantação e limites:** novas regras informadas como publicadas pelo usuário em 23/10/2026; índices compostos da v0.9.0 preservados. Homologação institucional e habilitação individual dos vínculos após revisão das aprovações continuam pendentes; os testes automatizados não equivalem à homologação em produção. [Validação completa do código funcional no GitHub Actions](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/39851782396), revisão `319a2ff`. Não converte eventos legados, não transfere órgão/setor/e-mail de colaborador, não emite certificado de presença nem assinatura digital e não integra LDAP/PostgreSQL. Detalhes e retorno em [inscrições institucionais](docs/inscricoes-institucionais.md).

## v0.9.0 — Governança dos vínculos e telas por perfil — entrega de 22/10/2026

**Resumo para a chefia:** prepara a PRGD para atender equipe GRGD, gestores de NSI, substitutos e auditoria com acessos aprovados por órgão e setor. Participantes permanecem pessoas sem conta obrigatória. Base: `main@61cdbf259b283071d8d6be8cb27abefc835eaa5e` (v0.8.0). Publicação autorizada pelo usuário em 22/10/2026, após informar que publicou as regras e os índices no Firebase. Integração e GitHub Pages acompanhados no [PR #14](https://github.com/arlindossantos-collab/crm-ati-pe/pull/14).

| Antes | Depois |
| --- | --- |
| Interno/externo e administrador/consulta, com órgão em texto livre. | Vínculo adicional com papel, órgão por ID, setores e ações aprovadas; preservação dos cadastros antigos. |
| NSI apenas como contato do órgão. | Acesso de NSI e substituto exige referências de aprovação GRGD e autoridade competente, início, validade e próxima revisão. |
| Alterações de negócio dependiam de administração completa. | Equipe GRGD pode criar/editar somente módulos expressamente autorizados, sem excluir nem administrar usuários. |
| Sem portal próprio para o órgão. | Meu órgão, Colaboradores e Inscrições do órgão com consultas filtradas e bloqueio por ID fora do escopo. |
| Histórico apenas administrativo. | Auditoria autorizada em leitura de trilhas identificadas com órgão e setor; sem editar, apagar ou conceder acessos. |
| Sem demonstração independente dos perfis. | Prévia autônoma, responsiva e com dados fictícios, sem conexões externas. |

**Compatibilidade protegida:** inscrições legadas não recebem órgão, setor ou participante arbitrário por requisição; seu histórico exige um registro da própria conta. Inscrições institucionais por representação continuam bloqueadas até o próximo lote.

**Governança:** administrador registra aprovações institucionais recebidas, seus responsáveis/referências e a autoria do registro. Não implementa assinatura eletrônica ou validação automática de protocolos. Alterar escopo no formulário exige nova revisão das aprovações. Não deduz privilégios do LDAP, de e-mail ou do cadastro de contatos.

**Validação:** 95 testes da aplicação, 48 de regras e 3 de Auth (146 ao todo), além das três suítes de navegador, aprovados no [GitHub Actions](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/39824225503). Emuladores de demonstração e Firebase simulado verificam NSI, auditoria, edição GRGD, aprovação, F5/logout e prévia em computador/celular. Testes não alteram dados institucionais. A publicação das regras e dos índices é confirmada pelo relato do usuário, sem verificação direta do console nesta sessão. Homologação institucional permanece pendente. Detalhes em `docs/perfis-vinculos.md`.

**Implantação e limites:** mudanças de regras e índices exigem homologação separada e publicação coordenada. Primeiro lote: um vínculo e órgão por conta, até cinco setores ou delegação integral. Cadastro e inscrição por representação, elegibilidade por órgão, comprovantes e integração LDAP/PostgreSQL continuam como próximas entregas. Sem migração automática de usuários, contatos ou históricos antigos.

## v0.8.0 — Exclusão protegida, histórico e restauração da sessão — entrega de 21/10/2026

**Resumo para a chefia:** reduz exclusões acidentais com confirmação da senha do administrador, identifica quem alterou os cadastros e mantém a aba escolhida ao atualizar a página. Parte de `main@5f444af75e9b35a8f5e67e9efdca573f5c83ae3f` (v0.7.0). Publicação autorizada pelo usuário em 21/10/2026, após informar que publicou as novas regras no Firebase. Integração e GitHub Pages acompanhados no PR #13.

| Antes | Depois |
| --- | --- |
| Confirmação simples para excluir, com controles que o usuário relatou ver em outras contas. | Controles ocultos por padrão fora da administração; painel pede a senha da própria conta antes de excluir. |
| Exclusão de usuário sem vínculo obrigatório com histórico. | Regras exigem autenticação recente e registro de histórico no mesmo envio da exclusão lógica. |
| Autoria parcial nos próprios registros, sem consulta central. | Histórico administrativo com pessoa, horário do servidor, ação, registro e nomes dos campos alterados; busca e paginação. |
| F5 podia mostrar o login durante a restauração e voltar à aba inicial. | Carregamento aguarda o Firebase e as permissões; restaura a aba e a visualização de Demandas na mesma guia. |

**Validação:** 87 testes da aplicação, 34 de regras e 3 de autenticação aprovados no [GitHub Actions](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/39633564600) (124 aprovações). A conferência adicional em Chromium cobre Locais no computador/celular, senha incorreta, cancelamento, exclusão, histórico, consulta sem exclusão e F5 na mesma aba sem exibição do login; os resultados e as capturas estão nas execuções do [CI do PR #13](https://github.com/arlindossantos-collab/crm-ati-pe/pull/13/checks). Conferência estática preserva todos os 153 IDs anteriores do HTML, agora com 170 IDs sem duplicação. Dados simulados e emuladores; nenhuma exclusão em produção.

**Limites e pendências:** histórico inicia após a implantação e cobre operações da aplicação; não captura mudanças pelo console Firebase ou programas externos. Guarda nomes de campos, sem os valores anteriores/novos. Troca de senha ocorre no Authentication e seu histórico no Firestore; falha do histórico é informada sem reverter a senha. Perfis já cadastrados não são alterados automaticamente. A restauração cobre aba e visualização de Demandas; formulários e buscas não são recuperados após F5. Homologação institucional pendente.

**Implantação:** usuário confirmou em 21/10/2026 a publicação do novo `firestore.rules` antes do HTML. Confirmação baseada no relato do usuário, sem verificação direta do console nesta sessão. A implantação do GitHub Pages é acompanhada separadamente. Durante a transição, a exclusão de usuários pela v0.7.0 é bloqueada por não enviar o histórico obrigatório. Não retirar as novas proteções apenas para liberar um cliente antigo. Ver [procedimento e retorno](docs/seguranca-auditoria-sessao.md). Aplicação permanece em um único HTML; organização e cores de Locais preservadas.

Próximas versões possíveis: v0.8.1 para correções ou v0.9.0 para novas funcionalidades; sem compromisso de entrega.

## v0.7.0 — Gestão de usuários e sessão persistente — entrega de 21/10/2026

**Resumo para a chefia:** facilita editar e retirar usuários do cadastro ativo e preserva o login após atualizar a página. Parte da v0.6.3 e mantém os ícones, tons suaves e disposição atual de Locais.

| Antes | Depois |
| --- | --- |
| Edição acessível em Detalhes. | Editar diretamente na lista e Salvar usuário no formulário. |
| Inativação mantinha o cadastro na lista. | Excluir exige confirmação, marca ativo=false/excluido=true e retira da lista e contadores. |
| F5 descartava a sessão em memória. | Persistência local na sessão principal; cadastro auxiliar permanece isolado em memória. |

**Limites:** somente administradores podem excluir; autoexclusão bloqueada. Conta Auth, dados pessoais, e-mail reservado e histórico permanecem. Exclusão definitiva exige implementação administrativa separada.

**Validação:** [GitHub Actions aprovado](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/39476011701), commit `d38143255337955aeddc3013e2022f2cb4f9f499`: **75 testes da aplicação, 27 de regras e 2 de autenticação, total 104 aprovações sem falhas**. Locais também aprovado em Chromium, incluindo layout móvel, com Firebase totalmente simulado. Regras e autenticação verificadas em emuladores. Persistência real e homologação institucional permanecem pendentes.

**Implantação:** publicação autorizada em 21/10/2026 após o usuário informar que publicou as regras do Firestore. Confirmação das regras baseada no relato do usuário; o console Firebase não pôde ser verificado diretamente nesta sessão. Integração à main e implantação do GitHub Pages são etapas separadas, acompanhadas no PR #8. Confirmar login, F5, reabertura, Sair, edição e exclusão no ambiente institucional; nenhum usuário real foi excluído pela preparação desta entrega. Próximas versões possíveis: v0.7.1 para correções ou v0.8.0 para novas funcionalidades.

## v0.6.3 — Ícones e tons suaves nos indicadores de Locais — entrega de 20/10/2026

**Resumo para a chefia:** melhora a identificação dos seis indicadores, mantendo a disposição atual da tela.

- Versão anterior: v0.6.2. Nova versão: v0.6.3. Publicação autorizada em 20/10/2026; conferir integração e GitHub Pages separadamente.
- Antes: cards brancos com rótulos sem ícones.
- Depois: um ícone por indicador e fundos discretos alternando somente azul e verde, com opacidade de 5,5% e borda de 16%. Texto, números e notas mantêm as cores anteriores.
- Ícones: edifício, pessoas, calendário, presente, cartão e moedas, na ordem dos indicadores. Ícones decorativos; nomes preservados para leitura e acessibilidade.
- Sem agenda lateral, nova identidade roxa, cores fortes ou reorganização. HTML estático do corpo preservado integralmente após normalizar apenas a versão.
- Alteração limitada aos seis cards: demais campos, tabela, cabeçalho, consulta, cálculos, cadastros, permissões e regras do Firebase preservados.
- Teste de navegador verifica seis ícones, moedas no custo, somente azul/verde, baixa opacidade e consulta abaixo do painel, além dos fluxos anteriores.
- [Execução completa aprovada no GitHub Actions](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/39473507112), commit `bbfee522ef9e3b54dc7c1355b2958fee3250389a`: 70 testes da aplicação, 25 de regras e 2 de autenticação, totalizando **97 aprovações**. Chromium aprovado em desktop e celular: seis ícones, moedas no custo, apenas azul/verde, baixa opacidade e consulta mantida abaixo do painel. Dados simulados; não equivale a homologação em produção.
- Publicação autorizada. Não exige alteração no Firebase; PR #8 continua separado.
- Próxima versão sugerida: v0.6.4 para ajustes ou v0.7.0 para funcionalidades; sequência formal a conferir ao publicar.



## v0.6.2 — Restauração do layout anterior de Locais — 20/10/2026

**Resumo para a chefia:** restaura a interface de Locais da v0.6.0, desfazendo a apresentação visual da v0.6.1 conforme solicitação do usuário.

- Versão anterior publicada: v0.6.1. Nova versão: v0.6.2. O número avança para registrar a reversão; a aparência retorna à v0.6.0.
- Antes: indicadores com seis cores/ícones, identidade roxa e disponibilidade na lateral direita.
- Depois: cards, cores e disposição da v0.6.0, com consulta de disponibilidade abaixo do conteúdo.
- Mantidos: modernização original de Locais, indicadores, filtros, informações, histórico, cadastros e cálculos.
- Código da interface restaurado a partir de `5efc60fad20ce2bb6376e301eeb4e4bb01389da3`; no HTML só a identificação da versão difere daquela referência.
- Teste de navegador retorna à validação anterior, que verifica os fluxos e a largura de celular. Conferir resultados da execução vinculada ao PR de reversão.
- Reversão e publicação autorizadas pelo usuário em 20/10/2026. Confirmar integração e GitHub Pages separadamente.
- Nenhuma alteração nos dados ou regras do Firebase. PR #8 permanece separado.
- Próxima versão sugerida: v0.6.3 para ajustes ou v0.7.0 para novas funcionalidades; sequência formal de release a conferir quando registrada.


## v0.6.1 — Identificação visual de Locais — entrega de 20/10/2026

**Resumo para a chefia:** facilita reconhecer os indicadores e consultar a agenda enquanto se examina um local.

- Versão anterior: v0.6.0. Nova versão: v0.6.1, ajuste de interface sem nova regra de negócio. Publicação autorizada em 20/10/2026; conferir GitHub Pages separadamente.
- Próxima versão sugerida: v0.6.2 para ajustes ou v0.7.0 para novas funcionalidades. Sequência da release será conferida quando a publicação for autorizada.
- Base: main@5efc60fad20ce2bb6376e301eeb4e4bb01389da3. Alteração de usuários do PR #8 permanece separada.

| Antes | Depois |
| --- | --- |
| Cards semelhantes, com nomes sem ícones. | Cada indicador combina nome, ícone temático e uma cor própria. |
| Destaques predominantemente azuis. | Identidade roxa restrita ao módulo Locais, com cores distintas nos indicadores. |
| Consulta de disponibilidade abaixo de todo o conteúdo. | Painel na lateral direita a partir de 1024 px; abaixo do conteúdo em telas menores. |
| Rótulos de campos e tabela só em texto. | Ícones também nos cabeçalhos, informações do local, formulário e consulta, preservando os nomes. |

### Identificação dos indicadores

| Indicador | Ícone | Cor |
| --- | --- | --- |
| Locais cadastrados | Edifício | Roxo |
| Capacidade total | Pessoas | Azul |
| Eventos vinculados | Calendário | Índigo |
| Locais gratuitos | Presente | Verde |
| Locais pagos | Cartão | Âmbar |
| Custo total previsto | Moedas | Rosa |

Os ícones são decorativos para leitores de tela; os nomes permanecem presentes. Cores não substituem os rótulos. Estilos restritos a Locais e aos seus campos no modal.

### Validação e limites

- Sintaxe JavaScript conferida; IDs existentes preservados, sem duplicação.
- Testes de navegador verificam seis fundos distintos, ícones, ícone de moedas no custo, agenda à direita no computador e abaixo no celular, além dos fluxos anteriores.
- [Execução completa aprovada no GitHub Actions](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/39470701865), commit `7cb9e1a6bb2bc6f34b96be04850be282defc82b2`: 70 testes da aplicação, 25 de regras e 2 de autenticação, totalizando **97 aprovações**. Chromium também aprovado: seis cores distintas, ícones, moedas no custo, agenda à direita no computador, abaixo no celular e fluxos existentes. Dados simulados; não é homologação em produção.
- Cálculos, vínculos, permissões, campos, gravações e regras do Firebase preservados. Não exige atualização do Firebase.
- Entrega autorizada para publicação. O ajuste segue a descrição textual do usuário. Integração, implantação do site e página formal de release são etapas distintas.


## v0.6.0 — Locais e planejamento de espaços — entrega de 20/10/2026

**Resumo para a chefia:** moderniza a aba Locais com indicadores, comparação de espaços, filtros, painel de informações e consulta de conflitos na agenda cadastrada.

- Base independente: main@85e439612962626ffa3783879dab18a8ea383e47 (v0.4.0). O PR #8/v0.5.0 continua separado e pendente do Firebase; não foi incorporado nem publicado.
- Publicação autorizada em 20/10/2026. Versão anterior publicada: v0.4.0; nova versão: v0.6.0. A identificação v0.5.0 pertence ao PR #8, ainda não publicado; deverá ser ajustada antes da sua integração para não reduzir a versão do sistema.
- Próxima página formal prevista: **Release 02 — v0.6.0**, conforme histórico consultado com apenas Release 01 — v0.4.0. Este arquivo não cria tag/release. Integração, GitHub Pages e release formal são verificações separadas.
- Próxima versão sugerida: v0.6.1 para correções ou v0.7.0 para funcionalidades.
- A aplicação continua em um único HTML. Nenhum dado existente é migrado ou alterado automaticamente.

| Antes | Depois |
| --- | --- |
| Lista simples de locais. | Seis cards: total, capacidade informada, eventos vinculados, gratuitos, pagos e custo previsto informado por evento. |
| Busca básica e nenhum filtro específico. | Busca sem distinção de acentos em nome, endereço e contatos; filtros combinados de tipo, capacidade mínima e recurso. |
| Tabela com seis colunas. | Mantém as colunas originais e acrescenta eventos vinculados e recursos. |
| Detalhes apenas no modal genérico. | Painel abaixo da tabela com endereço, capacidade/área, responsável, recursos e histórico; edição administrativa permanece acessível. |
| Sem consulta de agenda. | Consulta por local, data e horários opcionais; conflitos, agenda parcial e lacunas exibidos explicitamente. |
| Novos locais/eventos só tinham nome e descrição. | Formulários com capacidade, contatos, recursos, tipo/tarifa e vínculo localId, período, situação e custo total da locação por evento. |

### Regras de cálculo e limites

- Capacidade soma apenas números válidos; campos ausentes não são inventados. Gratuito e pago usam o tipo informado ou valor numérico legado; ausência de valor não significa gratuito.
- Eventos vinculam pelo ID; nome legado só é associado em consulta quando corresponde a um único local (ignorando acentos/caixa/espaços). Não há gravação automática desse vínculo. ID órfão e nome duplicado exigem revisão.
- Eventos vinculados inclui todos os períodos e cancelados. Custo previsto soma somente custos totais explicitamente informados por evento vinculado, atual/futuro e não cancelado/realizado. Tarifa do local não é multiplicada por diárias ou horas. Ausências e totais parciais são sinalizados.
- Consulta não é reserva. Sem horários completos, o período inteiro pode estar comprometido. Eventos cancelados não geram conflito. Agendas parciais, erros de carregamento, locais/datas ausentes e vínculos ambíguos impedem afirmar disponibilidade completa.
- Datas com fuso são tratadas no fuso de Pernambuco. Eventos de vários dias são tratados conservadoramente.
- Datas passadas não comprovam realização: o histórico diferencia realização registrada de data encerrada a confirmar.
- Dados de eventos respeitam o acesso existente; somente administrador recebe a agenda completa. Sem módulo Eventos, indicadores de eventos/custo ficam indisponíveis.
- Não muda firestore.rules. Pode ser revisado/testado sem a atualização do Firebase pendente no PR #8. Concessão de novos acessos não faz parte desta entrega.

### Validação

- [Execução completa aprovada no GitHub Actions](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/39465560736), commit `2b92110ada190203b3464e09740e85fb98993c7c`: **70 testes da aplicação, 25 de regras e 2 de autenticação, total de 97 aprovações sem falhas**.
- Chromium aprovado com Firebase totalmente interceptado: seis cards, filtros, busca de contato, painel/histórico, conflito por horário, horários adjacentes sem conflito, edição e criação de local.
- Capturas de desktop (1440 px) e celular (390 px) guardadas no artefato locais-interface da execução. Verificado que a página não transborda na largura do celular; tabela e abas têm rolagem própria. O teste inicial revelou transbordamento da navegação, corrigido antes desta aprovação.
- Nenhuma operação de teste acessou os dados do Firebase real. A prova inicial V8 foi complementada pela execução oficial; isso não equivale a homologação institucional.
- Conferência estática preservou todos os 138 IDs originais do HTML; nova página tem 153 IDs, sem duplicação.
- Pendências: homologar com usuários e revisar os cadastros reais para associar locais e preencher períodos, recursos e custos. Publicação autorizada; conferir a implantação do GitHub Pages separadamente.


**Release 01 — v0.4.0:** notas da entrega autorizada para publicação em 20/10/2026. Na conferência anterior à publicação não havia tags nem releases formais. A situação das publicações formais pode ser consultada na [página de releases](https://github.com/arlindossantos-collab/crm-ati-pe/releases); este arquivo não cria uma tag ou release por si só.

<a id="v040"></a>
## Release 01 — v0.4.0 — 20/10/2026

**Resumo para a chefia:** o sistema passou a cadastrar contas internas e externas, vincular os responsáveis GRGD às demandas e permitir que cada pessoa mantenha seu perfil com foto e senha. Também recebeu correções de calendário, consultas, edição e troca de sessão.

- **Versão anterior declarada:** v0.3.4.
- **Nova versão:** v0.4.0.
- **Motivo do incremento:** consolidar funcionalidades adicionadas desde a identificação anterior, além das correções já integradas.
- **Base examinada:** `main@c2c13c3b31b9765930f1e32ea04d416aa79846cf`.
- **Situação:** entrega autorizada para publicação em 20/10/2026. A implantação do site e o registro da release no GitHub são verificações separadas.
- **Próxima versão sugerida:** v0.4.1 se o próximo lote trouxer apenas correções; v0.5.0 se adicionar funcionalidades. Não é compromisso de entrega.

### Antes e depois

| Área | Antes | Depois / benefício |
| --- | --- | --- |
| Cadastro de usuários | O formulário genérico não criava uma conta de acesso vinculada ao perfil. | Cadastro cria login e perfil no mesmo UID, mantendo a sessão do administrador. |
| Tipos e acesso | Não havia distinção explícita entre interno e externo. | Tipos **Interno - GRGD** e **Externo**, com situação, perfil e módulos configuráveis conforme as regras atuais. |
| Responsáveis GRGD | Lista fixa de nomes, sem identificação estável da pessoa. | Seleção de internos ativos por UID; vínculos e nomes anteriores preservados. |
| Perfil pessoal | Usuário não tinha uma área própria para manter seus dados. | Menu Perfil para editar nome, telefone, endereço e foto enviada do computador. |
| Foto e identificação | Identificação visual limitada a nome e iniciais. | Foto circular na conta ativa e nos registros vinculados à pessoa; iniciais continuam como alternativa. |
| Senha | Não havia troca de senha pelo próprio usuário na interface. | Alteração com senha atual e confirmação da nova senha, pelo Firebase Authentication. |
| Dados pessoais | Faltava uma separação própria para os novos dados de contato pessoais. | Telefone e endereço em documento privado; identificação compartilhada contém apenas os dados necessários ao avatar e ao vínculo. |
| Calendário e consultas | Navegação mensal, buscas, contadores e cache tinham inconsistências. | Navegação corrigida, filtros conectados e indicadores/cache ajustados. |
| Edição e sessão | Edição podia converter tipos; respostas antigas podiam permanecer após troca de conta. | Preservação de tipos, limpeza de dados e descarte de respostas de sessões anteriores. |
| Documentação e versão | Código seguia em v0.3.4, com README extenso e parcialmente desatualizado. | Versão sincronizada em HTML e pacotes, README resumido, histórico de mudanças e mapa de organização. |

### Origem das mudanças já integradas

| Entrega | Referência |
| --- | --- |
| Calendário, buscas, edição e isolamento de sessão | [PR #2](https://github.com/arlindossantos-collab/crm-ati-pe/pull/2), integrado em `f5c694e`. |
| Cadastro interno/externo e responsáveis GRGD | [PR #3](https://github.com/arlindossantos-collab/crm-ati-pe/pull/3), integrado em `0c128ff`. |
| Rótulo Interno - GRGD | [PR #4](https://github.com/arlindossantos-collab/crm-ati-pe/pull/4), integrado em `fa041d2`. |
| Perfil pessoal, foto e alteração de senha | [PR #6](https://github.com/arlindossantos-collab/crm-ati-pe/pull/6), integrado em `c2c13c3`. |
| Remoção de HTML experimental, anterior a este mapa | Commits `cbf6b64` e `4f5552a`, com integração do [PR #5](https://github.com/arlindossantos-collab/crm-ati-pe/pull/5). |

As funcionalidades acima já estavam no código examinado. Este lote corrige a identificação de versão e documenta o que foi entregue; não repete sua implementação.

### Validação

- O lote de perfil pessoal registrou **54 testes da aplicação, 25 de regras e 2 de senha**, totalizando 81 aprovações em ambiente de teste.
- Nesta revisão de documentação/versão, **54 testes de regressão passaram**. A comparação confirmou que o HTML muda somente versão, comentário e log; dependências, regras, testes e arquivos históricos permanecem intactos. Sintaxe JavaScript, links locais e diff foram conferidos.
- Os 25 testes de regras e 2 de senha não foram repetidos neste lote, pois suas regras e implementação não mudaram; os resultados do lote anterior estão distinguidos acima.
- Em 20/10/2026, o usuário informou ter publicado as regras no Firebase e confirmou que o cadastro de usuário funcionou. Esse é um relato de validação do cadastro; não comprova todos os fluxos em produção.
- Testes anteriores em Chromium utilizaram Firebase simulado. Homologação institucional completa continua necessária.

### Implantação e retorno

- Esta revisão não muda `firestore.rules` nem configurações do Firebase.
- Conferir login e versão no cabeçalho após integrar e publicar a proposta.
- A tag `v0.4.0` deve identificar o commit final integrado e revisado. A data efetiva e a confirmação da publicação formal ficam na página da release.
- Reverter apenas o código não restaura dados do Firebase. Não aplicar regras históricas sem revisão de compatibilidade e acesso aos novos documentos.

### Pendências

- Acessos externos adicionais, convites e recuperação de senha.
- Regras de eventos, vagas, inscrições concorrentes e relatórios.
- Comparação dos recursos exclusivos de `v0.40/` antes de retirar a cópia antiga da árvore ativa.
- Limpeza das branches concluídas e implantação futura em VM.

## Histórico anterior à consolidação

O histórico possui rótulos como `v0.40`, `v0.3.10` e `v0.3.4`, sem sequência consistente e sem tags/releases formais na consulta realizada. Eles não foram renumerados nem transformados retroativamente em releases.

A referência anterior da aplicação principal é a versão v0.3.4 declarada no HTML. A pasta `v0.40/` representa uma implementação alternativa histórica; seu nome não determina a versão oficial da aplicação principal.

