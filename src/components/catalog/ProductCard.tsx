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

export function ProductCard({ product, store, onSelect }: ProductCardProps) {
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

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-500/50 transition duration-200 flex flex-col justify-between cursor-pointer"
    >
      {/* Container da Imagem */}
      <div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
        {firstImage && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={firstImage}
            alt={product.nome}
            loading="lazy"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-gray-300">
            <Package className="w-10 h-10" />
            <span className="text-[10px] text-gray-400 mt-1">Sem imagem</span>
          </div>
        )}

        {/* Badges de Destaque */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {hasDiscount && (
            <span
              className="text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs"
              style={{ backgroundColor: store.primary_color || '#10b981' }}
            >
              -{discountPercent}%
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
              Esgotado
            </span>
          )}
        </div>
      </div>

      {/* Detalhes do Card */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
        <div className="space-y-1">
          <h4 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 leading-tight group-hover:text-emerald-700 transition">
            {product.nome}
          </h4>
          {product.variacoes && product.variacoes.length > 0 && (
            <p className="text-[10px] sm:text-[11px] text-gray-400">
              {product.variacoes.map((v) => v.tipo).join(' • ')}
            </p>
          )}
        </div>

        {/* Preço e Botão de Ação */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-1">
          <div className="leading-none min-w-0">
            {hasDiscount && (
              <span className="text-[10px] sm:text-[11px] text-gray-400 line-through block mb-0.5 truncate">
                {formatCurrency(product.preco, store.currency)}
              </span>
            )}
            <span className="text-xs sm:text-sm md:text-base font-extrabold text-gray-900 block truncate">
              {formatCurrency(effectivePrice, store.currency)}
            </span>
          </div>

          <button
            type="button"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition"
            style={{ backgroundColor: store.primary_color || '#10b981' }}
            aria-label={`Ver detalhes de ${product.nome}`}
          >
            {product.variacoes && product.variacoes.length > 0 ? (
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
