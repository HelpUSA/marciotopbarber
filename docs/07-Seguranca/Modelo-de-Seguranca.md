---
title: "Modelo de Seguranca"
type: "security"
status: "proposed"
created: "2026-07-16"
updated: "2026-07-16"
tags:
  - "project/marciotopbarber"
  - "security"
aliases: []
---

# Modelo de Seguranca

## Cliente

O MVP pode operar sem conta, utilizando telefone e tokens com expiração para confirmação e cancelamento.

## Administração

- Argon2id ou bcrypt;
- sessão segura;
- proteção contra força bruta;
- perfis e permissões;
- revogação;
- auditoria.

## API

- CORS restrito;
- rate limiting;
- validação de entrada;
- queries parametrizadas;
- logs sem segredos;
- erros sem detalhes internos;
- tokens não previsíveis.

## LGPD

- coletar somente dados necessários;
- documentar finalidade;
- limitar retenção;
- não usar dados reais em homologação;
- registrar acessos administrativos.
