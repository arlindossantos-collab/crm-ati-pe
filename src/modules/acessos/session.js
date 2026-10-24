// Responsabilidade: modules/acessos/session. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "../../app/state.js";
import {
  limparOperacoesInstitucionais,
  mensagemPortal,
} from "../colaboradores/index.js";
import { cancelarRevisaoUsuario } from "./accounts.js";
import { limparSenhasPerfil } from "../perfil/index.js";
import { traduzirErroSistema } from "../../shared/presentation.js";
import { pararSnapshots } from "../../services/subscriptions.js";
import { renderizarTudo } from "../../app/navigation.js";
import { limparConsultaEventos } from "../eventos/index.js";
import { cancelarExclusao } from "../../app/forms.js";
import {
  signInWithEmailAndPassword,
  signOut,
} from "../../services/firebase.js";

export function finalizarRestauracao() {
  prgdState.restaurandoSessao = false;
  document.getElementById("sessao-carregando")?.classList.add("hidden");
  verificarAutenticacaoObrigatoria();
}

export function verificarAutenticacaoObrigatoria() {
  const mainEl = document.getElementById("main-content");
  const loginModal = document.getElementById("modal-login");
  if (!prgdState.currentUser) {
    if (mainEl) mainEl.classList.add("hidden");
    if (loginModal)
      loginModal.classList.toggle("hidden", prgdState.restaurandoSessao);
  } else {
    if (mainEl) mainEl.classList.remove("hidden");
    if (loginModal) loginModal.classList.add("hidden");
  }
}

export async function fazerLoginLocal(e) {
  if (e?.preventDefault) e.preventDefault();
  const email = (document.getElementById("login-email")?.value || "")
    .trim()
    .toLowerCase();
  const senha = document.getElementById("login-senha")?.value || "";
  const msgEl = document.getElementById("login-msg");
  if (!email || !senha) {
    if (msgEl) {
      msgEl.textContent = "Informe e-mail e senha.";
      msgEl.className =
        "mt-4 p-3 rounded-lg text-xs font-medium bg-red-100 text-red-800 block";
    } else alert("Informe e-mail e senha.");
    return;
  }
  prgdState.persistenciaSessao
    .then(() => signInWithEmailAndPassword(prgdState.auth, email, senha))
    .catch((err) => {
      const txt = traduzirErroSistema(err);
      if (msgEl) {
        msgEl.textContent = txt;
        msgEl.className =
          "mt-4 p-3 rounded-lg text-xs font-medium bg-red-100 text-red-800 block";
      } else alert(txt);
    });
}

export function limparDadosSessao() {
  if (prgdState.acessoTimer) clearTimeout(prgdState.acessoTimer);
  prgdState.acessoTimer = null;
  prgdState.portalErros = {};
  prgdState.portalCarregando = {};
  prgdState.inscricoesRelatorioEstado = "aguardando";
  limparOperacoesInstitucionais();
  prgdState.novoAcessoColaborador = null;
  prgdState.secaoColaboradores = "cadastros";
  prgdState.eventosPortalFontes = {};
  mensagemPortal("");
  cancelarRevisaoUsuario();
  document.getElementById("admin-colab-lista").innerHTML = "";
  document.getElementById("admin-colab-orgao").innerHTML = "";
  document.getElementById("admin-colab-setor").innerHTML = "";
  document.getElementById("admin-colab-status").textContent = "";
  document.getElementById("usuarios-indicadores").innerHTML = "";
  document.getElementById("colaboradores-indicadores").innerHTML = "";
  document.getElementById("colaboradores-por-orgao").innerHTML = "";
  document.getElementById("painel-identificacao").textContent = "";
  [
    "filtro-perfil-usuario",
    "filtro-acesso-usuario",
    "admin-colab-busca",
    "admin-colab-orgao",
    "admin-colab-setor",
    "admin-colab-situacao",
    "admin-colab-conta",
  ].forEach((id) => (document.getElementById(id).value = ""));
  document.getElementById("modal-vincular-colaborador").classList.add("hidden");
  document.getElementById("vincular-lista").innerHTML = "";
  document.getElementById("vincular-contexto").textContent = "";
  document.getElementById("vincular-busca").value = "";
  document.getElementById("vincular-erro").textContent = "";
  document.getElementById("vincular-confirmacao").checked = false;
  prgdState.vinculoColaboradorAtual = null;
  prgdState.currentUser = null;
  document.body?.setAttribute("data-admin", "false");
  cancelarExclusao(true);
  ++prgdState.historicoVersao;
  prgdState.historicoRegistros = [];
  prgdState.historicoUltimo = null;
  prgdState.historicoCarregando = false;
  document.getElementById("historico-registros").innerHTML = "";
  document.getElementById("historico-busca").value = "";
  document.getElementById("historico-mensagem").textContent = "";
  document.getElementById("modal-historico-alteracoes").classList.add("hidden");
  prgdState.localSelecionadoId = "";
  prgdState.agendaLocaisEstado = "aguardando";
  prgdState.consultaLocalAtiva = false;
  [
    "local-filtro-tipo",
    "local-filtro-capacidade",
    "local-filtro-recurso",
    "disponibilidade-local",
    "disponibilidade-data",
    "disponibilidade-inicio",
    "disponibilidade-fim",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("disponibilidade-resultado").textContent = "";
  prgdState.dadosPessoaisPerfil = null;
  prgdState.identidadesUsuarios = [];
  prgdState.perfilEmEdicao = null;
  limparSenhasPerfil();
  [
    "perfil-nome",
    "perfil-email",
    "perfil-telefone",
    "perfil-endereco",
    "perfil-foto",
  ].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("perfil-foto-preview").innerHTML = "";
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
  prgdState.eventosCacheMap = {};
  limparConsultaEventos();
  prgdState.buscaDemandasVal =
    prgdState.buscaEventosVal =
    prgdState.buscaLocaisVal =
    prgdState.buscaClientesVal =
    prgdState.buscaFornecedoresVal =
    prgdState.buscaBasesVal =
    prgdState.buscaUsuariosVal =
      "";
  prgdState.filtroTipoUsuarioAtual =
    prgdState.filtroTagAtual =
    prgdState.filtroOrgaoUsuarioAtual =
    prgdState.filtroSetorUsuarioAtual =
    prgdState.filtroGestorModalidadeAtual =
    prgdState.filtroSituacaoClienteAtual =
    prgdState.filtroDemandaStatusAtual =
    prgdState.filtroDemandaPrioAtual =
      "";
  [
    "busca-demandas",
    "busca-eventos",
    "busca-locais",
    "busca-clientes",
    "busca-fornecedores",
    "busca-bases",
    "busca-usuarios",
    "filtro-tipo-usuario",
    "filtro-tag-usuario",
    "filtro-setor-usuario",
    "filtro-orgao-usuario",
    "filtro-gestor-modalidade",
    "filtro-situacao-cliente",
    "filtro-demanda-status",
    "filtro-demanda-prio",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("main-content")?.classList.add("hidden");
  [
    "modal-colaborador",
    "modal-inscricao-institucional",
    "modal-comprovante",
    "modal-perfil",
    "modal-detalhes",
    "modal-observacoes",
    "modal-form-universal",
  ].forEach((id) => document.getElementById(id)?.classList.add("hidden"));
  [
    "detalhe-conteudo",
    "edit-campos-dinamicos",
    "form-univ-campos",
    "obs-historico-lista",
    "obs-demanda-titulo",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  });
  [
    "obs-demanda-id",
    "obs-novo-texto",
    "login-senha",
    "edit-colecao",
    "edit-doc-id",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  ["user-name-display", "user-role-display", "badge-perfil-acesso"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = "";
    },
  );
  renderizarTudo();
}

export async function bloquearSessao(mensagem) {
  ++prgdState.versaoSessao;
  pararSnapshots();
  limparDadosSessao();
  finalizarRestauracao();
  document.getElementById("modal-login")?.classList.remove("hidden");
  const msg = document.getElementById("login-msg");
  if (msg) {
    msg.textContent = mensagem;
    msg.className =
      "mt-4 p-3 rounded-lg text-xs font-medium bg-red-100 text-red-800 block";
  }
  await signOut(prgdState.auth).catch(() => {});
}
