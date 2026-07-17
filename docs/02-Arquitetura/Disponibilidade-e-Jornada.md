---
title: "Disponibilidade e Jornada"
type: "architecture/scheduling"
status: "active"
created: "2026-07-16"
updated: "2026-07-16"
tags:
  - "project/marciotopbarber"
  - "availability"
  - "scheduling"
---

# Disponibilidade e Jornada

## Rota pública

- `GET /api/v1/availability`.

## Novas entidades

- `barber_schedules`: jornadas semanais;
- `barber_blocks`: bloqueios, folgas e intervalos.

## Cálculo

Os horários são gerados dentro da jornada semanal e filtrados conforme:

- duração do serviço;
- intervalo de quinze minutos;
- agendamentos ativos;
- bloqueios do barbeiro;
- data e horário atuais;
- fuso America/Fortaleza.

## Migração

Revisão: `20260716_02`.

Upgrade, downgrade e comparação com os modelos foram aprovados.

## Testes

A suíte possui 16 testes aprovados.
