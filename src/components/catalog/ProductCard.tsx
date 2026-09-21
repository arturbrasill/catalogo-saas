'use client';

import React, { useState } from 'react';
import type { Product, StoreConfig } from '@/types';
import { formatCurrency } from '@/lib/whatsapp';
import { useWishlist } from '@/lib/wishlist';
import {
  formatInstallments,
  isColorVariation,
  getColorHex,
  parseVariationOption,
} from '@/lib/variations';
import { ShoppingBag, Eye, Package, Heart } from 'lucide-react';

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
  const { isFavorite, toggleFavorite } = useWishlist();

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
  const favorite = isFavorite(product.id);
  const installmentText = formatInstallments(effectivePrice, 3, 25, store.currency);

  // Busca se há variações de cor ou tamanho para pré-visualização no card
  const colorVariation = product.variacoes?.find((v) => isColorVariation(v.tipo));
  const sizeVariation = product.variacoes?.find(
    (v) =>
      v.tipo.toLowerCase().includes('tamanho') ||
      v.tipo.toLowerCase().includes('tam') ||
      v.tipo.toLowerCase().includes('size')
  );

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative bg-white rounded-3xl border border-slate-200/80 hover:border-slate-300/80 overflow-hidden shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      {/* Container da Imagem com Aspect Ratio Limpo */}
      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden flex items-center justify-center">
        {firstImage && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={firstImage}
            alt={product.nome}
            loading="lazy"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 text-slate-300">
            <Package className="w-8 h-8 stroke-1 text-slate-300" />
            <span className="text-[10px] text-slate-400 mt-1 font-medium">Sem foto</span>
          </div>
        )}

        {/* Badges de Destaque e Desconto no Canto Superior Esquerdo */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {hasDiscount && (
            <span
              className="text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm tracking-tight"
              style={{ backgroundColor: store.primary_color || '#10b981' }}
            >
              -{discountPercent}% OFF
            </span>
          )}
          {isOutOfStock ? (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
              Esgotado
            </span>
          ) : product.estoque <= 3 && product.estoque > 0 ? (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
              Últimas {product.estoque} un
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
          className={`absolute top-2.5 right-2.5 z-10 h-8 w-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 cursor-pointer ${
            favorite
              ? 'bg-rose-50 text-rose-500 shadow-sm scale-105'
              : 'bg-white/85 hover:bg-white text-slate-400 hover:text-rose-500 shadow-xs'
          }`}
          title={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart
            className={`w-4 h-4 transition-transform ${
              favorite ? 'fill-rose-500 stroke-rose-500 scale-110' : 'stroke-current'
            }`}
          />
        </button>
      </div>

      {/* Detalhes do Produto */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
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
                <span className="text-[10px] font-bold text-slate-400">
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
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200"
                  >
                    {parsed.cleanLabel}
                  </span>
                );
              })}
              {sizeVariation.opcoes.length > 4 && (
                <span className="text-[10px] font-bold text-slate-400">
                  +{sizeVariation.opcoes.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Nome do Produto */}
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-slate-700 transition-colors">
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
            <span
              className="text-sm sm:text-base font-black block truncate tracking-tight"
              style={{ color: store.primary_color || '#10b981' }}
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
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center text-white shadow-2xs group-hover:scale-108 active:scale-95 transition-all flex-shrink-0 cursor-pointer"
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
