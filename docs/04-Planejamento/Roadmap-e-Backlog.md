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
