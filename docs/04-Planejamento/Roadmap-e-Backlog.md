---
title: "Roadmap e Backlog"
type: "planning"
status: "active"
created: "2026-07-16"
updated: "2026-07-16"
tags:
  - "project/marciotopbarber"
  - "planning"
aliases: []
---

# Roadmap e Backlog

## Fase 0 — Documentação

- [x] criar vault Obsidian;
- [x] documentar arquitetura, riscos e decisões.

## Fase 1 — Higienização

- [x] remover código imobiliário;
- [x] substituir API local;
- [x] remover textos Waleska;
- [x] restringir CORS;
- [x] ajustar `.gitignore`;
- [x] remover duplicações e dependências sem uso;
- [ ] otimizar mídia;
- [ ] validar build.

## Fase 2 — Backend

- [x] estruturar FastAPI;
- [x] criar `/health`;
- [x] declarar dependências;
- [x] adicionar logs;
- [ ] adicionar rate limit;
- [x] adicionar testes;
- [x] configurar Railway;
- [ ] provisionar PostgreSQL;
- [ ] criar migrações.

## Fase 3 — Agendamento

- [ ] serviços e profissionais;
- [ ] disponibilidade e bloqueios;
- [ ] clientes e agendamentos;
- [ ] confirmação e cancelamento;
- [ ] agenda diária.

## Fase 4 — Administração

- [ ] login e permissões;
- [ ] painel e histórico;
- [ ] auditoria e relatórios.

## Fase 5 — HelpUS

- [ ] WhatsApp e lembretes;
- [ ] recuperação de clientes;
- [ ] pesquisa de satisfação;
- [ ] atendimento com IA;
- [ ] relatório diário.

## Fase 3 — Camada de dados

- [x] configurar SQLAlchemy;
- [x] configurar Psycopg;
- [x] criar modelos iniciais;
- [x] configurar Alembic;
- [x] criar migração inicial;
- [x] testar upgrade e downgrade;
- [ ] provisionar PostgreSQL na Railway;
- [ ] executar migração em produção.

## Fase 4 — API de agendamentos

- [x] listar barbeiros ativos;
- [x] listar serviços ativos;
- [x] criar agendamento;
- [x] normalizar telefone;
- [x] reutilizar cliente;
- [x] validar horários passados;
- [x] bloquear sobreposição;
- [x] calcular horários disponíveis;
- [x] configurar jornada de atendimento;
- [x] adicionar bloqueios e folgas.


## Fase 5 — Gestão da agenda

- [x] criar API de jornadas;
- [x] criar API de bloqueios;
- [x] listar agendamentos;
- [x] alterar status de agendamento;
- [x] proteger rotas administrativas.


## Fase 6 — Integração do frontend

- [ ] carregar barbeiros pela API;
- [ ] carregar serviços pela API;
- [ ] consultar disponibilidade;
- [ ] criar fluxo de agendamento;
- [ ] exibir confirmação e erros;
- [ ] preservar acessibilidade e responsividade;
- [ ] substituir a autenticação administrativa temporária antes do painel administrativo.

## Fase 7 — Identidade e autorização

- [ ] usuários administrativos;
- [ ] funcionários e cargos;
- [x] autenticação segura;
- [x] papéis e permissões;
- [ ] recuperação de senha;
- [x] auditoria;
- [ ] remover X-Admin-Key.

## Fase 8 — Cadastros e relacionamento

- [ ] clientes completos;
- [ ] fornecedores;
- [ ] categorias de serviços;
- [ ] serviços completos;
- [ ] categorias de produtos;
- [ ] produtos;
- [ ] configurações e conteúdo;
- [ ] depoimentos.

## Fase 9 — Atendimento e comissões

- [ ] agenda administrativa;
- [ ] serviços avulsos;
- [ ] conclusão de atendimento;
- [ ] fidelidade;
- [ ] retorno de clientes;
- [ ] comissões.

## Fase 10 — Estoque e comercial

- [ ] movimentações de estoque;
- [ ] estoque mínimo;
- [ ] compras;
- [ ] vendas.

## Fase 11 — Financeiro

- [ ] contas a pagar;
- [ ] contas a receber;
- [ ] baixas e estornos;
- [ ] fluxo de caixa.

## Fase 12 — Painel administrativo

- [x] layout protegido;
- [ ] dashboards;
- [ ] cadastros;
- [ ] agenda;
- [ ] estoque;
- [ ] financeiro.

## Fase 13 — Relatórios

- [ ] indicadores;
- [ ] relatórios operacionais;
- [ ] relatórios financeiros;
- [ ] PDF e CSV.

## Fase 14 — Migração e produção

- [ ] importador do banco legado;
- [ ] validação PostgreSQL;
- [ ] preview online;
- [ ] backup e rollback;
- [ ] deploy controlado.


### Fase 7A — Fundação concluída

- [x] modelos de usuários e funcionários;
- [x] modelos de papéis e permissões;
- [x] sessões opacas;
- [x] hash de senhas com scrypt;
- [x] login, identificação e logout;
- [x] auditoria básica;
- [x] bootstrap do primeiro administrador;
- [x] APIs de gestão de usuários;
- [x] APIs de gestão de funcionários;
- [x] vinculação de funcionários a barbeiros;
- [x] proteção das rotas administrativas por RBAC;
- [x] remoção da X-Admin-Key.


### Fase 7B — Gestão de identidade concluída

- [x] gestão de papéis disponíveis;
- [x] criação e atualização de usuários;
- [x] redefinição administrativa de senha;
- [x] criação e atualização de funcionários;
- [x] vínculo funcionário, usuário e barbeiro;
- [x] proteção da agenda administrativa por permissões;
- [x] remoção da X-Admin-Key;
- [x] tela administrativa de login;
- [x] layout protegido;
- [ ] gestão visual de usuários e funcionários.

### Fase 7C — Fundação do painel concluída

- [x] tela administrativa de login;
- [x] restauração e revogação de sessão;
- [x] rota protegida por `admin.access`;
- [x] layout responsivo;
- [x] dashboard de papéis e permissões;
- [x] rewrites administrativos na Vercel;
- [ ] gestão visual de usuários;
- [ ] gestão visual de funcionários;
- [ ] bootstrap do administrador de produção.
