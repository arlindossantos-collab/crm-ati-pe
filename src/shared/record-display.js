import { identificacaoUsuario } from "../modules/perfil/index.js";
import { prgdState } from "../app/state.js";
import { esc } from "./presentation.js";
import {
  rotuloCampo,
  referenciaTecnica,
  valorDeData,
  formatarDataExibicao,
} from "../domain/display.js";

// Consulta apenas os dados já carregados para o perfil; não busca referências fora do escopo.
export function nomeReferencia(colecao, id) {
  if (id === null || id === undefined || id === "") return "Não informado";
  const registro = (prgdState.dbData[colecao] || []).find((r) =>
    [r.id, r.firestoreId, r.uid].some(
      (v) => v != null && String(v) === String(id),
    ),
  );
  return (
    registro?.nome ||
    registro?.titulo ||
    registro?.sigla ||
    {
      orgaos: "Órgão indisponível nesta consulta",
      setores: "Setor indisponível nesta consulta",
      eventos: "Evento indisponível nesta consulta",
      locais: "Local indisponível nesta consulta",
      colaboradores: "Participante indisponível nesta consulta",
      usuarios: "Conta indisponível nesta consulta",
      grupos: "Grupo indisponível nesta consulta",
    }[colecao] ||
    "Cadastro indisponível nesta consulta"
  );
}
export function valorCadastroHtml(chave, valor, nivel = 0) {
  if (valor === null || valor === undefined || valor === "")
    return "Não informado";
  if (valorDeData(chave, valor)) return esc(formatarDataExibicao(valor, true));
  const referencias = {
    localId: "locais",
    orgaoId: "orgaos",
    setorId: "setores",
    eventId: "eventos",
    participanteId: "colaboradores",
    colaboradorId: "colaboradores",
  };
  if (Object.hasOwn(referencias, chave))
    return esc(nomeReferencia(referencias[chave], valor));
  if (
    [
      "grupos",
      "gruposPermitidos",
      "orgaosElegiveis",
      "responsaveisGrgdIds",
    ].includes(chave) &&
    Array.isArray(valor)
  ) {
    const colecao =
      chave === "orgaosElegiveis"
        ? "orgaos"
        : chave === "responsaveisGrgdIds"
          ? "usuarios"
          : "grupos";
    return (
      valor.map((id) => esc(nomeReferencia(colecao, id))).join("; ") ||
      "Nenhum selecionado"
    );
  }
  if (chave === "modeloInscricao")
    return valor === "institucional-v1"
      ? "Inscrição institucional"
      : "Modelo anterior ou não reconhecido";
  if (chave === "corCard")
    return esc(
      prgdState.CORES_CARD_DEMANDA.find((c) => c.id === valor)?.nome ||
        "Cor anterior preservada",
    );
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (typeof valor === "number")
    return Number.isFinite(valor)
      ? esc(new Intl.NumberFormat("pt-BR").format(valor))
      : "Valor a conferir";
  if (Array.isArray(valor)) {
    if (!valor.length) return "Nenhum registro";
    if (valor.every((v) => v === null || typeof v !== "object"))
      return valor.map((v) => valorCadastroHtml("", v, nivel + 1)).join("; ");
    if (nivel >= 4) return `${valor.length} registro(s) preservado(s)`;
    return `<ol class="space-y-2">${valor
      .slice(0, 50)
      .map(
        (v) =>
          `<li class="border rounded-lg p-2">${valorCadastroHtml("", v, nivel + 1)}</li>`,
      )
      .join(
        "",
      )}</ol>${valor.length > 50 ? "<p>Exibindo os primeiros 50 registros. Os demais permanecem preservados.</p>" : ""}`;
  }
  if (typeof valor === "object") {
    if (nivel >= 4) return "Dados adicionais preservados no registro";
    return `<dl class="space-y-2">${
      Object.entries(valor)
        .filter(([k]) => !referenciaTecnica(k))
        .map(
          ([k, v]) =>
            `<div><dt class="font-semibold">${esc(rotuloCampo(k))}</dt><dd class="break-words whitespace-pre-wrap">${valorCadastroHtml(k, v, nivel + 1)}</dd></div>`,
        )
        .join("") || "Dados de referência preservados"
    }</dl>`;
  }
  return esc(valor);
}
export function referenciasCadastroHtml(entradas) {
  if (!entradas.length) return "";
  return `<details class="border rounded-lg p-3 text-xs mt-3"><summary class="cursor-pointer font-semibold">Referências técnicas do registro</summary><dl class="space-y-2 mt-3">${entradas.map(([k, v]) => `<div><dt>${esc(rotuloCampo(k))}</dt><dd class="break-all">${esc(v)}</dd></div>`).join("")}</dl></details>`;
}
export function detalhesCadastroHtml(item, referencias = false) {
  const entradas = Object.entries(item).filter(([k]) => k !== "fotoPerfil");
  return (
    `<dl class="grid grid-cols-1 sm:grid-cols-2 gap-3">${entradas
      .filter(([k]) => !referenciaTecnica(k))
      .map(
        ([k, v]) =>
          `<div class="p-3 bg-slate-50 rounded-lg min-w-0"><dt class="text-xs text-slate-600 font-semibold mb-1">${esc(rotuloCampo(k))}</dt><dd class="font-medium break-words whitespace-pre-wrap">${["criadoPor", "editadoPor"].includes(k) ? identificacaoUsuario({ nome: v, uid: item[k + "Uid"] }) : valorCadastroHtml(k, v)}</dd></div>`,
      )
      .join("")}</dl>` +
    (referencias
      ? referenciasCadastroHtml(entradas.filter(([k]) => referenciaTecnica(k)))
      : "")
  );
}
export function campoEdicaoCadastro(chave, valor) {
  const id = "edit-campo-" + chave;
  const classe = "w-full p-2 border rounded-lg text-sm bg-white";
  const label = `<label for="${esc(id)}" class="block font-semibold text-xs mb-1">${esc(rotuloCampo(chave))}</label>`;
  const base = `id="${esc(id)}" name="${esc(chave)}" class="${classe}"`;
  if (
    [
      "criadoEm",
      "criadoPor",
      "atualizadoEm",
      "editadoPor",
      "perfilAtualizadoEm",
    ].includes(chave) ||
    (valor !== null && typeof valor === "object" && !Array.isArray(valor))
  )
    return `<div><p class="font-semibold mb-1">${esc(rotuloCampo(chave))}</p><div class="p-2 border rounded-lg text-slate-600">${valorCadastroHtml(chave, valor)}</div><p class="text-slate-500">Informação preservada; alteração pelo fluxo específico.</p></div>`;
  if (
    ["gruposPermitidos", "grupos", "orgaosElegiveis"].includes(chave) &&
    Array.isArray(valor)
  ) {
    const colecao = chave === "orgaosElegiveis" ? "orgaos" : "grupos";
    const ids = [
      ...new Set([
        ...valor,
        ...(prgdState.dbData[colecao] || []).map((r) =>
          String(r.firestoreId || r.id),
        ),
      ]),
    ];
    return `<div>${label}<select ${base} multiple data-field-type="reference-list">${ids.map((v, i) => `<option value="${esc(v)}" ${valor.includes(v) ? "selected" : ""}>${esc(nomeReferencia(colecao, v))}${!(prgdState.dbData[colecao] || []).some((r) => String(r.firestoreId || r.id) === v) ? " (referência " + (i + 1) + ")" : ""}</option>`).join("")}</select><p class="text-slate-500">Use Ctrl ou Command para selecionar vários. Referências anteriores são preservadas.</p></div>`;
  }
  if (typeof valor === "boolean")
    return `<div>${label}<select ${base} data-field-type="boolean"><option value="true" ${valor ? "selected" : ""}>Sim</option><option value="false" ${!valor ? "selected" : ""}>Não</option></select></div>`;
  if (typeof valor === "number")
    return `<div>${label}<input ${base} type="number" step="any" data-field-type="number" value="${esc(valor)}" required></div>`;
  if (Array.isArray(valor)) {
    if (
      !["historicoAcoes", "versoesAnteriores"].includes(chave) &&
      valor.every((v) => typeof v === "string")
    )
      return `<div>${label}<input ${base} type="text" data-field-type="string-list" value="${esc(valor.join(", "))}"><p class="text-slate-500">Separe os itens por vírgula.</p></div>`;
    return `<div><p class="font-semibold mb-1">${esc(rotuloCampo(chave))}</p><p>${valor.length} registro(s) preservado(s). Edição disponível no fluxo específico.</p></div>`;
  }
  return `<div>${label}<input ${base} type="text" value="${esc(valor ?? "")}"></div>`;
}
