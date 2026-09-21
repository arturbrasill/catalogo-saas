'use client';

import React, { useState } from 'react';
import type { Product, StoreConfig } from '@/types';
import { formatCurrency } from '@/lib/whatsapp';
import { ShoppingBag, Eye, Package, Heart, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  store: StoreConfig;
  onSelect: (product: Product) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (productId: string) => void;
}

export function ProductCard({
  product,
  store,
  onSelect,
  isFavorite = false,
  onToggleFavorite,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const effectivePrice =
    product.precoPromocional && product.precoPromocional < product.preco
      ? product.precoPromocional
      : product.preco;

  const hasDiscount =
    product.precoPromocional && product.precoPromocional < product.preco;

  const isOutOfStock = product.estoque === 0;

  const discountPercent = hasDiscount
    ? Math.round(((product.preco - product.precoPromocional!) / product.preco) * 100)
    : 0;

  const firstImage = product.imagens && product.imagens.length > 0 ? product.imagens[0] : null;

  // Rating e avaliações simuladas para enriquecer o visual de e-commerce de alto padrão (inspirado em NovaShop e Beauty Shop)
  const simulatedRating = 4.9;
  const hasVariations = product.variacoes && product.variacoes.length > 0;

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      {/* Container da Imagem com Aspect Ratio perfeito */}
      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden flex items-center justify-center">
        {firstImage && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={firstImage}
            alt={product.nome}
            loading="lazy"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 text-slate-400">
            <Package className="w-10 h-10 stroke-1 text-slate-300" />
            <span className="text-[11px] font-medium text-slate-400 mt-1.5">Sem imagem</span>
          </div>
        )}

        {/* Badges de Destaque / Desconto no topo esquerdo */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {hasDiscount && (
            <span
              className="text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md tracking-tight flex items-center gap-1"
              style={{ backgroundColor: store.primary_color || '#10b981' }}
            >
              -{discountPercent}%
            </span>
          )}
          {isOutOfStock ? (
            <span className="bg-rose-500/95 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              Esgotado
            </span>
          ) : (
            product.estoque <= 3 && product.estoque > 0 && (
              <span className="bg-amber-500/95 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                Últimas {product.estoque} unid.
              </span>
            )
          )}
        </div>

        {/* Botão de Favoritar (Wishlist) no topo direito */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(product.id);
            }}
            className={`absolute top-2.5 right-2.5 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 z-10 ${
              isFavorite
                ? 'bg-rose-50 text-rose-500 shadow-sm'
                : 'bg-white/80 backdrop-blur-sm text-slate-400 hover:text-rose-500 hover:bg-white shadow-xs'
            }`}
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart
              className={`w-4 h-4 transition-transform active:scale-125 ${
                isFavorite ? 'fill-current text-rose-500' : ''
              }`}
            />
          </button>
        )}

        {/* Indicador sutil de variações na base da imagem */}
        {hasVariations && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="bg-white/90 backdrop-blur-md text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-2xs border border-slate-200/50">
              {product.variacoes.length} {product.variacoes.length === 1 ? 'opção' : 'opções'}
            </span>
          </div>
        )}
      </div>

      {/* Detalhes do Card */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          {/* Avaliação social sutil */}
          <div className="flex items-center gap-1 mb-1 text-[11px] font-medium text-slate-500">
            <span className="text-amber-400">★</span>
            <span className="text-slate-700 font-semibold">{simulatedRating}</span>
            <span className="text-slate-400">• Loja verificada</span>
          </div>

          <h4 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors">
            {product.nome}
          </h4>

          {product.descricao && (
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 leading-normal">
              {product.descricao}
            </p>
          )}
        </div>

        {/* Preço e Botão de Ação */}
        <div className="pt-2 border-t border-slate-100 flex items-end justify-between gap-1.5">
          <div className="leading-tight min-w-0">
            {hasDiscount && (
              <span className="text-[10px] sm:text-[11px] text-slate-400 line-through block mb-0.5 truncate">
                {formatCurrency(product.preco, store.currency)}
              </span>
            )}
            <span
              className="text-sm sm:text-base font-extrabold block truncate"
              style={{ color: store.primary_color || '#10b981' }}
            >
              {formatCurrency(effectivePrice, store.currency)}
            </span>
          </div>

          <button
            type="button"
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 active:scale-95 transition-all duration-200 flex-shrink-0"
            style={{ backgroundColor: store.primary_color || '#10b981' }}
            aria-label={`Ver detalhes e comprar ${product.nome}`}
          >
            {hasVariations ? (
              <Eye className="w-4 h-4" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
