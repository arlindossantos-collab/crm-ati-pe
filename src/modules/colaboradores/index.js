// Responsabilidade: modules/colaboradores/index. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "../../app/state.js";
import {
  ehAdministrador,
  acessoInstitucionalAtivo,
  podeAcao,
  portalInstitucional,
  nomePerfilAcesso,
  registroNoEscopo,
  modulosDoUsuario,
} from "../acessos/policies.js";
import { guardarNavegacao, fecharModal } from "../../app/navigation.js";
import {
  estadoAcessoUsuario,
  cardCadastro,
  atualizarControlesUsuario,
  identidadePublica,
} from "../acessos/accounts.js";
import { dadosRegistroAuditoria } from "../auditoria/index.js";
import { uidCadastro } from "../../shared/identity.js";
import { traduzirErroSistema, esc } from "../../shared/presentation.js";
import { detalharRegistro, abrirModalForm } from "../../app/forms.js";
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "../../services/firebase.js";

export function gestorPode(acao) {
  const v = prgdState.currentUser?.acessoInstitucional;
  if (
    !portalInstitucional() ||
    !["gestor_nsi", "substituto"].includes(v?.papel) ||
    !acessoInstitucionalAtivo() ||
    v.operacoesVersao !== "v1" ||
    !v.acoes.includes(acao)
  )
    return false;
  return acao.startsWith("participantes.")
    ? podeAcao("participantes")
    : podeAcao("inscricoes") &&
        podeAcao("eventos") &&
        (acao !== "inscricoes.criar" || podeAcao("participantes"));
}

export function emailParticipante(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase();
}

export async function hashInstitucional(texto) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(texto),
  );
  return Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

export async function chaveColaborador(orgaoId, email) {
  return hashInstitucional(orgaoId + "|" + emailParticipante(email));
}

export async function chaveInscricao(eventId, email) {
  return eventId + "__" + (await hashInstitucional(emailParticipante(email)));
}

export function validarDadosColaborador(p) {
  if (!p.nome || p.nome.length < 2 || p.nome.length > 150)
    throw new Error("Informe o nome do colaborador (2 a 150 caracteres).");
  if (
    p.emailInstitucional.length > 254 ||
    !/^[^ /@]+@[^ /@]+\.[^ /@]+$/.test(p.emailInstitucional)
  )
    throw new Error("Informe um e-mail institucional válido.");
  if (
    !p.setorId ||
    !setoresDoGestor().some(
      (s) => s.id === p.setorId && s.orgaoId === p.orgaoId,
    ) ||
    !registroNoEscopo(p)
  )
    throw new Error("Selecione um setor ativo dentro da sua delegação.");
  if (
    typeof (p.matricula ?? "") !== "string" ||
    (p.matricula || "").length > 50
  )
    throw new Error("A matrícula deve ter até 50 caracteres.");
  if (p.telefone.length > 40 || p.cargo.length > 150)
    throw new Error("Revise o telefone e o cargo.");
  return p;
}

export function eventoElegivelInstitucional(e, agora = Date.now()) {
  const orgao = prgdState.currentUser?.acessoInstitucional?.orgaoId;
  return (
    e?.modeloInscricao === prgdState.MODELO_INSCRICAO &&
    Array.isArray(e.orgaosElegiveis) &&
    e.orgaosElegiveis.includes(orgao) &&
    e.inscricoesAbertas === true &&
    Number.isFinite(e.inscricaoInicio) &&
    Number.isFinite(e.inscricaoFim) &&
    e.inscricaoInicio <= agora &&
    e.inscricaoFim > agora &&
    !["Cancelado", "Realizado"].includes(e.status) &&
    Number.isInteger(e.inscritosCount) &&
    e.inscritosCount >= 0 &&
    Number.isInteger(e.limiteVagas) &&
    e.inscritosCount < e.limiteVagas
  );
}

export function limparOperacoesInstitucionais() {
  prgdState.colaboradorEmEdicao = null;
  prgdState.eventoInscricaoId = "";
  prgdState.comprovanteAtualId = "";
  [
    "modal-colaborador",
    "modal-inscricao-institucional",
    "modal-comprovante",
  ].forEach((id) => document.getElementById(id)?.classList.add("hidden"));
  document.getElementById("comprovante-conteudo").innerHTML = "";
  for (const id of [
    "colab-nome",
    "colab-emailInstitucional",
    "colab-telefone",
    "colab-matricula",
    "colab-cargo",
    "colab-validade",
    "colaborador-busca",
  ])
    document.getElementById(id).value = "";
  for (const id of [
    "colab-setorId",
    "colab-orgao",
    "colab-funcoes",
    "insc-participante",
    "colaborador-setor-filtro",
  ])
    document.getElementById(id).innerHTML = "";
  for (const id of [
    "colab-erro",
    "colab-setores-msg",
    "insc-erro",
    "insc-contexto",
    "colab-contexto",
  ])
    document.getElementById(id).textContent = "";
}

export function mensagemPortal(texto, erro = false) {
  const el = document.getElementById("portal-operacao-msg");
  if (!el) return;
  el.textContent = texto;
  el.className =
    "p-3 rounded-xl text-sm border " +
    (erro
      ? "bg-red-50 text-red-800 border-red-100"
      : "bg-emerald-50 text-emerald-900 border-emerald-100");
  el.classList.toggle("hidden", !texto);
}

export function logPortal(ref, registro, acao, campos, logRef) {
  return {
    autorUid: prgdState.currentUser.uid,
    autorNome:
      prgdState.currentUser.nome ||
      prgdState.currentUser.email ||
      prgdState.currentUser.uid,
    criadoEm: serverTimestamp(),
    colecao: ref.collection || ref.path.split("/")[0],
    registroId: ref.id,
    registroNome: String(
      registro.nome || registro.participanteNome || ref.id,
    ).slice(0, 180),
    acao,
    campos,
    orgaoId: registro.orgaoId,
    setorId: registro.setorId,
  };
}

export function setoresDoGestor() {
  const v = prgdState.currentUser?.acessoInstitucional;
  if (ehAdministrador())
    return prgdState.dbData.setores
      .filter(
        (s) =>
          s.orgaoId === document.getElementById("colab-orgao").value &&
          s.ativo === true,
      )
      .sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"));
  return v
    ? prgdState.dbData.setores
        .filter(
          (s) =>
            s.orgaoId === v.orgaoId &&
            s.ativo === true &&
            (!v.setoresIds.length || v.setoresIds.includes(s.id)),
        )
        .sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"))
    : [];
}

export function atualizarSetoresColaborador(selecionado = null) {
  const campo = document.getElementById("colab-setorId"),
    filtro = document.getElementById("colaborador-setor-filtro");
  if (!campo) return;
  const setores = setoresDoGestor(),
    valor = selecionado ?? campo.value;
  const opcoes = setores
    .map((s) => `<option value="${esc(s.id)}">${esc(s.nome || s.id)}</option>`)
    .join("");
  const placeholder = prgdState.portalCarregando.setores
    ? "Carregando setores…"
    : prgdState.portalErros.setores
      ? "Não foi possível carregar os setores"
      : !setores.length
        ? "Nenhum setor ativo disponível"
        : "Selecione o setor";
  const html = `<option value="">${placeholder}</option>` + opcoes;
  if (campo.innerHTML !== html) {
    campo.innerHTML = html;
    campo.value = valor;
  }
  campo.disabled =
    !!prgdState.portalCarregando.setores ||
    !!prgdState.portalErros.setores ||
    !setores.length;
  const msg = document.getElementById("colab-setores-msg");
  if (msg)
    msg.textContent = prgdState.portalErros.setores
      ? "Não foi possível confirmar os setores. Solicite à GRGD a revisão do acesso."
      : prgdState.portalCarregando.setores
        ? "Aguarde o carregamento dos setores."
        : !setores.length
          ? "Peça ao administrador para cadastrar um setor ativo em Colaboradores → Setores e grupos e conferir sua delegação."
          : "";
  document.getElementById("colab-salvar").disabled =
    prgdState.portalOperacao ||
    !!prgdState.portalCarregando.setores ||
    !!prgdState.portalErros.setores ||
    !setores.length;
  if (filtro) {
    const atual = filtro.value,
      htmlFiltro =
        '<option value="">Todos os setores autorizados</option>' + opcoes;
    if (filtro.innerHTML !== htmlFiltro) {
      filtro.innerHTML = htmlFiltro;
      filtro.value = atual;
    }
  }
}

export function abrirColaborador(id = "") {
  const p = id ? prgdState.dbData.colaboradores.find((i) => i.id === id) : null;
  if (
    (!ehAdministrador() &&
      !gestorPode(id ? "participantes.editar" : "participantes.cadastrar")) ||
    (id && (!p || !registroNoEscopo(p)))
  )
    return;
  prgdState.colaboradorEmEdicao = p
    ? {
        id: p.id,
        uid: prgdState.currentUser.uid,
        sessao: prgdState.versaoSessao,
      }
    : null;
  document.getElementById("colab-titulo").textContent = id
    ? "Editar colaborador"
    : "Cadastrar colaborador";
  for (const k of [
    "nome",
    "emailInstitucional",
    "telefone",
    "cargo",
    "matricula",
  ])
    document.getElementById("colab-" + k).value = p?.[k] || "";
  document.getElementById("colab-emailInstitucional").readOnly = !!p;
  document.getElementById("colab-setorId").value = p?.setorId || "";
  document.getElementById("colab-ativo").checked = p?.ativo !== false;
  const orgaoCampo = document.getElementById("colab-orgao");
  orgaoCampo.innerHTML =
    '<option value="">Selecione o órgão</option>' +
    prgdState.dbData.orgaos
      .map(
        (o) =>
          `<option value="${esc(o.firestoreId || o.id)}">${esc(o.sigla || o.nome)}</option>`,
      )
      .join("");
  orgaoCampo.value =
    p?.orgaoId || document.getElementById("admin-colab-orgao").value || "";
  orgaoCampo.disabled = !!p;
  document
    .getElementById("colab-orgao-label")
    .classList.toggle("hidden", !ehAdministrador());
  document.getElementById("colab-validade").value = p?.validadeCadastro
    ? new Date(p.validadeCadastro).toLocaleDateString("en-CA", {
        timeZone: "America/Recife",
      })
    : "";
  document.getElementById("colab-funcoes").innerHTML = Object.entries(
    prgdState.FUNCOES_CONTATO,
  )
    .map(
      ([id, f]) =>
        `<label class="text-xs"><input type="checkbox" name="colab-funcao" value="${id}" ${(p?.funcoesContato || []).includes(id) ? "checked" : ""}> ${esc(f.nome)}</label>`,
    )
    .join("");
  atualizarSetoresColaborador(p?.setorId || "");
  const orgao = prgdState.dbData.orgaos.find(
    (o) =>
      String(o.firestoreId || o.id) ===
      (ehAdministrador()
        ? orgaoCampo.value
        : prgdState.currentUser.acessoInstitucional.orgaoId),
  );
  document.getElementById("colab-contexto").textContent =
    "Órgão: " +
    (orgao?.nome || orgao?.sigla || "órgão vinculado") +
    ". O cadastro não cria conta de acesso.";
  document.getElementById("colab-erro").textContent = "";
  document.getElementById("modal-colaborador").classList.remove("hidden");
}

export async function salvarColaborador(ev) {
  ev.preventDefault();
  if (prgdState.portalOperacao) return;
  const edicao = prgdState.colaboradorEmEdicao,
    acao = edicao ? "participantes.editar" : "participantes.cadastrar",
    uid = prgdState.currentUser?.uid,
    sessao = prgdState.versaoSessao;
  if (!ehAdministrador() && !gestorPode(acao)) return;
  prgdState.portalOperacao = true;
  const botao = document.getElementById("colab-salvar");
  botao.disabled = true;
  try {
    if (edicao && (edicao.uid !== uid || edicao.sessao !== sessao))
      throw new Error("Sua sessão mudou. Abra o cadastro novamente.");
    const val = (k) => document.getElementById("colab-" + k).value.trim(),
      v = prgdState.currentUser.acessoInstitucional;
    const dados = validarDadosColaborador({
      nome: val("nome"),
      emailInstitucional: emailParticipante(val("emailInstitucional")),
      orgaoId: ehAdministrador()
        ? document.getElementById("colab-orgao").value
        : v.orgaoId,
      setorId: val("setorId"),
      telefone: val("telefone"),
      cargo: val("cargo"),
      matricula: val("matricula"),
      ativo: document.getElementById("colab-ativo").checked,
      validadeCadastro: lerValidadeCadastro(),
      funcoesContato: Array.from(
        document.querySelectorAll('[name="colab-funcao"]:checked'),
      ).map((c) => c.value),
    });
    const id = await chaveColaborador(dados.orgaoId, dados.emailInstitucional),
      ref = doc(prgdState.db, "colaboradores", id),
      log = doc(collection(prgdState.db, "historicoAlteracoes"));
    if (edicao && edicao.id !== id)
      throw new Error(
        "Órgão e e-mail identificam este cadastro e não podem ser alterados.",
      );
    await runTransaction(prgdState.db, async (t) => {
      const snap = await t.get(ref),
        antes = snap.exists() ? snap.data() : null;
      if (
        sessao !== prgdState.versaoSessao ||
        prgdState.currentUser?.uid !== uid ||
        (!ehAdministrador() && !gestorPode(acao))
      )
        throw new Error("Sua sessão ou delegação mudou.");
      if (edicao ? !antes || !registroNoEscopo(antes) : !!antes)
        throw new Error(
          edicao
            ? "Cadastro não disponível no seu escopo."
            : "Já existe um colaborador com esse e-mail no órgão.",
        );
      if (antes && antes.emailInstitucional !== dados.emailInstitucional)
        throw new Error(
          "O e-mail é preservado na edição. Solicite revisão à GRGD.",
        );
      const novo = {
        ...dados,
        ...(antes?.usuarioUid ? { usuarioUid: antes.usuarioUid } : {}),
        criadoEm: antes?.criadoEm || serverTimestamp(),
        criadoPorUid: antes?.criadoPorUid || uid,
        atualizadoEm: serverTimestamp(),
        atualizadoPorUid: uid,
        ultimaAuditoriaId: log.id,
      };
      const campos = Object.keys(dados).filter(
        (k) => JSON.stringify(antes?.[k]) !== JSON.stringify(dados[k]),
      );
      t.set(
        doc(prgdState.db, "contatosColaboradores", id),
        projecaoContato(novo),
      );
      t.set(ref, novo);
      t.set(
        log,
        logPortal(ref, novo, edicao ? "editar" : "criar", campos, log),
      );
    });
    if (
      sessao === prgdState.versaoSessao &&
      prgdState.currentUser?.uid === uid
    ) {
      fecharModal("modal-colaborador");
      prgdState.colaboradorEmEdicao = null;
      mensagemPortal("Colaborador salvo. Nenhuma conta de acesso foi criada.");
    }
  } catch (err) {
    if (sessao === prgdState.versaoSessao && prgdState.currentUser?.uid === uid)
      document.getElementById("colab-erro").textContent =
        traduzirErroSistema(err);
  } finally {
    prgdState.portalOperacao = false;
    atualizarSetoresColaborador();
  }
}

export function situacaoCadastroColaborador(p, agora = Date.now()) {
  if (p.ativo === false) return { id: "inativo", nome: "Inativo" };
  if (p.validadeCadastro == null)
    return { id: "sem_prazo", nome: "Sem prazo informado" };
  return p.validadeCadastro <= agora
    ? { id: "vencido", nome: "Revisão vencida" }
    : { id: "ativo", nome: "Atualizado" };
}

export function lerValidadeCadastro() {
  const valor = document.getElementById("colab-validade").value;
  if (!valor) return null;
  const data = new Date(valor + "T23:59:59.999-03:00").getTime();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || !Number.isFinite(data))
    throw new Error("Informe uma data válida para a revisão cadastral.");
  return data;
}

export function projecaoContato(p) {
  return {
    nome: p.nome,
    emailInstitucional: p.emailInstitucional,
    telefone: p.telefone,
    cargo: p.cargo,
    orgaoId: p.orgaoId,
    setorId: p.setorId,
    ativo: p.ativo,
    validadeCadastro: p.validadeCadastro ?? null,
    funcoesContato: p.funcoesContato || [],
    divulgavel: (p.funcoesContato || []).length > 0,
    origemAuditoriaId: p.ultimaAuditoriaId || "",
    atualizadoEm: p.atualizadoEm,
  };
}

export function preencherOpcoesPreservando(id, lista, rotulo, titulo) {
  const campo = document.getElementById(id),
    valor = campo.value;
  const html =
    `<option value="">${titulo}</option>` +
    lista
      .map(
        (i) =>
          `<option value="${esc(i.firestoreId || i.id)}">${esc(rotulo(i))}</option>`,
      )
      .join("");
  if (campo.innerHTML !== html) {
    campo.innerHTML = html;
    campo.value = valor;
  }
}

export function renderColaboradoresAdmin() {
  const admin = ehAdministrador();
  mostrarSecaoColaboradores(prgdState.secaoColaboradores, false);
  document
    .getElementById("colaboradores-portal-area")
    .classList.toggle("hidden", admin);
  if (!admin) {
    document.getElementById("admin-colab-lista").innerHTML = "";
    document.getElementById("colaboradores-por-orgao").innerHTML = "";
    return;
  }
  preencherOpcoesPreservando(
    "admin-colab-orgao",
    prgdState.dbData.orgaos,
    (o) => (o.sigla ? o.sigla + " · " : "") + (o.nome || ""),
    "Todos os órgãos",
  );
  const org = document.getElementById("admin-colab-orgao").value;
  preencherOpcoesPreservando(
    "admin-colab-setor",
    prgdState.dbData.setores.filter((s) => !org || s.orgaoId === org),
    (s) => s.nome,
    "Todos os setores",
  );
  const valor = (id) => document.getElementById(id).value,
    q = emailParticipante(valor("admin-colab-busca")),
    setor = valor("admin-colab-setor"),
    situacao = valor("admin-colab-situacao"),
    conta = valor("admin-colab-conta");
  const nomeOrgao = (p) =>
    prgdState.dbData.orgaos.find(
      (o) => String(o.firestoreId || o.id) === p.orgaoId,
    )?.sigla ||
    prgdState.dbData.orgaos.find(
      (o) => String(o.firestoreId || o.id) === p.orgaoId,
    )?.nome ||
    p.orgaoId;
  const nomeSetor = (p) =>
    prgdState.dbData.setores.find((s) => s.id === p.setorId)?.nome || p.setorId;
  const lista = prgdState.dbData.colaboradores.filter(
    (p) =>
      (!org || p.orgaoId === org) &&
      (!setor || p.setorId === setor) &&
      (!situacao || situacaoCadastroColaborador(p).id === situacao) &&
      (!conta ||
        (conta === "com"
          ? !!p.usuarioUid
          : conta === "sem"
            ? !p.usuarioUid
            : conta === "liberado"
              ? acessoDoColaborador(p).liberado
              : !!p.usuarioUid && !acessoDoColaborador(p).liberado)) &&
      (!q ||
        [
          p.nome,
          p.matricula,
          p.emailInstitucional,
          p.cargo,
          nomeOrgao(p),
          prgdState.dbData.orgaos.find(
            (o) => String(o.firestoreId || o.id) === p.orgaoId,
          )?.nome,
          nomeSetor(p),
        ].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(q),
        )),
  );
  const erro = prgdState.portalErros.colaboradores,
    carregando = prgdState.portalCarregando.colaboradores;
  renderColaboradoresPorOrgao(lista, erro || carregando);
  document.getElementById("admin-colab-status").textContent = erro
    ? "Não foi possível carregar os colaboradores. Verifique as regras do Firebase e tente novamente."
    : carregando
      ? "Carregando colaboradores…"
      : `${lista.length} de ${prgdState.dbData.colaboradores.length} colaborador(es). Revisão cadastral não altera permissões de acesso.`;
  const total = (id) =>
    prgdState.dbData.colaboradores.filter(
      (p) => situacaoCadastroColaborador(p).id === id,
    ).length;
  document.getElementById("colaboradores-indicadores").innerHTML = [
    [
      "Total de colaboradores",
      prgdState.dbData.colaboradores.length,
      "fa-users",
    ],
    ["Revisão vencida", total("vencido"), "fa-calendar-check"],
    ["Sem prazo informado", total("sem_prazo"), "fa-clock"],
    [
      "Usuários vinculados",
      prgdState.dbData.colaboradores.filter((p) => p.usuarioUid).length,
      "fa-link",
    ],
  ]
    .map(([nome, n, icone]) =>
      cardCadastro(nome, erro || carregando ? "—" : n, icone),
    )
    .join("");
  document.getElementById("admin-colab-lista").innerHTML =
    erro || carregando
      ? ""
      : lista
          .map((p) => {
            const acesso = acessoDoColaborador(p),
              usuario = acesso.usuario,
              st = situacaoCadastroColaborador(p);
            return `<tr class="border-t"><td class="p-3"><b>${esc(p.nome)}</b><small class="block">${esc(p.emailInstitucional)}</small><small class="block text-slate-500">Matrícula: ${esc(p.matricula || "Não informada")}</small><small class="block text-slate-500">${esc(p.telefone || "")} ${esc(p.cargo || "")}</small></td><td class="p-3">${esc(nomeOrgao(p))}<small class="block">${esc(nomeSetor(p))}</small></td><td class="p-3">${esc((p.funcoesContato || []).map((f) => prgdState.FUNCOES_CONTATO[f]?.nome || f).join(", ") || "Sem função indicada")}</td><td class="p-3"><span class="text-blue-900">${esc(st.nome)}</span><small class="block">${p.validadeCadastro ? esc(new Date(p.validadeCadastro).toLocaleDateString("pt-BR", { timeZone: "America/Recife" })) : "Revisão não informada"}</small></td><td class="p-3"><b>${esc(acesso.nome)}</b><small class="block">${esc(usuario?.email || "")}</small><small class="block">${esc(usuario ? nomePerfilAcesso(usuario) : "")}</small></td><td class="p-3"><div class="flex flex-wrap gap-2"><button type="button" data-colaborador-editar="${esc(p.id)}" class="border rounded-lg px-3 py-2 text-blue-900">Editar</button><button type="button" data-colaborador-vincular="${esc(p.id)}" class="border rounded-lg px-3 py-2 text-blue-900">${p.usuarioUid ? "Ver vínculo" : "Vincular conta existente"}</button><button type="button" data-colaborador-acesso="${esc(p.id)}" class="border border-blue-200 bg-blue-50/70 rounded-lg px-3 py-2 text-blue-900">${p.usuarioUid ? "Gerenciar permissões" : "Criar acesso"}</button></div></td></tr>`;
          })
          .join("") ||
        '<tr><td colspan="6" class="p-4 text-slate-500">Nenhum colaborador encontrado.</td></tr>';
}

export function mostrarSecaoColaboradores(secao = "cadastros", guardar = true) {
  if (!["cadastros", "acessos", "estrutura"].includes(secao)) return;
  const admin = ehAdministrador();
  prgdState.secaoColaboradores = admin ? secao : "cadastros";
  for (const [id, nome] of [
    ["admin-colaboradores", "cadastros"],
    ["aba-usuarios", "acessos"],
    ["colaboradores-estrutura", "estrutura"],
  ])
    document
      .getElementById(id)
      .classList.toggle(
        "hidden",
        !admin || prgdState.secaoColaboradores !== nome,
      );
  document
    .getElementById("colaboradores-gerencial-topo")
    .classList.toggle("hidden", !admin);
  document.querySelectorAll("[data-colab-secao]").forEach((b) => {
    b.setAttribute(
      "aria-pressed",
      String(b.dataset.colabSecao === prgdState.secaoColaboradores),
    );
    b.classList.toggle(
      "bg-blue-100",
      b.dataset.colabSecao === prgdState.secaoColaboradores,
    );
  });
  if (guardar && admin) guardarNavegacao();
}

export function acessoDoColaborador(p) {
  const usuario = p.usuarioUid
    ? prgdState.dbData.usuarios.find(
        (u) =>
          uidCadastro(u) === p.usuarioUid &&
          u.colaboradorId === p.id &&
          !u.excluido,
      )
    : null;
  if (!p.usuarioUid)
    return { usuario: null, liberado: false, nome: "Sem acesso ao sistema" };
  if (!usuario)
    return {
      usuario: null,
      liberado: false,
      nome: "Vínculo de conta indisponível",
    };
  const estado = estadoAcessoUsuario(usuario),
    liberado = modulosDoUsuario(usuario).length > 0;
  return {
    usuario,
    liberado,
    nome: liberado ? "Acesso liberado" : estado.nome,
  };
}

export function renderColaboradoresPorOrgao(lista, indisponivel = false) {
  const box = document.getElementById("colaboradores-por-orgao");
  if (!ehAdministrador()) {
    box.innerHTML = "";
    return;
  }
  if (indisponivel) {
    box.innerHTML =
      "<p>Resumo por órgão indisponível enquanto a consulta não for concluída.</p>";
    return;
  }
  const grupos = new Map();
  for (const p of lista) {
    if (!grupos.has(p.orgaoId)) grupos.set(p.orgaoId, []);
    grupos.get(p.orgaoId).push(p);
  }
  box.innerHTML =
    '<h3 class="font-bold text-blue-900">Colaboradores por órgão</h3><p class="text-xs text-slate-500">Resumo conforme os filtros. Selecione um órgão para consultar seus colaboradores.</p><div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">' +
    [...grupos]
      .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
      .map(([id, pessoas]) => {
        const o = prgdState.dbData.orgaos.find(
          (o) => String(o.firestoreId || o.id) === id,
        );
        return `<button type="button" data-colab-orgao="${esc(id)}" class="text-left border border-blue-100 bg-blue-50/50 rounded-xl p-3"><b class="text-sm text-blue-900">${esc(o?.sigla || o?.nome || id)}</b><small class="block">${pessoas.length} colaborador(es) · ${pessoas.filter((p) => acessoDoColaborador(p).liberado).length} com acesso liberado</small></button>`;
      })
      .join("") +
    "</div>" +
    (lista.length
      ? ""
      : '<p class="text-sm">Nenhum colaborador nos filtros selecionados.</p>');
}

export function abrirAcessoColaborador(id) {
  if (!ehAdministrador()) return;
  const p = prgdState.dbData.colaboradores.find((p) => p.id === id);
  if (!p) return;
  const acesso = acessoDoColaborador(p);
  if (p.usuarioUid) {
    if (acesso.usuario)
      detalharRegistro("usuarios", uidCadastro(acesso.usuario));
    else
      mensagemPortal(
        "O vínculo com a conta precisa ser revisado em Vincular conta existente.",
        true,
      );
    return;
  }
  if (p.ativo === false) {
    mensagemPortal(
      "Ative o cadastro do colaborador antes de criar um acesso.",
      true,
    );
    return;
  }
  abrirModalForm("usuario");
  prgdState.novoAcessoColaborador = {
    id,
    uid: prgdState.currentUser.uid,
    sessao: prgdState.versaoSessao,
  };
  document.getElementById("usuario-nome").value = p.nome;
  document.getElementById("usuario-email").value = p.emailInstitucional;
  document.getElementById("usuario-tipo").value = "externo";
  document.getElementById("usuario-orgao").value =
    prgdState.dbData.orgaos.find(
      (o) => String(o.firestoreId || o.id) === p.orgaoId,
    )?.nome || p.orgaoId;
  document.getElementById("form-univ-titulo").textContent =
    "Criar acesso · " + p.nome;
  atualizarControlesUsuario();
}

export async function criarContaDoColaborador(uid, dados, alvo) {
  const ref = doc(prgdState.db, "colaboradores", alvo.id),
    userRef = doc(prgdState.db, "usuarios", uid),
    log = doc(collection(prgdState.db, "historicoAlteracoes")),
    userLog = doc(collection(prgdState.db, "historicoAlteracoes"));
  await runTransaction(prgdState.db, async (t) => {
    const snap = await t.get(ref),
      userSnap = await t.get(userRef);
    if (
      !ehAdministrador() ||
      alvo.uid !== prgdState.currentUser?.uid ||
      alvo.sessao !== prgdState.versaoSessao
    )
      throw new Error("Sua sessão mudou. Reabra a criação de acesso.");
    if (
      !snap.exists() ||
      snap.data().ativo === false ||
      snap.data().usuarioUid ||
      userSnap.exists()
    )
      throw new Error(
        "O cadastro mudou ou já possui conta. Revise o vínculo antes de continuar.",
      );
    const p = {
      ...snap.data(),
      usuarioUid: uid,
      atualizadoEm: serverTimestamp(),
      atualizadoPorUid: prgdState.currentUser.uid,
      ultimaAuditoriaId: log.id,
    };
    const user = {
      ...dados,
      colaboradorId: alvo.id,
      ultimaAuditoriaId: userLog.id,
    };
    t.set(ref, p);
    t.set(
      doc(prgdState.db, "contatosColaboradores", alvo.id),
      projecaoContato(p),
    );
    t.set(log, logPortal(ref, p, "editar", ["usuarioUid"], log));
    t.set(userRef, user);
    t.set(
      doc(prgdState.db, "identidadesUsuarios", uid),
      identidadePublica(uid, user),
    );
    t.set(userLog, {
      ...dadosRegistroAuditoria(userRef, null, user),
      autorUid: prgdState.currentUser.uid,
      autorNome: prgdState.currentUser.nome || prgdState.currentUser.email,
      criadoEm: serverTimestamp(),
    });
  });
}

export function resumoColaboradorUsuario(u) {
  const p = prgdState.dbData.colaboradores.find(
    (p) => p.id === u.colaboradorId && p.usuarioUid === uidCadastro(u),
  );
  return `<section data-colaborador-usuario="${esc(uidCadastro(u))}" class="md:col-span-2 bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-xs"><h4 class="font-bold mb-2">Colaborador vinculado</h4>${p ? `<p>${esc(p.nome)} · ${esc(p.emailInstitucional)}</p><p>${esc(prgdState.dbData.orgaos.find((o) => String(o.firestoreId || o.id) === p.orgaoId)?.sigla || prgdState.dbData.orgaos.find((o) => String(o.firestoreId || o.id) === p.orgaoId)?.nome || p.orgaoId)} · ${esc(prgdState.dbData.setores.find((s) => s.id === p.setorId)?.nome || p.setorId)}</p><p>${esc(situacaoCadastroColaborador(p).nome)}</p>` : `<p>${u.colaboradorId ? "O vínculo não pôde ser confirmado nesta consulta." : "Nenhum colaborador vinculado. Faça a associação em Colaboradores → Vincular usuário."}</p>`}<p class="text-slate-600 mt-2">Os dados do colaborador acompanham o cadastro de origem. Login, e-mail de acesso e permissões são administrados separadamente.</p></section>`;
}
