import { nomeReferencia } from "../../shared/record-display.js";
// Responsabilidade: modules/orgaos/contacts. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "../../app/state.js";
import { situacaoCadastroColaborador } from "../colaboradores/index.js";
import { esc } from "../../shared/presentation.js";

export function contatosDaFuncao(o, funcao) {
  const escolhido = o.contatosVinculados?.[funcao] || "auto",
    orgaoId = String(o.firestoreId || o.id || "");
  if (escolhido === "manual") return [];
  const contatos = (prgdState.dbData.contatosColaboradores || []).filter(
    (p) => p.divulgavel === true,
  );
  if (escolhido !== "auto")
    return contatos.filter((p) => p.id === escolhido && p.orgaoId === orgaoId);
  const candidatos = contatos.filter(
      (p) => p.orgaoId === orgaoId && (p.funcoesContato || []).includes(funcao),
    ),
    ativos = candidatos.filter((p) => p.ativo !== false);
  return (ativos.length ? ativos : candidatos).sort((a, b) =>
    String(a.nome).localeCompare(String(b.nome), "pt-BR"),
  );
}

export function orgaoComContatos(o) {
  const novo = { ...o };
  for (const [id, f] of Object.entries(prgdState.FUNCOES_CONTATO)) {
    const contatos = contatosDaFuncao(o, id),
      escolhido = o.contatosVinculados?.[id];
    if (contatos.length) {
      novo[f.nomeCampo] = contatos
        .map(
          (p) =>
            p.nome +
            (p.ativo === false
              ? " (inativo)"
              : situacaoCadastroColaborador(p).id === "vencido"
                ? " (revisão vencida)"
                : ""),
        )
        .join("; ");
      novo[f.email] = contatos.map((p) => p.emailInstitucional).join("; ");
      novo[f.telefone] = contatos
        .map((p) => p.telefone)
        .filter(Boolean)
        .join("; ");
      if (f.cargo)
        novo[f.cargo] = contatos
          .map((p) => p.cargo)
          .filter(Boolean)
          .join("; ");
    } else if (escolhido && !["auto", "manual"].includes(escolhido)) {
      novo[f.nomeCampo] = prgdState.portalCarregando.contatosColaboradores
        ? "Carregando contato vinculado…"
        : "Contato vinculado indisponível";
      novo[f.email] = "";
      novo[f.telefone] = "";
      if (f.cargo) novo[f.cargo] = "";
    }
  }
  return novo;
}

export function resumoContatosOrgao(o) {
  return `<section class="bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-xs mb-4"><h4 class="font-bold text-blue-900 mb-2">Contatos vinculados aos colaboradores</h4>${prgdState.portalErros.contatosColaboradores ? '<p role="alert">Não foi possível carregar os contatos atualizados. Dados manuais anteriores não comprovam atualização.</p>' : prgdState.portalCarregando.contatosColaboradores ? "<p>Carregando contatos atualizados…</p>" : ""}${Object.entries(
    prgdState.FUNCOES_CONTATO,
  )
    .map(([id, f]) => {
      const contatos = contatosDaFuncao(o, id);
      return `<div class="py-2 border-b border-blue-100 last:border-0"><b>${esc(f.nome)}:</b> ${contatos.length ? contatos.map((p) => `${esc(p.nome)} · ${esc(p.emailInstitucional)} · ${esc(p.telefone || "Sem telefone")}<small class="block">${esc(nomeReferencia("setores", p.setorId))} · ${esc(situacaoCadastroColaborador(p).nome)}</small>`).join("<br>") : o.contatosVinculados?.[id] && !["auto", "manual"].includes(o.contatosVinculados[id]) ? "Vínculo indisponível; revise o colaborador." : "Sem colaborador vinculado. Dados manuais anteriores preservados."}</div>`;
    })
    .join(
      "",
    )}<p class="mt-2 text-slate-600">Função de contato e setor não concedem perfil de acesso. Atualizações do colaborador refletem aqui sem recadastrar o contato.</p></section>`;
}

export function camposContatosOrgao(o) {
  const orgaoId = String(o.firestoreId || o.id || "");
  return `<fieldset class="md:col-span-2 bg-blue-50/70 border border-blue-100 rounded-xl p-4"><legend class="font-bold text-blue-900">Fonte dos contatos institucionais</legend><p class="text-xs mb-3">Automático usa as funções indicadas pelos gestores no cadastro dos colaboradores. Ou selecione um contato do órgão. Para disponibilizar uma pessoa, indique ao menos uma função institucional no cadastro do colaborador. Os campos manuais abaixo são preservados como referência anterior.</p><div class="grid sm:grid-cols-2 gap-3">${Object.entries(
    prgdState.FUNCOES_CONTATO,
  )
    .map(([id, f]) => {
      const valor = o.contatosVinculados?.[id] || "auto",
        lista = prgdState.dbData.contatosColaboradores.filter(
          (p) => p.orgaoId === orgaoId && p.divulgavel === true,
        );
      return `<label class="text-xs">${esc(f.nome)}<select data-contato-funcao="${id}" class="block w-full border rounded-lg p-2 mt-1"><option value="auto" ${valor === "auto" ? "selected" : ""}>Automático pela função institucional</option><option value="manual" ${valor === "manual" ? "selected" : ""}>Manter somente dados manuais</option>${lista.map((p) => `<option value="${esc(p.id)}" ${valor === p.id ? "selected" : ""}>${esc(p.nome)} · ${esc(p.emailInstitucional)}${p.ativo === false ? " (inativo)" : ""}</option>`).join("")}${!["auto", "manual"].includes(valor) && !lista.some((p) => p.id === valor) ? `<option value="${esc(valor)}" selected>Contato anterior indisponível</option>` : ""}</select></label>`;
    })
    .join(
      "",
    )}</div><div id="orgao-resumo-form" class="mt-3">${resumoContatosOrgao(o)}</div></fieldset>`;
}

export function lerContatosOrgao(o) {
  const refs = {};
  for (const campo of document.querySelectorAll("[data-contato-funcao]")) {
    const f = campo.dataset.contatoFuncao,
      id = campo.value;
    if (!prgdState.FUNCOES_CONTATO[f]) continue;
    if (
      !["auto", "manual"].includes(id) &&
      o.contatosVinculados?.[f] !== id &&
      !prgdState.dbData.contatosColaboradores.some(
        (p) =>
          p.id === id &&
          p.orgaoId === String(o.firestoreId || o.id) &&
          p.divulgavel === true,
      )
    )
      throw new Error("Selecione um colaborador do próprio órgão.");
    refs[f] = id;
  }
  return refs;
}

export function atualizarResumoContatosAberto() {
  if (document.getElementById("edit-colecao").value !== "orgaos") return;
  const o = prgdState.dbData.orgaos.find(
    (o) =>
      String(o.firestoreId || o.id) ===
      document.getElementById("edit-doc-id").value,
  );
  if (!o) return;
  document.querySelectorAll("[data-contato-funcao]").forEach((campo) => {
    const valor = campo.value,
      lista = prgdState.dbData.contatosColaboradores.filter(
        (p) =>
          p.orgaoId === String(o.firestoreId || o.id) && p.divulgavel === true,
      );
    const opcoes =
      `<option value="auto">Automático pela função institucional</option><option value="manual">Manter somente dados manuais</option>` +
      lista
        .map(
          (p) =>
            `<option value="${esc(p.id)}">${esc(p.nome)} · ${esc(p.emailInstitucional)}${p.ativo === false ? " (inativo)" : ""}</option>`,
        )
        .join("") +
      (!["auto", "manual"].includes(valor) && !lista.some((p) => p.id === valor)
        ? `<option value="${esc(valor)}">Contato anterior indisponível</option>`
        : "");
    if (campo.innerHTML !== opcoes) {
      campo.innerHTML = opcoes;
      campo.value = valor;
    }
  });
  const vivo = document.getElementById("orgao-contatos-vivos");
  if (vivo) vivo.innerHTML = resumoContatosOrgao(o);
  const atual = orgaoComContatos(o),
    modalidade =
      { NSI: "nsi", Telemática: "telematica", SI: "si", SEI: "sei" }[
        o.gestorModalidadeSelecionada
      ] || "orgao",
    funcao = prgdState.FUNCOES_CONTATO[modalidade];
  for (const [id, key] of [
    ["det-card2-nome", funcao.nomeCampo],
    ["det-card2-email", funcao.email],
    ["det-card2-tel", funcao.telefone],
  ]) {
    const campo = document.getElementById(id);
    if (campo) campo.textContent = atual[key] || "Não informado";
  }
  document.querySelectorAll("[data-contato-vivo]").forEach((el) => {
    const [id, tipo] = el.dataset.contatoVivo.split("."),
      f = prgdState.FUNCOES_CONTATO[id];
    el.textContent =
      atual[tipo === "nome" ? f.nomeCampo : f[tipo]] || "Não informado";
  });
  const form = document.getElementById("orgao-resumo-form");
  if (form) {
    try {
      form.innerHTML = resumoContatosOrgao({
        ...o,
        contatosVinculados: lerContatosOrgao(o),
      });
    } catch (_) {}
  }
}
