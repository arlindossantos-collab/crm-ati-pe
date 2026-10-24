// Responsabilidade: app/listeners-auth. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "./state.js";
import {
  nomePerfilAcesso,
  nomeOrgaoUsuario,
} from "../modules/acessos/policies.js";
import {
  guardarNavegacao,
  restaurarNavegacao,
  atualizarVisibilidadeAbas,
  renderizarTudo,
} from "./navigation.js";
import {
  finalizarRestauracao,
  limparDadosSessao,
  bloquearSessao,
} from "../modules/acessos/session.js";
import {
  pararSnapshots,
  iniciarSnapshotFirestore,
  carregarPerfilFirebase,
} from "../services/subscriptions.js";
import { onAuthStateChanged } from "../services/firebase.js";

export function bindAuthentication() {
  onAuthStateChanged(prgdState.auth, async (user) => {
    if (
      user?.uid &&
      prgdState.currentUser?.uid === user.uid &&
      prgdState.currentUser.ativo !== false
    )
      return;
    const uidAnterior = prgdState.currentUser?.uid;
    const versaoAtual = ++prgdState.versaoSessao;
    pararSnapshots();
    limparDadosSessao();
    if (!user) {
      if (uidAnterior) {
        try {
          sessionStorage.removeItem("prgd:navegacao:" + uidAnterior);
        } catch (_) {}
      }
      finalizarRestauracao();
      return;
    }
    try {
      const perfilCarregado = await carregarPerfilFirebase(user);
      if (versaoAtual !== prgdState.versaoSessao) return;
      if (
        !perfilCarregado ||
        perfilCarregado.ativo === false ||
        perfilCarregado.excluido === true
      ) {
        await bloquearSessao(
          "Seu cadastro está inativo ou ainda não foi autorizado. Procure o administrador.",
        );
        return;
      }
      prgdState.currentUser = perfilCarregado;
      document.getElementById("user-name-display").textContent =
        prgdState.currentUser.nome || user.email;
      document.getElementById("user-role-display").textContent =
        nomePerfilAcesso() + " • " + nomeOrgaoUsuario(prgdState.currentUser);
      restaurarNavegacao();
      atualizarVisibilidadeAbas();
      iniciarSnapshotFirestore();
      renderizarTudo();
      finalizarRestauracao();
      guardarNavegacao();
    } catch (err) {
      if (versaoAtual === prgdState.versaoSessao)
        await bloquearSessao(
          "Não foi possível confirmar seu cadastro. Tente novamente ou procure o administrador.",
        );
    }
  });
}
