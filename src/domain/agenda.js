// Responsabilidade: domain/agenda. Estado transitório compartilhado apenas em app/state.js.

export function eventoEncerrado(evento, agora = new Date()) {
  if (evento.status === "Realizado") return true;
  const data = evento.dataFim || evento.dataInicio;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data || "")) {
    const instante = new Date(data);
    return !!data && Number.isFinite(instante.getTime()) && instante < agora;
  }
  const [ano, mes, dia] = data.split("-").map(Number),
    hora = /^\d{2}:\d{2}$/.test(evento.horaFim || "")
      ? evento.horaFim
      : "23:59";
  const [h, m] = hora.split(":").map(Number),
    fim = new Date(ano, mes - 1, dia, h, m, 59, 999);
  return fim < agora;
}

export function consultarAgendaEventos(
  lista,
  filtros = {},
  agora = new Date(),
) {
  const de = filtros.de || "",
    ate = filtros.ate || "";
  if ((de && diaEventoLocal(de) !== de) || (ate && diaEventoLocal(ate) !== ate))
    return {
      eventos: [],
      erro: "Informe datas válidas para consultar a agenda.",
    };
  if (de && ate && de > ate)
    return {
      eventos: [],
      erro: "A data final do filtro deve ser igual ou posterior à inicial.",
    };
  const texto = normalizarLocal(filtros.busca),
    periodo = filtros.periodo || "futuros";
  const eventos = lista.filter((e) => {
    const encerrado = eventoEncerrado(e, agora),
      inicio = diaEventoLocal(e.dataInicio),
      fim = e.dataFim ? diaEventoLocal(e.dataFim) : inicio;
    return (
      (periodo === "todos" ||
        (periodo === "realizados" ? encerrado : !encerrado)) &&
      (!filtros.status || String(e.status || "").trim() === filtros.status) &&
      (!filtros.tipo || String(e.tipoEvento || "").trim() === filtros.tipo) &&
      (!texto ||
        [e.titulo, e.palestrante, e.localEvento].some((v) =>
          normalizarLocal(v).includes(texto),
        )) &&
      (!(de || ate) ||
        (inicio &&
          fim >= inicio &&
          (!de || fim >= de) &&
          (!ate || inicio <= ate)))
    );
  });
  const direcao =
    (filtros.ordem ||
      (periodo === "realizados" ? "decrescente" : "crescente")) ===
    "decrescente"
      ? -1
      : 1;
  eventos.sort((a, b) => {
    const da = diaEventoLocal(a.dataInicio),
      db = diaEventoLocal(b.dataInicio);
    if (!da || !db) {
      if (da !== db) return da ? -1 : 1;
    }
    const data =
      da.localeCompare(db) ||
      horarioEventoLocal(a, "dataInicio").localeCompare(
        horarioEventoLocal(b, "dataInicio"),
      );
    return (
      direcao * data ||
      String(a.titulo || "").localeCompare(String(b.titulo || ""), "pt-BR") ||
      String(a.firestoreId || a.id || "").localeCompare(
        String(b.firestoreId || b.id || ""),
      )
    );
  });
  return { eventos, erro: "" };
}

export function numeroLocal(valor) {
  if (typeof valor === "number")
    return Number.isFinite(valor) && valor >= 0 ? valor : null;
  let s = String(valor ?? "")
    .trim()
    .replace(/^R\$\s*/i, "")
    .trim();
  if (!s) return null;
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(s))
    s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d+(?:,\d{1,2})?$/.test(s)) s = s.replace(",", ".");
  else if (!/^\d+(?:\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function tipoLocacaoLocal(l) {
  if (["gratuito", "pago"].includes(l.tipoLocacao)) return l.tipoLocacao;
  const v = numeroLocal(l.valorAluguel);
  if (v !== null) return v === 0 ? "gratuito" : "pago";
  return ["gratuito", "gratis"].includes(normalizarLocal(l.valorAluguel))
    ? "gratuito"
    : "nao-informado";
}

export function recursosLocal(l) {
  const r = l.recursos;
  return Array.isArray(r)
    ? r.filter((v) => typeof v === "string" && v.trim())
    : typeof r === "string"
      ? r
          .split(/[,;\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
}

export function diaEventoLocal(valor) {
  if (typeof valor !== "string") return "";
  const m = valor.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
  if (!m) return "";
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (
    !(
      d.getUTCFullYear() === Number(m[1]) &&
      d.getUTCMonth() === Number(m[2]) - 1 &&
      d.getUTCDate() === Number(m[3])
    )
  )
    return "";
  if (/T.*(?:Z|[+-]\d{2}:?\d{2})$/.test(valor)) {
    const instante = new Date(valor);
    if (!Number.isFinite(instante.getTime())) return "";
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Recife",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(instante);
  }
  return m[0].slice(0, 10);
}

export function intervaloEventoLocal(e) {
  const inicio = diaEventoLocal(e.dataInicio),
    fim = e.dataFim ? diaEventoLocal(e.dataFim) : inicio;
  return inicio && fim && fim >= inicio ? { inicio, fim } : null;
}

export function horarioEventoLocal(e, chave) {
  const explicito = e[chave === "dataInicio" ? "horaInicio" : "horaFim"];
  let hora =
    explicito ||
    (typeof e[chave] === "string" ? e[chave].match(/T(\d{2}:\d{2})/)?.[1] : "");
  if (!explicito && /T.*(?:Z|[+-]\d{2}:?\d{2})$/.test(e[chave] || "")) {
    const instante = new Date(e[chave]);
    hora = Number.isFinite(instante.getTime())
      ? new Intl.DateTimeFormat("en-GB", {
          timeZone: "America/Recife",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(instante)
      : "";
  }
  return /^\d{2}:\d{2}$/.test(hora || "") &&
    Number(hora.slice(0, 2)) < 24 &&
    Number(hora.slice(3)) < 60
    ? hora
    : "";
}

export function hojeLocais() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Recife",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export const normalizarLocal = (valor) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

export const moedaLocal = (n) =>
  n === null
    ? "Não informado"
    : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const valorLocacaoTexto = (l) =>
  numeroLocal(l.valorAluguel) === null
    ? String(l.valorAluguel ?? "Não informado")
    : moedaLocal(numeroLocal(l.valorAluguel));

export const eventoCanceladoLocal = (e) =>
  ["cancelado", "cancelada", "canceled", "cancelled"].includes(
    normalizarLocal(e.status),
  );
