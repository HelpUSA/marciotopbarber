---
title: "Interface Administrativa de Estoque"
type: "architecture/frontend"
status: "active"
created: "2026-07-18"
updated: "2026-07-18"
tags:
  - "project/marciotopbarber"
  - "frontend"
  - "administration"
  - "inventory"
  - "suppliers"
  - "products"
  - "stock"
  - "rbac"
---

# Interface Administrativa de Estoque

## Rota

A interface administrativa está disponível em:

- `/admin/estoque`.

A rota permanece protegida pela sessão administrativa baseada em Bearer token.

## Permissão

O módulo exige:

- `inventory.manage`.

O link lateral, o atalho do dashboard e o conteúdo da página respeitam a permissão.

## Indicadores

O cabeçalho do módulo apresenta:

- total de produtos;
- total de produtos ativos;
- produtos com estoque baixo;
- produtos sem estoque;
- total de unidades disponíveis;
- valor total pelo custo;
- valor potencial de venda.

Os dados são obtidos por:

- `GET /api/v1/admin/inventory/summary`.

## Produtos

A área de produtos oferece:

- listagem;
- pesquisa por nome, SKU, código de barras, descrição e fornecedor;
- filtro por fornecedor;
- filtro de estoque normal;
- filtro de estoque baixo;
- filtro de produtos sem estoque;
- criação;
- edição;
- fornecedor;
- SKU;
- código de barras;
- descrição;
- unidade;
- custo;
- preço de venda;
- estoque atual;
- estoque mínimo;
- situação ativa ou inativa;
- alertas visuais de estoque baixo;
- ações rápidas de entrada, saída e ajuste.

O saldo atual não pode ser alterado pela edição cadastral.

## Fornecedores

A área de fornecedores oferece:

- listagem;
- pesquisa;
- filtro por situação;
- criação;
- edição;
- razão social;
- nome comercial;
- documento;
- pessoa de contato;
- e-mail;
- telefone;
- endereço;
- observações;
- situação ativa ou inativa;
- quantidade de produtos vinculados.

## Movimentações

A área de movimentações oferece:

- histórico;
- filtro por produto;
- filtro por tipo;
- pesquisa por produto, SKU, motivo, referência e fornecedor;
- entrada;
- saída;
- ajuste positivo;
- ajuste negativo;
- fornecedor opcional;
- custo unitário opcional;
- motivo;
- referência;
- saldo anterior;
- saldo posterior;
- data e hora.

Entradas e saídas utilizam quantidades positivas no formulário.

Ajustes aceitam valores positivos ou negativos.

## Integração

A interface utiliza:

- `GET /api/v1/admin/suppliers`;
- `POST /api/v1/admin/suppliers`;
- `PATCH /api/v1/admin/suppliers/{supplier_id}`;
- `GET /api/v1/admin/products`;
- `POST /api/v1/admin/products`;
- `PATCH /api/v1/admin/products/{product_id}`;
- `GET /api/v1/admin/inventory/summary`;
- `GET /api/v1/admin/inventory/movements`;
- `POST /api/v1/admin/inventory/movements`.

## Navegação

O módulo foi integrado:

- ao menu lateral administrativo;
- ao dashboard administrativo;
- ao roteador principal React.

## Preservação

Permanecem preservados:

- site público;
- agendamento público;
- autenticação administrativa;
- agenda;
- jornadas e bloqueios;
- clientes;
- catálogo;
- usuários;
- funcionários.
