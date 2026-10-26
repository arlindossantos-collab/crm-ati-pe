// Responsabilidade: shared/identity. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "../app/state.js";
import { pessoaPorUid, avatarUsuario } from "../modules/perfil/index.js";
import { esc } from "./presentation.js";

export function uidCadastro(usuario) {
  return String(usuario.firestoreId || usuario.uid || "");
}

export function internosAtivos() {
  return prgdState.dbData.usuarios
    .filter(
      (u) => u.tipoUsuario === "interno" && u.ativo === true && uidCadastro(u),
    )
    .sort((a, b) =>
      String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR"),
    );
}

export function nomesLegados(demanda = {}) {
  if (Array.isArray(demanda.responsaveisGrgdLegados))
    return demanda.responsaveisGrgdLegados;
  if (Array.isArray(demanda.responsaveisGrgdIds)) return [];
  return Array.isArray(demanda.responsavelGrgd)
    ? demanda.responsavelGrgd
    : String(demanda.responsavelGrgd || "")
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
}

export function dadosResponsavel(uid, demanda = {}) {
  return (
    pessoaPorUid(uid) ||
    (demanda.responsaveisGrgdSnapshot || []).find((u) => u.uid === uid) || {
      nome: "Cadastro indisponível",
    }
  );
}

export function nomesResponsaveis(demanda = {}) {
  return [
    ...(demanda.responsaveisGrgdIds || []).map((uid) => {
      const u = dadosResponsavel(uid, demanda);
      return u.nome || u.email || "Sem nome";
    }),
    ...nomesLegados(demanda),
  ];
}

export function camposResponsaveis(nomeCampo, demanda = {}) {
  const ids = demanda.responsaveisGrgdIds || [];
  const ativos = internosAtivos();
  const anteriores = ids.filter(
    (uid) => !ativos.some((u) => uidCadastro(u) === uid),
  );
  const checkbox = (valor, texto, marcado, legado = false) =>
    `<label class="flex items-start gap-2 text-xs cursor-pointer"><input type="checkbox" name="${esc(nomeCampo)}" value="${esc(valor)}" data-legado="${legado}" ${marcado ? "checked" : ""} class="rounded text-blue-900">${avatarUsuario(legado ? { nome: valor } : { ...dadosResponsavel(valor, demanda), uid: valor })}<span>${esc(texto)}</span></label>`;
  return (
    ativos
      .map((u) =>
        checkbox(
          uidCadastro(u),
          `${u.nome || u.email} (${u.email || uidCadastro(u)})`,
          ids.includes(uidCadastro(u)),
        ),
      )
      .join("") +
    anteriores
      .map((uid) =>
        checkbox(
          uid,
          `${dadosResponsavel(uid, demanda).nome || uid} — vínculo anterior`,
          true,
        ),
      )
      .join("") +
    nomesLegados(demanda)
      .map((nome) =>
        checkbox(nome, `${nome} — nome antigo, sem vínculo`, true, true),
      )
      .join("") +
    (!ativos.length
      ? '<p class="col-span-full text-xs text-slate-500">Nenhum usuário interno ativo. Cadastre ou classifique os usuários em Colaboradores → Acessos e permissões.</p>'
      : "")
  );
}

export function lerResponsaveis(controles, anterior = {}) {
  const ids = [],
    legados = [],
    snapshot = [];
  for (const campo of controles) {
    if (campo.dataset.legado === "true") {
      if (!nomesLegados(anterior).includes(campo.value))
        throw new Error("Nome antigo inválido. Reabra a demanda.");
      legados.push(campo.value);
      continue;
    }
    const uid = campo.value;
    const usuario = internosAtivos().find((u) => uidCadastro(u) === uid);
    if (!usuario && !(anterior.responsaveisGrgdIds || []).includes(uid))
      throw new Error(
        "Selecione somente usuários internos ativos. Reabra a demanda para atualizar a lista.",
      );
    if (ids.includes(uid)) continue;
    ids.push(uid);
    const pessoa = usuario || dadosResponsavel(uid, anterior);
    snapshot.push({
      uid,
      nome: pessoa.nome || pessoa.email || "Sem nome",
      email: pessoa.email || "",
    });
  }
  return {
    responsaveisGrgdIds: ids,
    responsaveisGrgdSnapshot: snapshot,
    responsaveisGrgdLegados: [...new Set(legados)],
    responsavelGrgd: [...snapshot.map((u) => u.nome), ...new Set(legados)],
  };
}

export function pessoasResponsaveis(demanda = {}) {
  return [
    ...(demanda.responsaveisGrgdIds || []).map((uid) => ({
      ...dadosResponsavel(uid, demanda),
      uid,
    })),
    ...nomesLegados(demanda).map((nome) => ({ nome })),
  ];
}
