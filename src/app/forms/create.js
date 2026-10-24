import { prgdState } from "../state.js";
import { podeAlterarColecao } from "../../modules/acessos/policies.js";
import {
  camposInscricaoEvento,
  lerInscricaoEvento,
} from "../../modules/inscricoes/operations.js";
import {
  camposUsuario,
  atualizarControlesUsuario,
  criarCadastroUsuario,
} from "../../modules/acessos/accounts.js";

import { adicionarComHistorico } from "../../modules/auditoria/index.js";
import { camposResponsaveis, lerResponsaveis } from "../../shared/identity.js";

import {
  traduzirErroSistema,
  calcularInfoSemana,
} from "../../shared/presentation.js";

import { fecharModal } from "../navigation.js";
import {
  camposCadastroLocal,
  lerCadastroLocal,
} from "../../modules/locais/index.js";
import {
  camposAgendaEvento,
  lerAgendaEvento,
} from "../../modules/eventos/index.js";
import { collection } from "../../services/firebase.js";

export function abrirModalForm(tipo) {
  prgdState.novoAcessoColaborador = null;
  document.getElementById("form-univ-tipo").value = tipo;
  const container = document.getElementById("form-univ-campos");
  document.getElementById("form-univ-titulo").textContent =
    tipo === "usuario"
      ? "Novo usuário"
      : "Novo Cadastro: " + tipo.toUpperCase();
  document.getElementById("btn-salvar-cadastro").textContent =
    tipo === "usuario" ? "Salvar usuário" : "Salvar na Nuvem (Firestore)";

  if (tipo === "usuario") {
    document.getElementById("edit-campos-dinamicos").innerHTML = "";
    container.innerHTML = camposUsuario({}, true);
    atualizarControlesUsuario();
  } else if (tipo === "local") {
    document.getElementById("edit-campos-dinamicos").innerHTML = "";
    container.innerHTML = camposCadastroLocal({}, true);
  } else if (tipo === "evento") {
    document.getElementById("edit-campos-dinamicos").innerHTML = "";
    container.innerHTML =
      '<div class="space-y-3 text-xs"><label class="block font-bold">Título do evento<input id="uc-1" required class="block w-full border rounded-lg p-2 mt-1"></label><label class="block font-bold">Descrição<textarea id="uc-2" class="block w-full border rounded-lg p-2 mt-1"></textarea></label>' +
      camposAgendaEvento({}, true) +
      camposInscricaoEvento({}, true) +
      "</div>";
  } else if (tipo === "cliente") {
    container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs max-h-[70vh] overflow-y-auto p-1">
                    <p class="md:col-span-2 text-blue-900 bg-blue-50 rounded-lg p-3">Após salvar o órgão, cadastre seus colaboradores e selecione os contatos vinculados em Editar. As funções institucionais informadas nos colaboradores também podem atualizar os contatos automaticamente.</p><div><label class="block mb-1 font-bold">Nome do Órgão / Cliente</label><input id="uc-1" required class="w-full p-2 border rounded"></div>
                    <div><label class="block mb-1 font-bold">Sigla</label><input id="uc-sigla" class="w-full p-2 border rounded"></div>
                    <div><label class="block mb-1 font-bold">CNPJ</label><input id="uc-cnpj" class="w-full p-2 border rounded"></div>
                    <div><label class="block mb-1 font-bold">Telefone Fixo</label><input id="uc-tel" class="w-full p-2 border rounded input-mask-telefone" placeholder="(81) 3183-0000"></div>
                    <div><label class="block mb-1 font-bold">Situação do Contato</label><select id="uc-situacao" class="w-full p-2 border rounded"><option>Validado</option><option>Pendente</option><option>Desatualizado</option></select></div>
                    <div><label class="block mb-1 font-bold">Fonte da Informação</label><input id="uc-fonte" placeholder="Ex: Diário Oficial, WhatsApp" class="w-full p-2 border rounded"></div>

                    <div class="md:col-span-2 border-t pt-2 mt-1"><p class="font-bold text-blue-900">Endereço e Geolocalização (Fachada)</p></div>
                    <div class="md:col-span-2"><label class="block mb-1 font-bold">Endereço Completo</label><input id="uc-endereco" placeholder="Ex: Av. Rio Capibaribe, 147 - São José, Recife - PE" class="w-full p-2 border rounded"></div>
                    <div><label class="block mb-1 font-bold">Geolocalização (Lat, Long)</label><input id="uc-geo" placeholder="-8.0665354, -34.8846639" class="w-full p-2 border rounded"></div>
                    <div><label class="block mb-1 font-bold">URL da Imagem da Fachada</label><input id="uc-fachada" placeholder="https://..." class="w-full p-2 border rounded"></div>

                    <div class="md:col-span-2 border-t pt-2 mt-1"><p class="font-bold text-blue-900">Gestor do Órgão</p></div>
                    <div><input id="uc-gestor-orgao" placeholder="Nome Gestor do Órgão" class="w-full p-2 border rounded"></div>
                    <div><input id="uc-cargo-orgao" placeholder="Cargo Gestor" class="w-full p-2 border rounded"></div>
                    <div class="grid grid-cols-2 gap-1"><input id="uc-tel-orgao" placeholder="Telefone" class="p-2 border rounded input-mask-telefone"><input id="uc-email-orgao" placeholder="E-mail" class="p-2 border rounded"></div>

                    <div class="md:col-span-2 border-t pt-2 mt-1"><p class="font-bold text-blue-900">Gestor do NSI</p></div>
                    <div><input id="uc-gest-nsi" placeholder="Nome Gestor do NSI" class="w-full p-2 border rounded"></div>
                    <div class="grid grid-cols-2 gap-1"><input id="uc-tel-nsi" placeholder="Tel NSI" class="p-2 border rounded input-mask-telefone"><input id="uc-email-nsi" placeholder="E-mail NSI" class="p-2 border rounded"></div>

                    <div class="md:col-span-2 border-t pt-2 mt-1"><p class="font-bold text-blue-900">Gestor de Telemática</p></div>
                    <div><input id="uc-gest-tel" placeholder="Nome Gestor Telemática" class="w-full p-2 border rounded"></div>
                    <div class="grid grid-cols-2 gap-1"><input id="uc-tel-tel" placeholder="Tel Telemática" class="p-2 border rounded input-mask-telefone"><input id="uc-email-tel" placeholder="E-mail Telemática" class="p-2 border rounded"></div>

                    <div class="md:col-span-2 border-t pt-2 mt-1"><p class="font-bold text-blue-900">Gestor de SI</p></div>
                    <div><input id="uc-gest-si" placeholder="Nome Gestor SI" class="w-full p-2 border rounded"></div>
                    <div class="grid grid-cols-2 gap-1"><input id="uc-tel-si" placeholder="Tel SI" class="p-2 border rounded input-mask-telefone"><input id="uc-email-si" placeholder="E-mail SI" class="p-2 border rounded"></div>

                    <div class="md:col-span-2 border-t pt-2 mt-1"><p class="font-bold text-blue-900">Gestor do SEI</p></div>
                    <div><input id="uc-gest-sei" placeholder="Nome Gestor SEI" class="w-full p-2 border rounded"></div>
                    <div class="grid grid-cols-2 gap-1"><input id="uc-tel-sei" placeholder="Tel SEI" class="p-2 border rounded input-mask-telefone"><input id="uc-email-sei" placeholder="E-mail SEI" class="p-2 border rounded"></div>

                    <div class="md:col-span-2 border-t pt-2 mt-1"><p class="font-bold text-blue-900">Substitutos e Outros Contatos</p></div>
                    <div><input id="uc-pf-nome" placeholder="Nome Ponto Focal" class="w-full p-2 border rounded"></div>
                    <div class="grid grid-cols-2 gap-1"><input id="uc-pf-tel" placeholder="WhatsApp Focal" class="p-2 border rounded input-mask-telefone"><input id="uc-pf-email" placeholder="E-mail Focal" class="p-2 border rounded"></div>
                </div>`;
  } else if (tipo === "demanda") {
    container.innerHTML = `<div class="space-y-3 text-xs max-h-[70vh] overflow-y-auto p-1">
                    <div><label class="block mb-1 font-bold">Título da Demanda</label><input id="uc-demanda-titulo" required class="w-full p-2 border rounded"></div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div><label class="block mb-1 font-bold">Solicitante</label><input id="uc-demanda-solicitante" class="w-full p-2 border rounded" placeholder="Ex: Eduardo Salvador"></div>
                        <div><label class="block mb-1 font-bold">Local / Órgão</label><input id="uc-demanda-orgao" class="w-full p-2 border rounded" placeholder="Ex: ATI, DPG, Secretaria..."></div>
                    </div>
                    <div>
                        <label class="block mb-1 font-bold">Quem da GRGD é responsável por acompanhar (Múltiplos)</label>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border">
                            ${camposResponsaveis("uc-demanda-resp")}
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div><label class="block mb-1 font-bold">Data Específica</label><input type="date" id="uc-demanda-data" class="w-full p-2 border rounded"></div>
                        <div><label class="block mb-1 font-bold">Prioridade</label><select id="uc-demanda-prio" class="w-full p-2 border rounded"><option>Baixa</option><option selected>Média</option><option>Alta</option></select></div>
                        <div><label class="block mb-1 font-bold">Cor do Card</label><select id="uc-demanda-cor" class="w-full p-2 border rounded font-semibold">
                            ${prgdState.CORES_CARD_DEMANDA.map((cor) => `<option value="${cor.id}">${cor.nome}</option>`).join("")}
                        </select></div>
                    </div>
                    <div><label class="block mb-1 font-bold">Detalhes / Descrição</label><textarea id="uc-demanda-desc" rows="3" class="w-full p-2 border rounded" placeholder="Detalhes da demanda..."></textarea></div>
                </div>`;
  } else {
    container.innerHTML =
      '<div class="text-xs space-y-3"><div><label class="block mb-1 font-bold">Nome / Título</label><input type="text" id="uc-1" required class="w-full p-2 border rounded"></div><div><label class="block mb-1 font-bold">Descrição</label><input type="text" id="uc-2" class="w-full p-2 border rounded"></div></div>';
  }
  document.getElementById("modal-form-universal").classList.remove("hidden");
}

export async function salvarCadastroUniversal(e) {
  e.preventDefault();
  const tipo = document.getElementById("form-univ-tipo").value;
  const col = {
    usuario: "usuarios",
    cliente: "orgaos",
    demanda: "demandas",
    local: "locais",
    evento: "eventos",
    fornecedor: "fornecedores",
    base: "bases",
  }[tipo];
  if (!col || !podeAlterarColecao(col, "criar")) return;
  const val = (id) => document.getElementById(id)?.value || "";
  const agora = new Date().toISOString();
  const autor =
    prgdState.currentUser?.nome || prgdState.currentUser?.email || "Sistema";

  try {
    if (tipo === "usuario") {
      await criarCadastroUsuario();
    } else if (tipo === "local" || tipo === "evento") {
      if (!podeAlterarColecao(tipo === "local" ? "locais" : "eventos", "criar"))
        throw new Error("Ação não autorizada para este perfil.");
      const dados =
        tipo === "local"
          ? lerCadastroLocal(true)
          : {
              titulo: val("uc-1").trim(),
              nome: val("uc-1").trim(),
              descricao: val("uc-2"),
              ...lerAgendaEvento({}, true),
              ...lerInscricaoEvento({}, true),
            };
      if (tipo === "evento" && !dados.titulo)
        throw new Error("Informe o título do evento.");
      await adicionarComHistorico(
        collection(prgdState.db, tipo === "local" ? "locais" : "eventos"),
        {
          ...dados,
          criadoEm: agora,
          atualizadoEm: agora,
          criadoPor: autor,
          criadoPorUid: prgdState.currentUser.uid,
          editadoPor: autor,
          editadoPorUid: prgdState.currentUser.uid,
        },
      );
    } else if (tipo === "cliente") {
      await adicionarComHistorico(collection(prgdState.db, "orgaos"), {
        id: "CLI-" + Date.now(),
        nome: val("uc-1"),
        sigla: val("uc-sigla"),
        cnpj: val("uc-cnpj"),
        telefoneFixo: val("uc-tel"),
        situacaoContato: val("uc-situacao") || "Validado",
        fonteInformacao: val("uc-fonte") || "Cadastro Direto",
        endereco: val("uc-endereco").trim(),
        geolocalizacao: val("uc-geo").trim(),
        fotoFachada: val("uc-fachada").trim(),
        gestorOrgao: val("uc-gestor-orgao"),
        cargoGestorOrgao: val("uc-cargo-orgao"),
        telGestorOrgao: val("uc-tel-orgao"),
        emailGestorOrgao: val("uc-email-orgao"),
        gestorNsi: val("uc-gest-nsi"),
        telGestorNsi: val("uc-tel-nsi"),
        emailGestorNsi: val("uc-email-nsi"),
        gestorTelematica: val("uc-gest-tel"),
        telGestorTelematica: val("uc-tel-tel"),
        emailGestorTelematica: val("uc-email-tel"),
        gestorSi: val("uc-gest-si"),
        telGestorSi: val("uc-tel-si"),
        emailGestorSi: val("uc-email-si"),
        gestorSei: val("uc-gest-sei"),
        telGestorSei: val("uc-tel-sei"),
        emailGestorSei: val("uc-email-sei"),
        pontoFocalNome: val("uc-pf-nome"),
        pontoFocalTel: val("uc-pf-tel"),
        pontoFocalEmail: val("uc-pf-email"),
        gestorModalidadeSelecionada: "Órgão",
        criadoEm: agora,
        atualizadoEm: agora,
        criadoPor: autor,
        criadoPorUid: prgdState.currentUser?.uid || "",
        editadoPorUid: prgdState.currentUser?.uid || "",
        editadoPor: autor,
      });
    } else if (tipo === "demanda") {
      const dataNova = val("uc-demanda-data");
      const { diaSemana } = calcularInfoSemana(dataNova);
      const respCheckboxes = document.querySelectorAll(
        'input[name="uc-demanda-resp"]:checked',
      );
      const responsaveis = lerResponsaveis(respCheckboxes);

      await adicionarComHistorico(collection(prgdState.db, "demandas"), {
        id: "DEM-" + Date.now(),
        titulo: val("uc-demanda-titulo"),
        solicitante: val("uc-demanda-solicitante"),
        orgao: val("uc-demanda-orgao"),
        ...responsaveis,
        dataLimite: dataNova,
        diaSemana: diaSemana || "",
        prioridade: val("uc-demanda-prio") || "Média",
        corCard:
          val("uc-demanda-cor") || "bg-blue-50 border-blue-200 text-blue-900",
        descricao: val("uc-demanda-desc"),
        status: "Em Andamento",
        criadoEm: agora,
        atualizadoEm: agora,
        criadoPor: autor,
        criadoPorUid: prgdState.currentUser?.uid || "",
        editadoPorUid: prgdState.currentUser?.uid || "",
        editadoPor: autor,
      });
    } else {
      const colecoes = {
        evento: "eventos",
        local: "locais",
        fornecedor: "fornecedores",
        base: "bases",
      };
      if (!Object.hasOwn(colecoes, tipo))
        throw new Error("Tipo de cadastro não suportado.");
      await adicionarComHistorico(collection(prgdState.db, colecoes[tipo]), {
        id: "OBJ-" + Date.now(),
        nome: val("uc-1"),
        descricao: val("uc-2"),
        criadoEm: agora,
        atualizadoEm: agora,
        criadoPor: autor,
        criadoPorUid: prgdState.currentUser?.uid || "",
        editadoPorUid: prgdState.currentUser?.uid || "",
        editadoPor: autor,
      });
    }
    alert("Salvo na nuvem com sucesso!");
    fecharModal("modal-form-universal");
  } catch (err) {
    alert(traduzirErroSistema(err));
  }
}
