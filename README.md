PRGD v19.2.1 — preserva a estrutura da aplicação original e adiciona Firebase Authentication.

IMPORTANTE: o login usa Firebase Authentication. Os dados compartilhados usam Firestore. Sem regras/coleções configuradas no projeto, a aplicação mantém os dados de demonstração localmente, mas não há sincronização compartilhada.

Para produção: habilite Authentication > Email/Password, publique firestore.rules e crie o perfil do primeiro administrador em usuarios/{UID}.
