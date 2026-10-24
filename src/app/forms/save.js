import { prgdState } from "../state.js";
import { podeAlterarColecao } from "../../modules/acessos/policies.js";
import { lerInscricaoEvento } from "../../modules/inscricoes/operations.js";
import {
  revisarUsuario,
  lerDadosUsuario,
  gravarUsuarioComIdentidade,
} from "../../modules/acessos/accounts.js";

import { lerContatosOrgao } from "../../modules/orgaos/contacts.js";
import { salvarComHistorico } from "../../modules/auditoria/index.js";
import { lerResponsaveis } from "../../shared/identity.js";

import { traduzirErroSistema } from "../../shared/presentation.js";

import { fecharModal } from "../navigation.js";
import { lerCadastroLocal } from "../../modules/locais/index.js";
import { lerAgendaEvento } from "../../modules/eventos/index.js";
import { doc } from "../../services/firebase.js";

export async function salvarEdicaoAdmin(e) {
  e.preventDefault();
  const colecao = document.getElementById("edit-colecao").value;
  const firestoreId = document.getElementById("edit-doc-id").value;
  if (!podeAlterarColecao(colecao)) {
    alert("Ação não autorizada para este perfil.");
    return;
  }
  const form = e.target;
  const itemAntigo =
    prgdState.dbData[colecao]?.find(
      (i) =>
        String(i.firestoreId) === String(firestoreId) ||
        String(i.id) === String(firestoreId),
    ) || {};
  const agora = new Date().toISOString();
  const autorAtual =
    prgdState.currentUser.nome || prgdState.currentUser.email || "Admin";

  const obj = {
    atualizadoEm: agora,
    editadoPor: autorAtual,
    editadoPorUid: prgdState.currentUser.uid,
    criadoEm: itemAntigo.criadoEm || agora,
    criadoPor: itemAntigo.criadoPor || autorAtual,
    ...(itemAntigo.criadoPorUid
      ? { criadoPorUid: itemAntigo.criadoPorUid }
      : !itemAntigo.criadoPor
        ? { criadoPorUid: prgdState.currentUser.uid }
        : {}),
  };

  try {
    if (colecao === "usuarios") {
      Object.assign(obj, lerDadosUsuario(itemAntigo));
      obj.uid = String(firestoreId);
    } else if (colecao === "locais")
      Object.assign(obj, lerCadastroLocal(false, itemAntigo));
    else
      form
        .querySelectorAll("input[name],select[name],textarea[name]")
        .forEach((el) => {
          if (
            !el.name ||
            el.name === "responsavelGrgdCheckbox" ||
            [
              "criadoEm",
              "criadoPor",
              "atualizadoEm",
              "editadoPor",
              "uid",
              "criadoPorUid",
              "editadoPorUid",
              "perfilAtualizadoEm",
              "ultimaAuditoriaId",
            ].includes(el.name)
          )
            return;
          const tipo = el.dataset.fieldType;
          if (tipo === "boolean") {
            if (!["true", "false"].includes(el.value))
              throw new Error("Selecione Sim ou Não para " + el.name + ".");
            obj[el.name] = el.value === "true";
          } else if (tipo === "number") {
            if (!el.value.trim() || !Number.isFinite(Number(el.value)))
              throw new Error("Informe um número válido para " + el.name + ".");
            obj[el.name] = Number(el.value);
          } else if (tipo === "string-list") {
            const anterior = itemAntigo[el.name];
            obj[el.name] =
              Array.isArray(anterior) && el.value === anterior.join(", ")
                ? anterior
                : el.value
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean);
          } else if (itemAntigo[el.name] === null && !el.value)
            obj[el.name] = null;
          else obj[el.name] = el.value;
        });
    if (colecao === "orgaos")
      obj.contatosVinculados = lerContatosOrgao(itemAntigo);
    if (colecao === "eventos")
      Object.assign(
        obj,
        lerAgendaEvento(itemAntigo),
        lerInscricaoEvento(itemAntigo),
      );
    if (colecao === "demandas") {
      const respCheckboxes = form.querySelectorAll(
        'input[name="responsavelGrgdCheckbox"]:checked',
      );
      Object.assign(obj, lerResponsaveis(respCheckboxes, itemAntigo));
    }
    if (colecao === "usuarios") {
      if (!(await revisarUsuario(obj))) return;
      await gravarUsuarioComIdentidade(String(firestoreId), obj, itemAntigo);
    } else
      await salvarComHistorico(
        doc(prgdState.db, colecao, String(firestoreId)),
        obj,
        { merge: true },
      );
    alert("Alterações salvas na nuvem com sucesso!");
    fecharModal("modal-detalhes");
  } catch (err) {
    alert(traduzirErroSistema(err));
  }
}
