# PROMPT 05 — MULTI-TENANT + DOMÍNIOS

Implemente resolução de tenant.

## Fluxo

`hostname → tenantId → apiUrl → store`

## Registro

Criar uma estrutura segura para:

```json
{
  "loja-a.com.br": {
    "tenantId": "loja_a",
    "apiUrl": "https://script.google.com/..."
  }
}
```

Não armazenar secrets.

## Middleware

Implementar `middleware.ts` ou solução Edge equivalente.

Normalizar:

- hostname;
- porta;
- `www`.

Suportar localhost.

## Segurança

O cliente não pode escolher arbitrariamente:

- tenant;
- API;
- redirect.

Somente tenants registrados podem ser resolvidos.

## Escala

Documentar evolução de arquivo estático para KV/Edge Config/Cloudflare KV ou banco.

## DNS

Documentar Registro.br e Cloudflare.

Explicar:

- CNAME;
- A;
- TTL;
- HTTPS;
- propagação;
- domínio raiz;
- `www`.

Não instruir o cliente a apontar domínio diretamente para Apps Script.

## Entrega

Código, tipos, registro de tenants, documentação e testes.
