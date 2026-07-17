---
title: "ADR-0008 - Disponibilidade e Jornada"
type: "decision/adr"
status: "accepted"
created: "2026-07-16"
updated: "2026-07-16"
---

# ADR-0008 — Disponibilidade e Jornada

## Contexto

A criação de agendamentos precisa exibir somente horários realmente disponíveis.

## Decisão

Persistir jornadas semanais e bloqueios individuais por barbeiro.

Calcular os horários livres considerando duração do serviço, agendamentos, bloqueios e fuso do negócio.

## Consequências

- horários públicos calculados no backend;
- suporte a múltiplas janelas por dia;
- suporte a folgas e intervalos;
- necessidade de uma API administrativa para manutenção da agenda.

## Status

Aceito.
