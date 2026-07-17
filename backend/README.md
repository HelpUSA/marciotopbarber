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
