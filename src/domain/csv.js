// Responsabilidade: domain/csv. Estado transitório compartilhado apenas em app/state.js.

export function dataInscricaoRelatorio(valor) {
  if (valor && typeof valor.toDate === "function") {
    const data = valor.toDate();
    return data instanceof Date && Number.isFinite(data.getTime())
      ? data.toISOString()
      : "";
  }
  if (valor && typeof valor.seconds === "number") {
    const data = new Date(valor.seconds * 1000);
    return Number.isFinite(data.getTime()) ? data.toISOString() : "";
  }
  return typeof valor === "string" ? valor : "";
}

export function campoCsvRelatorio(valor) {
  const texto = String(valor ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim();
  const seguro = /^[=+\-@]/.test(texto) ? "'" + texto : texto;
  return '"' + seguro.replace(/"/g, '""') + '"';
}
