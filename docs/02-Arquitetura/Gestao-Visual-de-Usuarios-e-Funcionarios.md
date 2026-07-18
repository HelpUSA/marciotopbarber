---
title: "Gestão Visual de Usuários e Funcionários"
type: "architecture/frontend"
status: "active"
created: "2026-07-18"
updated: "2026-07-18"
tags:
  - "project/marciotopbarber"
  - "administration"
  - "users"
  - "employees"
  - "rbac"
---

# Gestão Visual de Usuários e Funcionários

## Rotas

- /admin/usuarios;
- /admin/funcionarios.

## Usuários

- listagem;
- pesquisa;
- criação;
- edição;
- atribuição de papéis;
- redefinição de senha;
- ativação e desativação.

A tela exige a permissão users.manage.

O usuário autenticado não pode desativar a própria conta.

## Funcionários

- listagem;
- pesquisa;
- criação;
- edição;
- vínculo com usuário;
- vínculo com barbeiro;
- ativação e desativação.

A tela exige a permissão employees.manage.

A consulta e seleção de contas exige também users.manage.

## Comunicação com o backend

As requisições administrativas utilizam sessão Bearer.

Os formulários consomem as APIs de identidade já protegidas por RBAC.

## Preservação

O site público e o formulário público de agendamento permanecem inalterados.
