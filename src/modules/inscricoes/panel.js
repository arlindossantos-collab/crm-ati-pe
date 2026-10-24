// Responsabilidade: modules/inscricoes/panel. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "../../app/state.js";
import { ehAdministrador, portalInstitucional } from "../acessos/policies.js";
import { identificacaoUsuario } from "../perfil/index.js";
import { relatorioInscricoesPronto } from "./reports.js";
import { esc } from "../../shared/presentation.js";
import { normalizarLocal } from "../../domain/agenda.js";

export function dadosPainelInscricoes(eventoId, filtros = {}) {
  if (!ehAdministrador())
    throw new Error(
      "Somente o administrador pode consultar o painel geral de inscrições.",
    );
  if (!relatorioInscricoesPronto())
    throw new Error(
      "Aguarde a confirmação das consultas de eventos e inscrições.",
    );
  const evento = prgdState.dbData.eventos.find((e) =>
    [e.firestoreId, e.id].some(
      (id) => id != null && String(id) === String(eventoId),
    ),
  );
  if (!evento)
    throw new Error("Evento não encontrado entre os dados autorizados.");
  const ids = [evento.firestoreId, evento.id]
    .filter((id) => id != null)
    .map(String);
  const nomeRegistro = (lista, id) =>
    lista.find((r) =>
      [r.firestoreId, r.id].some((v) => v != null && String(v) === String(id)),
    )?.nome ||
    id ||
    "Não informado";
  const registros = prgdState.dbData.inscricoes
    .filter((i) => i.eventId != null && ids.includes(String(i.eventId)))
    .map((i) => ({
      registro: i,
      nome:
        i.participanteNome || i.nome || i.email || "Participante não informado",
      email: i.emailInstitucional || i.email || "",
      orgao: String(nomeRegistro(prgdState.dbData.orgaos, i.orgaoId)),
      setor: String(nomeRegistro(prgdState.dbData.setores, i.setorId)),
      protocolo: String(i.protocolo || i.firestoreId || i.id || ""),
      situacao:
        i.modeloInscricao !== prgdState.MODELO_INSCRICAO
          ? "legada"
          : ["confirmada", "cancelada"].includes(i.situacao)
            ? i.situacao
            : "nao-informada",
    }));
  const total = (situacao) =>
    registros.filter((i) => i.situacao === situacao).length;
  const confirmadas = total("confirmada"),
    canceladas = total("cancelada"),
    legadas = total("legada"),
    indefinidas = total("nao-informada");
  const institucional = evento.modeloInscricao === prgdState.MODELO_INSCRICAO;
  const capacidade =
    Number.isInteger(evento.limiteVagas) && evento.limiteVagas > 0
      ? evento.limiteVagas
      : null;
  const contador =
    Number.isInteger(evento.inscritosCount) && evento.inscritosCount >= 0
      ? evento.inscritosCount
      : null;
  const conferir =
    institucional &&
    (capacidade === null ||
      contador === null ||
      contador > capacidade ||
      contador !== confirmadas ||
      legadas > 0 ||
      indefinidas > 0);
  const texto = normalizarLocal(filtros.busca);
  const filtradas = registros
    .filter(
      (i) =>
        (!filtros.situacao || i.situacao === filtros.situacao) &&
        (!filtros.orgao ||
          String(i.registro.orgaoId || "") === filtros.orgao) &&
        (!texto ||
          [i.nome, i.email, i.orgao, i.setor, i.protocolo].some((v) =>
            normalizarLocal(v).includes(texto),
          )),
    )
    .sort(
      (a, b) =>
        String(a.nome).localeCompare(String(b.nome), "pt-BR") ||
        a.protocolo.localeCompare(b.protocolo),
    );
  const orgaos = [
    ...new Map(
      registros
        .filter((i) => i.registro.orgaoId)
        .map((i) => [String(i.registro.orgaoId), i.orgao]),
    ).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  return {
    evento,
    registros: filtradas,
    total: registros.length,
    orgaos,
    confirmadas,
    canceladas,
    legadas,
    indefinidas,
    capacidade,
    contador,
    conferir,
    institucional,
    vagas: institucional && !conferir ? capacidade - contador : null,
  };
}

export function painelInscricoesHtml(evento) {
  return `<section id="painel-inscricoes-evento" data-evento-id="${esc(evento.firestoreId || evento.id)}" class="border-t pt-4 mt-4 space-y-3" aria-label="Inscrições e vagas do evento">
                <div class="flex flex-wrap justify-between items-center gap-2"><h4 class="font-bold text-base text-blue-950">Inscrições e vagas</h4><button type="button" id="painel-inscricoes-csv" data-relatorio-evento="${esc(evento.firestoreId || evento.id)}" disabled class="border rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50">CSV do evento (todas)</button></div>
                <p id="painel-inscricoes-evento-nome" class="font-semibold text-sm text-blue-950 break-words">${esc(evento.titulo || "Evento sem título")}</p>
                <p class="text-xs text-slate-500">Resumo do evento completo. Os filtros abaixo afetam somente a lista; o CSV inclui todas as inscrições do evento. Inscrição não comprova presença.</p>
                <div id="painel-inscricoes-resumo" class="grid grid-cols-2 sm:grid-cols-3 gap-2"></div>
                <p id="painel-inscricoes-conferencia" role="status" class="text-xs text-amber-900"></p>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <label class="font-semibold min-w-0">Buscar participante<input id="painel-inscricoes-busca" type="search" placeholder="Nome, e-mail ou protocolo" class="block w-full border rounded-lg p-2 mt-1 font-normal"></label>
                    <label class="font-semibold min-w-0">Situação<select id="painel-inscricoes-situacao" class="block w-full border rounded-lg p-2 mt-1 font-normal"><option value="">Todas</option><option value="confirmada">Confirmadas</option><option value="cancelada">Canceladas</option><option value="legada">Fluxo anterior</option><option value="nao-informada">Situação não informada</option></select></label>
                    <label class="font-semibold min-w-0">Órgão<select id="painel-inscricoes-orgao" class="block w-full border rounded-lg p-2 mt-1 font-normal"><option value="">Todos os órgãos</option></select></label>
                </div>
                <div class="flex flex-wrap justify-between items-center gap-2"><p id="painel-inscricoes-status" role="status" class="text-xs text-slate-600"></p><button type="button" id="painel-inscricoes-limpar" class="text-xs border rounded-lg px-3 py-2 text-blue-900">Limpar filtros da lista</button></div>
                <p id="painel-inscricoes-feedback" role="status" class="text-sm text-blue-900"></p><div id="painel-inscricoes-lista" class="space-y-2"></div>
            </section>`;
}

export function atualizarPainelInscricoesEvento() {
  const painel = document.getElementById("painel-inscricoes-evento"),
    id = painel?.getAttribute?.("data-evento-id");
  if (!id) return;
  if (!ehAdministrador()) {
    painel.innerHTML = "";
    painel.removeAttribute("data-evento-id");
    return;
  }
  const resumo = document.getElementById("painel-inscricoes-resumo"),
    lista = document.getElementById("painel-inscricoes-lista"),
    status = document.getElementById("painel-inscricoes-status"),
    conferencia = document.getElementById("painel-inscricoes-conferencia"),
    csv = document.getElementById("painel-inscricoes-csv");
  const val = (id) => document.getElementById(id)?.value || "";
  try {
    const dados = dadosPainelInscricoes(id, {
      busca: val("painel-inscricoes-busca"),
      situacao: val("painel-inscricoes-situacao"),
      orgao: val("painel-inscricoes-orgao"),
    });
    document.getElementById("painel-inscricoes-evento-nome").textContent =
      dados.evento.titulo || "Evento sem título";
    const indicadores = [
      ["capacidade", "Capacidade", dados.capacidade ?? "Não informada"],
      ["confirmadas", "Confirmadas", dados.confirmadas],
      ["canceladas", "Canceladas", dados.canceladas],
      ["legadas", "Fluxo anterior", dados.legadas],
      ["indefinidas", "Situação não informada", dados.indefinidas],
      ["vagas", "Vagas disponíveis", dados.vagas ?? "Não confirmadas"],
    ];
    resumo.innerHTML = indicadores
      .map(
        ([id, nome, valor]) =>
          `<div class="rounded-xl border bg-slate-50 p-3"><p class="text-[11px] text-slate-600">${nome}</p><p data-inscricoes-total="${id}" class="font-bold text-lg text-blue-950">${esc(valor)}</p></div>`,
      )
      .join("");
    conferencia.className =
      "text-xs " +
      (dados.institucional && !dados.conferir
        ? "text-emerald-800"
        : "text-amber-900");
    conferencia.textContent = !dados.institucional
      ? "Evento do fluxo anterior: não há cálculo automático de vagas ou confirmação das inscrições antigas."
      : dados.conferir
        ? "Contagem em conferência: aguarde a atualização dos dados. Se persistir, solicite revisão à GRGD. Nenhum contador foi corrigido automaticamente."
        : `Contador do evento: ${dados.contador}. Confere com as inscrições institucionais confirmadas carregadas.`;
    const orgaos = document.getElementById("painel-inscricoes-orgao"),
      anterior = orgaos.value;
    const opcoes =
      '<option value="">Todos os órgãos</option>' +
      dados.orgaos
        .map(([id, nome]) => `<option value="${esc(id)}">${esc(nome)}</option>`)
        .join("") +
      (anterior && !dados.orgaos.some(([id]) => id === anterior)
        ? `<option value="${esc(anterior)}">Órgão sem inscrições neste evento</option>`
        : "");
    if (orgaos.innerHTML !== opcoes) orgaos.innerHTML = opcoes;
    orgaos.value = anterior;
    const rotulos = {
      confirmada: "Confirmada",
      cancelada: "Cancelada",
      legada: "Fluxo anterior — situação não confirmada",
      "nao-informada": "Situação não informada",
    };
    lista.innerHTML =
      dados.registros
        .map(
          (i) =>
            `<article class="border rounded-xl p-3 bg-white text-xs space-y-2"><div class="flex flex-wrap justify-between gap-2"><h5 class="font-bold text-slate-900 break-words">${esc(i.nome)}</h5><span class="${i.situacao === "confirmada" ? "text-emerald-800 bg-emerald-50" : i.situacao === "cancelada" ? "text-slate-600 bg-slate-100" : "text-amber-900 bg-amber-50"} rounded px-2 py-1">${rotulos[i.situacao]}</span></div><p class="break-all text-slate-600">${esc(i.email || "E-mail não informado")}</p><p class="break-words"><b>Órgão:</b> ${esc(i.orgao)} · <b>Setor:</b> ${esc(i.setor)}</p><p class="break-all text-slate-500"><b>Protocolo / referência:</b> ${esc(i.protocolo || "Não informado")}</p>${i.registro.modeloInscricao === prgdState.MODELO_INSCRICAO ? `<div class="flex flex-wrap gap-2"><button type="button" data-comprovante="${esc(i.registro.id)}" class="border rounded-lg px-3 py-2">Comprovante</button>${i.situacao === "confirmada" ? `<button type="button" data-inscricao-cancelar="${esc(i.registro.id)}" ${prgdState.portalOperacao ? "disabled" : ""} class="border rounded-lg px-3 py-2 disabled:opacity-50">Cancelar inscrição</button>` : ""}</div>` : ""}</article>`,
        )
        .join("") ||
      '<p class="text-sm text-slate-500 py-3">Nenhuma inscrição encontrada. Revise os filtros da lista.</p>';
    status.textContent = `${dados.registros.length} de ${dados.total} inscrições do evento.`;
    csv.disabled = false;
  } catch (err) {
    resumo.innerHTML = "";
    lista.innerHTML = "";
    conferencia.textContent = "";
    csv.disabled = true;
    document.getElementById("painel-inscricoes-orgao").innerHTML =
      '<option value="">Todos os órgãos</option>';
    status.textContent =
      prgdState.agendaLocaisEstado === "erro" ||
      prgdState.inscricoesRelatorioEstado === "erro"
        ? "Não foi possível confirmar as consultas. Os dados do painel foram removidos."
        : !relatorioInscricoesPronto()
          ? "Carregando eventos e inscrições. Aguarde a confirmação das consultas."
          : err.message;
  }
}

export function mensagemPainelInscricoes(eventoId, texto) {
  const painel = document.getElementById("painel-inscricoes-evento");
  if (
    ehAdministrador() &&
    painel?.getAttribute?.("data-evento-id") === String(eventoId)
  )
    document.getElementById("painel-inscricoes-feedback").textContent = texto;
}

export function inscricoesEventoHtml(evento) {
  if (ehAdministrador()) return painelInscricoesHtml(evento);
  const ids = [String(evento.id), String(evento.firestoreId || evento.id)];
  const lista = prgdState.dbData.inscricoes.filter((i) =>
    ids.includes(String(i.eventId)),
  );
  return `<section class="border-t pt-3 mt-4"><h4 class="font-bold text-sm mb-2">${ehAdministrador() || prgdState.currentUser?.acessoInstitucional?.papel === "grgd" ? "Inscrições" : portalInstitucional() ? "Inscrições do órgão" : "Minha inscrição"}</h4><div class="space-y-2">${lista.map((i) => `<div class="p-2 rounded-lg bg-slate-50 text-xs">${identificacaoUsuario({ uid: i.uid, nome: i.participanteNome || i.nome || i.email || "Participante" })}${i.modeloInscricao === prgdState.MODELO_INSCRICAO ? " · " + esc(i.situacao) : ""}${ehAdministrador() && i.modeloInscricao === prgdState.MODELO_INSCRICAO ? ` <button type="button" data-comprovante="${esc(i.id)}" class="border rounded px-2 py-1">Comprovante</button>${i.situacao === "confirmada" ? ` <button type="button" data-inscricao-cancelar="${esc(i.id)}" class="border rounded px-2 py-1">Cancelar inscrição</button>` : ""}` : ""}</div>`).join("") || '<p class="text-xs text-slate-500">Nenhuma inscrição disponível.</p>'}</div></section>`;
}
