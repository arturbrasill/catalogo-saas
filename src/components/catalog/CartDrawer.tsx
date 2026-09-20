'use client';

import React, { useEffect } from 'react';
import { useCart } from '@/lib/cart';
import { formatCurrency, formatVariation, buildWhatsAppUrl } from '@/lib/whatsapp';
import type { StoreConfig } from '@/types';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';

interface CartDrawerProps {
  store: StoreConfig;
}

export function CartDrawer({ store }: CartDrawerProps) {
  const {
    items,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getTotalItems,
  } = useCart();

  // Fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Travar scroll do body quando o drawer estiver aberto
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const total = getSubtotal();
  const totalItemsCount = getTotalItems();

  const handleCheckoutWhatsApp = () => {
    if (items.length === 0) return;
    try {
      const url = buildWhatsAppUrl(
        {
          store_name: store.store_name,
          whatsapp: store.whatsapp,
          currency: store.currency,
        },
        items
      );
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao gerar pedido no WhatsApp.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header da Sacola */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-gray-900">Sua Sacola</h2>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'}
              </span>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              aria-label="Fechar sacola"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lista de Itens */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Sua sacola está vazia</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    Navegue pelos produtos da loja e adicione seus itens favoritos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCart}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                >
                  Continuar Comprando
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              items.map((item, index) => {
                const varText = formatVariation(item.variations);
                const effectivePrice =
                  item.promotionalPrice && item.promotionalPrice < item.unitPrice
                    ? item.promotionalPrice
                    : item.unitPrice;

                return (
                  <div
                    key={`${item.productId}-${index}`}
                    className="flex gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition"
                  >
                    {/* Thumbnail */}
                    <div className="h-16 w-16 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-200">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Detalhes do Produto */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {item.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-gray-400 hover:text-red-600 transition p-0.5"
                            title="Remover da sacola"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {varText && (
                          <p className="text-xs text-gray-500 italic mt-0.5 truncate">
                            {varText.replace(/^_|_$/g, '')}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-200/50">
                        {/* Preço Unitário & Subtotal */}
                        <div>
                          <span className="text-xs text-gray-500 block">
                            {formatCurrency(effectivePrice, store.currency)} cada
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(item.subtotal, store.currency)}
                          </span>
                        </div>

                        {/* Controle de Quantidade */}
                        <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="p-1 hover:bg-gray-100 text-gray-600 transition"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100 text-gray-600 transition"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Rodapé e Checkout */}
          {items.length > 0 && (
            <div className="p-5 border-t border-gray-200 bg-white space-y-4 shadow-lg">
              {/* Resumo de Valores */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(total, store.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-100">
                  <span>Total do Pedido</span>
                  <span className="text-emerald-700">
                    {formatCurrency(total, store.currency)}
                  </span>
                </div>
              </div>

              {/* Botão WhatsApp */}
              <button
                type="button"
                onClick={handleCheckoutWhatsApp}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-md hover:brightness-95 transition flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: store.primary_color || '#10b981' }}
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                Finalizar pelo WhatsApp
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-gray-400 hover:text-red-600 transition"
                >
                  Esvaziar sacola
                </button>
                <span className="text-[11px] text-gray-400">
                  Pedido seguro via WhatsApp direto da loja
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
