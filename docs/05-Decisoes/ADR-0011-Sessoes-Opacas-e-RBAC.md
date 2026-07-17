---
title: "ADR-0011 - Sessões Opacas e RBAC"
type: "decision/adr"
status: "accepted"
created: "2026-07-17"
updated: "2026-07-17"
---

# ADR-0011 — Sessões Opacas e RBAC

## Contexto

O sistema legado armazenava credenciais por mecanismos inadequados e utilizava controles de acesso acoplados às páginas PHP.

A primeira API administrativa moderna utilizou uma chave compartilhada temporária.

## Decisão

Adotar:

- senha derivada com `scrypt`;
- salt individual aleatório;
- token de sessão opaco;
- armazenamento somente do hash do token;
- papéis e permissões explícitas;
- revogação de sessão;
- auditoria das ações relevantes.

## Motivos

- não expor dados de sessão persistidos;
- permitir revogação imediata;
- evitar autorização codificada diretamente nas telas;
- suportar diferentes responsabilidades da equipe;
- permitir rastreabilidade.

## Consequências

- o backend consulta a sessão em requisições autenticadas;
- permissões são calculadas pelos papéis ativos;
- o primeiro administrador exige bootstrap controlado;
- a `X-Admin-Key` será removida na etapa seguinte.

## Status

Aceito.
