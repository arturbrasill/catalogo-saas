import type { Product } from '@/types';

export type SortOption =
  | 'featured'
  | 'price_asc'
  | 'price_desc'
  | 'discount'
  | 'newest'
  | 'name_asc';

export type PriceRangeOption =
  | 'all'
  | 'under_50'
  | '50_to_100'
  | '100_to_250'
  | 'over_250';

export interface CatalogFilterState {
  searchTerm: string;
  selectedCategory: string;
  sortBy: SortOption;
  priceRange: PriceRangeOption;
  onlyInStock: boolean;
  onlyPromotions: boolean;
}

export const DEFAULT_FILTERS: CatalogFilterState = {
  searchTerm: '',
  selectedCategory: 'ALL',
  sortBy: 'featured',
  priceRange: 'all',
  onlyInStock: false,
  onlyPromotions: false,
};

/**
 * Retorna o preço efetivo do produto (promocional caso exista e seja menor que o preço base)
 */
export function getProductEffectivePrice(product: Product): number {
  if (
    typeof product.precoPromocional === 'number' &&
    product.precoPromocional > 0 &&
    product.precoPromocional < product.preco
  ) {
    return product.precoPromocional;
  }
  return product.preco;
}

/**
 * Retorna o percentual de desconto do produto
 */
export function getProductDiscountPercent(product: Product): number {
  if (
    typeof product.precoPromocional === 'number' &&
    product.precoPromocional > 0 &&
    product.precoPromocional < product.preco
  ) {
    return Math.round(((product.preco - product.precoPromocional) / product.preco) * 100);
  }
  return 0;
}

/**
 * Filtra e ordena a lista de produtos com base no estado de filtros ativos
 */
export function filterAndSortProducts(
  products: Product[],
  filters: CatalogFilterState
): Product[] {
  // 1. Filtragem
  const filtered = products.filter((p) => {
    // Busca textual no nome, descrição ou variações
    if (filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase().trim();
      const matchName = p.nome.toLowerCase().includes(term);
      const matchDesc = p.descricao?.toLowerCase().includes(term);
      const matchVariation = p.variacoes?.some(
        (v) =>
          v.tipo.toLowerCase().includes(term) ||
          v.opcoes.some((opt) => String(opt).toLowerCase().includes(term))
      );
      if (!matchName && !matchDesc && !matchVariation) {
        return false;
      }
    }

    // Categoria
    if (filters.selectedCategory !== 'ALL' && p.categoriaId !== filters.selectedCategory) {
      return false;
    }

    // Apenas com estoque
    if (filters.onlyInStock && p.estoque === 0) {
      return false;
    }

    // Apenas em promoção
    if (filters.onlyPromotions) {
      const hasDiscount =
        typeof p.precoPromocional === 'number' &&
        p.precoPromocional > 0 &&
        p.precoPromocional < p.preco;
      if (!hasDiscount) return false;
    }

    // Faixa de preço
    if (filters.priceRange !== 'all') {
      const price = getProductEffectivePrice(p);
      switch (filters.priceRange) {
        case 'under_50':
          if (price >= 50) return false;
          break;
        case '50_to_100':
          if (price < 50 || price > 100) return false;
          break;
        case '100_to_250':
          if (price < 100 || price > 250) return false;
          break;
        case 'over_250':
          if (price <= 250) return false;
          break;
      }
    }

    return true;
  });

  // 2. Ordenação
  return filtered.sort((a, b) => {
    const priceA = getProductEffectivePrice(a);
    const priceB = getProductEffectivePrice(b);

    switch (filters.sortBy) {
      case 'price_asc':
        return priceA - priceB;
      case 'price_desc':
        return priceB - priceA;
      case 'discount': {
        const discountA = getProductDiscountPercent(a);
        const discountB = getProductDiscountPercent(b);
        return discountB - discountA;
      }
      case 'newest': {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
      case 'name_asc':
        return a.nome.localeCompare(b.nome);
      case 'featured':
      default:
        // Mantém ordem padrão ou prioriza produtos em estoque
        if (a.estoque === 0 && b.estoque !== 0) return 1;
        if (a.estoque !== 0 && b.estoque === 0) return -1;
        return 0;
    }
  });
}
