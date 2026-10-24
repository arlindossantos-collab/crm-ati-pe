import {
  rotuloCampo,
  formatarDataExibicao,
  nomeSituacaoInscricao,
} from "../../domain/display.js";
import { nomeReferencia } from "../../shared/record-display.js";
// Responsabilidade: modules/portal/index. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "../../app/state.js";
import {
  ehAdministrador,
  acessoInstitucionalAtivo,
  podeAcao,
  portalInstitucional,
  nomePerfilAcesso,
  registroNoEscopo,
  consultasDoEscopo,
  modulosDoUsuario,
} from "../acessos/policies.js";
import {
  gestorPode,
  eventoElegivelInstitucional,
  limparOperacoesInstitucionais,
  atualizarSetoresColaborador,
  renderColaboradoresAdmin,
} from "../colaboradores/index.js";
import {
  renderAcoesPortal,
  observarEventosPortal,
} from "../inscricoes/operations.js";
import { atualizarIdentidadeSessao } from "../perfil/index.js";
import { formatarData, esc } from "../../shared/presentation.js";
import { atualizarVisibilidadeAbas } from "../../app/navigation.js";
import { observarFirestore } from "../../services/subscriptions.js";
import { eventoEncerrado } from "../../domain/agenda.js";
import { doc } from "../../services/firebase.js";

export function usaPortalExterno(usuario = prgdState.currentUser) {
  return (
    !!usuario &&
    !ehAdministrador(usuario) &&
    (portalInstitucional(usuario) || usuario.tipoUsuario === "externo")
  );
}

export function textoPortal(id, texto) {
  const el = document.getElementById(id);
  if (el && el.textContent !== texto) el.textContent = texto;
}

export function htmlPortal(id, html) {
  const el = document.getElementById(id);
  if (el && el.innerHTML !== html) el.innerHTML = html;
}

export function atualizarAreaPorPerfil() {
  const externo = usaPortalExterno();
  document.body?.setAttribute("data-layout", externo ? "portal" : "interna");
  textoPortal(
    "painel-identificacao",
    prgdState.currentUser
      ? externo
        ? "Painel externo"
        : "Painel gerencial"
      : "",
  );
  if (!externo) {
    for (const id of [
      "portal-orgao-nome",
      "portal-papel-nome",
      "portal-saudacao",
      "portal-pagina-titulo",
      "portal-pagina-descricao",
    ])
      textoPortal(id, "");
    return;
  }
  const v = prgdState.currentUser.acessoInstitucional,
    orgao = v
      ? prgdState.dbData.orgaos.find(
          (o) => String(o.firestoreId || o.id) === v.orgaoId,
        )
      : null;
  textoPortal(
    "portal-orgao-nome",
    orgao?.nome || orgao?.sigla || (v ? "Órgão vinculado" : "Área de eventos"),
  );
  textoPortal("portal-papel-nome", v ? nomePerfilAcesso() : "Usuário externo");
  textoPortal(
    "portal-saudacao",
    "Olá, " + (prgdState.currentUser.nome || "bem-vindo") + ".",
  );
  const paginas = {
    meu_orgao: [
      v?.papel === "substituto" ? "Minha delegação" : "Meu órgão",
      "Acompanhe os colaboradores, as inscrições e os eventos disponíveis no seu escopo.",
    ],
    colaboradores: [
      "Colaboradores",
      "Organize os colaboradores por setor e mantenha os dados atualizados. O cadastro não cria conta de acesso.",
    ],
    eventos: [
      "Eventos",
      "Consulte a agenda e as oportunidades disponíveis para o seu perfil.",
    ],
    inscricoes_orgao: [
      "Inscrições do órgão",
      "Acompanhe as inscrições autorizadas e consulte os comprovantes disponíveis.",
    ],
    auditoria_orgao: [
      "Auditoria autorizada",
      "Consulte as trilhas permitidas no órgão e nos setores da sua autorização.",
    ],
  };
  const pagina = modulosDoUsuario().includes(prgdState.abaAtual)
    ? paginas[prgdState.abaAtual]
    : null;
  textoPortal("portal-pagina-titulo", pagina?.[0] || "Acesso em análise");
  textoPortal(
    "portal-pagina-descricao",
    pagina?.[1] ||
      "Seu cadastro está ativo. Aguarde a liberação dos módulos pelo administrador.",
  );
}

export function renderInicioPortal() {
  const ativo =
    usaPortalExterno() &&
    portalInstitucional() &&
    acessoInstitucionalAtivo() &&
    podeAcao("orgao");
  if (!ativo) {
    for (const id of [
      "portal-indicadores",
      "portal-atalhos",
      "portal-eventos-resumo",
    ])
      htmlPortal(id, "");
    document.getElementById("portal-agenda").hidden = true;
    return;
  }
  const cards = [],
    estado = (col) =>
      prgdState.portalCarregando[col]
        ? "Carregando…"
        : prgdState.portalErros[col]
          ? "Consulta indisponível"
          : "";
  const card = (label, n, extra, icone, verde = false) =>
    `<div class="portal-card" data-tone="${verde ? "verde" : "azul"}"><p class="portal-card-label"><i class="fa-solid ${icone}" aria-hidden="true"></i>${esc(label)}</p><strong>${esc(n)}</strong><small>${esc(extra)}</small></div>`;
  const eventos = podeAcao("eventos")
    ? prgdState.dbData.eventos
        .filter(
          (e) =>
            (e.eventoPublico === true ||
              e.orgaosElegiveis?.includes(
                prgdState.currentUser.acessoInstitucional.orgaoId,
              )) &&
            !eventoEncerrado(e),
        )
        .sort((a, b) =>
          String(a.dataInicio || "").localeCompare(String(b.dataInicio || "")),
        )
    : [];
  const estadoEventos =
    estado("eventos_publicos") || estado("eventos_elegiveis");
  if (podeAcao("eventos"))
    cards.push(
      card(
        "Eventos disponíveis",
        estadoEventos ? "—" : eventos.length,
        estadoEventos || "Na agenda pública ou destinados ao seu órgão",
        "fa-calendar-days",
      ),
    );
  if (podeAcao("participantes")) {
    const erro = estado("colaboradores");
    cards.push(
      card(
        "Colaboradores ativos",
        erro
          ? "—"
          : prgdState.dbData.colaboradores.filter(
              (p) => registroNoEscopo(p) && p.ativo !== false,
            ).length,
        erro || "Nos seus setores autorizados",
        "fa-users",
        true,
      ),
    );
  }
  if (
    podeAcao("inscricoes") ||
    podeAcao("comprovantes") ||
    podeAcao("relatorios")
  ) {
    const erro = estado("inscricoes");
    cards.push(
      card(
        "Inscrições confirmadas",
        erro
          ? "—"
          : prgdState.dbData.inscricoes.filter(
              (i) =>
                registroNoEscopo(i) &&
                String(i.situacao || "").toLowerCase() === "confirmada",
            ).length,
        erro || "Registros confirmados no seu escopo",
        "fa-ticket",
      ),
    );
  }
  htmlPortal("portal-indicadores", cards.join(""));
  const acoes = [];
  if (gestorPode("participantes.cadastrar"))
    acoes.push(
      '<button type="button" class="portal-atalho primario" data-portal-cadastrar>Cadastrar colaborador</button>',
    );
  else if (podeAcao("participantes"))
    acoes.push(
      '<button type="button" class="portal-atalho" data-portal-aba="colaboradores">Ver colaboradores</button>',
    );
  if (
    podeAcao("inscricoes") ||
    podeAcao("comprovantes") ||
    podeAcao("relatorios")
  )
    acoes.push(
      '<button type="button" class="portal-atalho" data-portal-aba="inscricoes_orgao">Consultar inscrições</button>',
    );
  htmlPortal("portal-atalhos", acoes.join(""));
  document.getElementById("portal-agenda").hidden = !podeAcao("eventos");
  const lista = eventos
    .slice(0, 3)
    .map(
      (e) =>
        `<tr><td class="p-3">${esc(e.titulo || "Evento")}</td><td class="p-3">${esc(formatarData(e.dataInicio))}</td><td class="p-3">${eventoElegivelInstitucional(e) ? "Inscrições abertas" : "Consulte os detalhes"}</td></tr>`,
    )
    .join("");
  htmlPortal(
    "portal-eventos-resumo",
    (estadoEventos
      ? `<p class="text-sm text-slate-600 mb-3">${esc(estadoEventos)}</p>`
      : "") +
      (lista
        ? `<div class="overflow-x-auto"><table class="w-full text-left"><thead><tr><th class="p-3">Evento</th><th class="p-3">Data</th><th class="p-3">Inscrições</th></tr></thead><tbody>${lista}</tbody></table></div>`
        : !estadoEventos
          ? '<p class="text-sm text-slate-500">Nenhum evento futuro disponível no momento.</p>'
          : ""),
  );
}

export function observarPortal(colecao, ref) {
  prgdState.portalCarregando[colecao] = true;
  prgdState.snapshotUnsubs.push(
    observarFirestore(
      ref,
      (snap) => {
        prgdState.dbData[colecao] = snap.docs
          ? snap.docs.map((d) => ({ ...d.data(), id: d.id, firestoreId: d.id }))
          : snap.exists()
            ? [{ ...snap.data(), id: snap.id, firestoreId: snap.id }]
            : [];
        delete prgdState.portalCarregando[colecao];
        delete prgdState.portalErros[colecao];
        if (colecao === "orgaos") {
          atualizarIdentidadeSessao();
          atualizarVisibilidadeAbas();
        }
        renderPortalInstitucional();
      },
      () => {
        delete prgdState.portalCarregando[colecao];
        prgdState.dbData[colecao] = [];
        prgdState.portalErros[colecao] = true;
        if (["colaboradores", "inscricoes"].includes(colecao))
          limparOperacoesInstitucionais();
        renderPortalInstitucional();
      },
    ),
  );
}

export function iniciarPortalInstitucional() {
  if (!acessoInstitucionalAtivo()) return;
  const v = prgdState.currentUser.acessoInstitucional;
  if (podeAcao("orgao"))
    observarPortal("orgaos", doc(prgdState.db, "orgaos", v.orgaoId));
  if (podeAcao("participantes"))
    observarPortal("colaboradores", consultasDoEscopo("colaboradores"));
  if (
    podeAcao("inscricoes") ||
    podeAcao("comprovantes") ||
    podeAcao("relatorios")
  )
    observarPortal("inscricoes", consultasDoEscopo("inscricoes"));
  if (podeAcao("auditoria"))
    observarPortal("auditoriaOrgao", consultasDoEscopo("historicoAlteracoes"));
  if (podeAcao("eventos")) observarEventosPortal();
}

export function renderPortalInstitucional() {
  atualizarAreaPorPerfil();
  renderInicioPortal();
  const v = prgdState.currentUser?.acessoInstitucional;
  const box = document.getElementById("portal-resumo");
  if (!box) return;
  renderColaboradoresAdmin();
  if (!portalInstitucional() || !acessoInstitucionalAtivo()) {
    box.innerHTML = "";
    ["portal-colaboradores", "portal-inscricoes", "portal-auditoria"].forEach(
      (id) => (document.getElementById(id).innerHTML = ""),
    );
    document.getElementById("portal-erros").textContent = "";
    document.getElementById("portal-cadastro-status").textContent = "";
    return;
  }
  const orgao = prgdState.dbData.orgaos.find(
    (o) => String(o.firestoreId || o.id) === v.orgaoId,
  );
  const resumo = `<div class="flex flex-wrap gap-3 justify-between items-start"><div><p class="text-xs text-blue-800 font-bold">${esc(nomePerfilAcesso())}</p><h3 class="font-bold text-xl mt-1">${esc(orgao?.nome || orgao?.sigla || (prgdState.portalErros.orgaos ? "Órgão indisponível" : prgdState.portalCarregando.orgaos ? "Carregando órgão…" : "Órgão vinculado"))}</h3><p class="text-sm text-slate-600 mt-2">${v.setoresIds.length ? esc(v.setoresIds.map((id) => prgdState.dbData.setores.find((s) => s.id === id)?.nome || "Setor vinculado").join(", ")) : "Todos os setores do órgão"}</p></div><span class="text-xs bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-full px-3 py-1">Vínculo ativo</span></div><p class="text-xs text-slate-500 mt-3">Válido até ${esc(formatarDataExibicao(v.fim))} · Revisão até ${esc(formatarDataExibicao(v.revisao))}</p>`;
  if (box.innerHTML !== resumo) box.innerHTML = resumo;
  atualizarSetoresColaborador();
  const status = document.getElementById("portal-cadastro-status");
  if (status)
    status.textContent = gestorPode("participantes.cadastrar")
      ? "Selecione um setor no cadastro para organizar os colaboradores."
      : "Cadastro em consulta. O administrador precisa habilitar as operações e a ação de cadastrar participantes no seu vínculo.";

  const linhas = (colecao, campos) => {
    if (prgdState.portalCarregando[colecao])
      return '<tr><td colspan="5" class="p-4 text-slate-500">Carregando registros…</td></tr>';
    if (prgdState.portalErros[colecao])
      return '<tr><td colspan="4" class="p-4 text-red-700">Não foi possível confirmar o acesso. Os dados desta consulta foram removidos. Procure a GRGD.</td></tr>';
    const lista = (prgdState.dbData[colecao] || []).filter((i) =>
      registroNoEscopo(i),
    );
    return (
      lista
        .map(
          (i) =>
            "<tr>" +
            campos
              .map((c) => '<td class="p-3 border-t">' + esc(c(i)) + "</td>")
              .join("") +
            "</tr>",
        )
        .join("") ||
      '<tr><td colspan="4" class="p-4 text-slate-500">Nenhum registro disponível no seu escopo.</td></tr>'
    );
  };
  document.getElementById("portal-colaboradores").innerHTML = linhas(
    "colaboradores",
    [
      (i) => i.nome || "-",
      (i) => i.emailInstitucional || "-",
      (i) => nomeReferencia("setores", i.setorId),
      (i) => (i.ativo === false ? "Inativo" : "Ativo"),
    ],
  );
  document.getElementById("portal-inscricoes").innerHTML = linhas(
    "inscricoes",
    [
      (i) => i.participanteNome || i.nome || "-",
      (i) =>
        prgdState.dbData.eventos.find(
          (e) => String(e.firestoreId || e.id) === i.eventId,
        )?.titulo ||
        i.eventoTitulo ||
        nomeReferencia("eventos", i.eventId),
      (i) => nomeSituacaoInscricao(i.situacao, i.modeloInscricao),
      (i) => i.protocolo || "-",
    ],
  );
  document.getElementById("portal-auditoria").innerHTML = linhas(
    "auditoriaOrgao",
    [
      (i) => i.autorNome || "Responsável não informado",
      (i) => prgdState.NOMES_ACOES[i.acao] || rotuloCampo(i.acao),
      (i) => i.registroNome || "Registro sem nome",
      (i) => formatarDataExibicao(i.criadoEm, true),
    ],
  );
  renderAcoesPortal();
  const msg = document.getElementById("portal-erros");
  msg.textContent = Object.keys(prgdState.portalErros).length
    ? "Algumas consultas não puderam ser confirmadas. Nenhum dado dessas consultas é exibido."
    : "";
}
