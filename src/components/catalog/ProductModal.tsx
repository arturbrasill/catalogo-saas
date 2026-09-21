'use client';

import React, { useState, useEffect } from 'react';
import type { Product, StoreConfig, SelectedVariation } from '@/types';
import { useCart } from '@/lib/cart';
import { formatCurrency, calculateSubtotal } from '@/lib/whatsapp';
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Check,
  AlertCircle,
  Package,
  ShieldCheck,
  Truck,
  MessageCircle,
} from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  store: StoreConfig;
}

export function ProductModal({ product, onClose, store }: ProductModalProps) {
  const { addItem } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariations, setSelectedVariations] = useState<SelectedVariation>({});
  const [quantity, setQuantity] = useState(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reseta estados quando o produto muda
  useEffect(() => {
    if (product) {
      setSelectedImageIndex(0);
      setSelectedVariations({});
      setQuantity(1);
      setValidationError(null);
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

  const effectivePrice =
    product.precoPromocional && product.precoPromocional < product.preco
      ? product.precoPromocional
      : product.preco;

  const savings = product.precoPromocional && product.precoPromocional < product.preco
    ? product.preco - product.precoPromocional
    : 0;

  const itemSubtotal = calculateSubtotal(
    product.preco,
    quantity,
    product.precoPromocional
  );

  const isOutOfStock = product.estoque === 0;

  const handleSelectVariation = (tipo: string, opcao: string) => {
    setSelectedVariations((prev) => ({
      ...prev,
      [tipo]: opcao,
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

    addItem(product, quantity, selectedVariations);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-slate-600 hover:text-slate-900 shadow-md border border-slate-200/60 transition-all duration-200 cursor-pointer"
          aria-label="Fechar janela do produto"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Coluna 1: Galeria de Imagens */}
          <div className="p-5 sm:p-6 bg-slate-50 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100">
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
              <div className="flex gap-2.5 mt-4 overflow-x-auto pb-1 no-scrollbar">
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

            {/* Vantagens / Selos dentro da coluna de imagem */}
            <div className="mt-5 pt-4 border-t border-slate-200/60 hidden md:flex flex-col gap-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Negociação e dúvidas diretas no WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Pedido oficial emitido diretamente para a loja</span>
              </div>
            </div>
          </div>

          {/* Coluna 2: Informações e Seleção */}
          <div className="p-5 sm:p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Selo de Avaliação & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <span className="text-amber-400 text-sm">★</span>
                  <span>4.9</span>
                  <span className="text-slate-400 font-normal">(Avaliação da Loja)</span>
                </div>

                {/* Status do Estoque */}
                <div>
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      Esgotado
                    </span>
                  ) : product.estoque === -1 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                      Sob encomenda
                    </span>
                  ) : product.estoque <= 3 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Apenas {product.estoque} restantes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Em estoque ({product.estoque})
                    </span>
                  )}
                </div>
              </div>

              {/* Título e Preço */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 leading-tight">
                  {product.nome}
                </h3>
                <div className="flex items-baseline gap-3 mt-2.5">
                  <span
                    className="text-2xl font-black tracking-tight"
                    style={{ color: store.primary_color || '#10b981' }}
                  >
                    {formatCurrency(effectivePrice, store.currency)}
                  </span>
                  {product.precoPromocional && (
                    <span className="text-sm text-slate-400 line-through">
                      {formatCurrency(product.preco, store.currency)}
                    </span>
                  )}
                  {savings > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Economize {formatCurrency(savings, store.currency)}
                    </span>
                  )}
                </div>
              </div>

              {/* Descrição */}
              {product.descricao && (
                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100">
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

              {/* Variações Obrigatórias */}
              {product.variacoes && product.variacoes.length > 0 && (
                <div className="space-y-3.5 pt-1">
                  {product.variacoes.map((variation) => {
                    const selectedVal = selectedVariations[variation.tipo];
                    return (
                      <div key={variation.tipo} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            {variation.tipo}:
                          </label>
                          {selectedVal && (
                            <span className="text-xs font-semibold text-emerald-700">
                              {selectedVal}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {variation.opcoes.map((opcao) => {
                            const isSelected = selectedVal === opcao;
                            return (
                              <button
                                key={opcao}
                                type="button"
                                onClick={() =>
                                  handleSelectVariation(variation.tipo, opcao)
                                }
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'text-white border-transparent shadow-sm'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                                }`}
                                style={
                                  isSelected
                                    ? { backgroundColor: store.primary_color || '#10b981' }
                                    : undefined
                                }
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                {opcao}
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

            {/* Rodapé: Quantidade e Botão Adicionar */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Quantidade:
                </span>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="p-2 hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition cursor-pointer"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-3.5 text-xs font-bold text-slate-800">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={isOutOfStock}
                    className="p-2 hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition cursor-pointer"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="w-full py-3.5 px-4 rounded-xl font-extrabold text-sm text-white shadow-lg hover:brightness-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: store.primary_color || '#10b981' }}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Adicionar à Sacola • {formatCurrency(itemSubtotal, store.currency)}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
