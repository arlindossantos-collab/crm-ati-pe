// Responsabilidade: modules/demandas/index. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "../../app/state.js";
import { podeAlterarColecao } from "../acessos/policies.js";
import { salvarComHistorico } from "../auditoria/index.js";
import {
  nomesResponsaveis,
  pessoasResponsaveis,
} from "../../shared/identity.js";
import { identificacaoUsuario } from "../perfil/index.js";
import {
  traduzirErroSistema,
  renderizarBolinhaPrioridade,
  renderizarIconeStatus,
  formatarData,
  obterClasseCorCard,
  calcularInfoSemana,
  renderAuditInfo,
  esc,
} from "../../shared/presentation.js";
import { renderizarBadgesResponsaveis } from "../apoio/index.js";
import { doc } from "../../services/firebase.js";

export function historicoDemandaHtml(demanda) {
  const lista = demanda.historicoAcoes || [];
  return lista.length
    ? `<section class="border-t pt-3 space-y-2"><h4 class="font-bold text-sm">Andamentos</h4>${lista.map((h) => `<article class="p-3 rounded-lg bg-slate-50 border text-xs"><div class="flex flex-wrap justify-between gap-2">${identificacaoUsuario({ uid: h.autorUid, nome: h.autor || "Sistema" })}<span class="text-slate-500">${formatarData(h.data)}</span></div><p class="mt-2 whitespace-pre-wrap">${esc(h.texto)}</p></article>`).join("")}</section>`
    : "";
}

export function renderDemandas() {
  const tbody = document.getElementById("tabela-demandas");
  if (!tbody) return;

  let filtered = prgdState.dbData.demandas.filter((d) => {
    const matchStatus =
      !prgdState.filtroDemandaStatusAtual ||
      d.status === prgdState.filtroDemandaStatusAtual;
    const matchPrio =
      !prgdState.filtroDemandaPrioAtual ||
      String(d.prioridade || "")
        .trim()
        .toLowerCase() === prgdState.filtroDemandaPrioAtual.toLowerCase();
    const txt = prgdState.buscaDemandasVal.trim().toLowerCase();
    let matchBusca = true;
    if (txt) {
      const respStr = nomesResponsaveis(d).join(" ");
      const histStr = (d.historicoAcoes || [])
        .map((h) => `${h.autor} ${h.texto}`)
        .join(" ");
      const textoConsolidado = [
        d.titulo,
        d.orgao,
        d.solicitante,
        d.descricao,
        d.categoria,
        d.prioridade,
        d.status,
        respStr,
        histStr,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      matchBusca = textoConsolidado.includes(txt);
    }
    return matchStatus && matchPrio && matchBusca;
  });

  filtered.sort((a, b) => {
    if (prgdState.ordenacaoDemandasAtual === "recente")
      return new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0);
    if (prgdState.ordenacaoDemandasAtual === "antiga")
      return new Date(a.criadoEm || 0) - new Date(b.criadoEm || 0);
    const peso = { alta: 3, média: 2, baixa: 1 };
    return (
      (peso[String(b.prioridade || "").toLowerCase()] || 1) -
      (peso[String(a.prioridade || "").toLowerCase()] || 1)
    );
  });

  document.getElementById("count-demandas").textContent = filtered.length;

  tbody.innerHTML =
    filtered
      .map((d) => {
        const audit = renderAuditInfo(d);
        const bolinhaPrio = renderizarBolinhaPrioridade(d.prioridade);
        const iconeStatus = renderizarIconeStatus(d.status);
        const badgesResp = renderizarBadgesResponsaveis(pessoasResponsaveis(d));
        const corLinhaClara = obterClasseCorCard(d.corCard);
        const dataVal = d.dataLimite || d.dataInicio || "";
        const diaSemanaVal = d.diaSemana || "";
        const { badgeOutraSemana } = calcularInfoSemana(dataVal);
        const badgeOutraSemanaHtml = badgeOutraSemana
          ? `<span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded ml-1" title="Data alocada em outra semana"><i class="fa-solid fa-clock-rotate-left"></i> Outra semana</span>`
          : "";

        return `<tr class="hover:opacity-95 transition-colors ${corLinhaClara} border-b border-slate-200">
                    <td class="p-4 font-bold text-slate-800">${esc(d.solicitante || "Não informado")}<div class="text-[11px] font-normal text-slate-600">${esc(d.orgao || "")}</div></td>
                    <td class="p-4 font-semibold text-blue-900">${esc(d.titulo)}</td>
                    <td class="p-4"><span class="text-xs text-slate-700 line-clamp-2 max-w-xs">${esc(d.descricao || "Sem detalhes")}</span></td>
                    <td class="p-4">${badgesResp}</td>

                    <td class="p-4 text-center">
                        <div class="flex items-center justify-center gap-1 flex-wrap">
                            <input type="date" ${podeAlterarColecao("demandas") ? "" : "disabled"} class="input-data-demanda p-1 border rounded text-xs bg-white font-medium text-blue-900 cursor-pointer shadow-sm" data-firestore-id="${esc(d.firestoreId)}" value="${esc(dataVal)}" title="Escolha uma data específica">
                            ${badgeOutraSemanaHtml}
                        </div>
                    </td>

                    <td class="p-4 text-center">
                        <select ${podeAlterarColecao("demandas") ? "" : "disabled"} class="select-diaselect-demanda p-1 border rounded text-xs bg-white font-medium text-blue-900 cursor-pointer shadow-sm" data-firestore-id="${esc(d.firestoreId)}" title="Escolha o dia da semana">
                            <option value="" ${!diaSemanaVal ? "selected" : ""}>-- Selecionar --</option>
                            <option value="segunda" ${diaSemanaVal === "segunda" ? "selected" : ""}>Segunda</option>
                            <option value="terca" ${diaSemanaVal === "terca" ? "selected" : ""}>Terça</option>
                            <option value="quarta" ${diaSemanaVal === "quarta" ? "selected" : ""}>Quarta</option>
                            <option value="quinta" ${diaSemanaVal === "quinta" ? "selected" : ""}>Quinta</option>
                            <option value="sexta" ${diaSemanaVal === "sexta" ? "selected" : ""}>Sexta</option>
                        </select>
                    </td>

                    <td class="p-4 text-center">${bolinhaPrio}</td>
                    <td class="p-4 text-center">${iconeStatus}</td>
                    <td class="p-4 text-center">
                        <button type="button" class="text-xs bg-slate-100 hover:bg-slate-200 text-blue-900 px-2.5 py-1 rounded font-semibold tr-detalhe border shadow-sm cursor-pointer" data-colecao="demandas" data-id="${esc(d.firestoreId)}"><i class="fa-solid fa-eye mr-1"></i> Detalhes</button>
                    </td>
                </tr>`;
      })
      .join("") ||
    '<tr><td colspan="9" class="text-slate-400 text-sm text-center py-6">Nenhuma demanda encontrada.</td></tr>';

  renderCalendarioEBacklog(filtered);
  renderCalendarioMensal(filtered);
}

export function renderCalendarioEBacklog(listaDemandas) {
  const backlogContainer = document.getElementById("backlog-postits-container");
  const colSeg = document.getElementById("cal-segunda");
  const colTer = document.getElementById("cal-terca");
  const colQua = document.getElementById("cal-quarta");
  const colQui = document.getElementById("cal-quinta");
  const colSex = document.getElementById("cal-sexta");
  if (!backlogContainer) return;

  const backlog = [];
  const diasSemana = {
    segunda: [],
    terca: [],
    quarta: [],
    quinta: [],
    sexta: [],
  };

  listaDemandas.forEach((d) => {
    const dataVal = d.dataLimite || d.dataInicio || "";
    const { diaSemana: diaPorData, badgeOutraSemana } =
      calcularInfoSemana(dataVal);

    if (badgeOutraSemana) {
      backlog.push(d);
      return;
    }

    const diaAtribuido =
      diaPorData ||
      String(d.diaSemana || "")
        .trim()
        .toLowerCase();

    if (diasSemana[diaAtribuido]) {
      diasSemana[diaAtribuido].push(d);
    } else {
      backlog.push(d);
    }
  });

  document.getElementById("backlog-count").textContent = backlog.length;
  backlogContainer.innerHTML =
    backlog.map((d) => criarPostItHtml(d)).join("") ||
    '<span class="text-xs text-slate-400 italic col-span-full text-center py-2">Backlog vazio.</span>';

  colSeg.innerHTML =
    diasSemana["segunda"].map((d) => criarPostItHtml(d)).join("") ||
    '<span class="text-[11px] text-slate-400 italic">Vazio</span>';
  colTer.innerHTML =
    diasSemana["terca"].map((d) => criarPostItHtml(d)).join("") ||
    '<span class="text-[11px] text-slate-400 italic">Vazio</span>';
  colQua.innerHTML =
    diasSemana["quarta"].map((d) => criarPostItHtml(d)).join("") ||
    '<span class="text-[11px] text-slate-400 italic">Vazio</span>';
  colQui.innerHTML =
    diasSemana["quinta"].map((d) => criarPostItHtml(d)).join("") ||
    '<span class="text-[11px] text-slate-400 italic">Vazio</span>';
  colSex.innerHTML =
    diasSemana["sexta"].map((d) => criarPostItHtml(d)).join("") ||
    '<span class="text-[11px] text-slate-400 italic">Vazio</span>';
}

export function renderCalendarioMensal(listaDemandas) {
  const grid = document.getElementById("calendario-mensal-grid");
  const labelMes = document.getElementById("mes-atual-label");
  if (!grid || !labelMes) return;

  const ano = prgdState.dataMensalAtual.getFullYear();
  const mes = prgdState.dataMensalAtual.getMonth();

  const nomesMeses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  labelMes.textContent = `${nomesMeses[mes]} ${ano}`;

  const primeiroDiaMes = new Date(ano, mes, 1);
  const ultimoDiaMes = new Date(ano, mes + 1, 0);
  const diasNoMes = ultimoDiaMes.getDate();
  const diaSemanaInicio = primeiroDiaMes.getDay();

  const demandasPorData = {};
  listaDemandas.forEach((d) => {
    const dt = d.dataLimite || d.dataInicio || "";
    if (dt) {
      if (!demandasPorData[dt]) demandasPorData[dt] = [];
      demandasPorData[dt].push(d);
    }
  });

  let html = "";
  for (let i = 0; i < diaSemanaInicio; i++) {
    html += `<div class="bg-slate-50/50 border border-slate-100 rounded-lg p-2 min-h-[90px] opacity-40"></div>`;
  }

  const hoje = new Date();
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const mesStr = String(mes + 1).padStart(2, "0");
    const diaStr = String(dia).padStart(2, "0");
    const dataIso = `${ano}-${mesStr}-${diaStr}`;
    const ehHoje = dataIso === hojeStr;
    const demandasDoDia = demandasPorData[dataIso] || [];

    html += `<div class="bg-white border ${ehHoje ? "border-blue-600 ring-2 ring-blue-100" : "border-slate-200"} rounded-lg p-2 min-h-[90px] flex flex-col justify-between">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-xs font-bold ${ehHoje ? "bg-blue-900 text-white w-5 h-5 rounded-full flex items-center justify-center" : "text-slate-700"}">${dia}</span>
                        ${demandasDoDia.length ? `<span class="text-[10px] bg-blue-100 text-blue-900 font-bold px-1.5 rounded-full">${demandasDoDia.length}</span>` : ""}
                    </div>
                    <div class="space-y-1 overflow-y-auto max-h-24 flex-1">
                        ${demandasDoDia
                          .map((d) => {
                            const corCard = obterClasseCorCard(d.corCard);
                            return `<div class="p-1 rounded ${corCard} text-[10px] font-semibold truncate cursor-pointer tr-detalhe shadow-sm" data-colecao="demandas" data-id="${esc(d.firestoreId)}" title="${esc(d.titulo)}">
                                ${esc(d.titulo)}
                            </div>`;
                          })
                          .join("")}
                    </div>
                </div>`;
  }

  grid.innerHTML = html;
}

export function criarPostItHtml(d) {
  const badgesResp = renderizarBadgesResponsaveis(pessoasResponsaveis(d));
  const bolinhaPrio = renderizarBolinhaPrioridade(d.prioridade);
  const corCard = obterClasseCorCard(d.corCard);
  const dataVal = d.dataLimite || d.dataInicio || "";
  const diaSemanaVal = d.diaSemana || "";
  const { badgeOutraSemana } = calcularInfoSemana(dataVal);
  const badgeOutraSemanaHtml = badgeOutraSemana
    ? `<span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded ml-1" title="Data alocada em outra semana"><i class="fa-solid fa-clock-rotate-left"></i> Outra semana</span>`
    : "";

  return `<div class="post-it p-3 rounded-lg border ${corCard} shadow-sm flex flex-col justify-between gap-2.5">
                <div>
                    <div class="flex justify-between items-start gap-1">
                        <span class="font-bold text-xs leading-tight line-clamp-2">${esc(d.titulo)}</span>
                        ${bolinhaPrio}
                    </div>
                    <p class="text-[11px] opacity-80 mt-1 line-clamp-2">${esc(d.descricao || "")}</p>
                </div>
                <div class="pt-2 border-t border-black/10 space-y-2">
                    <div class="flex justify-between items-center"><span class="text-[10px] font-semibold opacity-75">${esc(d.solicitante || "ATI")}</span><div class="scale-90 origin-right">${badgesResp}</div></div>
                    <div class="flex items-center justify-between gap-1 pt-1 bg-white/60 p-1 rounded border border-black/5 flex-wrap">
                        <span class="text-[10px] font-bold text-slate-700">Data/Dia:</span>
                        <input type="date" ${podeAlterarColecao("demandas") ? "" : "disabled"} class="input-data-demanda text-[10px] p-1 border rounded bg-white font-medium text-blue-900 cursor-pointer" data-firestore-id="${esc(d.firestoreId)}" value="${esc(dataVal)}" title="Data Específica">
                        <select ${podeAlterarColecao("demandas") ? "" : "disabled"} class="select-diaselect-demanda text-[10px] p-1 border rounded bg-white font-medium text-blue-900 cursor-pointer" data-firestore-id="${esc(d.firestoreId)}" title="Dia da Semana">
                            <option value="" ${!diaSemanaVal ? "selected" : ""}>Dia</option>
                            <option value="segunda" ${diaSemanaVal === "segunda" ? "selected" : ""}>Seg</option>
                            <option value="terca" ${diaSemanaVal === "terca" ? "selected" : ""}>Ter</option>
                            <option value="quarta" ${diaSemanaVal === "quarta" ? "selected" : ""}>Qua</option>
                            <option value="quinta" ${diaSemanaVal === "quinta" ? "selected" : ""}>Qui</option>
                            <option value="sexta" ${diaSemanaVal === "sexta" ? "selected" : ""}>Sex</option>
                        </select>
                        ${badgeOutraSemanaHtml}
                        <button type="button" class="text-[10px] bg-blue-900 text-white px-2 py-1 rounded font-bold cursor-pointer tr-detalhe ml-auto" data-colecao="demandas" data-id="${esc(d.firestoreId)}"><i class="fa-solid fa-eye"></i></button>
                    </div>
                </div>
            </div>`;
}

export async function salvarNovaObservacao() {
  if (!podeAlterarColecao("demandas")) {
    alert("Ação não autorizada para este perfil.");
    return;
  }
  const demandaId = document.getElementById("obs-demanda-id").value;
  const texto = document.getElementById("obs-novo-texto").value.trim();
  if (!texto || !demandaId) return;
  const demandaObj = prgdState.dbData.demandas.find(
    (d) => String(d.firestoreId) === String(demandaId),
  );
  if (!demandaObj) return;
  const agora = new Date().toISOString();
  const autor =
    prgdState.currentUser?.nome || prgdState.currentUser?.email || "Sistema";
  const historicoAcoes = [
    ...(demandaObj.historicoAcoes || []),
    { data: agora, autor, autorUid: prgdState.currentUser?.uid || "", texto },
  ];
  try {
    await salvarComHistorico(
      doc(prgdState.db, "demandas", String(demandaId)),
      {
        historicoAcoes,
        atualizadoEm: agora,
        editadoPorUid: prgdState.currentUser?.uid || "",
        editadoPor: autor,
      },
      { merge: true },
    );
    document.getElementById("obs-novo-texto").value = "";
    alert("Andamento registrado com sucesso!");
  } catch (err) {
    alert(traduzirErroSistema(err));
  }
}
