
---
title: "ADR-0016 - Núcleo Multiempresa"
type: "decision/adr"
status: "accepted"
created: "2026-07-21"
updated: "2026-07-21"
---

# ADR-0016 — Núcleo Multiempresa

## Decisão

Criar as entidades `barbershops` e
`barbershop_memberships`.

Papéis locais:

- `barbershop-owner`;
- `barbershop-administrator`;
- `operator`;
- `employee`.

## Delegação

- somente o superadministrador atribui proprietários;
- o proprietário atribui administradores, operadores e funcionários;
- o administrador atribui operadores e funcionários;
- operadores e funcionários não gerenciam membros;
- o último proprietário ativo não pode ser removido.

## Segurança

O vínculo local não concede automaticamente acesso às APIs
globais existentes.

Clientes, agenda, catálogo, estoque, comandas, financeiro e
relatórios somente serão liberados depois que seus dados forem
isolados por `barbershop_id`.

## Consequência

A Fase 11B-1 estabelece o tenant e seus vínculos.

A Fase 11B-2 aplicará o tenant aos domínios comerciais.
