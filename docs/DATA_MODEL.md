# Modelo de Dados — Planilha Google Sheets (v1.1.0)

Cada tenant (loja) possui uma planilha própria no Google Sheets. O schema é dividido em três abas essenciais: `config`, `categorias` e `produtos`.

Todas as abas contam com a primeira linha congelada (`setFrozenRows(1)`) e cabeçalhos em negrito.

---

## 1. Aba: `config`

Armazena as propriedades fundamentais de identidade visual e parametrização operacional no formato Chave-Valor.

### Estrutura de Colunas:
| Coluna A | Coluna B |
| :--- | :--- |
| `chave` | `valor` |

### Chaves da Planilha:

| Chave | Tipo | Descrição | Exposição Pública | Modificável via `saveConfig` |
| :--- | :--- | :--- | :--- | :--- |
| `store_id` | string | Identificador único do tenant | **Sim** | **NÃO (Imutável)** |
| `store_name` | string | Nome fantasia da loja | **Sim** | Sim |
| `logo_url` | string | URL HTTPS da imagem da logo | **Sim** | Sim |
| `primary_color` | string | Cor primária hexadecimal (ex.: `#10b981`) | **Sim** | Sim |
| `secondary_color` | string | Cor secundária hexadecimal (ex.: `#047857`) | **Sim** | Sim |
| `whatsapp` | string | Telefone sanitizado com DDI e DDD (ex.: `5511999999999`) | **Sim** | Sim |
| `admin_password_hash`| string | Hash SHA-256 com salt da senha do `/admin` | **NÃO (Confidencial)** | **NÃO (Imutável via saveConfig)** |
| `api_token` | string | Token administrativo para mutações | **NÃO (Confidencial)** | **NÃO (Imutável via saveConfig)** |
| `domain` | string | Domínio personalizado associado ao catálogo | **Sim** | Sim |
| `currency` | string | Código ISO da moeda (padrão: `BRL`) | **Sim** | Sim |
| `timezone` | string | Fuso horário operacional (padrão: `America/Sao_Paulo`) | **Sim** | Sim |

---

## 2. Aba: `categorias`

Define o agrupamento dos produtos para filtros e navegação da vitrine.

### Estrutura de Colunas:
| Coluna | Campo | Tipo | Descrição |
| :--- | :--- | :--- | :--- |
| 1 (A) | `id` | string (UUID) | Identificador único da categoria (ex: `cat_a1b2c3d4`) |
| 2 (B) | `nome` | string | Nome de exibição da categoria |
| 3 (C) | `slug` | string | Slug para URL (ex: `calcados-esportivos`) |
| 4 (D) | `ativo` | boolean | `TRUE` ou `FALSE` |
| 5 (E) | `ordem` | number | Inteiro para ordenação visual na vitrine |
| 6 (F) | `createdAt` | string (ISO 8601) | Timestamp de criação |
| 7 (G) | `updatedAt` | string (ISO 8601) | Timestamp da última modificação |

---

## 3. Aba: `produtos`

Armazena os itens disponíveis no catálogo, histórico de preços, estoque e variantes.

### Estrutura de Colunas:
| Coluna | Campo | Tipo | Descrição |
| :--- | :--- | :--- | :--- |
| 1 (A) | `id` | string (UUID) | Identificador único do produto (ex: `prod_7f8a9b1c2d3e`) |
| 2 (B) | `categoriaId` | string (UUID) | ID de uma categoria existente e ativa |
| 3 (C) | `nome` | string | Nome do produto |
| 4 (D) | `slug` | string | Identificador textual amigável para URL |
| 5 (E) | `descricao` | string | Descrição completa do produto |
| 6 (F) | `preco` | number | Preço regular em reais (> 0) |
| 7 (G) | `precoPromocional` | number / null | Preço promocional (> 0 e estritamente < preco) |
| 8 (H) | `imagens` | string (JSON) | Array JSON de URLs públicas de imagens |
| 9 (I) | `variacoes` | string (JSON) | Array JSON tipado de variações |
| 10 (J)| `estoque` | number | Quantidade disponível (inteiro >= -1; -1 = ilimitado) |
| 11 (K)| `ativo` | boolean | `TRUE` ou `FALSE` |
| 12 (L)| `createdAt` | string (ISO 8601) | Data/hora de inclusão |
| 13 (M)| `updatedAt` | string (ISO 8601) | Data/hora da última alteração |
| 14 (N)| `deletedAt` | string (ISO 8601) | Timestamp do soft delete (vazio se não deletado) |

---

## 4. Regras de Integridade e Validação

1. **Integridade Referencial**: Nenhum produto pode ser criado ou atualizado com `categoriaId` inexistente ou cuja categoria esteja desativada.
2. **Preço Promocional Coerente**: O `precoPromocional` deve ser estritamente menor que `preco`.
3. **Estoque Valido**: O `estoque` deve ser um número inteiro maior ou igual a `-1` (onde `-1` representa estoque infinito ou sob encomenda).
4. **Variações Estritas**: O JSON de variações deve conter uma lista de objetos com `tipo` (string não-vazia) e `opcoes` (array com pelo menos 1 string não-vazia).
5. **Soft Delete**: Produtos ou categorias excluídos nunca são apagados fisicamente das linhas da planilha, assegurando rastreabilidade de pedidos realizados no WhatsApp.
