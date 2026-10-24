// Responsabilidade: app/listeners-forms. Estado transitório compartilhado apenas em app/state.js.
import { prgdState } from "./state.js";
import { ehAdministrador } from "../modules/acessos/policies.js";
import { adicionarComHistorico } from "../modules/auditoria/index.js";
import { collection } from "../services/firebase.js";

export function bindFormEvents() {
  document
    .getElementById("btn-limpar-clientes")
    ?.addEventListener("click", () => {
      if (!ehAdministrador() || prgdState.exclusaoEmCurso) return;
      prgdState.exclusaoPendente = Object.freeze({
        colecao: "orgaos",
        id: "*",
        emLote: true,
        uid: prgdState.currentUser.uid,
        sessao: prgdState.versaoSessao,
      });
      document.getElementById("exclusao-descricao").textContent =
        "Excluir TODOS os clientes cadastrados. Cada remoção será registrada no histórico. Esta ação não pode ser desfeita.";
      document.getElementById("exclusao-senha").value = "";
      document.getElementById("exclusao-erro").textContent = "";
      document
        .getElementById("modal-confirmar-exclusao")
        .classList.remove("hidden");
      document.getElementById("exclusao-senha").focus?.();
    });
  document
    .getElementById("input-import-orgaos-csv")
    ?.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target.result;
        const linhas = text.split(/\r\n|\n/).filter(Boolean);
        if (linhas.length < 2) {
          alert("Arquivo CSV inválido ou vazio.");
          return;
        }

        let importados = 0;
        const agora = new Date().toISOString();
        const autor =
          prgdState.currentUser?.nome ||
          prgdState.currentUser?.email ||
          "Sistema";

        for (let i = 1; i < linhas.length; i++) {
          const cols = linhas[i]
            .split(",")
            .map((s) => s.trim().replace(/^"|"$/g, ""));
          if (cols.length < 2) continue;

          const obj = {
            id: "CSV-" + Date.now() + "-" + i,
            nome: cols[0] || "",
            sigla: cols[1] || "",
            telefoneFixo: cols[2] || "",
            gestorOrgao: cols[3] || "",
            emailGestorOrgao: cols[4] || "",
            telGestorOrgao: cols[5] || "",
            situacaoContato: cols[6] || "Validado",
            gestorModalidadeSelecionada: "Órgão",
            criadoEm: agora,
            atualizadoEm: agora,
            criadoPor: autor,
            criadoPorUid: prgdState.currentUser?.uid || "",
            editadoPorUid: prgdState.currentUser?.uid || "",
            editadoPor: autor,
          };
          try {
            await adicionarComHistorico(
              collection(prgdState.db, "orgaos"),
              obj,
            );
            importados++;
          } catch (err) {}
        }
        alert(
          `Importação concluída! ${importados} clientes importados com sucesso.`,
        );
        e.target.value = "";
      };
      reader.readAsText(file, "UTF-8");
    });
}
