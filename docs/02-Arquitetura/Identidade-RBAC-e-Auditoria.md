---
title: "Identidade, RBAC e Auditoria"
type: "architecture/security"
status: "active"
created: "2026-07-17"
updated: "2026-07-17"
tags:
  - "project/marciotopbarber"
  - "identity"
  - "rbac"
  - "security"
  - "audit"
---

# Identidade, RBAC e Auditoria

## Entidades

- usuários;
- funcionários;
- papéis;
- permissões;
- sessões;
- eventos de auditoria.

## Autenticação

O login recebe e-mail e senha.

A senha é validada por `scrypt` com salt individual.

Uma autenticação válida cria um token opaco aleatório.

Somente o hash SHA-256 do token é armazenado.

## Sessões

- duração configurável;
- expiração absoluta;
- revogação no logout;
- validação do usuário ativo;
- registro do último uso.

## RBAC

Usuários recebem papéis.

Papéis recebem permissões.

As permissões são identificadas por códigos estáveis, como:

- `admin.access`;
- `users.manage`;
- `employees.manage`;
- `scheduling.manage`;
- `appointments.manage`;
- `inventory.manage`;
- `finance.manage`;
- `reports.read`.

## Auditoria

Eventos relevantes registram:

- usuário;
- ação;
- tipo da entidade;
- identificador da entidade;
- detalhes estruturados;
- data e hora.

## Transição

A chave administrativa compartilhada permanece somente até que todas as rotas existentes sejam protegidas pelas permissões correspondentes.
