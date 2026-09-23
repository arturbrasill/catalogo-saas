/**
 * Módulo de Normalização e Sanitização Robusta para Dados do Google Sheets
 * Diretrizes: skill-qa-auditoria-deploy.md
 */

import type { Product, Category, StoreConfig, CatalogInitialData, VariationOption } from '@/types';

/**
 * Placeholder SVG elegante codificado em Data URI para produtos sem foto na planilha.
 * Garante design limpo, cantos harmônicos e nunca quebra o layout.
 */
export const DEFAULT_PRODUCT_IMAGE_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="none">
      <rect width="400" height="400" fill="#F8FAFC"/>
      <rect x="20" y="20" width="360" height="360" rx="32" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="2" stroke-dasharray="6 6"/>
      <g transform="translate(160, 150)" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <path d="M16 4h48l12 24H4L16 4z"/>
        <path d="M4 28v40a8 8 0 0 0 8 8h56a8 8 0 0 0 8-8V28"/>
        <circle cx="40" cy="50" r="10"/>
      </g>
      <text x="200" y="260" text-anchor="middle" fill="#64748B" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600">Foto em breve</text>
    </svg>`
  );

/**
 * Converte preços nos formatos "R$ 19,90", "19,90", "1.250,50", "29.9" ou número float
 * para número JavaScript puro válido. NUNCA retorna NaN.
 */
export function normalizePrice(raw: unknown): number {
  if (raw === null || raw === undefined || raw === '') {
    return 0;
  }

  // Se já for número
  if (typeof raw === 'number') {
    if (isNaN(raw) || !isFinite(raw) || raw < 0) return 0;
    return Math.round(raw * 100) / 100;
  }

  const str = String(raw).trim();
  if (!str) return 0;

  // Remove símbolos de moeda e espaços
  let cleaned = str.replace(/[R$\s]/g, '');

  // Caso: Formato brasileiro com milhar e centavos ("1.250,50")
  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    // Caso: Apenas vírgula decimal ("19,90")
    cleaned = cleaned.replace(',', '.');
  }

  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed * 100) / 100;
}

/**
 * Normaliza o preço promocional garantindo que seja estritamente menor que o preço normal.
 */
export function normalizePromotionalPrice(
  rawPromo: unknown,
  regularPrice: number
): number | null {
  if (rawPromo === null || rawPromo === undefined || rawPromo === '') {
    return null;
  }

  const promo = normalizePrice(rawPromo);
  if (promo <= 0) return null;

  // O preço promocional só é válido se for estritamente menor que o preço normal
  if (regularPrice > 0 && promo >= regularPrice) {
    return null;
  }

  return promo;
}

/**
 * Sanitiza e normaliza imagens com fallback seguro para foto padrão se estiver vazia.
 */
export function normalizeImages(raw: unknown): string[] {
  const images: string[] = [];

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string' && item.trim().length > 0) {
        images.push(item.trim());
      }
    }
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (typeof item === 'string' && item.trim().length > 0) {
              images.push(item.trim());
            }
          }
        }
      } catch {
        // Fallback para divisão por texto caso o JSON falhe
      }
    }

    if (images.length === 0 && trimmed.length > 0) {
      // Divide por quebra de linha ou vírgula caso o usuário cole múltiplas URLs na planilha
      const splitted = trimmed.split(/[\r\n,]+/).map((u) => u.trim()).filter((u) => u.length > 0);
      for (const url of splitted) {
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/')) {
          images.push(url);
        }
      }
    }
  }

  // Fallback com imagem elegante padrão se não houver foto válida
  if (images.length === 0) {
    images.push(DEFAULT_PRODUCT_IMAGE_FALLBACK);
  }

  return images;
}

/**
 * Divide opções de variação por vírgula ou barra preservando vírgulas dentro de parênteses (ex: "42 (+R$ 15,00)").
 */
export function splitVariationOptions(input: string): string[] {
  const result: string[] = [];
  let current = '';
  let inParen = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '(') {
      inParen++;
      current += char;
    } else if (char === ')') {
      if (inParen > 0) inParen--;
      current += char;
    } else if ((char === ',' || char === '/') && inParen === 0) {
      if (current.trim().length > 0) {
        result.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim().length > 0) {
    result.push(current.trim());
  }

  return result;
}

/**
 * Parse seguro de variações suportando:
 * - JSON string: [{"tipo":"Tamanho","opcoes":["P","M"]}]
 * - Texto formatado: "Tamanho: P, M, G | Cor: Preto, Branco"
 * - Texto simples com barra ou vírgula: "P, M, G"
 */
export function normalizeVariations(raw: unknown): VariationOption[] {
  if (Array.isArray(raw)) {
    const valid: VariationOption[] = [];
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const tipo = String(item.tipo || '').trim();
      let opcoes: string[] = [];

      if (Array.isArray(item.opcoes)) {
        opcoes = item.opcoes.map((o: unknown) => String(o).trim()).filter(Boolean);
      } else if (typeof item.opcoes === 'string') {
        opcoes = splitVariationOptions(item.opcoes);
      }

      if (tipo && opcoes.length > 0) {
        valid.push({ tipo, opcoes });
      }
    }
    return valid;
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    // Tenta fazer o parse como JSON
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        return normalizeVariations(parsed);
      } catch {
        // Se falhar o parse JSON, prossegue para análise textual
      }
    }

    // Processa texto estruturado: "Tamanho: P, M, G | Cor: Preto, Branco"
    const groups = trimmed.split(/[|\n;]+/).map((g) => g.trim()).filter(Boolean);
    const parsedVariations: VariationOption[] = [];

    for (const group of groups) {
      if (group.includes(':')) {
        const [rawTipo, ...rest] = group.split(':');
        const tipo = (rawTipo || '').trim();
        const rawOpcoes = rest.join(':');
        const opcoes = splitVariationOptions(rawOpcoes);

        if (tipo && opcoes.length > 0) {
          parsedVariations.push({ tipo, opcoes });
        }
      } else {
        // Ex: "P, M, G, GG"
        const opcoes = splitVariationOptions(group);
        if (opcoes.length > 0) {
          parsedVariations.push({ tipo: 'Opção', opcoes });
        }
      }
    }

    return parsedVariations;
  }

  return [];
}

/**
 * Normaliza e blinda um produto vindo do Google Sheets ou API contra valores nulos/indefinidos.
 */
export function normalizeProduct(raw: any): Product {
  if (!raw || typeof raw !== 'object') {
    return {
      id: 'prod_' + Math.random().toString(36).substring(2, 9),
      categoriaId: 'default',
      nome: 'Produto',
      slug: 'produto',
      descricao: '',
      preco: 0,
      precoPromocional: null,
      imagens: [DEFAULT_PRODUCT_IMAGE_FALLBACK],
      variacoes: [],
      estoque: 10,
      ativo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };
  }

  const id = String(raw.id || '').trim() || 'prod_' + Math.random().toString(36).substring(2, 9);
  const nome = String(raw.nome || raw.title || 'Produto sem nome').trim();
  const slug = String(raw.slug || '').trim() || nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const categoriaId = String(raw.categoriaId || raw.categoria_id || 'geral').trim();
  const descricao = String(raw.descricao || raw.description || '').trim();

  const preco = normalizePrice(raw.preco !== undefined ? raw.preco : raw.price);
  const precoPromocional = normalizePromotionalPrice(
    raw.precoPromocional !== undefined ? raw.precoPromocional : raw.promo_price,
    preco
  );

  const imagens = normalizeImages(raw.imagens || raw.images || raw.foto);
  const variacoes = normalizeVariations(raw.variacoes || raw.variations);

  let estoque = 10;
  if (raw.estoque !== undefined && raw.estoque !== null && raw.estoque !== '') {
    const parsedEstoque = parseInt(String(raw.estoque), 10);
    estoque = isNaN(parsedEstoque) ? 0 : parsedEstoque;
  }

  const ativo = raw.ativo === undefined ? true : Boolean(raw.ativo);

  return {
    id,
    categoriaId,
    nome,
    slug,
    descricao,
    preco,
    precoPromocional,
    imagens,
    variacoes,
    estoque,
    ativo,
    createdAt: raw.createdAt ? String(raw.createdAt) : new Date().toISOString(),
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : new Date().toISOString(),
    deletedAt: raw.deletedAt ? String(raw.deletedAt) : null,
  };
}

/**
 * Normaliza e sanitiza toda a carga inicial do catálogo vinda da planilha.
 */
export function normalizeCatalogInitialData(raw: any): CatalogInitialData {
  if (!raw || typeof raw !== 'object') {
    return {
      store: {
        store_id: 'default',
        store_name: 'Catálogo Digital',
        logo_url: '',
        primary_color: '#10b981',
        secondary_color: '#047857',
        background_color: '#f8fafc',
        text_color: '#0f172a',
        whatsapp: '',
        domain: '',
        currency: 'BRL',
        timezone: 'America/Sao_Paulo',
        is_open: true,
      },
      categories: [],
      products: [],
    };
  }

  const rawStore = raw.store || raw.config || {};
  const store: StoreConfig = {
    store_id: String(rawStore.store_id || 'default').trim(),
    store_name: String(rawStore.store_name || 'Catálogo Digital').trim(),
    logo_url: String(rawStore.logo_url || '').trim(),
    primary_color: String(rawStore.primary_color || '#10b981').trim(),
    secondary_color: String(rawStore.secondary_color || '#047857').trim(),
    background_color: String(rawStore.background_color || '#f8fafc').trim(),
    text_color: String(rawStore.text_color || '#0f172a').trim(),
    banners: Array.isArray(rawStore.banners) ? rawStore.banners : [],
    whatsapp: String(rawStore.whatsapp || '').trim(),
    domain: String(rawStore.domain || '').trim(),
    currency: String(rawStore.currency || 'BRL').trim(),
    timezone: String(rawStore.timezone || 'America/Sao_Paulo').trim(),
    is_open: rawStore.is_open !== undefined ? Boolean(rawStore.is_open) : true,
    business_hours: rawStore.business_hours ? String(rawStore.business_hours).trim() : undefined,
    pix_key: rawStore.pix_key ? String(rawStore.pix_key).trim() : undefined,
    pix_key_type: rawStore.pix_key_type || undefined,
  };

  const rawCategories = Array.isArray(raw.categories) ? raw.categories : [];
  const categories: Category[] = rawCategories.map((c: any, index: number) => ({
    id: String(c.id || `cat_${index}`).trim(),
    nome: String(c.nome || 'Categoria').trim(),
    slug: String(c.slug || '').trim() || String(c.nome || 'categoria').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    ativo: c.ativo !== undefined ? Boolean(c.ativo) : true,
    ordem: typeof c.ordem === 'number' ? c.ordem : index,
    createdAt: c.createdAt ? String(c.createdAt) : new Date().toISOString(),
    updatedAt: c.updatedAt ? String(c.updatedAt) : new Date().toISOString(),
  }));

  const rawProducts = Array.isArray(raw.products) ? raw.products : [];
  const products: Product[] = rawProducts.map(normalizeProduct);

  return {
    store,
    categories,
    products,
  };
}
