// Responsabilidade: app/navigation. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "./state.js";
import {
  ehAdministrador,
  podeAcao,
  podeAlterarColecao,
  nomePerfilAcesso,
  nomeOrgaoUsuario,
  modulosDoUsuario,
} from "../modules/acessos/policies.js";
import {
  atualizarAreaPorPerfil,
  renderPortalInstitucional,
} from "../modules/portal/index.js";
import {
  renderGestaoSetores,
  salvarSetor,
} from "../modules/acessos/delegation.js";
import { mostrarSecaoColaboradores } from "../modules/colaboradores/index.js";
import {
  atualizarResumosUsuariosAbertos,
  preencherFiltrosUsuarios,
  renderUsuarios,
} from "../modules/acessos/accounts.js";
import {
  renderHistoricoAlteracoes,
  carregarHistoricoAlteracoes,
  abrirHistoricoAlteracoes,
} from "../modules/auditoria/index.js";
import { atualizarPainelInscricoesEvento } from "../modules/inscricoes/panel.js";
import {
  atualizarIdentidadeSessao,
  atualizarFormularioPerfil,
  limparSenhasPerfil,
  abrirMeuPerfil,
  selecionarFotoPerfil,
  removerFotoPerfil,
  salvarMeuPerfil,
  alterarMinhaSenha,
} from "../modules/perfil/index.js";
import {
  verificarAutenticacaoObrigatoria,
  fazerLoginLocal,
} from "../modules/acessos/session.js";
import { renderClientes } from "../modules/orgaos/index.js";
import {
  renderBases,
  renderFornecedores,
  renderGrupos,
  renderDashboardKPIs,
  renderCharts,
} from "../modules/apoio/index.js";
import {
  renderDemandas,
  salvarNovaObservacao,
} from "../modules/demandas/index.js";
import { baixarRelatorioInscricoes } from "../modules/inscricoes/reports.js";
import {
  limparConsultaEventos,
  renderEventos,
} from "../modules/eventos/index.js";
import {
  executarConsultaLocal,
  renderLocais,
} from "../modules/locais/index.js";
import {
  salvarEdicaoAdmin,
  abrirModalForm,
  salvarCadastroUniversal,
  cancelarExclusao,
  excluirRegistroUniversal,
  confirmarExclusao,
} from "./forms.js";
import { signOut } from "../services/firebase.js";

export function guardarNavegacao() {
  if (!prgdState.currentUser || prgdState.restaurandoSessao) return;
  try {
    sessionStorage.setItem(
      "prgd:navegacao:" + prgdState.currentUser.uid,
      JSON.stringify({
        aba: prgdState.abaAtual,
        visao: prgdState.visaoDemandasAtual,
        secaoColaboradores: prgdState.secaoColaboradores,
      }),
    );
  } catch (_) {}
}

export function restaurarNavegacao() {
  let salvo = {};
  try {
    salvo = JSON.parse(
      sessionStorage.getItem("prgd:navegacao:" + prgdState.currentUser.uid) ||
        "{}",
    );
  } catch (_) {}
  const permitidos = modulosDoUsuario();
  const aba = permitidos.includes(salvo?.aba) ? salvo.aba : permitidos[0] || "";
  prgdState.secaoColaboradores =
    salvo?.aba === "usuarios"
      ? "acessos"
      : ["cadastros", "acessos", "estrutura"].includes(
            salvo?.secaoColaboradores,
          )
        ? salvo.secaoColaboradores
        : "cadastros";
  const calendario = salvo?.visao === "calendario";
  document
    .getElementById(calendario ? "btn-visao-calendario" : "btn-visao-tabela")
    ?.click?.();
  mudarAba(aba);
}

export function nomeTipoUsuario(usuario) {
  return (
    { interno: "Interno - GRGD", externo: "Externo" }[usuario.tipoUsuario] ||
    "A definir"
  );
}

export function fecharModal(id) {
  if (id === "modal-confirmar-exclusao") {
    cancelarExclusao();
    return;
  }
  if (id === "modal-detalhes") {
    const painel = document.getElementById("painel-inscricoes-evento");
    if (painel) {
      painel.innerHTML = "";
      painel.removeAttribute?.("data-evento-id");
    }
  }
  document.getElementById(id).classList.add("hidden");
  if (id === "modal-perfil") {
    prgdState.perfilEmEdicao = null;
    limparSenhasPerfil();
    document.getElementById("perfil-foto").value = "";
  }
  if (id === "modal-form-universal")
    document.getElementById("form-univ-campos").innerHTML = "";
}

export function atualizarVisibilidadeAbas() {
  atualizarAreaPorPerfil();
  verificarAutenticacaoObrigatoria();
  document.body?.setAttribute("data-admin", String(ehAdministrador()));
  document
    .getElementById("detalhe-area-admin")
    ?.classList.toggle(
      "hidden",
      !podeAlterarColecao(document.getElementById("edit-colecao").value),
    );
  document.getElementById("btn-excluir-registro").disabled =
    !ehAdministrador() ||
    (document.getElementById("edit-colecao").value === "eventos" &&
      prgdState.dbData.eventos.some(
        (e) =>
          String(e.firestoreId || e.id) ===
            document.getElementById("edit-doc-id").value &&
          e.modeloInscricao === prgdState.MODELO_INSCRICAO,
      ));
  if (!ehAdministrador()) {
    document
      .getElementById("modal-historico-alteracoes")
      ?.classList.add("hidden");
    document.getElementById("historico-registros").innerHTML = "";
    cancelarExclusao(true);
  }
  if (!prgdState.currentUser) return;
  const isAdmin = ehAdministrador();
  const permitidos = modulosDoUsuario();

  prgdState.MÓDULOS_SISTEMA.forEach((mod) => {
    const btnTab = document.querySelector(`[data-tab="${mod.id}"]`);
    if (btnTab) {
      btnTab.classList.remove("hidden");
      btnTab.style.display = permitidos.includes(mod.id)
        ? "inline-flex"
        : "none";
    }
  });
  document.querySelectorAll(".btn-admin-only").forEach((btn) => {
    const pode = btn.dataset.acao
      ? podeAcao(...btn.dataset.acao.split("."))
      : isAdmin;
    btn.classList.toggle("hidden", !pode);
  });
  document
    .querySelectorAll(
      ".input-data-demanda, .select-diaselect-demanda, .select-modalidade-gestor, #obs-novo-texto",
    )
    .forEach((el) => {
      el.disabled = !podeAlterarColecao(
        el.matches?.(".select-modalidade-gestor") ? "orgaos" : "demandas",
      );
    });

  const badgePerfil = document.getElementById("badge-perfil-acesso");
  if (badgePerfil)
    badgePerfil.textContent =
      nomePerfilAcesso() + " | " + nomeOrgaoUsuario(prgdState.currentUser);

  if (!permitidos.includes(prgdState.abaAtual)) mudarAba(permitidos[0] || "");
  document
    .getElementById("aviso-sem-modulos")
    ?.classList.toggle("hidden", permitidos.length > 0);
}

export function mudarAba(aba) {
  if (aba === "usuarios" && ehAdministrador()) {
    aba = "colaboradores";
    prgdState.secaoColaboradores = "acessos";
  }
  if (aba && !modulosDoUsuario().includes(aba)) return;
  prgdState.abaAtual = aba;
  prgdState.MÓDULOS_SISTEMA.forEach((mod) => {
    const el = document.getElementById("aba-" + mod.id);
    const btn = document.querySelector(`[data-tab="${mod.id}"]`);
    if (el && mod.id !== "usuarios")
      el.classList.toggle("hidden", mod.id !== prgdState.abaAtual);
    if (btn) {
      btn.className =
        "nav-tab px-3.5 py-2 rounded-lg transition " +
        (mod.id === prgdState.abaAtual ? "tab-active" : "tab-inactive");
      if (mod.id === prgdState.abaAtual)
        btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    }
  });
  if (aba === "dashboard") renderCharts();
  if (aba === "demandas") renderDemandas();
  if (aba === "clientes") renderClientes();
  if (prgdState.MODULOS_PORTAL.includes(aba)) renderPortalInstitucional();
  if (aba === "eventos") renderEventos();
  if (aba === "locais") renderLocais();
  if (aba === "fornecedores") renderFornecedores();
  if (aba === "colaboradores" && ehAdministrador()) {
    renderGrupos();
    renderUsuarios();
    mostrarSecaoColaboradores(prgdState.secaoColaboradores, false);
  }
  if (aba === "bases") renderBases();
  atualizarAreaPorPerfil();
  guardarNavegacao();
}

export function renderizarTudo() {
  atualizarIdentidadeSessao();
  renderPortalInstitucional();
  renderGestaoSetores();
  renderUsuarios();
  renderClientes();
  renderBases();
  renderDemandas();
  renderEventos();
  renderLocais();
  renderFornecedores();
  renderDashboardKPIs();
  preencherSelectClientes();
  atualizarVisibilidadeAbas();
  preencherFiltrosUsuarios();
  renderGrupos();
  atualizarContadoresAbas();
  atualizarResumosUsuariosAbertos();
  if (prgdState.abaAtual === "dashboard") renderCharts();
}

export function atualizarContadoresAbas() {
  document.getElementById("cnt-tab-demandas").textContent =
    prgdState.dbData.demandas.length;
  document.getElementById("cnt-tab-clientes").textContent =
    prgdState.dbData.orgaos.length;
  document.getElementById("cnt-tab-eventos").textContent =
    prgdState.dbData.eventos.length;
  document.getElementById("cnt-tab-locais").textContent =
    prgdState.dbData.locais.length;
  document.getElementById("cnt-tab-fornecedores").textContent =
    prgdState.dbData.fornecedores.length;
  document.getElementById("cnt-tab-usuarios").textContent =
    prgdState.dbData.usuarios.filter((u) => u.excluido !== true).length;
  document.getElementById("cnt-tab-bases").textContent =
    prgdState.dbData.bases.length;
}

export function preencherSelectClientes() {
  document.querySelectorAll(".select-orgaos-dinamico").forEach((select) => {
    const valAtual = select.value;
    select.innerHTML = '<option value="">Selecione o Cliente / Órgão</option>';
    prgdState.dbData.orgaos.forEach((o) => {
      const opt = document.createElement("option");
      opt.value = o.sigla || o.id;
      opt.textContent = (o.sigla || o.id) + " - " + (o.nome || "");
      select.appendChild(opt);
    });
    if (valAtual) select.value = valAtual;
  });
}

export function configurarInterface() {
  const byId = (id) => document.getElementById(id);
  byId("form-setor")?.addEventListener("submit", salvarSetor);
  byId("form-confirmar-exclusao")?.addEventListener(
    "submit",
    confirmarExclusao,
  );
  byId("exclusao-cancelar")?.addEventListener("click", () =>
    cancelarExclusao(),
  );
  byId("btn-historico-alteracoes")?.addEventListener(
    "click",
    abrirHistoricoAlteracoes,
  );
  byId("historico-busca")?.addEventListener("input", renderHistoricoAlteracoes);
  byId("historico-atualizar")?.addEventListener("click", () =>
    carregarHistoricoAlteracoes(true),
  );
  byId("historico-mais")?.addEventListener("click", () =>
    carregarHistoricoAlteracoes(),
  );
  byId("btn-filtros-locais")?.addEventListener("click", () => {
    const btn = byId("btn-filtros-locais"),
      abrir = btn.getAttribute("aria-expanded") !== "true";
    btn.setAttribute("aria-expanded", String(abrir));
    byId("locais-filtros").classList.toggle("hidden", !abrir);
  });
  [
    "local-filtro-tipo",
    "local-filtro-capacidade",
    "local-filtro-recurso",
  ].forEach((id) => byId(id)?.addEventListener("input", renderLocais));
  byId("local-limpar-filtros")?.addEventListener("click", () => {
    [
      "local-filtro-tipo",
      "local-filtro-capacidade",
      "local-filtro-recurso",
      "busca-locais",
    ].forEach((id) => (byId(id).value = ""));
    prgdState.buscaLocaisVal = "";
    renderLocais();
  });
  byId("form-disponibilidade-local")?.addEventListener(
    "submit",
    executarConsultaLocal,
  );
  [
    "disponibilidade-local",
    "disponibilidade-data",
    "disponibilidade-inicio",
    "disponibilidade-fim",
  ].forEach((id) =>
    byId(id)?.addEventListener("input", () => {
      prgdState.consultaLocalAtiva = false;
      byId("disponibilidade-resultado").textContent = "";
    }),
  );
  byId("btn-meu-perfil")?.addEventListener("click", abrirMeuPerfil);
  byId("form-meu-perfil")?.addEventListener("submit", salvarMeuPerfil);
  byId("form-minha-senha")?.addEventListener("submit", alterarMinhaSenha);
  byId("perfil-nome")?.addEventListener("input", atualizarFormularioPerfil);
  byId("perfil-foto")?.addEventListener("change", selecionarFotoPerfil);
  byId("perfil-remover-foto")?.addEventListener("click", removerFotoPerfil);
  byId("login-form")?.addEventListener("submit", fazerLoginLocal);
  byId("btn-executar-logout")?.addEventListener("click", async () => {
    await signOut(prgdState.auth);
  });
  byId("form-univ-body")?.addEventListener("submit", salvarCadastroUniversal);
  byId("form-edicao-admin")?.addEventListener("submit", salvarEdicaoAdmin);
  byId("btn-excluir-registro")?.addEventListener(
    "click",
    excluirRegistroUniversal,
  );
  byId("btn-salvar-nova-observacao")?.addEventListener(
    "click",
    salvarNovaObservacao,
  );

  byId("busca-demandas")?.addEventListener("input", (e) => {
    prgdState.buscaDemandasVal = e.target.value.toLowerCase().trim();
    renderDemandas();
  });
  byId("filtro-demanda-status")?.addEventListener("change", (e) => {
    prgdState.filtroDemandaStatusAtual = e.target.value;
    renderDemandas();
  });
  byId("filtro-demanda-prio")?.addEventListener("change", (e) => {
    prgdState.filtroDemandaPrioAtual = e.target.value;
    renderDemandas();
  });
  byId("ordenacao-demandas")?.addEventListener("change", (e) => {
    prgdState.ordenacaoDemandasAtual = e.target.value;
    renderDemandas();
  });

  byId("busca-clientes")?.addEventListener("input", (e) => {
    prgdState.buscaClientesVal = e.target.value;
    renderClientes();
  });
  byId("filtro-gestor-modalidade")?.addEventListener("change", (e) => {
    prgdState.filtroGestorModalidadeAtual = e.target.value;
    renderClientes();
  });
  byId("filtro-situacao-cliente")?.addEventListener("change", (e) => {
    prgdState.filtroSituacaoClienteAtual = e.target.value;
    renderClientes();
  });

  byId("busca-locais")?.addEventListener("input", (e) => {
    prgdState.buscaLocaisVal = e.target.value.toLowerCase().trim();
    renderLocais();
  });
  byId("busca-fornecedores")?.addEventListener("input", (e) => {
    prgdState.buscaFornecedoresVal = e.target.value.toLowerCase().trim();
    renderFornecedores();
  });
  byId("busca-usuarios")?.addEventListener("input", (e) => {
    prgdState.buscaUsuariosVal = e.target.value.toLowerCase().trim();
    renderUsuarios();
  });
  byId("busca-bases")?.addEventListener("input", (e) => {
    prgdState.buscaBasesVal = e.target.value.toLowerCase().trim();
    renderBases();
  });
  byId("filtro-tipo-usuario")?.addEventListener("change", (e) => {
    prgdState.filtroTipoUsuarioAtual = e.target.value;
    renderUsuarios();
  });
  byId("filtro-tag-usuario")?.addEventListener("change", (e) => {
    prgdState.filtroTagAtual = e.target.value;
    renderUsuarios();
  });
  byId("filtro-setor-usuario")?.addEventListener("change", (e) => {
    prgdState.filtroSetorUsuarioAtual = e.target.value;
    renderUsuarios();
  });
  byId("filtro-orgao-usuario")?.addEventListener("change", (e) => {
    prgdState.filtroOrgaoUsuarioAtual = e.target.value;
    renderUsuarios();
  });
  byId("busca-eventos")?.addEventListener("input", (e) => {
    prgdState.buscaEventosVal = e.target.value.toLowerCase().trim();
    renderEventos();
  });
  byId("filtro-evento-futuros")?.addEventListener("click", () => {
    prgdState.filtroEventoAtual = "futuros";
    renderEventos();
  });
  byId("filtro-evento-realizados")?.addEventListener("click", () => {
    prgdState.filtroEventoAtual = "realizados";
    renderEventos();
  });
  byId("filtro-evento-todos")?.addEventListener("click", () => {
    prgdState.filtroEventoAtual = "todos";
    renderEventos();
  });
  [
    "filtro-evento-status",
    "filtro-evento-tipo",
    "filtro-evento-de",
    "filtro-evento-ate",
    "ordenacao-eventos",
  ].forEach((id) => byId(id)?.addEventListener("change", renderEventos));
  byId("limpar-filtros-eventos")?.addEventListener("click", () => {
    limparConsultaEventos();
    renderEventos();
  });
  for (const tipo of ["input", "change"])
    document.addEventListener(tipo, (ev) => {
      if (
        [
          "painel-inscricoes-busca",
          "painel-inscricoes-situacao",
          "painel-inscricoes-orgao",
        ].includes(ev.target?.id)
      )
        atualizarPainelInscricoesEvento();
    });
  byId("btn-relatorio-geral-eventos")?.addEventListener("click", () => {
    try {
      baixarRelatorioInscricoes();
    } catch (err) {
      alert(err.message || "Não foi possível preparar o relatório.");
    }
  });

  byId("btn-visao-tabela")?.addEventListener("click", () => {
    prgdState.visaoDemandasAtual = "tabela";
    guardarNavegacao();
    byId("container-visao-tabela").classList.remove("hidden");
    byId("container-visao-calendario").classList.add("hidden");
    byId("btn-visao-tabela").className =
      "px-3 py-1.5 rounded-md bg-white text-blue-900 shadow-sm transition font-bold";
    byId("btn-visao-calendario").className =
      "px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 transition";
  });
  byId("btn-visao-calendario")?.addEventListener("click", () => {
    prgdState.visaoDemandasAtual = "calendario";
    guardarNavegacao();
    byId("container-visao-tabela").classList.add("hidden");
    byId("container-visao-calendario").classList.remove("hidden");
    byId("btn-visao-calendario").className =
      "px-3 py-1.5 rounded-md bg-white text-blue-900 shadow-sm transition font-bold";
    byId("btn-visao-tabela").className =
      "px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 transition";
    renderDemandas();
  });

  document
    .querySelectorAll("[data-tab]")
    .forEach((b) => b.addEventListener("click", () => mudarAba(b.dataset.tab)));
  document
    .querySelectorAll(".btn-abrir-form")
    .forEach((b) =>
      b.addEventListener("click", () => abrirModalForm(b.dataset.modalTarget)),
    );
  document
    .querySelectorAll(".btn-fechar-modal")
    .forEach((b) =>
      b.addEventListener("click", () => fecharModal(b.dataset.target)),
    );
}
