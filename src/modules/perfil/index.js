// Responsabilidade: modules/perfil/index. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "../../app/state.js";
import { nomePerfilAcesso, nomeOrgaoUsuario } from "../acessos/policies.js";
import { registrarMudancaSenha } from "../auditoria/index.js";
import { uidCadastro } from "../../shared/identity.js";
import { gravarUsuarioComIdentidade } from "../acessos/accounts.js";
import {
  traduzirErroSistema,
  gerarIniciais,
  obterCorResponsavel,
  esc,
} from "../../shared/presentation.js";
import { renderizarTudo } from "../../app/navigation.js";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "../../services/firebase.js";

export function fotoPerfilSegura(valor) {
  return typeof valor === "string" &&
    valor.length <= prgdState.LIMITE_FOTO_PERFIL &&
    /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(valor)
    ? valor
    : "";
}

export function pessoaPorUid(uid) {
  if (!uid) return null;
  if (prgdState.currentUser?.uid === uid) return prgdState.currentUser;
  return (
    prgdState.dbData.usuarios.find((u) => uidCadastro(u) === uid) ||
    prgdState.identidadesUsuarios.find((u) => u.uid === uid) ||
    null
  );
}

export function avatarUsuario(pessoa = {}, tamanho = "sm") {
  const uid = uidCadastro(pessoa),
    atual = pessoaPorUid(uid);
  const nome = pessoa.nome || atual?.nome || pessoa.email || "Usuário";
  const foto = fotoPerfilSegura(atual ? atual.fotoPerfil : pessoa.fotoPerfil);
  const classe =
    {
      sm: "w-7 h-7 text-[11px]",
      md: "w-10 h-10 text-sm",
      lg: "w-24 h-24 text-2xl",
    }[tamanho] || "w-7 h-7 text-[11px]";
  return `<span role="img" aria-label="${esc(nome)}" title="${esc(nome)}" class="relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden font-bold border shadow-sm align-middle ${classe} ${obterCorResponsavel(nome)}"><span aria-hidden="true">${esc(gerarIniciais(nome))}</span>${foto ? `<img data-avatar src="${esc(foto)}" alt="" class="absolute inset-0 w-full h-full object-cover" decoding="async">` : ""}</span>`;
}

export function identificacaoUsuario(pessoa = {}) {
  return `<span class="inline-flex items-center gap-2 min-w-0">${avatarUsuario(pessoa)}<span class="break-words">${esc(pessoa.nome || pessoa.email || "Usuário")}</span></span>`;
}

export function atualizarIdentidadeSessao() {
  document
    .getElementById("btn-meu-perfil")
    ?.classList.toggle("hidden", !prgdState.currentUser);
  const avatar = document.getElementById("user-avatar");
  if (avatar)
    avatar.innerHTML = prgdState.currentUser
      ? avatarUsuario(prgdState.currentUser, "md")
      : "";
  if (!prgdState.currentUser) return;
  document.getElementById("user-name-display").textContent =
    prgdState.currentUser.nome || prgdState.currentUser.email;
  document.getElementById("user-role-display").textContent =
    nomePerfilAcesso() + " • " + nomeOrgaoUsuario(prgdState.currentUser);
}

export function mensagemPerfil(texto, erro = false, senha = false) {
  const el = document.getElementById(senha ? "perfil-senha-msg" : "perfil-msg");
  el.textContent = texto;
  el.className =
    "text-xs p-2 rounded-lg " +
    (erro ? "bg-red-50 text-red-800" : "bg-blue-50 text-blue-900");
  el.classList.toggle("hidden", !texto);
}

export function sessaoPerfilAtual(edicao) {
  return (
    !!edicao &&
    edicao === prgdState.perfilEmEdicao &&
    edicao.uid === prgdState.currentUser?.uid &&
    edicao.sessao === prgdState.versaoSessao
  );
}

export function atualizarFormularioPerfil() {
  const edicao = prgdState.perfilEmEdicao;
  if (!sessaoPerfilAtual(edicao)) return;
  if (prgdState.dadosPessoaisPerfil !== null && !edicao.privadoPreenchido) {
    document.getElementById("perfil-telefone").value =
      prgdState.dadosPessoaisPerfil.telefone || "";
    document.getElementById("perfil-endereco").value =
      prgdState.dadosPessoaisPerfil.endereco || "";
    edicao.privadoPreenchido = true;
    mensagemPerfil("");
  }
  document.getElementById("perfil-foto-preview").innerHTML = avatarUsuario(
    {
      nome: document.getElementById("perfil-nome").value,
      fotoPerfil: edicao.foto,
    },
    "lg",
  );
  document.getElementById("perfil-salvar").disabled =
    !edicao.privadoPreenchido || edicao.carregandoFoto || edicao.salvando;
  document.getElementById("perfil-nome").disabled = edicao.salvando;
  ["perfil-telefone", "perfil-endereco"].forEach((id) => {
    document.getElementById(id).disabled =
      edicao.salvando || !edicao.privadoPreenchido;
  });
  document.getElementById("perfil-foto").disabled = edicao.salvando;
  document.getElementById("perfil-remover-foto").disabled =
    !edicao.foto || edicao.salvando;
}

export function limparSenhasPerfil() {
  ["perfil-senha-atual", "perfil-senha-nova", "perfil-senha-confirmar"].forEach(
    (id) => {
      document.getElementById(id).value = "";
    },
  );
}

export function abrirMeuPerfil() {
  if (!prgdState.currentUser || prgdState.currentUser.ativo === false) return;
  prgdState.perfilEmEdicao = {
    uid: prgdState.currentUser.uid,
    sessao: prgdState.versaoSessao,
    foto: fotoPerfilSegura(prgdState.currentUser.fotoPerfil),
    tokenFoto: 0,
    salvando: false,
    carregandoFoto: false,
    privadoPreenchido: false,
  };
  document.getElementById("perfil-nome").value =
    prgdState.currentUser.nome || "";
  document.getElementById("perfil-email").value =
    prgdState.currentUser.email || "";
  document.getElementById("perfil-telefone").value = "";
  document.getElementById("perfil-endereco").value = "";
  document.getElementById("perfil-foto").value = "";
  limparSenhasPerfil();
  mensagemPerfil("", false, true);
  document.getElementById("perfil-alterar-senha").disabled =
    prgdState.salvandoSenhaPerfil;
  ["perfil-senha-atual", "perfil-senha-nova", "perfil-senha-confirmar"].forEach(
    (id) => {
      document.getElementById(id).disabled = prgdState.salvandoSenhaPerfil;
    },
  );
  mensagemPerfil(
    prgdState.dadosPessoaisPerfil === null
      ? "Carregando seus dados pessoais…"
      : "",
  );
  atualizarFormularioPerfil();
  document.getElementById("modal-perfil").classList.remove("hidden");
  document.getElementById("perfil-nome").focus?.();
}

export async function prepararFotoPerfil(arquivo) {
  if (
    !arquivo ||
    !["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)
  )
    throw new Error("Escolha uma foto JPG, PNG ou WebP.");
  if (arquivo.size > 8 * 1024 * 1024)
    throw new Error("A foto deve ter no máximo 8 MB.");
  let imagem;
  try {
    imagem = await createImageBitmap(arquivo);
  } catch (err) {
    throw new Error("Não foi possível abrir essa imagem. Escolha outra foto.");
  }
  try {
    if (!imagem.width || !imagem.height) throw new Error("Imagem inválida.");
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 192;
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw new Error("Não foi possível preparar a foto neste navegador.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 192, 192);
    const lado = Math.min(imagem.width, imagem.height);
    ctx.drawImage(
      imagem,
      (imagem.width - lado) / 2,
      (imagem.height - lado) / 2,
      lado,
      lado,
      0,
      0,
      192,
      192,
    );
    for (const qualidade of [0.82, 0.65, 0.45]) {
      const foto = fotoPerfilSegura(canvas.toDataURL("image/jpeg", qualidade));
      if (foto) return foto;
    }
    throw new Error("A foto continua muito grande. Escolha outra imagem.");
  } finally {
    imagem.close?.();
  }
}

export async function selecionarFotoPerfil(e) {
  const edicao = prgdState.perfilEmEdicao,
    arquivo = e.target.files?.[0];
  if (!sessaoPerfilAtual(edicao) || !arquivo || edicao.salvando) return;
  const token = ++edicao.tokenFoto;
  edicao.carregandoFoto = true;
  mensagemPerfil("Preparando foto…");
  atualizarFormularioPerfil();
  try {
    const foto = await prepararFotoPerfil(arquivo);
    if (!sessaoPerfilAtual(edicao) || token !== edicao.tokenFoto) return;
    edicao.foto = foto;
    mensagemPerfil("Foto preparada. Clique em Salvar perfil para confirmar.");
  } catch (err) {
    if (sessaoPerfilAtual(edicao) && token === edicao.tokenFoto)
      mensagemPerfil(traduzirErroSistema(err), true);
  } finally {
    if (sessaoPerfilAtual(edicao) && token === edicao.tokenFoto) {
      edicao.carregandoFoto = false;
      e.target.value = "";
      atualizarFormularioPerfil();
    }
  }
}

export function removerFotoPerfil() {
  if (
    !sessaoPerfilAtual(prgdState.perfilEmEdicao) ||
    prgdState.perfilEmEdicao.salvando
  )
    return;
  ++prgdState.perfilEmEdicao.tokenFoto;
  prgdState.perfilEmEdicao.foto = "";
  prgdState.perfilEmEdicao.carregandoFoto = false;
  atualizarFormularioPerfil();
  mensagemPerfil("Clique em Salvar perfil para confirmar a remoção da foto.");
}

export async function salvarMeuPerfil(e) {
  e.preventDefault();
  const edicao = prgdState.perfilEmEdicao;
  if (!sessaoPerfilAtual(edicao) || edicao.salvando) return;
  try {
    if (!edicao.privadoPreenchido || edicao.carregandoFoto)
      throw new Error("Aguarde o carregamento dos dados e da foto.");
    const nome = document.getElementById("perfil-nome").value.trim();
    const telefone = document.getElementById("perfil-telefone").value.trim();
    const endereco = document.getElementById("perfil-endereco").value.trim();
    if (!nome || nome.length > 150)
      throw new Error("Informe seu nome, com até 150 caracteres.");
    if (telefone.length > 40 || endereco.length > 400)
      throw new Error("Use até 40 caracteres no telefone e 400 no endereço.");
    if (edicao.foto && !fotoPerfilSegura(edicao.foto))
      throw new Error("Escolha uma foto válida.");
    edicao.salvando = true;
    atualizarFormularioPerfil();
    const agora = new Date().toISOString();
    const dados = { nome, fotoPerfil: edicao.foto, perfilAtualizadoEm: agora };
    const privado = { telefone, endereco, atualizadoEm: agora };
    await gravarUsuarioComIdentidade(
      edicao.uid,
      dados,
      prgdState.currentUser,
      privado,
    );
    if (!sessaoPerfilAtual(edicao)) return;
    prgdState.currentUser = { ...prgdState.currentUser, ...dados };
    prgdState.dadosPessoaisPerfil = privado;
    const usuario = prgdState.dbData.usuarios.find(
      (u) => uidCadastro(u) === edicao.uid,
    );
    if (usuario) Object.assign(usuario, dados);
    renderizarTudo();
    mensagemPerfil("Perfil atualizado com sucesso.");
  } catch (err) {
    if (sessaoPerfilAtual(edicao))
      mensagemPerfil(traduzirErroSistema(err), true);
  } finally {
    if (sessaoPerfilAtual(edicao)) {
      edicao.salvando = false;
      atualizarFormularioPerfil();
    }
  }
}

export async function alterarMinhaSenha(e) {
  e.preventDefault();
  const uid = prgdState.currentUser?.uid,
    sessao = prgdState.versaoSessao,
    usuarioAuth = prgdState.auth.currentUser;
  if (!uid || usuarioAuth?.uid !== uid || prgdState.salvandoSenhaPerfil) return;
  const aindaAtual = () =>
    sessao === prgdState.versaoSessao &&
    prgdState.currentUser?.uid === uid &&
    prgdState.auth.currentUser?.uid === uid;
  const atual = document.getElementById("perfil-senha-atual").value;
  const nova = document.getElementById("perfil-senha-nova").value;
  const confirmar = document.getElementById("perfil-senha-confirmar").value;
  try {
    if (!atual || nova.length < 8 || nova !== confirmar || atual === nova)
      throw new Error(
        "Informe a senha atual e uma senha nova diferente, com pelo menos 8 caracteres. Repita a nova senha corretamente.",
      );
    prgdState.salvandoSenhaPerfil = true;
    document.getElementById("perfil-alterar-senha").disabled = true;
    [
      "perfil-senha-atual",
      "perfil-senha-nova",
      "perfil-senha-confirmar",
    ].forEach((id) => {
      document.getElementById(id).disabled = true;
    });
    await reauthenticateWithCredential(
      usuarioAuth,
      EmailAuthProvider.credential(usuarioAuth.email, atual),
    );
    if (!aindaAtual()) return;
    await updatePassword(usuarioAuth, nova);
    if (!aindaAtual()) return;
    try {
      await registrarMudancaSenha(uid, sessao);
    } catch (_) {
      if (aindaAtual())
        mensagemPerfil(
          "Senha alterada. Não foi possível registrar a alteração no histórico; informe ao administrador. Use a nova senha no próximo acesso.",
          true,
          true,
        );
      return;
    }
    if (aindaAtual())
      mensagemPerfil(
        "Senha alterada com sucesso. Use a nova senha no próximo acesso.",
        false,
        true,
      );
  } catch (err) {
    if (aindaAtual()) mensagemPerfil(traduzirErroSistema(err), true, true);
  } finally {
    if (aindaAtual()) limparSenhasPerfil();
    prgdState.salvandoSenhaPerfil = false;
    document.getElementById("perfil-alterar-senha").disabled = false;
    [
      "perfil-senha-atual",
      "perfil-senha-nova",
      "perfil-senha-confirmar",
    ].forEach((id) => {
      document.getElementById(id).disabled = false;
    });
  }
}
