# PRGD v23.0 — CLOUD DETALHADO

Versão evolutiva da PRGD v22.0. **A autenticação existente foi preservada**: Firebase Authentication, criação de usuários pelo fluxo atual e persistência de sessão não foram redesenhados.

## Principais melhorias

- Edição estruturada dos módulos, sem transformar tudo em campos de texto genéricos.
- Locais de eventos com opções marcáveis para estacionamento, climatização, som/PA, mobiliário, palco/iluminação, cozinha/cafeteria e estandes.
- Banheiros e acessibilidade com Sim/Não e campo **Outros**.
- Fornecedores com categorias e faixas de valor selecionáveis, além dos campos detalhados já existentes.
- Eventos com ficha completa, imagem de card por URL, texto de divulgação, link de inscrição, link de divulgação, local, categoria, contatos, limite de vagas e status.
- Grupos de usuários no Firestore (`grupos`).
- Usuários podem pertencer a vários grupos.
- Eventos podem ser públicos para usuários autenticados ou restritos a grupos.
- Inscrição interna no evento com controle de vagas.
- Comprovante visual de inscrição com código.
- Cancelamento de inscrição.
- Contador de vagas/inscritos.
- Todos os cards continuam abrindo o detalhamento e edição administrativa.
- Regras Firestore específicas para grupos, eventos e inscrições.

## Publicação

1. No console do Firebase, mantenha o provedor **Email/Password** habilitado.
2. Não altere a configuração de autenticação usada pela v22.
3. Substitua os arquivos publicados pelos desta versão.
4. Publique Hosting + regras:

```bash
firebase deploy --only hosting,firestore:rules
```

## Modelo de dados adicional

### `grupos/{id}`
- `nome`
- `descricao`
- `ativo`
- `criadoEm`

### `usuarios/{UID}`
Além dos campos existentes, pode possuir:
- `grupos: ["GRP-..."]`

### `eventos/{id}`
Campos novos/recomendados:
- `eventoPublico`
- `gruposPermitidos`
- `limiteVagas`
- `inscritosCount`
- `linkInscricao`
- `linkDivulgacao`
- `imagemCard`
- `textoCard`
- `categoria`
- `localEvento`
- `contatoEvento`
- `status`

### `inscricoes/{eventoId_UID}`
- `eventId`
- `uid`
- `nome`
- `email`
- `eventoTitulo`
- `inscritoEm`

## Sugestões para próxima evolução

1. Gerador automático de card em formato Instagram/WhatsApp/LinkedIn a partir dos dados do evento.
2. Exportação da lista de inscritos para Excel/CSV pelo administrador.
3. Lista de presença com QR Code para cada inscrição.
4. Certificado automático após o evento.
5. Busca e filtros avançados em Locais e Fornecedores.
6. Histórico de alterações dos cadastros (quem alterou, quando e o que mudou).
7. Galeria de fotos dos locais e dos eventos usando Firebase Storage.
8. Workflow de aprovação/publicação de eventos antes de ficarem visíveis aos grupos.
