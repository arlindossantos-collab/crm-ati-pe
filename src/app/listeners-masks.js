// Responsabilidade: app/listeners-masks. Estado transitório compartilhado apenas em app/state.js.

import {
  aplicarMascaraTelefone,
  aplicarMascaraData,
} from "../shared/presentation.js";

export function bindMasks() {
  document.addEventListener("input", (e) => {
    const target = e.target;
    if (target.classList.contains("input-mask-telefone")) {
      target.value = aplicarMascaraTelefone(target.value);
    } else if (target.classList.contains("input-mask-data")) {
      target.value = aplicarMascaraData(target.value);
    }
  });
}
