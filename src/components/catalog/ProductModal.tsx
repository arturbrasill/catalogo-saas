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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col relative">
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-gray-700 shadow-sm transition"
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Coluna 1: Galeria de Imagens */}
          <div className="p-6 bg-gray-50 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100">
            {/* Imagem Principal */}
            <div className="aspect-square rounded-xl bg-white border border-gray-200 overflow-hidden flex items-center justify-center shadow-xs">
              {currentImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentImage}
                  alt={product.nome}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-300">
                  <Package className="w-16 h-16" />
                  <span className="text-xs mt-2 text-gray-400">Sem imagem</span>
                </div>
              )}
            </div>

            {/* Miniaturas do Carrossel */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`h-14 w-14 rounded-lg border-2 overflow-hidden flex-shrink-0 transition ${
                      selectedImageIndex === idx
                        ? 'border-emerald-600 ring-2 ring-emerald-600/30'
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

          {/* Coluna 2: Informações e Seleção de Variações */}
          <div className="p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Título e Preço */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-tight">
                  {product.nome}
                </h3>
                <div className="flex items-baseline gap-2.5 mt-2">
                  <span className="text-2xl font-black text-gray-900">
                    {formatCurrency(effectivePrice, store.currency)}
                  </span>
                  {product.precoPromocional && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatCurrency(product.preco, store.currency)}
                    </span>
                  )}
                </div>
              </div>

              {/* Status do Estoque */}
              <div>
                {isOutOfStock ? (
                  <span className="inline-flex items-center text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                    Produto Esgotado
                  </span>
                ) : product.estoque === -1 ? (
                  <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    Disponível sob encomenda
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                    Estoque disponível: {product.estoque} unid.
                  </span>
                )}
              </div>

              {/* Descrição */}
              {product.descricao && (
                <div className="text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  {product.descricao}
                </div>
              )}

              {/* Alerta de Validação */}
              {validationError && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Variações Obrigatórias */}
              {product.variacoes && product.variacoes.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  {product.variacoes.map((variation) => {
                    const selectedVal = selectedVariations[variation.tipo];
                    return (
                      <div key={variation.tipo} className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                          {variation.tipo} *
                        </label>
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
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'
                                }`}
                              >
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
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">
                  Quantidade:
                </span>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="p-1.5 hover:bg-gray-100 text-gray-600 disabled:opacity-30 transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-xs font-bold text-gray-800">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={isOutOfStock}
                    className="p-1.5 hover:bg-gray-100 text-gray-600 disabled:opacity-30 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-md hover:brightness-95 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: store.primary_color || '#10b981' }}
              >
                <ShoppingBag className="w-4 h-4" />
                Adicionar • {formatCurrency(itemSubtotal, store.currency)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
