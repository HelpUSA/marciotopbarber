---
title: "ADR-0007 - API de Agendamentos"
type: "decision/adr"
status: "accepted"
created: "2026-07-16"
updated: "2026-07-16"
---

# ADR-0007 — API de Agendamentos

## Contexto

A plataforma precisa receber agendamentos públicos com validação de catálogo e conflito de horário.

## Decisão

Implementar uma API REST versionada com:

- catálogo público de barbeiros;
- catálogo público de serviços;
- criação de agendamentos;
- reutilização de clientes por telefone;
- validação de sobreposição.

## Consequências

- regras de negócio isoladas no serviço de agendamento;
- respostas HTTP consistentes;
- preparação para disponibilidade calculada;
- necessidade futura de proteção contra concorrência no PostgreSQL.

## Status

Aceito.
