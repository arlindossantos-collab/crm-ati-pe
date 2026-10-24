// Validação offline. Nunca conecta ao Firebase/LDAP/PostgreSQL nem exibe valores pessoais.
import fs from "node:fs";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
const known = new Set([
  "usuarios",
  "identidadesUsuarios",
  "orgaos",
  "setores",
  "colaboradores",
  "contatosColaboradores",
  "eventos",
  "inscricoes",
  "historicoAlteracoes",
  "grupos",
  "demandas",
  "locais",
  "bases",
  "fornecedores",
]);
const types = new Set([
  "nullValue",
  "booleanValue",
  "integerValue",
  "doubleValue",
  "timestampValue",
  "stringValue",
  "bytesValue",
  "referenceValue",
  "geoPointValue",
  "arrayValue",
  "mapValue",
]);
const object = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
function validTimestamp(value) {
  if (typeof value !== "string") return false;
  const match =
    /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(?:\.\d{1,9})?(Z|([+-])(\d\d):(\d\d))$/.exec(
      value,
    );
  if (!match) return false;
  const [, year, month, day, hour, minute, second] = match;
  const lastDay = new Date(0);
  lastDay.setUTCFullYear(Number(year), Number(month), 0);
  return (
    Number(year) >= 1 &&
    Number(month) >= 1 &&
    Number(month) <= 12 &&
    Number(day) >= 1 &&
    Number(day) <= lastDay.getUTCDate() &&
    Number(hour) <= 23 &&
    Number(minute) <= 59 &&
    Number(second) <= 59 &&
    (!match[8] || (Number(match[9]) <= 23 && Number(match[10]) <= 59)) &&
    Number.isFinite(Date.parse(value))
  );
}
export function validValue(v, depth = 0) {
  if (!object(v) || depth > 40 || Object.keys(v).length !== 1) return false;
  const kind = Object.keys(v)[0],
    x = v[kind];
  if (!types.has(kind)) return false;
  switch (kind) {
    case "nullValue":
      return x === null || x === "NULL_VALUE";
    case "booleanValue":
      return typeof x === "boolean";
    case "integerValue":
      try {
        return (
          typeof x === "string" &&
          /^-?\d+$/.test(x) &&
          BigInt(x) >= -(2n ** 63n) &&
          BigInt(x) < 2n ** 63n
        );
      } catch {
        return false;
      }
    case "doubleValue":
      return (
        (typeof x === "number" && Number.isFinite(x)) ||
        ["NaN", "Infinity", "-Infinity"].includes(x)
      );
    case "timestampValue":
      return validTimestamp(x);
    case "stringValue":
      return typeof x === "string";
    case "bytesValue":
      return (
        typeof x === "string" &&
        /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
          x,
        )
      );
    case "referenceValue":
      return (
        typeof x === "string" &&
        /^projects\/[^/]+\/databases\/[^/]+\/documents\/.+/.test(x)
      );
    case "geoPointValue":
      return (
        object(x) &&
        Number.isFinite(x.latitude) &&
        Math.abs(x.latitude) <= 90 &&
        Number.isFinite(x.longitude) &&
        Math.abs(x.longitude) <= 180
      );
    case "arrayValue":
      return (
        object(x) &&
        Object.keys(x).every((k) => k === "values") &&
        (x.values === undefined ||
          (Array.isArray(x.values) &&
            x.values.every((v) => validValue(v, depth + 1))))
      );
    case "mapValue":
      return (
        object(x) &&
        Object.keys(x).every((k) => k === "fields") &&
        (x.fields === undefined ||
          (object(x.fields) &&
            Object.values(x.fields).every((v) => validValue(v, depth + 1))))
      );
  }
}
export function auditExport(payload) {
  const issues = [],
    counts = {},
    seen = new Set(),
    byCollection = new Map();
  const issue = (code, documentIndex) =>
    issues.push({
      code,
      ...(documentIndex === undefined ? {} : { documentIndex }),
    });
  if (
    !object(payload) ||
    payload.format !== "prgd-export-v1" ||
    !object(payload.source) ||
    typeof payload.source.projectId !== "string" ||
    !payload.source.projectId.trim() ||
    !validTimestamp(payload.source.exportedAt) ||
    !Array.isArray(payload.documents)
  )
    return {
      valid: false,
      readyForStaging: false,
      documents: 0,
      counts: {},
      issues: [{ code: "EXPORT_FORMAT" }],
    };
  let unknownCollections = 0,
    privateProfiles = 0;
  payload.documents.forEach((doc, index) => {
    if (
      !object(doc) ||
      typeof doc.path !== "string" ||
      doc.path.startsWith("/") ||
      doc.path.endsWith("/") ||
      doc.path.includes("//") ||
      doc.path.includes("\0") ||
      doc.path.split("/").length % 2 !== 0 ||
      doc.path.split("/").some((p) => p === "." || p === ".." || !p)
    ) {
      issue("DOCUMENT_PATH", index);
      return;
    }
    if (seen.has(doc.path)) issue("DUPLICATE_PATH", index);
    seen.add(doc.path);
    if (
      !object(doc.fields) ||
      !Object.values(doc.fields).every((v) => validValue(v))
    )
      issue("TYPED_FIELDS", index);
    const parts = doc.path.split("/"),
      collection = parts[0];
    if (known.has(collection))
      counts[collection] = (counts[collection] || 0) + 1;
    else unknownCollections++;
    if (
      parts.length === 4 &&
      collection === "usuarios" &&
      parts[2] === "privado"
    )
      privateProfiles++;
    if (parts.length === 2) {
      if (!byCollection.has(collection))
        byCollection.set(collection, new Set());
      byCollection.get(collection).add(parts[1]);
    }
  });
  const value = (fields, name) =>
    typeof fields?.[name]?.stringValue === "string"
      ? fields[name].stringValue
      : "";
  const refs = {
    setores: { orgaoId: "orgaos" },
    colaboradores: {
      orgaoId: "orgaos",
      setorId: "setores",
      usuarioUid: "usuarios",
    },
    contatosColaboradores: { orgaoId: "orgaos", setorId: "setores" },
    usuarios: { colaboradorId: "colaboradores" },
    inscricoes: {
      eventId: "eventos",
      participanteId: "colaboradores",
      orgaoId: "orgaos",
      setorId: "setores",
    },
    eventos: { localId: "locais" },
    identidadesUsuarios: { uid: "usuarios" },
  };
  let unresolvedReferences = 0,
    institutionalEnrollments = 0,
    legacyEnrollments = 0;
  payload.documents.forEach((doc, index) => {
    if (typeof doc?.path !== "string" || !object(doc.fields)) return;
    const parts = doc.path.split("/");
    if (parts.length !== 2) return;
    for (const [field, target] of Object.entries(refs[parts[0]] || {})) {
      if (
        doc.fields[field] &&
        typeof doc.fields[field].stringValue !== "string"
      ) {
        issue("REFERENCE_TYPE", index);
        continue;
      }
      const reference = value(doc.fields, field);
      if (reference && !byCollection.get(target)?.has(reference)) {
        unresolvedReferences++;
        issue("REFERENCE_REQUIRES_REVIEW", index);
      }
    }
    if (parts[0] === "inscricoes") {
      if (value(doc.fields, "modeloInscricao") === "institucional-v1")
        institutionalEnrollments++;
      else legacyEnrollments++;
    }
  });
  const invalid = issues.some((i) => i.code !== "REFERENCE_REQUIRES_REVIEW");
  return {
    valid: !invalid,
    readyForStaging:
      !invalid && unresolvedReferences === 0 && unknownCollections === 0,
    documents: payload.documents.length,
    counts,
    unknownCollections,
    privateProfiles,
    unresolvedReferences,
    institutionalEnrollments,
    legacyEnrollments,
    issues,
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const index = process.argv.indexOf("--input");
    if (index < 0 || !process.argv[index + 1]) throw Error("INPUT");
    if (fs.statSync(process.argv[index + 1]).size > 64 * 1024 * 1024)
      throw Error("LIMIT");
    const bytes = fs.readFileSync(process.argv[index + 1]),
      payload = JSON.parse(bytes.toString("utf8"));
    const report = {
      ...auditExport(payload),
      fileSha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    };
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    process.exitCode = report.readyForStaging ? 0 : report.valid ? 3 : 2;
  } catch {
    process.stderr.write(
      "Não foi possível validar a exportação. Confira --input e o formato JSON documentado.\n",
    );
    process.exitCode = 2;
  }
}
