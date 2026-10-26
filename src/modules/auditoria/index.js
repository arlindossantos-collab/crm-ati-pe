import { rotuloCampo, formatarDataExibicao } from "../../domain/display.js";
// Responsabilidade: modules/auditoria/index. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "../../app/state.js";
import { ehAdministrador } from "../acessos/policies.js";
import { traduzirErroSistema, esc } from "../../shared/presentation.js";
import {
  collection,
  doc,
  query,
  getDocs,
  runTransaction,
  serverTimestamp,
  orderBy,
  limit,
  startAfter,
} from "../../services/firebase.js";

export function dadosRegistroAuditoria(ref, antes, depois, remover = false) {
  const partes = ref.path.split("/");
  const privado =
    partes.length === 4 && partes[0] === "usuarios" && partes[2] === "privado";
  const colecao = privado ? "perfilPrivado" : partes[0],
    registroId = privado ? partes[1] : ref.id;
  const acao = remover
    ? "excluir"
    : depois.excluido === true && antes?.excluido !== true
      ? "excluir_usuario"
      : antes
        ? "editar"
        : "criar";
  const campos = [
    ...new Set([...Object.keys(antes || {}), ...Object.keys(depois || {})]),
  ]
    .filter(
      (k) =>
        !prgdState.METADADOS_AUDITORIA.includes(k) &&
        (remover || JSON.stringify(antes?.[k]) !== JSON.stringify(depois?.[k])),
    )
    .sort();
  const item = depois || antes || {};
  return {
    ...(item.orgaoId
      ? {
          orgaoId: item.orgaoId,
          ...(item.setorId ? { setorId: item.setorId } : {}),
        }
      : {}),
    colecao,
    registroId,
    acao,
    campos,
    registroNome: String(
      privado
        ? "Perfil pessoal"
        : item.nome || item.titulo || item.id || registroId,
    ).slice(0, 180),
  };
}

export async function gravarComHistorico(operacoes) {
  const uid = prgdState.currentUser?.uid,
    sessao = prgdState.versaoSessao;
  if (!uid) throw new Error("Entre no sistema antes de alterar um registro.");
  const autorNome =
    prgdState.currentUser.nome || prgdState.currentUser.email || uid;
  // Referências criadas fora da transação mantêm o mesmo ID se o Firestore repetir a tentativa.
  const itens = operacoes.map((op) => ({
    ...op,
    logRef: op.ref.path.startsWith("identidadesUsuarios/")
      ? null
      : doc(collection(prgdState.db, "historicoAlteracoes")),
  }));
  await runTransaction(prgdState.db, async (transacao) => {
    const carregados = [];
    for (const op of itens) {
      const snap = op.novo || !op.logRef ? null : await transacao.get(op.ref);
      carregados.push(snap?.exists() ? snap.data() : null);
    }
    if (sessao !== prgdState.versaoSessao || prgdState.currentUser?.uid !== uid)
      throw new Error("Sua sessão mudou. Nenhuma alteração foi confirmada.");
    const logs = [];
    itens.forEach((op, i) => {
      const antes = carregados[i];
      if (op.remover && !antes)
        throw new Error("Este registro já foi excluído.");
      let dados = { ...op.dados };
      const depois = op.remover
        ? null
        : op.options?.merge
          ? { ...antes, ...dados }
          : dados;
      if (op.logRef) {
        const registro = dadosRegistroAuditoria(
          op.ref,
          antes,
          depois,
          op.remover,
        );
        if (
          !prgdState.COLECOES_AUDITADAS.includes(registro.colecao) &&
          registro.colecao !== "perfilPrivado"
        )
          throw new Error("Coleção não permitida para alteração.");
        logs.push({
          ref: op.logRef,
          dados: {
            ...registro,
            autorUid: uid,
            autorNome,
            criadoEm: serverTimestamp(),
          },
        });
        if (registro.colecao === "usuarios" && !op.remover)
          dados.ultimaAuditoriaId = op.logRef.id;
      }
      if (op.remover) transacao.delete(op.ref);
      else if (op.options) transacao.set(op.ref, dados, op.options);
      else transacao.set(op.ref, dados);
    });
    logs.forEach((log) => transacao.set(log.ref, log.dados));
  });
}

export async function adicionarComHistorico(ref, dados) {
  const registro = doc(ref);
  await gravarComHistorico([{ ref: registro, dados, novo: true }]);
  return registro;
}

export async function salvarComHistorico(ref, dados, options) {
  await gravarComHistorico([{ ref, dados, options }]);
}

export async function excluirComHistorico(ref) {
  await gravarComHistorico([{ ref, remover: true }]);
}

export async function registrarMudancaSenha(uid, sessao) {
  if (
    sessao !== prgdState.versaoSessao ||
    prgdState.currentUser?.uid !== uid ||
    prgdState.auth.currentUser?.uid !== uid
  )
    return;
  await prgdState.auth.currentUser.getIdToken(true);
  if (sessao !== prgdState.versaoSessao || prgdState.currentUser?.uid !== uid)
    return;
  const registro = {
    colecao: "autenticacao",
    registroId: uid,
    registroNome: "Conta de acesso",
    acao: "alterar_senha",
    campos: ["senha"],
    autorUid: uid,
    autorNome: prgdState.currentUser.nome || prgdState.currentUser.email || uid,
    criadoEm: serverTimestamp(),
  };
  await runTransaction(prgdState.db, async (transacao) =>
    transacao.set(
      doc(collection(prgdState.db, "historicoAlteracoes")),
      registro,
    ),
  );
}

export function renderHistoricoAlteracoes() {
  if (!ehAdministrador()) return;
  const busca = (
    document.getElementById("historico-busca").value || ""
  ).toLocaleLowerCase("pt-BR");
  const registros = prgdState.historicoRegistros.filter((r) =>
    [
      r.autorNome,
      r.autorUid,
      r.registroNome,
      r.registroId,
      prgdState.NOMES_COLECOES[r.colecao],
      ...(r.campos || []),
      ...(r.campos || []).map(rotuloCampo),
    ]
      .join(" ")
      .toLocaleLowerCase("pt-BR")
      .includes(busca),
  );
  document.getElementById("historico-registros").innerHTML =
    registros
      .map((r) => {
        const horario = r.criadoEm
          ? formatarDataExibicao(r.criadoEm, true)
          : "Aguardando horário do servidor";
        return `<tr><td class="p-3 whitespace-nowrap">${esc(horario)}</td><td class="p-3">${esc(r.autorNome || "Responsável não informado")}</td><td class="p-3"><b>${esc(prgdState.NOMES_ACOES[r.acao] || rotuloCampo(r.acao))}</b> · ${esc(prgdState.NOMES_COLECOES[r.colecao] || rotuloCampo(r.colecao))}<br>${esc(r.registroNome || "Registro sem nome")}<details class="mt-2 text-xs"><summary class="cursor-pointer">Identificadores do registro</summary><p class="break-all">Referência: ${esc(r.registroId || "Não informada")}</p><p class="break-all">Conta responsável: ${esc(r.autorUid || "Não informada")}</p></details></td><td class="p-3">${esc((r.campos || []).map(rotuloCampo).join(", ") || "Informações do registro")}</td></tr>`;
      })
      .join("") ||
    '<tr><td colspan="4" class="p-4 text-slate-500">Nenhuma alteração encontrada nos registros carregados.</td></tr>';
}

export async function carregarHistoricoAlteracoes(reiniciar = false) {
  if (!ehAdministrador() || prgdState.historicoCarregando) return;
  const uid = prgdState.currentUser.uid,
    sessao = prgdState.versaoSessao,
    versao = ++prgdState.historicoVersao;
  prgdState.historicoCarregando = true;
  const msg = document.getElementById("historico-mensagem"),
    mais = document.getElementById("historico-mais");
  msg.textContent = "Carregando alterações…";
  mais.disabled = true;
  if (reiniciar) {
    prgdState.historicoRegistros = [];
    prgdState.historicoUltimo = null;
  }
  try {
    const args = [orderBy("criadoEm", "desc"), limit(50)];
    if (prgdState.historicoUltimo)
      args.push(startAfter(prgdState.historicoUltimo));
    const snap = await getDocs(
      query(collection(prgdState.db, "historicoAlteracoes"), ...args),
    );
    if (
      versao !== prgdState.historicoVersao ||
      sessao !== prgdState.versaoSessao ||
      prgdState.currentUser?.uid !== uid ||
      !ehAdministrador()
    )
      return;
    prgdState.historicoRegistros.push(
      ...snap.docs.map((d) => ({ ...d.data(), id: d.id })),
    );
    prgdState.historicoUltimo = snap.docs.at(-1) || prgdState.historicoUltimo;
    mais.hidden = snap.docs.length < 50;
    msg.textContent = `${prgdState.historicoRegistros.length} registro(s) carregado(s). A busca considera os registros carregados.`;
    renderHistoricoAlteracoes();
  } catch (err) {
    if (
      versao === prgdState.historicoVersao &&
      sessao === prgdState.versaoSessao &&
      ehAdministrador()
    )
      msg.textContent = traduzirErroSistema(err);
  } finally {
    if (versao === prgdState.historicoVersao) {
      prgdState.historicoCarregando = false;
      mais.disabled = false;
    }
  }
}

export function abrirHistoricoAlteracoes() {
  if (!ehAdministrador()) return;
  document
    .getElementById("modal-historico-alteracoes")
    .classList.remove("hidden");
  carregarHistoricoAlteracoes(true);
}
