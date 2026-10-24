// Responsabilidade: modules/acessos/accounts. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "../../app/state.js";
import {
  ehAdministrador,
  acessoInstitucionalAtivo,
  nomePerfilAcesso,
  chaveOrgaoUsuario,
  nomeOrgaoUsuario,
  situacaoVinculo,
  modulosDoUsuario,
} from "./policies.js";
import {
  emailParticipante,
  mensagemPortal,
  logPortal,
  projecaoContato,
  criarContaDoColaborador,
  resumoColaboradorUsuario,
} from "../colaboradores/index.js";
import {
  camposVinculo,
  atualizarCamposVinculo,
  lerVinculoInstitucional,
} from "./delegation.js";
import {
  dadosRegistroAuditoria,
  gravarComHistorico,
} from "../auditoria/index.js";
import { nomeTipoUsuario, fecharModal } from "../../app/navigation.js";
import { uidCadastro } from "../../shared/identity.js";
import { fotoPerfilSegura, identificacaoUsuario } from "../perfil/index.js";
import {
  traduzirErroSistema,
  renderAuditInfo,
  esc,
} from "../../shared/presentation.js";
import {
  initializeApp,
  getApps,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  getAuth,
  setPersistence,
  inMemoryPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  signOut,
} from "../../services/firebase.js";

export function perfilFiltroUsuario(u) {
  return u.perfil === "admin" && u.tipoUsuario !== "externo"
    ? "admin"
    : u.acessoInstitucional?.papel || "legado";
}

export function estadoAcessoUsuario(u, agora = Date.now()) {
  let id = "liberado";
  const v = u.acessoInstitucional;
  if (u.excluido === true) id = "excluido";
  else if (u.ativo === false) id = "inativo";
  else if (!ehAdministrador(u) && v) {
    if (v.situacao === "suspenso") id = "suspenso";
    else if (v.situacao !== "aprovado") id = "pendente";
    else if (v.fim <= agora) id = "vencido";
    else if (v.revisao <= agora) id = "revisao";
    else if (v.inicio > agora) id = "futuro";
    else if (!acessoInstitucionalAtivo(u, agora)) id = "invalido";
    else if (!v.acoes.length) id = "sem_modulos";
    else if (v.papel === "substituto") id = "titular";
  } else if (!modulosDoUsuario(u).length) id = "sem_modulos";
  return { id, nome: prgdState.ESTADOS_ACESSO[id] };
}

export function cardCadastro(titulo, numero, icone) {
  return `<div class="bg-blue-50/70 border border-blue-100 rounded-xl p-4"><p class="text-xs text-blue-900"><i class="fa-solid ${icone} mr-2" aria-hidden="true"></i>${esc(titulo)}</p><strong class="block text-2xl text-blue-950 mt-1">${esc(numero)}</strong></div>`;
}

export function renderIndicadoresUsuarios() {
  const lista = prgdState.dbData.usuarios.filter((u) => !u.excluido),
    status = (u) => estadoAcessoUsuario(u).id;
  document.getElementById("usuarios-indicadores").innerHTML = ehAdministrador()
    ? cardCadastro(
        "Cadastros ativos",
        lista.filter((u) => u.ativo !== false).length,
        "fa-user-check",
      ) +
      cardCadastro(
        "Inativos",
        lista.filter((u) => u.ativo === false).length,
        "fa-user-lock",
      ) +
      cardCadastro(
        "Aguardando aprovação",
        lista.filter((u) => status(u) === "pendente").length,
        "fa-hourglass-half",
      ) +
      cardCadastro(
        "Vencidos / revisão pendente",
        lista.filter((u) => ["vencido", "revisao"].includes(status(u))).length,
        "fa-calendar-check",
      )
    : "";
}

export function atualizarResumosUsuariosAbertos() {
  document.querySelectorAll("[data-colaborador-usuario]").forEach((el) => {
    const u = prgdState.dbData.usuarios.find(
      (u) => uidCadastro(u) === el.dataset.colaboradorUsuario,
    );
    if (u) el.outerHTML = resumoColaboradorUsuario(u);
  });
}

export function cancelarRevisaoUsuario() {
  const resolver = prgdState.revisaoUsuarioResolver;
  prgdState.revisaoUsuarioResolver = null;
  document.getElementById("revisar-usuario-resumo").innerHTML = "";
  document.getElementById("modal-revisar-usuario")?.classList.add("hidden");
  resolver?.(false);
}

export async function revisarUsuario(dados) {
  if (prgdState.revisaoUsuarioResolver) return false;
  const uid = prgdState.currentUser?.uid,
    sessao = prgdState.versaoSessao;
  document.getElementById("revisar-usuario-resumo").innerHTML =
    `<p><b>Pessoa:</b> ${esc(dados.nome)} · ${esc(dados.email)}</p>${prgdState.novoAcessoColaborador ? "<p><b>Vincular ao colaborador:</b> " + esc(prgdState.dbData.colaboradores.find((p) => p.id === prgdState.novoAcessoColaborador.id)?.nome || "Cadastro indisponível") + "</p>" : ""}<p><b>Cadastro:</b> ${dados.ativo ? "Ativo" : "Inativo"}</p><p><b>Perfil:</b> ${esc(nomePerfilAcesso(dados))}</p><p><b>Abrangência:</b> ${dados.perfil === "admin" || dados.acessoInstitucional?.papel === "grgd" ? "Todos os órgãos, conforme o perfil" : esc(nomeOrgaoUsuario(dados))}</p><p><b>Situação do acesso:</b> ${esc(estadoAcessoUsuario(dados).nome)}</p><p><b>Setores:</b> ${esc(dados.acessoInstitucional ? dados.acessoInstitucional.setoresIds.map((id) => prgdState.dbData.setores.find((s) => s.id === id)?.nome || id).join(", ") || "Todos os setores do órgão" : "Conforme módulos liberados")}</p><p><b>Ações / módulos:</b> ${esc(
      dados.acessoInstitucional?.acoes.join(", ") ||
        modulosDoUsuario(dados)
          .map(
            (id) =>
              prgdState.MÓDULOS_SISTEMA.find((m) => m.id === id)?.nome || id,
          )
          .join(", ") ||
        "Nenhum",
    )}</p>${dados.acessoInstitucional ? `<p><b>Validade:</b> ${esc(new Date(dados.acessoInstitucional.fim).toLocaleString("pt-BR"))}</p><p><b>Revisão:</b> ${esc(new Date(dados.acessoInstitucional.revisao).toLocaleString("pt-BR"))}</p>` : ""}`;
  document.getElementById("modal-revisar-usuario").classList.remove("hidden");
  const resultado = await new Promise((resolve) => {
    prgdState.revisaoUsuarioResolver = resolve;
  });
  return (
    resultado &&
    uid === prgdState.currentUser?.uid &&
    sessao === prgdState.versaoSessao &&
    ehAdministrador()
  );
}

export function abrirVinculoColaborador(id) {
  const p = prgdState.dbData.colaboradores.find((p) => p.id === id);
  if (!ehAdministrador() || !p) return;
  prgdState.vinculoColaboradorAtual = {
    id,
    uid: prgdState.currentUser.uid,
    sessao: prgdState.versaoSessao,
  };
  document.getElementById("vincular-lista").innerHTML = "";
  document.getElementById("vincular-confirmacao").checked = false;
  document.getElementById("vincular-contexto").textContent =
    p.nome + " · " + p.emailInstitucional;
  document.getElementById("vincular-busca").value = "";
  document.getElementById("vincular-erro").textContent = "";
  document.getElementById("vincular-lista").dataset.selecionado =
    p.usuarioUid || "";
  renderOpcoesVinculo();
  document
    .getElementById("modal-vincular-colaborador")
    .classList.remove("hidden");
}

export function renderOpcoesVinculo() {
  const campo = document.getElementById("vincular-lista"),
    escolhido = campo.value || campo.dataset.selecionado || "",
    q = emailParticipante(document.getElementById("vincular-busca").value);
  campo.innerHTML =
    '<option value="">Sem conta vinculada</option>' +
    prgdState.dbData.usuarios
      .filter(
        (u) =>
          !u.excluido &&
          (uidCadastro(u) === escolhido ||
            !q ||
            [u.nome, u.email, uidCadastro(u)].some((v) =>
              String(v || "")
                .toLowerCase()
                .includes(q),
            )) &&
          (!u.colaboradorId ||
            u.colaboradorId === prgdState.vinculoColaboradorAtual?.id),
      )
      .map(
        (u) =>
          `<option value="${esc(uidCadastro(u))}">${esc(u.nome)} · ${esc(u.email)}${u.ativo === false ? " (inativo)" : ""}</option>`,
      )
      .join("");
  campo.value = escolhido;
  campo.dataset.selecionado = escolhido;
}

export async function salvarVinculoColaborador(ev) {
  ev.preventDefault();
  if (
    !ehAdministrador() ||
    !prgdState.vinculoColaboradorAtual ||
    prgdState.vinculoColaboradorOcupado
  )
    return;
  const alvo = prgdState.vinculoColaboradorAtual,
    uidUsuario = document.getElementById("vincular-lista").value;
  if (!document.getElementById("vincular-confirmacao").checked) {
    document.getElementById("vincular-erro").textContent =
      "Confirme que verificou a identidade da pessoa antes de vincular.";
    return;
  }
  prgdState.vinculoColaboradorOcupado = true;
  document.getElementById("vincular-salvar").disabled = true;
  try {
    const ref = doc(prgdState.db, "colaboradores", alvo.id),
      log = doc(collection(prgdState.db, "historicoAlteracoes"));
    await runTransaction(prgdState.db, async (t) => {
      const snap = await t.get(ref);
      if (!snap.exists()) throw new Error("Colaborador não encontrado.");
      const p = snap.data(),
        antigo = p.usuarioUid || "";
      const novoSnap = uidUsuario
        ? await t.get(doc(prgdState.db, "usuarios", uidUsuario))
        : null;
      const antigoSnap =
        antigo && antigo !== uidUsuario
          ? await t.get(doc(prgdState.db, "usuarios", antigo))
          : null;
      if (
        alvo.uid !== prgdState.currentUser?.uid ||
        alvo.sessao !== prgdState.versaoSessao ||
        !ehAdministrador()
      )
        throw new Error("Sua sessão mudou. Reabra a associação.");
      if (uidUsuario && (!novoSnap?.exists() || novoSnap.data().excluido))
        throw new Error("Usuário indisponível.");
      if (
        uidUsuario &&
        novoSnap.data().colaboradorId &&
        novoSnap.data().colaboradorId !== alvo.id
      )
        throw new Error(
          "Este usuário já está vinculado a outro colaborador. Revise o vínculo existente.",
        );
      if (antigo === uidUsuario) return;
      const novo = {
        ...p,
        usuarioUid: uidUsuario,
        atualizadoEm: serverTimestamp(),
        atualizadoPorUid: prgdState.currentUser.uid,
        ultimaAuditoriaId: log.id,
      };
      t.set(ref, novo);
      t.set(
        doc(prgdState.db, "contatosColaboradores", alvo.id),
        projecaoContato(novo),
      );
      t.set(log, logPortal(ref, novo, "editar", ["usuarioUid"], log));
      for (const [usuarioId, userSnap, colaboradorId] of [
        [uidUsuario, novoSnap, alvo.id],
        [antigo !== uidUsuario ? antigo : "", antigoSnap, ""],
      ]) {
        if (!usuarioId || !userSnap?.exists()) continue;
        const userRef = doc(prgdState.db, "usuarios", usuarioId),
          auditRef = doc(collection(prgdState.db, "historicoAlteracoes"));
        const dados = {
          colaboradorId,
          ultimaAuditoriaId: auditRef.id,
          atualizadoEm: new Date().toISOString(),
          editadoPorUid: prgdState.currentUser.uid,
          editadoPor: prgdState.currentUser.nome || prgdState.currentUser.email,
        };
        t.set(userRef, dados, { merge: true });
        t.set(auditRef, {
          ...dadosRegistroAuditoria(userRef, userSnap.data(), {
            ...userSnap.data(),
            ...dados,
          }),
          autorUid: prgdState.currentUser.uid,
          autorNome:
            prgdState.currentUser.nome ||
            prgdState.currentUser.email ||
            prgdState.currentUser.uid,
          criadoEm: serverTimestamp(),
        });
      }
    });
    if (
      alvo.uid === prgdState.currentUser?.uid &&
      alvo.sessao === prgdState.versaoSessao
    ) {
      fecharModal("modal-vincular-colaborador");
      prgdState.vinculoColaboradorAtual = null;
      document.getElementById("vincular-lista").innerHTML = "";
      mensagemPortal(
        "Associação atualizada. As permissões de acesso foram preservadas.",
      );
    }
  } catch (err) {
    if (
      alvo.uid === prgdState.currentUser?.uid &&
      alvo.sessao === prgdState.versaoSessao
    )
      document.getElementById("vincular-erro").textContent =
        traduzirErroSistema(err);
  } finally {
    prgdState.vinculoColaboradorOcupado = false;
    document.getElementById("vincular-salvar").disabled = false;
    document.getElementById("vincular-confirmacao").checked = false;
  }
}

export function camposUsuario(usuario = {}, novo = false) {
  const cls = "w-full p-2 border rounded-lg text-xs bg-white";
  const modulos = novo ? [] : modulosDoUsuario(usuario);
  const lista = (chave) =>
    Array.isArray(usuario[chave])
      ? usuario[chave].join(", ")
      : usuario[chave] || "";
  return `<div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs p-1">
                <div class="md:col-span-2 font-bold text-blue-900 border-b pb-2">1. Dados do usuário</div><div><label for="usuario-nome" class="block font-bold mb-1">Nome completo</label><input id="usuario-nome" value="${esc(usuario.nome || "")}" required maxlength="150" class="${cls}"></div>
                <div><label for="usuario-email" class="block font-bold mb-1">E-mail de acesso</label><input id="usuario-email" type="email" value="${esc(usuario.email || "")}" required ${!novo && usuario.email ? "readonly" : ""} class="${cls}">${!novo ? '<p class="mt-1 text-slate-500">Alterações no e-mail de acesso exigem ajuste no Firebase Authentication.</p>' : ""}</div>
                <div class="md:col-span-2 font-bold text-blue-900 border-b pb-2 mt-2">2. Perfil, situação e organização</div><div><label for="usuario-tipo" class="block font-bold mb-1">Tipo de usuário</label><select id="usuario-tipo" required class="${cls}"><option value="">Selecione</option><option value="interno" ${usuario.tipoUsuario === "interno" ? "selected" : ""}>Interno - GRGD</option><option value="externo" ${usuario.tipoUsuario === "externo" ? "selected" : ""}>Externo</option></select></div>
                <div><label for="usuario-ativo" class="block font-bold mb-1">Situação</label><select id="usuario-ativo" class="${cls}"><option value="true" ${usuario.ativo !== false ? "selected" : ""}>Ativo</option><option value="false" ${usuario.ativo === false ? "selected" : ""}>Inativo</option></select></div>
                <div><label for="usuario-perfil" class="block font-bold mb-1">Perfil do sistema</label><select id="usuario-perfil" class="${cls}"><option value="comum">Consulta</option><option value="admin" ${ehAdministrador(usuario) ? "selected" : ""}>Administrador</option></select></div>
                <div><label for="usuario-orgao" class="block font-bold mb-1">Cliente / Secretaria</label><input id="usuario-orgao" value="${esc(usuario.orgao || "")}" class="${cls}"></div>
                <div><label for="usuario-tags" class="block font-bold mb-1">Tags / Categorias (separe por vírgula)</label><input id="usuario-tags" value="${esc(lista("tags"))}" class="${cls}"></div>
                <div><label for="usuario-grupos" class="block font-bold mb-1">Grupos de eventos</label><select id="usuario-grupos" multiple class="${cls}" aria-describedby="usuario-grupos-ajuda">${[...new Map([...prgdState.dbData.grupos.map((g) => [String(g.firestoreId || g.id), g.nome || g.id]), ...(Array.isArray(usuario.grupos) ? usuario.grupos : []).map((id) => [id, prgdState.dbData.grupos.find((g) => String(g.firestoreId || g.id) === id)?.nome || id])]).entries()].map(([id, nome]) => `<option value="${esc(id)}" ${(usuario.grupos || []).includes(id) ? "selected" : ""}>${esc(nome)}</option>`).join("")}</select><p id="usuario-grupos-ajuda" class="text-slate-500 mt-1">Use Ctrl ou Command para selecionar vários.</p></div>
                <fieldset class="md:col-span-2 border rounded-lg p-3"><legend class="font-bold px-1">Módulos do acesso anterior</legend><p id="usuario-permissoes-ajuda" class="text-slate-500 mb-2"></p><div class="grid grid-cols-2 gap-2">${prgdState.MÓDULOS_SISTEMA.filter(
                  (m) =>
                    m.id !== "usuarios" &&
                    !prgdState.MODULOS_PORTAL.includes(m.id),
                )
                  .map(
                    (m) =>
                      `<label class="flex items-center gap-2"><input type="checkbox" name="usuario-modulo" value="${m.id}" ${modulos.includes(m.id) ? "checked" : ""}>${m.nome}</label>`,
                  )
                  .join("")}</div></fieldset>
                <div class="md:col-span-2 font-bold text-blue-900 border-b pb-2 mt-2">3. Vínculo, ações e validade</div>${camposVinculo(usuario)}
                ${!novo ? resumoColaboradorUsuario(usuario) : ""}
                ${novo ? `<div class="md:col-span-2"><label for="usuario-senha" class="block font-bold mb-1">Senha inicial de acesso (mínimo 8 caracteres)</label><input id="usuario-senha" type="password" autocomplete="new-password" minlength="8" required class="${cls}"><p class="text-slate-500 mt-1">A senha é enviada apenas ao Firebase Authentication. Não é gravada no cadastro.</p></div>` : `<p class="md:col-span-2 text-slate-500">Identificador do cadastro: ${esc(uidCadastro(usuario))}. A inativação bloqueia o acesso e preserva os vínculos anteriores.</p>`}
            </div>`;
}

export function atualizarControlesUsuario() {
  const papel = document.getElementById("vinculo-papel");
  if (papel && !document.getElementById("vinculo-acoes").dataset.inicializado) {
    const anterior = prgdState.dbData.usuarios.find(
      (u) => uidCadastro(u) === document.getElementById("edit-doc-id").value,
    )?.acessoInstitucional;
    atualizarCamposVinculo(anterior?.acoes || []);
    document.getElementById("vinculo-acoes").dataset.inicializado = "true";
  }
  const tipo = document.getElementById("usuario-tipo");
  const perfil = document.getElementById("usuario-perfil");
  if (!tipo || !perfil) return;
  const externo = tipo.value === "externo";
  if (externo) perfil.value = "comum";
  perfil.disabled = externo;
  const admin = !externo && perfil.value === "admin";
  document.querySelectorAll('input[name="usuario-modulo"]').forEach((cb) => {
    if (externo && cb.value !== "eventos") cb.checked = false;
    cb.disabled =
      admin || !!papel?.value || (externo && cb.value !== "eventos");
  });
  document.getElementById("usuario-permissoes-ajuda").textContent = papel?.value
    ? "O vínculo institucional define o acesso pelas ações aprovadas abaixo. Os módulos antigos não concedem privilégios adicionais."
    : admin
      ? "Administrador: acesso e edição em todos os módulos, incluindo Acessos e permissões de Colaboradores."
      : externo
        ? "Externo: sem acesso interno. A consulta a eventos pode ser liberada; as demais permissões externas serão definidas depois."
        : "Consulta nos módulos selecionados. Alterações nos dados são exclusivas do perfil Administrador. Internos ativos aparecem como responsáveis GRGD.";
}

export function lerDadosUsuario(anterior = {}) {
  const val = (id) => (document.getElementById(id)?.value || "").trim();
  const tipoUsuario = val("usuario-tipo");
  const perfil = val("usuario-perfil");
  const nome = val("usuario-nome"),
    email = val("usuario-email").toLowerCase();
  if (!nome || nome.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Informe nome completo e e-mail válido.");
  if (!["interno", "externo"].includes(tipoUsuario))
    throw new Error("Selecione o tipo Interno - GRGD ou Externo.");
  if (
    !["admin", "comum"].includes(perfil) ||
    (tipoUsuario === "externo" && perfil === "admin")
  )
    throw new Error("Somente usuários internos podem ser administradores.");
  if (!["true", "false"].includes(val("usuario-ativo")))
    throw new Error("Selecione a situação do usuário.");
  const ativo = val("usuario-ativo") === "true";
  if (anterior.excluido === true)
    throw new Error(
      "Este cadastro foi excluído. Não pode ser reativado pelo formulário de edição.",
    );
  if (
    uidCadastro(anterior) === prgdState.currentUser?.uid &&
    (!ativo || perfil !== "admin" || tipoUsuario !== "interno")
  )
    throw new Error(
      "Sua própria conta deve permanecer ativa como administrador interno. Solicite a outro administrador a alteração.",
    );
  if (anterior.email && email !== anterior.email.toLowerCase())
    throw new Error("Altere o e-mail pelo fluxo do Firebase Authentication.");
  const selecionados = Array.from(
    document.querySelectorAll('input[name="usuario-modulo"]:checked'),
  ).map((cb) => cb.value);
  if (
    selecionados.some(
      (id) =>
        !prgdState.MÓDULOS_SISTEMA.some((m) => m.id === id) ||
        id === "usuarios" ||
        (tipoUsuario === "externo" && id !== "eventos"),
    )
  )
    throw new Error("Módulo não permitido para este usuário.");
  const modulosPermitidos =
    perfil === "admin"
      ? prgdState.MÓDULOS_SISTEMA.map((m) => m.id).filter(
          (id) => !prgdState.MODULOS_PORTAL.includes(id),
        )
      : [...new Set(selecionados)];
  const tagsTexto = val("usuario-tags");
  const tags =
    Array.isArray(anterior.tags) && tagsTexto === anterior.tags.join(", ")
      ? anterior.tags
      : tagsTexto
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
  const grupos = Array.from(
    document.getElementById("usuario-grupos")?.selectedOptions || [],
  ).map((o) => o.value);
  const acessoInstitucional = lerVinculoInstitucional(anterior);
  if (acessoInstitucional && perfil === "admin")
    throw new Error(
      "O administrador não deve acumular um papel institucional neste formulário.",
    );
  if (acessoInstitucional?.papel === "grgd" && tipoUsuario !== "interno")
    throw new Error("Equipe GRGD exige tipo Interno - GRGD.");
  return {
    nome,
    email,
    tipoUsuario,
    ativo,
    perfil,
    modulosPermitidos,
    orgao: val("usuario-orgao"),
    tags,
    grupos,
    ...(acessoInstitucional ? { acessoInstitucional } : {}),
  };
}

export async function criarCadastroUsuario() {
  if (!ehAdministrador())
    throw new Error("Somente administradores podem cadastrar usuários.");
  if (prgdState.cadastroUsuarioEmAndamento)
    throw new Error("Aguarde a conclusão do cadastro em andamento.");
  const dados = lerDadosUsuario(),
    alvoColaborador = prgdState.novoAcessoColaborador;
  if (!(await revisarUsuario(dados)))
    throw new Error(
      "Cadastro não confirmado. Revise os dados antes de continuar.",
    );
  const senha = document.getElementById("usuario-senha").value;
  if (senha.length < 8)
    throw new Error("A senha inicial deve ter pelo menos 8 caracteres.");
  prgdState.cadastroUsuarioEmAndamento = true;
  const sessao = prgdState.versaoSessao;
  let conta = null,
    authCadastro;
  try {
    const appCadastro =
      getApps().find((a) => a.name === "prgd-cadastro") ||
      initializeApp(prgdState.firebaseConfig, "prgd-cadastro");
    authCadastro = getAuth(appCadastro);
    await setPersistence(authCadastro, inMemoryPersistence);
    conta = (
      await createUserWithEmailAndPassword(authCadastro, dados.email, senha)
    ).user;
    if (sessao !== prgdState.versaoSessao || !ehAdministrador())
      throw new Error(
        "Sua sessão mudou. Entre novamente antes de cadastrar usuários.",
      );
    const agora = new Date().toISOString(),
      autor = prgdState.currentUser.nome || prgdState.currentUser.email;
    const cadastro = {
      ...dados,
      uid: conta.uid,
      criadoEm: agora,
      criadoPor: autor,
      criadoPorUid: prgdState.currentUser.uid,
      atualizadoEm: agora,
      editadoPorUid: prgdState.currentUser.uid,
      editadoPor: autor,
    };
    if (alvoColaborador)
      await criarContaDoColaborador(conta.uid, cadastro, alvoColaborador);
    else await gravarUsuarioComIdentidade(conta.uid, cadastro);
    prgdState.novoAcessoColaborador = null;
  } catch (err) {
    if (conta) {
      try {
        await deleteUser(conta);
      } catch (rollback) {
        throw new Error(
          `O perfil não foi confirmado e a conta de login não pôde ser removida. Verifique o UID ${conta.uid} no Firebase Authentication antes de tentar novamente.`,
        );
      }
    }
    throw err;
  } finally {
    if (authCadastro) await signOut(authCadastro).catch(() => {});
    document.getElementById("usuario-senha") &&
      (document.getElementById("usuario-senha").value = "");
    prgdState.cadastroUsuarioEmAndamento = false;
  }
}

export function identidadePublica(uid, usuario) {
  return {
    uid,
    nome: usuario.nome || "",
    fotoPerfil: fotoPerfilSegura(usuario.fotoPerfil),
    tipoUsuario: usuario.tipoUsuario || "",
    ativo: usuario.ativo !== false,
  };
}

export async function gravarUsuarioComIdentidade(
  uid,
  dados,
  anterior = {},
  privado = null,
) {
  const operacoes = [
    {
      ref: doc(prgdState.db, "usuarios", uid),
      dados,
      options: { merge: true },
    },
    {
      ref: doc(prgdState.db, "identidadesUsuarios", uid),
      dados: identidadePublica(uid, { ...anterior, ...dados }),
    },
  ];
  if (privado)
    operacoes.push({
      ref: doc(prgdState.db, "usuarios", uid, "privado", "perfil"),
      dados: privado,
    });
  await gravarComHistorico(operacoes);
}

export function preencherFiltrosUsuarios() {
  const selectOrgao = document.getElementById("filtro-orgao-usuario");
  if (selectOrgao) {
    const valorAtual = selectOrgao.value;
    const orgaos = [
      ...new Set(
        prgdState.dbData.usuarios
          .filter((u) => u.excluido !== true)
          .map(chaveOrgaoUsuario)
          .filter(Boolean),
      ),
    ].sort();
    selectOrgao.innerHTML =
      '<option value="">Filtrar por Cliente / Secretaria</option>';
    orgaos.forEach((orgao) => {
      const opt = document.createElement("option");
      opt.value = orgao;
      opt.textContent =
        prgdState.dbData.orgaos.find(
          (o) => String(o.firestoreId || o.id) === orgao,
        )?.sigla || orgao;
      selectOrgao.appendChild(opt);
    });
    selectOrgao.value = valorAtual;
  }
  const setorSelect = document.getElementById("filtro-setor-usuario");
  if (setorSelect) {
    const antigo = setorSelect.value;
    setorSelect.innerHTML =
      '<option value="">Todos os setores</option>' +
      (prgdState.dbData.setores || [])
        .map(
          (s) =>
            `<option value="${esc(s.id)}">${esc(s.nome)} - ${esc(s.orgaoId)}</option>`,
        )
        .join("");
    setorSelect.value = antigo;
  }
  const selectTag = document.getElementById("filtro-tag-usuario");
  if (selectTag) {
    const valAtual = selectTag.value;
    selectTag.innerHTML =
      '<option value="">Filtrar por Tag / Categoria</option>';
    prgdState.TAGS_DISPONIVEIS.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.nome;
      opt.textContent = t.nome;
      selectTag.appendChild(opt);
    });
    selectTag.value = valAtual;
  }
}

export function renderUsuarios() {
  const tbody = document.getElementById("tabela-usuarios");
  if (!tbody) return;
  const us = prgdState.dbData.usuarios.filter((u) => {
    if (u.excluido === true) return false;
    const matchTag =
      !prgdState.filtroTagAtual ||
      (u.tags || []).includes(prgdState.filtroTagAtual);
    const matchOrgao =
      !prgdState.filtroOrgaoUsuarioAtual ||
      chaveOrgaoUsuario(u) === prgdState.filtroOrgaoUsuarioAtual;
    const matchBusca =
      !prgdState.buscaUsuariosVal ||
      (u.nome || "").toLowerCase().includes(prgdState.buscaUsuariosVal) ||
      (u.email || "").toLowerCase().includes(prgdState.buscaUsuariosVal);
    const matchTipo =
      !prgdState.filtroTipoUsuarioAtual ||
      (prgdState.filtroTipoUsuarioAtual === "legado"
        ? !["interno", "externo"].includes(u.tipoUsuario)
        : u.tipoUsuario === prgdState.filtroTipoUsuarioAtual);
    const setor = (prgdState.dbData.setores || []).find(
        (s) => s.id === prgdState.filtroSetorUsuarioAtual,
      ),
      v = u.acessoInstitucional;
    const matchSetor =
      !prgdState.filtroSetorUsuarioAtual ||
      (!!setor &&
        v?.orgaoId === setor.orgaoId &&
        (!v.setoresIds.length || v.setoresIds.includes(setor.id)));
    return (
      matchTag &&
      matchOrgao &&
      matchBusca &&
      matchTipo &&
      matchSetor &&
      (!document.getElementById("filtro-perfil-usuario").value ||
        perfilFiltroUsuario(u) ===
          document.getElementById("filtro-perfil-usuario").value) &&
      (!document.getElementById("filtro-acesso-usuario").value ||
        estadoAcessoUsuario(u).id ===
          document.getElementById("filtro-acesso-usuario").value)
    );
  });
  document.getElementById("count-usuarios").textContent = us.length;
  renderIndicadoresUsuarios();
  tbody.innerHTML =
    us
      .map((u) => {
        const audit = renderAuditInfo(u);
        return `<tr class="hover:bg-slate-50"><td class="p-4 font-bold">${identificacaoUsuario({ ...u, uid: uidCadastro(u) })}</td><td class="p-4 text-slate-600">${esc(u.email || u.id)}</td><td class="p-4 text-xs"><b>${nomeTipoUsuario(u)}</b><br>${u.ativo === false ? "Inativo" : "Ativo"}<small class="block mt-1 text-blue-900">${esc(estadoAcessoUsuario(u).nome)}</small></td><td class="p-4"><span class="bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded text-xs">${esc(nomeOrgaoUsuario(u))}${u.acessoInstitucional ? '<small class="block mt-1 font-normal">' + esc(u.acessoInstitucional.setoresIds.map((id) => prgdState.dbData.setores.find((s) => s.id === id)?.nome || id).join(", ") || "Órgão integral") + "</small>" : ""}</span></td><td class="p-4 text-xs">${esc(Array.isArray(u.tags) ? u.tags.join(", ") : u.tags || "-")}</td><td class="p-4"><span class="${u.perfil === "admin" ? "bg-emerald-100" : "bg-amber-100"} font-bold px-2 py-0.5 rounded text-xs uppercase">${esc(u.acessoInstitucional ? nomePerfilAcesso(u) : u.perfil || "comum")}${u.acessoInstitucional ? '<small class="block normal-case font-normal mt-1">' + esc(situacaoVinculo(u)) + "</small>" : ""}</span></td><td class="p-4">${audit.dataHtml}</td><td class="p-4">${audit.autorHtml}</td><td class="p-4 text-center"><button class="text-xs bg-slate-100 px-2.5 py-1 rounded tr-detalhe font-semibold text-blue-900 cursor-pointer" data-colecao="usuarios" data-id="${esc(u.firestoreId)}">Detalhes</button>${ehAdministrador() ? `<button type="button" class="ml-1 text-xs bg-blue-100 px-2.5 py-1 rounded font-semibold text-blue-900" data-usuario-editar="${esc(u.firestoreId)}">Editar</button><button type="button" class="ml-1 text-xs bg-red-50 px-2.5 py-1 rounded font-semibold text-red-700" data-usuario-excluir="${esc(u.firestoreId)}" ${uidCadastro(u) === prgdState.currentUser?.uid ? 'disabled title="Você não pode excluir a própria conta"' : ""}>Excluir</button>` : ""}</td></tr>`;
      })
      .join("") ||
    '<tr><td colspan="9" class="text-slate-400 text-sm text-center py-6">Nenhum usuário encontrado.</td></tr>';
}
