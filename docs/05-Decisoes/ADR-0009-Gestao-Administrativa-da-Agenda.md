---
title: "ADR-0009 - Gestão Administrativa da Agenda"
type: "decision/adr"
status: "accepted"
created: "2026-07-16"
updated: "2026-07-16"
---

# ADR-0009 — Gestão Administrativa da Agenda

## Contexto

Jornadas, bloqueios e estados dos agendamentos precisam ser administrados sem exposição nas rotas públicas.

## Decisão

Criar rotas administrativas separadas sob `/api/v1/admin`.

Nesta etapa, proteger essas rotas com uma chave secreta enviada pelo cabeçalho `X-Admin-Key`.

## Consequências positivas

- separação entre API pública e administrativa;
- comparação segura da chave;
- gestão de jornadas e bloqueios;
- controle do ciclo do agendamento.

## Limitações

- não existem usuários administrativos individuais;
- não existe expiração de sessão;
- não existe auditoria por operador;
- a chave não pode ser exposta em aplicações públicas.

## Evolução prevista

Substituir a chave compartilhada por autenticação administrativa com sessão ou token de curta duração antes de publicar um painel administrativo.

## Status

Aceito como solução temporária.
