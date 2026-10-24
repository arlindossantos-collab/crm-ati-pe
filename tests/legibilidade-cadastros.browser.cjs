const { chromium } = require("playwright");
const fs = require("node:fs"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const stub = fs
  .readFileSync("tests/seguranca-sessao.browser.cjs", "utf8")
  .split("const stub=String.raw`")[1]
  .split("`;\n(async()=>")[0];
const admin = {
  id: "admin",
  uid: "admin",
  nome: "Administrador fictício",
  email: "admin@example.invalid",
  perfil: "admin",
  tipoUsuario: "interno",
  ativo: true,
};
const fixture = {
  me: admin,
  usuarios: [admin],
  fornecedores: [
    {
      id: "f1",
      nome: "Soluções São José",
      razaoSocial: "Soluções São José Ltda.",
      produtoServicoPrincipal: "Integração de órgãos",
      ativo: false,
      valorContrato: 0,
      criadoEm: { seconds: 1792843200, nanoseconds: 0 },
      criadoPor: "José",
      criadoPorUid: "UID_AUTOR_INTERNO_123",
      contatos: [{ nome: "Conceição", telefone: "(81) 99999-0000" }],
      campoAdicional: "Informação adicional",
    },
  ],
  bases: [
    {
      id: "b1",
      categoria: "Tipos de evento",
      sigla: "OFI",
      nome: "Oficina de integração",
      detalhes: { descricao: "Ação e participação" },
    },
  ],
  orgaos: [
    {
      id: "o1",
      nome: "Secretaria de Administração",
      sigla: "SAD",
      ativo: true,
    },
  ],
  grupos: [{ id: "g1", nome: "Gestores convidados" }],
  eventos: [
    {
      id: "e1",
      titulo: "Formação e integração",
      dataInicio: "2099-02-10",
      horaInicio: "09:00",
      status: "Confirmado",
      tipoEvento: "Oficina",
      eventoPublico: true,
      gruposPermitidos: ["g1", "GRUPO_ANTERIOR_HASH_123"],
      criadoEm: { seconds: 1792843200, nanoseconds: 0 },
      criadoPor: "José",
      historicoAcoes: [
        {
          acao: "Revisão",
          descricao: "Inscrição confirmada",
          criadoEm: { seconds: 1792843200, nanoseconds: 0 },
        },
      ],
    },
  ],
  locais: [
    {
      id: "l1",
      nome: "Auditório São José",
      tipoLocacao: "gratuito",
      capacidade: 40,
    },
  ],
  historicoAlteracoes: [
    {
      id: "h1",
      autorNome: "Conceição",
      autorUid: "UID_AUTOR_INTERNO_123",
      registroId: "f1",
      registroNome: "Soluções São José",
      colecao: "fornecedores",
      acao: "editar",
      campos: ["produtoServicoPrincipal", "atualizadoEm"],
      criadoEm: { seconds: 1792843200, nanoseconds: 0 },
    },
  ],
};
const forbidden =
  /\[object Object\]|Timestamp\(|Invalid Date|undefined|produtoServicoPrincipal|gruposPermitidos|criadoPorUid|Ã§|Ã£|�/;
(async () => {
  fs.mkdirSync("test-results", { recursive: true });
  const server = http.createServer(
    require("./helpers/browser.cjs").serveProjectAsset,
  );
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const errors = [],
    external = [];
  let browser;
  try {
    browser = await chromium.launch();
    const context = await browser.newContext({
        locale: "pt-BR",
        viewport: { width: 1440, height: 1100 },
      }),
      page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("dialog", (d) => d.accept());
    await page.addInitScript((f) => {
      globalThis.__fixture = f;
      globalThis.__transactions = [];
      globalThis.__refreshes = 0;
    }, fixture);
    await page.route("**/src/services/firebase.js", (r) =>
      r.fulfill({ contentType: "application/javascript", body: stub }),
    );
    await page.route("**/*", (r) => {
      if (
        !new URL(r.request().url()).hostname.match(/^(127\.0\.0\.1|localhost)$/)
      ) {
        external.push(r.request().url());
        return r.abort();
      }
      return r.fallback();
    });
    await page.goto("http://127.0.0.1:" + server.address().port);
    await page.locator("#main-content").waitFor({ state: "visible" });
    assert.equal(
      await page.locator("#user-name-display").isVisible(),
      true,
      "Identificação deve aparecer com a ordem real de CSS do site.",
    );
    const close = () =>
      page
        .getByRole("button", { name: "Fechar detalhes", exact: true })
        .click();
    await page.locator('[data-tab="fornecedores"]').click();
    await page.locator('[data-colecao="fornecedores"][data-id="f1"]').click();
    await page.screenshot({
      path: "test-results/legibilidade-fornecedor-desktop.png",
    });
    assert.doesNotMatch(
      await page.locator("#tabela-fornecedores").innerText(),
      /Invalid Date/,
    );
    let text = await page.locator("#detalhe-conteudo").innerText();
    assert.match(text, /Produto ou serviço principal/);
    assert.match(text, /Razão social/);
    assert.match(text, /Conceição/);
    assert.match(text, /24\/10\/2026/);
    assert.match(text, /Não/);
    assert.match(text, /Valor do contrato\s+0/);
    assert.doesNotMatch(text, forbidden);
    assert.doesNotMatch(text, /UID_AUTOR_INTERNO_123/);
    assert.equal(
      await page
        .locator("#edit-campos-dinamicos")
        .getByLabel("Razão social", { exact: true })
        .inputValue(),
      "Soluções São José Ltda.",
    );
    await page
      .locator("#edit-campos-dinamicos")
      .getByLabel("Razão social", { exact: true })
      .fill("Soluções São José atualizada");
    await page.locator("#btn-salvar-edicao").click();
    await page.locator("#modal-detalhes").waitFor({ state: "hidden" });
    let stored = await page.evaluate(
      () => globalThis.__fixture.fornecedores[0],
    );
    assert.equal(stored.razaoSocial, "Soluções São José atualizada");
    assert.equal(stored.ativo, false);
    assert.equal(stored.valorContrato, 0);
    assert.deepEqual(stored.criadoEm, fixture.fornecedores[0].criadoEm);
    assert.equal(stored.criadoPorUid, "UID_AUTOR_INTERNO_123");
    assert.deepEqual(stored.contatos, fixture.fornecedores[0].contatos);
    await page.locator('[data-tab="bases"]').click();
    await page.locator('[data-colecao="bases"][data-id="b1"]').click();
    assert.match(
      await page.locator("#detalhe-conteudo").innerText(),
      /Ação e participação/,
    );
    assert.doesNotMatch(
      await page.locator("#detalhe-conteudo").innerText(),
      forbidden,
    );
    await close();
    await page.locator('[data-tab="eventos"]').click();
    await page.locator('[data-colecao="eventos"][data-id="e1"]').click();
    text = await page.locator("#modal-detalhes").innerText();
    assert.doesNotMatch(text, forbidden);
    assert.doesNotMatch(text, /GRUPO_ANTERIOR_HASH_123/);
    assert.match(text, /Gestores convidados/);
    assert.match(text, /Grupo indisponível nesta consulta/);
    assert.match(text, /10\/02\/2099/);
    const groups = page.getByLabel("Grupos autorizados", { exact: true });
    assert.deepEqual(
      await groups.evaluate((el) =>
        Array.from(el.selectedOptions).map((o) => o.value),
      ),
      ["g1", "GRUPO_ANTERIOR_HASH_123"],
    );
    await page
      .locator('#form-edicao-admin [name="titulo"]')
      .fill("Formação e integração revisada");
    await page.locator("#btn-salvar-edicao").click();
    await page.locator("#modal-detalhes").waitFor({ state: "hidden" });
    stored = await page.evaluate(() => globalThis.__fixture.eventos[0]);
    assert.deepEqual(
      stored.gruposPermitidos,
      fixture.eventos[0].gruposPermitidos,
    );
    assert.deepEqual(stored.historicoAcoes, fixture.eventos[0].historicoAcoes);
    await page.locator("#btn-historico-alteracoes").click();
    await page
      .locator("#historico-registros tr")
      .filter({ hasText: "Soluções São José" })
      .first()
      .waitFor();
    text = await page.locator("#historico-registros").innerText();
    assert.match(text, /Produto ou serviço principal/);
    assert.doesNotMatch(
      text,
      /produtoServicoPrincipal|atualizadoEm|UID_AUTOR_INTERNO_123/,
    );
    await page.locator('[data-target="modal-historico-alteracoes"]').click();
    await page.locator('[data-tab="colaboradores"]').click();
    await page.locator('[data-colab-secao="acessos"]').click();
    await page.locator('[data-usuario-editar="admin"]').click();
    assert.doesNotMatch(
      await page.locator("#modal-detalhes").innerText(),
      /Identificador do cadastro: admin/,
    );
    await close();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-tab="fornecedores"]').click();
    await page.locator('[data-colecao="fornecedores"][data-id="f1"]').click();
    assert.doesNotMatch(
      await page.locator("#detalhe-conteudo").innerText(),
      forbidden,
    );
    const input = page
      .locator("#edit-campos-dinamicos")
      .getByLabel("Razão social", { exact: true });
    assert.ok(
      (await input.evaluate((el) =>
        parseFloat(getComputedStyle(el).fontSize),
      )) >= 16,
    );
    assert.ok(
      await page
        .locator("#modal-detalhes")
        .evaluate((el) => el.scrollWidth <= window.innerWidth),
    );
    await page.screenshot({
      path: "test-results/legibilidade-fornecedor-celular.png",
    });
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(
      "Legibilidade: cadastros, datas, rótulos, estruturas, referências, edição sem perda, histórico e celular aprovados. Firebase simulado.",
    );
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
