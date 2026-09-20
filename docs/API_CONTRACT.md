# Contrato de API — Google Apps Script Web App

Este documento especifica a especificação estrita da API consumida pelo frontend e pelo painel administrativo do catálogo multi-tenant.

---

## 1. Visão Geral

- **Formato de Comunicação**: JSON (UTF-8).
- **Endpoint Base**: URL da Web App publicada no Google Apps Script (`https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec`).
- **Padrão de Resposta**:
  - Toda requisição HTTP bem-sucedida retorna status 200 com JSON uniforme.
  - Formato de Sucesso:
    ```json
    {
      "success": true,
      "data": { ... },
      "error": null
    }
    ```
  - Formato de Erro:
    ```json
    {
      "success": false,
      "data": null,
      "error": {
        "code": "CODIGO_DO_ERRO",
        "message": "Descrição legível do erro ocorrido."
      }
    }
    ```

---

## 2. Peculiaridades da Plataforma Google Apps Script

1. **Redirecionamento HTTP 302**:
   - As requisições para a URL `/exec` são respondidas pelo Google com status HTTP 302 temporário para `script.googleusercontent.com`.
   - Clientes HTTP (`fetch`, `axios`) devem seguir redirects automaticamente.
2. **Preflight CORS & Método OPTIONS**:
   - O Google Apps Script **não suporta requisições HTTP OPTIONS** (retorna erro caso o browser envie preflight CORS).
   - Para evitar preflights bloqueados:
     - Requisições públicas GET utilizam query strings simples.
     - Requisições POST enviadas diretamente pelo navegador devem enviar `Content-Type: text/plain` contendo o payload em JSON stringificado. O backend processa o payload via `e.postData.contents`.
     - Alternativamente, o frontend Next.js realiza as chamadas server-side (Route Handlers `/api/...`), eliminando restrições de CORS no browser.

---

## 3. Endpoints Públicos (GET)

Acesso irrestrito a vitrines e clientes. Não exige token.

### 3.1 `GET ?action=store`
Retorna as informações e identidade visual pública da loja.

**Query Parameters**:
- `action`: `store`

**Resposta de Sucesso (`data`)**:
```json
{
  "store_id": "loja_exemplo",
  "store_name": "Moda & Estilo Store",
  "logo_url": "https://res.cloudinary.com/demo/image/upload/v1/logo.png",
  "primary_color": "#10b981",
  "secondary_color": "#047857",
  "whatsapp": "5511999999999",
  "domain": "loja-exemplo.com.br",
  "currency": "BRL",
  "timezone": "America/Sao_Paulo"
}
```
*Aviso de Segurança*: Os campos `admin_password_hash` e `api_token` **NUNCA** são retornados neste endpoint.

---

### 3.2 `GET ?action=categories`
Retorna a lista de categorias ativas da loja, ordenadas pelo campo `ordem`.

**Query Parameters**:
- `action`: `categories`

**Resposta de Sucesso (`data`)**:
```json
[
  {
    "id": "cat_1a2b3c",
    "nome": "Camisetas",
    "slug": "camisetas",
    "ativo": true,
    "ordem": 1,
    "createdAt": "2026-09-20T12:00:00.000Z",
    "updatedAt": "2026-09-20T12:00:00.000Z"
  }
]
```

---

### 3.3 `GET ?action=products`
Retorna a lista de produtos ativos que não sofreram exclusão lógica (`deletedAt == null` e `ativo == true`).

**Query Parameters**:
- `action`: `products`
- `categoryId` *(opcional)*: filtra produtos por ID da categoria.

**Resposta de Sucesso (`data`)**:
```json
[
  {
    "id": "prod_7f8a9b",
    "categoriaId": "cat_1a2b3c",
    "nome": "Camiseta Algodão Premium",
    "slug": "camiseta-algodao-premium",
    "descricao": "Camiseta 100% algodão egípcio com toque macio.",
    "preco": 89.90,
    "precoPromocional": 69.90,
    "imagens": [
      "https://res.cloudinary.com/demo/image/upload/v1/cam-preta.png"
    ],
    "variacoes": [
      {
        "tipo": "Tamanho",
        "opcoes": ["P", "M", "G"]
      },
      {
        "tipo": "Cor",
        "opcoes": ["Preto", "Branco"]
      }
    ],
    "estoque": 25,
    "ativo": true,
    "createdAt": "2026-09-20T12:00:00.000Z",
    "updatedAt": "2026-09-20T12:00:00.000Z",
    "deletedAt": null
  }
]
```

---

### 3.4 `GET ?action=all`
Retorna o payload consolidado (`store`, `categories` e `products`) para inicialização de alta performance do catálogo em uma única chamada HTTP.

**Resposta de Sucesso (`data`)**:
```json
{
  "store": { /* Objeto StoreConfig público */ },
  "categories": [ /* Array de categorias */ ],
  "products": [ /* Array de produtos */ ]
}
```

---

## 4. Endpoints Administrativos (POST)

Exigem autenticação ou validação de credencial. Todas as operações de modificação executam sob bloqueio exclusivo do `LockService`.

### 4.1 `POST { "action": "login", ... }`
Valida a senha administrativa e retorna o token de sessão ou confirmação de autorização.

**Payload**:
```json
{
  "action": "login",
  "password": "senha_do_administrador"
}
```

**Resposta de Sucesso (`data`)**:
```json
{
  "authenticated": true,
  "token": "token_gerado_ou_api_token",
  "expiresAt": "2026-09-21T12:00:00.000Z"
}
```

**Erros Comuns**:
- `INVALID_CREDENTIALS`: Senha incorreta.
- `MISSING_PASSWORD`: Campo de senha omitido.

---

### 4.2 `POST { "action": "createProduct", ... }`
Cria um novo produto.

**Headers ou Propriedade no Payload**:
- `token`: token retornado no login ou `api_token` configurado.

**Payload**:
```json
{
  "action": "createProduct",
  "token": "seu_token_aqui",
  "product": {
    "categoriaId": "cat_1a2b3c",
    "nome": "Bermuda Jeans Slim",
    "slug": "bermuda-jeans-slim",
    "descricao": "Bermuda jeans com elastano.",
    "preco": 119.90,
    "precoPromocional": null,
    "imagens": ["https://res.cloudinary.com/demo/image/upload/v1/bermuda.png"],
    "variacoes": [
      {
        "tipo": "Tamanho",
        "opcoes": ["38", "40", "42"]
      }
    ],
    "estoque": 10,
    "ativo": true
  }
}
```

**Resposta de Sucesso (`data`)**:
Objeto do produto criado contendo seu `id` gerado, `createdAt`, `updatedAt` e `deletedAt: null`.

---

### 4.3 `POST { "action": "updateProduct", ... }`
Atualiza dados de um produto existente.

**Payload**:
```json
{
  "action": "updateProduct",
  "token": "seu_token_aqui",
  "product": {
    "id": "prod_7f8a9b",
    "nome": "Camiseta Algodão Premium V2",
    "preco": 99.90,
    "estoque": 30
  }
}
```

**Resposta de Sucesso (`data`)**:
Objeto do produto com as alterações aplicadas e `updatedAt` atualizado.

---

### 4.4 `POST { "action": "deleteProduct", ... }`
Executa exclusão lógica (**soft delete**) do produto especificado.

**Payload**:
```json
{
  "action": "deleteProduct",
  "token": "seu_token_aqui",
  "id": "prod_7f8a9b"
}
```

**Resposta de Sucesso (`data`)**:
```json
{
  "id": "prod_7f8a9b",
  "deleted": true,
  "deletedAt": "2026-09-20T15:30:00.000Z"
}
```

---

### 4.5 `POST { "action": "saveConfig", ... }`
Atualiza configurações visuais e operacionais da loja.

**Payload**:
```json
{
  "action": "saveConfig",
  "token": "seu_token_aqui",
  "config": {
    "store_name": "Novo Nome da Loja",
    "primary_color": "#2563eb",
    "secondary_color": "#1e40af",
    "whatsapp": "5511988887777"
  }
}
```

*Regras de Segurança*:
- A tentativa de alterar as chaves `api_token` ou `store_id` via este endpoint é rejeitada com erro `FORBIDDEN_MODIFICATION`.
- Para alterar a senha, deve ser enviado um comando específico `changePassword` com confirmação da senha antiga.

---

## 5. Tabela de Códigos de Erro

| Código | Descrição |
| :--- | :--- |
| `UNAUTHORIZED` | Token ausente, inválido ou expirado. |
| `INVALID_CREDENTIALS` | Senha incorreta no login. |
| `FORBIDDEN_MODIFICATION` | Tentativa de alterar campos imutáveis de segurança (`store_id`, `api_token`). |
| `VALIDATION_ERROR` | Payload com formato ou campos inválidos (ex.: preço negativo, nome vazio). |
| `NOT_FOUND` | Registro não encontrado (produto ou categoria inexistente). |
| `LOCK_TIMEOUT` | Servidor ocupado com outra escrita concorrente (tente novamente). |
| `INTERNAL_ERROR` | Falha inesperada durante a execução no Google Apps Script. |
| `UNKNOWN_ACTION` | Ação solicitada em `action` não reconhecida. |
