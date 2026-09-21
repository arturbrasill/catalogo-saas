---
name: api-contract-first
description: Validação rigorosa de contratos de API com Zod e TypeScript, prevenção de quebras e proteção de dados sensíveis.
---

# Skill — API Contract-First & Zod Validation

## Quando usar
- Ao criar novos endpoints de API, rotas de backend ou formulários de entrada no frontend.
- Ao integrar sistemas com provedores externos, bancos NoSQL, Google Sheets ou webhooks.

## Princípios Fundamentais

1. **Validação em Tempo de Execução (*Runtime Validation*)**:
   - Tipagem TypeScript garante segurança durante o desenvolvimento, mas desaparece em tempo de execução.
   - Todo dado vindo de fora (requisições de usuário, respostas de planilhas, parâmetros de URL) deve ser validado via **Zod**.

2. **Zero Segredos no Frontend**:
   - `api_token`, hashes de senha (`admin_password_hash`), chaves privadas e credenciais de provedores NUNCA devem ser enviadas no payload retornado para o navegador do cliente.
   - Filtrar propriedades sensíveis sempre na borda do servidor antes da serialização JSON.

3. **Programação Defensiva (*Sanitization*)**:
   - Dados provenientes de formulários ou planilhas podem chegar como tipos mistos (ex: telefone digitado como número ou string com pontuação).
   - O schema Zod deve sanitizar ou coagir tipos com segurança (ex: `z.string().transform(...)` ou `String(val).trim()`).

4. **Mensagens de Erro Transparentes e Padronizadas**:
   - Respostas de erro da API devem sempre seguir o mesmo formato envelope:
     ```json
     {
       "success": false,
       "data": null,
       "error": {
         "code": "VALIDATION_ERROR",
         "message": "Nome do produto deve ter no mínimo 2 caracteres."
       }
     }
     ```

## Diretrizes de Implementação

### Exemplo de Schema Zod com Validação Estrita
```typescript
import { z } from 'zod';

export const ProductInputSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
  categoriaId: z.string().min(1, 'Categoria é obrigatória'),
  preco: z.coerce.number().positive('Preço deve ser maior que zero'),
  precoPromocional: z.coerce.number().positive().nullable().optional(),
  estoque: z.coerce.number().int().min(-1, 'Estoque deve ser maior ou igual a -1'),
  ativo: z.boolean().default(true),
  imagens: z.array(z.string().url()).default([]),
  variacoes: z.array(z.object({
    tipo: z.string().min(1),
    opcoes: z.array(z.string().min(1)).min(1)
  })).default([])
}).refine((data) => {
  if (data.precoPromocional && data.precoPromocional >= data.preco) {
    return false;
  }
  return true;
}, {
  message: 'Preço promocional deve ser menor que o preço normal',
  path: ['precoPromocional']
});

export type ProductInput = z.infer<typeof ProductInputSchema>;
```

## Definition of Done (DoD)
- Nenhum dado de entrada é salvo no banco de dados ou planilha sem validação Zod prévia.
- Nenhum segredo ou hash de senha é exposto em requisições GET públicas.
- A inferência de tipos TypeScript (`z.infer`) é utilizada para garantir sincronia entre os schemas e os formulários.
