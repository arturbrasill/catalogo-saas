---
name: testing-vitest-playwright
description: Estratégia de testes de regressão, testes unitários ultrarrápidos com Vitest e validação de fluxos críticos de ponta a ponta.
---

# Skill — Testes de UI & Regressão Automatizada

## Quando usar
- Antes de finalizar qualquer modificação no código, novos componentes ou rotas de API.
- Ao adicionar novas regras de negócio para garantir que funcionalidades anteriores não foram quebradas.

## Princípios Fundamentais

1. **Testes como Rede de Segurança Contínua**:
   - Nenhuma funcionalidade é considerada concluída sem testes automatizados que comprovem seu funcionamento.
   - Os testes devem rodar em poucos segundos para incentivar execução frequente.

2. **Foco nos Fluxos Críticos de Negócio**:
   - Priorizar testes nas jornadas que geram receita e conversão:
     1. Adição e remoção de itens na sacola de compras;
     2. Validação obrigatória de variações de produto (tamanho, cor);
     3. Cálculo exato de subtotais e preços promocionais;
     4. Formatação e abertura correta do link do WhatsApp (`wa.me`);
     5. Autenticação administrativa e proteção de rotas privadas.

3. **Determinismo e Isolamento**:
   - Cada teste deve ser autossuficiente (`beforeEach` redefinindo o estado inicial).
   - Testes não devem depender de ordem de execução ou de chamadas de rede externas instáveis (usar mocks ou engines em memória).

## Diretrizes de Implementação

### Estrutura de Testes com Vitest
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { calculateSubtotal, buildWhatsAppUrl } from '@/lib/whatsapp';

describe('Cálculo de Subtotal & WhatsApp URL', () => {
  it('deve aplicar preço promocional quando for menor que o preço original', () => {
    const subtotal = calculateSubtotal(100.0, 2, 79.9);
    expect(subtotal).toBeCloseTo(159.8, 2);
  });

  it('deve ignorar preço promocional quando for maior que o preço normal', () => {
    const subtotal = calculateSubtotal(100.0, 1, 120.0);
    expect(subtotal).toBe(100.0);
  });

  it('deve gerar URL do WhatsApp com número sanitizado e itens codificados', () => {
    const url = buildWhatsAppUrl(
      { store_name: 'Loja Teste', whatsapp: '5511999998888', currency: 'BRL' },
      [{ productId: 'p1', name: 'Camiseta', quantity: 2, unitPrice: 50, subtotal: 100, variations: { Tamanho: 'M' } }]
    );
    expect(url).toContain('https://wa.me/5511999998888');
    expect(url).toContain(encodeURIComponent('Camiseta'));
    expect(url).toContain(encodeURIComponent('Tamanho: M'));
  });
});
```

### Comandos de Verificação
- Executar testes uma vez: `npm test`
- Executar testes em modo watch contínuo: `npm run test:watch`
- Verificar integridade de tipos: `npm run typecheck`
- Verificar conformidade de linter: `npm run lint`

## Definition of Done (DoD)
- 100% dos testes unitários e de integração passam sem falhas (`npm test`).
- Casos de borda (estoque zerado, carrinho vazio, valores nulos) estão cobertos por testes.
- O tempo total de execução da suíte unitária permanece inferior a 5 segundos.
