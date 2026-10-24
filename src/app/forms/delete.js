import { prgdState } from "../state.js";
import { ehAdministrador } from "../../modules/acessos/policies.js";

import { gravarUsuarioComIdentidade } from "../../modules/acessos/accounts.js";

import { excluirComHistorico } from "../../modules/auditoria/index.js";

import { traduzirErroSistema } from "../../shared/presentation.js";

import { fecharModal } from "../navigation.js";

import {
  collection,
  doc,
  getDocs,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "../../services/firebase.js";

export function cancelarExclusao(forcar = false) {
  if (prgdState.exclusaoEmCurso && !forcar) return;
  prgdState.exclusaoPendente = null;
  document.getElementById("exclusao-senha").value = "";
  document.getElementById("exclusao-erro").textContent = "";
  document.getElementById("modal-confirmar-exclusao").classList.add("hidden");
}

export function excluirRegistroUniversal() {
  const colecao = document.getElementById("edit-colecao").value;
  const firestoreId = document.getElementById("edit-doc-id").value;
  if (!ehAdministrador()) {
    alert("Somente administradores.");
    return;
  }
  if (
    prgdState.exclusaoEmCurso ||
    !prgdState.COLECOES_AUDITADAS.includes(colecao) ||
    !firestoreId
  )
    return;
  const item = prgdState.dbData[colecao]?.find(
    (u) => String(u.firestoreId || u.id || u.uid) === firestoreId,
  );
  if (!item) {
    alert("Aguarde o registro carregar antes de excluir.");
    return;
  }
  if (
    colecao === "usuarios" &&
    (firestoreId === prgdState.currentUser.uid ||
      item.uid === prgdState.currentUser.uid)
  ) {
    alert("Você não pode excluir sua própria conta.");
    return;
  }
  prgdState.exclusaoPendente = Object.freeze({
    colecao,
    id: firestoreId,
    uid: prgdState.currentUser.uid,
    sessao: prgdState.versaoSessao,
    item: { ...item },
  });
  document.getElementById("exclusao-descricao").textContent =
    (colecao === "usuarios"
      ? "Excluir do cadastro ativo: "
      : "Excluir registro: ") +
    (item.nome || item.titulo || firestoreId) +
    (colecao === "usuarios"
      ? ". O acesso será bloqueado. A conta de login e o histórico permanecem."
      : ". Esta ação remove o registro.");
  document.getElementById("exclusao-senha").value = "";
  document.getElementById("exclusao-erro").textContent = "";
  document
    .getElementById("modal-confirmar-exclusao")
    .classList.remove("hidden");
  document.getElementById("exclusao-senha").focus?.();
}

export async function confirmarExclusao(e) {
  e.preventDefault();
  const alvo = prgdState.exclusaoPendente,
    usuarioAuth = prgdState.auth.currentUser;
  const senha = document.getElementById("exclusao-senha").value;
  if (!alvo || prgdState.exclusaoEmCurso || !ehAdministrador()) return;
  const atual = () =>
    prgdState.exclusaoPendente === alvo &&
    alvo.sessao === prgdState.versaoSessao &&
    prgdState.currentUser?.uid === alvo.uid &&
    usuarioAuth?.uid === alvo.uid &&
    prgdState.auth.currentUser?.uid === alvo.uid &&
    ehAdministrador();
  if (!atual()) {
    cancelarExclusao(true);
    return;
  }
  if (!senha) {
    document.getElementById("exclusao-erro").textContent =
      "Informe sua senha de acesso.";
    return;
  }
  prgdState.exclusaoEmCurso = true;
  ["exclusao-confirmar", "exclusao-cancelar", "exclusao-senha"].forEach(
    (id) => (document.getElementById(id).disabled = true),
  );
  try {
    await reauthenticateWithCredential(
      usuarioAuth,
      EmailAuthProvider.credential(usuarioAuth.email, senha),
    );
    document.getElementById("exclusao-senha").value = "";
    if (!atual()) return;
    await usuarioAuth.getIdToken(true);
    if (!atual()) return;
    if (alvo.emLote) {
      const snapshot = await getDocs(collection(prgdState.db, "orgaos"));
      for (const registro of snapshot.docs) {
        if (!atual()) return;
        await excluirComHistorico(doc(prgdState.db, "orgaos", registro.id));
      }
    } else if (alvo.colecao === "usuarios") {
      await gravarUsuarioComIdentidade(
        alvo.id,
        {
          ativo: false,
          excluido: true,
          atualizadoEm: new Date().toISOString(),
          editadoPor: prgdState.currentUser.nome || prgdState.currentUser.email,
          editadoPorUid: prgdState.currentUser.uid,
        },
        alvo.item,
      );
    } else await excluirComHistorico(doc(prgdState.db, alvo.colecao, alvo.id));
    if (!atual()) return;
    cancelarExclusao(true);
    fecharModal("modal-detalhes");
    alert(
      alvo.colecao === "usuarios"
        ? "Usuário excluído do cadastro ativo. Histórico preservado."
        : "Registro excluído. Alteração registrada no histórico.",
    );
  } catch (err) {
    if (atual())
      document.getElementById("exclusao-erro").textContent =
        traduzirErroSistema(err);
  } finally {
    document.getElementById("exclusao-senha").value = "";
    prgdState.exclusaoEmCurso = false;
    ["exclusao-confirmar", "exclusao-cancelar", "exclusao-senha"].forEach(
      (id) => (document.getElementById(id).disabled = false),
    );
  }
}
