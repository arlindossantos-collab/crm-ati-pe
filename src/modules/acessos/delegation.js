import { dataHoraLocalFormulario } from "../../domain/display.js";
// Responsabilidade: modules/acessos/delegation. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "../../app/state.js";
import {
  ehAdministrador,
  nomeAcaoInstitucional,
  acessoInstitucionalAtivo,
} from "./policies.js";
import { adicionarComHistorico } from "../auditoria/index.js";
import { uidCadastro } from "../../shared/identity.js";
import { traduzirErroSistema, esc } from "../../shared/presentation.js";
import { collection, serverTimestamp } from "../../services/firebase.js";

export function camposVinculo(usuario) {
  const v = usuario.acessoInstitucional || {},
    cls = "w-full border rounded-lg p-2 bg-white text-xs";
  const input = (id, label, value = "", type = "text") =>
    `<label class="block">${label}<input id="vinculo-${id}" type="${type}" value="${esc(value)}" class="${cls}"></label>`;
  const data = dataHoraLocalFormulario;
  return `<fieldset class="md:col-span-2 border rounded-xl p-3"><legend class="font-bold px-1">Vínculo institucional</legend><p class="text-slate-500 mb-3">Defina o papel, o órgão, os setores e as ações autorizadas. Responsáveis e referências de aprovação são opcionais; a ativação é registrada com seu usuário e horário.</p><div class="grid md:grid-cols-2 gap-3">
                <label>Papel institucional<select id="vinculo-papel" class="${cls}"><option value="">Manter acesso anterior (sem novo vínculo)</option>${Object.entries(
                  prgdState.PAPEIS_INSTITUCIONAIS,
                )
                  .map(
                    ([k, p]) =>
                      `<option value="${k}" ${v.papel === k ? "selected" : ""}>${p.nome}</option>`,
                  )
                  .join("")}</select></label>
                <label>Situação<select id="vinculo-situacao" class="${cls}">${["pendente", "aprovado", "suspenso"].map((s) => `<option ${v.situacao === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>
                <label>Órgão<select id="vinculo-orgao" class="${cls}"><option value="">Selecione o órgão</option>${prgdState.dbData.orgaos.map((o) => `<option value="${esc(o.firestoreId || o.id)}" ${String(o.firestoreId || o.id) === v.orgaoId ? "selected" : ""}>${esc(o.sigla || o.nome)} - ${esc(o.nome)}</option>`).join("")}</select></label>
                <label>Setores delegados (até 5)<select id="vinculo-setores" multiple class="${cls}"></select><span class="text-slate-500">Sem seleção: todo o órgão. Use Ctrl/Command para vários.</span></label>
                ${input("inicio", "Início", data(v.inicio), "datetime-local")}${input("fim", "Validade até", data(v.fim), "datetime-local")}${input("revisao", "Próxima revisão até", data(v.revisao), "datetime-local")}
                <label>Titular (somente substituto)<select id="vinculo-titular" class="${cls}"><option value="">Selecione</option>${prgdState.dbData.usuarios
                  .filter(
                    (u) =>
                      u.acessoInstitucional?.papel === "gestor_nsi" &&
                      uidCadastro(u) !== uidCadastro(usuario),
                  )
                  .map(
                    (u) =>
                      `<option value="${esc(uidCadastro(u))}" ${v.titularUid === uidCadastro(u) ? "selected" : ""}>${esc(u.nome || u.email)}</option>`,
                  )
                  .join("")}</select></label>
                ${input("grgd-nome", "Responsável pela aprovação GRGD (opcional)", v.aprovacaoGrgd?.responsavel)}${input("grgd-ref", "Referência da aprovação GRGD (opcional)", v.aprovacaoGrgd?.referencia)}${input("autoridade-nome", "Autoridade do órgão / ATI (opcional)", v.aprovacaoAutoridade?.responsavel)}${input("autoridade-ref", "Referência da aprovação da autoridade (opcional)", v.aprovacaoAutoridade?.referencia)}
                <label class="md:col-span-2 bg-blue-50 border rounded-lg p-3"><input id="vinculo-operacoes" type="checkbox" ${v.operacoesVersao === "v1" ? "checked" : ""}> Habilitar cadastro e inscrições institucionais.<span class="block text-xs text-slate-500 mt-1">Liberação expressa pelo administrador. Responsáveis e referências são opcionais. O substituto também depende da liberação do titular.</span></label><fieldset class="md:col-span-2 border rounded-lg p-2"><legend class="font-bold">Ações expressamente autorizadas</legend><div id="vinculo-acoes" class="grid md:grid-cols-2 gap-2"></div></fieldset>
                </div><p class="text-slate-500 mt-2">Participante sem login é cadastrado como pessoa, sem receber perfil ou conta. LDAP será integrado na migração institucional.</p></fieldset>`;
}

export function atualizarCamposVinculo(selecionados = null) {
  const papel = document.getElementById("vinculo-papel");
  if (!papel) return;
  const anterior =
    prgdState.dbData.usuarios.find(
      (u) => uidCadastro(u) === document.getElementById("edit-doc-id").value,
    )?.acessoInstitucional || {};
  const acoes =
    selecionados ||
    Array.from(document.querySelectorAll('[name="vinculo-acao"]:checked')).map(
      (el) => el.value,
    );
  const box = document.getElementById("vinculo-acoes");
  box.innerHTML =
    (prgdState.PAPEIS_INSTITUCIONAIS[papel.value]?.acoes || [])
      .map(
        (a) =>
          `<label><input type="checkbox" name="vinculo-acao" value="${a}" ${acoes.includes(a) ? "checked" : ""}> ${esc(nomeAcaoInstitucional(a))}</label>`,
      )
      .join("") || "<p>Selecione um papel para definir suas ações.</p>";
  const orgaoCampo = document.getElementById("vinculo-orgao");
  const grgd = papel.value === "grgd";
  orgaoCampo.disabled = grgd;
  if (grgd) orgaoCampo.value = "";
  const orgao = orgaoCampo.value;
  const setores = document.getElementById("vinculo-setores");
  const ids = Array.from(setores.selectedOptions || []).map((o) => o.value);
  const marcados = selecionados !== null ? anterior.setoresIds || [] : ids;
  const disponiveis = (prgdState.dbData.setores || []).filter(
    (s) => s.orgaoId === orgao && s.ativo !== false,
  );
  const anteriores =
    orgao === anterior.orgaoId
      ? marcados.filter((id) => !disponiveis.some((s) => s.id === id))
      : [];
  setores.innerHTML =
    disponiveis
      .map(
        (s) =>
          `<option value="${esc(s.id)}" ${marcados.includes(s.id) ? "selected" : ""}>${esc(s.nome)}</option>`,
      )
      .join("") +
    anteriores
      .map(
        (id, indice) =>
          `<option value="${esc(id)}" selected>Setor anterior indisponível — referência ${indice + 1} (revisar)</option>`,
      )
      .join("");
  setores.disabled = grgd;
  document.getElementById("vinculo-titular").disabled =
    papel.value !== "substituto";
  const operacoes = document.getElementById("vinculo-operacoes");
  operacoes.disabled = !["gestor_nsi", "substituto"].includes(papel.value);
  if (operacoes.disabled) operacoes.checked = false;
}

export function lerVinculoInstitucional(anterior = {}) {
  const el = document.getElementById("vinculo-papel");
  if (!el) return anterior.acessoInstitucional;
  if (!el.value) {
    if (anterior.acessoInstitucional)
      throw new Error(
        "Para retirar o novo acesso, suspenda o vínculo. Não é permitido restaurar permissões legadas por este formulário.",
      );
    return undefined;
  }
  const val = (id) =>
    (document.getElementById("vinculo-" + id)?.value || "").trim();
  const papel = el.value,
    orgaoId = papel === "grgd" ? "" : val("orgao");
  if (!prgdState.PAPEIS_INSTITUCIONAIS[papel])
    throw new Error("Papel institucional inválido.");
  const v = {
    papel,
    orgaoId,
    setoresIds:
      papel === "grgd"
        ? []
        : Array.from(
            document.getElementById("vinculo-setores").selectedOptions || [],
          ).map((o) => o.value),
    situacao: val("situacao"),
    inicio: new Date(val("inicio")).getTime(),
    fim: new Date(val("fim")).getTime(),
    revisao: new Date(val("revisao")).getTime(),
    titularUid: papel === "substituto" ? val("titular") : "",
    acoes: Array.from(
      document.querySelectorAll('[name="vinculo-acao"]:checked'),
    ).map((el) => el.value),
    aprovacaoGrgd: {
      responsavel: val("grgd-nome"),
      referencia: val("grgd-ref"),
    },
    aprovacaoAutoridade: {
      responsavel: val("autoridade-nome"),
      referencia: val("autoridade-ref"),
    },
  };
  const liberarOperacoes =
    ["gestor_nsi", "substituto"].includes(papel) &&
    document.getElementById("vinculo-operacoes")?.checked === true;
  if (
    liberarOperacoes ||
    anterior.acessoInstitucional?.operacoesVersao !== undefined
  )
    v.operacoesVersao = liberarOperacoes ? "v1" : "";
  if (
    !["pendente", "aprovado", "suspenso"].includes(v.situacao) ||
    v.setoresIds.length > 5 ||
    !v.acoes.every((a) =>
      prgdState.PAPEIS_INSTITUCIONAIS[papel].acoes.includes(a),
    )
  )
    throw new Error("Revise a situação, os setores e as ações autorizadas.");
  if (
    !Number.isFinite(v.inicio) ||
    !Number.isFinite(v.fim) ||
    !Number.isFinite(v.revisao) ||
    v.fim <= v.inicio ||
    v.revisao > v.fim ||
    v.revisao <= v.inicio
  )
    throw new Error(
      "Informe início, validade e revisão coerentes. A revisão deve ocorrer dentro da validade.",
    );
  if (
    v.situacao === "aprovado" &&
    papel !== "grgd" &&
    !prgdState.dbData.orgaos.some(
      (o) => String(o.firestoreId || o.id) === orgaoId,
    )
  )
    throw new Error("Selecione um órgão cadastrado.");
  if (
    v.situacao === "aprovado" &&
    v.setoresIds.some(
      (id) =>
        !prgdState.dbData.setores.some(
          (s) => s.id === id && s.orgaoId === orgaoId && s.ativo !== false,
        ),
    )
  )
    throw new Error("Há setor inválido para o órgão.");
  if (papel === "substituto" && v.situacao === "aprovado") {
    const titular = prgdState.dbData.usuarios.find(
      (u) => uidCadastro(u) === v.titularUid,
    );
    const t = titular?.acessoInstitucional;
    if (
      !acessoInstitucionalAtivo(titular) ||
      (v.operacoesVersao === "v1" && t?.operacoesVersao !== "v1") ||
      t.papel !== "gestor_nsi" ||
      t.orgaoId !== v.orgaoId ||
      v.inicio < t.inicio ||
      v.fim > t.fim ||
      v.revisao > t.revisao ||
      !v.acoes.every((a) => t.acoes.includes(a)) ||
      (t.setoresIds.length &&
        (!v.setoresIds.length ||
          !v.setoresIds.every((id) => t.setoresIds.includes(id))))
    )
      throw new Error(
        "A delegação não pode exceder as ações, setores ou validade do titular aprovado.",
      );
  }
  const canon = (value) =>
    Array.isArray(value)
      ? value.slice().sort()
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.keys(value)
              .sort()
              .map((k) => [k, canon(value[k])]),
          )
        : value;
  const base = anterior.acessoInstitucional;
  if (base) {
    const { registradoPorUid, registradoEm, ...dados } = base;
    if (JSON.stringify(canon(dados)) === JSON.stringify(canon(v))) return base;
  }
  return {
    ...v,
    registradoPorUid: prgdState.currentUser.uid,
    registradoEm: serverTimestamp(),
  };
}

export function renderGestaoSetores() {
  const el = document.getElementById("gestao-setores-lista");
  if (!el) return;
  if (!ehAdministrador()) {
    el.innerHTML = "";
    document.getElementById("setor-orgao").innerHTML = "";
    return;
  }
  el.innerHTML =
    (prgdState.dbData.setores || [])
      .map(
        (s) =>
          `<p class="py-1">${esc(s.nome)} · ${esc(prgdState.dbData.orgaos.find((o) => String(o.firestoreId || o.id) === s.orgaoId)?.sigla || s.orgaoId)}</p>`,
      )
      .join("") || "<p>Nenhum setor cadastrado.</p>";
  const select = document.getElementById("setor-orgao"),
    atual = select.value;
  select.innerHTML =
    '<option value="">Selecione o órgão</option>' +
    prgdState.dbData.orgaos
      .map(
        (o) =>
          `<option value="${esc(o.firestoreId || o.id)}">${esc(o.sigla || o.nome)}</option>`,
      )
      .join("");
  select.value = atual;
}

export async function salvarSetor(e) {
  e.preventDefault();
  if (!ehAdministrador()) return;
  const nome = document.getElementById("setor-nome").value.trim(),
    orgaoId = document.getElementById("setor-orgao").value;
  if (
    !nome ||
    nome.length > 150 ||
    !prgdState.dbData.orgaos.some(
      (o) => String(o.firestoreId || o.id) === orgaoId,
    )
  )
    return;
  try {
    await adicionarComHistorico(collection(prgdState.db, "setores"), {
      nome,
      orgaoId,
      ativo: true,
    });
    document.getElementById("setor-nome").value = "";
    document.getElementById("setor-msg").textContent = "Setor cadastrado.";
  } catch (err) {
    document.getElementById("setor-msg").textContent = traduzirErroSistema(err);
  }
}
