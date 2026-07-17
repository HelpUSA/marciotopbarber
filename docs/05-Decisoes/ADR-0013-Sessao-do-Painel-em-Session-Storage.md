---
title: "ADR-0013 - Sessão do Painel em Session Storage"
type: "decision/adr"
status: "accepted"
created: "2026-07-17"
updated: "2026-07-17"
---

# ADR-0013 — Sessão do Painel em Session Storage

## Contexto

O backend fornece tokens opacos e revogáveis para as sessões administrativas.

## Decisão

Armazenar temporariamente o token e sua expiração em `sessionStorage`.

Não utilizar `localStorage` para a sessão administrativa.

## Regras

- a senha não é armazenada;
- o token é validado em `/api/v1/auth/me`;
- respostas HTTP 401 removem a sessão local;
- o logout solicita revogação ao backend;
- a sessão é isolada por aba.

## Consequências

O token continua acessível ao JavaScript da mesma origem, portanto a prevenção de XSS permanece obrigatória.

## Status

Aceito.
