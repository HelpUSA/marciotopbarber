---
title: "ADR-0005 - Estrutura Modular FastAPI"
type: "decision/adr"
status: "accepted"
created: "2026-07-16"
updated: "2026-07-16"
tags:
  - "project/marciotopbarber"
  - "backend"
  - "fastapi"
---

# ADR-0005 — Estrutura Modular FastAPI

## Contexto

O backend concentrava aplicação, rotas, configuração e SMTP em um único arquivo.

## Decisão

Separar o backend nos seguintes componentes:

- aplicação FastAPI;
- rotas HTTP;
- configuração por ambiente;
- serviços de infraestrutura;
- testes automatizados.

A entrada oficial de produção passa a ser:

`app.main:app`

## Consequências positivas

- responsabilidades isoladas;
- testes automatizados;
- configuração centralizada;
- preparação para PostgreSQL e autenticação;
- implantação reproduzível na Railway.

## Consequências negativas

- aumento do número de arquivos;
- manutenção temporária da rota `/send-email`.

## Status

Aceito.
