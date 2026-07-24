
---
title: "Multi-tenancy por Barbearia"
type: "architecture/multitenancy"
status: "proposed"
created: "2026-07-21"
updated: "2026-07-21"
tags:
  - "project/marciotopbarber"
  - "multitenancy"
  - "security"
---

# Multi-tenancy por Barbearia

## Objetivo

Permitir várias barbearias na mesma plataforma sem que
proprietários, administradores, operadores, funcionários ou
clientes acessem dados de outra empresa.

## Limitação atual

O RBAC atual é global. As principais tabelas de negócio ainda
não possuem `barbershop_id`.

Por isso, os papéis `barbershop-owner`,
`barbershop-administrator`, `operator` e `employee` são
definidos nesta fase, mas permanecem inativos até que o
isolamento seja implementado.

## Entidades obrigatórias

### `barbershops`

- identificador;
- nome;
- slug;
- documento;
- contatos;
- endereço;
- timezone;
- situação;
- configurações de conteúdo.

### `barbershop_memberships`

- usuário;
- barbearia;
- papel;
- situação;
- data de convite;
- data de aceite;
- criador do vínculo.

## Tabelas que receberão `barbershop_id`

- profissionais;
- funcionários;
- clientes;
- categorias de serviços;
- serviços;
- jornadas;
- bloqueios;
- agendamentos;
- fornecedores;
- categorias de produtos;
- produtos;
- movimentações de estoque;
- comandas;
- itens;
- pagamentos;
- compras;
- contas;
- comissões;
- conteúdo;
- relatórios persistidos;
- eventos de auditoria relacionados ao negócio.

## Regras obrigatórias

- toda consulta administrativa recebe escopo da barbearia;
- toda mutação valida vínculo ativo;
- IDs enviados pelo cliente não substituem o escopo autenticado;
- restrições únicas passam a incluir `barbershop_id`;
- auditoria registra a barbearia;
- o superadministrador pode trocar o contexto de suporte;
- o proprietário não pode sair do próprio tenant;
- usuários podem pertencer a mais de uma barbearia com papéis diferentes.

## Testes obrigatórios

- proprietário A não lê dados da barbearia B;
- operador A não altera dados da barbearia B;
- cliente consulta somente os próprios registros;
- funcionário consulta somente agenda e comissão próprias;
- busca por UUID de outro tenant retorna 404 ou 403;
- relatórios nunca agregam tenants diferentes;
- exportações respeitam o tenant;
- auditoria preserva ator e barbearia.

## Critério de ativação

Os papéis por barbearia somente serão ativados depois que todos
os testes de isolamento forem aprovados.

## Implementação da Fase 11B-1

Implementado:

- `barbershops`;
- `barbershop_memberships`;
- criação de barbearias pelo superadministrador;
- proprietário opcional na criação;
- administradores locais;
- operadores;
- funcionários;
- listagem das barbearias acessíveis;
- gestão de membros com regras de delegação;
- proteção do último proprietário ativo;
- auditoria;
- isolamento da leitura de membros entre barbearias.

Regras:

- o superadministrador pode atribuir qualquer papel local;
- o proprietário atribui administrador, operador e funcionário;
- o administrador atribui operador e funcionário;
- operador e funcionário não gerenciam membros;
- somente a plataforma atribui proprietários;
- uma barbearia não pode perder seu último proprietário ativo.

Os papéis locais ainda não concedem acesso às APIs comerciais.
Clientes, agenda, catálogo, estoque, comandas, financeiro e
relatórios continuarão bloqueados até receberem `barbershop_id`.

## Fase 11B-2 — Isolamento comercial

Os 14 modelos comerciais implementam `TenantScopedMixin` e possuem
`barbershop_id` obrigatório.

O tenant selecionado é transmitido por `X-Barbershop-ID`. O backend
valida a barbearia, o vínculo local ativo ou a permissão global de
administração da plataforma.

As consultas ORM recebem filtro automático. Inclusões recebem o tenant
ativo e alterações, exclusões ou referências para outra barbearia são
bloqueadas.

As rotas públicas de catálogo não exigem tenant. As rotas públicas de
agendamento recebem apenas o contexto necessário para manter o
agendamento dentro da barbearia selecionada.

A migração `20260722_09` executa o backfill dos registros anteriores.
