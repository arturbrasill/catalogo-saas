/**
 * Motor de Mensagens e URLs do WhatsApp
 * Biblioteca pura em TypeScript — Sem dependência de React.
 */

import type { StoreConfig, CartItem, SelectedVariation, Cart } from '@/types';

export type WhatsAppStoreInfo = {
  store_name: string;
  whatsapp: string | number;
  currency?: string;
};

/**
 * Formata valor monetário de forma consistente e determinística.
 */
export function formatCurrency(amount: number, currency = 'BRL'): string {
  if (isNaN(amount) || !isFinite(amount)) {
    return 'R$ 0,00';
  }

  const rounded = Math.round(amount * 100) / 100;
  const parts = rounded.toFixed(2).split('.');
  const intPart = parts[0] || '0';
  const decPart = parts[1] || '00';

  // Adiciona separador de milhar com ponto
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (currency === 'BRL') {
    return `R$ ${formattedInt},${decPart}`;
  }

  return `${currency} ${formattedInt}.${decPart}`;
}

/**
 * Formata mapa de variações selecionadas para texto no WhatsApp.
 * Ex: { "Tamanho": "M", "Cor": "Preto" } -> "_Tamanho: M | Cor: Preto_"
 */
export function formatVariation(variations?: SelectedVariation | null): string {
  if (!variations || typeof variations !== 'object') {
    return '';
  }

  const entries = Object.entries(variations).filter(
    ([k, v]) => Boolean(k && k.trim()) && Boolean(v && v.trim())
  );

  if (entries.length === 0) {
    return '';
  }

  const formattedPairs = entries.map(([key, val]) => `${key.trim()}: ${val.trim()}`);
  return `_${formattedPairs.join(' | ')}_`;
}

/**
 * Calcula o subtotal de um item considerando preço promocional e quantidade.
 */
export function calculateSubtotal(
  unitPrice: number,
  quantity: number,
  promotionalPrice?: number | null
): number {
  if (quantity <= 0) return 0;

  const effectivePrice =
    typeof promotionalPrice === 'number' && promotionalPrice > 0 && promotionalPrice < unitPrice
      ? promotionalPrice
      : unitPrice;

  if (effectivePrice <= 0) return 0;

  return Math.round(effectivePrice * quantity * 100) / 100;
}

/**
 * Calcula o total consolidado da sacola.
 */
export function calculateCartTotal(items: CartItem[]): number {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }

  const total = items.reduce((acc, item) => {
    const subtotal = calculateSubtotal(
      item.unitPrice,
      item.quantity,
      item.promotionalPrice
    );
    return acc + subtotal;
  }, 0);

  return Math.round(total * 100) / 100;
}

/**
 * Formata um item individual do carrinho com emojis e markdown do WhatsApp.
 */
export function formatCartItem(item: CartItem, index?: number): string {
  const effectivePrice =
    typeof item.promotionalPrice === 'number' &&
    item.promotionalPrice > 0 &&
    item.promotionalPrice < item.unitPrice
      ? item.promotionalPrice
      : item.unitPrice;

  const subtotal = calculateSubtotal(
    item.unitPrice,
    item.quantity,
    item.promotionalPrice
  );

  const prefix = typeof index === 'number' ? `${index}. ` : '• ';
  const lines: string[] = [];

  lines.push(`${prefix}*${item.quantity}x ${item.name.trim()}*`);

  const varStr = formatVariation(item.variations);
  if (varStr) {
    lines.push(`   ${varStr}`);
  }

  if (item.image && typeof item.image === 'string' && item.image.trim()) {
    lines.push(`   📸 Foto: ${item.image.trim()}`);
  }

  if (item.promotionalPrice && item.promotionalPrice < item.unitPrice) {
    lines.push(
      `   _Preço un.: ~${formatCurrency(item.unitPrice)}~ por ${formatCurrency(effectivePrice)}_`
    );
  } else {
    lines.push(`   _Preço un.: ${formatCurrency(effectivePrice)}_`);
  }

  lines.push(`   Subtotal: *${formatCurrency(subtotal)}*`);

  return lines.join('\n');
}

/**
 * Normaliza e valida o número de telefone do WhatsApp.
 * Remove caracteres especiais e valida tamanho.
 */
export function normalizePhoneNumber(
  phone: string | number | null | undefined
): string {
  if (phone === null || phone === undefined || String(phone).trim() === '') {
    throw new Error('Número de WhatsApp não fornecido.');
  }

  const str = String(phone).trim();
  // Remove caracteres não numéricos (+, -, (, ), espaços, etc.)
  let digits = str.replace(/\D/g, '');

  // Remove zeros à esquerda (ex.: 086999999999 -> 86999999999)
  digits = digits.replace(/^0+/, '');

  // Se o número tiver 10 ou 11 dígitos (DDD + 8 ou 9 dígitos no Brasil) e não começar com 55,
  // adiciona automaticamente o DDI 55 do Brasil para garantir que o link wa.me abra no Brasil
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) {
    digits = '55' + digits;
  }

  if (digits.length < 10 || digits.length > 15) {
    throw new Error(
      `Número de WhatsApp inválido: "${phone}". O número deve conter entre 10 e 15 dígitos com DDD (exemplo: (11) 99999-9999 ou 5511999999999).`
    );
  }

  return digits;
}

/**
 * Constrói a mensagem estruturada pronta para envio via WhatsApp.
 */
export function buildWhatsAppMessage(
  store: WhatsAppStoreInfo,
  cartInput: Cart | CartItem[]
): string {
  const items: CartItem[] = Array.isArray(cartInput) ? cartInput : cartInput.items;

  if (!items || items.length === 0) {
    throw new Error('A sacola está vazia. Adicione produtos antes de finalizar o pedido.');
  }

  const storeName = store.store_name ? store.store_name.trim() : 'Loja Digital';
  const total = calculateCartTotal(items);
  const totalItemsCount = items.reduce((acc, item) => acc + (item.quantity || 0), 0);

  const messageParts: string[] = [
    `🛍️ *NOVO PEDIDO — ${storeName.toUpperCase()}*`,
    `Olá! Gostaria de finalizar meu pedido com os itens abaixo:`,
    '',
    '----------------------------------------',
    '🛒 *ITENS DA SACOLA:*',
    '',
  ];

  items.forEach((item, idx) => {
    messageParts.push(formatCartItem(item, idx + 1));
    messageParts.push('');
  });

  messageParts.push('----------------------------------------');
  messageParts.push(`💰 *TOTAL DO PEDIDO: ${formatCurrency(total, store.currency)}*`);
  messageParts.push(`📦 *Quantidade total de itens:* ${totalItemsCount}`);
  messageParts.push('');
  messageParts.push('Por favor, informe a disponibilidade dos itens e opções para entrega!');

  return messageParts.join('\n');
}

/**
 * Constrói a URL final estruturada para redirecionamento ao WhatsApp (wa.me).
 * Utiliza obrigatoriamente encodeURIComponent.
 */
export function buildWhatsAppUrl(
  store: WhatsAppStoreInfo,
  cartInput: Cart | CartItem[]
): string {
  const cleanPhone = normalizePhoneNumber(store.whatsapp);
  const message = buildWhatsAppMessage(store, cartInput);
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
