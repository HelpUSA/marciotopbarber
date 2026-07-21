
---
title: "ADR-0015 - Google Identity e Superadministrador"
type: "decision/adr"
status: "accepted"
created: "2026-07-21"
updated: "2026-07-21"
---

# ADR-0015 — Google Identity e Superadministrador

## Contexto

A plataforma precisa atender desenvolvedor global, proprietários
de barbearias, administradores, operadores, funcionários e
clientes.

O login por senha já existe, mas o acesso principal será feito
por conta Google.

## Decisão

Adotar Google Identity Services como provedor de identidade e
manter sessões opacas próprias da aplicação.

O e-mail verificado `helpus.ecommerce@gmail.com` recebe
`platform-superadmin`.

Novos usuários recebem `customer`.

Papéis ligados a uma barbearia permanecem inativos até que o
isolamento multi-tenant seja concluído.

## Motivos

- reduzir gestão de senhas;
- validar identidade por provedor confiável;
- manter revogação e autorização sob controle da aplicação;
- evitar usar e-mail não verificado;
- impedir que RBAC global seja confundido com multi-tenancy;
- preservar trilha de auditoria.

## Consequências

- frontend e backend precisam do mesmo OAuth Web Client ID;
- o backend precisa de acesso às chaves públicas do Google;
- o login por senha permanece temporariamente;
- a próxima fase obrigatória é o isolamento por barbearia;
- não é permitido ativar proprietários e operadores multiempresa
  antes dos testes de isolamento.

## Status

Aceito.
