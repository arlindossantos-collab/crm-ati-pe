const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  { spawnSync } = require("node:child_process");
const fixture = require("./fixtures/migration.valid.json");
test("auditoria preserva payload tipado, IDs, subcoleção privada e inteiros grandes", async () => {
  const { auditExport, validValue } = await import(
    "../scripts/migration/audit-export.mjs"
  );
  const before = JSON.stringify(fixture),
    r = auditExport(fixture);
  assert.equal(r.valid, true);
  assert.equal(r.readyForStaging, true);
  assert.equal(r.documents, 8);
  assert.equal(r.privateProfiles, 1);
  assert.equal(r.institutionalEnrollments, 1);
  assert.equal(validValue({ integerValue: "9007199254740993" }), true);
  assert.equal(validValue({ integerValue: "9223372036854775808" }), false);
  assert.equal(JSON.stringify(fixture), before);
});
test("auditoria recusa caminhos duplicados, payload sem tipo e tipos inválidos", async () => {
  const { auditExport, validValue } = await import(
    "../scripts/migration/audit-export.mjs"
  );
  for (const value of [
    { integerValue: 2 },
    { stringValue: 2 },
    { booleanValue: "true" },
    { mapValue: { fields: { bad: { unknown: 1 } } } },
    { arrayValue: { invalid: 1 } },
    { geoPointValue: { latitude: 91, longitude: 0 } },
    { timestampValue: "2026-02-30T12:00:00Z" },
    { timestampValue: "0000-01-01T12:00:00Z" },
  ])
    assert.equal(validValue(value), false);
  assert.equal(
    validValue({ timestampValue: "2024-02-29T12:00:00.123456789-03:00" }),
    true,
  );
  const noTimestamp = structuredClone(fixture);
  delete noTimestamp.source.exportedAt;
  assert.equal(auditExport(noTimestamp).valid, false);
  const x = structuredClone(fixture);
  x.documents.push(x.documents[0]);
  x.documents[1].fields.nome = { value: "sem tipo" };
  x.documents.push({ path: "../secret", fields: {} });
  const r = auditExport(x);
  assert.equal(r.valid, false);
  assert.ok(r.issues.some((i) => i.code === "DUPLICATE_PATH"));
  assert.ok(r.issues.some((i) => i.code === "TYPED_FIELDS"));
  assert.ok(r.issues.some((i) => i.code === "DOCUMENT_PATH"));
});
test("referências ausentes e coleções desconhecidas bloqueiam staging sem inventar associação", async () => {
  const { auditExport } = await import("../scripts/migration/audit-export.mjs"),
    x = structuredClone(fixture);
  x.documents[1].fields.orgaoId = { stringValue: "CLI-antigo" };
  x.documents.push({ path: "desconhecida/z", fields: {} });
  const r = auditExport(x);
  assert.equal(r.valid, true);
  assert.equal(r.readyForStaging, false);
  assert.equal(r.unresolvedReferences, 1);
  assert.equal(r.unknownCollections, 1);
  assert.ok(!JSON.stringify(r).includes("CLI-antigo"));
});
test("CLI retorna apenas relatório agregado e não imprime valores pessoais", () => {
  const r = spawnSync(
    process.execPath,
    [
      "scripts/migration/audit-export.mjs",
      "--input",
      "tests/fixtures/migration.valid.json",
    ],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr);
  const report = JSON.parse(r.stdout);
  assert.equal(report.readyForStaging, true);
  assert.doesNotMatch(
    r.stdout,
    /Pessoa fictícia|Contato fictício|9007199254740993/,
  );
});
