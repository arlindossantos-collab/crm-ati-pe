import { formatarDataExibicao } from "../../domain/display.js";
import {
  detalhesCadastroHtml,
  referenciasCadastroHtml,
} from "../../shared/record-display.js";
import { ehAdministrador } from "../../modules/acessos/policies.js";
import { prgdState } from "../state.js";
import {
  podeAlterarColecao,
  nomePerfilAcesso,
  nomeOrgaoUsuario,
  situacaoVinculo,
} from "../../modules/acessos/policies.js";

import { estadoAcessoUsuario } from "../../modules/acessos/accounts.js";
import { resumoColaboradorUsuario } from "../../modules/colaboradores/index.js";
import {
  orgaoComContatos,
  resumoContatosOrgao,
} from "../../modules/orgaos/contacts.js";

import { uidCadastro, pessoasResponsaveis } from "../../shared/identity.js";
import { avatarUsuario } from "../../modules/perfil/index.js";
import { historicoDemandaHtml } from "../../modules/demandas/index.js";
import {
  atualizarPainelInscricoesEvento,
  inscricoesEventoHtml,
} from "../../modules/inscricoes/panel.js";
import { esc } from "../../shared/presentation.js";
import { renderizarBadgesResponsaveis } from "../../modules/apoio/index.js";

import { montarEdicaoEstruturada } from "../forms.js";

export function detalharRegistro(colecao, firestoreId) {
  const original = prgdState.dbData[colecao]?.find(
    (i) =>
      String(i.firestoreId) === String(firestoreId) ||
      String(i.id) === String(firestoreId),
  );
  if (!original) return;
  const item = colecao === "orgaos" ? orgaoComContatos(original) : original;
  document.getElementById("detalhe-titulo-modal").textContent =
    colecao === "orgaos"
      ? "Governança e Contatos Institucionais"
      : "Detalhes de " +
        ({
          usuarios: "acesso",
          eventos: "evento",
          demandas: "demanda",
          locais: "local",
          fornecedores: "fornecedor",
          bases: "base",
          grupos: "grupo",
        }[colecao] || "cadastro");
  document.getElementById("edit-colecao").value = colecao;
  document.getElementById("edit-doc-id").value =
    item.firestoreId || firestoreId;
  document
    .getElementById("dashboard-detalhe-evento-container")
    .classList.add("hidden");
  montarEdicaoEstruturada(colecao, original);

  if (colecao === "orgaos") {
    const situacao = item.situacaoContato || "Validado";
    let badgeSitHtml = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> ${esc(situacao)}</span>`;
    if (situacao === "Pendente")
      badgeSitHtml = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><span class="w-2 h-2 rounded-full bg-amber-500"></span> Pendente</span>`;
    if (situacao === "Desatualizado")
      badgeSitHtml = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800"><span class="w-2 h-2 rounded-full bg-rose-500"></span> Desatualizado</span>`;

    const modalidadeAtual = item.gestorModalidadeSelecionada || "Órgão";

    let nomeCard2 =
      item.gestorOrgao || item.respInstitucionalNome || "Não informado";
    let cargoCard2 = "Gestor do Órgão";
    let emailCard2 =
      item.emailGestorOrgao || item.respInstitucionalEmail || "Não informado";
    let telCard2 =
      item.telGestorOrgao || item.respInstitucionalTel || "Não informado";

    if (modalidadeAtual === "NSI") {
      nomeCard2 = item.gestorNsi || "Não informado";
      cargoCard2 = "Gestor do NSI";
      emailCard2 = item.emailGestorNsi || "Não informado";
      telCard2 = item.telGestorNsi || "Não informado";
    } else if (modalidadeAtual === "Telemática") {
      nomeCard2 = item.gestorTelematica || "Não informado";
      cargoCard2 = "Gestor de Telemática";
      emailCard2 = item.emailGestorTelematica || "Não informado";
      telCard2 = item.telGestorTelematica || "Não informado";
    } else if (modalidadeAtual === "SI") {
      nomeCard2 = item.gestorSi || "Não informado";
      cargoCard2 = "Gestor de SI";
      emailCard2 = item.emailGestorSi || "Não informado";
      telCard2 = item.telGestorSi || "Não informado";
    } else if (modalidadeAtual === "SEI") {
      nomeCard2 = item.gestorSei || "Não informado";
      cargoCard2 = "Gestor do SEI";
      emailCard2 = item.emailGestorSei || "Não informado";
      telCard2 = item.telGestorSei || "Não informado";
    }

    const enderecoOrg =
      typeof item.endereco === "string" ? item.endereco.trim() : "";
    const geoOrg =
      typeof item.geolocalizacao === "string" ? item.geolocalizacao.trim() : "";
    const fotoFachadaOrg =
      typeof item.fotoFachada === "string" ? item.fotoFachada.trim() : "";
    const googleMapsUrl =
      geoOrg || enderecoOrg
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(geoOrg || enderecoOrg)}`
        : "";

    document.getElementById("detalhe-conteudo").innerHTML = `
                    <!-- BANNER EM TOM DE AZUL COM FACHADA E GEOLOCALIZAÇÃO -->
                    <div class="relative bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-blue-800">
                        <div class="md:w-1/3 h-48 md:h-auto relative bg-blue-950">
                            ${fotoFachadaOrg ? `<img src="${esc(fotoFachadaOrg)}" alt="Fachada do Órgão" class="w-full h-full object-cover">` : '<p class="p-6 text-sm text-blue-200">Fachada não informada</p>'}
                            <div class="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-transparent to-transparent flex items-end p-2.5">
                                ${fotoFachadaOrg ? '<span class="bg-blue-800 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow"><i class="fa-solid fa-camera mr-1"></i> Imagem cadastrada</span>' : ""}
                            </div>
                        </div>
                        <div class="md:w-2/3 p-5 flex flex-col justify-between space-y-3">
                            <div>
                                <div class="flex items-center justify-between gap-2 flex-wrap mb-1">
                                    <h2 class="text-lg font-black text-white">${esc(item.nome || "-")}</h2>
                                    ${badgeSitHtml}
                                </div>
                                <p class="text-xs text-blue-200 font-mono">
                                    <span class="font-bold text-white">${esc(item.sigla || "")}</span> |
                                    CNPJ: ${esc(item.cnpj || "Não informado")} |
                                    <i class="fa-solid fa-phone mr-1"></i> ${esc(item.telefoneFixo || "Não informado")}
                                </p>
                            </div>

                            <div class="bg-blue-950/70 p-3 rounded-xl border border-blue-800/80 text-xs space-y-1.5">
                                <div class="flex items-start gap-2">
                                    <i class="fa-solid fa-location-dot text-rose-400 mt-0.5"></i>
                                    <div><strong>Endereço:</strong> <span class="text-blue-100">${esc(enderecoOrg || "Endereço não informado")}</span></div>
                                </div>
                                <div class="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-blue-800/60">
                                    <div class="flex items-center gap-1.5 font-mono text-[11px] text-emerald-300">
                                        <i class="fa-solid fa-crosshairs"></i> ${esc(geoOrg || "Coordenadas não informadas")}
                                    </div>
                                    ${
                                      googleMapsUrl
                                        ? `<a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1 shadow">
                                        <i class="fa-solid fa-map-location-dot"></i> Abrir no Google Maps
                                    </a>`
                                        : ""
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex border-b text-xs text-slate-600 font-semibold gap-4 pb-2 mt-4">
                        <span class="border-b-2 border-blue-900 text-blue-900 pb-2"><i class="fa-solid fa-user-shield mr-1"></i> Gestores e Contatos</span>
                        <span class="text-slate-400">Serviços</span>
                        <span class="text-slate-400">Histórico</span>
                        <span class="text-slate-400">Validações</span>
                        <span class="text-slate-400">Relacionamento</span>
                    </div>

                    <p class="text-xs text-slate-500 italic">Estrutura oficial de gestores em 5 níveis e contatos de substitutos.</p>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div class="bg-blue-900 text-white rounded-2xl p-4 shadow-sm flex flex-col justify-between border border-blue-800">
                            <div>
                                <div class="flex justify-between items-center mb-3">
                                    <span class="font-bold text-xs"><i class="fa-solid fa-user-tie mr-1"></i> Gestor do Órgão</span>
                                    <span class="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Principal</span>
                                </div>
                                <p class="text-[11px] text-blue-200 mb-3">Responsável principal institucional do órgão.</p>
                                <div class="space-y-1.5 text-xs bg-blue-950/50 p-3 rounded-xl">
                                    <div><strong class="text-blue-300">Nome:</strong> <span data-contato-vivo="orgao.nome">${esc(item.gestorOrgao || item.respInstitucionalNome || "Não informado")}</span></div>
                                    <div><strong class="text-blue-300">Cargo:</strong> <span data-contato-vivo="orgao.cargo">${esc(item.cargoGestorOrgao || item.respInstitucionalCargo || "Não informado")}</span></div>
                                    <div><strong class="text-blue-300">E-mail:</strong> <span data-contato-vivo="orgao.email">${esc(item.emailGestorOrgao || item.respInstitucionalEmail || "Não informado")}</span></div>
                                    <div><strong class="text-blue-300">Telefone:</strong> <span data-contato-vivo="orgao.telefone">${esc(item.telGestorOrgao || item.respInstitucionalTel || "Não informado")}</span></div>
                                    <div class="pt-2 border-t border-blue-800/60"><strong class="text-amber-300">Fonte:</strong> ${esc(item.fonteInformacao || "Não informado")}</div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white rounded-2xl p-4 shadow-sm border border-emerald-300 flex flex-col justify-between">
                            <div>
                                <div class="flex justify-between items-center mb-3">
                                    <span class="font-bold text-xs text-emerald-900"><i class="fa-solid fa-gears mr-1"></i> Dados do Gestor</span>
                                    <select id="detalhe-select-modalidade" class="text-[10px] p-1 border rounded bg-emerald-50 font-bold text-emerald-900 cursor-pointer" title="Selecione o nível do gestor">
                                        <option value="Órgão" ${modalidadeAtual === "Órgão" ? "selected" : ""}>Gestor do Órgão</option>
                                        <option value="NSI" ${modalidadeAtual === "NSI" ? "selected" : ""}>Gestor do NSI</option>
                                        <option value="Telemática" ${modalidadeAtual === "Telemática" ? "selected" : ""}>Gestor de Telemática</option>
                                        <option value="SI" ${modalidadeAtual === "SI" ? "selected" : ""}>Gestor de SI</option>
                                        <option value="SEI" ${modalidadeAtual === "SEI" ? "selected" : ""}>Gestor do SEI</option>
                                    </select>
                                </div>
                                <p class="text-[11px] text-slate-500 mb-3">Dados exibidos conforme a seleção da modalidade acima.</p>
                                <div class="space-y-1.5 text-xs bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                                    <div><strong class="text-slate-700">Nível:</strong> <span id="det-card2-nivel">${esc(cargoCard2)}</span></div>
                                    <div><strong class="text-slate-700">Nome:</strong> <span id="det-card2-nome">${esc(nomeCard2)}</span></div>
                                    <div><strong class="text-slate-700">E-mail:</strong> <span id="det-card2-email">${esc(emailCard2)}</span></div>
                                    <div><strong class="text-slate-700">WhatsApp:</strong> <span id="det-card2-tel">${esc(telCard2)}</span></div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white rounded-2xl p-4 shadow-sm border border-purple-200 flex flex-col justify-between">
                            <div>
                                <div class="flex justify-between items-center mb-3">
                                    <span class="font-bold text-xs text-purple-900"><i class="fa-solid fa-user-clock mr-1"></i> Substituto / Contatos</span>
                                    <span class="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Suporte</span>
                                </div>
                                <p class="text-[11px] text-slate-500 mb-3">Ponto focal substituto e demais contatos operacionais.</p>
                                <div class="space-y-1.5 text-xs bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                                    <div><strong class="text-slate-700">Nome:</strong> ${esc(item.pontoFocalNome || item.pontoFocalSubNome || "Não informado")}</div>
                                    <div><strong class="text-slate-700">Cargo:</strong> ${esc(item.pontoFocalCargo || "Não informado")}</div>
                                    <div><strong class="text-slate-700">E-mail:</strong> ${esc(item.pontoFocalEmail || "Não informado")}</div>
                                    <div><strong class="text-slate-700">WhatsApp:</strong> ${esc(item.pontoFocalTel || "Não informado")}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
  } else if (colecao === "demandas") {
    document.getElementById("detalhe-conteudo").innerHTML = `
                    <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border text-xs">
                        <div><b>Solicitante:</b> ${esc(item.solicitante || "-")}</div>
                        <div><b>Órgão / Local:</b> ${esc(item.orgao || "-")}</div>
                        <div class="col-span-2"><b>Responsável GRGD:</b> ${renderizarBadgesResponsaveis(pessoasResponsaveis(item))}</div>
                        <div><b>Status:</b> <span class="uppercase">${esc(item.status || "-")}</span></div>
                        <div><b>Prioridade:</b> <span class="uppercase">${esc(item.prioridade || "-")}</span></div>
                        <div class="col-span-2"><b>Título:</b> ${esc(item.titulo || "-")}</div>
                        <div class="col-span-2"><b>Detalhes:</b> ${esc(item.descricao || "-")}</div>
                    </div>
                `;
  } else if (colecao === "usuarios") {
    const v = item.acessoInstitucional;
    document.getElementById("detalhe-conteudo").innerHTML =
      `<div class="flex items-center gap-3">${avatarUsuario({ ...item, uid: uidCadastro(item) }, "lg")}<div><h4 class="font-bold">${esc(item.nome || item.email)}</h4><p class="text-xs text-slate-500">${esc(item.email || "")}</p></div></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs"><p><b>Perfil:</b> ${esc(nomePerfilAcesso(item))}</p><p><b>Órgão:</b> ${esc(nomeOrgaoUsuario(item))}</p><p><b>Situação:</b> ${item.ativo === false ? "Inativo" : "Ativo"}${v ? " · " + esc(situacaoVinculo(item)) : ""}</p><p><b>Acesso efetivo:</b> ${esc(estadoAcessoUsuario(item).nome)}</p>${v ? `<p><b>Validade:</b> ${esc(formatarDataExibicao(v.fim))}</p><p><b>Revisão:</b> ${esc(formatarDataExibicao(v.revisao))}</p>` : ""}</div>` +
      (ehAdministrador()
        ? referenciasCadastroHtml([["uid", uidCadastro(item)]])
        : "");
  } else {
    document.getElementById("detalhe-conteudo").innerHTML =
      detalhesCadastroHtml(item, ehAdministrador());
  }

  if (colecao === "demandas")
    document.getElementById("detalhe-conteudo").innerHTML +=
      historicoDemandaHtml(item);
  if (colecao === "eventos")
    document.getElementById("detalhe-conteudo").innerHTML +=
      inscricoesEventoHtml(item);
  document.getElementById("btn-excluir-registro").disabled =
    colecao === "eventos" &&
    item.modeloInscricao === prgdState.MODELO_INSCRICAO;
  if (colecao === "usuarios")
    document.getElementById("detalhe-conteudo").innerHTML +=
      resumoColaboradorUsuario(item);
  if (colecao === "orgaos")
    document.getElementById("detalhe-conteudo").innerHTML =
      '<div id="orgao-contatos-vivos">' +
      resumoContatosOrgao(original) +
      "</div>" +
      document.getElementById("detalhe-conteudo").innerHTML;
  document.getElementById("btn-excluir-registro").textContent =
    colecao === "usuarios" ? "Excluir usuário" : "Excluir registro";
  document.getElementById("btn-salvar-edicao").textContent =
    colecao === "usuarios" ? "Revisar e salvar usuário" : "Salvar alterações";
  document
    .getElementById("detalhe-area-admin")
    .classList.toggle("hidden", !podeAlterarColecao(colecao));
  document.getElementById("modal-detalhes").classList.remove("hidden");
  atualizarPainelInscricoesEvento();
}
