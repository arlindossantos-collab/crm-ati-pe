import {
  nomeSituacaoInscricao,
  dataHoraLocalFormulario,
  formatarDataExibicao,
} from "../../domain/display.js";
import { nomeReferencia } from "../../shared/record-display.js";
// Responsabilidade: modules/inscricoes/operations. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "../../app/state.js";
import {
  ehAdministrador,
  podeAcao,
  portalInstitucional,
  registroNoEscopo,
} from "../acessos/policies.js";
import { renderPortalInstitucional } from "../portal/index.js";
import {
  gestorPode,
  emailParticipante,
  chaveInscricao,
  eventoElegivelInstitucional,
  mensagemPortal,
  logPortal,
} from "../colaboradores/index.js";
import {
  atualizarPainelInscricoesEvento,
  mensagemPainelInscricoes,
} from "./panel.js";
import {
  traduzirErroSistema,
  formatarData,
  esc,
} from "../../shared/presentation.js";
import { fecharModal } from "../../app/navigation.js";
import {
  atualizarEventosVisiveis,
  observarFirestore,
} from "../../services/subscriptions.js";
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  runTransaction,
  increment,
  serverTimestamp,
} from "../../services/firebase.js";

export function abrirInscricaoInstitucional(eventId) {
  if (!gestorPode("inscricoes.criar")) return;
  const e = prgdState.dbData.eventos.find(
    (e) => String(e.firestoreId || e.id) === eventId,
  );
  if (!eventoElegivelInstitucional(e)) {
    mensagemPortal(
      "Este evento não está elegível, está fora do período ou está lotado.",
      true,
    );
    return;
  }
  prgdState.eventoInscricaoId = eventId;
  const pessoas = prgdState.dbData.colaboradores.filter(
    (p) => p.ativo !== false && registroNoEscopo(p),
  );
  document.getElementById("insc-contexto").textContent =
    e.titulo +
    " · " +
    e.inscritosCount +
    "/" +
    e.limiteVagas +
    " vagas ocupadas. A confirmação será verificada no servidor.";
  document.getElementById("insc-participante").innerHTML =
    '<option value="">Selecione o colaborador</option>' +
    pessoas
      .map(
        (p) =>
          `<option value="${esc(p.id)}">${esc(p.nome)} — ${esc(p.emailInstitucional)}</option>`,
      )
      .join("");
  document.getElementById("insc-erro").textContent = pessoas.length
    ? ""
    : "Cadastre um colaborador ativo antes de inscrever.";
  document.getElementById("insc-confirmar").disabled = !pessoas.length;
  document
    .getElementById("modal-inscricao-institucional")
    .classList.remove("hidden");
}

export async function gravarInscricaoInstitucional(
  eventId,
  participanteId,
  cancelarId = "",
) {
  const uid = prgdState.currentUser?.uid,
    sessao = prgdState.versaoSessao,
    acao = cancelarId ? "inscricoes.cancelar" : "inscricoes.criar";
  if (!(cancelarId && ehAdministrador()) && !gestorPode(acao))
    throw new Error("Ação não autorizada na sua delegação.");
  const pessoa = cancelarId
    ? null
    : prgdState.dbData.colaboradores.find(
        (p) => p.id === participanteId && registroNoEscopo(p),
      );
  if (!cancelarId && !pessoa)
    throw new Error("Selecione um colaborador do seu escopo.");
  const id =
      cancelarId || (await chaveInscricao(eventId, pessoa.emailInstitucional)),
    ref = doc(prgdState.db, "inscricoes", id),
    eventoRef = doc(prgdState.db, "eventos", eventId),
    log = doc(collection(prgdState.db, "historicoAlteracoes"));
  await runTransaction(prgdState.db, async (t) => {
    const [eventoSnap, inscricaoSnap, pessoaSnap] = await Promise.all([
      cancelarId ? Promise.resolve(null) : t.get(eventoRef),
      t.get(ref),
      cancelarId
        ? Promise.resolve(null)
        : t.get(doc(prgdState.db, "colaboradores", participanteId)),
    ]);
    const evento = eventoSnap?.exists() ? eventoSnap.data() : null,
      antes = inscricaoSnap.exists() ? inscricaoSnap.data() : null,
      p = pessoaSnap?.exists() ? pessoaSnap.data() : null;
    if (
      sessao !== prgdState.versaoSessao ||
      prgdState.currentUser?.uid !== uid ||
      (!(cancelarId && ehAdministrador()) && !gestorPode(acao))
    )
      throw new Error("Sua sessão ou delegação mudou.");
    if (
      !cancelarId &&
      (!evento || evento.modeloInscricao !== prgdState.MODELO_INSCRICAO)
    )
      throw new Error("Este evento não aceita inscrição por representação.");
    if (cancelarId) {
      if (
        !antes ||
        (!ehAdministrador() && !registroNoEscopo(antes)) ||
        antes.situacao !== "confirmada" ||
        antes.eventId !== eventId
      )
        throw new Error(
          "Inscrição já cancelada ou indisponível no seu escopo.",
        );
    } else {
      if (!p || p.ativo === false || !registroNoEscopo(p))
        throw new Error("O colaborador não está ativo no seu escopo.");
      if (p.emailInstitucional !== pessoa.emailInstitucional)
        throw new Error("O cadastro mudou. Reabra a inscrição.");
      if (!eventoElegivelInstitucional(evento))
        throw new Error(
          "Inscrições encerradas, órgão não elegível ou vagas esgotadas.",
        );
      if (
        antes &&
        (!registroNoEscopo(antes) ||
          antes.participanteId !== participanteId ||
          antes.situacao !== "cancelada")
      )
        throw new Error("Já existe inscrição para esse e-mail no evento.");
    }
    const novo = cancelarId
      ? { ...antes, situacao: "cancelada" }
      : {
          modeloInscricao: prgdState.MODELO_INSCRICAO,
          eventId,
          participanteId,
          emailInstitucional: p.emailInstitucional,
          participanteNome: p.nome,
          orgaoId: p.orgaoId,
          setorId: p.setorId,
          eventoTitulo: evento.titulo,
          eventoData: evento.dataInicio || "",
          situacao: "confirmada",
          protocolo: id,
          criadoEm: antes?.criadoEm || serverTimestamp(),
          criadoPorUid: antes?.criadoPorUid || uid,
        };
    Object.assign(novo, {
      atualizadoEm: serverTimestamp(),
      atualizadoPorUid: uid,
      ultimaAuditoriaId: log.id,
    });
    const total = cancelarId ? null : evento.inscritosCount + 1;
    if (
      !cancelarId &&
      (!Number.isInteger(total) || total < 0 || total > evento.limiteVagas)
    )
      throw new Error("A contagem de vagas precisa ser revisada pela GRGD.");
    t.set(ref, novo);
    t.set(
      eventoRef,
      {
        inscritosCount: cancelarId ? increment(-1) : total,
        ultimaInscricaoId: id,
      },
      { merge: true },
    );
    t.set(
      log,
      logPortal(
        ref,
        novo,
        cancelarId ? "cancelar_inscricao" : "inscrever",
        ["situacao"],
        log,
      ),
    );
  });
  return { id, uid, sessao };
}

export async function confirmarInscricaoInstitucional(ev) {
  ev.preventDefault();
  if (prgdState.portalOperacao) return;
  prgdState.portalOperacao = true;
  const btn = document.getElementById("insc-confirmar");
  btn.disabled = true;
  const uid = prgdState.currentUser?.uid,
    sessao = prgdState.versaoSessao;
  try {
    await gravarInscricaoInstitucional(
      prgdState.eventoInscricaoId,
      document.getElementById("insc-participante").value,
    );
    if (
      sessao === prgdState.versaoSessao &&
      prgdState.currentUser?.uid === uid
    ) {
      fecharModal("modal-inscricao-institucional");
      mensagemPortal(
        "Inscrição confirmada. Consulte o protocolo em Inscrições do órgão.",
      );
    }
  } catch (err) {
    if (sessao === prgdState.versaoSessao && prgdState.currentUser?.uid === uid)
      document.getElementById("insc-erro").textContent =
        traduzirErroSistema(err);
  } finally {
    prgdState.portalOperacao = false;
    btn.disabled = false;
  }
}

export async function cancelarInscricaoInstitucional(id) {
  const i = prgdState.dbData.inscricoes.find(
    (i) => i.id === id && (ehAdministrador() || registroNoEscopo(i)),
  );
  if (
    !i ||
    (!ehAdministrador() && !gestorPode("inscricoes.cancelar")) ||
    prgdState.portalOperacao
  )
    return;
  if (
    !confirm(
      "Cancelar a inscrição de " +
        i.participanteNome +
        "? A vaga será liberada e o histórico preservado.",
    )
  )
    return;
  const uid = prgdState.currentUser.uid,
    sessao = prgdState.versaoSessao;
  prgdState.portalOperacao = true;
  mensagemPainelInscricoes(i.eventId, "Cancelando inscrição…");
  atualizarPainelInscricoesEvento();
  try {
    await gravarInscricaoInstitucional(i.eventId, "", id);
    if (
      sessao === prgdState.versaoSessao &&
      prgdState.currentUser?.uid === uid
    ) {
      mensagemPortal("Inscrição cancelada. A vaga foi liberada.");
      mensagemPainelInscricoes(
        i.eventId,
        "Inscrição cancelada. A vaga foi liberada e o histórico preservado.",
      );
    }
  } catch (err) {
    if (
      sessao === prgdState.versaoSessao &&
      prgdState.currentUser?.uid === uid
    ) {
      mensagemPortal(traduzirErroSistema(err), true);
      mensagemPainelInscricoes(i.eventId, traduzirErroSistema(err));
    }
  } finally {
    prgdState.portalOperacao = false;
    atualizarPainelInscricoesEvento();
  }
}

export async function consultarComprovante(id, imprimir = false) {
  if (
    !podeAcao("comprovantes") ||
    (!ehAdministrador() && !portalInstitucional())
  )
    return;
  const uid = prgdState.currentUser.uid,
    sessao = prgdState.versaoSessao;
  try {
    const snap = await getDoc(doc(prgdState.db, "inscricoes", id)),
      i = snap.exists() ? snap.data() : null;
    if (sessao !== prgdState.versaoSessao || prgdState.currentUser?.uid !== uid)
      return;
    if (
      !i ||
      i.modeloInscricao !== prgdState.MODELO_INSCRICAO ||
      (!ehAdministrador() && !registroNoEscopo(i)) ||
      !podeAcao("comprovantes")
    )
      throw new Error("Comprovante indisponível no seu escopo.");
    prgdState.comprovanteAtualId = id;
    const orgao = prgdState.dbData.orgaos.find(
        (o) => String(o.firestoreId || o.id) === i.orgaoId,
      ),
      setor = prgdState.dbData.setores.find((s) => s.id === i.setorId);
    const campo = (nome, valor) =>
      `<div class="border-b py-2"><dt class="text-xs text-slate-500">${esc(nome)}</dt><dd class="font-semibold break-words">${esc(valor || "—")}</dd></div>`;
    document.getElementById("comprovante-conteudo").innerHTML =
      `<p class="text-sm text-blue-800 font-bold">ATI/PE · PRGD</p><h3 class="text-xl font-bold my-3">Comprovante de inscrição</h3><p class="font-bold ${i.situacao === "cancelada" ? "text-red-800" : i.situacao === "confirmada" ? "text-emerald-800" : "text-amber-800"}">${i.situacao === "confirmada" ? "Inscrição confirmada" : i.situacao === "cancelada" ? "Inscrição cancelada" : "Situação da inscrição não informada"}</p><dl class="text-sm mt-4">${campo("Participante", i.participanteNome)}${campo("Órgão", orgao?.nome || nomeReferencia("orgaos", i.orgaoId))}${campo("Setor", setor?.nome || nomeReferencia("setores", i.setorId))}${campo("Evento", i.eventoTitulo)}${campo("Data informada na inscrição", formatarData(i.eventoData))}${campo("Protocolo", i.protocolo)}${campo("Última atualização do registro", formatarDataExibicao(i.atualizadoEm, true))}</dl><p class="text-xs text-slate-500 mt-4">Este documento comprova o registro e a situação da inscrição no momento da consulta. A presença no evento exige comprovação própria. Documento sem assinatura digital ou consulta pública de autenticidade.</p>`;
    document.getElementById("modal-comprovante").classList.remove("hidden");
    if (imprimir) window.print();
  } catch (err) {
    if (
      sessao === prgdState.versaoSessao &&
      prgdState.currentUser?.uid === uid
    ) {
      document.getElementById("comprovante-conteudo").innerHTML = "";
      fecharModal("modal-comprovante");
      mensagemPortal(traduzirErroSistema(err), true);
    }
  }
}

export function renderAcoesPortal() {
  document
    .getElementById("btn-novo-colaborador")
    ?.classList.toggle("hidden", !gestorPode("participantes.cadastrar"));
  const busca = emailParticipante(
      document.getElementById("colaborador-busca")?.value,
    ),
    setor = document.getElementById("colaborador-setor-filtro")?.value,
    pessoas = prgdState.dbData.colaboradores.filter(
      (p) =>
        registroNoEscopo(p) &&
        (!setor || p.setorId === setor) &&
        (!busca ||
          [p.nome, p.emailInstitucional, p.cargo].some((s) =>
            String(s || "")
              .toLowerCase()
              .includes(busca),
          )),
    );
  if (
    !prgdState.portalCarregando.colaboradores &&
    prgdState.portalErros.colaboradores !== true
  )
    document.getElementById("portal-colaboradores").innerHTML =
      pessoas
        .map(
          (p) =>
            `<tr><td class="p-3 border-t">${esc(p.nome)}</td><td class="p-3 border-t">${esc(p.emailInstitucional)}</td><td class="p-3 border-t">${esc(nomeReferencia("setores", p.setorId))}</td><td class="p-3 border-t">${p.ativo === false ? "Inativo" : "Ativo"}</td><td class="p-3 border-t">${gestorPode("participantes.editar") ? `<button type="button" data-colaborador-editar="${esc(p.id)}" class="border rounded-lg px-3 py-2 text-blue-900">Editar</button>` : ""}</td></tr>`,
        )
        .join("") ||
      '<tr><td colspan="5" class="p-4 text-slate-500">Nenhum colaborador encontrado no seu escopo.</td></tr>';
  if (
    !prgdState.portalCarregando.inscricoes &&
    prgdState.portalErros.inscricoes !== true
  )
    document.getElementById("portal-inscricoes").innerHTML =
      prgdState.dbData.inscricoes
        .filter((i) => registroNoEscopo(i))
        .map(
          (i) =>
            `<tr><td class="p-3 border-t">${esc(i.participanteNome || i.nome || "—")}</td><td class="p-3 border-t">${esc(i.eventoTitulo || nomeReferencia("eventos", i.eventId))}</td><td class="p-3 border-t">${esc(nomeSituacaoInscricao(i.situacao, i.modeloInscricao))}</td><td class="p-3 border-t break-all text-xs">${esc(i.protocolo || "—")}</td><td class="p-3 border-t"><div class="flex flex-wrap gap-2">${i.modeloInscricao === prgdState.MODELO_INSCRICAO && podeAcao("comprovantes") ? `<button type="button" data-comprovante="${esc(i.id)}" class="border rounded-lg px-3 py-2 text-blue-900">Comprovante</button>` : ""}${i.modeloInscricao === prgdState.MODELO_INSCRICAO && i.situacao === "confirmada" && gestorPode("inscricoes.cancelar") ? `<button type="button" data-inscricao-cancelar="${esc(i.id)}" class="border rounded-lg px-3 py-2 text-slate-700">Cancelar inscrição</button>` : ""}</div></td></tr>`,
        )
        .join("") ||
      '<tr><td colspan="5" class="p-4 text-slate-500">Nenhuma inscrição disponível no seu escopo.</td></tr>';
}

export function observarEventosPortal() {
  prgdState.eventosPortalFontes = {};
  const fontes = {
    publicos: query(
      collection(prgdState.db, "eventos"),
      where("eventoPublico", "==", true),
    ),
    elegiveis: query(
      collection(prgdState.db, "eventos"),
      where(
        "orgaosElegiveis",
        "array-contains",
        prgdState.currentUser.acessoInstitucional.orgaoId,
      ),
    ),
  };
  Object.keys(fontes).forEach(
    (fonte) => (prgdState.portalCarregando["eventos_" + fonte] = true),
  );
  Object.entries(fontes).forEach(([fonte, ref]) =>
    prgdState.snapshotUnsubs.push(
      observarFirestore(
        ref,
        (snap) => {
          delete prgdState.portalCarregando["eventos_" + fonte];
          prgdState.eventosPortalFontes[fonte] = snap.docs.map((d) => ({
            ...d.data(),
            id: d.id,
            firestoreId: d.id,
          }));
          delete prgdState.portalErros["eventos_" + fonte];
          atualizarEventosVisiveis(
            Object.values(prgdState.eventosPortalFontes).flat(),
          );
          renderPortalInstitucional();
        },
        () => {
          delete prgdState.portalCarregando["eventos_" + fonte];
          prgdState.eventosPortalFontes[fonte] = [];
          prgdState.portalErros["eventos_" + fonte] = true;
          atualizarEventosVisiveis(
            Object.values(prgdState.eventosPortalFontes).flat(),
          );
          renderPortalInstitucional();
        },
      ),
    ),
  );
}

export function camposInscricaoEvento(item = {}, novo = false) {
  if (!novo && item.modeloInscricao !== prgdState.MODELO_INSCRICAO)
    return '<p class="text-xs text-slate-500 mt-3">Evento anterior: inscrições no fluxo original. Para inscrições por representação, crie um novo evento institucional.</p>';
  const data = dataHoraLocalFormulario,
    sel = item.orgaosElegiveis || [];
  return `<fieldset class="border rounded-xl p-3 space-y-3 mt-4"><legend class="font-bold text-sm">Inscrições pelo gestor do órgão</legend>${novo ? '<label class="block"><input id="evt-institucional" type="checkbox"> Habilitar inscrição institucional neste novo evento</label>' : '<p class="text-xs text-blue-900">Modelo institucional: contador e protocolos são atualizados pelas inscrições.</p>'}<label class="block text-xs"><input id="evt-inscricoes-abertas" type="checkbox" ${item.inscricoesAbertas !== false ? "checked" : ""}> Receber inscrições dentro do período</label><div class="grid sm:grid-cols-3 gap-3"><label class="text-xs">Início das inscrições<input id="evt-inscricao-inicio" type="datetime-local" value="${data(item.inscricaoInicio)}" class="block w-full border p-2 rounded-lg"></label><label class="text-xs">Fim das inscrições<input id="evt-inscricao-fim" type="datetime-local" value="${data(item.inscricaoFim)}" class="block w-full border p-2 rounded-lg"></label><label class="text-xs">Total de vagas<input id="evt-limite-vagas" type="number" min="1" step="1" value="${item.limiteVagas || ""}" class="block w-full border p-2 rounded-lg"></label></div><label class="block text-xs">Órgãos elegíveis (selecione um ou mais)<select id="evt-orgaos-elegiveis" multiple size="5" class="block w-full border rounded-lg p-2">${prgdState.dbData.orgaos
    .map((o) => {
      const id = String(o.firestoreId || o.id);
      return `<option value="${esc(id)}" ${sel.includes(id) ? "selected" : ""}>${esc(o.sigla || o.nome || id)}</option>`;
    })
    .join("")}${sel
    .filter(
      (id) =>
        !prgdState.dbData.orgaos.some(
          (o) => String(o.firestoreId || o.id) === id,
        ),
    )
    .map(
      (id) =>
        `<option value="${esc(id)}" selected>${esc(id)} (vínculo anterior)</option>`,
    )
    .join(
      "",
    )}</select></label><p class="text-xs text-slate-500">Use Ctrl para selecionar vários órgãos. A elegibilidade usa os IDs aprovados, sem deduzir acesso pelo domínio do e-mail.</p></fieldset>`;
}

export function lerInscricaoEvento(item = {}, novo = false) {
  const habilitado = novo
    ? document.getElementById("evt-institucional")?.checked
    : item.modeloInscricao === prgdState.MODELO_INSCRICAO;
  if (!habilitado) return {};
  const inicio = new Date(
      document.getElementById("evt-inscricao-inicio").value,
    ).getTime(),
    fim = new Date(
      document.getElementById("evt-inscricao-fim").value,
    ).getTime(),
    vagas = Number(document.getElementById("evt-limite-vagas").value),
    orgaos = [
      ...document.getElementById("evt-orgaos-elegiveis").selectedOptions,
    ].map((o) => o.value);
  if (
    !Number.isInteger(inicio) ||
    !Number.isInteger(fim) ||
    fim <= inicio ||
    !Number.isInteger(vagas) ||
    vagas < 1 ||
    vagas < (item.inscritosCount || 0) ||
    !orgaos.length ||
    orgaos.length > 100
  )
    throw new Error(
      "Revise o período de inscrições, os órgãos elegíveis e as vagas (sem reduzir abaixo das ocupadas).",
    );
  return {
    modeloInscricao: prgdState.MODELO_INSCRICAO,
    inscricoesAbertas: document.getElementById("evt-inscricoes-abertas")
      .checked,
    inscricaoInicio: inicio,
    inscricaoFim: fim,
    limiteVagas: vagas,
    orgaosElegiveis: orgaos,
    ...(novo ? { inscritosCount: 0 } : {}),
  };
}
