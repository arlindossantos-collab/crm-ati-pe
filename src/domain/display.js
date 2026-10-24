// Formatação de leitura; nunca transforma os valores persistidos.
const ROTULOS_CADASTRO = {
  id: "Referência do cadastro",
  uid: "Identificador da conta",
  firestoreId: "Referência do registro",
  nome: "Nome",
  titulo: "Título",
  descricao: "Descrição",
  sigla: "Sigla",
  categoria: "Categoria",
  razaoSocial: "Razão social",
  nomeFantasia: "Nome fantasia",
  cnpj: "CNPJ",
  cpf: "CPF",
  produtoServicoPrincipal: "Produto ou serviço principal",
  servicoPrincipal: "Serviço principal",
  email: "E-mail",
  emailInstitucional: "E-mail institucional",
  telefone: "Telefone",
  telefoneFixo: "Telefone fixo",
  endereco: "Endereço",
  geolocalizacao: "Coordenadas",
  fotoFachada: "Imagem da fachada",
  valorContrato: "Valor do contrato",
  capacidade: "Capacidade",
  area: "Área",
  recursos: "Recursos disponíveis",
  tipoLocacao: "Tipo de locação",
  valorAluguel: "Valor do aluguel",
  periodicidadeLocacao: "Periodicidade da locação",
  contatoResponsavel: "Contato responsável",
  tituloEvento: "Título do evento",
  eventoTitulo: "Evento",
  tipoEvento: "Tipo de evento",
  palestrante: "Palestrante",
  localId: "Local do evento",
  localEvento: "Local informado",
  eventoPublico: "Evento público",
  status: "Situação",
  dataInicio: "Data de início",
  dataFim: "Data de término",
  horaInicio: "Horário de início",
  horaFim: "Horário de término",
  modeloInscricao: "Modelo de inscrição",
  inscricoesAbertas: "Inscrições abertas",
  inscricaoInicio: "Abertura das inscrições",
  inscricaoFim: "Encerramento das inscrições",
  limiteVagas: "Limite de vagas",
  inscritosCount: "Contador de inscrições",
  gruposPermitidos: "Grupos autorizados",
  grupos: "Grupos",
  orgaosElegiveis: "Órgãos elegíveis",
  protocolo: "Protocolo",
  eventId: "Evento",
  orgaoId: "Órgão",
  setorId: "Setor",
  participanteId: "Participante",
  participanteNome: "Participante",
  situacao: "Situação",
  ativo: "Cadastro ativo",
  excluido: "Cadastro excluído",
  criadoEm: "Criado em",
  atualizadoEm: "Atualizado em",
  criadoPor: "Cadastrado por",
  editadoPor: "Atualizado por",
  criadoPorUid: "Conta que cadastrou",
  editadoPorUid: "Conta que atualizou",
  autorUid: "Conta do responsável",
  autorNome: "Responsável",
  registroId: "Referência do registro",
  registroNome: "Registro",
  acao: "Ação",
  ultimaAuditoriaId: "Referência da última alteração",
  ultimaInscricaoId: "Referência da última inscrição",
  perfilAtualizadoEm: "Perfil atualizado em",
  registradoEm: "Registrado em",
  validadeCadastro: "Validade do cadastro",
  perfil: "Perfil de acesso",
  tipoUsuario: "Tipo de usuário",
  modulosPermitidos: "Módulos autorizados",
  acessoInstitucional: "Vínculo institucional",
  colaboradorId: "Colaborador vinculado",
  usuarioUid: "Conta vinculada",
  responsaveisGrgdIds: "Responsáveis GRGD",
  responsaveisGrgdSnapshot: "Responsáveis registrados",
  responsaveisGrgdLegados: "Responsáveis anteriores",
  historicoAcoes: "Histórico de ações",
  versoesAnteriores: "Versões anteriores",
  corCard: "Cor do cartão",
  custoLocacaoPrevisto: "Custo previsto de locação",
  inicio: "Início",
  fim: "Validade até",
  revisao: "Próxima revisão",
  funcoesContato: "Funções de contato",
  revisaoCadastro: "Revisão cadastral",
  matricula: "Matrícula",
  observacoes: "Observações",
};
const DATAS_CADASTRO = new Set([
  "criadoEm",
  "atualizadoEm",
  "perfilAtualizadoEm",
  "registradoEm",
  "dataInicio",
  "dataFim",
  "dataLimite",
  "eventoData",
  "inscricaoInicio",
  "inscricaoFim",
  "validadeCadastro",
  "inicio",
  "fim",
  "revisao",
]);
const REFERENCIAS_TECNICAS = new Set([
  "id",
  "uid",
  "firestoreId",
  "criadoPorUid",
  "editadoPorUid",
  "autorUid",
  "usuarioUid",
  "registradoPorUid",
  "titularUid",
  "ultimaAuditoriaId",
  "ultimaInscricaoId",
  "fotoPerfil",
]);
export function rotuloCampo(chave) {
  if (Object.hasOwn(ROTULOS_CADASTRO, chave)) return ROTULOS_CADASTRO[chave];
  const texto = String(chave)
    .replace(/([a-zà-ÿ0-9])([A-ZÀ-Ý])/g, "$1 $2")
    .replace(/[_\.\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return texto
    ? texto.charAt(0).toLocaleUpperCase("pt-BR") + texto.slice(1)
    : "Campo adicional";
}
export function referenciaTecnica(chave) {
  return REFERENCIAS_TECNICAS.has(chave);
}
export function valorDeData(chave, valor) {
  return (
    DATAS_CADASTRO.has(chave) ||
    (valor !== null &&
      typeof valor === "object" &&
      (typeof valor.toDate === "function" ||
        typeof valor.seconds === "number" ||
        valor instanceof Date))
  );
}
export function formatarDataExibicao(valor, comHora = false) {
  if (valor === null || valor === undefined || valor === "")
    return "Não informado";
  try {
    if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      const data = new Date(valor + "T12:00:00Z");
      if (
        !Number.isFinite(data.getTime()) ||
        data.toISOString().slice(0, 10) !== valor
      )
        return "Data a conferir";
      return (
        valor.slice(8, 10) + "/" + valor.slice(5, 7) + "/" + valor.slice(0, 4)
      );
    }
    if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}T/.test(valor)) {
      const dia = valor.slice(0, 10);
      const verificada = new Date(dia + "T12:00:00Z");
      if (
        !Number.isFinite(verificada.getTime()) ||
        verificada.toISOString().slice(0, 10) !== dia
      )
        return "Data a conferir";
    }
    const data = valor?.toDate
      ? valor.toDate()
      : new Date(
          typeof valor?.seconds === "number" ? valor.seconds * 1000 : valor,
        );
    if (!Number.isFinite(data.getTime())) return "Data a conferir";
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Recife",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      ...(comHora ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
    }).format(data);
  } catch {
    return "Data a conferir";
  }
}
export function nomeSituacaoInscricao(valor, modelo) {
  if (modelo !== "institucional-v1")
    return "Fluxo anterior — situação não confirmada";
  return valor === "confirmada"
    ? "Confirmada"
    : valor === "cancelada"
      ? "Cancelada"
      : "Situação não informada";
}

export function dataHoraLocalFormulario(valor) {
  if (valor === null || valor === undefined || valor === "") return "";
  if (formatarDataExibicao(valor) === "Data a conferir") return "";
  const data = new Date(valor);
  if (!Number.isFinite(data.getTime())) return "";
  return new Date(data.getTime() - data.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
