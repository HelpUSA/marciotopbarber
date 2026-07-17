---
title: "ADR-0006 - SQLAlchemy e Alembic"
type: "decision/adr"
status: "accepted"
created: "2026-07-16"
updated: "2026-07-16"
---

# ADR-0006 — SQLAlchemy e Alembic

## Contexto

O novo backend precisa de persistência relacional e migrações reproduzíveis.

## Decisão

Usar:

- PostgreSQL como banco de produção;
- SQLAlchemy 2 como ORM;
- Psycopg 3 como driver;
- Alembic para migrações.

## Consequências

- esquema versionado;
- rollback testável;
- preparação para Railway;
- SQLite limitado aos testes locais.

## Status

Aceito.
