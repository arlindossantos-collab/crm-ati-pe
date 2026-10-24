// Responsabilidade: modules/acessos/policies. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "../../app/state.js";
import { restaurarNavegacao, renderizarTudo } from "../../app/navigation.js";
import {
  pararSnapshots,
  iniciarSnapshotFirestore,
} from "../../services/subscriptions.js";
import { limparDadosSessao } from "./session.js";
import { collection, query, where } from "../../services/firebase.js";

export function ehAdministrador(usuario = prgdState.currentUser) {
  return (
    !!usuario &&
    usuario.ativo !== false &&
    usuario.excluido !== true &&
    usuario.tipoUsuario !== "externo" &&
    usuario.perfil === "admin"
  );
}

export function nomeAcaoInstitucional(acao) {
  const [modulo, verbo] = acao.split(".");
  const modulos = {
    orgao: "dados do órgão",
    clientes: "órgãos e contatos",
    participantes: "participantes",
    eventos: "eventos",
    inscricoes: "inscrições",
    comprovantes: "comprovantes",
    auditoria: "trilhas de auditoria",
    relatorios: "relatórios",
    demandas: "demandas",
    locais: "locais",
    fornecedores: "fornecedores",
    bases: "bases",
  };
  return (
    ({
      consultar: "Consultar",
      criar: "Criar",
      editar: "Editar",
      cadastrar: "Cadastrar",
      cancelar: "Cancelar",
    }[verbo] || verbo) +
    " " +
    (modulos[modulo] || modulo)
  );
}

export function possuiVinculo(usuario = prgdState.currentUser) {
  return usuario?.acessoInstitucional != null;
}

export function acessoInstitucionalAtivo(
  usuario = prgdState.currentUser,
  agora = Date.now(),
) {
  const v = usuario?.acessoInstitucional;
  return (
    !!usuario &&
    usuario.ativo !== false &&
    usuario.excluido !== true &&
    !!v &&
    !!prgdState.PAPEIS_INSTITUCIONAIS[v.papel] &&
    v.situacao === "aprovado" &&
    Number.isFinite(v.inicio) &&
    Number.isFinite(v.fim) &&
    Number.isFinite(v.revisao) &&
    v.inicio <= agora &&
    v.fim > agora &&
    v.revisao > agora &&
    (v.papel === "grgd" ? usuario.tipoUsuario === "interno" : !!v.orgaoId) &&
    (v.papel !== "substituto" ||
      (!!v.titularUid && v.titularUid !== usuario.uid)) &&
    Array.isArray(v.setoresIds) &&
    Array.isArray(v.acoes) &&
    v.acoes.every((a) =>
      prgdState.PAPEIS_INSTITUCIONAIS[v.papel].acoes.includes(a),
    )
  );
}

export function podeAcao(
  modulo,
  acao = "consultar",
  usuario = prgdState.currentUser,
) {
  if (!usuario || usuario.ativo === false || usuario.excluido === true)
    return false;
  if (ehAdministrador(usuario)) return true;
  if (possuiVinculo(usuario))
    return (
      acessoInstitucionalAtivo(usuario) &&
      usuario.acessoInstitucional.acoes.includes(modulo + "." + acao)
    );
  if (acao === "consultar") return modulosDoUsuario(usuario).includes(modulo);
  return (
    modulo === "inscricoes" &&
    acao === "propria" &&
    modulosDoUsuario(usuario).includes("eventos")
  );
}

export function podeAlterarColecao(colecao, acao = "editar") {
  return (
    ehAdministrador() ||
    (prgdState.currentUser?.acessoInstitucional?.papel === "grgd" &&
      ["criar", "editar"].includes(acao) &&
      podeAcao(prgdState.ACAO_COLECAO[colecao]) &&
      podeAcao(prgdState.ACAO_COLECAO[colecao], acao))
  );
}

export function portalInstitucional(usuario = prgdState.currentUser) {
  return (
    possuiVinculo(usuario) &&
    ["gestor_nsi", "substituto", "auditoria"].includes(
      usuario.acessoInstitucional.papel,
    )
  );
}

export function nomePerfilAcesso(usuario = prgdState.currentUser) {
  if (usuario?.perfil === "admin" && usuario?.tipoUsuario !== "externo")
    return "Administrador da PRGD";
  return (
    prgdState.PAPEIS_INSTITUCIONAIS[usuario?.acessoInstitucional?.papel]
      ?.nome || "Consulta"
  );
}

export function chaveOrgaoUsuario(usuario) {
  return usuario.acessoInstitucional?.orgaoId || usuario.orgao || "";
}

export function nomeOrgaoUsuario(usuario) {
  const chave = chaveOrgaoUsuario(usuario);
  return (
    prgdState.dbData.orgaos.find((o) => String(o.firestoreId || o.id) === chave)
      ?.sigla ||
    chave ||
    (usuario.tipoUsuario === "externo" ? "Não vinculado" : "ATI")
  );
}

export function situacaoVinculo(usuario) {
  const v = usuario.acessoInstitucional;
  if (!v) return "";
  if (v.situacao !== "aprovado")
    return v.situacao === "suspenso" ? "Suspenso" : "Pendente de aprovação";
  if (v.fim <= Date.now()) return "Vencido";
  if (v.revisao <= Date.now()) return "Revisão pendente";
  if (v.inicio > Date.now()) return "Aguardando início";
  return acessoInstitucionalAtivo(usuario)
    ? "Aprovado"
    : "Pendente de validação";
}

export function registroNoEscopo(item, usuario = prgdState.currentUser) {
  if (ehAdministrador(usuario)) return true;
  const v = usuario?.acessoInstitucional;
  return (
    acessoInstitucionalAtivo(usuario) &&
    item.orgaoId === v.orgaoId &&
    (!v.setoresIds.length || v.setoresIds.includes(item.setorId))
  );
}

export function programarRevisaoAcesso() {
  if (prgdState.acessoTimer) clearTimeout(prgdState.acessoTimer);
  prgdState.acessoTimer = null;
  const v = prgdState.currentUser?.acessoInstitucional;
  if (!v) return;
  const futuro = [v.inicio, v.fim, v.revisao]
    .filter((t) => t > Date.now())
    .sort((a, b) => a - b)[0];
  if (futuro)
    prgdState.acessoTimer = setTimeout(
      () => {
        ++prgdState.versaoSessao;
        pararSnapshots();
        const usuario = prgdState.currentUser;
        limparDadosSessao();
        prgdState.currentUser = usuario;
        iniciarSnapshotFirestore();
        renderizarTudo();
        restaurarNavegacao();
      },
      Math.min(2147483647, Math.max(1, futuro - Date.now() + 25)),
    );
}

export function consultasDoEscopo(colecao) {
  const v = prgdState.currentUser.acessoInstitucional;
  const filtros = [where("orgaoId", "==", v.orgaoId)];
  if (v.setoresIds.length) filtros.push(where("setorId", "in", v.setoresIds));
  return query(collection(prgdState.db, colecao), ...filtros);
}

export function modulosDoUsuario(usuario = prgdState.currentUser) {
  if (!usuario || usuario.ativo === false || usuario.excluido === true)
    return [];
  if (ehAdministrador(usuario))
    return [
      ...prgdState.MÓDULOS_SISTEMA.map((m) => m.id).filter(
        (id) => !prgdState.MODULOS_PORTAL.includes(id),
      ),
      "colaboradores",
    ];
  if (possuiVinculo(usuario)) {
    if (!acessoInstitucionalAtivo(usuario)) return [];
    const v = usuario.acessoInstitucional,
      mods = [];
    if (v.papel === "grgd") {
      for (const m of prgdState.MÓDULOS_SISTEMA)
        if (v.acoes.includes(m.id + ".consultar")) mods.push(m.id);
      return mods.length ? ["dashboard", ...mods] : [];
    }
    if (v.acoes.includes("orgao.consultar")) mods.push("meu_orgao");
    if (v.acoes.includes("participantes.consultar")) mods.push("colaboradores");
    if (v.acoes.includes("eventos.consultar")) mods.push("eventos");
    if (
      v.acoes.includes("inscricoes.consultar") ||
      v.acoes.includes("comprovantes.consultar") ||
      v.acoes.includes("relatorios.consultar")
    )
      mods.push("inscricoes_orgao");
    if (v.acoes.includes("auditoria.consultar")) mods.push("auditoria_orgao");
    return mods;
  }
  const legados = usuario.tipoUsuario
    ? []
    : ["dashboard", "demandas", "eventos"];
  const modulos = Array.isArray(usuario.modulosPermitidos)
    ? usuario.modulosPermitidos
    : legados;
  return modulos.filter(
    (id) =>
      id !== "usuarios" &&
      !prgdState.MODULOS_PORTAL.includes(id) &&
      prgdState.MÓDULOS_SISTEMA.some((m) => m.id === id) &&
      (usuario.tipoUsuario !== "externo" || id === "eventos"),
  );
}

export function assinaturaAcesso(usuario) {
  // Compara somente permissões efetivas. Ordem dos mapas e metadados não reiniciam os listeners.
  const v = usuario?.acessoInstitucional,
    lista = (itens) => (Array.isArray(itens) ? [...itens].sort() : []);
  return JSON.stringify([
    usuario?.ativo !== false,
    usuario?.excluido === true,
    ehAdministrador(usuario),
    usuario?.tipoUsuario || "",
    lista(modulosDoUsuario(usuario)),
    lista(usuario?.grupos),
    v
      ? [
          v.papel,
          v.orgaoId,
          lista(v.setoresIds),
          v.situacao,
          v.inicio,
          v.fim,
          v.revisao,
          v.titularUid || "",
          lista(v.acoes),
          v.operacoesVersao || "",
        ]
      : null,
  ]);
}
