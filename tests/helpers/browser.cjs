const fs = require("node:fs"),
  path = require("node:path");
const { root, readIndexHtml } = require("../../scripts/lib/source.cjs");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};
function serveProjectAsset(req, res) {
  let name;
  try {
    name = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  if (name === "/" || name === "/index.html") {
    res.writeHead(200, { "Content-Type": types[".html"] });
    res.end(readIndexHtml());
    return;
  }
  let file;
  if (name.startsWith("/src/")) file = path.resolve(root, "." + name);
  else if (name === "/assets/chart.js")
    file = path.join(root, "node_modules/chart.js/dist/chart.umd.js");
  else if (name.startsWith("/assets/fontawesome/"))
    file = path.resolve(
      root,
      "node_modules/@fortawesome/fontawesome-free",
      name.slice("/assets/fontawesome/".length),
    );
  else if (name === "/assets/tailwind.css") {
    res.writeHead(200, { "Content-Type": types[".css"] });
    res.end(
      fs.readFileSync(
        process.env.PRGD_TEST_CSS ||
          path.join(root, "dist/assets/tailwind.css"),
      ),
    );
    return;
  } else file = path.resolve(root, "public", "." + name);
  const allowed = [
    path.join(root, "src") + path.sep,
    path.join(root, "public") + path.sep,
    path.join(root, "node_modules") + path.sep,
  ];
  if (!allowed.some((dir) => file.startsWith(dir))) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(file, (err, data) => {
    res.writeHead(err ? 404 : 200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
    });
    res.end(err ? "Não encontrado" : data);
  });
}
module.exports = { serveProjectAsset };
