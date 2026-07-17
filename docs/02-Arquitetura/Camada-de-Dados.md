---
title: "Camada de Dados"
type: "architecture/database"
status: "active"
created: "2026-07-16"
updated: "2026-07-16"
tags:
  - "project/marciotopbarber"
  - "database"
  - "sqlalchemy"
  - "alembic"
---

# Camada de Dados

## Tecnologias

- PostgreSQL em produção;
- SQLite apenas para testes locais;
- SQLAlchemy 2;
- Psycopg 3;
- Alembic.

## Modelos iniciais

- customers;
- barbers;
- services;
- appointments.

## Migração inicial

Revisão: `20260716_01`.

O ciclo de upgrade, check e downgrade é testado automaticamente.

## Produção

O banco real não foi acessado durante a implementação.

A Railway deverá fornecer a variável `DATABASE_URL`.
