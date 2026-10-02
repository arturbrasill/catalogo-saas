'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Product, StoreConfig, SelectedVariation } from '@/types';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';
import { formatCurrency, calculateSubtotal } from '@/lib/whatsapp';
import { extractProductImages, DEFAULT_PRODUCT_IMAGE_FALLBACK } from '@/lib/sheetNormalization';
import {
  calculateEffectiveProductPrice,
  parseVariationOption,
  isColorVariation,
  formatInstallments,
  hasVariationPricing,
} from '@/lib/variations';
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Check,
  AlertCircle,
  Package,
  ShieldCheck,
  MessageCircle,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Truck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  store: StoreConfig;
  allProducts?: Product[];
  onSelectProduct?: (product: Product) => void;
}

export function ProductModal({
  product,
  onClose,
  store,
  allProducts = [],
  onSelectProduct,
}: ProductModalProps) {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useWishlist();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariations, setSelectedVariations] = useState<SelectedVariation>({});
  const [quantity, setQuantity] = useState(1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'shipping' | 'warranty'>('details');

  // Reseta estados quando o produto muda
  useEffect(() => {
    if (product) {
      setSelectedImageIndex(0);
      setSelectedVariations({});
      setQuantity(1);
      setValidationError(null);
      setCopied(false);
      setIsZoomOpen(false);
      setActiveTab('details');
    }
  }, [product]);

  const images = useMemo(() => {
    if (!product) return [];
    return extractProductImages(product.imagens);
  }, [product]);

  // Fechar com a tecla ESC e navegar com setas do teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZoomOpen) {
          setIsZoomOpen(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowRight' && images.length > 1) {
        setSelectedImageIndex((prev) => (prev + 1) % images.length);
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isZoomOpen, images.length]);

  // Produtos Relacionados (Cross-Selling: mesma categoria ou catálogo)
  const relatedProducts = useMemo(() => {
    if (!product || !allProducts || allProducts.length <= 1) return [];

    const sameCategory = allProducts.filter(
      (p) => p.id !== product.id && p.categoriaId === product.categoriaId && p.ativo !== false
    );

    if (sameCategory.length >= 3) {
      return sameCategory.slice(0, 4);
    }

    const others = allProducts.filter(
      (p) => p.id !== product.id && p.categoriaId !== product.categoriaId && p.ativo !== false
    );

    return [...sameCategory, ...others].slice(0, 4);
  }, [product, allProducts]);

  if (!product) return null;

  const currentImage = images[selectedImageIndex] || null;
  const isOutOfStock = product.estoque === 0;
  const favorite = isFavorite(product.id);

  // Cálculo de preços dinâmicos conforme variações selecionadas
  const priceCalc = calculateEffectiveProductPrice(
    product.preco,
    product.precoPromocional,
    selectedVariations,
    product.variacoes,
    store.currency
  );

  const currentUnitPrice = priceCalc.unitPrice;
  const currentPromoPrice = priceCalc.promotionalPrice;
  const currentEffectivePrice = priceCalc.effectivePrice;

  const savings =
    currentPromoPrice && currentPromoPrice < currentUnitPrice
      ? currentUnitPrice - currentPromoPrice
      : 0;

  const itemSubtotal = calculateSubtotal(
    currentUnitPrice,
    quantity,
    currentPromoPrice
  );

  const installmentText = formatInstallments(currentEffectivePrice, 3, 25, store.currency);

  const handleNextImage = () => {
    if (images.length <= 1) return;
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    if (images.length <= 1) return;
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleShare = async () => {
    if (!product || typeof window === 'undefined') return;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.nome} | ${store.store_name}`,
          text: `Confira ${product.nome} por ${formatCurrency(currentEffectivePrice, store.currency)} no catálogo oficial da loja ${store.store_name}!`,
          url: shareUrl,
        });
        return;
      } catch {
        // Usuário cancelou
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleAskWhatsApp = () => {
    if (!product || !store.whatsapp) return;
    const phone = String(store.whatsapp).replace(/\D/g, '');
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const message = `Olá ${store.store_name}! Gostaria de tirar uma dúvida sobre o produto *${product.nome}* (${formatCurrency(currentEffectivePrice, store.currency)}):\n${currentUrl}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noreferrer,noopener');
  };

  const handleSelectVariation = (tipo: string, opcaoLabel: string) => {
    setSelectedVariations((prev) => ({
      ...prev,
      [tipo]: opcaoLabel,
    }));
    setValidationError(null);
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    // Validação obrigatória de variações
    if (product.variacoes && product.variacoes.length > 0) {
      const missingTypes = product.variacoes.filter(
        (v) => !selectedVariations[v.tipo]
      );

      if (missingTypes.length > 0) {
        const missingNames = missingTypes.map((v) => v.tipo).join(', ');
        setValidationError(`Por favor, selecione: ${missingNames}.`);
        return;
      }
    }

    addItem(
      product,
      quantity,
      selectedVariations,
      {
        unitPrice: currentUnitPrice,
        promotionalPrice: currentPromoPrice,
      }
    );
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
        <div
          className="bg-brand-card rounded-t-3xl sm:rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col relative animate-slide-up sm:animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Bottom-Sheet Drag Handle */}
          <div className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 flex-shrink-0" />

          {/* Botões de Ação Topo (Favoritar, Compartilhar e Fechar) */}
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleFavorite(product.id)}
              className={`p-2.5 rounded-full backdrop-blur-md shadow-md border transition-all duration-200 cursor-pointer ${
                favorite
                  ? 'bg-rose-50 text-rose-500 border-rose-200 shadow-sm'
                  : 'bg-white/90 hover:bg-white text-slate-500 hover:text-rose-500 border-slate-200/60'
              }`}
              title={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart className={`w-4 h-4 ${favorite ? 'fill-rose-500 stroke-rose-500' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="p-2.5 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-slate-600 hover:text-slate-900 shadow-md border border-slate-200/60 transition-all duration-200 cursor-pointer flex items-center gap-1.5"
              title="Compartilhar produto"
              aria-label="Compartilhar produto"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span className="text-[11px] font-bold text-emerald-600 pr-1">Copiado!</span>
                </>
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-slate-600 hover:text-slate-900 shadow-md border border-slate-200/60 transition-all duration-200 cursor-pointer"
              aria-label="Fechar janela do produto"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grid Principal: Galeria & Informações */}
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Coluna 1: Galeria de Imagens Interativa */}
            <div className="p-5 sm:p-6 bg-slate-50/80 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100">
              <div className="space-y-3">
                {/* Imagem Principal com Controles de Navegação e Zoom */}
                <div className="relative aspect-square rounded-2xl bg-white border border-slate-200/80 overflow-hidden flex items-center justify-center shadow-xs group">
                  {currentImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentImage}
                        alt={product.nome}
                        onClick={() => setIsZoomOpen(true)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE_FALLBACK;
                        }}
                        className="h-full w-full object-cover cursor-zoom-in group-hover:scale-103 transition-transform duration-300"
                      />

                      {/* Botão de Lente de Zoom */}
                      <button
                        type="button"
                        onClick={() => setIsZoomOpen(true)}
                        className="absolute bottom-3 right-3 p-2 rounded-xl bg-white/90 backdrop-blur-md text-slate-700 shadow-sm border border-slate-200/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Ampliar imagem"
                        aria-label="Ampliar imagem"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>

                      {/* Setas de Próxima/Anterior se houver mais de 1 imagem */}
                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrevImage();
                            }}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 backdrop-blur-md shadow-md border border-slate-200/70 text-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-white"
                            aria-label="Foto anterior"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNextImage();
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 backdrop-blur-md shadow-md border border-slate-200/70 text-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-white"
                            aria-label="Próxima foto"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          {/* Indicador de posição (1 / X) */}
                          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-bold">
                            {selectedImageIndex + 1} / {images.length}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300 p-6">
                      <Package className="w-16 h-16 stroke-1 text-slate-300" />
                      <span className="text-xs mt-2 font-medium text-slate-400">Sem imagem disponível</span>
                    </div>
                  )}
                </div>

                {/* Carrossel de Miniaturas */}
                {images.length > 1 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-0.5">
                      <span className="font-bold uppercase tracking-wider text-slate-600">
                        Galeria de Fotos ({images.length})
                      </span>
                      <span>
                        Foto {selectedImageIndex + 1} de {images.length}
                      </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar items-center">
                      {images.map((imgUrl, idx) => {
                        const isSelected = selectedImageIndex === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedImageIndex(idx)}
                            className={`group relative h-15 w-15 sm:h-16 sm:w-16 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'border-slate-900 ring-2 ring-slate-900/20 scale-105 shadow-sm'
                                : 'border-slate-200/90 opacity-60 hover:opacity-100 hover:border-slate-400 hover:scale-102'
                            }`}
                            style={
                              isSelected && store.primary_color
                                ? { borderColor: store.primary_color }
                                : undefined
                            }
                            aria-label={`Visualizar foto ${idx + 1}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imgUrl}
                              alt={`Miniatura ${idx + 1}`}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE_FALLBACK;
                              }}
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                            {isSelected && (
                              <span
                                className="absolute bottom-0 inset-x-0 h-1 bg-slate-900"
                                style={store.primary_color ? { backgroundColor: store.primary_color } : undefined}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Botão de Dúvidas Diretas via WhatsApp */}
              {store.whatsapp && (
                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={handleAskWhatsApp}
                    className="w-full py-2.5 px-3 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Dúvidas? Fale direto no WhatsApp</span>
                  </button>
                </div>
              )}
            </div>

            {/* Coluna 2: Informações, Variações e Botão de Compra */}
            <div className="p-5 sm:p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                {/* Status do Estoque e Aviso de Preço Dinâmico */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        Esgotado
                      </span>
                    ) : product.estoque <= 3 && product.estoque > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Apenas {product.estoque} restantes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full border border-brand-primary/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse" />
                        Em estoque
                      </span>
                    )}
                  </div>

                  {hasVariationPricing(product.variacoes, product.preco, store.currency) && (
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      {priceCalc.hasPriceAdjustment
                        ? 'Preço atualizado para a opção selecionada'
                        : 'Preço varia conforme o tamanho/opção'}
                    </span>
                  )}
                </div>

                {/* Título e Preço Atualizado Dinamicamente */}
                <div>
                  <h3 className="text-xl font-black text-brand-text-main leading-tight">
                    {product.nome}
                  </h3>
                  <div className="flex items-baseline gap-3 mt-2 flex-wrap">
                    <span
                      className="text-2xl sm:text-3xl font-black tracking-tight text-brand-primary transition-all duration-200"
                      style={{ color: store.primary_color }}
                    >
                      {formatCurrency(currentEffectivePrice, store.currency)}
                    </span>
                    {currentPromoPrice && (
                      <span className="text-sm text-brand-text-muted line-through">
                        {formatCurrency(currentUnitPrice, store.currency)}
                      </span>
                    )}
                    {priceCalc.totalDelta > 0 && (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300">
                        + {formatCurrency(priceCalc.totalDelta, store.currency)} (opção)
                      </span>
                    )}
                    {savings > 0 && (
                      <span className="text-[11px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md border border-brand-primary/20">
                        Economize {formatCurrency(savings, store.currency)}
                      </span>
                    )}
                  </div>
                  {installmentText && (
                    <p className="text-xs text-brand-text-muted font-medium mt-1">
                      {installmentText}
                    </p>
                  )}
                </div>

                {/* Alerta de Validação */}
                {validationError && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="font-medium">{validationError}</span>
                  </div>
                )}

                {/* Seleção de Variações com Pílulas Modernas e Feedback Visual Impecável */}
                {product.variacoes && product.variacoes.length > 0 && (
                  <div className="space-y-4 pt-1">
                    {product.variacoes.map((variation) => {
                      const isColor = isColorVariation(variation.tipo);
                      const selectedVal = selectedVariations[variation.tipo];

                      return (
                        <div key={variation.tipo} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                              {variation.tipo}:
                            </label>
                            {selectedVal ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full shadow-2xs">
                                <Check className="w-3 h-3 stroke-[3] text-emerald-600" />
                                <span>{selectedVal}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">
                                Selecione uma opção
                              </span>
                            )}
                          </div>

                          <div
                            className="flex flex-wrap gap-2"
                            role="radiogroup"
                            aria-label={variation.tipo}
                          >
                            {variation.opcoes.map((opcao, optIdx) => {
                              const parsed = parseVariationOption(opcao as any, store.currency);
                              const isSelected = selectedVal === parsed.cleanLabel;

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  role="radio"
                                  aria-checked={isSelected}
                                  aria-label={`${variation.tipo}: ${parsed.cleanLabel}`}
                                  onClick={() =>
                                    handleSelectVariation(variation.tipo, parsed.cleanLabel)
                                  }
                                  className={`group/btn relative px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer flex items-center gap-2 active:scale-95 shadow-2xs ${
                                    isSelected
                                      ? 'text-white border-transparent shadow-md scale-102 ring-2 ring-offset-1'
                                      : 'bg-white text-slate-700 border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-xs'
                                  }`}
                                  style={
                                    isSelected
                                      ? {
                                          backgroundColor: store.primary_color || '#0f172a',
                                          borderColor: store.primary_color || '#0f172a',
                                          boxShadow: `0 4px 14px 0 ${store.primary_color ? `${store.primary_color}40` : 'rgba(15,23,42,0.2)'}`,
                                        }
                                      : undefined
                                  }
                                >
                                  {isColor && parsed.corHex && (
                                    <span
                                      className={`h-4 w-4 rounded-full border shadow-2xs transition-transform duration-200 ${
                                        isSelected
                                          ? 'border-2 border-white ring-2 ring-white/80 scale-110'
                                          : 'border-black/20 group-hover/btn:scale-105'
                                      }`}
                                      style={{ backgroundColor: parsed.corHex }}
                                    />
                                  )}

                                  <span className="tracking-tight">{parsed.cleanLabel}</span>

                                  {parsed.displayBadge && (
                                    <span
                                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-md transition-colors ${
                                        isSelected
                                          ? 'bg-white/25 text-white border border-white/20'
                                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      }`}
                                    >
                                      {parsed.displayBadge}
                                    </span>
                                  )}

                                  {isSelected && (
                                    <span className="flex items-center justify-center h-4 w-4 rounded-full bg-white/20 ml-0.5 animate-scale-in">
                                      <Check className="w-3 h-3 stroke-[3] text-white" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Abas Informativas (Detalhes, Envio, Garantia) */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('details')}
                      className={`text-xs font-bold pb-1.5 border-b-2 transition cursor-pointer ${
                        activeTab === 'details'
                          ? 'border-slate-900 text-slate-900'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Detalhes
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('shipping')}
                      className={`text-xs font-bold pb-1.5 border-b-2 transition cursor-pointer flex items-center gap-1 ${
                        activeTab === 'shipping'
                          ? 'border-slate-900 text-slate-900'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Truck className="w-3 h-3" />
                      <span>Envio & Entrega</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('warranty')}
                      className={`text-xs font-bold pb-1.5 border-b-2 transition cursor-pointer flex items-center gap-1 ${
                        activeTab === 'warranty'
                          ? 'border-slate-900 text-slate-900'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Trocas & Garantia</span>
                    </button>
                  </div>

                  {activeTab === 'details' && (
                    <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                      {product.descricao || 'Produto original com garantia da loja e pronta entrega.'}
                    </div>
                  )}

                  {activeTab === 'shipping' && (
                    <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-2xl border border-slate-100 space-y-1">
                      <p className="font-bold text-slate-800">Opções de Envio:</p>
                      <p>• Entrega regional rápida via motoboy ou transportadora.</p>
                      <p>• Opção de retirada imediata no balcão da loja física.</p>
                    </div>
                  )}

                  {activeTab === 'warranty' && (
                    <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-2xl border border-slate-100 space-y-1">
                      <p className="font-bold text-slate-800">Garantia & Troca Fácil:</p>
                      <p>• Produto 100% original e conferido antes do envio.</p>
                      <p>• Suporte direto via WhatsApp para trocas de numeração ou dúvidas.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé: Contador de Quantidade e Botão Adicionar à Sacola (Fixo no Mobile) */}
              <div className="space-y-3 pt-3 border-t border-slate-100 sticky bottom-0 bg-white/95 backdrop-blur-md -mx-5 -mb-5 p-4 sm:p-0 sm:static sm:bg-transparent sm:mx-0 sm:mb-0 z-10 shadow-lg sm:shadow-none">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Quantidade:
                  </span>
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      className="p-2 text-slate-600 hover:bg-slate-200/80 active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                      aria-label="Diminuir quantidade"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-xs font-black text-brand-text-main select-none">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (product.estoque === -1 || quantity < product.estoque) {
                          setQuantity((q) => q + 1);
                        }
                      }}
                      disabled={
                        isOutOfStock ||
                        (product.estoque !== -1 && quantity >= product.estoque)
                      }
                      className="p-2 text-slate-600 hover:bg-slate-200/80 active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Botão Principal com Preço Total Atualizado */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm text-brand-contrast bg-brand-primary hover:bg-brand-primary-hover shadow-md hover:brightness-95 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: store.primary_color }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {isOutOfStock ? (
                    'Produto Esgotado'
                  ) : (
                    <span>
                      Adicionar à Sacola • {formatCurrency(itemSubtotal, store.currency)}
                    </span>
                  )}
                </button>
                {store.is_open === false && (
                  <p className="text-[10px] text-center text-amber-800 font-medium">
                    🕒 Loja fechada agora — pedidos serão atendidos no próximo expediente.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Seção "Você Também Pode Gostar" (Cross-Selling de Produtos Relacionados) */}
          {relatedProducts.length > 0 && onSelectProduct && (
            <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Você Também Pode Gostar
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400">Sugestões para você</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedProducts.map((rel) => {
                  const relPrice =
                    rel.precoPromocional && rel.precoPromocional < rel.preco
                      ? rel.precoPromocional
                      : rel.preco;
                  const relImg = rel.imagens && rel.imagens.length > 0 ? rel.imagens[0] : null;

                  return (
                    <div
                      key={rel.id}
                      onClick={() => onSelectProduct(rel)}
                      className="p-2.5 rounded-2xl bg-white border border-slate-200/70 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="aspect-square rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center mb-2">
                        {relImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={relImg}
                            alt={rel.nome}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-800 truncate group-hover:text-slate-600">
                          {rel.nome}
                        </h5>
                        <p
                          className="text-xs font-black mt-0.5 text-brand-primary"
                          style={{ color: store.primary_color }}
                        >
                          {formatCurrency(relPrice, store.currency)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / Zoom em Tela Cheia com Navegação de Galeria */}
      {isZoomOpen && currentImage && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-fade-in"
          onClick={() => setIsZoomOpen(false)}
        >
          {/* Topo do Lightbox: Título, Contador e Fechar */}
          <div className="w-full max-w-5xl flex items-center justify-between text-white z-10">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold truncate max-w-xs sm:max-w-md">
                {product.nome}
              </span>
              {images.length > 1 && (
                <span className="text-xs text-white/70 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-md">
                  {selectedImageIndex + 1} / {images.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              aria-label="Fechar zoom"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Imagem em Zoom com Controles de Navegação */}
          <div className="relative flex-1 flex items-center justify-center w-full my-auto overflow-hidden">
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  className="absolute left-2 sm:left-6 z-20 h-11 w-11 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition cursor-pointer"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="absolute right-2 sm:right-6 z-20 h-11 w-11 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition cursor-pointer"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage}
              alt={product.nome}
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE_FALLBACK;
              }}
              className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Rodapé do Lightbox: Miniaturas Rápidas */}
          {images.length > 1 && (
            <div
              className="w-full max-w-xl flex items-center justify-center gap-2 overflow-x-auto py-2 no-scrollbar z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all cursor-pointer ${
                    selectedImageIndex === idx
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-white/30 opacity-60 hover:opacity-100'
                  }`}
                  aria-label={`Miniatura ${idx + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={`Miniatura ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
