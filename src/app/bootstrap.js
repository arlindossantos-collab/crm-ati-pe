// Responsabilidade: app/bootstrap. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "./state.js";

import { vinculoEventoLocal, idLocal } from "../modules/locais/index.js";
import {
  initializeApp,
  getFirestore,
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "../services/firebase.js";
import { bindInstitutionalEvents } from "./listeners-institutional.js";
import { bindPeopleEvents } from "./listeners-people.js";
import { bindMasks } from "./listeners-masks.js";
import { bindCalendarEvents } from "./listeners-calendar.js";
import { bindFormEvents } from "./listeners-forms.js";
import { bindApplicationEvents } from "./listeners-navigation.js";
import { bindAuthentication } from "./listeners-auth.js";
import { firebaseConfiguration } from "../config/firebase.js";

export function bootstrap() {
  window.__PRGD_MODULE_OK = true;
  console.info("PRGD v0.17.1: legibilidade de cadastros e interface");
  prgdState.firebaseConfig = firebaseConfiguration();
  prgdState.app = initializeApp(prgdState.firebaseConfig);
  prgdState.db = getFirestore(prgdState.app);
  prgdState.auth = getAuth(prgdState.app);
  prgdState.persistenciaSessao = setPersistence(
    prgdState.auth,
    browserLocalPersistence,
  );
  prgdState.persistenciaSessao.catch((err) =>
    console.warn("Não foi possível configurar a persistência da sessão.", err),
  );
  prgdState.currentUser = null;
  prgdState.restaurandoSessao = true;
  prgdState.exclusaoPendente = null;
  prgdState.exclusaoEmCurso = false;
  prgdState.historicoRegistros = [];
  prgdState.historicoUltimo = null;
  prgdState.historicoCarregando = false;
  prgdState.historicoVersao = 0;
  prgdState.versaoSessao = 0;
  prgdState.dbData = {
    demandas: [],
    eventos: [],
    locais: [],
    orgaos: [],
    fornecedores: [],
    bases: [],
    usuarios: [],
    grupos: [],
    inscricoes: [],
    setores: [],
    colaboradores: [],
    auditoriaOrgao: [],
    contatosColaboradores: [],
  };
  prgdState.abaAtual = "dashboard";
  prgdState.secaoColaboradores = "cadastros";
  prgdState.novoAcessoColaborador = null;
  prgdState.filtroEventoAtual = "futuros";
  prgdState.inscricoesRelatorioEstado = "aguardando";
  prgdState.filtroTagAtual = "";
  prgdState.filtroTipoUsuarioAtual = "";
  prgdState.filtroOrgaoUsuarioAtual = "";
  prgdState.filtroSetorUsuarioAtual = "";
  prgdState.filtroGestorModalidadeAtual = "";
  prgdState.filtroSituacaoClienteAtual = "";
  prgdState.filtroDemandaStatusAtual = "";
  prgdState.filtroDemandaPrioAtual = "";
  prgdState.ordenacaoDemandasAtual = "recente";
  prgdState.visaoDemandasAtual = "tabela";
  prgdState.dataMensalAtual = new Date();
  prgdState.buscaDemandasVal = "";
  prgdState.buscaEventosVal = "";
  prgdState.buscaLocaisVal = "";
  prgdState.buscaClientesVal = "";
  prgdState.buscaFornecedoresVal = "";
  prgdState.buscaBasesVal = "";
  prgdState.buscaUsuariosVal = "";
  prgdState.MÓDULOS_SISTEMA = [
    { id: "meu_orgao", nome: "Meu órgão" },
    { id: "colaboradores", nome: "Colaboradores" },
    { id: "inscricoes_orgao", nome: "Inscrições do órgão" },
    { id: "auditoria_orgao", nome: "Auditoria do órgão" },
    { id: "dashboard", nome: "Dashboard" },
    { id: "demandas", nome: "Demandas" },
    { id: "clientes", nome: "Clientes" },
    { id: "eventos", nome: "Eventos" },
    { id: "locais", nome: "Locais" },
    { id: "fornecedores", nome: "Fornecedores" },
    { id: "usuarios", nome: "Usuários" },
    { id: "bases", nome: "Bases" },
  ];
  prgdState.PAPEIS_INSTITUCIONAIS = {
    grgd: {
      nome: "Equipe GRGD",
      acoes: [
        "demandas.consultar",
        "demandas.criar",
        "demandas.editar",
        "clientes.consultar",
        "clientes.criar",
        "clientes.editar",
        "eventos.consultar",
        "eventos.criar",
        "eventos.editar",
        "locais.consultar",
        "locais.criar",
        "locais.editar",
        "fornecedores.consultar",
        "fornecedores.criar",
        "fornecedores.editar",
        "bases.consultar",
        "bases.criar",
        "bases.editar",
        "relatorios.consultar",
      ],
    },
    gestor_nsi: {
      nome: "Gestor de NSI",
      acoes: [
        "orgao.consultar",
        "participantes.consultar",
        "participantes.cadastrar",
        "participantes.editar",
        "eventos.consultar",
        "inscricoes.consultar",
        "inscricoes.criar",
        "inscricoes.cancelar",
        "comprovantes.consultar",
      ],
    },
    substituto: {
      nome: "Substituto do gestor",
      acoes: [
        "orgao.consultar",
        "participantes.consultar",
        "participantes.cadastrar",
        "participantes.editar",
        "eventos.consultar",
        "inscricoes.consultar",
        "inscricoes.criar",
        "inscricoes.cancelar",
        "comprovantes.consultar",
      ],
    },
    auditoria: {
      nome: "Auditoria autorizada",
      acoes: ["auditoria.consultar", "relatorios.consultar"],
    },
  };
  prgdState.MODULOS_PORTAL = [
    "meu_orgao",
    "colaboradores",
    "inscricoes_orgao",
    "auditoria_orgao",
  ];
  prgdState.ACAO_COLECAO = {
    orgaos: "clientes",
    demandas: "demandas",
    eventos: "eventos",
    locais: "locais",
    fornecedores: "fornecedores",
    bases: "bases",
    usuarios: "usuarios",
    grupos: "usuarios",
    setores: "usuarios",
  };
  prgdState.acessoTimer = null;
  prgdState.portalErros = {};
  prgdState.portalCarregando = {};
  prgdState.colaboradorEmEdicao = null;
  prgdState.eventoInscricaoId = "";
  prgdState.portalOperacao = false;
  prgdState.comprovanteAtualId = "";
  prgdState.eventosPortalFontes = {};
  prgdState.MODELO_INSCRICAO = "institucional-v1";
  bindInstitutionalEvents();
  prgdState.FUNCOES_CONTATO = {
    orgao: {
      nome: "Gestor do órgão",
      nomeCampo: "gestorOrgao",
      email: "emailGestorOrgao",
      telefone: "telGestorOrgao",
      cargo: "cargoGestorOrgao",
    },
    nsi: {
      nome: "NSI",
      nomeCampo: "gestorNsi",
      email: "emailGestorNsi",
      telefone: "telGestorNsi",
    },
    telematica: {
      nome: "Telemática",
      nomeCampo: "gestorTelematica",
      email: "emailGestorTelematica",
      telefone: "telGestorTelematica",
    },
    si: {
      nome: "SI",
      nomeCampo: "gestorSi",
      email: "emailGestorSi",
      telefone: "telGestorSi",
    },
    sei: {
      nome: "SEI",
      nomeCampo: "gestorSei",
      email: "emailGestorSei",
      telefone: "telGestorSei",
    },
    focal: {
      nome: "Ponto focal / substituto",
      nomeCampo: "pontoFocalNome",
      email: "pontoFocalEmail",
      telefone: "pontoFocalTel",
      cargo: "pontoFocalCargo",
    },
  };
  prgdState.ESTADOS_ACESSO = {
    liberado: "Acesso liberado",
    inativo: "Cadastro inativo",
    excluido: "Excluído do cadastro",
    pendente: "Aguardando aprovação",
    suspenso: "Vínculo suspenso",
    vencido: "Vínculo vencido",
    revisao: "Revisão do vínculo pendente",
    futuro: "Vínculo ainda não iniciou",
    sem_modulos: "Sem ações ou módulos liberados",
    invalido: "Vínculo precisa de validação",
    titular: "Sujeito à validação do titular",
  };
  prgdState.revisaoUsuarioResolver = null;
  prgdState.vinculoColaboradorAtual = null;
  prgdState.vinculoColaboradorOcupado = false;
  bindPeopleEvents();
  prgdState.COLECOES_AUDITADAS = [
    "setores",
    "usuarios",
    "orgaos",
    "demandas",
    "eventos",
    "locais",
    "fornecedores",
    "bases",
    "grupos",
    "inscricoes",
  ];
  prgdState.METADADOS_AUDITORIA = [
    "ultimaAuditoriaId",
    "criadoEm",
    "criadoPor",
    "criadoPorUid",
    "atualizadoEm",
    "editadoPor",
    "editadoPorUid",
    "perfilAtualizadoEm",
  ];
  prgdState.NOMES_COLECOES = {
    colaboradores: "Colaboradores",
    usuarios: "Usuários",
    orgaos: "Clientes",
    demandas: "Demandas",
    eventos: "Eventos",
    locais: "Locais",
    fornecedores: "Fornecedores",
    bases: "Bases",
    grupos: "Grupos",
    inscricoes: "Inscrições",
    perfilPrivado: "Perfil pessoal",
    autenticacao: "Conta de acesso",
  };
  prgdState.NOMES_ACOES = {
    criar: "Criou",
    editar: "Editou",
    excluir: "Excluiu",
    excluir_usuario: "Excluiu do cadastro ativo",
    alterar_senha: "Alterou a própria senha (valor não registrado)",
    inscrever: "Inscreveu colaborador",
    cancelar_inscricao: "Cancelou inscrição",
  };
  prgdState.cadastroUsuarioEmAndamento = false;
  prgdState.dadosPessoaisPerfil = null;
  prgdState.identidadesUsuarios = [];
  prgdState.perfilEmEdicao = null;
  prgdState.salvandoSenhaPerfil = false;
  prgdState.LIMITE_FOTO_PERFIL = 45000;
  prgdState.CORES_CARD_DEMANDA = [
    { id: "bg-blue-50 border-blue-200 text-blue-900", nome: "Azul Claro" },
    {
      id: "bg-emerald-50 border-emerald-200 text-emerald-900",
      nome: "Verde Claro",
    },
    {
      id: "bg-amber-50 border-amber-200 text-amber-900",
      nome: "Amarelo Claro",
    },
    {
      id: "bg-purple-50 border-purple-200 text-purple-900",
      nome: "Roxo Claro",
    },
    { id: "bg-rose-50 border-rose-200 text-rose-900", nome: "Rosa Claro" },
    { id: "bg-white border-slate-200 text-slate-900", nome: "Padrão Branco" },
  ];
  prgdState.TAGS_DISPONIVEIS = [
    { nome: "Internos ATI", cor: "bg-blue-100 text-blue-900 border-blue-300" },
    {
      nome: "Externos",
      cor: "bg-purple-100 text-purple-900 border-purple-300",
    },
    {
      nome: "Terceirizados",
      cor: "bg-amber-100 text-amber-900 border-amber-300",
    },
    {
      nome: "Fornecedores",
      cor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    },
    {
      nome: "Gerentes",
      cor: "bg-indigo-100 text-indigo-900 border-indigo-300",
    },
    { nome: "Coordenadores", cor: "bg-cyan-100 text-cyan-900 border-cyan-300" },
    { nome: "Diretores", cor: "bg-rose-100 text-rose-900 border-rose-300" },
    { nome: "Convidados", cor: "bg-pink-100 text-pink-900 border-pink-300" },
  ];
  bindMasks();
  prgdState.snapshotUnsubs = [];
  prgdState.eventosCacheMap = {};
  bindCalendarEvents();
  prgdState.localSelecionadoId = "";
  prgdState.agendaLocaisEstado = "aguardando";
  prgdState.consultaLocalAtiva = false;
  prgdState.eventosDoLocal = (l) =>
    prgdState.dbData.eventos.filter(
      (e) => vinculoEventoLocal(e).id === idLocal(l),
    );
  prgdState.chartCatInstance = null;
  prgdState.chartStatusInstance = null;
  prgdState.chartTiposInstance = null;
  bindFormEvents();
  bindApplicationEvents();
  bindAuthentication();
}
