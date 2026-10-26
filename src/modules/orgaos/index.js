// Responsabilidade: modules/orgaos/index. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "../../app/state.js";
import { podeAlterarColecao } from "../acessos/policies.js";
import { orgaoComContatos } from "./contacts.js";
import { renderAuditInfo, esc } from "../../shared/presentation.js";

export function renderClientes() {
  const tbody = document.getElementById("tabela-clientes");
  if (!tbody) return;

  const txt = prgdState.buscaClientesVal.trim().toLowerCase();
  const filtered = prgdState.dbData.orgaos.map(orgaoComContatos).filter((o) => {
    const modalidadeSel = prgdState.filtroGestorModalidadeAtual;
    const situacaoSel = prgdState.filtroSituacaoClienteAtual;
    const matchModalidade =
      !modalidadeSel || o.gestorModalidadeSelecionada === modalidadeSel;
    const matchSituacao = !situacaoSel || o.situacaoContato === situacaoSel;

    const matchBusca =
      !txt ||
      [
        o.nome,
        o.sigla,
        o.telefoneFixo,
        o.gestorOrgao,
        o.gestorNsi,
        o.gestorTelematica,
        o.gestorSi,
        o.gestorSei,
        o.emailGestorOrgao,
        o.emailGestorNsi,
        o.emailGestorTelematica,
        o.emailGestorSi,
        o.emailGestorSei,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(txt);

    return matchBusca && matchSituacao && matchModalidade;
  });

  document.getElementById("count-clientes").textContent = filtered.length;

  tbody.innerHTML =
    filtered
      .map((o) => {
        const audit = renderAuditInfo(o);
        const modalidadeAtual = o.gestorModalidadeSelecionada || "Órgão";

        const gestorOrgaoNome = o.gestorOrgao || o.respInstitucionalNome || "-";
        const gestorOrgaoEmail =
          o.emailGestorOrgao || o.respInstitucionalEmail || "-";
        const gestorOrgaoTel =
          o.telGestorOrgao || o.respInstitucionalTel || "-";

        let nomeGestorSel = gestorOrgaoNome;
        let emailGestorSel = gestorOrgaoEmail;
        let telGestorSel = gestorOrgaoTel;

        if (modalidadeAtual === "NSI") {
          nomeGestorSel = o.gestorNsi || "-";
          emailGestorSel = o.emailGestorNsi || "-";
          telGestorSel = o.telGestorNsi || "-";
        } else if (modalidadeAtual === "Telemática") {
          nomeGestorSel = o.gestorTelematica || "-";
          emailGestorSel = o.emailGestorTelematica || "-";
          telGestorSel = o.telGestorTelematica || "-";
        } else if (modalidadeAtual === "SI") {
          nomeGestorSel = o.gestorSi || "-";
          emailGestorSel = o.emailGestorSi || "-";
          telGestorSel = o.telGestorSi || "-";
        } else if (modalidadeAtual === "SEI") {
          nomeGestorSel = o.gestorSei || "-";
          emailGestorSel = o.emailGestorSei || "-";
          telGestorSel = o.telGestorSei || "-";
        }

        const situacao = o.situacaoContato || "Validado";
        let badgeSitHtml = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Validado</span>`;
        if (situacao === "Pendente") {
          badgeSitHtml = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><span class="w-2 h-2 rounded-full bg-amber-500"></span> Pendente</span>`;
        } else if (situacao === "Desatualizado") {
          badgeSitHtml = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800"><span class="w-2 h-2 rounded-full bg-rose-500"></span> Desatualizado</span>`;
        }

        return `<tr class="hover:bg-slate-50 border-b border-slate-200">
                    <td class="p-3">
                        <div class="font-bold text-indigo-900">${esc(o.nome || "-")}</div>
                        <div class="text-[11px] font-mono text-slate-500 font-semibold">${esc(o.sigla || "-")}</div>
                    </td>
                    <td class="p-3 font-mono text-slate-600">${esc(o.telefoneFixo || "-")}</td>
                    <td class="p-3 font-bold text-slate-900">
                        <div>${esc(gestorOrgaoNome)}</div>
                        <div class="text-[10px] text-slate-500 font-normal">Gestor do Órgão</div>
                    </td>
                    <td class="p-3">
                        <select ${podeAlterarColecao("orgaos") ? "" : "disabled"} class="select-modalidade-gestor p-1.5 border rounded text-xs bg-white font-semibold text-blue-900 cursor-pointer" data-firestore-id="${esc(o.firestoreId)}" title="Escolha o gestor desejado">
                            <option value="Órgão" ${modalidadeAtual === "Órgão" ? "selected" : ""}>Gestor do Órgão</option>
                            <option value="NSI" ${modalidadeAtual === "NSI" ? "selected" : ""}>Gestor do NSI</option>
                            <option value="Telemática" ${modalidadeAtual === "Telemática" ? "selected" : ""}>Gestor de Telemática</option>
                            <option value="SI" ${modalidadeAtual === "SI" ? "selected" : ""}>Gestor de SI</option>
                            <option value="SEI" ${modalidadeAtual === "SEI" ? "selected" : ""}>Gestor do SEI</option>
                        </select>
                        <div class="text-[10px] font-semibold text-slate-700 mt-1">${esc(nomeGestorSel)}</div>
                    </td>
                    <td class="p-3 text-blue-800 underline">${esc(emailGestorSel)}</td>
                    <td class="p-3 font-mono text-slate-700">
                        <span class="inline-flex items-center gap-1"><i class="fa-brands fa-whatsapp text-emerald-600"></i> ${esc(telGestorSel)}</span>
                    </td>
                    <td class="p-3">${badgeSitHtml}</td>
                    <td class="p-3">
                        ${audit.dataHtml}
                        ${audit.autorHtml}
                    </td>
                    <td class="p-3 text-center">
                        <button type="button" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-900 hover:text-white text-blue-900 font-bold inline-flex items-center justify-center transition tr-detalhe cursor-pointer shadow-sm border border-slate-200" data-colecao="orgaos" data-id="${esc(o.firestoreId)}" title="Ver Cards de Gestores e Contatos">
                            <i class="fa-solid fa-arrow-right text-xs"></i>
                        </button>
                    </td>
                </tr>`;
      })
      .join("") ||
    '<tr><td colspan="9" class="text-slate-400 text-sm text-center py-8">Nenhum cliente encontrado. Importe um arquivo CSV ou cadastre um novo cliente.</td></tr>';
}
