---
title: "Interface Administrativa de Clientes e Catálogo"
type: "architecture/frontend"
status: "active"
created: "2026-07-18"
updated: "2026-07-18"
tags:
  - "project/marciotopbarber"
  - "frontend"
  - "administration"
  - "customers"
  - "catalog"
  - "rbac"
---

# Interface Administrativa de Clientes e Catálogo

## Rotas

- `/admin/clientes`;
- `/admin/catalogo`.

As rotas permanecem protegidas pela sessão administrativa baseada em Bearer token.

## Clientes

A tela de clientes exige a permissão `customers.manage`.

Funcionalidades disponíveis:

- listagem;
- pesquisa local por nome, telefone, e-mail e observação;
- filtro de clientes ativos e inativos;
- criação;
- edição;
- data de nascimento;
- observações;
- pontos de fidelidade;
- registro do último serviço;
- previsão de retorno;
- resumo de agendamentos;
- exibição do último agendamento.

## Catálogo

A tela de catálogo exige a permissão `catalog.manage`.

O módulo possui áreas para categorias e serviços.

### Categorias

- listagem;
- pesquisa;
- filtro por situação;
- criação;
- edição;
- slug;
- descrição;
- posição;
- ativação e desativação;
- quantidade de serviços vinculados.

### Serviços

- listagem;
- pesquisa;
- filtro por categoria;
- filtro por situação;
- criação;
- edição;
- categoria;
- slug;
- descrição;
- duração;
- preço;
- posição;
- ativação e desativação;
- quantidade de agendamentos vinculados.

## Navegação

Os links de clientes e catálogo são exibidos somente quando o usuário possui as permissões correspondentes.

O dashboard também apresenta atalhos funcionais para os dois módulos.

## Integração

A interface utiliza:

- `GET /api/v1/admin/customers`;
- `POST /api/v1/admin/customers`;
- `PATCH /api/v1/admin/customers/{customer_id}`;
- `GET /api/v1/admin/service-categories`;
- `POST /api/v1/admin/service-categories`;
- `PATCH /api/v1/admin/service-categories/{category_id}`;
- `GET /api/v1/admin/services`;
- `POST /api/v1/admin/services`;
- `PATCH /api/v1/admin/services/{service_id}`.

## Preservação

Permanecem preservados:

- site público;
- formulário público de agendamento;
- agenda administrativa;
- jornadas e bloqueios;
- usuários;
- funcionários;
- autenticação e encerramento da sessão.
