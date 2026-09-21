'use client';

import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  ShieldCheck,
  Tag,
  Check,
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

  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

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

  // Limpa erros ao abrir/fechar drawer
  useEffect(() => {
    setCheckoutError(null);
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const rawSubtotal = getSubtotal();
  const totalItemsCount = getTotalItems();

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponApplied(true);
    setCouponMessage(`Cupom "${couponCode.trim().toUpperCase()}" anotado para negociação no WhatsApp!`);
  };

  const handleCheckoutWhatsApp = () => {
    if (items.length === 0) return;
    setCheckoutError(null);

    const rawPhone = store?.whatsapp !== undefined && store?.whatsapp !== null ? String(store.whatsapp).trim() : '';
    if (!rawPhone) {
      setCheckoutError('Número de WhatsApp ainda não cadastrado para esta loja.');
      return;
    }

    try {
      const url = buildWhatsAppUrl(
        {
          store_name: store.store_name,
          whatsapp: rawPhone,
          currency: store.currency,
        },
        items
      );
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : 'Erro ao gerar pedido no WhatsApp.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop com blur */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-slide-up sm:animate-none">
          {/* Header da Sacola (Estilo NovaShop) */}
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                style={{ backgroundColor: store.primary_color || '#10b981' }}
              >
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  Minha Sacola
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item adicionado' : 'itens adicionados'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
              aria-label="Fechar sacola"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de Motivação / Frete */}
          {items.length > 0 && (
            <div className="bg-emerald-50/80 border-b border-emerald-100 px-6 py-2.5 text-xs text-emerald-800 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span className="font-medium">
                Converse com o lojista no WhatsApp para combinar entrega e pagamento!
              </span>
            </div>
          )}

          {/* Lista de Itens */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="h-20 w-20 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10 stroke-1 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Sua sacola está vazia</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                    Explore os produtos disponíveis em nosso catálogo e monte seu pedido para enviar no WhatsApp.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCart}
                  className="inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl text-white shadow-sm hover:brightness-95 transition cursor-pointer"
                  style={{ backgroundColor: store.primary_color || '#10b981' }}
                >
                  Explorar Catálogo
                  <ArrowRight className="w-4 h-4" />
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
                    className="flex gap-3.5 p-3.5 rounded-2xl border border-slate-200/70 bg-white hover:border-slate-300 transition shadow-2xs"
                  >
                    {/* Thumbnail */}
                    <div className="h-20 w-20 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200/60 flex items-center justify-center">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="w-7 h-7 text-slate-300 stroke-1" />
                      )}
                    </div>

                    {/* Detalhes do Produto */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate leading-snug">
                            {item.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                            title="Remover produto da sacola"
                            aria-label={`Remover ${item.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {varText && (
                          <span className="inline-block mt-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                            {varText.replace(/^_|_$/g, '')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                        {/* Preço Unitário & Subtotal */}
                        <div>
                          <span className="text-[11px] text-slate-400 block">
                            {formatCurrency(effectivePrice, store.currency)} unid.
                          </span>
                          <span
                            className="text-sm font-extrabold"
                            style={{ color: store.primary_color || '#10b981' }}
                          >
                            {formatCurrency(item.subtotal, store.currency)}
                          </span>
                        </div>

                        {/* Controle de Quantidade Moderno */}
                        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="p-1.5 hover:bg-slate-200/80 text-slate-600 transition cursor-pointer"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-slate-800 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="p-1.5 hover:bg-slate-200/80 text-slate-600 transition cursor-pointer"
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

          {/* Rodapé e Checkout (Inspirado em NovaShop) */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-200 bg-white space-y-4 shadow-xl">
              {/* Campo de Cupom */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Código de cupom..."
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  Aplicar
                </button>
              </form>

              {couponMessage && (
                <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{couponMessage}</span>
                </div>
              )}

              {/* Resumo de Valores */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Subtotal dos itens</span>
                  <span className="font-semibold text-slate-700">
                    {formatCurrency(rawSubtotal, store.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Entrega / Frete</span>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                    Combinar no WhatsApp
                  </span>
                </div>
                <div className="flex items-center justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total estimado</span>
                  <span
                    className="text-lg font-black"
                    style={{ color: store.primary_color || '#10b981' }}
                  >
                    {formatCurrency(rawSubtotal, store.currency)}
                  </span>
                </div>
              </div>

              {/* Alerta de Erro de WhatsApp */}
              {checkoutError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{checkoutError}</p>
                    <p className="text-[11px] text-amber-700">
                      Cadastre o WhatsApp no painel de configurações para habilitar o checkout.
                    </p>
                  </div>
                </div>
              )}

              {/* Botão Principal WhatsApp */}
              <button
                type="button"
                onClick={handleCheckoutWhatsApp}
                className="w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm text-white shadow-lg hover:brightness-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                style={{ backgroundColor: store.primary_color || '#10b981' }}
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Finalizar Pedido no WhatsApp</span>
              </button>

              {/* Ações Secundárias e Selo de Confiança */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <button
                  type="button"
                  onClick={clearCart}
                  className="hover:text-rose-600 transition cursor-pointer"
                >
                  Limpar sacola
                </button>
                <span className="flex items-center gap-1 text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Atendimento direto e seguro
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
