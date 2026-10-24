// Responsabilidade: services/subscriptions. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "../app/state.js";
import {
  ehAdministrador,
  possuiVinculo,
  acessoInstitucionalAtivo,
  podeAcao,
  portalInstitucional,
  nomePerfilAcesso,
  nomeOrgaoUsuario,
  programarRevisaoAcesso,
  modulosDoUsuario,
  assinaturaAcesso,
} from "../modules/acessos/policies.js";
import {
  observarPortal,
  iniciarPortalInstitucional,
} from "../modules/portal/index.js";
import {
  atualizarSetoresColaborador,
  renderColaboradoresAdmin,
} from "../modules/colaboradores/index.js";
import { renderGestaoSetores } from "../modules/acessos/delegation.js";
import {
  atualizarResumosUsuariosAbertos,
  preencherFiltrosUsuarios,
  renderUsuarios,
} from "../modules/acessos/accounts.js";
import { atualizarResumoContatosAberto } from "../modules/orgaos/contacts.js";
import {
  mensagemPerfil,
  atualizarFormularioPerfil,
} from "../modules/perfil/index.js";
import { renderizarTudo, atualizarContadoresAbas } from "../app/navigation.js";
import { renderClientes } from "../modules/orgaos/index.js";
import { renderEventos } from "../modules/eventos/index.js";
import { renderLocais } from "../modules/locais/index.js";
import { renderGrupos, renderDashboardKPIs } from "../modules/apoio/index.js";
import {
  limparDadosSessao,
  bloquearSessao,
} from "../modules/acessos/session.js";
import {
  collection,
  doc,
  onSnapshot,
  getDoc,
  query,
  where,
} from "./firebase.js";

export function pararSnapshots() {
  prgdState.snapshotUnsubs.forEach((fn) => {
    try {
      fn();
    } catch (e) {}
  });
  prgdState.snapshotUnsubs = [];
}

export function atualizarEventosVisiveis(lista) {
  // Esta consulta entrega a lista completa dos eventos públicos a cada snapshot.
  prgdState.eventosCacheMap = Object.fromEntries(
    lista.map((e) => [e.firestoreId || e.id, e]),
  );
  prgdState.dbData.eventos = Object.values(prgdState.eventosCacheMap);
  renderEventos();
  renderLocais();
  renderDashboardKPIs();
  atualizarContadoresAbas();
}

export function observarFirestore(
  ref,
  aoReceber,
  aoFalhar = (err) => console.warn("Firestore:", err.message),
) {
  const versaoAtual = prgdState.versaoSessao;
  return onSnapshot(
    ref,
    (snap) => {
      if (versaoAtual === prgdState.versaoSessao && prgdState.currentUser)
        aoReceber(snap);
    },
    (err) => {
      if (versaoAtual === prgdState.versaoSessao && prgdState.currentUser)
        aoFalhar(err);
    },
  );
}

export function iniciarSnapshotFirestore() {
  pararSnapshots();
  prgdState.eventosCacheMap = {};
  prgdState.inscricoesRelatorioEstado = "aguardando";
  if (!prgdState.currentUser) return;
  const modulos = modulosDoUsuario();
  programarRevisaoAcesso();
  if (ehAdministrador() || modulos.includes("clientes"))
    prgdState.snapshotUnsubs.push(
      observarFirestore(collection(prgdState.db, "setores"), (snap) => {
        prgdState.dbData.setores = snap.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        }));
        renderGestaoSetores();
        preencherFiltrosUsuarios();
        renderColaboradoresAdmin();
        atualizarSetoresColaborador();
      }),
    );
  else if (portalInstitucional() && acessoInstitucionalAtivo())
    observarPortal(
      "setores",
      query(
        collection(prgdState.db, "setores"),
        where(
          "orgaoId",
          "==",
          prgdState.currentUser.acessoInstitucional.orgaoId,
        ),
      ),
    );
  if (portalInstitucional()) iniciarPortalInstitucional();
  const colecoes = {
    demandas: "demandas",
    locais: "locais",
    orgaos: "clientes",
    fornecedores: "fornecedores",
    bases: "bases",
  };
  Object.entries(colecoes)
    .filter(([, modulo]) => modulos.includes(modulo))
    .forEach(([col]) => {
      prgdState.snapshotUnsubs.push(
        observarFirestore(collection(prgdState.db, col), (snap) => {
          prgdState.dbData[col] = snap.docs.map((d) => ({
            ...d.data(),
            firestoreId: d.id,
            id: d.data().id || d.id,
          }));
          renderizarTudo();
        }),
      );
    });
  const admin = ehAdministrador();
  if (admin) {
    prgdState.portalCarregando.colaboradores = true;
    prgdState.snapshotUnsubs.push(
      observarFirestore(
        collection(prgdState.db, "colaboradores"),
        (snap) => {
          prgdState.dbData.colaboradores = snap.docs.map((d) => ({
            ...d.data(),
            id: d.id,
          }));
          delete prgdState.portalCarregando.colaboradores;
          delete prgdState.portalErros.colaboradores;
          renderColaboradoresAdmin();
          renderUsuarios();
          atualizarResumosUsuariosAbertos();
        },
        () => {
          prgdState.dbData.colaboradores = [];
          delete prgdState.portalCarregando.colaboradores;
          prgdState.portalErros.colaboradores = true;
          renderColaboradoresAdmin();
          renderUsuarios();
          atualizarResumosUsuariosAbertos();
        },
      ),
    );
  }
  if (modulos.includes("clientes")) {
    prgdState.portalCarregando.contatosColaboradores = true;
    prgdState.snapshotUnsubs.push(
      observarFirestore(
        admin
          ? collection(prgdState.db, "contatosColaboradores")
          : query(
              collection(prgdState.db, "contatosColaboradores"),
              where("divulgavel", "==", true),
            ),
        (snap) => {
          prgdState.dbData.contatosColaboradores = snap.docs.map((d) => ({
            ...d.data(),
            id: d.id,
          }));
          delete prgdState.portalCarregando.contatosColaboradores;
          delete prgdState.portalErros.contatosColaboradores;
          renderClientes();
          atualizarResumoContatosAberto();
        },
        () => {
          prgdState.dbData.contatosColaboradores = [];
          delete prgdState.portalCarregando.contatosColaboradores;
          prgdState.portalErros.contatosColaboradores = true;
          renderClientes();
          atualizarResumoContatosAberto();
        },
      ),
    );
  }
  if (admin) {
    const ref = collection(prgdState.db, "usuarios");
    prgdState.snapshotUnsubs.push(
      observarFirestore(ref, (snap) => {
        prgdState.dbData.usuarios = snap.docs.map((d) => ({
          ...d.data(),
          firestoreId: d.id,
          id: d.data().id || d.id,
        }));
        renderizarTudo();
      }),
    );
  }
  prgdState.agendaLocaisEstado = modulos.includes("eventos")
    ? "carregando"
    : "sem-acesso";
  if (modulos.includes("eventos") && !portalInstitucional()) {
    const ref =
      admin ||
      (prgdState.currentUser.acessoInstitucional?.papel === "grgd" &&
        podeAcao("eventos"))
        ? collection(prgdState.db, "eventos")
        : query(
            collection(prgdState.db, "eventos"),
            where("eventoPublico", "==", true),
          );
    prgdState.snapshotUnsubs.push(
      observarFirestore(
        ref,
        (snap) => {
          prgdState.agendaLocaisEstado = admin ? "completa" : "parcial";
          atualizarEventosVisiveis(
            snap.docs.map((d) => ({
              ...d.data(),
              firestoreId: d.id,
              id: d.data().id || d.id,
            })),
          );
        },
        (err) => {
          prgdState.agendaLocaisEstado = "erro";
          prgdState.dbData.eventos = [];
          prgdState.eventosCacheMap = {};
          renderLocais();
          renderEventos();
          renderDashboardKPIs();
          atualizarContadoresAbas();
          console.warn("Agenda de locais:", err.message);
        },
      ),
    );
    if (
      admin ||
      !possuiVinculo() ||
      (prgdState.currentUser.acessoInstitucional?.papel === "grgd" &&
        podeAcao("relatorios"))
    ) {
      const inscricoes =
        admin || podeAcao("relatorios")
          ? collection(prgdState.db, "inscricoes")
          : query(
              collection(prgdState.db, "inscricoes"),
              where("uid", "==", prgdState.currentUser.uid),
            );
      if (admin) prgdState.inscricoesRelatorioEstado = "carregando";
      prgdState.snapshotUnsubs.push(
        observarFirestore(
          inscricoes,
          (snap) => {
            prgdState.dbData.inscricoes = snap.docs.map((d) => ({
              ...d.data(),
              firestoreId: d.id,
              id: d.data().id || d.id,
            }));
            if (admin) prgdState.inscricoesRelatorioEstado = "pronto";
            renderEventos();
          },
          () => {
            prgdState.dbData.inscricoes = [];
            if (admin) prgdState.inscricoesRelatorioEstado = "erro";
            renderEventos();
          },
        ),
      );
    }
  }
  if (admin)
    prgdState.snapshotUnsubs.push(
      observarFirestore(collection(prgdState.db, "grupos"), (snap) => {
        prgdState.dbData.grupos = snap.docs.map((d) => ({
          ...d.data(),
          firestoreId: d.id,
          id: d.data().id || d.id,
        }));
        renderGrupos();
        renderUsuarios();
        renderColaboradoresAdmin();
      }),
    );
  if (modulos.length && !admin && !portalInstitucional()) {
    const identidades = query(
      collection(prgdState.db, "identidadesUsuarios"),
      where("tipoUsuario", "==", "interno"),
      where("ativo", "==", true),
    );
    prgdState.snapshotUnsubs.push(
      observarFirestore(identidades, (snap) => {
        prgdState.identidadesUsuarios = snap.docs.map((d) => ({
          ...d.data(),
          uid: d.id,
        }));
        renderizarTudo();
      }),
    );
  }
  if (prgdState.currentUser.uid)
    prgdState.snapshotUnsubs.push(
      observarFirestore(
        doc(prgdState.db, "usuarios", prgdState.currentUser.uid),
        async (snap) => {
          if (
            !snap.exists() ||
            snap.data().ativo === false ||
            snap.data().excluido === true
          ) {
            await bloquearSessao(
              "Cadastro inativo ou não encontrado. Procure o administrador.",
            );
            return;
          }
          const atualizado = {
            ...snap.data(),
            uid: prgdState.currentUser.uid,
            id: snap.id,
            email: prgdState.currentUser.email,
          };
          const mudouAcesso =
            assinaturaAcesso(atualizado) !==
            assinaturaAcesso(prgdState.currentUser);
          if (mudouAcesso) {
            ++prgdState.versaoSessao;
            pararSnapshots();
            limparDadosSessao();
            prgdState.currentUser = atualizado;
            iniciarSnapshotFirestore();
          } else prgdState.currentUser = atualizado;
          document.getElementById("user-name-display").textContent =
            prgdState.currentUser.nome || prgdState.currentUser.email;
          document.getElementById("user-role-display").textContent =
            nomePerfilAcesso() +
            " • " +
            nomeOrgaoUsuario(prgdState.currentUser);
          renderizarTudo();
        },
        () => {
          bloquearSessao(
            "Não foi possível confirmar suas permissões. Entre novamente.",
          );
        },
      ),
    );
  if (prgdState.currentUser.uid)
    prgdState.snapshotUnsubs.push(
      observarFirestore(
        doc(
          prgdState.db,
          "usuarios",
          prgdState.currentUser.uid,
          "privado",
          "perfil",
        ),
        (snap) => {
          prgdState.dadosPessoaisPerfil = snap.exists() ? snap.data() : {};
          atualizarFormularioPerfil();
        },
        () => {
          prgdState.dadosPessoaisPerfil = null;
          if (prgdState.perfilEmEdicao) {
            mensagemPerfil(
              "Não foi possível carregar seus dados pessoais. Verifique o acesso e entre novamente.",
              true,
            );
            document.getElementById("perfil-salvar").disabled = true;
          }
        },
      ),
    );
}

export async function carregarPerfilFirebase(user) {
  const snap = await getDoc(doc(prgdState.db, "usuarios", user.uid));
  return snap.exists()
    ? { ...snap.data(), uid: user.uid, id: snap.id, email: user.email }
    : null;
}
