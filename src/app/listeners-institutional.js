// Responsabilidade: app/listeners-institutional. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "./state.js";
import { renderPortalInstitucional } from "../modules/portal/index.js";
import {
  gestorPode,
  abrirColaborador,
  salvarColaborador,
} from "../modules/colaboradores/index.js";
import {
  abrirInscricaoInstitucional,
  confirmarInscricaoInstitucional,
  cancelarInscricaoInstitucional,
  consultarComprovante,
} from "../modules/inscricoes/operations.js";
import { mudarAba } from "./navigation.js";

export function bindInstitutionalEvents() {
  document
    .getElementById("form-colaborador")
    ?.addEventListener("submit", salvarColaborador);
  document
    .getElementById("form-inscricao-institucional")
    ?.addEventListener("submit", confirmarInscricaoInstitucional);
  document
    .getElementById("btn-novo-colaborador")
    ?.addEventListener("click", () => abrirColaborador());
  document
    .getElementById("colaborador-busca")
    ?.addEventListener("input", renderPortalInstitucional);
  document
    .getElementById("colaborador-setor-filtro")
    ?.addEventListener("change", renderPortalInstitucional);
  document
    .getElementById("comprovante-imprimir")
    ?.addEventListener("click", () =>
      consultarComprovante(prgdState.comprovanteAtualId, true),
    );
  document.addEventListener("click", (ev) => {
    const atalho = ev.target.closest?.(
      "[data-portal-aba],[data-portal-cadastrar]",
    );
    if (atalho) {
      if (atalho.hasAttribute("data-portal-cadastrar")) {
        if (gestorPode("participantes.cadastrar")) {
          mudarAba("colaboradores");
          abrirColaborador();
        }
      } else mudarAba(atalho.getAttribute("data-portal-aba"));
      return;
    }
    const el = ev.target.closest?.(
      "[data-colaborador-editar],[data-inscrever-colaborador],[data-inscricao-cancelar],[data-comprovante]",
    );
    if (!el) return;
    if (el.hasAttribute("data-colaborador-editar"))
      abrirColaborador(el.getAttribute("data-colaborador-editar"));
    else if (el.hasAttribute("data-inscrever-colaborador"))
      abrirInscricaoInstitucional(
        el.getAttribute("data-inscrever-colaborador"),
      );
    else if (el.hasAttribute("data-inscricao-cancelar"))
      cancelarInscricaoInstitucional(
        el.getAttribute("data-inscricao-cancelar"),
      );
    else consultarComprovante(el.getAttribute("data-comprovante"));
  });
}
