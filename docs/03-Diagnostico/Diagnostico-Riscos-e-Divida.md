---
title: "Diagnostico Riscos e Divida"
type: "diagnostic"
status: "active"
created: "2026-07-16"
updated: "2026-07-16"
tags:
  - "project/marciotopbarber"
  - "diagnostic"
aliases: []
---

# Diagnostico Riscos e Divida

## Conclusão

O projeto atual é uma boa base visual, mas ainda não é um sistema operacional de barbearia.

## Achados

1. formulário aponta para `http://localhost:8000`;
2. backend contém conteúdo da Waleska Imóveis;
3. endpoint de e-mail pode ser abusado;
4. CORS aceita qualquer origem;
5. não existe banco de dados;
6. não existe autenticação;
7. não existem migrações;
8. não existem testes;
9. existem páginas imobiliárias;
10. existe arquivo duplicado da galeria;
11. há dependências não utilizadas;
12. mídia inicial é pesada;
13. Railway não está documentada no repositório;
14. `backend\venv` confundiu o inventário.

## Riscos prioritários

| Risco | Severidade | Tratamento |
|---|---:|---|
| abuso do e-mail | Alta | rate limit e CAPTCHA |
| CORS aberto | Alta | origens explícitas |
| ausência de login | Crítica | autenticação e RBAC |
| cancelamento previsível | Crítica | token aleatório |
| conflito de horários | Alta | transação e constraint |
| segredo no Git | Crítica | secret scan |
| dados pessoais | Alta | LGPD e retenção |

## Código legado

- remover componentes imobiliários;
- remover páginas em `src/pages/imoveis`;
- remover textos Waleska;
- remover `Gallery.jsxGallery.jsx`;
- remover componentes e dependências sem uso;
- otimizar imagens e vídeo.
