'use client';

import React from 'react';

interface ProductGridSkeletonProps {
  count?: number;
}

export function ProductGridSkeleton({ count = 8 }: ProductGridSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div
      role="status"
      aria-label="Carregando produtos da loja..."
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-fade-in"
    >
      {items.map((idx) => (
        <div
          key={idx}
          className="relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-3 sm:p-4 space-y-3.5 shadow-2xs overflow-hidden"
        >
          {/* Imagem do Produto com Pulso Shimmer */}
          <div className="relative aspect-square w-full rounded-xl sm:rounded-2xl bg-slate-100 animate-pulse overflow-hidden">
            <div className="absolute top-2.5 left-2.5 h-4 w-12 rounded-md bg-slate-200/80" />
            <div className="absolute top-2.5 right-2.5 h-6 w-6 rounded-full bg-slate-200/80" />
          </div>

          {/* Textos Simulados */}
          <div className="space-y-2 pt-1">
            {/* Linha da Categoria */}
            <div className="h-3 w-1/3 rounded-full bg-slate-200/70 animate-pulse" />

            {/* Nome do Produto (2 linhas) */}
            <div className="space-y-1.5">
              <div className="h-3.5 w-full rounded-md bg-slate-200 animate-pulse" />
              <div className="h-3.5 w-2/3 rounded-md bg-slate-200 animate-pulse" />
            </div>

            {/* Preço e Botão */}
            <div className="pt-2 flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-4 w-20 rounded-md bg-slate-200 animate-pulse" />
                <div className="h-2.5 w-14 rounded-md bg-slate-100 animate-pulse" />
              </div>
              <div className="h-8 w-8 rounded-xl bg-slate-200 animate-pulse" />
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
      className="w-full aspect-[21/9] sm:aspect-[16/6] rounded-2xl sm:rounded-3xl bg-slate-200/80 animate-pulse my-4 shadow-2xs overflow-hidden"
    />
  );
}
