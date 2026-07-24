
---
title: "ADR-0017 - Isolamento Comercial por Barbearia"
type: "decision/adr"
status: "accepted"
created: "2026-07-23"
updated: "2026-07-23"
---

# ADR-0017 — Isolamento Comercial por Barbearia

## Contexto

O sistema passou a possuir múltiplas barbearias, mas os dados
comerciais ainda precisavam de isolamento obrigatório.

## Decisão

Os 14 modelos comerciais pertencem obrigatoriamente a uma barbearia
por meio de `barbershop_id`.

## Transporte do contexto

O frontend transmite a barbearia ativa no cabeçalho
`X-Barbershop-ID`.

## Leitura

O contexto do SQLAlchemy adiciona filtro de tenant às consultas ORM.

## Escrita

O backend:

- preenche o tenant de novos registros;
- bloqueia alteração e exclusão de registros de outra barbearia;
- bloqueia referências comerciais entre barbearias diferentes.

## Migração

A revisão `20260722_09` associa dados anteriores a uma barbearia
técnica legada antes de tornar a coluna obrigatória.

## Autorização

A seleção exige vínculo local ativo ou permissão global da plataforma.

Os papéis locais ainda não recebem automaticamente todas as permissões
comerciais. Essa ativação depende de homologação posterior.
