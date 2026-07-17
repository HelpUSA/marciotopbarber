---
title: "Painel Administrativo React"
type: "architecture/frontend"
status: "active"
created: "2026-07-17"
updated: "2026-07-17"
tags:
  - "project/marciotopbarber"
  - "react"
  - "administration"
  - "authentication"
  - "rbac"
---

# Painel Administrativo React

## Rotas

- `/admin/login`: autenticação administrativa;
- `/admin`: visão geral protegida;
- `/admin/*`: módulos administrativos.

## Autenticação

O painel utiliza:

- `POST /api/v1/auth/login`;
- `GET /api/v1/auth/me`;
- `POST /api/v1/auth/logout`.

O token é enviado como `Authorization: Bearer <token>`.

## Sessão

O token e sua expiração ficam em `sessionStorage`.

A senha não é armazenada. O painel não utiliza `localStorage` para a sessão administrativa.

A sessão é revalidada no backend ao restaurar a página. Respostas HTTP 401 removem a sessão local.

## Autorização

A área administrativa exige a permissão `admin.access`.

## Interface

O painel possui:

- login responsivo;
- barra lateral;
- menu móvel;
- identificação do usuário;
- logout;
- dashboard de papéis e permissões;
- acesso ao site público.

## Vercel

As rotas `/admin` e `/admin/:path*` são reescritas para `index.html`.
