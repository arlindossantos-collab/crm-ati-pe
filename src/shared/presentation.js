import { formatarDataExibicao } from "../domain/display.js";
// Responsabilidade: shared/presentation. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "../app/state.js";
import { identificacaoUsuario } from "../modules/perfil/index.js";

export function aplicarMascaraTelefone(valor) {
  let v = String(valor || "").replace(/\D/g, "");
  if (v.length > 11) v = v.substring(0, 11);
  if (v.length > 10) {
    return v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
  } else if (v.length > 6) {
    return v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
  } else if (v.length > 2) {
    return v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
  } else if (v.length > 0) {
    return v.replace(/^(\d*)/, "($1");
  }
  return v;
}

export function aplicarMascaraData(valor) {
  let v = String(valor || "").replace(/\D/g, "");
  if (v.length > 8) v = v.substring(0, 8);
  if (v.length > 4) {
    return v.replace(/^(\d{2})(\d{2})(\d{0,4}).*/, "$1/$2/$3");
  } else if (v.length > 2) {
    return v.replace(/^(\d{2})(\d{0,2})/, "$1/$2");
  }
  return v;
}

export function traduzirErroSistema(err) {
  const msg = [err?.code, err?.message || err].filter(Boolean).join(" ");
  if (msg.includes("longer than") || msg.includes("bytes"))
    return "A imagem selecionada excede o limite permitido. Reduza o tamanho e tente novamente.";
  if (msg.includes("permission-denied"))
    return "Permissão negada. Você não tem autorização para realizar esta operação.";
  if (msg.includes("auth/email-already-in-use"))
    return "Este e-mail já possui conta de acesso. Edite o cadastro existente ou procure a GRGD para conferir o vínculo.";
  if (msg.includes("auth/requires-recent-login"))
    return "Entre novamente para confirmar a alteração da senha.";
  if (msg.includes("auth/wrong-password"))
    return "A senha atual está incorreta.";
  if (msg.includes("auth/too-many-requests"))
    return "Muitas tentativas. Aguarde um pouco antes de tentar novamente.";
  if (msg.includes("auth/weak-password"))
    return "A senha não atende aos requisitos de segurança. Use uma senha mais forte.";
  if (msg.includes("auth/invalid-credential"))
    return "E-mail ou senha incorretos. Verifique suas credenciais.";
  if (/auth\/(network-request-failed)|unavailable|deadline-exceeded/.test(msg))
    return "Não foi possível conectar ao serviço. Verifique a conexão e tente novamente.";
  if (
    /auth\/(user-disabled|user-token-expired|invalid-user-token)|unauthenticated/.test(
      msg,
    )
  )
    return "Sua sessão não está disponível. Entre novamente ou procure a GRGD.";
  if (
    err?.code ||
    (err?.name && err.name !== "Error") ||
    /Firebase|\[object Object\]|undefined|is not a function|not defined|<[^>]+>|^\s*(?:const|function|import|export)\b/.test(
      msg,
    )
  )
    return "Não foi possível concluir a operação. Tente novamente; se persistir, procure a GRGD.";
  if (
    typeof err?.message === "string" &&
    err.message.trim() &&
    err.message.length <= 400
  )
    return err.message;
  return "Não foi possível concluir a operação. Tente novamente; se persistir, procure a GRGD.";
}

export function gerarIniciais(nomeCompleto) {
  if (!nomeCompleto || typeof nomeCompleto !== "string") return "GR";
  const partes = nomeCompleto.trim().split(/\s+/);
  if (partes.length === 0 || !partes[0]) return "GR";
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return (
    partes[0].charAt(0) + partes[partes.length - 1].charAt(0)
  ).toUpperCase();
}

export function obterCorResponsavel(nomeResp) {
  const nome = String(nomeResp || "")
    .trim()
    .toLowerCase();
  if (nome.includes("arlindo"))
    return "bg-emerald-600 border-emerald-800 text-white";
  if (nome.includes("eronita"))
    return "bg-violet-600 border-violet-800 text-white";
  if (nome.includes("tino")) return "bg-amber-600 border-amber-800 text-white";
  if (nome.includes("richard")) return "bg-cyan-600 border-cyan-800 text-white";
  if (nome.includes("joão") || nome.includes("joao"))
    return "bg-indigo-600 border-indigo-800 text-white";
  if (nome.includes("lívia") || nome.includes("livia"))
    return "bg-pink-600 border-pink-800 text-white";
  if (nome.includes("rebeca")) return "bg-rose-600 border-rose-800 text-white";
  if (nome.includes("lorena")) return "bg-teal-600 border-teal-800 text-white";
  if (nome.includes("clarissa"))
    return "bg-fuchsia-600 border-fuchsia-800 text-white";
  if (nome.includes("antônio") || nome.includes("antonio"))
    return "bg-orange-600 border-orange-800 text-white";
  if (nome.includes("pacheco")) return "bg-blue-600 border-blue-800 text-white";
  return "bg-slate-700 border-slate-900 text-white";
}

export function renderizarBolinhaPrioridade(prio) {
  const p = String(prio || "")
    .trim()
    .toLowerCase();
  let corClasse = "bg-emerald-500";
  let nomePrio = "Baixa";
  if (p.includes("alta")) {
    corClasse = "bg-red-500";
    nomePrio = "Alta";
  } else if (p.includes("média") || p.includes("media")) {
    corClasse = "bg-amber-400";
    nomePrio = "Média";
  }

  return `<div class="flex items-center justify-center" title="Prioridade: ${nomePrio}">
                <span class="w-4 h-4 rounded-full ${corClasse} inline-block shadow-sm border border-white"></span>
            </div>`;
}

export function renderizarIconeStatus(status) {
  const s = String(status || "")
    .trim()
    .toLowerCase();
  if (s.includes("pausado"))
    return '<span title="Pausado" class="w-5 h-5 rounded-full bg-slate-500 inline-flex items-center justify-center text-white text-[11px] shadow-sm"><i class="fa-solid fa-pause"></i></span>';
  if (s.includes("cancelado"))
    return '<span title="Cancelado" class="w-5 h-5 rounded-full bg-red-600 inline-flex items-center justify-center text-white text-[10px] font-bold shadow-sm">X</span>';
  if (s.includes("concluído") || s.includes("concluido"))
    return '<span title="Concluído" class="w-5 h-5 rounded-full bg-emerald-600 inline-flex items-center justify-center text-white text-[10px] font-bold shadow-sm">✓</span>';
  return '<span title="Em Andamento" class="w-5 h-5 rounded-full bg-blue-500 inline-flex items-center justify-center text-white text-[10px] shadow-sm"><i class="fa-solid fa-spinner"></i></span>';
}

export function formatarData(dataStr) {
  if (typeof dataStr !== "string" || !dataStr) return "-";
  const data = dataStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    const d = new Date(data + "T12:00:00");
    if (
      isNaN(d.getTime()) ||
      d.getFullYear() !== Number(data.slice(0, 4)) ||
      d.getMonth() + 1 !== Number(data.slice(5, 7)) ||
      d.getDate() !== Number(data.slice(8, 10))
    )
      return "-";
    return d.toLocaleDateString("pt-BR");
  }
  if (!/^\d{4}-\d{2}-\d{2}T/.test(data)) return "-";
  const d = new Date(data);
  return isNaN(d.getTime())
    ? "-"
    : d.toLocaleDateString("pt-BR", { timeZone: "America/Recife" });
}

export function obterClasseCorCard(valor) {
  return prgdState.CORES_CARD_DEMANDA.some((cor) => cor.id === valor)
    ? valor
    : "bg-white border-slate-200 text-slate-900";
}

export function calcularInfoSemana(dataStr) {
  if (!dataStr) return { diaSemana: "", badgeOutraSemana: false };
  try {
    const parts = dataStr.split("-");
    if (parts.length !== 3) return { diaSemana: "", badgeOutraSemana: false };
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    if (isNaN(d.getTime())) return { diaSemana: "", badgeOutraSemana: false };

    const jsDay = d.getDay();
    const mapDias = {
      1: "segunda",
      2: "terca",
      3: "quarta",
      4: "quinta",
      5: "sexta",
    };
    const diaSemana = mapDias[jsDay] || "";

    const agora = new Date();
    const onejan = new Date(d.getFullYear(), 0, 1);
    const weekTarget = Math.ceil(
      ((d - onejan) / 86400000 + onejan.getDay() + 1) / 7,
    );
    const onejanAgora = new Date(agora.getFullYear(), 0, 1);
    const weekAgora = Math.ceil(
      ((agora - onejanAgora) / 86400000 + onejanAgora.getDay() + 1) / 7,
    );

    const outraSemana =
      weekTarget !== weekAgora || d.getFullYear() !== agora.getFullYear();

    return { diaSemana, badgeOutraSemana: outraSemana };
  } catch (e) {
    return { diaSemana: "", badgeOutraSemana: false };
  }
}

export function normalizarUrl(url) {
  if (!url) return "";
  const s = String(url).trim();
  if (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("data:")
  )
    return s;
  return "";
}

export function renderAuditInfo(item) {
  const modificado =
    item.atualizadoEm || item.criadoEm
      ? formatarDataExibicao(item.atualizadoEm || item.criadoEm)
      : "Não informado";
  const autor = item.editadoPor || item.criadoPor || "Sistema";
  return {
    dataHtml: `<span class="text-[11px] font-semibold text-slate-700">${modificado}</span>`,
    autorHtml: `<span class="text-[10px] font-medium text-slate-500 block">${identificacaoUsuario({ nome: autor, uid: item.editadoPor ? item.editadoPorUid : item.criadoPorUid })}</span>`,
  };
}

export function esc(v) {
  return String(v ?? "").replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[m],
  );
}
