---
title: "ADR-0012 - Substituição da Chave Administrativa por RBAC"
type: "decision/adr"
status: "accepted"
created: "2026-07-17"
updated: "2026-07-17"
---

# ADR-0012 — Substituição da Chave Administrativa por RBAC

## Contexto

As primeiras rotas administrativas utilizavam uma chave compartilhada enviada pelo cabeçalho X-Admin-Key.

Esse mecanismo não identifica o operador, não oferece permissões granulares e dificulta revogação e auditoria.

## Decisão

Remover a chave compartilhada e exigir:

- usuário autenticado;
- sessão Bearer válida;
- conta ativa;
- permissão específica para cada operação.

## Permissões iniciais

- users.manage;
- employees.manage;
- scheduling.manage;
- ppointments.manage.

## Consequências

- toda operação administrativa possui identidade do executor;
- o acesso pode ser revogado pela conta ou sessão;
- funcionários podem receber somente as permissões necessárias;
- o painel React deverá guardar e enviar a sessão de forma controlada;
- a variável ADMIN_API_KEY deixa de existir.

## Status

Aceito.
