# PROMPT 08 — AUDITORIA DE SEGURANÇA

Faça uma auditoria completa.

## Verificar

- secrets no Git;
- secrets no bundle;
- XSS;
- URL injection;
- validação de input;
- autenticação;
- autorização;
- exposição de hash;
- exposição de token;
- upload inseguro;
- redirecionamentos;
- tenant spoofing;
- manipulação de preço no cliente;
- concorrência no Apps Script;
- abuso de endpoints;
- logs com dados sensíveis.

## Regra de preço

O WhatsApp é um fechamento de pedido, não um gateway. Ainda assim, a aplicação deve evitar confiar em dados manipulados pelo cliente para informações críticas.

Documentar limitações e ameaças.

## Entrega

Gerar:

`docs/SECURITY_AUDIT.md`

Classificar problemas como:

CRÍTICO
ALTO
MÉDIO
BAIXO

Corrigir CRÍTICO e ALTO antes de declarar o sistema pronto.
