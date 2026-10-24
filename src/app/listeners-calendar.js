// Responsabilidade: app/listeners-calendar. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "./state.js";
import { renderDemandas } from "../modules/demandas/index.js";

export function bindCalendarEvents() {
  document.getElementById("btn-mes-anterior")?.addEventListener("click", () => {
    prgdState.dataMensalAtual = new Date(
      prgdState.dataMensalAtual.getFullYear(),
      prgdState.dataMensalAtual.getMonth() - 1,
      1,
    );
    renderDemandas();
  });
  document.getElementById("btn-mes-proximo")?.addEventListener("click", () => {
    prgdState.dataMensalAtual = new Date(
      prgdState.dataMensalAtual.getFullYear(),
      prgdState.dataMensalAtual.getMonth() + 1,
      1,
    );
    renderDemandas();
  });
  document.getElementById("btn-mes-hoje")?.addEventListener("click", () => {
    prgdState.dataMensalAtual = new Date();
    renderDemandas();
  });
}
