---
title: "Gestão de Identidade e Autorização Administrativa"
type: "architecture/security"
status: "active"
created: "2026-07-17"
updated: "2026-07-17"
tags:
  - "project/marciotopbarber"
  - "identity"
  - "employees"
  - "rbac"
  - "administration"
---

# Gestão de Identidade e Autorização Administrativa

## Usuários

Administradores autorizados podem:

- listar usuários;
- criar usuários;
- alterar nome e e-mail;
- redefinir senha;
- atribuir papéis;
- ativar ou desativar contas.

Um usuário não pode desativar a própria conta.

## Funcionários

O cadastro de funcionário pode ser vinculado:

- a uma conta de usuário;
- a um barbeiro da agenda;
- a ambos;
- ou permanecer sem acesso ao sistema.

Cada usuário e cada barbeiro podem estar vinculados a no máximo um funcionário.

## Autorizações

| Recurso | Permissão |
|---|---|
| usuários e papéis | users.manage |
| funcionários | employees.manage |
| jornadas e bloqueios | scheduling.manage |
| agendamentos administrativos | ppointments.manage |

## Auditoria

Criações e alterações administrativas geram eventos de auditoria com usuário executor, entidade afetada e campos alterados.

## Segurança

- autenticação Bearer obrigatória;
- sessão validada no banco;
- usuário precisa estar ativo;
- papel e permissão precisam estar ativos;
- chave administrativa compartilhada removida.
