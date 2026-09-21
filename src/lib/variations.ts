import type { VariationOption, SelectedVariation } from '@/types';
import { formatCurrency } from '@/lib/whatsapp';

export interface VariationValueObject {
  nome: string;
  preco?: number;
  precoAdicional?: number;
  corHex?: string;
}

export interface ParsedVariationOption {
  raw: string | VariationValueObject;
  cleanLabel: string;
  priceDelta: number;
  fixedPrice?: number;
  displayBadge?: string;
  corHex?: string;
}

/**
 * Mapeamento de cores populares em português para renderização visual
 */
const COLOR_HEX_MAP: Record<string, string> = {
  preto: '#18181b',
  black: '#18181b',
  branco: '#ffffff',
  white: '#ffffff',
  cinza: '#71717a',
  gray: '#71717a',
  grafite: '#3f3f46',
  azul: '#2563eb',
  'azul marinho': '#1e3a8a',
  'azul escuro': '#1e3a8a',
  'azul claro': '#38bdf8',
  vermelho: '#dc2626',
  red: '#dc2626',
  vinho: '#831843',
  bordo: '#831843',
  bordô: '#831843',
  rosa: '#ec4899',
  pink: '#ec4899',
  rose: '#fb7185',
  rosê: '#fb7185',
  verde: '#16a34a',
  'verde militar': '#3f6212',
  'verde musgo': '#3f6212',
  'verde esmeralda': '#059669',
  amarelo: '#eab308',
  yellow: '#eab308',
  mostarda: '#ca8a04',
  laranja: '#f97316',
  orange: '#f97316',
  marrom: '#78350f',
  brown: '#78350f',
  bege: '#d4b996',
  nude: '#e7d3c1',
  creme: '#fef3c7',
  offwhite: '#fafaf9',
  'off white': '#fafaf9',
  dourado: '#eab308',
  prata: '#94a3b8',
  roxo: '#9333ea',
  lilas: '#c084fc',
  lilás: '#c084fc',
  caramelo: '#b45309',
};

/**
 * Detecta o código HEX de uma cor pelo nome da opção
 */
export function getColorHex(colorName: string): string | null {
  if (!colorName) return null;
  const clean = colorName.trim().toLowerCase();
  return COLOR_HEX_MAP[clean] || null;
}

/**
 * Identifica se a variação é de cores
 */
export function isColorVariation(tipo: string): boolean {
  if (!tipo) return false;
  const t = tipo.trim().toLowerCase();
  return t === 'cor' || t === 'cores' || t === 'color' || t === 'colour';
}

function parseCurrencyNumber(numStr: string): number {
  const clean = numStr.trim();
  if (clean.includes(',')) {
    // Formato brasileiro: 1.250,50 ou 15,50
    return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
  }
  // Formato com ponto: 15.50 ou 15
  return parseFloat(clean);
}

/**
 * Converte e analisa uma opção de variação extraindo nome limpo e preço adicional ou fixo
 * Exemplo de entradas suportadas:
 * - "P" -> label: "P", delta: 0
 * - "GG (+R$ 10,00)" -> label: "GG", delta: 10
 * - "GG (+15)" -> label: "GG", delta: 15
 * - "GG (+ R$ 12,50)" -> label: "GG", delta: 12.50
 * - "128GB: R$ 899,00" -> label: "128GB", fixedPrice: 899
 * - { nome: "GG", precoAdicional: 10 } -> label: "GG", delta: 10
 */
export function parseVariationOption(
  rawOption: string | VariationValueObject,
  currency = 'BRL'
): ParsedVariationOption {
  if (typeof rawOption === 'object' && rawOption !== null) {
    const cleanLabel = rawOption.nome?.trim() || '';
    const priceDelta = typeof rawOption.precoAdicional === 'number' ? rawOption.precoAdicional : 0;
    const fixedPrice = typeof rawOption.preco === 'number' ? rawOption.preco : undefined;
    const corHex = rawOption.corHex || getColorHex(cleanLabel) || undefined;

    let displayBadge: string | undefined;
    if (priceDelta > 0) {
      displayBadge = `+ ${formatCurrency(priceDelta, currency)}`;
    } else if (typeof fixedPrice === 'number') {
      displayBadge = formatCurrency(fixedPrice, currency);
    }

    return {
      raw: rawOption,
      cleanLabel,
      priceDelta,
      fixedPrice,
      displayBadge,
      corHex,
    };
  }

  const str = String(rawOption ?? '').trim();
  const corHex = getColorHex(str) || undefined;

  // 1. Padrão delta: (+R$ 10,00), (+10.00), (+ 15,50), (+R$10)
  const deltaRegex = /\(\s*\+\s*(?:R\$\s*)?([\d.,]+)\s*\)/i;
  const deltaMatch = str.match(deltaRegex);
  if (deltaMatch && deltaMatch[1]) {
    const delta = parseCurrencyNumber(deltaMatch[1]);
    const cleanLabel = str.replace(deltaRegex, '').trim();

    return {
      raw: str,
      cleanLabel: cleanLabel || str,
      priceDelta: isNaN(delta) ? 0 : delta,
      displayBadge: !isNaN(delta) && delta > 0 ? `+ ${formatCurrency(delta, currency)}` : undefined,
      corHex: getColorHex(cleanLabel) || corHex,
    };
  }

  // 2. Padrão preço fixo: "Opção: R$ 99,90" ou "Opção (R$ 99,90)"
  const fixedRegex = /(?::|\()\s*(?:R\$\s*)?([\d.,]+)\s*\)?$/i;
  const fixedMatch = str.match(fixedRegex);
  if (fixedMatch && fixedMatch[1] && !str.includes('+')) {
    const fixed = parseCurrencyNumber(fixedMatch[1]);
    const cleanLabel = str.replace(fixedRegex, '').trim();

    if (!isNaN(fixed) && fixed > 0) {
      return {
        raw: str,
        cleanLabel: cleanLabel || str,
        priceDelta: 0,
        fixedPrice: fixed,
        displayBadge: formatCurrency(fixed, currency),
        corHex: getColorHex(cleanLabel) || corHex,
      };
    }
  }

  // Opção padrão sem alteração de preço
  return {
    raw: str,
    cleanLabel: str,
    priceDelta: 0,
    corHex,
  };
}

/**
 * Calcula o preço unitário e promocional efetivo baseado nas variações selecionadas
 */
export function calculateEffectiveProductPrice(
  basePrice: number,
  basePromotionalPrice: number | null | undefined,
  selectedVariations: SelectedVariation = {},
  productVariations?: VariationOption[],
  currency = 'BRL'
): {
  unitPrice: number;
  promotionalPrice: number | null;
  effectivePrice: number;
  totalDelta: number;
  hasPriceAdjustment: boolean;
} {
  let totalDelta = 0;
  let fixedOverride: number | undefined;

  if (productVariations && productVariations.length > 0) {
    for (const variation of productVariations) {
      const selectedValue = selectedVariations[variation.tipo];
      if (!selectedValue) continue;

      // Localiza a opção original
      const foundOption = variation.opcoes.find((opt: any) => {
        if (typeof opt === 'object' && opt !== null) {
          return (opt as any).nome === selectedValue;
        }
        const parsed = parseVariationOption(opt, currency);
        return parsed.cleanLabel === selectedValue || opt === selectedValue;
      });

      if (foundOption) {
        const parsed = parseVariationOption(foundOption as any, currency);
        if (typeof parsed.fixedPrice === 'number' && parsed.fixedPrice > 0) {
          fixedOverride = parsed.fixedPrice;
        } else if (parsed.priceDelta !== 0) {
          totalDelta += parsed.priceDelta;
        }
      }
    }
  }

  // Preço unitário ajustado
  let unitPrice = typeof fixedOverride === 'number' ? fixedOverride : basePrice + totalDelta;
  if (unitPrice < 0) unitPrice = 0;

  // Preço promocional ajustado caso exista
  let promotionalPrice: number | null = null;
  if (
    typeof basePromotionalPrice === 'number' &&
    basePromotionalPrice > 0 &&
    basePromotionalPrice < basePrice
  ) {
    promotionalPrice = basePromotionalPrice + totalDelta;
    if (promotionalPrice >= unitPrice) {
      promotionalPrice = null;
    }
  }

  const effectivePrice =
    typeof promotionalPrice === 'number' && promotionalPrice > 0
      ? promotionalPrice
      : unitPrice;

  return {
    unitPrice,
    promotionalPrice,
    effectivePrice,
    totalDelta,
    hasPriceAdjustment: totalDelta !== 0 || typeof fixedOverride === 'number',
  };
}

/**
 * Formata sugestão de parcelamento universal (ex: "ou 3x de R$ 29,97 sem juros")
 */
export function formatInstallments(
  price: number,
  maxInstallments = 3,
  minInstallmentValue = 25,
  currency = 'BRL'
): string | null {
  if (!price || price < minInstallmentValue) return null;

  const installments = Math.min(
    maxInstallments,
    Math.max(1, Math.floor(price / minInstallmentValue))
  );

  if (installments <= 1) return null;

  const installmentValue = price / installments;
  return `ou ${installments}x de ${formatCurrency(installmentValue, currency)} sem juros`;
}
