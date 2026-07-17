# Marcio TopBarber API

Backend FastAPI modular da plataforma Marcio TopBarber.

## Executar

    .\venv\Scripts\python.exe -m uvicorn app.main:app --reload

## Testar

    .\venv\Scripts\python.exe -m pytest

## Rotas

- GET /health
- GET /api/v1/health
- POST /api/v1/contact
- POST /send-email
- GET /docs

## Migrações

Aplicar todas as migrações:

    .\venv\Scripts\python.exe -m alembic upgrade head

Verificar divergências entre modelos e migrações:

    .\venv\Scripts\python.exe -m alembic check

Reverter todas as migrações:

    .\venv\Scripts\python.exe -m alembic downgrade base

A variável DATABASE_URL define o banco utilizado.

## API de agendamentos

| Método | Rota | Finalidade |
|---|---|---|
| GET | /api/v1/barbers | listar barbeiros ativos |
| GET | /api/v1/services | listar serviços ativos |
| POST | /api/v1/appointments | criar agendamento |

A criação de agendamentos:

- exige data e hora com fuso horário;
- rejeita horários passados;
- reutiliza clientes pelo telefone;
- bloqueia sobreposição de horários;
- aceita somente barbeiros e serviços ativos.

## Disponibilidade

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/api/v1/availability` | listar horários livres |

Parâmetros obrigatórios:

- arber_id;
- service_id;
- date, no formato AAAA-MM-DD.

O cálculo considera:

- jornada semanal ativa;
- duração do serviço;
- intervalo configurável entre horários;
- agendamentos existentes;
- bloqueios e folgas;
- fuso horário America/Fortaleza.

## Gestão administrativa

As rotas administrativas utilizam o cabeçalho:

Authorization: Bearer <token-de-sessao>

O token é obtido pela rota POST /api/v1/auth/login.

Rotas disponíveis:

| Método | Rota | Finalidade |
|---|---|---|
| GET | /api/v1/admin/barbers/{barber_id}/schedules | listar jornadas |
| POST | /api/v1/admin/barbers/{barber_id}/schedules | criar jornada |
| DELETE | /api/v1/admin/barbers/{barber_id}/schedules/{schedule_id} | excluir jornada |
| GET | /api/v1/admin/barbers/{barber_id}/blocks | listar bloqueios |
| POST | /api/v1/admin/barbers/{barber_id}/blocks | criar bloqueio |
| DELETE | /api/v1/admin/barbers/{barber_id}/blocks/{block_id} | excluir bloqueio |
| GET | /api/v1/admin/appointments | listar agendamentos |
| PATCH | /api/v1/admin/appointments/{appointment_id}/status | alterar status |

A chave administrativa é temporária e não pode ser exposta no frontend público.

## Identidade e autorização

A plataforma utiliza usuários, papéis, permissões e sessões opacas.

Rotas disponíveis:

| Método | Rota | Finalidade |
|---|---|---|
| POST | /api/v1/auth/login | autenticar usuário |
| GET | /api/v1/auth/me | consultar usuário autenticado |
| POST | /api/v1/auth/logout | revogar a sessão atual |

As senhas são derivadas com `scrypt` e salt aleatório.

O token de sessão é exibido somente no login. O banco armazena apenas seu hash SHA-256.

O primeiro administrador deve ser criado pelo comando:

    python scripts/bootstrap_admin.py

As variáveis `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD` devem existir somente durante a execução do bootstrap.

As rotas administrativas exigem sessão Bearer e permissões RBAC.

## Gestão administrativa de identidade

As rotas administrativas utilizam autenticação Bearer e permissões RBAC.

### Papéis

| Método | Rota | Permissão |
|---|---|---|
| GET | /api/v1/admin/identity/roles | users.manage |

### Usuários

| Método | Rota | Permissão |
|---|---|---|
| GET | /api/v1/admin/identity/users | users.manage |
| POST | /api/v1/admin/identity/users | users.manage |
| PATCH | /api/v1/admin/identity/users/{user_id} | users.manage |

### Funcionários

| Método | Rota | Permissão |
|---|---|---|
| GET | /api/v1/admin/identity/employees | employees.manage |
| POST | /api/v1/admin/identity/employees | employees.manage |
| PATCH | /api/v1/admin/identity/employees/{employee_id} | employees.manage |

### Agenda administrativa

- jornadas e bloqueios exigem scheduling.manage;
- listagem e atualização de agendamentos exigem ppointments.manage.

Cabeçalhos administrativos compartilhados não são aceitos.
