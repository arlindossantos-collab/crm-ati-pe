const { build } = require("../build.cjs");
build({ mode: "demo", outdir: ".firebase/homologacao" })
  .then(() =>
    console.log("Homologação local gerada; configuração de produção excluída."),
  )
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
