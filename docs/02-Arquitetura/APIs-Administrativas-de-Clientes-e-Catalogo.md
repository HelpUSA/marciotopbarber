---
title: "APIs Administrativas de Clientes e Catálogo"
type: "architecture/backend"
status: "active"
created: "2026-07-18"
updated: "2026-07-18"
tags:
  - "project/marciotopbarber"
  - "backend"
  - "customers"
  - "catalog"
  - "services"
  - "rbac"
---

# APIs Administrativas de Clientes e Catálogo

## Migração

A revisão `20260718_04` adiciona:

- categorias de serviços;
- dados de relacionamento nos clientes;
- descrição, categoria e ordenação nos serviços;
- índices para consultas administrativas.

A migração é estrutural. As permissões continuam sendo gerenciadas pelo seed de identidade.

## Clientes

Rotas administrativas:

- `GET /api/v1/admin/customers`;
- `GET /api/v1/admin/customers/{customer_id}`;
- `POST /api/v1/admin/customers`;
- `PATCH /api/v1/admin/customers/{customer_id}`.

Funcionalidades:

- listagem;
- pesquisa;
- filtro por situação;
- detalhamento;
- criação;
- edição;
- data de nascimento;
- observações;
- pontos de fidelidade;
- último serviço;
- previsão de retorno;
- resumo de agendamentos.

Permissão exigida:

- `customers.manage`.

## Categorias de serviços

Rotas administrativas:

- `GET /api/v1/admin/service-categories`;
- `POST /api/v1/admin/service-categories`;
- `PATCH /api/v1/admin/service-categories/{category_id}`.

Funcionalidades:

- listagem;
- criação;
- edição;
- descrição;
- ordenação;
- ativação e desativação.

## Serviços

Rotas administrativas:

- `GET /api/v1/admin/services`;
- `POST /api/v1/admin/services`;
- `PATCH /api/v1/admin/services/{service_id}`.

Funcionalidades:

- listagem;
- pesquisa;
- filtros;
- categoria;
- descrição;
- duração;
- preço;
- ordenação;
- ativação e desativação.

Permissão exigida para categorias e serviços:

- `catalog.manage`.

## Auditoria

As operações administrativas registram eventos para:

- criação e atualização de clientes;
- criação e atualização de categorias;
- criação e atualização de serviços.

## Compatibilidade pública

A rota pública de serviços continua retornando apenas serviços ativos.

O agendamento público permanece preservado.
