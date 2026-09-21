'use client';

import React, { useState } from 'react';
import type { Product, StoreConfig } from '@/types';
import { formatCurrency } from '@/lib/whatsapp';
import { ShoppingBag, Eye, Package } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  store: StoreConfig;
  onSelect: (product: Product) => void;
}

export function ProductCard({
  product,
  store,
  onSelect,
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
  const hasVariations = product.variacoes && product.variacoes.length > 0;

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer"
    >
      {/* Container da Imagem */}
      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden flex items-center justify-center">
        {firstImage && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={firstImage}
            alt={product.nome}
            loading="lazy"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover group-hover:scale-104 transition-transform duration-300 ease-out"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 text-slate-300">
            <Package className="w-8 h-8 stroke-1 text-slate-300" />
            <span className="text-[10px] text-slate-400 mt-1">Sem foto</span>
          </div>
        )}

        {/* Badges sutis e minimalistas */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {hasDiscount && (
            <span
              className="text-white text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-xs"
              style={{ backgroundColor: store.primary_color || '#10b981' }}
            >
              -{discountPercent}%
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              Esgotado
            </span>
          )}
        </div>
      </div>

      {/* Detalhes do Produto */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <h4 className="text-xs sm:text-sm font-bold line-clamp-2 leading-snug group-hover:opacity-80 transition-opacity">
            {product.nome}
          </h4>

          {hasVariations && (
            <p className="text-[10px] sm:text-[11px] opacity-60 mt-0.5 truncate">
              {product.variacoes.map((v) => v.tipo).join(' • ')}
            </p>
          )}
        </div>

        {/* Preço e Ação */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
          <div className="leading-tight min-w-0">
            {hasDiscount && (
              <span className="text-[10px] sm:text-[11px] opacity-50 line-through block mb-0.5 truncate">
                {formatCurrency(product.preco, store.currency)}
              </span>
            )}
            <span
              className="text-xs sm:text-sm md:text-base font-extrabold block truncate"
              style={{ color: store.primary_color || '#10b981' }}
            >
              {formatCurrency(effectivePrice, store.currency)}
            </span>
          </div>

          <button
            type="button"
            className="h-8 w-8 rounded-xl flex items-center justify-center text-white shadow-2xs group-hover:scale-105 active:scale-95 transition-all flex-shrink-0 cursor-pointer"
            style={{ backgroundColor: store.primary_color || '#10b981' }}
            aria-label={`Ver detalhes de ${product.nome}`}
          >
            {hasVariations ? <Eye className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
