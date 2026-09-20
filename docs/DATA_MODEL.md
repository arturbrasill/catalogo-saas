# Modelo de Dados — Planilha Google Sheets

Cada tenant (loja) possui uma planilha própria no Google Sheets. O schema é dividido em três abas obrigatórias: `config`, `categorias` e `produtos`.

---

## 1. Aba: `config`

Armazena as propriedades fundamentais de parametrização e identidade da loja no formato Chave-Valor.

### Estrutura de Colunas:
| Coluna A | Coluna B |
| :--- | :--- |
| `chave` | `valor` |

### Chaves Obrigatórias & Descrição:

| Chave | Tipo | Descrição | Exposição |
| :--- | :--- | :--- | :--- |
| `store_id` | string | Identificador único do tenant (slug imutável) | Pública |
| `store_name` | string | Nome fantasia da loja | Pública |
| `logo_url` | string | URL HTTPS da imagem da logo | Pública |
| `primary_color` | string | Código hexadecimal da cor primária (ex.: `#10b981`) | Pública |
| `secondary_color` | string | Código hexadecimal da cor secundária (ex.: `#047857`) | Pública |
| `whatsapp` | string | Telefone com DDI e DDD sem pontuação (ex.: `5511999999999`) | Pública |
| `admin_password_hash`| string | Hash SHA-256 com salt da senha de acesso ao `/admin` | **ESTRITAMENTE PRIVADA** |
| `api_token` | string | Token secreto para chamadas administrativas | **ESTRITAMENTE PRIVADA** |
| `domain` | string | Domínio personalizado associado ao catálogo | Pública |
| `currency` | string | Código da moeda ISO (padrão: `BRL`) | Pública |
| `timezone` | string | Fuso horário operacional (padrão: `America/Sao_Paulo`) | Pública |

---

## 2. Aba: `categorias`

Define o agrupamento dos produtos para navegação e filtros da vitrine.

### Estrutura de Colunas:
| Índice | Coluna | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| 1 (A) | `id` | string (UUID) | Sim | Identificador único da categoria |
| 2 (B) | `nome` | string | Sim | Nome de exibição da categoria |
| 3 (C) | `slug` | string | Sim | Slug amigável para URL (ex.: `calcados-esportivos`) |
| 4 (D) | `ativo` | boolean | Sim | `TRUE` ou `FALSE` |
| 5 (E) | `ordem` | number | Sim | Inteiro para ordenação na vitrine (ascendente) |
| 6 (F) | `createdAt` | string (ISO 8601) | Sim | Data e hora de criação |
| 7 (G) | `updatedAt` | string (ISO 8601) | Sim | Data e hora da última modificação |

---

## 3. Aba: `produtos`

Armazena os itens comercializados pela loja, histórico de preços, estoque e variantes.

### Estrutura de Colunas:
| Índice | Coluna | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| 1 (A) | `id` | string (UUID) | Sim | Identificador único do produto |
| 2 (B) | `categoriaId` | string (UUID) | Sim | ID da categoria vinculada |
| 3 (C) | `nome` | string | Sim | Nome de exibição do produto |
| 4 (D) | `slug` | string | Sim | Slug único para identificação |
| 5 (E) | `descricao` | string | Não | Descrição detalhada do produto |
| 6 (F) | `preco` | number | Sim | Preço padrão em centavos ou decimal (ex.: `89.90`) |
| 7 (G) | `precoPromocional`| number | Não | Preço promocional ou vazio/null |
| 8 (H) | `imagens` | string (JSON) | Não | Array JSON de URLs HTTPS de imagens |
| 9 (I) | `variacoes` | string (JSON) | Não | Array JSON contendo as opções configuráveis |
| 10 (J)| `estoque` | number | Sim | Quantidade em estoque (ou -1 se ilimitado) |
| 11 (K)| `ativo` | boolean | Sim | `TRUE` ou `FALSE` |
| 12 (L)| `createdAt` | string (ISO 8601) | Sim | Data e hora de criação |
| 13 (M)| `updatedAt` | string (ISO 8601) | Sim | Data e hora da última alteração |
| 14 (N)| `deletedAt` | string (ISO 8601) | Não | Timestamp do soft delete (vazio se ativo) |

---

## 4. Estrutura do JSON de Variações

O campo `variacoes` armazena uma matriz tipada de variações:

```json
[
  {
    "tipo": "Tamanho",
    "opcoes": ["P", "M", "G", "GG"]
  },
  {
    "tipo": "Cor",
    "opcoes": ["Preto", "Branco", "Azul Marinho"]
  }
]
```

### Regras de Validação do JSON de Variações:
1. Deve ser um array válido serializado.
2. Cada elemento deve conter `tipo` (string não-vazia) e `opcoes` (array de strings não-vazias com pelo menos 1 item).
3. No fechamento da sacola, a escolha do cliente é um mapa de seleções (ex.: `{"Tamanho": "M", "Cor": "Preto"}`).

---

## 5. Estrutura do JSON de Imagens

O campo `imagens` armazena um array de strings contendo URLs válidas:

```json
[
  "https://res.cloudinary.com/demo/image/upload/v1/prod1-front.webp",
  "https://res.cloudinary.com/demo/image/upload/v1/prod1-side.webp"
]
```
- A primeira imagem do array é tratada automaticamente como a foto de capa (thumbnail principal).

---

## 6. Política de Soft Delete e Integridade

1. **Exclusão Lógica**: Registros de produtos nunca são deletados fisicamente da planilha via `deleteRow()`. Em vez disso:
   - A coluna `ativo` é definida como `FALSE`.
   - A coluna `deletedAt` recebe o timestamp ISO do momento da exclusão (`new Date().toISOString()`).
2. **Consultas Públicas**: Filtram automaticamente `deletedAt == null` (ou string vazia) e `ativo === true`.
3. **Auditoria**: O histórico de produtos vendidos ou referenciados no WhatsApp permanece preservado na planilha para fins fiscais e de auditoria da loja.
