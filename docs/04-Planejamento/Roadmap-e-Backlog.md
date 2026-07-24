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
- [x] categorias de serviços;
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
- [x] gestão visual de usuários;
- [x] gestão visual de funcionários;
- [ ] bootstrap do administrador de produção.


### Fase 7D — Gestão visual concluída

- [x] listagem e pesquisa de usuários;
- [x] criação e edição de usuários;
- [x] papéis e redefinição de senha;
- [x] listagem e pesquisa de funcionários;
- [x] criação e edição de funcionários;
- [x] vínculo com usuários e barbeiros;
- [x] navegação filtrada por permissões;
- [x] agenda administrativa visual;
- [x] jornadas e bloqueios visuais;
- [x] atualização visual de agendamentos.

### Fase 7E — Agenda administrativa concluída

- [x] listagem administrativa de agendamentos;
- [x] pesquisa e filtros da agenda;
- [x] alteração visual de status;
- [x] listagem semanal de jornadas;
- [x] criação e exclusão de jornadas;
- [x] listagem de bloqueios e folgas;
- [x] criação e exclusão de bloqueios;
- [x] atalhos funcionais no dashboard;
- [x] APIs administrativas de clientes;
- [x] APIs administrativas do catálogo;
- [ ] interface de clientes e serviços.

### Fase 8A — APIs de clientes e catálogo concluídas

- [x] modelo de categorias de serviços;
- [x] relacionamento de serviços com categorias;
- [x] dados de relacionamento dos clientes;
- [x] APIs administrativas de clientes;
- [x] APIs administrativas de categorias;
- [x] APIs administrativas de serviços;
- [x] pesquisa e filtros administrativos;
- [x] auditoria das operações;
- [x] permissões `customers.manage` e `catalog.manage`;
- [x] migração reversível `20260718_04`;
- [x] interface administrativa de clientes;
- [x] interface administrativa de categorias;
- [x] interface administrativa de serviços.

### Fase 8B — Interface de clientes e catálogo concluída

- [x] rota administrativa de clientes;
- [x] listagem e pesquisa de clientes;
- [x] filtro por situação dos clientes;
- [x] criação e edição de clientes;
- [x] dados de fidelidade e relacionamento;
- [x] resumo de agendamentos do cliente;
- [x] rota administrativa do catálogo;
- [x] gestão visual de categorias;
- [x] gestão visual de serviços;
- [x] filtros por categoria e situação;
- [x] atalhos funcionais no dashboard;
- [x] navegação condicionada por RBAC;
- [x] modelos de produtos e fornecedores;
- [x] APIs de estoque;
- [x] entradas e saídas de estoque;
- [ ] movimentações comerciais.

### Fase 9A — Estoque e base comercial concluídos

- [x] modelo de fornecedores;
- [x] cadastro e atualização de fornecedores;
- [x] pesquisa e filtros de fornecedores;
- [x] modelo de produtos;
- [x] cadastro e atualização de produtos;
- [x] SKU e código de barras únicos;
- [x] custo e preço de venda;
- [x] estoque atual e estoque mínimo;
- [x] entradas de estoque;
- [x] saídas de estoque;
- [x] ajustes positivos e negativos;
- [x] bloqueio de saldo negativo;
- [x] histórico de movimentações;
- [x] resumo gerencial do estoque;
- [x] auditoria comercial;
- [x] permissão `inventory.manage`;
- [x] migração reversível `20260718_05`;
- [x] interface administrativa de fornecedores;
- [x] interface administrativa de produtos;
- [x] interface administrativa de movimentações;
- [x] indicadores visuais de estoque baixo;
- [ ] vendas de produtos;
- [ ] contas a pagar e receber;
- [ ] fluxo de caixa.

### Fase 9B — Interface administrativa de estoque concluída

- [x] rota `/admin/estoque`;
- [x] navegação condicionada por `inventory.manage`;
- [x] atalho funcional no dashboard;
- [x] indicadores gerais de estoque;
- [x] interface de fornecedores;
- [x] pesquisa e filtro de fornecedores;
- [x] criação e edição de fornecedores;
- [x] interface de produtos;
- [x] pesquisa e filtros de produtos;
- [x] criação e edição de produtos;
- [x] alertas visuais de estoque baixo;
- [x] ações rápidas de entrada;
- [x] ações rápidas de saída;
- [x] ações rápidas de ajuste;
- [x] histórico de movimentações;
- [x] filtros de movimentações;
- [x] preservação do site público;
- [ ] modelo de comandas;
- [ ] itens de serviços em comandas;
- [ ] itens de produtos em comandas;
- [ ] baixa automática de estoque;
- [ ] fechamento e cancelamento de comandas;
- [ ] vendas de produtos;
- [ ] formas de pagamento;
- [ ] contas a pagar e receber;
- [ ] fluxo de caixa.
### Fase 10A — APIs de comandas e vendas concluídas

- [x] modelos de comandas;
- [x] itens de serviços;
- [x] itens de produtos;
- [x] pagamentos divididos;
- [x] vínculo com clientes;
- [x] vínculo com agendamentos;
- [x] baixa automática de estoque;
- [x] estorno ao remover produto;
- [x] estorno ao cancelar comanda;
- [x] bloqueio de estoque negativo;
- [x] fechamento;
- [x] cancelamento;
- [x] indicadores comerciais;
- [x] permissão `commerce.manage`;
- [x] auditoria comercial;
- [x] migração reversível `20260718_06`;
- [x] testes funcionais;
- [x] interface administrativa de comandas;
- [x] abertura visual;
- [x] inclusão visual de serviços;
- [x] inclusão visual de produtos;
- [x] pagamentos visuais;
- [x] fechamento visual;
- [x] cancelamento visual;
- [x] indicadores comerciais visuais;
### Fase 10B — Interface administrativa de comandas concluída

- [x] rota `/admin/comandas`;
- [x] navegação condicionada por `commerce.manage`;
- [x] cartão no painel administrativo;
- [x] indicadores comerciais;
- [x] listagem e filtros;
- [x] abertura e edição;
- [x] serviços e barbeiros;
- [x] produtos e estoque;
- [x] remoção e estorno;
- [x] descontos;
- [x] pagamentos divididos;
- [x] fechamento;
- [x] cancelamento;
- [x] detalhamento de itens;
- [x] histórico de pagamentos;
- [x] estados de carregamento e erro;
- [x] build de produção.

## Fase 11 — Identidade Google e plataforma multiempresa

### Fase 11A — Google Identity e hierarquia

- [x] inventariar funcionalidades do sistema legado;
- [x] documentar implementado, parcial e pendente;
- [x] botão Entrar na página principal;
- [x] login Google no frontend;
- [x] validação do ID token no backend;
- [x] sessão própria da aplicação;
- [x] superadministrador da plataforma;
- [x] papel padrão de cliente;
- [x] definir papéis de proprietário, administrador, operador e funcionário;
- [ ] configurar Client ID na Vercel e Railway;
- [ ] validar login Google em produção.

### Fase 11B — Multi-tenancy por barbearia

- [ ] criar `barbershops`;
- [ ] criar `barbershop_memberships`;
- [ ] adicionar `barbershop_id` aos domínios de negócio;
- [ ] aplicar escopo obrigatório em consultas e mutações;
- [ ] converter restrições únicas para escopo por tenant;
- [ ] adicionar contexto de barbearia à auditoria;
- [ ] aprovar testes de isolamento;
- [ ] ativar papéis por barbearia.

### Fase 11C — Infraestrutura online

- [ ] vincular o projeto Railway correto;
- [ ] validar PostgreSQL de produção;
- [ ] executar Alembic até o head;
- [ ] configurar CORS;
- [ ] configurar `VITE_API_URL`;
- [ ] configurar Google Client ID;
- [ ] testar backend e navegador;
- [ ] publicar e promover deployment validado.

### Fase 12 — Recursos restantes do legado

- [ ] categorias de produtos;
- [ ] compras;
- [ ] contas a pagar;
- [ ] contas a receber;
- [ ] fluxo de caixa;
- [ ] comissões;
- [ ] conteúdo configurável;
- [ ] depoimentos;
- [ ] alertas de retorno;
- [ ] recuperação de senha;
- [ ] relatórios;
- [ ] PDF e CSV.

### Fase 11B-1 — Núcleo multiempresa

- [x] criar `barbershops`;
- [x] criar `barbershop_memberships`;
- [x] cadastrar barbearias;
- [x] cadastrar proprietário;
- [x] cadastrar administrador;
- [x] cadastrar operador;
- [x] cadastrar funcionário;
- [x] proteger a atribuição de proprietário;
- [x] proteger o último proprietário ativo;
- [x] listar barbearias acessíveis;
- [x] proteger a gestão de membros;
- [x] registrar auditoria;
- [x] testar isolamento de membros;
- [ ] adicionar `barbershop_id` aos domínios comerciais;
- [ ] aplicar isolamento nas APIs existentes;
- [ ] criar seletor de barbearia no frontend;
- [ ] ativar painel operacional por tenant.

### Fase 11B-2 — Isolamento comercial

- [x] validar 14 modelos comerciais;
- [x] adicionar `barbershop_id`;
- [x] criar migração e backfill;
- [x] proteger leituras por tenant;
- [x] proteger inclusões por tenant;
- [x] bloquear alterações cruzadas;
- [x] bloquear exclusões cruzadas;
- [x] bloquear referências cruzadas;
- [x] criar catálogo público de barbearias;
- [x] proteger os quatro routers comerciais;
- [x] endurecer a governança de proprietários;
- [x] criar seletor de barbearia;
- [x] enviar `X-Barbershop-ID`;
- [x] criar testes de isolamento;
- [ ] homologar papéis funcionais locais;
- [ ] configurar infraestrutura de produção;
- [ ] publicar somente após homologação.
