# Especificação Técnica — Motor de WhatsApp (v1.0.0)

O Motor de WhatsApp (`src/lib/whatsapp.ts`) é uma biblioteca TypeScript pura, sem dependência de React ou de qualquer framework de UI. Ela é responsável pela formatação monetária, cálculo exato de subtotais e totais da sacola, sanitização de números telefônicos e montagem estruturada de mensagens codificadas para fechamento de pedidos via link nativo `wa.me`.

---

## 1. Funções Exportadas

### 1.1 `formatCurrency(amount: number, currency = 'BRL'): string`
Formata valores numéricos em moeda de maneira determinística, segura contra `NaN` e compatível com o padrão monetário brasileiro (separador decimal com vírgula e milhar com ponto).
- Exemplo: `89.9` -> `"R$ 89,90"`
- Exemplo: `1250.5` -> `"R$ 1.250,50"`

### 1.2 `formatVariation(variations?: SelectedVariation | null): string`
Converte o mapa de opções selecionadas pelo cliente em texto formatado em itálico para o WhatsApp.
- Exemplo: `{ "Tamanho": "M", "Cor": "Preto" }` -> `"_Tamanho: M | Cor: Preto_"`

### 1.3 `calculateSubtotal(unitPrice: number, quantity: number, promotionalPrice?: number | null): number`
Calcula o subtotal de uma linha da sacola.
- Prioriza o `promotionalPrice` quando este for válido, positivo e estritamente menor que o `unitPrice`.
- Retorna valor arredondado em 2 casas decimais (`Math.round(val * 100) / 100`).

### 1.4 `calculateCartTotal(items: CartItem[]): number`
Calcula o somatório de todos os subtotais da sacola de compras.

### 1.5 `formatCartItem(item: CartItem, index?: number): string`
Gera o bloco textual estruturado de um item individual da sacola com markdown do WhatsApp (`*negrito*` para quantidade e nome, `_itálico_` para variações e preços unitários, e valor riscado `~R$ XX,XX~` em caso de promoção).

### 1.6 `normalizePhoneNumber(phone: string): string`
Remove caracteres não numéricos (`+`, `-`, `(`, `)`, espaços).
- Valida se o número resultante possui entre 10 e 15 dígitos.
- Lança exceção amigável caso o número seja inválido ou incompleto.

### 1.7 `buildWhatsAppMessage(store: WhatsAppStoreInfo, cart: Cart | CartItem[]): string`
Monta a mensagem completa e organizada do pedido contendo:
- Cabeçalho com o nome da loja e emojis estruturados;
- Lista numerada de itens com quantidade, nome, variações e preços;
- Subtotais e total geral da sacola;
- Mensagem de encerramento solicitando confirmação de entrega e pagamento direto ao lojista.

### 1.8 `buildWhatsAppUrl(store: WhatsAppStoreInfo, cart: Cart | CartItem[]): string`
Normaliza o telefone da loja, gera a mensagem estruturada e aplica **obrigatoriamente** `encodeURIComponent(message)`.
- Retorna a URL final: `https://wa.me/{numero_sanitizado}?text={mensagem_codificada}`.

---

## 2. Exemplo Real de Mensagem Gerada

```text
🛍️ *NOVO PEDIDO — MODA & ESTILO STORE*
Olá! Gostaria de finalizar meu pedido com os itens abaixo:

----------------------------------------
🛒 *ITENS DA SACOLA:*

1. *2x Camiseta Algodão Egípcio*
   _Tamanho: M | Cor: Preto_
   _Preço un.: R$ 89,90_
   Subtotal: *R$ 179,80*

2. *1x Bermuda Sarja Confort*
   _Tamanho: 42_
   _Preço un.: ~R$ 120,00~ por R$ 99,00_
   Subtotal: *R$ 99,00*

----------------------------------------
💰 *TOTAL DO PEDIDO: R$ 278,80*
📦 *Quantidade total de itens:* 3

Por favor, informe a disponibilidade dos itens e opções para entrega!
```

---

## 3. Cobertura de Testes Automatizados

A biblioteca possui 100% de cobertura nos testes unitários em `tests/whatsapp.test.ts`:
1. Carrinho vazio (lançamento de erro preventivo);
2. Um produto na sacola;
3. Vários produtos e consolidação de totais;
4. Formatação de múltiplas variações;
5. Aplicação correta de preços promocionais;
6. Múltiplas quantidades com multiplicação exata;
7. Codificação e preservação de caracteres especiais e acentuação (`Açaí & Café Gourmet com Maçã / Canela`);
8. Preservação e integridade de emojis (`👟`, `🚀`, `⭐`, `🛍️`, `💰`);
9. Normalização e rejeição de telefones inválidos.
