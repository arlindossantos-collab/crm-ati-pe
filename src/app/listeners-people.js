// Responsabilidade: app/listeners-people. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "./state.js";
import {
  atualizarSetoresColaborador,
  abrirColaborador,
  renderColaboradoresAdmin,
} from "../modules/colaboradores/index.js";
import {
  cancelarRevisaoUsuario,
  abrirVinculoColaborador,
  renderOpcoesVinculo,
  salvarVinculoColaborador,
  renderUsuarios,
} from "../modules/acessos/accounts.js";
import { atualizarResumoContatosAberto } from "../modules/orgaos/contacts.js";

export function bindPeopleEvents() {
  document.getElementById("filtro-acesso-usuario").innerHTML =
    '<option value="">Todas as situações de acesso</option>' +
    Object.entries(prgdState.ESTADOS_ACESSO)
      .filter(([id]) => id !== "excluido")
      .map(([id, nome]) => `<option value="${id}">${nome}</option>`)
      .join("");
  for (const id of ["filtro-perfil-usuario", "filtro-acesso-usuario"])
    document.getElementById(id).addEventListener("change", renderUsuarios);
  document
    .getElementById("usuarios-limpar-filtros")
    .addEventListener("click", () => {
      prgdState.filtroTipoUsuarioAtual =
        prgdState.filtroTagAtual =
        prgdState.filtroOrgaoUsuarioAtual =
        prgdState.filtroSetorUsuarioAtual =
        prgdState.buscaUsuariosVal =
          "";
      for (const id of [
        "busca-usuarios",
        "filtro-tipo-usuario",
        "filtro-tag-usuario",
        "filtro-orgao-usuario",
        "filtro-setor-usuario",
        "filtro-perfil-usuario",
        "filtro-acesso-usuario",
      ])
        document.getElementById(id).value = "";
      renderUsuarios();
    });
  for (const id of [
    "admin-colab-busca",
    "admin-colab-orgao",
    "admin-colab-setor",
    "admin-colab-situacao",
    "admin-colab-conta",
  ])
    document
      .getElementById(id)
      .addEventListener(id.endsWith("busca") ? "input" : "change", () => {
        if (id === "admin-colab-orgao")
          document.getElementById("admin-colab-setor").value = "";
        renderColaboradoresAdmin();
      });
  document
    .getElementById("admin-colab-limpar")
    .addEventListener("click", () => {
      for (const id of [
        "admin-colab-busca",
        "admin-colab-orgao",
        "admin-colab-setor",
        "admin-colab-situacao",
        "admin-colab-conta",
      ])
        document.getElementById(id).value = "";
      renderColaboradoresAdmin();
    });
  document
    .getElementById("admin-colab-novo")
    .addEventListener("click", () => abrirColaborador());
  document
    .getElementById("colab-orgao")
    .addEventListener("change", () => atualizarSetoresColaborador(""));
  document
    .getElementById("revisar-usuario-voltar")
    .addEventListener("click", cancelarRevisaoUsuario);
  document
    .getElementById("revisar-usuario-confirmar")
    .addEventListener("click", () => {
      const resolver = prgdState.revisaoUsuarioResolver;
      prgdState.revisaoUsuarioResolver = null;
      document.getElementById("modal-revisar-usuario").classList.add("hidden");
      resolver?.(true);
    });
  document
    .getElementById("vincular-busca")
    .addEventListener("input", renderOpcoesVinculo);
  document.getElementById("vincular-lista").addEventListener("change", (e) => {
    e.target.dataset.selecionado = e.target.value;
    document.getElementById("vincular-confirmacao").checked = false;
  });
  document
    .getElementById("form-vincular-colaborador")
    .addEventListener("submit", salvarVinculoColaborador);
  document.addEventListener("change", (ev) => {
    if (ev.target.matches?.("[data-contato-funcao]"))
      atualizarResumoContatosAberto();
  });
  document.addEventListener("click", (ev) => {
    const botao = ev.target.closest?.("[data-colaborador-vincular]");
    if (botao) abrirVinculoColaborador(botao.dataset.colaboradorVincular);
  });
}
