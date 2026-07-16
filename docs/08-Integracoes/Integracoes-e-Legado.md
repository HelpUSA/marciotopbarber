---
title: "Integracoes e Legado"
type: "integration"
status: "proposed"
created: "2026-07-16"
updated: "2026-07-16"
tags:
  - "project/marciotopbarber"
  - "integration"
aliases: []
---

# Integracoes e Legado

## Eventos HelpUS

- `appointment.created`;
- `appointment.confirmed`;
- `appointment.rescheduled`;
- `appointment.cancelled`;
- `appointment.reminder_due`;
- `appointment.completed`;
- `appointment.no_show`;
- `client.inactive`.

## Requisitos

- identificador único;
- versão;
- idempotência;
- assinatura de webhook;
- prevenção de replay;
- retentativas;
- auditoria.

## Mapeamento PHP

| Legado | Novo sistema |
|---|---|
| serviços | `services` |
| funcionários | `professionals` |
| clientes | `clients` |
| dias e horários | `business_hours` |
| exceções | `schedule_exceptions` |
| bloqueios | `blocked_periods` |
| agendamentos | `appointments` |
| permissões | `users` e `roles` |
| produtos | módulo futuro |
| contas | módulo futuro |
| comissões | módulo futuro |

## Migração

Exportar, sanear, normalizar, importar em homologação, validar e somente depois importar em produção.
