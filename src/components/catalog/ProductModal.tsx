'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  store: StoreConfig;
}

export function ProductModal({ product, onClose, store }: ProductModalProps) {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useWishlist();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariations, setSelectedVariations] = useState<SelectedVariation>({});
  const [quantity, setQuantity] = useState(1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reseta estados quando o produto muda
  useEffect(() => {
    if (product) {
      setSelectedImageIndex(0);
      setSelectedVariations({});
      setQuantity(1);
      setValidationError(null);
      setCopied(false);
    }
  }, [product]);

  // Fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  const handleShare = async () => {
    if (!product || typeof window === 'undefined') return;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.nome} | ${store.store_name}`,
          text: `Confira ${product.nome} por ${formatCurrency(currentEffectivePrice, store.currency)} no catálogo de ${store.store_name}!`,
          url: shareUrl,
        });
        return;
      } catch {
        // Usuário cancelou ou fallback
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botões de Ação Topo (Favoritar, Compartilhar e Fechar) */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleFavorite(product.id)}
            className={`p-2 rounded-full backdrop-blur-md shadow-md border transition-all duration-200 cursor-pointer ${
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
            className="p-2 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-slate-600 hover:text-slate-900 shadow-md border border-slate-200/60 transition-all duration-200 cursor-pointer flex items-center gap-1.5"
            title="Compartilhar produto"
            aria-label="Compartilhar produto"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                <span className="text-[11px] font-bold text-emerald-600 pr-1">Link Copiado!</span>
              </>
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-slate-600 hover:text-slate-900 shadow-md border border-slate-200/60 transition-all duration-200 cursor-pointer"
            aria-label="Fechar janela do produto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Coluna 1: Galeria de Imagens */}
          <div className="p-5 sm:p-6 bg-slate-50 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100">
            <div className="space-y-3">
              {/* Imagem Principal */}
              <div className="aspect-square rounded-2xl bg-white border border-slate-200/80 overflow-hidden flex items-center justify-center shadow-xs">
                {currentImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentImage}
                    alt={product.nome}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300 p-6">
                    <Package className="w-16 h-16 stroke-1 text-slate-300" />
                    <span className="text-xs mt-2 font-medium text-slate-400">Sem imagem disponível</span>
                  </div>
                )}
              </div>

              {/* Miniaturas do Carrossel */}
              {images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                  {images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`h-14 w-14 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-emerald-600 ring-2 ring-emerald-500/20 scale-105 shadow-sm'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={`Foto ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vantagens Universais */}
            <div className="mt-5 pt-4 border-t border-slate-200/60 hidden md:flex flex-col gap-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Produto original com garantia da loja</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Negociação e dúvidas diretas no WhatsApp</span>
              </div>
            </div>
          </div>

          {/* Coluna 2: Informações, Variações e Compra */}
          <div className="p-5 sm:p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Status do Estoque */}
              <div className="flex items-center justify-between">
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
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
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
                <h3 className="text-xl font-black text-slate-900 leading-tight">
                  {product.nome}
                </h3>
                <div className="flex items-baseline gap-3 mt-2.5 flex-wrap">
                  <span
                    className="text-2xl font-black tracking-tight"
                    style={{ color: store.primary_color || '#10b981' }}
                  >
                    {formatCurrency(currentEffectivePrice, store.currency)}
                  </span>
                  {currentPromoPrice && (
                    <span className="text-sm text-slate-400 line-through">
                      {formatCurrency(currentUnitPrice, store.currency)}
                    </span>
                  )}
                  {savings > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Economize {formatCurrency(savings, store.currency)}
                    </span>
                  )}
                </div>
                {installmentText && (
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {installmentText}
                  </p>
                )}
              </div>

              {/* Descrição */}
              {product.descricao && (
                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                  {product.descricao}
                </div>
              )}

              {/* Alerta de Validação */}
              {validationError && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="font-medium">{validationError}</span>
                </div>
              )}

              {/* Seleção de Variações Universais */}
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
                            <span className="text-xs font-bold text-slate-900">
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
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                                  isSelected
                                    ? 'text-white border-transparent shadow-sm scale-102'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                                style={
                                  isSelected
                                    ? { backgroundColor: store.primary_color || '#10b981' }
                                    : undefined
                                }
                              >
                                {/* Ponto visual de cor se for variação de cor */}
                                {isColor && parsed.corHex && (
                                  <span
                                    className="h-3 w-3 rounded-full border border-black/20 shadow-2xs"
                                    style={{ backgroundColor: parsed.corHex }}
                                  />
                                )}

                                <span>{parsed.cleanLabel}</span>

                                {/* Badge com valor adicional caso exista */}
                                {parsed.displayBadge && (
                                  <span
                                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                                      isSelected
                                        ? 'bg-white/25 text-white'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
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
            </div>

            {/* Rodapé: Quantidade e Botão Adicionar à Sacola */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Quantidade:
                </span>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-9 text-center text-xs font-bold text-slate-900">
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
                    className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
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
                className="w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm text-white shadow-sm hover:brightness-95 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: store.primary_color || '#10b981' }}
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
      </div>
    </div>
  );
}
