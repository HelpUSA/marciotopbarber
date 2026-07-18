---
title: "Estoque e Base Comercial"
type: "architecture/backend"
status: "active"
created: "2026-07-18"
updated: "2026-07-18"
tags:
  - "project/marciotopbarber"
  - "backend"
  - "inventory"
  - "suppliers"
  - "products"
  - "stock"
  - "rbac"
---

# Estoque e Base Comercial

## Visão geral

A Fase 9A adiciona fornecedores, produtos, controle de estoque e histórico de movimentações.

A camada financeira permanece separada para uma fase posterior.

## Migração

A revisão `20260718_05` adiciona:

- `suppliers`;
- `products`;
- `stock_movements`.

A revisão anterior é `20260718_04`.

A migração possui upgrade e downgrade.

## Permissão

As APIs exigem:

- `inventory.manage`.

## Fornecedores

Rotas:

- `GET /api/v1/admin/suppliers`;
- `GET /api/v1/admin/suppliers/{supplier_id}`;
- `POST /api/v1/admin/suppliers`;
- `PATCH /api/v1/admin/suppliers/{supplier_id}`.

Recursos:

- listagem;
- pesquisa;
- filtro por situação;
- detalhamento;
- criação;
- edição;
- documento;
- contato;
- endereço;
- observações;
- vínculo com produtos.

## Produtos

Rotas:

- `GET /api/v1/admin/products`;
- `GET /api/v1/admin/products/{product_id}`;
- `POST /api/v1/admin/products`;
- `PATCH /api/v1/admin/products/{product_id}`.

Recursos:

- listagem;
- pesquisa;
- filtro por fornecedor;
- filtro por situação;
- filtro de estoque baixo;
- SKU;
- código de barras;
- descrição;
- unidade;
- custo;
- preço de venda;
- estoque atual;
- estoque mínimo.

O estoque não é alterado pela edição cadastral do produto.

## Movimentações

Rotas:

- `GET /api/v1/admin/inventory/movements`;
- `POST /api/v1/admin/inventory/movements`.

Tipos:

- `entry`;
- `exit`;
- `adjustment`.

Cada movimentação registra:

- produto;
- fornecedor opcional;
- usuário responsável;
- quantidade;
- saldo anterior;
- saldo posterior;
- custo unitário;
- motivo;
- referência;
- data e hora.

Movimentações que produziriam saldo negativo são bloqueadas.

## Resumo

Rota:

- `GET /api/v1/admin/inventory/summary`.

Indicadores:

- total de produtos;
- produtos ativos;
- estoque baixo;
- produtos sem estoque;
- total de unidades;
- valor de custo;
- valor potencial de venda.

## Integridade

A implementação inclui:

- estoque não negativo;
- estoque mínimo não negativo;
- custo não negativo;
- preço não negativo;
- SKU único;
- código de barras único quando informado;
- documento de fornecedor único quando informado;
- movimentação e atualização de saldo na mesma transação.

## Auditoria

São registrados eventos para:

- criação e atualização de fornecedores;
- criação e atualização de produtos;
- movimentações de estoque.
