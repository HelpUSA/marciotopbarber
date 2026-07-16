---
title: "Arquitetura e Dados"
type: "architecture"
status: "proposed"
created: "2026-07-16"
updated: "2026-07-16"
tags:
  - "project/marciotopbarber"
  - "architecture"
aliases: []
---

# Arquitetura e Dados

## Arquitetura atual

- frontend React 18, Vite 5 e Tailwind;
- backend FastAPI limitado ao envio de e-mail;
- ausência de banco, autenticação e agendamento;
- frontend chama `localhost:8000`;
- backend ainda contém referências à Waleska Imóveis.

## Arquitetura alvo

| Camada | Plataforma | Responsabilidade |
|---|---|---|
| Frontend | Vercel | site, agenda e painel |
| API | Railway | regras, autenticação e integrações |
| Banco | PostgreSQL/Railway | fonte transacional |
| Automação | HelpUS | WhatsApp, IA e relatórios |

## Entidades iniciais

- `users`, `roles` e `user_roles`;
- `professionals` e `services`;
- `professional_services`;
- `business_hours`;
- `schedule_exceptions` e `blocked_periods`;
- `clients` e `appointments`;
- `appointment_status_history`;
- `notification_jobs` e `notification_logs`;
- `audit_logs` e `settings`.

## Estados

- `pending`;
- `confirmed`;
- `in_progress`;
- `completed`;
- `cancelled_by_client`;
- `cancelled_by_staff`;
- `no_show`;
- `rescheduled`.

## Regras

- impedir conflito de horários;
- considerar duração e intervalo;
- bloqueios prevalecem sobre horário regular;
- cancelamento público utiliza token seguro;
- mudanças geram histórico;
- datas são persistidas em UTC;
- exibição usa `America/Fortaleza`.
