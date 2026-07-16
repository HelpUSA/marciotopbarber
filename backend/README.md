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
