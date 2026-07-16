---
title: "Operacao e Deploy"
type: "operations"
status: "proposed"
created: "2026-07-16"
updated: "2026-07-16"
tags:
  - "project/marciotopbarber"
  - "operations"
aliases: []
---

# Operacao e Deploy

## Vercel

- instalação: `npm ci`;
- build: `npm run build`;
- saída: `dist`.

## Railway

- diretório: `backend`;
- comando: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`;
- endpoint obrigatório: `/health`.

## Variáveis previstas

### Frontend

- `VITE_API_URL`;
- `VITE_SITE_URL`;
- `VITE_WHATSAPP_NUMBER`.

### Backend

- `APP_ENV`;
- `DATABASE_URL`;
- `SECRET_KEY`;
- `ALLOWED_ORIGINS`;
- `EMAIL_HOST` e credenciais SMTP;
- `HELPUS_WEBHOOK_URL`;
- `HELPUS_WEBHOOK_SECRET`.

## Release

- [ ] revisar Git e segredos;
- [ ] executar lint, testes e build;
- [ ] revisar migrações;
- [ ] validar CORS e rate limit;
- [ ] publicar Vercel e Railway;
- [ ] testar agendamento e notificação;
- [ ] verificar logs.
