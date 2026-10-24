// Responsabilidade: modules/inscricoes/reports. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "../../app/state.js";
import { ehAdministrador } from "../acessos/policies.js";
import { dataInscricaoRelatorio, campoCsvRelatorio } from "../../domain/csv.js";

export function relatorioInscricoesPronto() {
  return (
    ehAdministrador() &&
    prgdState.agendaLocaisEstado === "completa" &&
    prgdState.inscricoesRelatorioEstado === "pronto"
  );
}

export function prepararRelatorioInscricoes(eventoId = "") {
  if (!ehAdministrador())
    throw new Error(
      "Somente o administrador pode exportar relatórios gerais com dados pessoais.",
    );
  if (!relatorioInscricoesPronto())
    throw new Error(
      "Aguarde o carregamento completo de eventos e inscrições. Se houver falha de consulta, revise o acesso e tente novamente.",
    );
  const id = String(eventoId || "");
  const eventos = prgdState.dbData.eventos || [];
  const encontrarEvento = (chave) =>
    eventos.find((e) =>
      [e.firestoreId, e.id].some(
        (v) => v != null && String(v) === String(chave),
      ),
    );
  const eventoSelecionado = id ? encontrarEvento(id) : null;
  if (id && !eventoSelecionado)
    throw new Error("Evento não encontrado entre os dados autorizados.");
  const pertence = (inscricao, evento) =>
    [evento.firestoreId, evento.id].some(
      (v) => v != null && String(v) === String(inscricao.eventId),
    );
  const inscricoes = (prgdState.dbData.inscricoes || []).filter(
    (i) => !id || pertence(i, eventoSelecionado),
  );
  const cabecalho = [
    "Evento",
    "ID do evento",
    "Participante",
    "E-mail institucional",
    "Órgão",
    "Setor",
    "Situação",
    "Protocolo",
    "Criada em",
    "Atualizada em",
    "Modelo de inscrição",
  ];
  const linhas = inscricoes
    .map((i) => {
      const evento = encontrarEvento(i.eventId);
      const orgao = (prgdState.dbData.orgaos || []).find((o) =>
        [o.firestoreId, o.id].some(
          (v) => v != null && String(v) === String(i.orgaoId),
        ),
      );
      const setor = (prgdState.dbData.setores || []).find((s) =>
        [s.firestoreId, s.id].some(
          (v) => v != null && String(v) === String(i.setorId),
        ),
      );
      return [
        evento?.titulo || i.eventoTitulo || "Evento não identificado",
        i.eventId || "",
        i.participanteNome || i.nome || "",
        i.emailInstitucional || i.email || "",
        orgao?.nome || i.orgaoId || "",
        setor?.nome || i.setorId || "",
        i.situacao || "Não informada (fluxo anterior)",
        i.protocolo || i.firestoreId || i.id || "",
        dataInscricaoRelatorio(i.criadoEm),
        dataInscricaoRelatorio(i.atualizadoEm),
        i.modeloInscricao === prgdState.MODELO_INSCRICAO
          ? "Institucional"
          : "Anterior",
      ];
    })
    .sort(
      (a, b) =>
        String(a[0]).localeCompare(String(b[0]), "pt-BR") ||
        String(a[2]).localeCompare(String(b[2]), "pt-BR"),
    );
  const csv =
    "\uFEFF" +
    [cabecalho, ...linhas]
      .map((linha) => linha.map(campoCsvRelatorio).join(";"))
      .join("\r\n") +
    "\r\n";
  const nomeCurto =
    String(eventoSelecionado?.titulo || "geral")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "evento";
  const nomeArquivo =
    "prgd-inscricoes-" +
    nomeCurto +
    "-" +
    new Date().toISOString().slice(0, 10) +
    ".csv";
  return { csv, total: linhas.length, nomeArquivo };
}

export function baixarRelatorioInscricoes(eventoId = "") {
  const relatorio = prepararRelatorioInscricoes(eventoId);
  if (!relatorio.total) {
    alert("Nenhuma inscrição localizada. Nenhum arquivo foi gerado.");
    return false;
  }
  let url;
  try {
    url = URL.createObjectURL(
      new Blob([relatorio.csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = relatorio.nomeArquivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (erro) {
    if (url) URL.revokeObjectURL(url);
    throw erro;
  }
}
