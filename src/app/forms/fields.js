import { referenciaTecnica } from "../../domain/display.js";
import {
  campoEdicaoCadastro,
  referenciasCadastroHtml,
} from "../../shared/record-display.js";
import { prgdState } from "../state.js";

import { camposInscricaoEvento } from "../../modules/inscricoes/operations.js";
import {
  camposUsuario,
  atualizarControlesUsuario,
} from "../../modules/acessos/accounts.js";

import { camposContatosOrgao } from "../../modules/orgaos/contacts.js";

import { camposResponsaveis } from "../../shared/identity.js";

import { esc } from "../../shared/presentation.js";

import { camposCadastroLocal } from "../../modules/locais/index.js";
import { camposAgendaEvento } from "../../modules/eventos/index.js";

export function montarEdicaoEstruturada(colecao, item) {
  const c = document.getElementById("edit-campos-dinamicos");
  c.style.maxHeight = colecao === "usuarios" ? "55vh" : "";
  const common = (label, key, type = "text", cls = "", extraClass = "") =>
    `<div class="${cls}"><label class="block font-bold text-[11px] uppercase mb-1">${label}</label><input type="${type}" name="${key}" value="${esc(item[key] || "")}" class="w-full p-2 border rounded-lg text-xs bg-white ${extraClass}"></div>`;

  if (colecao === "usuarios") {
    document.getElementById("form-univ-campos").innerHTML = "";
    c.innerHTML = camposUsuario(item);
    atualizarControlesUsuario();
    return;
  }
  if (colecao === "locais") {
    document.getElementById("form-univ-campos").innerHTML = "";
    c.innerHTML = camposCadastroLocal(item);
    return;
  }
  if (colecao === "eventos")
    document.getElementById("form-univ-campos").innerHTML = "";
  if (colecao === "orgaos") {
    c.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    ${camposContatosOrgao(item)}
                    ${common("Nome do Cliente / Órgão", "nome")}
                    ${common("Sigla", "sigla")}
                    ${common("CNPJ", "cnpj")}
                    ${common("Telefone Fixo", "telefoneFixo", "text", "", "input-mask-telefone")}
                    <div><label class="block font-bold text-[11px] uppercase mb-1">Situação do Contato</label><select name="situacaoContato" class="w-full p-2 border rounded-lg text-xs bg-white"><option ${item.situacaoContato === "Validado" ? "selected" : ""}>Validado</option><option ${item.situacaoContato === "Pendente" ? "selected" : ""}>Pendente</option><option ${item.situacaoContato === "Desatualizado" ? "selected" : ""}>Desatualizado</option></select></div>
                    ${common("Fonte da Informação", "fonteInformacao")}

                    <div class="md:col-span-2 border-t pt-3 mt-2"><h5 class="font-bold text-blue-900 mb-2">Endereço e Geolocalização (Fachada)</h5></div>
                    ${common("Endereço Completo", "endereco", "text", "md:span-2", "", "Ex: Av. Rio Capibaribe, 147 - São José, Recife - PE")}
                    ${common("Geolocalização (Lat, Long)", "geolocalizacao", "text", "", "", "-8.0665354, -34.8846639")}
                    ${common("URL da Imagem da Fachada", "fotoFachada", "text", "", "", "https://...")}

                    <div class="md:col-span-2 border-t pt-3 mt-2"><h5 class="font-bold text-blue-900 mb-2">Dados manuais anteriores — Gestor do Órgão</h5></div>
                    ${common("Nome Gestor do Órgão", "gestorOrgao")}
                    ${common("Cargo Gestor do Órgão", "cargoGestorOrgao")}
                    ${common("E-mail Gestor do Órgão", "emailGestorOrgao", "email")}
                    ${common("Telefone Gestor do Órgão", "telGestorOrgao", "text", "", "input-mask-telefone")}

                    <div class="md:col-span-2 border-t pt-3 mt-2"><h5 class="font-bold text-blue-900 mb-2">Gestor do NSI</h5></div>
                    ${common("Nome Gestor do NSI", "gestorNsi")}
                    <div class="grid grid-cols-2 gap-2">${common("Tel. Gestor NSI", "telGestorNsi", "text", "", "input-mask-telefone")}${common("E-mail Gestor NSI", "emailGestorNsi", "email")}</div>

                    <div class="md:col-span-2 border-t pt-3 mt-2"><h5 class="font-bold text-blue-900 mb-2">Gestor de Telemática</h5></div>
                    ${common("Nome Gestor Telemática", "gestorTelematica")}
                    <div class="grid grid-cols-2 gap-2">${common("Tel. Telemática", "telGestorTelematica", "text", "", "input-mask-telefone")}${common("E-mail Telemática", "emailGestorTelematica", "email")}</div>

                    <div class="md:col-span-2 border-t pt-3 mt-2"><h5 class="font-bold text-blue-900 mb-2">Gestor de SI</h5></div>
                    ${common("Nome Gestor de SI", "gestorSi")}
                    <div class="grid grid-cols-2 gap-2">${common("Tel. SI", "telGestorSi", "text", "", "input-mask-telefone")}${common("E-mail SI", "emailGestorSi", "email")}</div>

                    <div class="md:col-span-2 border-t pt-3 mt-2"><h5 class="font-bold text-blue-900 mb-2">Gestor do SEI</h5></div>
                    ${common("Nome Gestor do SEI", "gestorSei")}
                    <div class="grid grid-cols-2 gap-2">${common("Tel. SEI", "telGestorSei", "text", "", "input-mask-telefone")}${common("E-mail SEI", "emailGestorSei", "email")}</div>

                    <div class="md:col-span-2 border-t pt-3 mt-2"><h5 class="font-bold text-blue-900 mb-2">Substitutos e Outros Contatos</h5></div>
                    ${common("Nome Ponto Focal / Substituto", "pontoFocalNome")}
                    ${common("Cargo Ponto Focal", "pontoFocalCargo")}
                    ${common("E-mail Ponto Focal", "pontoFocalEmail", "email")}
                    ${common("Telefone/WhatsApp Ponto Focal", "pontoFocalTel", "text", "", "input-mask-telefone")}
                </div>`;
    return;
  }

  if (colecao === "demandas") {
    c.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    ${common("Solicitante", "solicitante")}
                    ${common("Órgão / Local", "orgao")}
                    <div class="md:col-span-2">
                        <label class="block font-bold text-[11px] uppercase mb-1">Quem da GRGD é responsável por acompanhar (Múltiplos)</label>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border">
                            ${camposResponsaveis("responsavelGrgdCheckbox", item)}
                        </div>
                    </div>
                    ${common("Data Específica", "dataLimite", "date")}
                    <div><label class="block font-bold text-[11px] uppercase mb-1">Dia da Semana (Semana Atual)</label><select name="diaSemana" class="w-full p-2 border rounded-lg text-xs bg-white"><option value="">-- Nenhum / Usar Data --</option><option value="segunda" ${item.diaSemana === "segunda" ? "selected" : ""}>Segunda</option><option value="terca" ${item.diaSemana === "terca" ? "selected" : ""}>Terça</option><option value="quarta" ${item.diaSemana === "quarta" ? "selected" : ""}>Quarta</option><option value="quinta" ${item.diaSemana === "quinta" ? "selected" : ""}>Quinta</option><option value="sexta" ${item.diaSemana === "sexta" ? "selected" : ""}>Sexta</option></select></div>
                    <div><label class="block font-bold text-[11px] uppercase mb-1">Status</label><select name="status" class="w-full p-2 border rounded-lg text-xs bg-white"><option ${item.status === "Em Andamento" ? "selected" : ""}>Em Andamento</option><option ${item.status === "Pausado" ? "selected" : ""}>Pausado</option><option ${item.status === "Cancelado" ? "selected" : ""}>Cancelado</option><option ${item.status === "Concluído" ? "selected" : ""}>Concluído</option></select></div>
                    <div><label class="block font-bold text-[11px] uppercase mb-1">Prioridade</label><select name="prioridade" class="w-full p-2 border rounded-lg text-xs bg-white"><option value="Baixa" ${item.prioridade === "Baixa" ? "selected" : ""}>Baixa</option><option value="Média" ${item.prioridade === "Média" ? "selected" : ""}>Média</option><option value="Alta" ${item.prioridade === "Alta" ? "selected" : ""}>Alta</option></select></div>
                    <div><label class="block font-bold text-[11px] uppercase mb-1">Cor do Card</label><select name="corCard" class="w-full p-2 border rounded-lg text-xs bg-white font-semibold">
                        ${prgdState.CORES_CARD_DEMANDA.map((cor) => `<option value="${cor.id}" ${item.corCard === cor.id ? "selected" : ""}>${cor.nome}</option>`).join("")}
                    </select></div>
                    ${common("Título da Demanda", "titulo", "text", "md:col-span-2")}
                </div>
                <div class="mt-3"><label class="block font-bold text-xs">Detalhes</label><textarea name="descricao" rows="4" class="w-full p-2 border rounded-lg text-xs bg-white">${esc(item.descricao)}</textarea></div>`;
    return;
  }

  const entradas = Object.entries(item).filter(
    ([k]) =>
      k !== "id" &&
      k !== "firestoreId" &&
      !(
        colecao === "eventos" &&
        [
          "localId",
          "localEvento",
          "dataInicio",
          "dataFim",
          "horaInicio",
          "horaFim",
          "custoLocacaoPrevisto",
          "status",
          ...(item.modeloInscricao === prgdState.MODELO_INSCRICAO
            ? [
                "modeloInscricao",
                "inscritosCount",
                "ultimaInscricaoId",
                "inscricoesAbertas",
                "inscricaoInicio",
                "inscricaoFim",
                "orgaosElegiveis",
                "limiteVagas",
              ]
            : []),
        ].includes(k)
      ),
  );
  c.innerHTML =
    entradas
      .filter(([k]) => !referenciaTecnica(k))
      .map(([k, v]) => campoEdicaoCadastro(k, v))
      .join("") +
    referenciasCadastroHtml(entradas.filter(([k]) => referenciaTecnica(k)));
  if (colecao === "eventos")
    c.innerHTML += camposAgendaEvento(item) + camposInscricaoEvento(item);
}
