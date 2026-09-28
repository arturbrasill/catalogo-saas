'use client';

import React from 'react';
import type { Product, StoreConfig, CatalogLayoutMode } from '@/types';
import { ProductCard } from './ProductCard';
import { Package } from 'lucide-react';

interface ProductListProps {
  products: Product[];
  store: StoreConfig;
  layoutMode?: CatalogLayoutMode;
  onSelectProduct: (product: Product) => void;
  onResetFilters?: () => void;
  emptySearchTerm?: string;
}

export function ProductList({
  products,
  store,
  layoutMode,
  onSelectProduct,
  onResetFilters,
  emptySearchTerm,
}: ProductListProps) {
  const mode: CatalogLayoutMode = layoutMode || store.catalog_layout || 'grid';

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center my-6 space-y-3 shadow-2xs max-w-xl mx-auto">
        <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
        <h3 className="text-sm font-bold text-slate-900">
          Nenhum produto encontrado com os filtros atuais
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {emptySearchTerm
            ? `Não encontramos itens correspondentes a "${emptySearchTerm}".`
            : 'Tente alterar os filtros aplicados para ver mais produtos.'}
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center text-xs font-bold px-4 py-2 rounded-xl text-brand-contrast bg-brand-primary hover:bg-brand-primary-hover shadow-xs transition cursor-pointer"
            style={{ backgroundColor: store?.primary_color }}
          >
            Limpar todos os filtros
          </button>
        )}
      </div>
    );
  }

  // Define as classes do container conforme o modo configurado
  let containerClasses = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6';

  if (mode === 'list') {
    containerClasses = 'flex flex-col gap-3 sm:gap-4 max-w-4xl mx-auto w-full';
  } else if (mode === 'editorial') {
    containerClasses = 'flex flex-col gap-8 sm:gap-12 max-w-3xl mx-auto w-full';
  }

  return (
    <div className={containerClasses} data-layout-mode={mode}>
      {products.map((prod) => (
        <ProductCard
          key={prod.id}
          product={prod}
          store={store}
          layoutMode={mode}
          onSelect={onSelectProduct}
        />
      ))}
    </div>
  );
}
