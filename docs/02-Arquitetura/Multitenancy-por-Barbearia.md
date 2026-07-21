
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
