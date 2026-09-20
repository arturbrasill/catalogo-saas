# Arquitetura

```text
Domínio
  ↓
Edge / Next.js
  ↓
Tenant Resolver
  ↓
API Apps Script da loja
  ↓
Google Sheets
```

Admin usa a mesma API.

Imagens ficam em provedor externo.

Checkout termina em `wa.me`.

## Isolamento

Cada loja possui:
- tenantId;
- domínio;
- API Apps Script;
- Spreadsheet.

O frontend é compartilhado.
