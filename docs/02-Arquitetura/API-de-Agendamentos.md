---
title: "API de Agendamentos"
type: "architecture/api"
status: "active"
created: "2026-07-16"
updated: "2026-07-16"
tags:
  - "project/marciotopbarber"
  - "backend"
  - "scheduling"
---

# API de Agendamentos

## Rotas públicas

- `GET /api/v1/barbers`;
- `GET /api/v1/services`;
- `POST /api/v1/appointments`.

## Regras implementadas

- catálogos exibem somente itens ativos;
- telefone é normalizado para dígitos;
- cliente existente é reutilizado pelo telefone;
- horário precisa incluir fuso;
- horário precisa estar no futuro;
- sobreposições retornam HTTP 409;
- agendamento inicial recebe status `scheduled`.

## Testes

A suíte possui 13 testes aprovados.
