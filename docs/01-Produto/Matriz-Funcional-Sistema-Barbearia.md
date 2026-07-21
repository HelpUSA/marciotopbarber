
---
title: "Matriz Funcional do Sistema de Barbearia"
type: "product/functional-matrix"
status: "active"
created: "2026-07-21"
updated: "2026-07-21"
tags:
  - "project/marciotopbarber"
  - "legacy"
  - "scope"
  - "roadmap"
---

# Matriz Funcional do Sistema de Barbearia

## Objetivo

Este documento compara a aplicação moderna com os recursos
identificados no sistema legado distribuído no arquivo `.rar`.

O código PHP legado é uma referência funcional. Ele não será
incorporado diretamente à aplicação React, FastAPI, SQLAlchemy,
Alembic e PostgreSQL.

## Legenda

| Estado | Significado |
|---|---|
| Implementado | Código, API e/ou interface já existem no repositório |
| Parcial | Existe uma parte útil, mas falta completar o fluxo |
| Planejado | Recurso do legado ainda precisa ser implementado |
| Bloqueado | Depende de infraestrutura ou isolamento multi-tenant |

## Identidade, segurança e usuários

| Funcionalidade | Estado | Observação |
|---|---|---|
| Login por e-mail e senha | Implementado | Mantido temporariamente como contingência |
| Login por conta Google | Implementado nesta fase | Token Google validado no backend |
| Sessões opacas revogáveis | Implementado | A aplicação não usa o token Google como sessão |
| Papéis e permissões | Implementado | RBAC global já existente |
| Auditoria | Implementado | Login e ações administrativas registradas |
| Superadministrador da plataforma | Implementado nesta fase | `helpus.ecommerce@gmail.com` |
| Administrador da barbearia | Parcial | Papel definido, mas inativo até existir isolamento por barbearia |
| Operador | Parcial | Papel definido, mas inativo até existir isolamento por barbearia |
| Funcionário | Parcial | Papel definido; faltam escopos de agenda e comissão próprias |
| Cliente | Implementado nesta fase | Novas contas Google recebem o papel `customer` |
| Recuperação de senha | Planejado | Fluxo por e-mail e tokens temporários |
| Perfil do usuário | Parcial | Página básica criada; edição ainda pendente |
| Ativação e suspensão de usuários | Implementado | Gestão administrativa existente |

## Plataforma e multi-tenancy

| Funcionalidade | Estado | Observação |
|---|---|---|
| Cadastro de barbearias | Planejado | Criar entidade `barbershops` |
| Vínculos de usuários por barbearia | Planejado | Criar `barbershop_memberships` |
| Proprietário limitado à própria barbearia | Bloqueado | Exige `barbershop_id` em todos os domínios |
| Administradores por barbearia | Bloqueado | Exige consultas e mutações com escopo obrigatório |
| Operadores por barbearia | Bloqueado | Não pode haver acesso cruzado entre empresas |
| Testes de isolamento | Planejado | Devem provar ausência de vazamento entre tenants |

## Site público e conteúdo

| Funcionalidade | Estado |
|---|---|
| Página institucional | Implementado |
| Banner, sobre, galeria e contato | Implementado |
| Catálogo público de serviços | Implementado |
| Agendamento público | Implementado no código; backend online ainda precisa ser conectado |
| Botão Entrar na página principal | Implementado nesta fase |
| Textos configuráveis pelo painel | Planejado |
| Logo, favicon e imagens configuráveis | Planejado |
| Endereço, mapa e redes sociais configuráveis | Planejado |
| Depoimentos moderados | Planejado |
| Catálogo público de produtos | Planejado |

## Clientes e relacionamento

| Funcionalidade | Estado |
|---|---|
| Cadastro completo de clientes | Implementado |
| Pesquisa, ativação e edição | Implementado |
| Data de nascimento | Implementado |
| Fidelidade | Implementado |
| Último serviço | Implementado |
| Previsão de retorno | Implementado |
| Alertas automáticos de retorno | Planejado |
| Relatório de aniversariantes | Planejado |
| Histórico no portal do cliente | Planejado |
| Dados e agendamentos próprios | Planejado |

## Equipe, agenda e atendimento

| Funcionalidade | Estado |
|---|---|
| Funcionários e profissionais | Implementado |
| Cargos e papéis | Parcial |
| Jornadas semanais | Implementado |
| Bloqueios e folgas | Implementado |
| Agenda administrativa | Implementado |
| Agenda individual | Parcial |
| Agendamento público | Implementado no código |
| Alteração de status | Implementado |
| Atendimento avulso | Parcial, por comandas |
| Conclusão e cancelamento | Implementado |
| Portal individual do profissional | Planejado |

## Serviços e Comissões

| Funcionalidade | Estado |
|---|---|
| Categorias de serviços | Implementado |
| Serviços, preço e duração | Implementado |
| Imagem do serviço | Planejado |
| Prazo de retorno | Parcial |
| Comissão fixa ou percentual | Planejado |
| Geração automática de comissão | Planejado |
| Baixa individual e em lote | Planejado |
| Consulta de comissão própria | Planejado |

## Produtos, fornecedores e estoque

| Funcionalidade | Estado |
|---|---|
| Fornecedores | Implementado |
| Produtos | Implementado |
| Categorias de produtos | Planejado |
| Custo e preço de venda | Implementado |
| SKU e código de barras | Implementado |
| Estoque atual e mínimo | Implementado |
| Entradas, saídas e ajustes | Implementado |
| Bloqueio de saldo negativo | Implementado |
| Alertas de estoque baixo | Implementado |
| Fotos de produtos | Planejado |

## Comandas, vendas e compras

| Funcionalidade | Estado |
|---|---|
| Abertura e edição de comandas | Implementado |
| Serviços e produtos na comanda | Implementado |
| Pagamentos divididos | Implementado |
| Baixa automática de estoque | Implementado |
| Estorno automático de estoque | Implementado |
| Fechamento e cancelamento | Implementado |
| Compras de fornecedores | Planejado |
| Entrada automática por compra | Planejado |
| Venda avulsa de produto | Parcial |
| Comprovantes e anexos | Planejado |

## Financeiro

| Funcionalidade | Estado |
|---|---|
| Permissão financeira | Implementado |
| Contas a pagar | Planejado |
| Contas a receber | Planejado |
| Baixas e estornos | Planejado |
| Despesas e receitas avulsas | Planejado |
| Fluxo de caixa | Planejado |
| Demonstrativo de lucro | Planejado |
| Conciliação por forma de pagamento | Planejado |

## Relatórios

| Funcionalidade | Estado |
|---|---|
| Indicadores de agenda | Parcial |
| Indicadores de clientes | Parcial |
| Indicadores de estoque | Implementado |
| Indicadores de comandas | Implementado |
| Relatórios de produtos e estoque | Planejado |
| Relatórios de entradas e saídas | Planejado |
| Relatórios de compras e vendas | Planejado |
| Relatórios financeiros | Planejado |
| Relatórios de comissões | Planejado |
| Aniversários e retornos | Planejado |
| Lucro | Planejado |
| Exportação PDF | Planejado |
| Exportação CSV | Planejado |

## Infraestrutura necessária

| Item | Estado |
|---|---|
| Frontend Vercel | Publicado |
| Backend FastAPI | Não verificado online |
| Projeto Railway vinculado localmente | Pendente |
| PostgreSQL de produção | Pendente de validação |
| Migrações automáticas | Configuradas no código |
| `VITE_API_URL` de produção | Pendente de validação |
| `VITE_GOOGLE_CLIENT_ID` | Pendente de configuração |
| `GOOGLE_CLIENT_ID` | Pendente de configuração |
| Teste real do login Google | Pendente da infraestrutura online |

## Regra de conclusão

Uma funcionalidade somente será marcada como operacional em
produção depois de passar por:

1. testes automatizados;
2. migração validada;
3. build do frontend;
4. backend online;
5. configuração das variáveis;
6. teste em navegador;
7. validação de autorização e auditoria.
