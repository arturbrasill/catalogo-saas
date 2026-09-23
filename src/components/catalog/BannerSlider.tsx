'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BannerSliderProps {
  banners?: string[];
  storeName?: string;
}

export function BannerSlider({ banners = [], storeName = 'Loja' }: BannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchOffset, setTouchOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filtra URLs válidas e limita a no máximo 5 banners
  const validBanners = banners.filter((b) => Boolean(b && b.trim())).slice(0, 5);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? validBanners.length - 1 : prev - 1));
  }, [validBanners.length]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === validBanners.length - 1 ? 0 : prev + 1));
  }, [validBanners.length]);

  // Autoplay com intervalo seguro (5s) e pausa em aba inativa / hover / toque
  useEffect(() => {
    if (validBanners.length <= 1 || isPaused || isDragging) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [validBanners.length, isPaused, isDragging, nextSlide]);

  // Touch Swipe Tátil com feedback de arrasto fluido no mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (validBanners.length <= 1 || !e.touches[0]) return;
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    setIsDragging(true);
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || touchStartX.current === null || !e.touches[0]) return;
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    // Amortecimento de arrasto nos limites
    setTouchOffset(diff);
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchCurrentX.current !== null) {
      const diff = touchCurrentX.current - touchStartX.current;
      const threshold = 45; // 45px de arrasto mínimo

      if (diff > threshold) {
        prevSlide();
      } else if (diff < -threshold) {
        nextSlide();
      }
    }

    touchStartX.current = null;
    touchCurrentX.current = null;
    setTouchOffset(0);
    setIsDragging(false);
    setIsPaused(false);
  };

  if (validBanners.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm group select-none bg-slate-100"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label={`Destaques e promoções da loja ${storeName}`}
    >
      {/* Container de Banners com Proporção Segura para Não Cortar Artes do Lojista */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[2.6/1] lg:aspect-[3/1] overflow-hidden">
        {/* Trilho de Deslizamento Real (Slide Carousel) */}
        <div
          className={`flex h-full w-full ${
            isDragging ? 'transition-none' : 'transition-transform duration-500 ease-out'
          }`}
          style={{
            transform: `translateX(calc(-${currentIndex * 100}% + ${touchOffset}px))`,
          }}
        >
          {validBanners.map((url, idx) => (
            <div
              key={idx}
              className="w-full h-full flex-shrink-0 relative overflow-hidden bg-slate-50"
              aria-hidden={idx !== currentIndex}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Banner promocional ${idx + 1} de ${validBanners.length} - ${storeName}`}
                className="w-full h-full object-cover object-center transition-transform duration-700 pointer-events-none"
                loading={idx === 0 ? 'eager' : 'lazy'}
                onError={(e) => {
                  // Fallback suave caso o link de imagem do Sheets expire ou seja inválido
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Controles de Navegação (Somente se houver mais de 1 banner) */}
      {validBanners.length > 1 && (
        <>
          {/* Botão Anterior */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-black/35 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-90 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer shadow-md hover:scale-105 active:scale-95"
            aria-label="Banner anterior"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>

          {/* Botão Próximo */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-black/35 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-90 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer shadow-md hover:scale-105 active:scale-95"
            aria-label="Próximo banner"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>

          {/* Indicadores de Pílulas no Rodapé */}
          <div className="absolute bottom-2.5 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/30 backdrop-blur-md shadow-xs">
            {validBanners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex
                    ? 'w-6 bg-white shadow-sm'
                    : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Ir para banner ${idx + 1}`}
                aria-current={idx === currentIndex ? 'true' : 'false'}
              />
            ))}
          </div>

          {/* Contador sutil no topo direito */}
          <div className="absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded-full bg-black/35 backdrop-blur-md text-[10px] font-bold text-white shadow-xs pointer-events-none">
            {currentIndex + 1} / {validBanners.length}
          </div>
        </>
      )}
    </div>
  );
}
