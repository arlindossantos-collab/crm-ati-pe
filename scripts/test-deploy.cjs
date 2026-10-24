// Ensaio local e descartável. Não usa Docker remoto nem publica portas/serviços.
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict"),
  { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, ".."),
  env = { ...process.env };
for (const key of [
  "DOCKER_HOST",
  "DOCKER_CONTEXT",
  "DOCKER_TLS",
  "DOCKER_TLS_VERIFY",
  "DOCKER_CERT_PATH",
])
  delete env[key];
function docker(args, { input, allowFailure = false } = {}) {
  const r = spawnSync(
    "docker",
    ["--host=unix:///var/run/docker.sock", ...args],
    { encoding: "utf8", env, input },
  );
  if (!allowFailure && r.status !== 0)
    throw Error(r.stderr || "Docker local indisponível.");
  return r;
}
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
(async () => {
  docker(["info", "--format", "{{.ServerVersion}}"]);
  const database = "prgd-staging-test-" + process.pid;
  let started = false;
  try {
    docker([
      "run",
      "--rm",
      "--name",
      database,
      "--network",
      "none",
      "-e",
      "POSTGRES_HOST_AUTH_METHOD=trust",
      "-d",
      "postgres:18",
    ]);
    started = true;
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (
        docker(
          [
            "exec",
            database,
            "sh",
            "-c",
            'test "$(cat /proc/1/comm)" = postgres && pg_isready -U postgres',
          ],
          { allowFailure: true },
        ).status === 0
      ) {
        ready = true;
        break;
      }
      await delay(100);
    }
    assert.ok(ready, "PostgreSQL não ficou pronto.");
    const schema = fs.readFileSync(
      path.join(root, "deploy/postgres/staging.sql"),
      "utf8",
    );
    for (let i = 0; i < 2; i++)
      docker(
        [
          "exec",
          "-i",
          database,
          "psql",
          "-U",
          "postgres",
          "-v",
          "ON_ERROR_STOP=1",
        ],
        { input: schema },
      );
    const verify = `BEGIN;
INSERT INTO prgd_staging.import_runs(import_id,source_project,source_sha256,exported_at,expected_documents)
VALUES('00000000-0000-0000-0000-000000000001','demo-prgd-usuarios',repeat('a',64),'2026-10-24T00:00:00Z',1);
INSERT INTO prgd_staging.documents(import_id,document_path,fields_typed,content_sha256)
VALUES('00000000-0000-0000-0000-000000000001','usuarios/ficticio','{"precisao":{"integerValue":"9007199254740993"}}',repeat('b',64));
DO $$ BEGIN
IF (SELECT fields_typed->'precisao'->>'integerValue' FROM prgd_staging.documents LIMIT 1) <> '9007199254740993' THEN RAISE EXCEPTION 'Precisão alterada'; END IF;
BEGIN INSERT INTO prgd_staging.documents(import_id,document_path,fields_typed,content_sha256)
VALUES('00000000-0000-0000-0000-000000000001','usuarios/ficticio','{}',repeat('c',64)); RAISE EXCEPTION 'Duplicidade aceita'; EXCEPTION WHEN unique_violation THEN NULL; END;
BEGIN INSERT INTO prgd_staging.documents(import_id,document_path,fields_typed,content_sha256)
VALUES('00000000-0000-0000-0000-000000000001','../invalido','{}',repeat('c',64)); RAISE EXCEPTION 'Caminho inválido aceito'; EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
ROLLBACK;`;
    docker(
      [
        "exec",
        "-i",
        database,
        "psql",
        "-U",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
      ],
      { input: verify },
    );
    console.log(
      "PostgreSQL 18: staging idempotente, precisão, duplicidade, caminhos e rollback aprovados.",
    );
  } finally {
    if (started) docker(["rm", "--force", database]);
  }
  for (const [name, prefix, mount] of [
    ["root", "/", "/srv/prgd/current"],
    ["subpath", "/prgd/", "/srv/prgd/www/prgd"],
  ]) {
    const container = "prgd-nginx-" + name + "-" + process.pid;
    let running = false;
    try {
      docker([
        "run",
        "--rm",
        "--name",
        container,
        "--network",
        "none",
        "--mount",
        `type=bind,src=${path.join(root, "deploy/nginx", name + ".conf")},dst=/etc/nginx/conf.d/default.conf,readonly`,
        "--mount",
        `type=bind,src=${path.join(root, "dist")},dst=${mount},readonly`,
        "-d",
        "nginx:stable-alpine",
      ]);
      running = true;
      docker(["exec", container, "nginx", "-t"]);
      let response = "";
      for (let i = 0; i < 50; i++) {
        const r = docker(
          [
            "exec",
            container,
            "wget",
            "-Y",
            "off",
            "-qO-",
            "http://127.0.0.1:8080" + prefix,
          ],
          { allowFailure: true },
        );
        if (r.status === 0) {
          response = r.stdout;
          break;
        }
        await delay(100);
      }
      assert.match(response, /src="\.\/assets\/app.js"/);
      docker([
        "exec",
        container,
        "wget",
        "-Y",
        "off",
        "-qO-",
        "http://127.0.0.1:8080" + prefix + "assets/app.js",
      ]);
      const headers = docker([
        "exec",
        container,
        "wget",
        "-Y",
        "off",
        "-S",
        "--spider",
        "http://127.0.0.1:8080" + prefix + "assets/app.js",
      ]).stderr;
      assert.match(headers, /Content-Type: (?:application|text)\/javascript/i);
      assert.match(headers, /Cache-Control: no-cache/i);
      assert.match(headers, /X-Content-Type-Options: nosniff/i);
      assert.match(
        headers,
        /Referrer-Policy: strict-origin-when-cross-origin/i,
      );
      assert.notEqual(
        docker(
          [
            "exec",
            container,
            "wget",
            "-Y",
            "off",
            "-qO-",
            "http://127.0.0.1:8080" + prefix + "arquivo-inexistente",
          ],
          { allowFailure: true },
        ).status,
        0,
      );
      console.log(
        "Nginx " + name + ": sintaxe, HTML, módulos relativos e 404 aprovados.",
      );
    } finally {
      if (running) docker(["rm", "--force", container]);
    }
  }
})().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
