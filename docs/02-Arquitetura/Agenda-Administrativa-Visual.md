---
title: "Agenda Administrativa Visual"
type: "architecture/frontend"
status: "active"
created: "2026-07-18"
updated: "2026-07-18"
tags:
  - "project/marciotopbarber"
  - "administration"
  - "appointments"
  - "scheduling"
  - "blocks"
---

# Agenda Administrativa Visual

## Rotas

- `/admin/agenda`;
- `/admin/jornadas`.

## Agenda

A tela de agenda permite:

- consultar agendamentos;
- pesquisar por cliente, contato, serviço ou profissional;
- filtrar por status;
- filtrar por profissional;
- filtrar por período;
- alterar o status do atendimento.

A permissão exigida é `appointments.manage`.

## Status

- `scheduled`;
- `confirmed`;
- `completed`;
- `cancelled`;
- `no_show`.

## Jornadas

A tela de jornadas permite:

- selecionar o profissional;
- consultar horários semanais;
- criar jornadas recorrentes;
- excluir jornadas;
- consultar bloqueios;
- criar bloqueios e folgas;
- excluir bloqueios.

A permissão exigida é `scheduling.manage`.

## Disponibilidade pública

Jornadas ativas e bloqueios administrativos participam do cálculo de disponibilidade usado pelo agendamento público.

## Preservação

O site público, o catálogo institucional e o formulário de agendamento permanecem separados das rotas administrativas.
