# Áreas externa e interna por perfil — v0.11.0

Entrega de 23/10/2026, baseada em `main@ffd3ce8a463e51b8f43536e91bf75e25caf2f489` (v0.10.1). A referência visual é `previa-perfis.html`. Esta entrega permanece em um único `index.html`. Publicação autorizada pelo usuário em 23/10/2026, com integração e implantação acompanhadas no [PR #17](https://github.com/arlindossantos-collab/crm-ati-pe/pull/17).

## Apresentação por perfil

| Cadastro | Apresentação | Funcionalidades |
| --- | --- | --- |
| Administrador ativo da PRGD | Área interna com navegação e módulos administrativos existentes. | Permissões administrativas já existentes. |
| Equipe GRGD com vínculo institucional | Área interna. | Módulos e ações aprovados; a aparência não concede administração. |
| Usuário interno legado, sem vínculo institucional | Área interna. | Módulos legados já cadastrados, até revisão individual. |
| Gestor de NSI | Portal externo com identificação do órgão, Meu órgão, indicadores e atalhos. | Somente módulos e ações autorizados no órgão/setores do vínculo. |
| Substituto | Portal externo; a página inicial é apresentada como Minha delegação. | Limites do vínculo e do titular continuam aplicados nas regras. |
| Auditoria autorizada | Portal externo de consulta. | Trilhas e listagens permitidas; nenhum atalho de cadastro ou nova consulta ao órgão para decorar a tela. |
| Conta externa legada sem vínculo institucional | Portal externo, com Área de eventos. | Somente os módulos externos já permitidos, usando o fluxo existente. |
| Vínculo externo pendente ou sem módulos | Portal externo com aviso Acesso em análise. | Nenhum módulo liberado por causa do layout. |
| Pessoa sem login | Tela de login existente. | Cadastro de beneficiário não cria acesso ao sistema. |

A escolha é automática a partir do usuário autenticado. Não há seletor de perfil na aplicação real. Alterar classes ou atributos visuais não concede permissão; módulos, consultas, ações e regras continuam usando as verificações existentes.

## Portal do órgão

- Menu lateral no computador e horizontal no celular, com a aba atual indicada por `aria-current`. Reutiliza os mesmos botões, formulários e ações; não duplica IDs ou coleções.
- Identificação do órgão e do papel sem acrescentar consultas não autorizadas. Ausência da permissão de consultar órgão não permite buscar o nome apenas para compor o menu.
- Meu órgão mostra, conforme as ações permitidas, eventos futuros públicos ou destinados ao órgão, colaboradores ativos no escopo e inscrições confirmadas no escopo. Consulta em carregamento ou recusada aparece como indisponível; não como zero.
- Próximos eventos apresenta até três registros da agenda autorizada. Disponível para consulta não significa inscrição garantida: modelo institucional, órgão elegível, período, vagas e ação continuam necessários.
- Atalhos para cadastrar colaborador e consultar inscrições chamam os fluxos já protegidos. Não criam contas de beneficiário nem habilitam operações sem liberação administrativa.
- Títulos e tabelas seguem a hierarquia da prévia, com azul e verde suaves. A área interna conserva sua organização e os módulos existentes.
- F5 restaura a aba permitida. Mudança real de perfil troca a área visual e limpa os dados anteriores; logout limpa identidade do órgão, indicadores, resumo de eventos, formulários e tabelas.

## Validação

[GitHub Actions aprovado](https://github.com/arlindossantos-collab/crm-ati-pe/actions/runs/39970697273) na revisão funcional `de00d790780a7dbe70e4270d10af67be9305c908`: 183 testes e seis suítes de navegador. O fechamento documental não altera HTML, regras, índices ou testes. Homologação institucional permanece como conferência dos responsáveis.

109 testes da aplicação e seis suítes de navegador executados localmente. A suíte nova testa os perfis da matriz, indicadores sem registros de outro setor/órgão, cadastro pelo atalho, menu lateral e celular, F5, perfil pessoal, mudança de papel em tempo real, falha de consulta e limpeza no logout. As cinco suítes anteriores continuam exercitando Locais, segurança/sessão, perfis, inscrições e estabilidade do portal.

O CI também executa os 71 testes existentes das regras Firestore e os 3 de Auth: 183 testes, além das seis suítes de navegador. Os navegadores interceptam os SDKs; não acessam dados institucionais. As capturas em `test-results/` usam dados fictícios e são artefatos de validação.

## Implantação

**Sem alterações em `firestore.rules` ou `firestore.indexes.json`. Não é necessário republicar regras ou índices.** Publicação do site autorizada pelo usuário em 23/10/2026, após revisão e validação automatizada. Nenhum usuário é promovido ou reclassificado pela publicação.

A prévia autônoma continua sendo uma demonstração com dados fictícios. O portal funcional é a aplicação autenticada, com os dados e permissões efetivamente cadastrados. LDAP/PostgreSQL permanecem na migração separada.
