# PROMPT 03 — VITRINE PÚBLICA

Construa a vitrine pública mobile-first.

## Fluxo

hostname → tenant → API → store/categories/products → interface.

## Interface

Header:
- logo;
- nome;
- busca;
- sacola.

Categorias:
- filtro horizontal;
- Todas;
- categorias ativas.

Produtos:
- grid responsivo;
- imagem;
- nome;
- preço;
- promoção;
- ação de detalhes.

## Detalhes

Modal/drawer com:

- carrossel;
- descrição;
- preço;
- estoque;
- variações;
- seleção obrigatória das variações.

## Sacola

Estado persistente no navegador.

Cada item:

```text
productId
name
image
unitPrice
quantity
variations
subtotal
```

Funções:

`addItem`, `removeItem`, `updateQuantity`, `clearCart`, `getSubtotal`, `getTotalItems`.

## Tema

Aplicar `primary_color` e `secondary_color` via CSS variables.

## Checkout

Não processar pagamento.

Botão:

`Finalizar pelo WhatsApp`

Usar o módulo de WhatsApp.

## Qualidade

Mobile-first, acessibilidade, performance, lazy loading, estados de erro/loading/vazio.

Compatibilidade:
320px, 375px, 390px, 430px, 768px, 1024px, 1440px.
