// Responsabilidade: modules/eventos/index. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "../../app/state.js";
import {
  ehAdministrador,
  podeAcao,
  portalInstitucional,
} from "../acessos/policies.js";
import {
  gestorPode,
  eventoElegivelInstitucional,
} from "../colaboradores/index.js";
import { identificacaoUsuario } from "../perfil/index.js";
import { atualizarPainelInscricoesEvento } from "../inscricoes/panel.js";
import {
  formatarData,
  normalizarUrl,
  renderAuditInfo,
  esc,
} from "../../shared/presentation.js";
import { relatorioInscricoesPronto } from "../inscricoes/reports.js";
import {
  eventoEncerrado,
  consultarAgendaEventos,
  numeroLocal,
  diaEventoLocal,
  horarioEventoLocal,
  normalizarLocal,
} from "../../domain/agenda.js";
import { idLocal } from "../locais/index.js";

export function atualizarOpcoesConsultaEventos(id, campo, lista, rotulo) {
  const el = document.getElementById(id);
  if (!el) return;
  const selecionado = el.value;
  const valores = [
    ...new Set(lista.map((e) => String(e[campo] || "").trim()).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const html =
    '<option value="">' +
    rotulo +
    "</option>" +
    valores
      .map((v) => '<option value="' + esc(v) + '">' + esc(v) + "</option>")
      .join("");
  if (el.innerHTML !== html) el.innerHTML = html;
  el.value = valores.includes(selecionado) ? selecionado : "";
}

export function limparConsultaEventos() {
  prgdState.buscaEventosVal = "";
  prgdState.filtroEventoAtual = "futuros";
  [
    "busca-eventos",
    "filtro-evento-status",
    "filtro-evento-tipo",
    "filtro-evento-de",
    "filtro-evento-ate",
    "ordenacao-eventos",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

export function renderEventos() {
  const grid = document.getElementById("grid-eventos");
  if (!grid) return;
  const agora = new Date();
  const gruposUser = prgdState.currentUser?.grupos || [];
  const visiveis = prgdState.dbData.eventos.filter(
    (e) =>
      ehAdministrador() ||
      (prgdState.currentUser?.acessoInstitucional?.papel === "grgd" &&
        podeAcao("eventos")) ||
      e.eventoPublico ||
      !e.gruposPermitidos?.length ||
      e.gruposPermitidos.some((g) => gruposUser.includes(g)) ||
      (portalInstitucional() &&
        e.orgaosElegiveis?.includes(
          prgdState.currentUser.acessoInstitucional.orgaoId,
        )),
  );
  atualizarOpcoesConsultaEventos(
    "filtro-evento-status",
    "status",
    visiveis,
    "Todas as situações",
  );
  atualizarOpcoesConsultaEventos(
    "filtro-evento-tipo",
    "tipoEvento",
    visiveis,
    "Todos os tipos",
  );
  const valor = (id) => document.getElementById(id)?.value || "";
  const consulta = consultarAgendaEventos(
    visiveis,
    {
      periodo: prgdState.filtroEventoAtual,
      busca: prgdState.buscaEventosVal,
      status: valor("filtro-evento-status"),
      tipo: valor("filtro-evento-tipo"),
      de: valor("filtro-evento-de"),
      ate: valor("filtro-evento-ate"),
      ordem: valor("ordenacao-eventos"),
    },
    agora,
  );
  const filtrados = consulta.eventos;
  document.getElementById("count-eventos").textContent = filtrados.length;
  document.getElementById("eventos-filtros-erro").textContent = consulta.erro;
  document.getElementById("eventos-resultado-consulta").textContent =
    consulta.erro
      ? "Consulta não realizada. Corrija o período informado."
      : `${filtrados.length} de ${visiveis.length} eventos carregados neste acesso.`;
  for (const [periodo, id] of [
    ["futuros", "filtro-evento-futuros"],
    ["realizados", "filtro-evento-realizados"],
    ["todos", "filtro-evento-todos"],
  ]) {
    const btn = document.getElementById(id);
    if (!btn) continue;
    const ativo = prgdState.filtroEventoAtual === periodo;
    btn.className =
      "px-3 py-1.5 rounded-md transition " +
      (ativo
        ? "bg-white text-blue-900 shadow-sm font-bold"
        : "text-slate-600 hover:text-slate-900");
    btn.setAttribute("aria-pressed", String(ativo));
  }

  const podeExportar = relatorioInscricoesPronto();
  const btnRelatorio = document.getElementById("btn-relatorio-geral-eventos");
  if (btnRelatorio) btnRelatorio.disabled = !podeExportar;
  const avisoRelatorio = document.getElementById("eventos-relatorio-status");
  if (avisoRelatorio)
    avisoRelatorio.textContent = !ehAdministrador()
      ? ""
      : prgdState.agendaLocaisEstado === "erro"
        ? "Falha ao carregar eventos: exportação indisponível."
        : prgdState.inscricoesRelatorioEstado === "erro"
          ? "Falha ao carregar inscrições: exportação indisponível."
          : podeExportar
            ? "Relatório geral considera todas as inscrições carregadas, sem os filtros da agenda. Inscrições não comprovam presença."
            : "Carregando dados para os relatórios. Aguarde a confirmação das consultas.";
  const statusPortal = document.getElementById("eventos-portal-status");
  if (statusPortal) {
    const portal = portalInstitucional(),
      carregando =
        portal &&
        (prgdState.portalCarregando.eventos_publicos ||
          prgdState.portalCarregando.eventos_elegiveis),
      erro =
        portal &&
        (prgdState.portalErros.eventos_publicos ||
          prgdState.portalErros.eventos_elegiveis);
    statusPortal.classList.toggle("hidden", !portal);
    statusPortal.textContent = !portal
      ? ""
      : carregando
        ? "Carregando eventos do seu órgão…"
        : erro
          ? "Não foi possível confirmar todas as consultas de eventos. Os dados das consultas recusadas foram removidos. Procure a GRGD."
          : filtrados.length
            ? "Eventos públicos e eventos destinados ao seu órgão. A inscrição depende do período, das vagas e da sua autorização."
            : "Nenhum evento encontrado neste filtro. Limpe os filtros, confira Todos ou solicite à GRGD a inclusão do seu órgão nos órgãos elegíveis de um novo evento institucional.";
  }
  grid.innerHTML =
    filtrados
      .map((e) => {
        const real = eventoEncerrado(e, agora);
        const vagas = Number(e.limiteVagas || 0);
        const idsEvento = [String(e.id), String(e.firestoreId || e.id)];
        const inscritosReal =
          e.modeloInscricao === prgdState.MODELO_INSCRICAO
            ? e.inscritosCount
            : ehAdministrador() ||
                (prgdState.currentUser?.acessoInstitucional?.papel === "grgd" &&
                  podeAcao("relatorios"))
              ? (prgdState.dbData.inscricoes || []).filter((i) =>
                  idsEvento.includes(String(i.eventId)),
                ).length
              : Number.isFinite(e.inscritosCount)
                ? e.inscritosCount
                : null;
        const lotado =
          vagas > 0 && inscritosReal !== null && inscritosReal >= vagas;
        const minha = !!(prgdState.dbData.inscricoes || []).some(
          (i) =>
            idsEvento.includes(String(i.eventId)) &&
            i.uid === prgdState.currentUser?.uid,
        );
        const bannerImg = normalizarUrl(e.imagemCard);
        const audit = renderAuditInfo(e);
        const isAdmin = ehAdministrador();
        const cardBgClass = real
          ? "bg-slate-100 border-slate-300 opacity-95 grayscale-[20%]"
          : "bg-white border-slate-200";
        const headerBgClass = real
          ? "bg-slate-700 text-slate-200"
          : "bg-blue-900 text-white";
        const situacao = normalizarLocal(e.status),
          classeSituacao =
            situacao === "cancelado"
              ? "text-rose-800 bg-rose-100"
              : situacao === "confirmado" || situacao === "realizado"
                ? "text-emerald-800 bg-emerald-100"
                : situacao === "planejado"
                  ? "text-amber-800 bg-amber-100"
                  : "text-slate-700 bg-slate-100";

        return `<article class="${cardBgClass} rounded-2xl border shadow-sm overflow-hidden flex flex-col transition hover:shadow-md">
                    ${bannerImg ? `<div class="relative w-full h-44 bg-slate-900 overflow-hidden"><img src="${esc(bannerImg)}" class="w-full h-full object-cover" alt="Capa"><div class="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex items-end p-3"><h3 class="text-white font-black text-base tracking-wide drop-shadow line-clamp-2">${esc(e.titulo)}</h3></div></div>` : `<div class="w-full h-32 ${headerBgClass} flex items-center justify-center font-black text-base px-4 text-center tracking-wide"><i class="fa-solid fa-calendar-days mr-2"></i> ${esc(e.titulo)}</div>`}
                    <div class="p-5 flex flex-col flex-1">
                        <div class="flex justify-between gap-2 items-center"><span class="${real ? "bg-slate-200 text-slate-700" : "bg-amber-100 text-amber-800"} text-[10px] font-bold px-2.5 py-1 rounded-full">${esc(e.tipoEvento || "Tipo não informado")}</span><span class="text-[10px] font-bold ${classeSituacao} px-2 py-0.5 rounded">${esc(e.status || "Situação não informada")}</span></div>
                        <h4 class="font-bold text-base mt-2 ${real ? "text-slate-700" : "text-slate-900"}">${esc(e.titulo)}</h4>
                        <p class="text-xs ${real ? "text-slate-600" : "text-indigo-900"} font-semibold mt-1"><i class="fa-solid fa-chalkboard-user mr-1"></i> ${identificacaoUsuario({ nome: e.palestrante || "Equipe ATI", uid: e.palestranteUid })}</p>
                        <p class="text-xs text-slate-500 mt-2 line-clamp-2">${esc(e.descricao || e.textoCard || "")}</p>
                        <div class="mt-3 text-xs space-y-1.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                            <div><i class="fa-solid fa-calendar text-blue-800 mr-1.5"></i> ${formatarData(e.dataInicio)}${e.dataFim && e.dataFim !== e.dataInicio ? " a " + formatarData(e.dataFim) : ""}</div>
                            <div><i class="fa-solid fa-location-dot text-purple-700 mr-1.5"></i> ${esc(e.localEvento || "Local não informado")}</div>
                            <div><i class="fa-solid fa-users text-emerald-700 mr-1.5"></i> ${inscritosReal === null ? (vagas ? `Capacidade: ${vagas} vagas` : "Vagas não informadas") : vagas ? `${inscritosReal}/${vagas} vagas` : `${inscritosReal} inscritos`}</div>
                        </div>
                        <div class="pt-3 border-t mt-3 flex justify-between text-[11px] text-slate-500"><span>${audit.dataHtml}</span><span>Por: ${audit.autorHtml}</span></div>
                        <div class="mt-auto pt-4 flex flex-wrap gap-2 items-center">
                            ${e.modeloInscricao !== prgdState.MODELO_INSCRICAO && podeAcao("inscricoes", "propria") && !minha && !lotado && !real ? `<button type="button" data-acao-inscricao="${esc(e.firestoreId || e.id)}" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3.5 py-2 rounded-xl font-bold cursor-pointer transition shadow-sm flex items-center gap-1.5"><i class="fa-solid fa-user-check"></i> Inscrever-se</button>` : ""}
                            ${gestorPode("inscricoes.criar") && eventoElegivelInstitucional(e) && !real ? `<button type="button" data-inscrever-colaborador="${esc(e.firestoreId || e.id)}" class="bg-blue-900 text-white text-xs px-3 py-2 rounded-xl font-bold">Inscrever colaborador</button>` : ""}
                            <div class="flex items-center gap-1 ml-auto">
                                ${isAdmin ? `<button type="button" data-painel-inscricoes="${esc(e.firestoreId || e.id)}" class="border rounded-xl px-3 py-2 text-xs font-bold text-blue-900" aria-label="Ver inscrições do evento ${esc(e.titulo)}">Inscrições</button><button type="button" data-relatorio-evento="${esc(e.firestoreId || e.id)}" ${podeExportar ? "" : "disabled"} class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs px-2.5 py-2 rounded-xl font-bold cursor-pointer" title="Exportar inscrições do evento (CSV)" aria-label="Exportar inscrições do evento ${esc(e.titulo)}"><i class="fa-solid fa-file-excel"></i></button>` : ""}
                                <button type="button" class="tr-detalhe border bg-white hover:bg-slate-100 text-slate-700 text-xs px-3 py-2 rounded-xl font-bold cursor-pointer" data-colecao="eventos" data-id="${esc(e.firestoreId || e.id)}">Detalhes</button>
                            </div>
                        </div>
                    </div>
                </article>`;
      })
      .join("") ||
    '<p class="text-slate-500 text-sm col-span-full text-center py-8">Nenhum evento encontrado. Revise os filtros ou use Todos para consultar a agenda completa disponível ao seu perfil.</p>';
  atualizarPainelInscricoesEvento();
}

export function camposAgendaEvento(item = {}, novo = false) {
  const iid = String(item.localId || ""),
    escolhido = prgdState.dbData.locais.some((l) => idLocal(l) === iid);
  const input = (id, label, value, type = "text", extra = "") =>
    '<label class="text-xs font-bold">' +
    label +
    '<input id="evt-' +
    id +
    '" type="' +
    type +
    '" value="' +
    esc(value ?? "") +
    '" ' +
    extra +
    ' class="block w-full border rounded-lg p-2 mt-1 font-normal"></label>';
  return (
    '<fieldset class="border-t mt-4 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3"><legend class="font-bold text-xs">Local, agenda e locação</legend><label class="text-xs font-bold">Local cadastrado<select id="evt-local-id" class="block w-full border rounded-lg p-2 mt-1 font-normal"><option value="">Sem vínculo; informar local em texto</option>' +
    (!escolhido && iid
      ? '<option value="' +
        esc(iid) +
        '" selected>Local anteriormente vinculado (não carregado)</option>'
      : "") +
    prgdState.dbData.locais
      .map(
        (l) =>
          '<option value="' +
          esc(idLocal(l)) +
          '" ' +
          (iid === idLocal(l) ? "selected" : "") +
          ">" +
          esc(l.nome || "Sem nome") +
          "</option>",
      )
      .join("") +
    "</select></label>" +
    input(
      "local-texto",
      "Local em texto / observação",
      item.localEvento || "",
    ) +
    input(
      "data-inicio",
      "Data inicial",
      diaEventoLocal(item.dataInicio),
      "date",
      novo ? "required" : "",
    ) +
    input(
      "data-fim",
      "Data final (opcional)",
      diaEventoLocal(item.dataFim),
      "date",
    ) +
    input(
      "hora-inicio",
      "Horário inicial (opcional)",
      horarioEventoLocal(item, "dataInicio"),
      "time",
    ) +
    input(
      "hora-fim",
      "Horário final (opcional)",
      horarioEventoLocal(item, "dataFim"),
      "time",
    ) +
    input(
      "custo",
      "Custo total previsto da locação (R$)",
      item.custoLocacaoPrevisto ?? "",
      "text",
      'inputmode="decimal" placeholder="Total deste evento, não a tarifa"',
    ) +
    '<label class="text-xs font-bold">Situação<select id="evt-status" class="block w-full border rounded-lg p-2 mt-1 font-normal">' +
    [
      ...new Set([
        "",
        "Planejado",
        "Confirmado",
        "Realizado",
        "Cancelado",
        item.status || "",
      ]),
    ]
      .map(
        (s) =>
          '<option value="' +
          esc(s) +
          '" ' +
          ((item.status || "") === s ? "selected" : "") +
          ">" +
          esc(s || "Não informado") +
          "</option>",
      )
      .join("") +
    '</select></label><p class="text-xs text-slate-500 sm:col-span-2">O vínculo pelo local evita confusão entre espaços com o mesmo nome. A consulta de disponibilidade é indicativa e não garante uma reserva. Sem horário, o evento pode ocupar todo o período.</p></fieldset>'
  );
}

export function lerAgendaEvento(anterior = {}, novo = false) {
  const val = (k) => (document.getElementById("evt-" + k)?.value || "").trim();
  const localId = val("local-id"),
    local = prgdState.dbData.locais.find((l) => idLocal(l) === localId);
  if (localId && !local && localId !== String(anterior.localId || ""))
    throw new Error("Selecione um local cadastrado.");
  const inicio = val("data-inicio"),
    fim = val("data-fim"),
    hi = val("hora-inicio"),
    hf = val("hora-fim");
  if (
    (novo && !inicio) ||
    (inicio && diaEventoLocal(inicio) !== inicio) ||
    (fim && diaEventoLocal(fim) !== fim) ||
    (fim && (!inicio || fim < inicio))
  )
    throw new Error(
      "Informe um período válido, com fim igual ou posterior ao início.",
    );
  const agendaLegadaIntacta =
    !novo &&
    inicio === diaEventoLocal(anterior.dataInicio) &&
    fim === diaEventoLocal(anterior.dataFim) &&
    hi === horarioEventoLocal(anterior, "dataInicio") &&
    hf === horarioEventoLocal(anterior, "dataFim");
  if (
    !agendaLegadaIntacta &&
    (!!hi !== !!hf ||
      ((hi || hf) && !inicio) ||
      (hi &&
        (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hi) ||
          !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hf) ||
          ((!fim || fim === inicio) && hf <= hi))))
  )
    throw new Error(
      "Informe ambos os horários; no mesmo dia, o fim deve ser posterior ao início.",
    );
  const custo = numeroLocal(val("custo"));
  if (val("custo") && custo === null)
    throw new Error(
      "Informe um custo de locação válido ou deixe sem informação.",
    );
  return {
    localId,
    localEvento: local ? local.nome || "" : val("local-texto"),
    dataInicio:
      inicio === diaEventoLocal(anterior.dataInicio) &&
      hi === horarioEventoLocal(anterior, "dataInicio")
        ? anterior.dataInicio || ""
        : inicio,
    dataFim:
      fim === diaEventoLocal(anterior.dataFim) &&
      hf === horarioEventoLocal(anterior, "dataFim")
        ? anterior.dataFim || ""
        : fim,
    horaInicio: hi,
    horaFim: hf,
    custoLocacaoPrevisto: custo,
    status: val("status"),
  };
}
