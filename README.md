# PRGD v21.0 — Cloud Multidispositivo

## O que foi corrigido

1. **Usuários agora existem de verdade no Firebase Authentication**
   - O cadastro feito pelo módulo Usuários cria a conta no Firebase Authentication.
   - Também cria o perfil correspondente em `usuarios/{uid}` no Firestore.
   - O usuário pode entrar de outro computador, outro navegador ou outro dispositivo usando o mesmo e-mail e senha.

2. **Perfil separado da autenticação**
   - Firebase Authentication = identidade/senha.
   - Firestore `usuarios/{uid}` = nome, órgão, perfil, grupos e módulos.
   - Isso elimina a dependência de dados gravados apenas no navegador.

3. **Permissões por grupo**
   - Usuários possuem `grupos`.
   - Registros podem possuir `gruposPermitidos`, `orgaosPermitidos` e `restrito`.
   - Administrador visualiza tudo.
   - Usuários comuns visualizam registros públicos, registros sem restrição e registros pertinentes ao seu órgão/grupo.

4. **Redefinição de senha**
   - O administrador não altera a senha de outro usuário diretamente pelo navegador.
   - A aplicação envia o fluxo oficial de redefinição do Firebase por e-mail.

5. **Fornecedores muito mais detalhados**
   - O que faz
   - Produto/serviço principal
   - Outros produtos/serviços
   - Valor/faixa de referência
   - Modelo comercial
   - Contato principal e cargo
   - Telefone e e-mail
   - Site
   - LinkedIn, Instagram e outras redes
   - Eventos já realizados/participados
   - Experiência/referências
   - Certificações
   - Observações

6. **Locais de eventos com ficha técnica**
   - Capacidade
   - Metragem
   - Valor
   - Endereço
   - Contatos
   - Estacionamento
   - Climatização
   - Som/PA
   - Cadeiras e mesas
   - Palco
   - Iluminação cênica
   - Cozinha
   - Cantina/alimentação
   - Stands
   - Acessibilidade
   - Internet/Wi-Fi
   - Gerador/energia reserva
   - Banheiros
   - Segurança
   - Carga e descarga
   - Montagem/desmontagem
   - Restrições e observações

## Arquivos

- `index.html` — aplicação
- `firebase.json` — configuração Hosting/Firestore
- `firestore.rules` — regras de segurança

## Publicação

Na pasta do projeto:

```bash
firebase login
firebase use prgd-ati-pe
firebase deploy --only hosting,firestore:rules
```

## Importante antes do primeiro uso

No Firebase Console:

1. Authentication → Sign-in method → habilite **E-mail/Senha**.
2. Confirme que o usuário administrador já existe no Authentication.
3. No Firestore, crie o documento `usuarios/{UID_DO_ADMINISTRADOR}` com:
   - `email`
   - `nome`
   - `perfil: "admin"`
   - `orgao`
   - `grupos: ["ADMIN"]`
   - `modulosPermitidos`: lista dos módulos

O UID deve ser o UID mostrado no Firebase Authentication. Não use o e-mail como ID para o novo modelo.

## Observação sobre a versão anterior

A versão anterior gravava um cadastro em `usuarios` no Firestore, mas o botão "Novo Usuário" não criava a conta correspondente no Firebase Authentication. Por isso um usuário novo podia aparecer na tabela e, mesmo assim, não conseguir autenticar.

Também havia um fallback local com senha fixa na aplicação. Essa versão remove essa prática: a autenticação passa a depender exclusivamente do Firebase Authentication.
