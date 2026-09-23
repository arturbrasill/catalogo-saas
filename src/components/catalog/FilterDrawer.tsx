'use client';

import React from 'react';
import type { Category, StoreConfig } from '@/types';
import type {
  CatalogFilterState,
  SortOption,
  PriceRangeOption,
} from '@/lib/catalogFilters';
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Tag,
  PackageCheck,
  TrendingDown,
  Sparkles,
} from 'lucide-react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CatalogFilterState;
  onUpdateFilters: (newFilters: Partial<CatalogFilterState>) => void;
  onResetFilters: () => void;
  categories: Category[];
  totalResultsCount: number;
  store: StoreConfig;
}

export function FilterDrawer({
  isOpen,
  onClose,
  filters,
  onUpdateFilters,
  onResetFilters,
  categories,
  totalResultsCount,
  store,
}: FilterDrawerProps) {
  if (!isOpen) return null;

  const sortOptions: { id: SortOption; label: string; icon?: React.ElementType }[] = [
    { id: 'featured', label: 'Destaques e Mais Vendidos', icon: Sparkles },
    { id: 'price_asc', label: 'Menor Preço' },
    { id: 'price_desc', label: 'Maior Preço' },
    { id: 'discount', label: 'Maior Desconto (% OFF)', icon: TrendingDown },
    { id: 'newest', label: 'Lançamentos / Mais Novos' },
    { id: 'name_asc', label: 'Ordem Alfabética (A-Z)' },
  ];

  const priceRanges: { id: PriceRangeOption; label: string }[] = [
    { id: 'all', label: 'Todas as faixas de preço' },
    { id: 'under_50', label: 'Até R$ 50,00' },
    { id: '50_to_100', label: 'R$ 50,00 a R$ 100,00' },
    { id: '100_to_250', label: 'R$ 100,00 a R$ 250,00' },
    { id: 'over_250', label: 'Acima de R$ 250,00' },
  ];

  const activeFiltersCount =
    (filters.selectedCategory !== 'ALL' ? 1 : 0) +
    (filters.priceRange !== 'all' ? 1 : 0) +
    (filters.onlyInStock ? 1 : 0) +
    (filters.onlyPromotions ? 1 : 0) +
    (filters.sortBy !== 'featured' ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-100">
          {/* Header do Drawer */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center shadow-xs"
                style={{
                  backgroundColor: `${store.primary_color || '#10b981'}15`,
                  color: store.primary_color || '#10b981',
                }}
              >
                <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Filtros & Ordenação
                </h3>
                <p className="text-[11px] text-slate-500">
                  {activeFiltersCount === 0
                    ? 'Nenhum filtro ativo'
                    : `${activeFiltersCount} filtro(s) aplicado(s)`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Fechar filtros"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Conteúdo com Seções de Filtros */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* 1. Ordenação */}
            <div className="space-y-2.5">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                Ordenar por:
              </label>
              <div className="space-y-1.5">
                {sortOptions.map((opt) => {
                  const isSelected = filters.sortBy === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onUpdateFilters({ sortBy: opt.id })}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Disponibilidade e Ofertas */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                Status e Ofertas:
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateFilters({ onlyPromotions: !filters.onlyPromotions })
                  }
                  className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                    filters.onlyPromotions
                      ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-rose-500" />
                    <span>Apenas em Promoção (% OFF)</span>
                  </div>
                  {filters.onlyPromotions && (
                    <span className="h-4 w-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateFilters({ onlyInStock: !filters.onlyInStock })
                  }
                  className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                    filters.onlyInStock
                      ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-brand-primary" />
                    <span>Apenas com Estoque Imediato</span>
                  </div>
                  {filters.onlyInStock && (
                    <span className="h-4 w-4 rounded-full bg-brand-primary text-brand-contrast flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* 3. Faixa de Preço */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                Faixa de Preço:
              </label>
              <div className="space-y-1.5">
                {priceRanges.map((pr) => {
                  const isSelected = filters.priceRange === pr.id;
                  return (
                    <button
                      key={pr.id}
                      type="button"
                      onClick={() => onUpdateFilters({ priceRange: pr.id })}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-slate-100 text-slate-900 font-extrabold border border-slate-300 shadow-2xs'
                          : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <span>{pr.label}</span>
                      {isSelected && (
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: store.primary_color || '#10b981' }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Categorias */}
            {categories.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                  Filtrar por Categoria:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateFilters({ selectedCategory: 'ALL' })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      filters.selectedCategory === 'ALL'
                        ? 'bg-slate-900 text-white border-transparent'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Todas
                  </button>
                  {categories.map((cat) => {
                    const isSelected = filters.selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => onUpdateFilters({ selectedCategory: cat.id })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-transparent'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {cat.nome}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer com Ações */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center gap-2.5">
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer flex items-center gap-1.5 flex-shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-black text-brand-contrast bg-brand-primary hover:bg-brand-primary-hover shadow-xs hover:brightness-95 transition cursor-pointer text-center"
              style={{ backgroundColor: store.primary_color }}
            >
              Ver {totalResultsCount} {totalResultsCount === 1 ? 'Produto' : 'Produtos'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
