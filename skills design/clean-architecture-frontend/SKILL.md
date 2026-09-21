---
name: clean-architecture-frontend
description: Arquitetura limpa para frontend moderno com Next.js, separação estrita de camadas e isolamento de regras de negócio.
---

# Skill — Clean Architecture Frontend

## Quando usar
- Ao desenhar novos módulos, refatorar páginas complexas ou estruturar a pasta `src/`.
- Ao evitar que componentes visuais acumulem regras de negócio, cálculos fiscais ou requisições de rede diretas.

## Princípios Fundamentais

1. **Separação Rígida de Camadas**:
   - **UI Layer (`src/components/`)**: Componentes puramente visuais e declarativos. Devem apenas receber props, disparar callbacks de evento e renderizar JSX.
   - **State & Custom Hooks (`src/lib/` ou `src/hooks/`)**: Gerenciamento de estado, ciclo de vida e coordenação de fluxo (ex: `useCart`, `useAuth`).
   - **API / Infrastructure Layer (`src/lib/api.ts`)**: Comunicação HTTP, proxies, tratamento de rede e mapeamento de headers.
   - **Domain & Schemas (`src/types/`, `src/lib/schemas.ts`)**: Definição de contratos, tipos TypeScript puros e validações Zod.

2. **Componentes Não Conhecem Detalhes de Persistência**:
   - Componentes React não devem saber se os dados vêm de Google Sheets, PostgreSQL, Supabase ou mock em memória.
   - Devem consumir apenas interfaces abstratas e métodos tipados (`api.getAll()`, `api.createProduct()`).

3. **Funções Puras e Testáveis**:
   - Regras de cálculo (subtotais, descontos percentuais, formatação de moedas, geração de URLs de WhatsApp) devem ser funções puras extraídas para módulos utilitários.
   - Funções puras possuem 100% de previsibilidade e são testadas em milissegundos sem necessidade de emular o DOM.

## Arquitetura de Pastas Recomendada

```text
src/
├── app/              # Rotas, páginas e layouts Next.js (App Router)
├── components/       # Componentes de apresentação organizados por contexto (catalog, admin, ui)
├── lib/              # Infraestrutura (api client, auth, cart context, schemas Zod, formatters)
├── types/            # Contratos de domínio e interfaces TypeScript compartilhadas
└── backend/          # Motores e adapters de persistência desacoplados
```

## Exemplo de Extração de Regra de Negócio

❌ **Incorreto (Lógica acoplada no componente JSX):**
```tsx
// Dentro do componente de UI:
<span>R$ {(product.preco * quantity - (product.precoPromocional ? (product.preco - product.precoPromocional) * quantity : 0)).toFixed(2)}</span>
```

✅ **Correto (Função pura desacoplada e testada):**
```tsx
// No módulo lib/whatsapp.ts ou lib/pricing.ts:
export function calculateSubtotal(price: number, quantity: number, promoPrice?: number | null): number {
  const unit = promoPrice && promoPrice < price ? promoPrice : price;
  return unit * quantity;
}

// No componente JSX:
<span>{formatCurrency(calculateSubtotal(product.preco, quantity, product.precoPromocional), store.currency)}</span>
```

## Definition of Done (DoD)
- Nenhum componente visual executa `fetch()` diretamente sem passar por camada de serviço (`api`).
- Todas as funções de cálculo de negócio estão isoladas com testes unitários cobrindo casos de borda.
- Não existem `any` soltos ou tipagens implícitas.
