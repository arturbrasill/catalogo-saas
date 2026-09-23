'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Product, StoreConfig, SelectedVariation } from '@/types';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';
import { formatCurrency, calculateSubtotal } from '@/lib/whatsapp';
import {
  calculateEffectiveProductPrice,
  parseVariationOption,
  isColorVariation,
  formatInstallments,
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

  // Fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZoomOpen) {
          setIsZoomOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isZoomOpen]);

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

  const images = product.imagens && product.imagens.length > 0 ? product.imagens : [];
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
    const phone = store.whatsapp.replace(/\D/g, '');
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
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {images.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`h-14 w-14 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all cursor-pointer ${
                          selectedImageIndex === idx
                            ? 'border-slate-900 ring-2 ring-slate-900/10 scale-102 shadow-xs'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
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

                  {priceCalc.hasPriceAdjustment && (
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      Preço varia por opção
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
                      className="text-2xl sm:text-3xl font-black tracking-tight text-brand-primary"
                      style={{ color: store.primary_color }}
                    >
                      {formatCurrency(currentEffectivePrice, store.currency)}
                    </span>
                    {currentPromoPrice && (
                      <span className="text-sm text-brand-text-muted line-through">
                        {formatCurrency(currentUnitPrice, store.currency)}
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

                {/* Seleção de Variações com Pílulas Modernas */}
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
                            {selectedVal && (
                              <span className="text-xs font-bold text-brand-primary">
                                {selectedVal}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {variation.opcoes.map((opcao, optIdx) => {
                              const parsed = parseVariationOption(opcao as any, store.currency);
                              const isSelected = selectedVal === parsed.cleanLabel;

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() =>
                                    handleSelectVariation(variation.tipo, parsed.cleanLabel)
                                  }
                                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 active:scale-95 ${
                                    isSelected
                                      ? 'bg-brand-primary text-brand-contrast border-brand-primary shadow-xs scale-102 ring-2 ring-brand-primary/20'
                                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80 shadow-2xs'
                                  }`}
                                  style={
                                    isSelected && store.primary_color
                                      ? { backgroundColor: store.primary_color }
                                      : undefined
                                  }
                                >
                                  {isColor && parsed.corHex && (
                                    <span
                                      className={`h-3.5 w-3.5 rounded-full border shadow-2xs ${
                                        isSelected ? 'border-white ring-1 ring-white/60' : 'border-black/20'
                                      }`}
                                      style={{ backgroundColor: parsed.corHex }}
                                    />
                                  )}

                                  <span>{parsed.cleanLabel}</span>

                                  {parsed.displayBadge && (
                                    <span
                                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                                        isSelected
                                          ? 'bg-white/25 text-white'
                                          : 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                                      }`}
                                    >
                                      {parsed.displayBadge}
                                    </span>
                                  )}

                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] ml-0.5" />}
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

              {/* Rodapé: Contador de Quantidade e Botão Adicionar à Sacola */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
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

      {/* Lightbox / Zoom em Tela Cheia */}
      {isZoomOpen && currentImage && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-5 right-5 p-3 rounded-full bg-white/20 text-white hover:bg-white/40 transition cursor-pointer"
            aria-label="Fechar zoom"
          >
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage}
            alt={product.nome}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
