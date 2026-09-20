# PROMPT 01 — BACKEND GOOGLE SHEETS + APPS SCRIPT

Implemente o backend completo.

## Dados

Abas:

### config
`chave | valor`

Chaves:
`store_id, store_name, logo_url, primary_color, secondary_color, whatsapp, admin_password_hash, api_token, domain, currency, timezone`

### categorias
`id | nome | slug | ativo | ordem | createdAt | updatedAt`

### produtos
`id | categoriaId | nome | slug | descricao | preco | precoPromocional | imagens | variacoes | estoque | ativo | createdAt | updatedAt | deletedAt`

## Requisitos

Criar:

- `doGet(e)`
- `doPost(e)`
- inicialização de banco;
- autenticação;
- autorização;
- CRUD de produtos;
- leitura de categorias;
- leitura pública da loja;
- salvamento de configurações;
- soft delete;
- serialização/deserialização de variações;
- validação;
- respostas padronizadas;
- tratamento de erros;
- logs;
- `LockService`.

## API

GET:
- `?action=store`
- `?action=categories`
- `?action=products`
- `?action=all`

POST:
- `login`
- `createProduct`
- `updateProduct`
- `deleteProduct`
- `saveConfig`

Resposta:

```json
{"success":true,"data":{},"error":null}
```

Erro:

```json
{"success":false,"data":null,"error":{"code":"ERROR_CODE","message":"Mensagem"}}
```

## Segurança

- não retornar hash;
- não retornar secrets;
- validar token em rotas administrativas;
- nunca confiar no frontend;
- não permitir alteração arbitrária do `api_token` ou `store_id`;
- validar URLs;
- limitar payload;
- usar lock nas escritas.

## Entrega

Código executável + documentação + exemplos de requests/responses + instruções de publicação.

Antes de concluir, faça uma revisão de compatibilidade com o frontend planejado.
