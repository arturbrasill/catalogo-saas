'use client';

import React from 'react';
import type { StoreConfig } from '@/types';
import type { CatalogFilterState, SortOption } from '@/lib/catalogFilters';
import {
  SlidersHorizontal,
  X,
  Sparkles,
  Tag,
  PackageCheck,
  ChevronDown,
} from 'lucide-react';

interface CatalogControlBarProps {
  filters: CatalogFilterState;
  onUpdateFilters: (newFilters: Partial<CatalogFilterState>) => void;
  onResetFilters: () => void;
  onOpenFilterDrawer: () => void;
  filteredCount: number;
  totalCount: number;
  store: StoreConfig;
}

export function CatalogControlBar({
  filters,
  onUpdateFilters,
  onResetFilters,
  onOpenFilterDrawer,
  filteredCount,
  totalCount,
  store,
}: CatalogControlBarProps) {
  const activeFiltersCount =
    (filters.selectedCategory !== 'ALL' ? 1 : 0) +
    (filters.priceRange !== 'all' ? 1 : 0) +
    (filters.onlyInStock ? 1 : 0) +
    (filters.onlyPromotions ? 1 : 0) +
    (filters.sortBy !== 'featured' ? 1 : 0) +
    (filters.searchTerm ? 1 : 0);

  const priceRangeLabels: Record<string, string> = {
    under_50: 'Até R$ 50',
    '50_to_100': 'R$ 50 a R$ 100',
    '100_to_250': 'R$ 100 a R$ 250',
    over_250: 'Acima de R$ 250',
  };

  const sortLabels: Record<SortOption, string> = {
    featured: 'Destaques',
    price_asc: 'Menor Preço',
    price_desc: 'Maior Preço',
    discount: 'Maior Desconto',
    newest: 'Lançamentos',
    name_asc: 'Nome (A-Z)',
  };

  return (
    <div className="space-y-3">
      {/* Barra de Controles Principal */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200/80 p-3 sm:px-4 shadow-2xs">
        {/* Contagem de Resultados */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="text-slate-900 font-extrabold">{filteredCount}</span>
          <span className="text-slate-500 font-normal">
            {filteredCount === 1 ? 'produto encontrado' : `produtos de ${totalCount}`}
          </span>
        </div>

        {/* Ações e Botões de Controle */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Quick Toggle: Em Promoção */}
          <button
            type="button"
            onClick={() => onUpdateFilters({ onlyPromotions: !filters.onlyPromotions })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
              filters.onlyPromotions
                ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Ofertas</span>
            <span>% OFF</span>
          </button>

          {/* Quick Toggle: Com Estoque */}
          <button
            type="button"
            onClick={() => onUpdateFilters({ onlyInStock: !filters.onlyInStock })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 hidden md:flex ${
              filters.onlyInStock
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Em Estoque</span>
          </button>

          {/* Dropdown Rápido de Ordenação no Desktop */}
          <div className="relative hidden lg:flex items-center">
            <select
              value={filters.sortBy}
              onChange={(e) => onUpdateFilters({ sortBy: e.target.value as SortOption })}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-300 transition cursor-pointer"
            >
              <option value="featured">Ordenar: Destaques</option>
              <option value="price_asc">Menor Preço</option>
              <option value="price_desc">Maior Preço</option>
              <option value="discount">Maior Desconto</option>
              <option value="newest">Lançamentos</option>
              <option value="name_asc">Nome (A-Z)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
          </div>

          {/* Botão de Filtros Avançados */}
          <button
            type="button"
            onClick={onOpenFilterDrawer}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-2 ${
              activeFiltersCount > 0
                ? 'bg-slate-900 text-white border-transparent shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="h-4 w-4 rounded-full bg-white text-slate-900 text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Chips de Filtros Ativos (Remoção com 1 clique) */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Filtros ativos:</span>

          {filters.searchTerm && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
              Busca: &ldquo;{filters.searchTerm}&rdquo;
              <button
                type="button"
                onClick={() => onUpdateFilters({ searchTerm: '' })}
                className="hover:text-rose-500 cursor-pointer"
                aria-label="Remover filtro de busca"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.sortBy !== 'featured' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
              {sortLabels[filters.sortBy]}
              <button
                type="button"
                onClick={() => onUpdateFilters({ sortBy: 'featured' })}
                className="hover:text-rose-500 cursor-pointer"
                aria-label="Restaurar ordenação padrão"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.priceRange !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
              {priceRangeLabels[filters.priceRange]}
              <button
                type="button"
                onClick={() => onUpdateFilters({ priceRange: 'all' })}
                className="hover:text-rose-500 cursor-pointer"
                aria-label="Remover filtro de preço"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.onlyPromotions && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              Ofertas (% OFF)
              <button
                type="button"
                onClick={() => onUpdateFilters({ onlyPromotions: false })}
                className="hover:text-rose-900 cursor-pointer"
                aria-label="Remover filtro de ofertas"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.onlyInStock && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Com Estoque
              <button
                type="button"
                onClick={() => onUpdateFilters({ onlyInStock: false })}
                className="hover:text-emerald-900 cursor-pointer"
                aria-label="Remover filtro de estoque"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-900 underline ml-1 cursor-pointer"
          >
            Limpar todos
          </button>
        </div>
      )}
    </div>
  );
}
