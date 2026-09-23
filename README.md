# PRGD v40.0 — Plataforma de Relacionamento do Governo Digital (ATI-PE)

> **Documento de visão, escopo e experiência do usuário**  
> Versão documentada: **v40.0**  
> Órgão: Agência Estadual de Tecnologia da Informação de Pernambuco (ATI-PE)

---

## 1. Visão geral

O **PRGD — Portal de Relacionamento do Governo Digital** tem como propósito centralizar, organizar e dar rastreabilidade ao relacionamento interinstitucional da ATI-PE com os órgãos e entidades do Governo de Pernambuco.

A solução reúne informações de clientes governamentais, equipes de relacionamento, demandas, eventos e inscrições, espaços para realização de eventos, fornecedores de TIC, usuários, bases dinâmicas e relatórios gerenciais.

O sistema busca oferecer uma visão consistente do relacionamento institucional, apoiar o planejamento e a execução das atividades e facilitar a consulta a informações confiáveis para acompanhamento gerencial.

### 1.1 Objetivos

- Centralizar informações hoje dispersas em diferentes controles.
- Padronizar o cadastro e a manutenção de dados institucionais.
- Apoiar o acompanhamento de demandas e atividades de relacionamento.
- Organizar eventos, inscrições, limites de vagas e registros de presença.
- Registrar autoria e histórico básico de criação e modificação dos dados.
- Disponibilizar consultas e exportações para apoio à gestão.

### 1.2 Público-alvo

- Administradores responsáveis pela configuração e governança da aplicação.
- Equipes da ATI-PE que atuam no relacionamento com órgãos e entidades estaduais.
- Gestores e usuários autorizados que consultam informações e relatórios, conforme seus perfis de acesso.

---

## 2. Escopo do produto

### 2.1 Escopo positivo — o que o PRGD contempla

O escopo positivo define as capacidades previstas para a solução.

| Área | Capacidades contempladas |
|---|---|
| **Clientes governamentais** | Cadastro e manutenção de órgãos/entidades, contatos e informações de relacionamento. |
| **Equipe NSI** | Registro de até três integrantes por cliente, com nome, e-mail e telefone, conforme a definição da versão v40.0. |
| **Demandas** | Registro, organização e acompanhamento de demandas relacionadas ao relacionamento institucional, de acordo com os campos e fluxos implementados. |
| **Eventos** | Cadastro e gestão de eventos, informações de divulgação e inscrições. |
| **Inscrições** | Acompanhamento de inscritos, limite de vagas e consolidação dos dados apresentados no painel analítico. |
| **Presença** | Geração e utilização de QR Code para apoiar o registro/validação de presença, conforme o fluxo implementado. |
| **Locais e auditórios** | Cadastro e consulta de espaços disponíveis para atividades e eventos. |
| **Fornecedores de TIC** | Cadastro e consulta de fornecedores e informações pertinentes ao relacionamento institucional. |
| **Usuários e acesso** | Autenticação e gestão de acesso de acordo com os perfis e regras efetivamente configurados. |
| **Bases dinâmicas** | Repositório de informações de referência configuráveis para apoiar os cadastros e a operação. |
| **Auditoria** | Registro padronizado de metadados de criação e modificação nos módulos abrangidos pela implementação. |
| **Relatórios** | Painéis gerenciais e exportação customizável de dados em CSV, conforme filtros e campos disponíveis. |

**Nota de precisão:** a tabela descreve o escopo funcional informado para a v40.0. A existência de uma capacidade no documento não substitui testes de aceitação, validação das regras do Firebase nem conferência do código publicado.

### 2.2 Escopo negativo — o que não faz parte do produto

O escopo negativo explicita limites e evita expectativas que a aplicação não se propõe a atender.

- **Não realiza operações financeiras:** não processa pagamentos, cobranças, reembolsos ou prestação de contas financeira.
- **Não é uma plataforma de comunicação instantânea:** não oferece chat, mensageria em tempo real ou videoconferência.
- **Não é um sistema corporativo de gestão integral:** não substitui, por si só, sistemas oficiais de protocolo, processos administrativos, gestão de contratos, compras, RH ou atendimento técnico.
- **Não garante integração automática com sistemas externos:** integrações com SEI, diretórios corporativos, e-mail, calendários ou outros sistemas dependem de requisitos, autorização e implementação específicos.
- **Não deve ser considerado repositório irrestrito de arquivos:** o escopo informado limita arquivos de mídia a até 500 KB. Esse limite deve ser confirmado no código e na validação de upload; não implica suporte a qualquer formato.
- **Não substitui decisões gerenciais:** dashboards e relatórios apoiam a análise, mas a interpretação e as decisões permanecem sob responsabilidade dos gestores.
- **Não assegura, apenas por usar Firebase, conformidade automática:** privacidade, LGPD, retenção, controle de acesso, auditoria e segurança dependem de configuração, governança e operação adequadas.

### 2.3 Fora de escopo nesta versão (salvo implementação aprovada)

Os itens abaixo devem ser tratados como evolução ou integração futura, e não como funcionalidades presumidas da v40.0:

- Aplicativos móveis nativos.
- Fluxos avançados de aprovação multinível.
- Notificações por SMS, WhatsApp ou e-mail transacional.
- Assinatura eletrônica ou certificação digital de documentos.
- Integrações externas não descritas e homologadas.
- Armazenamento de mídia em grande volume.
- Inteligência artificial para classificação, previsão ou recomendação de demandas.

---

## 3. Experiência do usuário (UX)

A experiência do usuário deve tornar as tarefas frequentes compreensíveis, previsíveis e eficientes, especialmente para usuários que não participaram do desenvolvimento.

### 3.1 Princípios de UX

1. **Clareza:** nomes de menus, campos e ações devem refletir a linguagem institucional e a finalidade real.
2. **Consistência:** formulários, botões, mensagens, tabelas e padrões de navegação devem funcionar de maneira semelhante entre módulos.
3. **Previsibilidade:** ações de salvar, editar, excluir, sair e voltar devem produzir resultados claros e feedback visível.
4. **Prevenção de erros:** validar campos obrigatórios, formatos, limites de vagas e permissões antes de concluir operações.
5. **Recuperação:** mensagens de erro devem explicar o problema e indicar uma ação possível, sem expor detalhes técnicos ou dados sensíveis.
6. **Eficiência:** permitir localizar, filtrar e consultar registros sem percorrer telas desnecessárias.
7. **Acessibilidade:** garantir contraste, foco visível, navegação por teclado, rótulos claros e uso adequado em diferentes tamanhos de tela.
8. **Confiança:** informar quando os dados foram salvos, quando há falha de conexão e quando uma operação não foi concluída.

### 3.2 Jornadas prioritárias

- **Acessar o sistema:** autenticar-se, receber feedback de sucesso ou erro e entender como recuperar o acesso.
- **Localizar um cliente:** pesquisar o órgão/entidade e consultar contatos, equipe NSI e informações relacionadas.
- **Registrar uma demanda:** preencher dados essenciais, salvar e confirmar que o registro ficou disponível.
- **Organizar um evento:** cadastrar dados, definir capacidade, divulgar informações e acompanhar inscrições.
- **Registrar presença:** localizar o evento e usar o mecanismo de QR Code com confirmação clara do resultado.
- **Consultar gestão:** aplicar filtros, interpretar indicadores e exportar os dados necessários.

### 3.3 Critérios de aceite de UX

- Todos os controles visíveis executam a ação indicada.
- Os módulos e abas abrem corretamente, sem sobreposição ou bloqueio de navegação.
- Formulários preservam os dados digitados quando apropriado e informam erros junto ao campo ou em mensagem compreensível.
- Estados de carregamento, sucesso, vazio e falha são distintos.
- A interface permanece utilizável em desktop e em larguras menores.
- Tabelas e gráficos apresentam rótulos, unidades, filtros e totais coerentes.
- Ações destrutivas solicitam confirmação e deixam claro o que será removido.
- O usuário consegue sair da sessão e entende quando precisa autenticar-se novamente.

---

## 4. Interface do usuário (UI)

A UI é a camada visual e interativa que apresenta os recursos do PRGD. A identidade gráfica deve apoiar a leitura, não competir com o conteúdo.

### 4.1 Diretrizes visuais

- **Hierarquia:** destacar título da página, seção, ação principal e estado do sistema em ordem visual clara.
- **Cores:** usar cores institucionais de forma consistente e reservar cores de alerta para estados que realmente exijam atenção.
- **Tipografia:** priorizar legibilidade, tamanhos adequados e contraste entre títulos, rótulos e conteúdo.
- **Componentes:** padronizar botões, campos, tabelas, cartões, modais, abas e mensagens.
- **Densidade:** evitar telas excessivamente carregadas; agrupar campos por assunto e dividir formulários longos em seções.
- **Responsividade:** adaptar tabelas, painéis e formulários sem ocultar ações essenciais.
- **Acessibilidade:** não comunicar estado apenas por cor; combinar cor com texto, ícone ou rótulo.

### 4.2 Pontos de atenção para validação visual

- Conferir legibilidade em resoluções menores e zoom do navegador.
- Evitar textos cortados, ícones sem rótulo quando a função não for óbvia e botões muito próximos.
- Garantir consistência de espaçamento, alinhamento e tamanho dos componentes.
- Validar estados de foco, hover, desabilitado, carregamento e erro.
- Verificar que gráficos e tabelas não distorçam ou ocultem dados importantes.

---

## 5. Novidades documentadas da versão v40.0

1. **Identidade visual e tela inicial:** atualização do título de login para “Portal de Relacionamento do Governo Digital”.
2. **Módulo de clientes:** remoção da referência “TIC” dos campos de responsável e e-mail e suporte à equipe NSI com três integrantes (nome, e-mail e telefone).
3. **Auditoria padronizada:** inclusão de metadados de rastreabilidade de criação e modificação nos módulos abrangidos.
4. **Eventos e inscrições:** nomenclatura do botão ajustada para “Inscrições”, correção informada do QR Code de presença e sincronização dos inscritos com o dashboard analítico.

> As novidades acima são as alterações descritas para a versão. A abrangência real da auditoria, o comportamento do QR Code e a sincronização devem ser verificados por testes funcionais e inspeção das regras/dados.

---

## 6. Requisitos não funcionais

### 6.1 Segurança e controle de acesso

- Utilizar Firebase Authentication para autenticação.
- Aplicar o princípio do menor privilégio.
- Validar autorização no Firestore Security Rules, não apenas na interface.
- Restringir gravação e exclusão de registros críticos a perfis autorizados, conforme matriz de permissões aprovada.
- Não armazenar senhas em documentos da aplicação nem expor segredos no front-end.
- Revisar regras com testes positivos e negativos para cada perfil.

### 6.2 Integridade e consistência

- Operações que alteram vagas devem impedir ultrapassar a capacidade definida, inclusive diante de acessos simultâneos.
- Indicadores devem derivar de dados consistentes e documentar filtros e critérios de contagem.
- Auditoria deve registrar autor e data/hora de forma confiável, com proteção contra adulteração por usuários comuns.
- Exclusões e alterações críticas devem ter comportamento definido e rastreável.

### 6.3 Disponibilidade e desempenho

- A aplicação deve apresentar estados claros durante carregamento, sincronização e falha de conexão.
- Consultas devem utilizar filtros e índices adequados ao volume esperado.
- O uso de listeners/snapshots deve ser seletivo, evitando consultas desnecessárias e custos excessivos.
- Definir metas de desempenho e disponibilidade a partir de testes e do perfil real de uso.

### 6.4 Privacidade e governança

- Coletar apenas dados necessários à finalidade institucional.
- Definir responsáveis, perfis de acesso, retenção, descarte e tratamento de incidentes.
- Evitar expor contatos pessoais em relatórios ou telas a usuários sem necessidade funcional.
- Avaliar a base legal e os procedimentos de tratamento de dados pessoais conforme a governança da ATI-PE.

---

## 7. Arquitetura e pilha tecnológica informadas

| Camada | Tecnologia / uso informado |
|---|---|
| Interface | HTML5, Tailwind CSS via CDN e Font Awesome |
| Lógica cliente | JavaScript ES6+ com módulos nativos |
| Indicadores | Chart.js |
| QR Code | QRCode.js |
| Exportação | CSV customizável |
| Autenticação | Firebase Authentication, SDK modular v10+ |
| Persistência | Cloud Firestore (NoSQL) |
| Hospedagem | Firebase Hosting |
| Segurança de dados | Firestore Security Rules |

**Atenção técnica:** Firestore é um banco NoSQL com sincronização por listeners e suporte a operações atômicas; não deve ser descrito como “tempo real” sem considerar a implementação, as condições de rede, as regras e o comportamento da interface. “Persistência em memória” e controle de sessão devem ser confirmados na configuração efetiva do SDK.

---

## 8. Publicação e implantação

Para publicar a hospedagem e as regras do Firestore, após revisar o projeto Firebase, autenticação, configuração e regras:

```bash
firebase deploy --only hosting,firestore:rules
```

### Checklist antes do deploy

- [ ] Confirmar o projeto Firebase de destino.
- [ ] Revisar as regras do Firestore e executar testes de autorização.
- [ ] Validar login, recuperação de senha, sessão e saída.
- [ ] Testar CRUD e permissões em todos os módulos.
- [ ] Testar limite de vagas com inscrições simultâneas.
- [ ] Validar QR Code e consistência entre inscrições e dashboard.
- [ ] Conferir exportações CSV, filtros e codificação dos arquivos.
- [ ] Verificar logs, mensagens de erro e experiência em dispositivos/tamanhos distintos.
- [ ] Registrar versão, data, responsável e plano de retorno.

---

## 9. Matriz resumida de escopo

| Dentro do escopo | Fora do escopo / não presumido |
|---|---|
| Relacionamento institucional e cadastro de clientes | Substituição de sistemas corporativos oficiais |
| Equipe NSI de até três membros por cliente | Diretório corporativo ou sincronização automática não especificada |
| Demandas e acompanhamento conforme fluxos existentes | ITSM completo ou gestão integral de processos |
| Eventos, inscrições, capacidade e presença por QR Code | Pagamentos ou bilheteria financeira |
| Locais, auditórios e fornecedores de TIC | Contratação, compras ou gestão contratual integral |
| Auditoria e relatórios/CSV conforme implementação | Garantia de conformidade sem governança e validação |
| Autenticação e regras de acesso configuradas | Acesso irrestrito ou autorização baseada somente na interface |
| Mídia até o limite informado de 500 KB, sujeito a validação | Repositório de arquivos de grande volume |

---

## 10. Riscos e decisões que precisam de validação

- **Matriz de perfis:** documentar quem pode visualizar, criar, editar e excluir cada tipo de registro.
- **Auditoria:** definir quais campos são registrados, se há histórico de versões e como se impede alteração indevida.
- **Inscrições concorrentes:** comprovar por testes que transações e regras impedem exceder a capacidade.
- **Sessões:** confirmar o comportamento de persistência e expiração em cada navegador/dispositivo.
- **Limite de mídia:** verificar se 500 KB é aplicado no cliente e/ou servidor e quais formatos são aceitos.
- **Relatórios:** documentar filtros, fórmulas e critérios de consistência dos indicadores.
- **LGPD:** confirmar finalidade, necessidade, retenção, acesso e procedimentos de resposta a incidentes.
- **Backup e recuperação:** estabelecer rotina, responsáveis, RPO/RTO e teste periódico de restauração.

---

## 11. Glossário

- **ATI-PE:** Agência Estadual de Tecnologia da Informação de Pernambuco.
- **PRGD:** Portal de Relacionamento do Governo Digital.
- **NSI:** Núcleo/Equipe de relacionamento conforme nomenclatura adotada pela ATI-PE.
- **UX:** experiência do usuário — como as pessoas compreendem e realizam tarefas.
- **UI:** interface do usuário — elementos visuais e controles com os quais interagem.
- **SDD:** Specification-Driven Development — desenvolvimento orientado por especificações.
- **CSV:** formato textual tabular para intercâmbio de dados.
- **Firestore Security Rules:** regras de autorização aplicadas pelo Firebase/Firestore.

---

## 12. Orientação de manutenção deste README

Atualize este documento quando houver alteração aprovada de requisitos, fluxos, perfis, arquitetura ou limites do produto. Diferencie sempre:

- **Implementado e testado** — comprovado por código e testes.
- **Implementado, ainda não validado** — presente, mas sem evidência suficiente de aceite.
- **Planejado** — aprovado para evolução, ainda não entregue.
- **Fora de escopo** — não será atendido pela versão, salvo mudança formal.

**Regra de ouro:** documentar o comportamento real da aplicação, evitando transformar intenção, hipótese ou requisito desejado em garantia técnica.
