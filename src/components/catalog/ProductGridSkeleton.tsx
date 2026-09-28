'use client';

import React from 'react';
import type { CatalogLayoutMode } from '@/types';

interface ProductGridSkeletonProps {
  count?: number;
  layoutMode?: CatalogLayoutMode;
}

export function ProductGridSkeleton({ count = 8, layoutMode = 'grid' }: ProductGridSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  // =========================================================================
  // SKELETON MODO LIST
  // =========================================================================
  if (layoutMode === 'list') {
    return (
      <div
        role="status"
        aria-label="Carregando produtos em lista..."
        className="flex flex-col gap-3 sm:gap-4 max-w-4xl mx-auto w-full animate-fade-in"
      >
        {items.slice(0, 6).map((idx) => (
          <div
            key={idx}
            className="relative bg-white rounded-card border border-slate-200/80 p-3 sm:p-4 flex items-stretch gap-3 sm:gap-4 shadow-card overflow-hidden"
          >
            {/* Imagem Shimmer */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-100 flex-shrink-0 shimmer-wave relative" />

            {/* Linhas de Texto Shimmer */}
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="space-y-2">
                <div className="h-4 w-3/4 rounded-md bg-slate-200 shimmer-wave" />
                <div className="h-3 w-full rounded-md bg-slate-100 shimmer-wave" />
                <div className="h-3 w-1/2 rounded-md bg-slate-100 shimmer-wave" />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <div className="h-5 w-24 rounded-md bg-slate-200 shimmer-wave" />
                <div className="h-9 w-9 rounded-btn bg-slate-200 shimmer-wave" />
              </div>
            </div>
          </div>
        ))}
        <span className="sr-only">Carregando lista de produtos...</span>
      </div>
    );
  }

  // =========================================================================
  // SKELETON MODO EDITORIAL
  // =========================================================================
  if (layoutMode === 'editorial') {
    return (
      <div
        role="status"
        aria-label="Carregando produtos no modo editorial..."
        className="flex flex-col gap-8 sm:gap-12 max-w-3xl mx-auto w-full animate-fade-in"
      >
        {items.slice(0, 3).map((idx) => (
          <div
            key={idx}
            className="relative bg-white rounded-card border border-slate-200/80 shadow-card overflow-hidden"
          >
            {/* Banner Grande Shimmer */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-slate-100 shimmer-wave">
              <div className="absolute top-4 left-4 h-6 w-24 rounded-full bg-slate-200/90 shimmer-wave" />
              <div className="absolute top-4 right-4 h-10 w-10 rounded-full bg-slate-200/90 shimmer-wave" />
            </div>

            {/* Conteúdo Generoso Shimmer */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="space-y-2.5">
                <div className="h-6 w-2/3 rounded-lg bg-slate-200 shimmer-wave" />
                <div className="h-4 w-full rounded-md bg-slate-100 shimmer-wave" />
                <div className="h-4 w-4/5 rounded-md bg-slate-100 shimmer-wave" />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="h-6 w-32 rounded-lg bg-slate-200 shimmer-wave" />
                  <div className="h-3 w-20 rounded-md bg-slate-100 shimmer-wave" />
                </div>
                <div className="h-11 w-36 rounded-btn bg-slate-200 shimmer-wave" />
              </div>
            </div>
          </div>
        ))}
        <span className="sr-only">Carregando catálogo editorial...</span>
      </div>
    );
  }

  // =========================================================================
  // SKELETON MODO GRID (PADRÃO)
  // =========================================================================
  return (
    <div
      role="status"
      aria-label="Carregando produtos da loja..."
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-fade-in"
    >
      {items.map((idx) => (
        <div
          key={idx}
          className="relative bg-white rounded-card border border-slate-200/80 p-3 sm:p-4 space-y-3.5 shadow-card overflow-hidden"
        >
          {/* Imagem do Produto com Pulso Shimmer Refinado */}
          <div className="relative aspect-square w-full rounded-xl bg-slate-100 overflow-hidden shimmer-wave">
            <div className="absolute top-2.5 left-2.5 h-4 w-12 rounded-md bg-slate-200/80" />
            <div className="absolute top-2.5 right-2.5 h-6 w-6 rounded-full bg-slate-200/80" />
          </div>

          {/* Textos Simulados com Efeito Shimmer */}
          <div className="space-y-2 pt-1">
            {/* Linha da Categoria */}
            <div className="h-3 w-1/3 rounded-full bg-slate-200/70 shimmer-wave" />

            {/* Nome do Produto (2 linhas) */}
            <div className="space-y-1.5">
              <div className="h-3.5 w-full rounded-md bg-slate-200 shimmer-wave" />
              <div className="h-3.5 w-2/3 rounded-md bg-slate-200 shimmer-wave" />
            </div>

            {/* Preço e Botão */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <div className="space-y-1">
                <div className="h-4 w-20 rounded-md bg-slate-200 shimmer-wave" />
                <div className="h-2.5 w-14 rounded-md bg-slate-100 shimmer-wave" />
              </div>
              <div className="h-9 w-9 rounded-btn bg-slate-200 shimmer-wave" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Carregando catálogo...</span>
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando banners de destaque..."
      className="relative w-full aspect-[16/7] sm:aspect-[21/8] rounded-card bg-slate-200/80 shimmer-wave overflow-hidden"
    >
      <span className="sr-only">Carregando destaques...</span>
    </div>
  );
}
