---
title: "Comandas e Vendas"
type: "architecture/backend"
status: "active"
updated: "2026-07-19"
tags:
  - "commerce"
  - "service-orders"
  - "inventory"
  - "payments"
  - "rbac"
---

# Comandas e Vendas

## Objetivo

O módulo de comandas concentra o atendimento comercial da barbearia, incluindo serviços, produtos, estoque, pagamentos, fechamento, cancelamento e indicadores.

## Permissão

Todas as rotas administrativas exigem:

- `commerce.manage`.

## Modelos

### ServiceOrder

Representa uma comanda e registra:

- número sequencial;
- cliente opcional;
- agendamento opcional;
- usuário de abertura;
- usuário de fechamento;
- situação;
- observações;
- motivo do cancelamento;
- subtotal;
- desconto;
- total;
- valor pago;
- datas de abertura, fechamento e cancelamento.

Situações permitidas:

- `open`;
- `closed`;
- `cancelled`.

Cada agendamento pode possuir no máximo uma comanda.

### ServiceOrderItem

Representa um serviço ou produto inserido na comanda.

O item preserva:

- tipo;
- serviço ou produto;
- barbeiro responsável;
- movimentação de estoque;
- nome;
- quantidade;
- preço unitário;
- total.

### ServiceOrderPayment

Representa um pagamento.

Formas permitidas:

- `cash`;
- `pix`;
- `credit_card`;
- `debit_card`;
- `other`.

A comanda aceita pagamentos divididos.

## Rotas

### Indicadores

- `GET /api/v1/admin/service-orders/summary`.

### Comandas

- `GET /api/v1/admin/service-orders`;
- `POST /api/v1/admin/service-orders`;
- `GET /api/v1/admin/service-orders/{order_id}`;
- `PATCH /api/v1/admin/service-orders/{order_id}`.

### Itens

- `POST /api/v1/admin/service-orders/{order_id}/items/services`;
- `POST /api/v1/admin/service-orders/{order_id}/items/products`;
- `DELETE /api/v1/admin/service-orders/{order_id}/items/{item_id}`.

### Conclusão

- `POST /api/v1/admin/service-orders/{order_id}/close`;
- `POST /api/v1/admin/service-orders/{order_id}/cancel`.

## Estoque

Ao adicionar um produto:

- o produto é bloqueado para atualização;
- a disponibilidade é validada;
- o estoque é reduzido;
- uma movimentação de saída é criada;
- a movimentação fica vinculada ao item.

Ao remover um produto de uma comanda aberta:

- o estoque é devolvido;
- uma movimentação de ajuste é criada.

Ao cancelar uma comanda:

- os produtos são estornados;
- movimentações de ajuste são registradas.

O sistema bloqueia estoque negativo.

## Fechamento

Uma comanda somente pode ser fechada quando:

- está aberta;
- possui pelo menos um item;
- possui total maior que zero;
- o desconto não supera o subtotal;
- a soma dos pagamentos corresponde exatamente ao total.

Após o fechamento, novas alterações são bloqueadas.

## Cancelamento

O cancelamento exige motivo.

Após o cancelamento:

- os produtos são estornados;
- a situação passa para `cancelled`;
- novas alterações são bloqueadas.

## Auditoria

Eventos registrados:

- `commerce.order_created`;
- `commerce.order_updated`;
- `commerce.service_item_added`;
- `commerce.product_item_added`;
- `commerce.order_item_removed`;
- `commerce.order_closed`;
- `commerce.order_cancelled`.

## Migração

- revisão: `20260718_06`;
- revisão anterior: `20260718_05`.

Tabelas:

- `service_orders`;
- `service_order_items`;
- `service_order_payments`.

## Testes

A suíte cobre:

- autenticação;
- autorização;
- abertura;
- listagem;
- edição;
- vínculo com agendamento;
- serviços;
- produtos;
- baixa de estoque;
- estoque insuficiente;
- estorno;
- pagamentos divididos;
- divergência de pagamentos;
- fechamento;
- cancelamento;
- indicadores;
- auditoria.
