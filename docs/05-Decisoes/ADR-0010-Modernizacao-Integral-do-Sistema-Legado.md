---
title: "ADR-0010 - Modernização Integral do Sistema Legado"
type: "decision/adr"
status: "accepted"
created: "2026-07-17"
updated: "2026-07-17"
---

# ADR-0010 — Modernização Integral do Sistema Legado

## Contexto

O sistema legado em PHP e MySQL possui um conjunto amplo de funcionalidades operacionais, comerciais e financeiras.

## Decisão

Reimplementar todas as funcionalidades úteis na arquitetura React, FastAPI, SQLAlchemy, Alembic e PostgreSQL.

O código PHP será utilizado apenas como especificação funcional.

## Regras arquiteturais

- senhas com hash seguro;
- autenticação com sessão ou token de curta duração;
- RBAC;
- auditoria;
- transações para estoque e financeiro;
- valores em centavos;
- timezone explícito;
- APIs versionadas;
- testes automatizados;
- painel React protegido.

## Compatibilidade funcional

Clientes, equipe, agenda, fidelidade, comissões, produtos, estoque, compras, vendas, financeiro, conteúdo e relatórios serão preservados.

## Status

Aceito.
