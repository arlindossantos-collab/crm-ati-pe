// Responsabilidade: modules/apoio/index. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "../../app/state.js";
import { avatarUsuario } from "../perfil/index.js";
import { renderAuditInfo, esc } from "../../shared/presentation.js";

export function renderizarBadgesResponsaveis(responsaveis) {
  if (!responsaveis)
    return '<span class="text-xs text-slate-400">Não atribuído</span>';
  const lista = Array.isArray(responsaveis)
    ? responsaveis
    : String(responsaveis)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  if (lista.length === 0)
    return '<span class="text-xs text-slate-400">Não atribuído</span>';

  return (
    `<div class="flex items-center gap-1.5 flex-wrap">` +
    lista
      .map((resp) =>
        avatarUsuario(typeof resp === "string" ? { nome: resp } : resp),
      )
      .join("") +
    `</div>`
  );
}

export function renderBases() {
  const tbody = document.getElementById("tabela-bases");
  if (!tbody) return;
  document.getElementById("count-bases").textContent =
    prgdState.dbData.bases.length;
  const filtrados = prgdState.dbData.bases.filter(
    (b) =>
      !prgdState.buscaBasesVal ||
      [b.nome, b.categoria, b.sigla]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(prgdState.buscaBasesVal),
  );
  document.getElementById("count-bases").textContent = filtrados.length;
  tbody.innerHTML = filtrados
    .map((b) => {
      const audit = renderAuditInfo(b);
      return `<tr class="hover:bg-slate-50"><td class="p-4 font-semibold text-blue-900">${esc(b.categoria)}</td><td class="p-4 font-mono text-xs">${esc(b.sigla || "-")}</td><td class="p-4 font-bold">${esc(b.nome)}</td><td class="p-4">${audit.dataHtml}</td><td class="p-4">${audit.autorHtml}</td><td class="p-4 text-center"><button class="text-xs bg-slate-100 px-2.5 py-1 rounded tr-detalhe font-semibold text-blue-900 cursor-pointer" data-colecao="bases" data-id="${b.firestoreId}">Detalhes</button></td></tr>`;
    })
    .join("");
}

export function renderFornecedores() {
  const tbody = document.getElementById("tabela-fornecedores");
  if (!tbody) return;
  const filtrados = prgdState.dbData.fornecedores.filter(
    (f) =>
      !prgdState.buscaFornecedoresVal ||
      [
        f.nome,
        f.nomeFantasia,
        f.razaoSocial,
        f.cnpj,
        f.produtoServicoPrincipal,
        f.servicoPrincipal,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(prgdState.buscaFornecedoresVal),
  );
  document.getElementById("count-fornecedores").textContent = filtrados.length;
  tbody.innerHTML = filtrados
    .map(
      (f) =>
        `<tr class="hover:bg-slate-50"><td class="p-4 font-bold text-emerald-900">${esc(f.nome)}</td><td class="p-4 text-xs">${esc(f.cnpj || "-")}</td><td class="p-4 text-xs">${esc(f.produtoServicoPrincipal || "-")}</td><td class="p-4">${renderAuditInfo(f).dataHtml}</td><td class="p-4">${renderAuditInfo(f).autorHtml}</td><td class="p-4 text-center"><button class="text-xs bg-slate-100 px-2.5 py-1 rounded tr-detalhe font-semibold text-blue-900 cursor-pointer" data-colecao="fornecedores" data-id="${esc(f.firestoreId)}">Detalhes</button></td></tr>`,
    )
    .join("");
}

export function renderGrupos() {
  const box = document.getElementById("lista-grupos");
  if (!box) return;
  box.innerHTML =
    (prgdState.dbData.grupos || [])
      .map(
        (g) =>
          `<div class="border rounded-xl p-4 bg-slate-50"><h5 class="font-bold text-slate-800">${esc(g.nome)}</h5><p class="text-xs text-slate-500 mt-1">${esc(g.descricao || "")}</p></div>`,
      )
      .join("") ||
    '<p class="text-xs text-slate-400 py-2">Nenhum grupo cadastrado.</p>';
}

export function renderDashboardKPIs() {
  // Ativas: todas as demandas que não estão concluídas ou canceladas.
  document.getElementById("dash-tot-demandas").textContent =
    prgdState.dbData.demandas.filter((d) => {
      const status = String(d.status || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return status !== "concluido" && status !== "cancelado";
    }).length;
  document.getElementById("dash-tot-eventos").textContent =
    prgdState.dbData.eventos.length;
  document.getElementById("dash-tot-locais").textContent =
    prgdState.dbData.locais.length;
  document.getElementById("dash-tot-clientes").textContent =
    prgdState.dbData.orgaos.length;
  document.getElementById("dash-tot-fornecedores").textContent =
    prgdState.dbData.fornecedores.length;
}

export function renderCharts() {
  if (typeof Chart === "undefined") return;
  const ctx1 = document.getElementById("chartCategorias")?.getContext("2d");
  if (ctx1) {
    if (prgdState.chartCatInstance) prgdState.chartCatInstance.destroy();
    const counts = {};
    prgdState.dbData.demandas.forEach((d) => {
      const c = d.categoria || "Geral";
      counts[c] = (counts[c] || 0) + 1;
    });
    prgdState.chartCatInstance = new Chart(ctx1, {
      type: "bar",
      data: {
        labels: Object.keys(counts),
        datasets: [{ data: Object.values(counts), backgroundColor: "#1e3a8a" }],
      },
      options: { plugins: { legend: { display: false } } },
    });
  }
  const ctx2 = document.getElementById("chartStatus")?.getContext("2d");
  if (ctx2) {
    if (prgdState.chartStatusInstance) prgdState.chartStatusInstance.destroy();
    let and = 0,
      paus = 0,
      canc = 0,
      conc = 0;
    prgdState.dbData.demandas.forEach((d) => {
      const s = String(d.status || "").toLowerCase();
      if (s.includes("andamento")) and++;
      else if (s.includes("pausado")) paus++;
      else if (s.includes("cancelado")) canc++;
      else if (s.includes("concluído") || s.includes("concluido")) conc++;
      else and++;
    });
    prgdState.chartStatusInstance = new Chart(ctx2, {
      type: "doughnut",
      data: {
        labels: ["Em Andamento", "Pausado", "Cancelado", "Concluído"],
        datasets: [
          {
            data: [and, paus, canc, conc],
            backgroundColor: ["#3b82f6", "#64748b", "#dc2626", "#16a34a"],
          },
        ],
      },
    });
  }
  const ctx3 = document.getElementById("chartTiposOrgaos")?.getContext("2d");
  if (ctx3) {
    if (prgdState.chartTiposInstance) prgdState.chartTiposInstance.destroy();
    const tCounts = {};
    prgdState.dbData.orgaos.forEach((o) => {
      const tj = o.categoria || o.tipoJuridico || "Outros";
      tCounts[tj] = (tCounts[tj] || 0) + 1;
    });
    prgdState.chartTiposInstance = new Chart(ctx3, {
      type: "pie",
      data: {
        labels: Object.keys(tCounts),
        datasets: [
          {
            data: Object.values(tCounts),
            backgroundColor: [
              "#3b82f6",
              "#8b5cf6",
              "#10b981",
              "#f59e0b",
              "#64748b",
            ],
          },
        ],
      },
    });
  }
}
