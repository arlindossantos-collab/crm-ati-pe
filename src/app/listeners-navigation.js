// Responsabilidade: app/listeners-navigation. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "./state.js";
import {
  ehAdministrador,
  podeAcao,
  podeAlterarColecao,
} from "../modules/acessos/policies.js";
import { atualizarCamposVinculo } from "../modules/acessos/delegation.js";
import {
  renderColaboradoresAdmin,
  mostrarSecaoColaboradores,
  abrirAcessoColaborador,
} from "../modules/colaboradores/index.js";
import {
  adicionarComHistorico,
  salvarComHistorico,
} from "../modules/auditoria/index.js";
import { atualizarControlesUsuario } from "../modules/acessos/accounts.js";
import { atualizarPainelInscricoesEvento } from "../modules/inscricoes/panel.js";
import {
  traduzirErroSistema,
  calcularInfoSemana,
} from "../shared/presentation.js";
import { fecharModal, configurarInterface } from "./navigation.js";
import { renderClientes } from "../modules/orgaos/index.js";
import { renderDemandas } from "../modules/demandas/index.js";
import { baixarRelatorioInscricoes } from "../modules/inscricoes/reports.js";
import { renderPainelLocal, selecionarLocal } from "../modules/locais/index.js";
import {
  detalharRegistro,
  cancelarExclusao,
  excluirRegistroUniversal,
} from "./forms.js";
import { collection, doc } from "../services/firebase.js";

export function bindApplicationEvents() {
  configurarInterface();
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    if (prgdState.exclusaoPendente) {
      cancelarExclusao();
      return;
    }
    if (prgdState.perfilEmEdicao) {
      fecharModal("modal-perfil");
      document.getElementById("btn-meu-perfil").focus?.();
    }
  });
  document.addEventListener(
    "error",
    (ev) => {
      if (ev.target.matches?.("img[data-avatar]")) ev.target.remove();
    },
    true,
  );
  document.addEventListener("change", async (ev) => {
    if (["usuario-tipo", "usuario-perfil"].includes(ev.target.id))
      atualizarControlesUsuario();
    if (
      [
        "vinculo-papel",
        "vinculo-orgao",
        "vinculo-setores",
        "vinculo-inicio",
        "vinculo-fim",
        "vinculo-revisao",
        "vinculo-titular",
        "vinculo-operacoes",
      ].includes(ev.target.id) ||
      ev.target.name === "vinculo-acao"
    ) {
      document.getElementById("vinculo-situacao").value = "pendente";
      document.getElementById("vinculo-grgd-ref").value = "";
      document.getElementById("vinculo-autoridade-ref").value = "";
    }
    if (["vinculo-papel", "vinculo-orgao"].includes(ev.target.id)) {
      atualizarCamposVinculo();
      if (ev.target.id === "vinculo-papel") atualizarControlesUsuario();
    }
    const inputData = ev.target.closest?.(".input-data-demanda");
    if (inputData) {
      if (!podeAlterarColecao("demandas")) return;
      const firestoreId = inputData.getAttribute("data-firestore-id");
      const novaData = inputData.value;
      const demandaObj = prgdState.dbData.demandas.find(
        (x) =>
          String(x.firestoreId) === String(firestoreId) ||
          String(x.id) === String(firestoreId),
      );
      if (!demandaObj || !firestoreId) return;

      try {
        const agora = new Date().toISOString();
        const autor =
          prgdState.currentUser?.nome ||
          prgdState.currentUser?.email ||
          "Sistema";
        const { diaSemana } = calcularInfoSemana(novaData);
        const historicoAcoes = [
          ...(demandaObj.historicoAcoes || []),
          {
            data: agora,
            autor,
            autorUid: prgdState.currentUser?.uid || "",
            texto: `Data alterada para ${novaData} (${diaSemana || "fim de semana/outro"})`,
          },
        ];

        await salvarComHistorico(
          doc(prgdState.db, "demandas", String(firestoreId)),
          {
            dataLimite: novaData,
            diaSemana: diaSemana || "",
            historicoAcoes,
            atualizadoEm: agora,
            editadoPorUid: prgdState.currentUser?.uid || "",
            editadoPor: autor,
          },
          { merge: true },
        );

        demandaObj.dataLimite = novaData;
        demandaObj.diaSemana = diaSemana || "";
        renderDemandas();
      } catch (err) {
        alert(traduzirErroSistema(err));
      }
      return;
    }

    const selectDia = ev.target.closest?.(".select-diaselect-demanda");
    if (selectDia) {
      if (!podeAlterarColecao("demandas")) return;
      const firestoreId = selectDia.getAttribute("data-firestore-id");
      const novoDia = selectDia.value;
      const demandaObj = prgdState.dbData.demandas.find(
        (x) =>
          String(x.firestoreId) === String(firestoreId) ||
          String(x.id) === String(firestoreId),
      );
      if (!demandaObj || !firestoreId) return;

      try {
        const agora = new Date().toISOString();
        const autor =
          prgdState.currentUser?.nome ||
          prgdState.currentUser?.email ||
          "Sistema";
        const historicoAcoes = [
          ...(demandaObj.historicoAcoes || []),
          {
            data: agora,
            autor,
            autorUid: prgdState.currentUser?.uid || "",
            texto: `Movido para o dia da semana: ${novoDia || "Nenhum"}`,
          },
        ];

        await salvarComHistorico(
          doc(prgdState.db, "demandas", String(firestoreId)),
          {
            diaSemana: novoDia,
            historicoAcoes,
            atualizadoEm: agora,
            editadoPorUid: prgdState.currentUser?.uid || "",
            editadoPor: autor,
          },
          { merge: true },
        );

        demandaObj.diaSemana = novoDia;
        renderDemandas();
      } catch (err) {
        alert(traduzirErroSistema(err));
      }
      return;
    }

    const selectMod = ev.target.closest?.(".select-modalidade-gestor");
    if (selectMod) {
      if (!podeAlterarColecao("orgaos")) return;
      const firestoreId = selectMod.getAttribute("data-firestore-id");
      const novaModalidade = selectMod.value;
      const orgaoObj = prgdState.dbData.orgaos.find(
        (x) =>
          String(x.firestoreId) === String(firestoreId) ||
          String(x.id) === String(firestoreId),
      );
      if (!orgaoObj || !firestoreId) return;

      try {
        const agora = new Date().toISOString();
        const autor =
          prgdState.currentUser?.nome ||
          prgdState.currentUser?.email ||
          "Sistema";
        await salvarComHistorico(
          doc(prgdState.db, "orgaos", String(firestoreId)),
          {
            gestorModalidadeSelecionada: novaModalidade,
            atualizadoEm: agora,
            editadoPorUid: prgdState.currentUser?.uid || "",
            editadoPor: autor,
          },
          { merge: true },
        );

        orgaoObj.gestorModalidadeSelecionada = novaModalidade;
        renderClientes();
      } catch (err) {
        alert(traduzirErroSistema(err));
      }
      return;
    }
  });
  document.addEventListener("change", (ev) => {
    const selectDetMod = ev.target.closest?.("#detalhe-select-modalidade");
    if (selectDetMod) {
      const mod = selectDetMod.value;
      const firestoreId = document.getElementById("edit-doc-id").value;
      const item = prgdState.dbData.orgaos.find(
        (x) =>
          String(x.firestoreId) === String(firestoreId) ||
          String(x.id) === String(firestoreId),
      );
      if (!item) return;

      let nivel = "Gestor do Órgão";
      let nome =
        item.gestorOrgao || item.respInstitucionalNome || "Não informado";
      let email =
        item.emailGestorOrgao || item.respInstitucionalEmail || "Não informado";
      let tel =
        item.telGestorOrgao || item.respInstitucionalTel || "Não informado";

      if (mod === "NSI") {
        nivel = "Gestor do NSI";
        nome = item.gestorNsi || "Não informado";
        email = item.emailGestorNsi || "Não informado";
        tel = item.telGestorNsi || "Não informado";
      } else if (mod === "Telemática") {
        nivel = "Gestor de Telemática";
        nome = item.gestorTelematica || "Não informado";
        email = item.emailGestorTelematica || "Não informado";
        tel = item.telGestorTelematica || "Não informado";
      } else if (mod === "SI") {
        nivel = "Gestor de SI";
        nome = item.gestorSi || "Não informado";
        email = item.emailGestorSi || "Não informado";
        tel = item.telGestorSi || "Não informado";
      } else if (mod === "SEI") {
        nivel = "Gestor do SEI";
        nome = item.gestorSei || "Não informado";
        email = item.emailGestorSei || "Não informado";
        tel = item.telGestorSei || "Não informado";
      }

      const nivelEl = document.getElementById("det-card2-nivel");
      const nomeEl = document.getElementById("det-card2-nome");
      const emailEl = document.getElementById("det-card2-email");
      const telEl = document.getElementById("det-card2-tel");
      if (nivelEl) nivelEl.textContent = nivel;
      if (nomeEl) nomeEl.textContent = nome;
      if (emailEl) emailEl.textContent = email;
      if (telEl) telEl.textContent = tel;
    }
  });
  document.addEventListener("click", async (ev) => {
    const secao = ev.target.closest?.("[data-colab-secao]");
    if (secao) {
      mostrarSecaoColaboradores(secao.dataset.colabSecao);
      return;
    }
    const orgao = ev.target.closest?.("[data-colab-orgao]");
    if (orgao && ehAdministrador()) {
      document.getElementById("admin-colab-orgao").value =
        orgao.dataset.colabOrgao;
      document.getElementById("admin-colab-setor").value = "";
      renderColaboradoresAdmin();
      return;
    }
    const acesso = ev.target.closest?.("[data-colaborador-acesso]");
    if (acesso) {
      abrirAcessoColaborador(acesso.dataset.colaboradorAcesso);
      return;
    }
    const acaoUsuario = ev.target.closest?.(
      "[data-usuario-editar], [data-usuario-excluir]",
    );
    if (acaoUsuario) {
      if (!ehAdministrador()) return;
      const excluir = acaoUsuario.hasAttribute("data-usuario-excluir");
      const id = acaoUsuario.getAttribute(
        excluir ? "data-usuario-excluir" : "data-usuario-editar",
      );
      detalharRegistro("usuarios", id);
      if (excluir) await excluirRegistroUniversal();
      else document.getElementById("usuario-nome")?.focus();
      return;
    }
    const detalheLocal = ev.target.closest?.("[data-local-detalhes]");
    if (detalheLocal) {
      selecionarLocal(detalheLocal.getAttribute("data-local-detalhes"));
      return;
    }
    const editarLocal = ev.target.closest?.("[data-local-editar]");
    if (editarLocal) {
      if (podeAlterarColecao("locais"))
        detalharRegistro(
          "locais",
          editarLocal.getAttribute("data-local-editar"),
        );
      return;
    }
    if (ev.target.closest?.("#local-fechar-painel")) {
      prgdState.localSelecionadoId = "";
      renderPainelLocal();
      return;
    }
    const btnDetalhes = ev.target.closest?.(".tr-detalhe");
    if (btnDetalhes) {
      ev.stopPropagation();
      detalharRegistro(
        btnDetalhes.dataset.colecao || "demandas",
        btnDetalhes.dataset.id,
      );
      return;
    }

    const painelEvento = ev.target.closest?.("[data-painel-inscricoes]");
    if (painelEvento) {
      if (ehAdministrador()) {
        detalharRegistro(
          "eventos",
          painelEvento.getAttribute("data-painel-inscricoes"),
        );
        document
          .getElementById("painel-inscricoes-evento")
          ?.scrollIntoView?.({ block: "start", behavior: "smooth" });
      }
      return;
    }
    if (ev.target.closest?.("#painel-inscricoes-limpar")) {
      [
        "painel-inscricoes-busca",
        "painel-inscricoes-situacao",
        "painel-inscricoes-orgao",
      ].forEach((id) => {
        document.getElementById(id).value = "";
      });
      atualizarPainelInscricoesEvento();
      return;
    }
    const relatorioEvento = ev.target.closest?.("[data-relatorio-evento]");
    if (relatorioEvento) {
      try {
        baixarRelatorioInscricoes(
          relatorioEvento.getAttribute("data-relatorio-evento"),
        );
      } catch (err) {
        alert(err.message || "Não foi possível preparar o relatório.");
      }
      return;
    }

    const btnInscricao = ev.target.closest?.("[data-acao-inscricao]");
    if (btnInscricao) {
      const eventId = btnInscricao.getAttribute("data-acao-inscricao");
      if (!podeAcao("inscricoes", "propria")) return;
      try {
        await adicionarComHistorico(collection(prgdState.db, "inscricoes"), {
          eventId: String(eventId),
          uid: prgdState.currentUser.uid,
          nome: prgdState.currentUser.nome || prgdState.currentUser.email,
          email: prgdState.currentUser.email,
          criadoEm: new Date().toISOString(),
        });
        alert("Inscrição realizada com sucesso!");
      } catch (err) {
        alert(traduzirErroSistema(err));
      }
      return;
    }
  });
}
