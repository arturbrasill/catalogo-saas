'use client';

import React, { useState, useMemo } from 'react';
import type { Product, StoreConfig, CatalogLayoutMode } from '@/types';
import { formatCurrency } from '@/lib/whatsapp';
import { useWishlist } from '@/lib/wishlist';
import { extractProductImages } from '@/lib/productNormalization';
import {
  formatInstallments,
  isColorVariation,
  parseVariationOption,
  hasVariationPricing,
} from '@/lib/variations';
import {
  ShoppingBag,
  Eye,
  Package,
  Heart,
  Plus,
  Sparkles,
  Tag,
  Star,
  ArrowRight,
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  store: StoreConfig;
  onSelect: (product: Product) => void;
  layoutMode?: CatalogLayoutMode;
}

/**
 * Retorna classe e ícone apropriados para selos promocionais
 */
function getBadgeConfig(badgeText: string) {
  const lower = badgeText.toLowerCase();
  if (lower.includes('vendido') || lower.includes('top') || lower.includes('campeão')) {
    return {
      className: 'bg-amber-500 text-white shadow-xs',
      icon: Star,
    };
  }
  if (
    lower.includes('promo') ||
    lower.includes('oferta') ||
    lower.includes('liquida') ||
    lower.includes('queima')
  ) {
    return {
      className: 'bg-rose-500 text-white shadow-xs',
      icon: Tag,
    };
  }
  if (
    lower.includes('novo') ||
    lower.includes('novidade') ||
    lower.includes('lançamento') ||
    lower.includes('new')
  ) {
    return {
      className: 'bg-emerald-600 text-white shadow-xs',
      icon: Sparkles,
    };
  }
  return {
    className: 'bg-slate-900 text-white shadow-xs',
    icon: Sparkles,
  };
}

export function ProductCard({
  product,
  store,
  onSelect,
  layoutMode,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const { isFavorite, toggleFavorite } = useWishlist();

  const mode: CatalogLayoutMode = layoutMode || store.catalog_layout || 'grid';

  const effectivePrice =
    product.precoPromocional && product.precoPromocional < product.preco
      ? product.precoPromocional
      : product.preco;

  const hasDiscount =
    product.precoPromocional && product.precoPromocional < product.preco;

  const rawStock = product.estoque;
  const stockNum = typeof rawStock === 'number' ? rawStock : parseInt(String(rawStock), 10);
  const isUnlimited = stockNum === -1;
  const isOutOfStock = !isUnlimited && (stockNum === 0 || stockNum < 0 || isNaN(stockNum));

  const discountPercent = hasDiscount
    ? Math.round(((product.preco - product.precoPromocional!) / product.preco) * 100)
    : 0;

  const productImages = useMemo(() => extractProductImages(product.imagens), [product.imagens]);
  const firstImage = productImages.length > 0 ? productImages[0] : null;
  const secondImage = productImages.length > 1 ? productImages[1] : null;
  const hasVariations = product.variacoes && product.variacoes.length > 0;
  const hasPriceVariations = hasVariationPricing(product.variacoes, product.preco, store.currency);
  const favorite = isFavorite(product.id);
  const installmentText = formatInstallments(effectivePrice, 3, 25, store.currency);

  const customBadge = product.badge ? product.badge.trim() : null;
  const badgeConfig = customBadge ? getBadgeConfig(customBadge) : null;
  const BadgeIcon = badgeConfig?.icon;

  // Busca variações para exibição rápida no card
  const colorVariation = product.variacoes?.find((v) => isColorVariation(v.tipo));
  const sizeVariation = product.variacoes?.find(
    (v) =>
      v.tipo.toLowerCase().includes('tamanho') ||
      v.tipo.toLowerCase().includes('tam') ||
      v.tipo.toLowerCase().includes('size')
  );

  // =========================================================================
  // MODO LIST: Card Horizontal Compacto (Alimentação, Delivery, Catálogos Densos)
  // =========================================================================
  if (mode === 'list') {
    return (
      <div
        onClick={() => onSelect(product)}
        className="group relative bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs transition-all duration-200 flex flex-row items-stretch p-3 sm:p-4 gap-3 sm:gap-4 cursor-pointer active:scale-[0.99]"
      >
        {/* Imagem Quadrada Compacta na Esquerda */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center">
          {firstImage && !imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={firstImage}
              alt={product.nome}
              loading="lazy"
              onError={() => setImageError(true)}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 text-slate-300">
              <Package className="w-6 h-6 stroke-1 text-slate-300" />
              <span className="text-[9px] text-slate-400 mt-0.5">Sem foto</span>
            </div>
          )}

          {/* Selos Compactos na Imagem */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10">
            {customBadge && badgeConfig && (
              <span
                className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-tight ${badgeConfig.className}`}
              >
                {BadgeIcon && <BadgeIcon className="w-2.5 h-2.5" />}
                {customBadge}
              </span>
            )}
            {hasDiscount && (
              <span className="bg-orange-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs uppercase">
                -{discountPercent}%
              </span>
            )}
            {isOutOfStock ? (
              <span className="bg-rose-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs uppercase">
                Esgotado
              </span>
            ) : !isUnlimited && stockNum <= 3 && stockNum > 0 ? (
              <span className="bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs uppercase">
                Últimas {stockNum} un
              </span>
            ) : null}
          </div>
        </div>

        {/* Informações Centrais e Botão de Adição na Direita */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-xs sm:text-sm font-semibold text-slate-900 tracking-tight line-clamp-1 group-hover:text-slate-700 transition-colors">
                {product.nome}
              </h4>

              {/* Botão de Favorito Compacto */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(product.id);
                }}
                className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
                  favorite
                    ? 'bg-rose-50 text-rose-500'
                    : 'text-slate-300 hover:text-rose-500 hover:bg-slate-100'
                }`}
                title={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    favorite ? 'fill-rose-500 stroke-rose-500' : 'stroke-current'
                  }`}
                />
              </button>
            </div>

            {/* Descrição Curta (ideal para ingredientes ou detalhes) */}
            {product.descricao && (
              <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {product.descricao}
              </p>
            )}

            {/* Amostras de Variação (se houver) */}
            {colorVariation && (
              <div className="flex items-center gap-1 pt-0.5">
                {colorVariation.opcoes.slice(0, 4).map((opt, idx) => {
                  const parsed = parseVariationOption(opt as any, store.currency);
                  return (
                    <span
                      key={idx}
                      title={parsed.cleanLabel}
                      className="h-2.5 w-2.5 rounded-full border border-slate-300"
                      style={{ backgroundColor: parsed.corHex || '#cbd5e1' }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Preço e Botão '+' */}
          <div className="pt-2 flex items-end justify-between gap-2 border-t border-slate-100 mt-1">
            <div className="leading-tight min-w-0">
              {hasDiscount && (
                <span className="text-[10px] text-slate-400 line-through block truncate">
                  {formatCurrency(product.preco, store.currency)}
                </span>
              )}
              {hasPriceVariations && (
                <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">
                  A partir de
                </span>
              )}
              <span
                className={`text-sm sm:text-base font-bold tracking-tight block truncate ${
                  hasDiscount ? 'text-emerald-700' : 'text-slate-900'
                }`}
              >
                {formatCurrency(effectivePrice, store.currency)}
              </span>
              {installmentText && (
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium block truncate">
                  {installmentText}
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={isOutOfStock}
              className={`h-9 w-9 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center text-white bg-slate-900 hover:bg-slate-800 shadow-2xs active:scale-95 transition-all flex-shrink-0 cursor-pointer ${
                isOutOfStock ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              style={store.primary_color ? { backgroundColor: store.primary_color } : undefined}
              aria-label={isOutOfStock ? `${product.nome} (Esgotado)` : `Ver ou adicionar ${product.nome}`}
            >
              {hasVariations ? (
                <Eye className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODO EDITORIAL: 1 Coluna com Imagem Grande e Espaçamento Generoso
  // =========================================================================
  if (mode === 'editorial') {
    return (
      <div
        onClick={() => onSelect(product)}
        className="group relative bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs transition-all duration-200 flex flex-col cursor-pointer active:scale-[0.99] overflow-hidden w-full"
      >
        {/* Imagem Ampla e Nobre no Topo */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-slate-50 border-b border-slate-100 overflow-hidden flex items-center justify-center">
          {firstImage && !imageError ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={firstImage}
                alt={product.nome}
                loading="lazy"
                onError={() => setImageError(true)}
                className={`h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
                  secondImage ? 'group-hover:opacity-0' : ''
                }`}
              />
              {secondImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={secondImage}
                  alt={`${product.nome} - prévia`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out opacity-0 group-hover:opacity-100 group-hover:scale-105"
                />
              )}
            </>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 text-slate-300">
              <Package className="w-12 h-12 stroke-1 text-slate-300" />
              <span className="text-xs text-slate-400 mt-2 font-medium">Sem foto</span>
            </div>
          )}

          {/* Badges Destacados no Canto Superior Esquerdo */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
            {customBadge && badgeConfig && (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide ${badgeConfig.className}`}
              >
                {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5" />}
                {customBadge}
              </span>
            )}
            {hasDiscount && (
              <span className="bg-orange-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-2xs tracking-tight uppercase">
                -{discountPercent}% OFF
              </span>
            )}
            {isOutOfStock ? (
              <span className="bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-2xs uppercase">
                Esgotado
              </span>
            ) : !isUnlimited && stockNum <= 3 && stockNum > 0 ? (
              <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-2xs uppercase">
                Últimas {stockNum} un
              </span>
            ) : null}
          </div>

          {/* Botão de Favoritos Grande no Canto Superior Direito */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
            className={`absolute top-4 right-4 z-10 h-9 w-9 rounded-lg flex items-center justify-center border transition-all duration-200 cursor-pointer ${
              favorite
                ? 'bg-rose-50 text-rose-500 border-rose-200 shadow-2xs'
                : 'bg-white/95 hover:bg-white text-slate-400 hover:text-rose-500 border-slate-200 shadow-2xs'
            }`}
            title={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart
              className={`w-4.5 h-4.5 transition-transform ${
                favorite ? 'fill-rose-500 stroke-rose-500' : 'stroke-current'
              }`}
            />
          </button>
        </div>

        {/* Conteúdo Generoso Editorial */}
        <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight leading-snug group-hover:text-slate-700 transition-colors">
              {product.nome}
            </h3>

            {product.descricao && (
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-3">
                {product.descricao}
              </p>
            )}

            {/* Variações Visuais */}
            {colorVariation && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Cores:
                </span>
                <div className="flex items-center gap-1.5">
                  {colorVariation.opcoes.map((opt, idx) => {
                    const parsed = parseVariationOption(opt as any, store.currency);
                    return (
                      <span
                        key={idx}
                        title={parsed.cleanLabel}
                        className="h-3.5 w-3.5 rounded-full border border-slate-300 shadow-2xs"
                        style={{ backgroundColor: parsed.corHex || '#cbd5e1' }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Preço e Botão Amplo CTA */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              {hasDiscount && (
                <span className="text-xs sm:text-sm text-slate-400 line-through block mb-0.5">
                  {formatCurrency(product.preco, store.currency)}
                </span>
              )}
              {hasPriceVariations && (
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  A partir de
                </span>
              )}
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-xl sm:text-2xl font-bold tracking-tight ${
                    hasDiscount ? 'text-emerald-700' : 'text-slate-900'
                  }`}
                >
                  {formatCurrency(effectivePrice, store.currency)}
                </span>
                {installmentText && (
                  <span className="text-xs text-slate-500 font-medium">
                    {installmentText}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              className="px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl flex items-center gap-2 text-white bg-slate-900 hover:bg-slate-800 shadow-2xs active:scale-98 transition-all cursor-pointer font-semibold text-xs sm:text-sm"
              style={store.primary_color ? { backgroundColor: store.primary_color } : undefined}
              aria-label={`Ver detalhes de ${product.nome}`}
            >
              {hasVariations ? (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Ver Opções</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Ver Detalhes</span>
                </>
              )}
              <ArrowRight className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODO GRID (PADRÃO): 2 Colunas no Mobile, 4 Colunas no Desktop
  // =========================================================================
  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative bg-white rounded-xl border border-slate-200 hover:border-slate-300 overflow-hidden shadow-2xs transition-all duration-200 flex flex-col justify-between cursor-pointer active:scale-[0.99]"
    >
      {/* Container da Imagem com Hover Suave de Zoom */}
      <div className="relative aspect-square w-full bg-slate-50 border-b border-slate-100 overflow-hidden flex items-center justify-center">
        {firstImage && !imageError ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={firstImage}
              alt={product.nome}
              loading="lazy"
              onError={() => setImageError(true)}
              className={`h-full w-full object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
                secondImage ? 'group-hover:opacity-0' : ''
              }`}
            />
            {secondImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={secondImage}
                alt={`${product.nome} - prévia`}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-all duration-500 ease-out opacity-0 group-hover:opacity-100 group-hover:scale-105"
              />
            )}
          </>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 text-slate-300">
            <Package className="w-8 h-8 stroke-1 text-slate-300" />
            <span className="text-[10px] text-slate-400 mt-1 font-medium">Sem foto</span>
          </div>
        )}

        {/* Badges de Destaque, Selo Promocional e Desconto */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {customBadge && badgeConfig && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tight ${badgeConfig.className}`}
            >
              {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
              {customBadge}
            </span>
          )}
          {hasDiscount && (
            <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs tracking-tight uppercase">
              -{discountPercent}% OFF
            </span>
          )}
          {isOutOfStock ? (
            <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs uppercase">
              Esgotado
            </span>
          ) : !isUnlimited && stockNum <= 3 && stockNum > 0 ? (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs uppercase">
              Últimas {stockNum} un
            </span>
          ) : null}
        </div>

        {/* Botão de Favoritos (Wishlist) no Canto Superior Direito */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          className={`absolute top-2.5 right-2.5 z-10 h-8 w-8 rounded-lg flex items-center justify-center border transition-all duration-200 cursor-pointer ${
            favorite
              ? 'bg-rose-50 text-rose-500 border-rose-200 shadow-2xs'
              : 'bg-white/95 hover:bg-white text-slate-400 hover:text-rose-500 border-slate-200 shadow-2xs'
          }`}
          title={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart
            className={`w-4 h-4 transition-transform ${
              favorite ? 'fill-rose-500 stroke-rose-500' : 'stroke-current'
            }`}
          />
        </button>
      </div>

      {/* Detalhes do Produto */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
        <div className="space-y-1.5">
          {/* Amostras Rápidas de Cores ou Tamanhos */}
          {colorVariation && (
            <div className="flex items-center gap-1.5 pt-0.5">
              {colorVariation.opcoes.slice(0, 5).map((opt, idx) => {
                const parsed = parseVariationOption(opt as any, store.currency);
                const hex = parsed.corHex;
                return (
                  <span
                    key={idx}
                    title={parsed.cleanLabel}
                    className="h-3 w-3 rounded-full border border-slate-300 shadow-2xs flex-shrink-0"
                    style={{ backgroundColor: hex || '#cbd5e1' }}
                  />
                );
              })}
              {colorVariation.opcoes.length > 5 && (
                <span className="text-[10px] font-semibold text-slate-400">
                  +{colorVariation.opcoes.length - 5}
                </span>
              )}
            </div>
          )}

          {sizeVariation && !colorVariation && (
            <div className="flex items-center gap-1 overflow-hidden">
              {sizeVariation.opcoes.slice(0, 4).map((opt, idx) => {
                const parsed = parseVariationOption(opt as any, store.currency);
                return (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"
                  >
                    {parsed.cleanLabel}
                  </span>
                );
              })}
              {sizeVariation.opcoes.length > 4 && (
                <span className="text-[10px] font-semibold text-slate-400">
                  +{sizeVariation.opcoes.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Nome do Produto */}
          <h4 className="text-xs sm:text-sm font-semibold text-slate-900 tracking-tight line-clamp-2 leading-snug group-hover:text-slate-700 transition-colors">
            {product.nome}
          </h4>
        </div>

        {/* Preço, Parcelamento e Ação */}
        <div className="pt-2.5 border-t border-slate-100 flex items-end justify-between gap-1.5">
          <div className="leading-none min-w-0">
            {hasDiscount && (
              <span className="text-[10px] sm:text-[11px] text-slate-400 line-through block mb-1 truncate">
                {formatCurrency(product.preco, store.currency)}
              </span>
            )}
            {hasPriceVariations && (
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                A partir de
              </span>
            )}
            <span
              className={`text-sm sm:text-base font-bold block truncate tracking-tight ${
                hasDiscount ? 'text-emerald-700' : 'text-slate-900'
              }`}
            >
              {formatCurrency(effectivePrice, store.currency)}
            </span>
            {installmentText && (
              <span className="text-[10px] text-slate-500 font-medium block mt-1 truncate">
                {installmentText}
              </span>
            )}
          </div>

          <button
            type="button"
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center text-white bg-slate-900 hover:bg-slate-800 shadow-2xs active:scale-95 transition-all flex-shrink-0 cursor-pointer"
            style={store.primary_color ? { backgroundColor: store.primary_color } : undefined}
            aria-label={`Ver detalhes de ${product.nome}`}
          >
            {hasVariations ? (
              <Eye className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            ) : (
              <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
