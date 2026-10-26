# Lote 07 — painel administrativo de inscrições e vagas (v0.16.0)

> Publicação posterior autorizada: [PR #25](https://github.com/arlindossantos-collab/crm-ati-pe/pull/25), commit 113d629, [Pages aprovado](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/40131869055). O roteiro abaixo preserva o registro da proposta e seus limites de homologação.

Proposta não publicada, baseada em main@61ec077966e051abda6026dfa5b58a1ea6e7b875 (v0.15.0). Branch feat/painel-inscricoes-v0160. O Lote 07 completo e o piloto continuam sujeitos a homologação funcional e dados legados; este é um incremento de operação e conferência.

## Resultado e limites de acesso

O administrador abre **Inscrições** no card do evento (ou os detalhes existentes) e encontra quadro de vagas, participantes, situação, órgão/setor e protocolo. A busca aceita nome, e-mail, órgão, setor e protocolo, ignorando acentos/maiúsculas. Situação e órgão podem ser combinados; limpar filtros volta à lista completa do evento.

O painel geral usa o mesmo acesso administrativo e os mesmos snapshots completos já exigidos pelo relatório CSV. Não estende a visualização geral de dados pessoais à GRGD, gestor ou auditoria. O portal do órgão mantém sua consulta delimitada e os fluxos existentes.

## Contagem e preservação

- Confirmadas/canceladas contam apenas o modelo institucional e a situação atual de cada inscrição. Não contam o número histórico de transições de cancelamento/reativação.
- Inscrições do fluxo anterior ficam separadas e não viram confirmadas automaticamente, mesmo quando possuem algum campo de situação.
- Situações institucionais desconhecidas têm contagem e filtro próprios.
- Capacidade e contador precisam ser inteiros válidos. As vagas livres só são confirmadas se o contador coincide com a lista institucional confirmada, está dentro da capacidade e não há registros de outro modelo ou situação desconhecida misturados no evento institucional.
- Diferenças podem ocorrer entre snapshots consecutivos de evento/inscrições. O aviso pede aguardar a atualização e, se persistir, revisar com a GRGD. Não diagnostica corrupção apenas por uma divergência transitória e nunca altera contadores sozinho.
- Eventos antigos não ganham cálculo automático de vagas. Documentos, IDs, histórico e modelo anterior são preservados.

Os totais sempre descrevem o evento completo, independentemente dos filtros da lista. CSV do evento continua exportando todas as inscrições desse evento e informa esse escopo; exportar uma lista filtrada não faz parte deste incremento. Inscrição não equivale a comparecimento.

## Atualização, falhas e operações

Snapshots atualizam o painel aberto e mantêm a busca, filtros e campos de edição não salvos do evento. Ao faltar confirmação de uma consulta, a lista e os totais ficam indisponíveis; uma falha não é apresentada como zero inscrições/vagas. CSV é desabilitado nesse estado. Perda de administração ou logout remove os dados pessoais do painel.

Comprovante e cancelamento reutilizam as operações existentes e as regras atuais. O cancelamento pede confirmação, libera a vaga, registra auditoria e atualiza a situação sem apagar o histórico. O painel informa o andamento/resultado e bloqueia reenvio enquanto a operação está em curso. Fechar a janela limpa o conteúdo do painel; reabrir reinicia seus filtros.

## Roteiro de aceite

1. Entrar como administrador, abrir Eventos e Inscrições em um evento institucional fictício.
2. Conferir capacidade, confirmadas, canceladas, fluxo anterior, situações desconhecidas e vagas disponíveis.
3. Buscar um participante com/sem acento, filtrar situação/órgão e conferir que os totais não mudam com a lista.
4. Consultar comprovante e cancelar uma inscrição confirmada. Conferir liberação da vaga e histórico sem duplicar operação.
5. Manter um título de evento editado e não salvo; receber atualização de inscrição e conferir que o texto permanece.
6. Simular contador divergente, consulta pendente e falha no emulador; conferir aviso e ausência de vagas confirmadas indevidamente.
7. Abrir evento antigo; conferir separação de fluxo e ausência de confirmação/presença automática.
8. Conferir desktop/celular e logout. Perfil sem administração não recebe o novo botão/painel geral.

Usar dados fictícios/emuladores para testes com gravações. A homologação não utiliza o Firebase de produção. Para repetir o smoke após expiração das delegações fictícias, reiniciar a base descartável dos emuladores e executar o seed, conforme homologacao-local.md; nunca limpar serviços reais.

## Evidências técnicas

Regressão ampliada para 147 casos: modelos, totais, escopo por evento/aliases, filtros, permissões, capacidade inválida/divergente, consultas incompletas, escape de valores e limpeza. A nova suíte tests/painel-inscricoes.browser.cjs integra o CI e verifica a atualização da lista sem sobrescrever edição, legado, falhas e layout.

O smoke integrado em scripts/homologacao/smoke.cjs usa SDK Firebase real e Auth/Firestore emulados: reinscrição pelo gestor, cancelamento pelo administrador no painel, decremento de confirmadas, incremento de vagas, filtros/edição preservados e trilha de dois cancelamentos preservada. O título não salvo não é gravado no banco. Zero requisições externas observadas.

Capturas locais: test-results/painel-inscricoes-*.png e painel-inscricoes-emuladores-*.png. A execução final das suítes será consolidada após as verificações.

## Publicação e retorno

Publicação ainda não autorizada para esta versão; preparar PR revisável e testes antes da decisão. Não há migração ou alteração de regras/índices Firebase, dependências ou esquemas. A sincronização de versão altera somente metadados da raiz do lockfile.

Após autorização, publicar somente site/documentação. Retorno ao HTML da v0.15.0 remove o novo painel e mantém inscrições, cancelamentos e auditoria realizados pelas operações existentes; não restaurar contadores ou dados automaticamente. Aceite funcional GRGD, backup dos dados reais e homologação completa do piloto continuam pendentes.

### Execução final local

Passaram os 147 testes de regressão, as nove suítes de navegador e o smoke integrado ampliado. Todas as execuções terminaram com código 0. As capturas desktop/celular foram revisadas e a consulta não criou rolagem horizontal no celular. O cancelamento administrativo foi executado com regras nativas nos emuladores e auditoria conferida. A base local descartável foi reiniciada para recriar as delegações fictícias expiradas; nenhum serviço de produção foi tocado. CI do PR será conferido separadamente.
