# PROMPT 04 — MOTOR WHATSAPP

Crie uma biblioteca TypeScript pura, sem dependência de React.

## Funções

- `formatCurrency`
- `formatVariation`
- `formatCartItem`
- `calculateSubtotal`
- `calculateCartTotal`
- `buildWhatsAppMessage`
- `buildWhatsAppUrl`

## Entrada

Store + CartItem[].

## Saída

`https://wa.me/{numero}?text={mensagem}`

## Mensagem

Formato limpo com emojis e caracteres nativos do WhatsApp:

`*negrito*`
`_itálico_`

Incluir:

- produto;
- quantidade;
- preço unitário;
- variações;
- subtotal;
- total.

## Encoding

Obrigatório usar `encodeURIComponent`.

Normalizar telefone removendo:

`+`, espaços, parênteses e hífens.

## Segurança

- validar número;
- não aceitar esquemas arbitrários;
- não gerar HTML;
- tratar dados externos como não confiáveis.

## Testes

- vazio;
- um item;
- vários itens;
- variações;
- acentos;
- emojis;
- promoção;
- quantidade;
- telefone inválido;
- valores monetários.

Integrar com catálogo e criar testes unitários.
