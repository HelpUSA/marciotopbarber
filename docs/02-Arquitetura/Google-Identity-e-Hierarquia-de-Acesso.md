
---
title: "Google Identity e Hierarquia de Acesso"
type: "architecture/security"
status: "active"
created: "2026-07-21"
updated: "2026-07-21"
tags:
  - "project/marciotopbarber"
  - "google-identity"
  - "rbac"
  - "security"
---

# Google Identity e Hierarquia de Acesso

## Fluxo de autenticação

1. O frontend renderiza o botão oficial do Google Identity Services.
2. O Google retorna uma credencial ID token.
3. O frontend envia a credencial para `POST /api/v1/auth/google`.
4. O backend valida assinatura, emissor, expiração e audiência.
5. O backend exige `sub`, e-mail e `email_verified=true`.
6. A identidade externa é vinculada a um usuário local.
7. A aplicação cria sua própria sessão opaca e revogável.
8. O frontend armazena somente o token temporário da aplicação.

O ID token do Google não é usado como token de autorização das
rotas da aplicação.

## Superadministrador da plataforma

O e-mail normalizado `helpus.ecommerce@gmail.com` recebe o papel
`platform-superadmin`.

Este papel possui todas as permissões ativas e é reservado à
administração global da plataforma.

A concessão ocorre somente depois da validação criptográfica do
ID token do Google e da confirmação de e-mail verificado.

## Novos usuários

Uma nova conta Google que não seja o superadministrador recebe
o papel `customer`.

Contas existentes são vinculadas pelo identificador estável
`sub` ou, no primeiro vínculo, pelo e-mail verificado.

## Papéis

| Papel | Escopo | Situação |
|---|---|---|
| `platform-superadmin` | Toda a plataforma | Ativo |
| `barbershop-owner` | Própria barbearia | Inativo até multi-tenancy |
| `barbershop-administrator` | Própria barbearia | Inativo até multi-tenancy |
| `operator` | Operação da própria barbearia | Inativo até multi-tenancy |
| `employee` | Agenda e comissão próprias | Inativo até multi-tenancy |
| `customer` | Portal e dados próprios | Ativo |

## Segurança

- o Client ID é público e pode existir no frontend;
- nenhum Client Secret é enviado ao navegador;
- o backend valida a audiência com o mesmo Client ID;
- somente e-mails verificados são aceitos;
- o identificador principal do provedor é o `sub`;
- tentativas inválidas retornam HTTP 401;
- criação, vínculo e login são auditados;
- a conta local pode ser suspensa;
- o usuário não pode elevar o próprio papel.

## Variáveis

Frontend:

```env
VITE_GOOGLE_CLIENT_ID=
```

Backend:

```env
GOOGLE_CLIENT_ID=
PLATFORM_SUPERADMIN_EMAIL=helpus.ecommerce@gmail.com
GOOGLE_AUTO_PROVISION_CUSTOMERS=true
```

## Origens autorizadas no Google Cloud

- `https://marciotopbarber.helpusbr.com`
- `http://localhost:5173`

## Compatibilidade

O login por senha permanece temporariamente como contingência.
Ele poderá ser removido depois que o login Google, o backend e
o banco de produção forem validados.
