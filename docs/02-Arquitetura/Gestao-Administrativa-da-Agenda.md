---
title: "Gestão Administrativa da Agenda"
type: "architecture/management"
status: "active"
created: "2026-07-16"
updated: "2026-07-16"
tags:
  - "project/marciotopbarber"
  - "management"
  - "scheduling"
  - "security"
---

# Gestão Administrativa da Agenda

## Recursos

- criação, listagem e exclusão de jornadas;
- criação, listagem e exclusão de bloqueios;
- listagem filtrada de agendamentos;
- alteração do status de agendamentos.

## Proteção

As rotas utilizam o cabeçalho `X-Admin-Key`.

A chave é comparada de forma segura com o valor da variável `ADMIN_API_KEY`.

Esse mecanismo é temporário e não deve ser utilizado diretamente por código executado no navegador.

## Status permitidos

- `scheduled`;
- `confirmed`;
- `completed`;
- `cancelled`;
- `no_show`.

## Testes

A suíte possui 23 testes aprovados.

## Migração

Não foi necessária alteração no esquema do banco.
