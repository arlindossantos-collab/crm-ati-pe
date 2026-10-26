// Responsabilidade: modules/locais/index. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "../../app/state.js";
import { podeAlterarColecao, modulosDoUsuario } from "../acessos/policies.js";
import {
  formatarData,
  renderAuditInfo,
  esc,
} from "../../shared/presentation.js";
import {
  numeroLocal,
  tipoLocacaoLocal,
  recursosLocal,
  diaEventoLocal,
  intervaloEventoLocal,
  horarioEventoLocal,
  hojeLocais,
  normalizarLocal,
  moedaLocal,
  valorLocacaoTexto,
  eventoCanceladoLocal,
} from "../../domain/agenda.js";

export function vinculoEventoLocal(evento, locais = prgdState.dbData.locais) {
  if (evento.localId) {
    const l = locais.find((l) => idLocal(l) === String(evento.localId));
    return { id: l ? idLocal(l) : "", origem: l ? "id" : "inexistente" };
  }
  const nome = normalizarLocal(evento.localEvento);
  if (!nome) return { id: "", origem: "ausente" };
  const candidatos = locais.filter((l) => normalizarLocal(l.nome) === nome);
  return candidatos.length === 1
    ? { id: idLocal(candidatos[0]), origem: "nome" }
    : { id: "", origem: candidatos.length > 1 ? "ambiguo" : "ausente" };
}

export function indicadoresLocais(
  locais = prgdState.dbData.locais,
  eventos = prgdState.dbData.eventos,
  hoje = hojeLocais(),
) {
  let capacidade = 0,
    semCapacidade = 0,
    gratuitos = 0,
    pagos = 0,
    semTipo = 0,
    custo = 0,
    semCusto = 0,
    vinculados = 0,
    semVinculo = 0,
    semData = 0,
    custosInformados = 0;
  locais.forEach((l) => {
    const n = numeroLocal(l.capacidade);
    if (n !== null && Number.isInteger(n)) capacidade += n;
    else semCapacidade++;
    const t = tipoLocacaoLocal(l);
    if (t === "gratuito") gratuitos++;
    else if (t === "pago") pagos++;
    else semTipo++;
  });
  eventos.forEach((e) => {
    if (!vinculoEventoLocal(e, locais).id) {
      semVinculo++;
      return;
    }
    vinculados++;
    if (
      eventoCanceladoLocal(e) ||
      ["realizado", "realizada", "concluido"].includes(
        normalizarLocal(e.status),
      )
    )
      return;
    const periodo = intervaloEventoLocal(e);
    if (!periodo) {
      semData++;
      return;
    }
    if (periodo.fim < hoje) return;
    const n = numeroLocal(e.custoLocacaoPrevisto);
    if (n === null) semCusto++;
    else {
      custo += n;
      custosInformados++;
    }
  });
  return {
    total: locais.length,
    capacidade,
    semCapacidade,
    gratuitos,
    pagos,
    semTipo,
    custo,
    semCusto,
    vinculados,
    semVinculo,
    semData,
    custosInformados,
  };
}

export function textoAgendaLocais() {
  if (!modulosDoUsuario().includes("eventos"))
    return "Sem acesso ao módulo Eventos: a consulta de conflitos e os totais de eventos não estão disponíveis.";
  if (prgdState.agendaLocaisEstado === "erro")
    return "Não foi possível carregar a agenda. A consulta é inconclusiva.";
  if (
    prgdState.agendaLocaisEstado === "aguardando" ||
    prgdState.agendaLocaisEstado === "carregando"
  )
    return "Aguardando o carregamento da agenda. A consulta é inconclusiva.";
  if (prgdState.agendaLocaisEstado !== "completa")
    return "Agenda parcial: somente eventos acessíveis à sua conta. Podem existir reservas não exibidas.";
  return "Agenda cadastrada carregada. Reservas externas ao sistema não são verificadas.";
}

export function consultarConflitosLocal(localId, data, inicio = "", fim = "") {
  if (!prgdState.dbData.locais.some((l) => idLocal(l) === localId))
    throw new Error("Selecione um local cadastrado.");
  if (diaEventoLocal(data) !== data || !data)
    throw new Error("Informe uma data válida.");
  if (
    !!inicio !== !!fim ||
    (inicio &&
      (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(inicio) ||
        !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(fim) ||
        fim <= inicio))
  )
    throw new Error(
      "Informe início e fim válidos, com término após o início, ou deixe ambos vazios.",
    );
  const conflitos = [],
    pendencias = [];
  prgdState.dbData.eventos
    .filter((e) => !eventoCanceladoLocal(e))
    .forEach((e) => {
      const vinculo = vinculoEventoLocal(e),
        periodo = intervaloEventoLocal(e);
      if (vinculo.id && vinculo.id !== localId) return;
      if (periodo && (data < periodo.inicio || data > periodo.fim)) return;
      if (!vinculo.id || !periodo) {
        pendencias.push(e);
        return;
      }
      const hi = horarioEventoLocal(e, "dataInicio"),
        hf = horarioEventoLocal(e, "dataFim");
      // Sem horários completos e confiáveis, o dia inteiro pode estar comprometido.
      if (
        inicio &&
        hi &&
        hf &&
        periodo.inicio === periodo.fim &&
        hf > hi &&
        (fim <= hi || inicio >= hf)
      )
        return;
      conflitos.push(e);
    });
  return {
    conflitos,
    pendencias,
    completa:
      prgdState.agendaLocaisEstado === "completa" &&
      modulosDoUsuario().includes("eventos"),
  };
}

export function dataEventoTextoLocal(e) {
  const p = intervaloEventoLocal(e);
  if (!p) return "Data não informada ou inválida";
  const horas = [
    horarioEventoLocal(e, "dataInicio"),
    horarioEventoLocal(e, "dataFim"),
  ];
  return (
    formatarData(p.inicio) +
    (p.fim !== p.inicio ? " a " + formatarData(p.fim) : "") +
    (horas.every(Boolean)
      ? " • " + horas.join("–")
      : " • horário não informado")
  );
}

export function executarConsultaLocal(e) {
  e?.preventDefault?.();
  const box = document.getElementById("disponibilidade-resultado");
  if (!box) return;
  try {
    const r = consultarConflitosLocal(
      document.getElementById("disponibilidade-local").value,
      document.getElementById("disponibilidade-data").value,
      document.getElementById("disponibilidade-inicio").value,
      document.getElementById("disponibilidade-fim").value,
    );
    prgdState.consultaLocalAtiva = true;
    const titulo = r.conflitos.length
      ? "Possíveis conflitos encontrados"
      : !r.completa || r.pendencias.length
        ? "Não foi possível concluir a disponibilidade"
        : "Nenhum conflito na agenda cadastrada";
    box.innerHTML =
      '<div class="rounded-xl border p-4 bg-slate-50"><p class="font-bold">' +
      titulo +
      '</p><p class="text-xs text-slate-500 mt-1">' +
      esc(textoAgendaLocais()) +
      "</p>" +
      (r.pendencias.length
        ? '<p class="text-xs text-amber-800 mt-2">' +
          r.pendencias.length +
          " evento(s) precisam de revisão de local ou data antes de descartar conflitos.</p>"
        : "") +
      '<ul class="mt-3 space-y-2">' +
      r.conflitos
        .map(
          (ev) =>
            '<li class="text-xs border rounded-lg p-2 bg-white"><b>' +
            esc(ev.titulo || ev.nome || "Evento sem título") +
            "</b><br>" +
            esc(dataEventoTextoLocal(ev)) +
            "</li>",
        )
        .join("") +
      '</ul><p class="text-xs mt-2">Confirme a reserva com o responsável pelo local.</p></div>';
  } catch (err) {
    prgdState.consultaLocalAtiva = false;
    box.textContent = err.message;
  }
}

export function renderPainelLocal() {
  const box = document.getElementById("local-painel");
  if (!box) return;
  const l = prgdState.dbData.locais.find(
    (l) => idLocal(l) === prgdState.localSelecionadoId,
  );
  if (!l) {
    box.innerHTML =
      '<p class="text-sm text-slate-500">Selecione <strong>Detalhes</strong> na tabela para conhecer o espaço e seu histórico de eventos.</p>';
    return;
  }
  const lista = prgdState.eventosDoLocal(l);
  const historico = lista.filter((e) => {
    const p = intervaloEventoLocal(e);
    return (
      !eventoCanceladoLocal(e) &&
      (["realizado", "realizada", "concluido"].includes(
        normalizarLocal(e.status),
      ) ||
        (p && p.fim < hojeLocais()))
    );
  });
  const info = (titulo, valor) =>
    '<div class="rounded-xl bg-slate-50 border p-3"><dt class="text-[10px] uppercase tracking-wide text-slate-500 font-bold">' +
    titulo +
    '</dt><dd class="text-sm mt-1 whitespace-pre-wrap">' +
    esc(valor ?? "Não informado") +
    "</dd></div>";
  const extra = Object.entries(l).filter(
    ([k]) =>
      ![
        "firestoreId",
        "nome",
        "endereco",
        "capacidade",
        "area",
        "areaM2",
        "valorAluguel",
        "tipoLocacao",
        "periodicidadeLocacao",
        "contato",
        "contatoResponsavel",
        "telefone",
        "emailContato",
        "recursos",
        "descricao",
      ].includes(k),
  );
  box.innerHTML =
    '<div class="flex flex-wrap justify-between items-start gap-3"><div><p class="text-[10px] text-blue-700 font-bold uppercase tracking-widest">Detalhes do espaço</p><h4 class="font-bold text-xl mt-1">' +
    esc(l.nome || "Local sem nome") +
    '</h4></div><div class="flex gap-2">' +
    (podeAlterarColecao("locais")
      ? '<button type="button" data-local-editar="' +
        esc(idLocal(l)) +
        '" class="border border-blue-200 bg-blue-50 text-blue-900 rounded-lg px-3 py-2 text-xs font-bold">Editar cadastro</button>'
      : "") +
    '<button type="button" id="local-fechar-painel" class="border rounded-lg px-3 py-2 text-xs">Fechar</button></div></div>' +
    '<dl class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">' +
    info("Endereço", l.endereco || null) +
    info(
      "Capacidade",
      numeroLocal(l.capacidade) === null ? null : l.capacidade + " pessoas",
    ) +
    info("Área", l.area || (l.areaM2 ? l.areaM2 + " m²" : null)) +
    info(
      "Responsável / Contato",
      [l.contatoResponsavel, l.contato, l.telefone, l.emailContato]
        .filter(Boolean)
        .join("\n") || null,
    ) +
    info(
      "Locação",
      (tipoLocacaoLocal(l) === "nao-informado"
        ? "Tipo não informado"
        : tipoLocacaoLocal(l) === "gratuito"
          ? "Gratuito"
          : "Pago") +
        " • " +
        valorLocacaoTexto(l) +
        (l.periodicidadeLocacao ? " / " + l.periodicidadeLocacao : ""),
    ) +
    info("Recursos disponíveis", recursosLocal(l).join(", ") || null) +
    "</dl>" +
    '<p class="text-sm text-slate-600 whitespace-pre-wrap mt-4">' +
    esc(l.descricao || "Descrição não informada.") +
    "</p>" +
    '<div class="mt-5 pt-4 border-t"><h5 class="font-bold text-sm">Histórico de eventos</h5><p class="text-xs text-slate-500 mt-1">' +
    esc(textoAgendaLocais()) +
    ' Datas passadas sem status de realização exigem confirmação.</p><ul class="mt-3 space-y-2">' +
    historico
      .sort((a, b) =>
        String(b.dataInicio || "").localeCompare(String(a.dataInicio || "")),
      )
      .map(
        (ev) =>
          '<li class="p-3 border rounded-xl bg-slate-50 text-xs"><b>' +
          esc(ev.titulo || ev.nome || "Evento") +
          "</b><br>" +
          esc(dataEventoTextoLocal(ev)) +
          '<br><span class="text-slate-500">' +
          (["realizado", "realizada", "concluido"].includes(
            normalizarLocal(ev.status),
          )
            ? "Realização registrada"
            : "Data encerrada; realização a confirmar") +
          "</span></li>",
      )
      .join("") +
    "</ul>" +
    (historico.length
      ? ""
      : '<p class="text-xs text-slate-500 mt-3">Nenhum evento passado identificado entre os registros carregados.</p>') +
    "</div>" +
    '<details class="mt-4 border-t pt-3"><summary class="text-xs font-bold cursor-pointer">Demais informações cadastradas</summary><dl class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">' +
    extra
      .map(([k, v]) =>
        info(esc(k), typeof v === "object" ? JSON.stringify(v) : String(v)),
      )
      .join("") +
    "</dl></details>";
}

export function selecionarLocal(id) {
  prgdState.localSelecionadoId = id;
  renderPainelLocal();
  const s = document.getElementById("disponibilidade-local");
  if (s) s.value = id;
  prgdState.consultaLocalAtiva = false;
  document.getElementById("disponibilidade-resultado").textContent = "";
  const box = document.getElementById("local-painel");
  box?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  box?.focus?.({ preventScroll: true });
}

export function renderLocais() {
  const tbody = document.getElementById("tabela-locais");
  if (!tbody) return;
  const tipo = document.getElementById("local-filtro-tipo")?.value || "";
  const minima = numeroLocal(
    document.getElementById("local-filtro-capacidade")?.value,
  );
  const recurso = normalizarLocal(
    document.getElementById("local-filtro-recurso")?.value,
  );
  const busca = normalizarLocal(prgdState.buscaLocaisVal);
  const filtrados = prgdState.dbData.locais.filter((l) => {
    const cap = numeroLocal(l.capacidade);
    return (
      (!busca ||
        normalizarLocal(
          [
            l.nome,
            l.endereco,
            l.contato,
            l.contatoResponsavel,
            l.telefone,
            l.emailContato,
          ]
            .filter(Boolean)
            .join(" "),
        ).includes(busca)) &&
      (!tipo || tipoLocacaoLocal(l) === tipo) &&
      (minima === null || (cap !== null && cap >= minima)) &&
      (!recurso ||
        normalizarLocal(recursosLocal(l).join(" ")).includes(recurso))
    );
  });
  document.getElementById("count-locais").textContent = filtrados.length;
  const k = indicadoresLocais(),
    agenda =
      modulosDoUsuario().includes("eventos") &&
      ["completa", "parcial"].includes(prgdState.agendaLocaisEstado);
  const cards = [
    ["Locais cadastrados", k.total, "Espaços carregados"],
    [
      "Capacidade total",
      k.capacidade,
      "Pessoas • " + k.semCapacidade + " sem informação",
    ],
    [
      "Eventos vinculados",
      agenda ? k.vinculados : "—",
      "Todos os períodos, inclusive cancelados",
    ],
    ["Locais gratuitos", k.gratuitos, "Gratuidade informada no cadastro"],
    ["Locais pagos", k.pagos, k.semTipo + " sem tipo informado"],
    [
      "Custo total previsto",
      agenda
        ? (k.semCusto || k.semData) && !k.custosInformados
          ? "Não informado"
          : moedaLocal(k.custo)
        : "—",
      "Eventos atuais/futuros • subtotal informado",
    ],
  ];
  const iconesIndicadoresLocais = [
    "building",
    "users",
    "calendar-days",
    "gift",
    "credit-card",
    "coins",
  ];
  document.getElementById("locais-indicadores").innerHTML = cards
    .map(
      ([label, val, nota], i) =>
        '<div class="local-card-suave rounded-2xl border shadow-sm p-4" data-tone="' +
        (i % 2 === 0 ? "azul" : "verde") +
        '"><div class="local-card-rotulo"><i class="fa-solid fa-' +
        iconesIndicadoresLocais[i] +
        ' local-card-icone" aria-hidden="true"></i><p class="text-[10px] font-bold uppercase tracking-wide text-slate-500">' +
        label +
        '</p></div><p class="text-2xl font-bold text-blue-950 mt-2 break-words">' +
        val +
        '</p><p class="text-[10px] text-slate-500 mt-2">' +
        nota +
        "</p></div>",
    )
    .join("");
  document.getElementById("locais-qualidade").textContent =
    textoAgendaLocais() +
    (agenda
      ? " " +
        k.semVinculo +
        " evento(s) sem vínculo confirmado; " +
        k.semCusto +
        " evento(s) atual(is)/futuro(s) sem custo informado; " +
        k.semData +
        " evento(s) vinculados sem período válido. O custo é a soma dos totais informados por evento, sem multiplicar tarifas do local."
      : "");
  tbody.innerHTML =
    filtrados
      .map((l) => {
        const cap = numeroLocal(l.capacidade),
          rs = recursosLocal(l),
          tipo = tipoLocacaoLocal(l);
        return (
          '<tr class="hover:bg-blue-50/40"><td class="p-4"><b class="text-blue-950">' +
          esc(l.nome || "Sem nome") +
          '</b><p class="text-[11px] text-slate-500 mt-1">' +
          esc(l.endereco || "Endereço não informado") +
          '</p></td><td class="p-4 text-xs">' +
          (cap === null ? "Não informada" : esc(cap) + " pessoas") +
          '<br><span class="text-slate-500">' +
          esc(l.area || (l.areaM2 ? l.areaM2 + " m²" : "")) +
          '</span></td><td class="p-4 text-xs font-semibold">' +
          esc(valorLocacaoTexto(l)) +
          '<br><span class="font-normal text-slate-500">' +
          (tipo === "nao-informado"
            ? "Tipo não informado"
            : tipo === "gratuito"
              ? "Gratuito"
              : "Pago") +
          (l.periodicidadeLocacao ? " / " + esc(l.periodicidadeLocacao) : "") +
          '</span></td><td class="p-4"><span class="bg-blue-50 text-blue-800 rounded-full px-2.5 py-1 text-xs font-bold">' +
          (agenda ? prgdState.eventosDoLocal(l).length : "—") +
          '</span></td><td class="p-4 text-xs">' +
          (rs.length
            ? rs
                .map(
                  (r) =>
                    '<span class="inline-block m-0.5 bg-slate-100 rounded-md px-2 py-1">' +
                    esc(r) +
                    "</span>",
                )
                .join("")
            : "Não informados") +
          '</td><td class="p-4">' +
          renderAuditInfo(l).dataHtml +
          '</td><td class="p-4">' +
          renderAuditInfo(l).autorHtml +
          '</td><td class="p-4 text-center"><button type="button" class="text-xs bg-blue-50 px-3 py-2 rounded-lg font-semibold text-blue-900" data-local-detalhes="' +
          esc(idLocal(l)) +
          '">Detalhes</button></td></tr>'
        );
      })
      .join("") ||
    '<tr><td colspan="8" class="text-center text-sm text-slate-500 p-8">Nenhum local encontrado. Ajuste os filtros ou cadastre um espaço.</td></tr>';
  const sel = document.getElementById("disponibilidade-local"),
    atual = sel.value;
  sel.innerHTML =
    '<option value="">Selecione um local</option>' +
    prgdState.dbData.locais
      .map(
        (l) =>
          '<option value="' +
          esc(idLocal(l)) +
          '">' +
          esc(l.nome || "Local sem nome") +
          "</option>",
      )
      .join("");
  sel.value = prgdState.dbData.locais.some((l) => idLocal(l) === atual)
    ? atual
    : "";
  renderPainelLocal();
  if (prgdState.consultaLocalAtiva) executarConsultaLocal();
}

export function camposCadastroLocal(item = {}, novo = false) {
  const prefix = novo ? "novo-local-" : "editar-local-";
  const campo = (key, label, type = "text", extra = "") =>
    '<label class="block text-xs font-bold">' +
    label +
    '<input id="' +
    (novo && key === "nome" ? "uc-1" : prefix + key) +
    '" type="' +
    type +
    '" value="' +
    esc(item[key] ?? "") +
    '" ' +
    extra +
    ' class="block w-full p-2.5 border rounded-lg mt-1 font-normal"></label>';
  return (
    '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs max-h-[65vh] overflow-y-auto p-1">' +
    campo("nome", "Nome do local", "text", 'required maxlength="180"') +
    campo("capacidade", "Capacidade (pessoas)", "number", 'min="0" step="1"') +
    campo("endereco", "Endereço", "text", 'maxlength="500"') +
    campo("area", "Área (descrição ou m²)", "text", 'maxlength="150"') +
    campo(
      "contatoResponsavel",
      "Nome / contato do responsável",
      "text",
      'maxlength="200"',
    ) +
    campo("contato", "Outros contatos", "text", 'maxlength="200"') +
    campo("telefone", "Telefone", "tel", 'maxlength="40"') +
    campo("emailContato", "E-mail do contato", "email", 'maxlength="200"') +
    '<label class="font-bold">Tipo de locação<select id="' +
    prefix +
    'tipoLocacao" class="block w-full p-2.5 border rounded-lg mt-1 font-normal"><option value="nao-informado">Não informado</option><option value="gratuito" ' +
    (tipoLocacaoLocal(item) === "gratuito" ? "selected" : "") +
    '>Gratuito</option><option value="pago" ' +
    (tipoLocacaoLocal(item) === "pago" ? "selected" : "") +
    ">Pago</option></select></label>" +
    campo(
      "valorAluguel",
      "Valor de referência da locação (R$)",
      "text",
      'inputmode="decimal" placeholder="Ex.: 1.200,00"',
    ) +
    campo(
      "periodicidadeLocacao",
      "Unidade / condição do valor",
      "text",
      'placeholder="Ex.: hora, diária, evento; confirmar" maxlength="150"',
    ) +
    '<label class="font-bold">Recursos (um por linha ou separados por vírgula)<textarea id="' +
    prefix +
    'recursos" rows="3" class="block w-full p-2.5 border rounded-lg mt-1 font-normal" placeholder="Projetor, Wi-Fi, acessibilidade">' +
    esc(recursosLocal(item).join("\n")) +
    "</textarea></label>" +
    '<label class="sm:col-span-2 font-bold">Descrição e orientações<textarea id="' +
    (novo ? "uc-2" : prefix + "descricao") +
    '" rows="3" maxlength="4000" class="block w-full p-2.5 border rounded-lg mt-1 font-normal">' +
    esc(item.descricao || "") +
    '</textarea></label><p class="sm:col-span-2 text-slate-500">Campos opcionais vazios permanecem sem informação. O valor de referência não é multiplicado para estimar despesas dos eventos.</p></div>'
  );
}

export function lerCadastroLocal(novo = false, anterior = {}) {
  const prefix = novo ? "novo-local-" : "editar-local-";
  const val = (k) =>
    (
      document.getElementById(
        novo && k === "nome"
          ? "uc-1"
          : novo && k === "descricao"
            ? "uc-2"
            : prefix + k,
      )?.value || ""
    ).trim();
  const nome = val("nome");
  if (!nome || nome.length > 180)
    throw new Error("Informe o nome do local, com até 180 caracteres.");
  const capacidade = numeroLocal(val("capacidade"));
  if (
    val("capacidade") &&
    (capacidade === null || !Number.isInteger(capacidade))
  )
    throw new Error("Informe uma capacidade inteira, maior ou igual a zero.");
  const tipo = val("tipoLocacao") || "nao-informado";
  if (!["nao-informado", "gratuito", "pago"].includes(tipo))
    throw new Error("Selecione um tipo de locação válido.");
  let valor = numeroLocal(val("valorAluguel"));
  if (
    val("valorAluguel") &&
    valor === null &&
    !["gratuito", "gratis"].includes(normalizarLocal(val("valorAluguel")))
  )
    throw new Error(
      "Informe um valor monetário válido ou deixe o campo vazio.",
    );
  if (tipo === "gratuito") {
    if (valor !== null && valor > 0)
      throw new Error(
        "Um local gratuito não pode ter valor de aluguel maior que zero.",
      );
    valor = 0;
  }
  if (tipo === "pago" && valor === 0)
    throw new Error(
      "Para locação paga, informe valor maior que zero ou deixe sem informação.",
    );
  const email = val("emailContato");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Informe um e-mail de contato válido.");
  const rs = val("recursos")
    .split(/[,;\n]/)
    .map((v) => v.trim())
    .filter(Boolean);
  if (rs.length > 80 || rs.some((v) => v.length > 150))
    throw new Error("Informe até 80 recursos, com até 150 caracteres cada.");
  const dados = {
    nome,
    capacidade,
    tipoLocacao: tipo,
    valorAluguel: valor,
    recursos: [...new Set(rs)],
  };
  for (const k of [
    "endereco",
    "area",
    "contatoResponsavel",
    "contato",
    "telefone",
    "emailContato",
    "periodicidadeLocacao",
    "descricao",
  ])
    dados[k] = val(k);
  return dados;
}

export const idLocal = (local) => String(local.firestoreId || local.id || "");
