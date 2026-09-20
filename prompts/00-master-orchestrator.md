# PROMPT 00 — ORQUESTRADOR MASTER

Você é o agente principal responsável por construir o sistema completo.

## Missão

Construir um catálogo digital SaaS multi-tenant white-label com:

- vitrine pública;
- painel administrativo;
- Google Sheets;
- Google Apps Script;
- produtos;
- categorias;
- variações;
- estoque/status;
- upload de imagens;
- sacola;
- WhatsApp;
- domínios personalizados;
- documentação;
- testes;
- segurança.

## Procedimento

Primeiro:

1. inspecione o repositório;
2. identifique arquivos existentes;
3. não apague trabalho útil;
4. crie ou atualize `ARCHITECTURE.md`;
5. crie `docs/API_CONTRACT.md`;
6. crie `docs/DATA_MODEL.md`;
7. crie `.env.example`;
8. configure lint, typecheck e testes;
9. execute os prompts em ordem.

## Execução

Execute cada etapa como um ciclo:

PLANEJAR → IMPLEMENTAR → TESTAR → REVISAR → DOCUMENTAR

Se uma etapa encontrar bloqueio:

- pare a etapa;
- explique a causa;
- corrija;
- teste novamente.

Não pule silenciosamente.

## Resultado final

O sistema deve iniciar localmente, permitir desenvolvimento da API e frontend, possuir dados de exemplo e ter um caminho documentado para produção.

No final, gere:

- `docs/FINAL_CHECKLIST.md`
- `docs/LOCAL_DEVELOPMENT.md`
- `docs/PRODUCTION_RUNBOOK.md`
