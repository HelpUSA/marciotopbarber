---
title: "ADRs"
type: "decision/adr"
status: "accepted"
created: "2026-07-16"
updated: "2026-07-16"
tags:
  - "project/marciotopbarber"
  - "decision/adr"
aliases: []
---

# ADRs

## ADR-0001 — Manter React e Vite

**Status:** aceito.

Preserva o site atual, reduz migração e mantém integração simples com Vercel.

## ADR-0002 — Manter FastAPI

**Status:** aceito.

A API será reorganizada e publicada na Railway.

## ADR-0003 — Usar PostgreSQL

**Status:** aceito.

PostgreSQL será a fonte transacional para agenda, clientes, histórico e auditoria.

## ADR-0004 — Não incorporar o PHP legado

**Status:** aceito.

Aproveitar requisitos, regras e dados saneados. Não aproveitar MD5, SQL concatenado, autenticação antiga ou rotas inseguras.


## ADR-0005 — Estrutura Modular FastAPI

**Status:** aceito.

Documento completo: [[ADR-0005-Estrutura-Modular-FastAPI]]
