# Contrato de API — Google Apps Script Web App & Gateway Proxy (v1.2.0)

Este documento especifica o contrato estrito da API consumida pelo frontend da vitrine e pelo painel administrativo do catálogo multi-tenant.

---

## 1. Visão Geral da API & Arquitetura Gateway

- **Protocolo**: HTTP / HTTPS (JSON UTF-8).
- **Endpoint do Backend Remoto**: URL da Web App publicada no Google Apps Script (`https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec`).
- **Gateway Proxy Multi-Tenant (`/api/backend`)**:
  - Todo o tráfego do navegador consome o endpoint local `/api/backend` do Next.js.
  - O Middleware do Next.js intercepta o `Host`, resolve o tenant no registro e injeta de forma segura os cabeçalhos:
    - `x-tenant-id`: Identificador canônico do tenant (ex.: `loja_exemplo`).
    - `x-tenant-api-url`: URL do Apps Script associado ao tenant.
  - O Route Handler `/api/backend` atua como gateway server-side, repassando requisições ao Google Apps Script correspondente, seguindo redirecionamentos HTTP 302 de forma transparente e blindando o frontend contra bloqueios de preflight CORS.
  - Em ambiente de testes ou desenvolvimento local sem URL remota, o gateway despacha automaticamente para instâncias isoladas em memória do `BackendEngine`.
- **Segurança & CORS**:
  - GET: Requisições simples com parâmetros na query string.
  - POST: Suporte a `application/json` e `text/plain` contendo a string JSON no corpo (evitando bloqueios de preflight CORS no navegador).
  - Todas as mutações operam sob bloqueio atômico com `LockService.getScriptLock().tryLock(30000)`.
- **Formato Uniforme de Resposta**:
  - **Sucesso**:
    ```json
    {
      "success": true,
      "data": { ... },
      "error": null
    }
    ```
  - **Erro**:
    ```json
    {
      "success": false,
      "data": null,
      "error": {
        "code": "CODIGO_DO_ERRO",
        "message": "Descrição amigável do erro."
      }
    }
    ```

---

## 2. Endpoints Públicos (GET)

Acessíveis a clientes e vitrines sem necessidade de token.

### 2.1 `GET ?action=store`
Retorna as informações e identidade visual pública da loja.

**Exemplo de Resposta**:
```json
{
  "success": true,
  "data": {
    "store_id": "loja_exemplo",
    "store_name": "Minha Loja Digital",
    "logo_url": "https://images.unsplash.com/photo-example.jpg",
    "primary_color": "#10b981",
    "secondary_color": "#047857",
    "whatsapp": "5511999999999",
    "domain": "loja-exemplo.com.br",
    "currency": "BRL",
    "timezone": "America/Sao_Paulo"
  },
  "error": null
}
```
*Garantia de Segurança*: Campos confidenciais (`admin_password_hash` e `api_token`) **nunca** são retornados.

---

### 2.2 `GET ?action=categories`
Retorna a lista de categorias ativas da loja, ordenadas crescentemente pelo campo `ordem`.

**Exemplo de Resposta**:
```json
{
  "success": true,
  "data": [
    {
      "id": "cat_geral",
      "nome": "Geral",
      "slug": "geral",
      "ativo": true,
      "ordem": 1,
      "createdAt": "2026-09-20T12:00:00.000Z",
      "updatedAt": "2026-09-20T12:00:00.000Z"
    }
  ],
  "error": null
}
```

---

### 2.3 `GET ?action=products`
Retorna a lista de produtos ativos (que não sofreram soft delete e cuja categoria também está ativa).

**Query Parameters Opcionais**:
- `categoryId`: Filtra produtos pertencentes a uma categoria específica.

**Exemplo de Resposta**:
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_7f8a9b1c2d3e",
      "categoriaId": "cat_geral",
      "nome": "Camisa Polo Confort",
      "slug": "camisa-polo-confort",
      "descricao": "Polo 100% algodão piquet com toque macio.",
      "preco": 99.90,
      "precoPromocional": 79.90,
      "imagens": [
        "https://cdn.example.com/polo-azul.jpg"
      ],
      "variacoes": [
        {
          "tipo": "Tamanho",
          "opcoes": ["P", "M", "G"]
        },
        {
          "tipo": "Cor",
          "opcoes": ["Azul", "Branco"]
        }
      ],
      "estoque": 20,
      "ativo": true,
      "createdAt": "2026-09-20T12:00:00.000Z",
      "updatedAt": "2026-09-20T12:00:00.000Z",
      "deletedAt": null
    }
  ],
  "error": null
}
```

---

### 2.4 `GET ?action=all`
Retorna o payload consolidado (`store`, `categories` e `products`) para inicialização de alta velocidade em requisição única.

**Exemplo de Resposta**:
```json
{
  "success": true,
  "data": {
    "store": { /* Objeto StoreConfig público */ },
    "categories": [ /* Array de categorias ativas */ ],
    "products": [ /* Array de produtos ativos */ ]
  },
  "error": null
}
```

---

## 3. Endpoints Administrativos (POST)

Exigem autenticação com `token` (retornado no login). Operam sob bloqueio exclusivo do `LockService`.

### 3.1 `POST` com `action: "login"`
Autentica o administrador através da senha e retorna confirmação com token.

**Request Payload**:
```json
{
  "action": "login",
  "password": "sua_senha_secreta"
}
```

**Response de Sucesso**:
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "token": "tok_mock_default_1234567890"
  },
  "error": null
}
```

**Response de Erro (Senha incorreta)**:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Senha incorreta."
  }
}
```

---

### 3.2 `POST` com `action: "createProduct"`
Cria um novo produto.

**Regras de Validação**:
- `categoriaId`: Obrigatória e deve existir e estar ativa na aba `categorias`.
- `nome`: String não vazia (mínimo 2 caracteres).
- `preco`: Número decimal estritamente positivo (> 0).
- `precoPromocional`: Se informado, deve ser menor que `preco`.
- `estoque`: Número inteiro >= -1 (-1 indica estoque sob encomenda/ilimitado).
- `variacoes`: Array de objetos `{ "tipo": "...", "opcoes": ["..."] }`.

**Request Payload**:
```json
{
  "action": "createProduct",
  "token": "tok_mock_default_1234567890",
  "product": {
    "categoriaId": "cat_geral",
    "nome": "Bermuda Jeans Slim",
    "slug": "bermuda-jeans-slim",
    "descricao": "Bermuda jeans masculina com elastano.",
    "preco": 119.90,
    "precoPromocional": 99.90,
    "imagens": [
      "https://cdn.example.com/bermuda1.jpg"
    ],
    "variacoes": [
      {
        "tipo": "Tamanho",
        "opcoes": ["38", "40", "42"]
      }
    ],
    "estoque": 15,
    "ativo": true
  }
}
```

**Response de Sucesso**:
```json
{
  "success": true,
  "data": {
    "id": "prod_a1b2c3d4e5f6",
    "categoriaId": "cat_geral",
    "nome": "Bermuda Jeans Slim",
    "slug": "bermuda-jeans-slim",
    "descricao": "Bermuda jeans masculina com elastano.",
    "preco": 119.90,
    "precoPromocional": 99.90,
    "imagens": ["https://cdn.example.com/bermuda1.jpg"],
    "variacoes": [{ "tipo": "Tamanho", "opcoes": ["38", "40", "42"] }],
    "estoque": 15,
    "ativo": true,
    "createdAt": "2026-09-20T15:45:00.000Z",
    "updatedAt": "2026-09-20T15:45:00.000Z",
    "deletedAt": null
  },
  "error": null
}
```

---

### 3.3 `POST` com `action: "updateProduct"`
Atualiza campos de um produto existente. Preserva campos não enviados e atualiza `updatedAt`.

**Request Payload**:
```json
{
  "action": "updateProduct",
  "token": "tok_mock_default_1234567890",
  "product": {
    "id": "prod_a1b2c3d4e5f6",
    "preco": 109.90,
    "estoque": 12
  }
}
```

---

### 3.4 `POST` com `action: "deleteProduct"`
Executa exclusão lógica (**soft delete**). Não remove a linha da planilha; preenche `deletedAt` com timestamp ISO e marca `ativo = false`.

**Request Payload**:
```json
{
  "action": "deleteProduct",
  "token": "tok_mock_default_1234567890",
  "id": "prod_a1b2c3d4e5f6"
}
```

**Response de Sucesso**:
```json
{
  "success": true,
  "data": {
    "id": "prod_a1b2c3d4e5f6",
    "deleted": true,
    "deletedAt": "2026-09-20T15:47:00.000Z"
  },
  "error": null
}
```

---

### 3.5 `POST` com `action: "createCategory"`
Cria uma nova categoria para classificação de produtos.

**Request Payload**:
```json
{
  "action": "createCategory",
  "token": "tok_mock_default_1234567890",
  "category": {
    "nome": "Calçados & Tênis",
    "slug": "calcados-tenis",
    "ordem": 2,
    "ativo": true
  }
}
```

---

### 3.6 `POST` com `action: "updateCategory"`
Atualiza dados de uma categoria existente.

**Request Payload**:
```json
{
  "action": "updateCategory",
  "token": "tok_mock_default_1234567890",
  "category": {
    "id": "cat_geral",
    "nome": "Coleção Principal",
    "ordem": 1
  }
}
```

---

### 3.7 `POST` com `action: "deleteCategory"`
Desativa uma categoria via exclusão lógica (`ativo = false`).

**Request Payload**:
```json
{
  "action": "deleteCategory",
  "token": "tok_mock_default_1234567890",
  "id": "cat_antiga"
}
```

---

### 3.8 `POST` com `action: "saveConfig"`
Atualiza propriedades visuais e operacionais da loja.

**Regra de Segurança**:
- Tentativas de enviar `store_id`, `api_token` ou `admin_password_hash` são **bloqueadas e rejeitadas** com erro `FORBIDDEN_MODIFICATION`.

**Request Payload**:
```json
{
  "action": "saveConfig",
  "token": "tok_mock_default_1234567890",
  "config": {
    "store_name": "Nova Elegância Boutique",
    "primary_color": "#059669",
    "secondary_color": "#064e3b",
    "whatsapp": "5511988887777"
  }
}
```

---

## 4. Tabela de Códigos de Erro

| Código de Erro | Causa / Descrição |
| :--- | :--- |
| `UNAUTHORIZED` | Token de autorização ausente, inválido ou expirado. |
| `INVALID_CREDENTIALS` | Senha de login incorreta. |
| `MISSING_PASSWORD` | Campo de senha não fornecido na ação de login. |
| `FORBIDDEN_MODIFICATION` | Tentativa de adulterar chaves imutáveis de segurança (`store_id`, `api_token`, `admin_password_hash`). |
| `VALIDATION_ERROR` | Violação de regra de negócio (ex.: preço negativo, preço promocional >= preço normal, estoque < -1, variações sem opções). |
| `NOT_FOUND` | Registro não encontrado (ID de produto ou categoria inexistente). |
| `INVALID_PAYLOAD` | Corpo da requisição ausente ou JSON sintaticamente malformado. |
| `LOCK_TIMEOUT` | Planilha bloqueada por outra escrita concorrente após 30 segundos. |
| `UNKNOWN_ACTION` | Parâmetro `action` não reconhecido pelo roteador da API. |
| `INTERNAL_ERROR` | Falha interna no ambiente Google Apps Script. |
