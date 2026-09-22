'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart';
import { formatCurrency, formatVariation, buildWhatsAppUrl } from '@/lib/whatsapp';
import type { StoreConfig, PaymentMethod, CustomerOrderInfo } from '@/types';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  AlertCircle,
  ShieldCheck,
  Tag,
  Check,
  CreditCard,
  Banknote,
  QrCode,
  User,
  FileText,
  Copy,
} from 'lucide-react';

interface CartDrawerProps {
  store: StoreConfig;
}

const CUSTOMER_STORAGE_KEY = 'catalogo_customer_details_v1';

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
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
    getTotal,
  } = useCart();

  const [step, setStep] = useState<'items' | 'checkout'>('items');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Estados de Cupom
  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Dados do formulário de checkout
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [changeFor, setChangeFor] = useState('');
  const [notes, setNotes] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);

  // Carrega dados salvos do cliente para agilizar recompra
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOMER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.customerName) setCustomerName(parsed.customerName);
        if (parsed.customerPhone) setCustomerPhone(parsed.customerPhone);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
      }
    } catch {
      // ignore
    }
  }, []);

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
  const finalTotal = getTotal();
  const totalItemsCount = getTotalItems();

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    setCouponFeedback(null);
    try {
      const res = await applyCoupon(couponInput.trim());
      if (res.success) {
        setCouponFeedback({ type: 'success', message: res.message });
        setCouponInput('');
      } else {
        setCouponFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setCouponFeedback({ type: 'error', message: 'Erro ao validar cupom.' });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleAdvanceToCheckout = () => {
    if (items.length === 0) return;
    setCheckoutError(null);
    setStep('checkout');
  };

  const handleCheckoutWhatsApp = () => {
    if (items.length === 0) return;
    setCheckoutError(null);

    // Validação de dados do cliente
    if (!customerName.trim() || customerName.trim().length < 2) {
      setCheckoutError('Por favor, informe seu nome para identificação do pedido.');
      return;
    }

    const rawPhone =
      store?.whatsapp !== undefined && store?.whatsapp !== null
        ? String(store.whatsapp).trim()
        : '';
    if (!rawPhone) {
      setCheckoutError('Número de WhatsApp ainda não cadastrado para esta loja.');
      return;
    }

    // Salva dados no localStorage para agilizar próximos pedidos
    try {
      localStorage.setItem(
        CUSTOMER_STORAGE_KEY,
        JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          paymentMethod,
        })
      );
    } catch {
      // ignore
    }

    try {
      const orderInfo: CustomerOrderInfo = {
        customerName: customerName.trim(),
        phone: customerPhone.trim() || undefined,
        paymentMethod,
        changeFor: paymentMethod === 'money' && changeFor.trim() ? changeFor.trim() : undefined,
        notes: notes.trim() || undefined,
        appliedCoupon,
        discountAmount,
      };

      const url = buildWhatsAppUrl(
        {
          store_name: store.store_name,
          whatsapp: rawPhone,
          currency: store.currency,
        },
        {
          items,
          total: finalTotal,
          totalItems: totalItemsCount,
          appliedCoupon,
          discountAmount,
        },
        orderInfo
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

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-slide-up sm:animate-none">
          {/* Header da Sacola com indicador de etapa */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              {step === 'checkout' ? (
                <button
                  type="button"
                  onClick={() => setStep('items')}
                  className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
                  title="Voltar para sacola"
                  aria-label="Voltar para sacola"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: store.primary_color || '#10b981' }}
                >
                  <ShoppingBag className="w-4 h-4" />
                </div>
              )}
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  {step === 'items' ? 'Minha Sacola' : 'Finalizar Pedido'}
                </h2>
                <span className="text-[11px] text-slate-500 font-medium">
                  {step === 'items'
                    ? `${totalItemsCount} ${totalItemsCount === 1 ? 'item adicionado' : 'itens adicionados'}`
                    : 'Preencha entrega e pagamento'}
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

          {/* Banner Informativo */}
          {items.length > 0 && (
            <div className="bg-emerald-50/80 border-b border-emerald-100 px-5 py-2 text-xs text-emerald-800 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span className="font-medium text-[11px] sm:text-xs">
                {step === 'items'
                  ? 'Revise seus itens e avance para os dados de entrega!'
                  : 'Seu pedido será enviado formatado direto no WhatsApp!'}
              </span>
            </div>
          )}

          {/* ======================================================== */}
          {/* ETAPA 1: LISTAGEM DE ITENS                                */}
          {/* ======================================================== */}
          {step === 'items' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="h-20 w-20 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 stroke-1 text-slate-300" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Sua sacola está vazia</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                        Explore os produtos disponíveis no catálogo e monte seu pedido para enviar no WhatsApp.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeCart}
                      className="inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl text-white shadow-sm hover:brightness-95 transition cursor-pointer"
                      style={{ backgroundColor: store.primary_color || '#10b981' }}
                    >
                      Explorar Produtos
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
                        className="flex gap-3 p-3 rounded-2xl border border-slate-200/70 bg-white hover:border-slate-300 transition shadow-2xs"
                      >
                        {/* Thumbnail */}
                        <div className="h-18 w-18 sm:h-20 sm:w-20 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200/60 flex items-center justify-center">
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ShoppingBag className="w-6 h-6 text-slate-300 stroke-1" />
                          )}
                        </div>

                        {/* Detalhes */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-1.5">
                              <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate leading-snug">
                                {item.name}
                              </h4>
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-slate-400 hover:text-rose-600 transition p-0.5 cursor-pointer"
                                title="Remover item"
                                aria-label={`Remover ${item.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {varText && (
                              <span className="inline-block mt-0.5 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                                {varText.replace(/^_|_$/g, '')}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
                            <div>
                              <span className="text-[10px] text-slate-400 block">
                                {formatCurrency(effectivePrice, store.currency)} un.
                              </span>
                              <span
                                className="text-xs sm:text-sm font-extrabold"
                                style={{ color: store.primary_color || '#10b981' }}
                              >
                                {formatCurrency(item.subtotal, store.currency)}
                              </span>
                            </div>

                            <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                className="p-1 hover:bg-slate-200/80 text-slate-600 transition cursor-pointer"
                                aria-label="Diminuir quantidade"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-bold text-slate-800 min-w-[18px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                className="p-1 hover:bg-slate-200/80 text-slate-600 transition cursor-pointer"
                                aria-label="Aumentar quantidade"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Rodapé da Etapa 1 */}
              {items.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-3.5 shadow-xl">
                  {/* Bloco de Cupom de Desconto */}
                  {appliedCoupon ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between animate-fade-in">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="h-7 w-7 rounded-lg text-white flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: store.primary_color || '#10b981' }}
                        >
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-emerald-950 uppercase tracking-wider font-mono">
                              {appliedCoupon.codigo}
                            </span>
                            <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded">
                              {appliedCoupon.tipo === 'percentage'
                                ? `${appliedCoupon.valor}% OFF`
                                : `${formatCurrency(appliedCoupon.valor, store.currency)} OFF`}
                            </span>
                          </div>
                          {appliedCoupon.valorMinimo && rawSubtotal < appliedCoupon.valorMinimo ? (
                            <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                              Mínimo de {formatCurrency(appliedCoupon.valorMinimo, store.currency)} para ativar desconto.
                            </p>
                          ) : (
                            <p className="text-[10px] text-emerald-700 font-medium">
                              Desconto de {formatCurrency(discountAmount, store.currency)} aplicado!
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white transition cursor-pointer flex-shrink-0"
                        title="Remover cupom"
                        aria-label="Remover cupom"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Código do cupom..."
                            value={couponInput}
                            onChange={(e) => {
                              setCouponInput(e.target.value.toUpperCase());
                              if (couponFeedback) setCouponFeedback(null);
                            }}
                            className="w-full pl-8 pr-3 py-2 text-xs uppercase font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isApplyingCoupon || !couponInput.trim()}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer flex-shrink-0"
                        >
                          {isApplyingCoupon ? 'Validando...' : 'Aplicar'}
                        </button>
                      </div>

                      {couponFeedback && (
                        <div
                          className={`text-[11px] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 animate-fade-in ${
                            couponFeedback.type === 'success'
                              ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                              : 'text-rose-800 bg-rose-50 border border-rose-200'
                          }`}
                        >
                          {couponFeedback.type === 'success' ? (
                            <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                          )}
                          <span>{couponFeedback.message}</span>
                        </div>
                      )}
                    </form>
                  )}

                  {/* Resumo Financeiro */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Subtotal dos itens</span>
                      <span className="font-semibold text-slate-700">
                        {formatCurrency(rawSubtotal, store.currency)}
                      </span>
                    </div>

                    {appliedCoupon && discountAmount > 0 && (
                      <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold animate-fade-in">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Cupom ({appliedCoupon.codigo})
                        </span>
                        <span>- {formatCurrency(discountAmount, store.currency)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm sm:text-base font-extrabold text-slate-900 pt-1 border-t border-slate-100">
                      <span>Total estimado</span>
                      <span
                        className="text-base sm:text-lg font-black"
                        style={{ color: store.primary_color || '#10b981' }}
                      >
                        {formatCurrency(finalTotal, store.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Botão de Avanço para Checkout */}
                  <button
                    type="button"
                    onClick={handleAdvanceToCheckout}
                    className="w-full py-3.5 px-4 rounded-2xl font-extrabold text-xs sm:text-sm text-white shadow-lg hover:brightness-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    style={{ backgroundColor: store.primary_color || '#10b981' }}
                  >
                    <span>Continuar para Pagamento</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <button
                      type="button"
                      onClick={clearCart}
                      className="hover:text-rose-600 transition cursor-pointer"
                    >
                      Limpar sacola
                    </button>
                    <span className="flex items-center gap-1 text-slate-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Pedido 100% seguro via WhatsApp
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ======================================================== */}
          {/* ETAPA 2: DADOS DE IDENTIFICAÇÃO E PAGAMENTO               */}
          {/* ======================================================== */}
          {step === 'checkout' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {/* 1. Identificação do Cliente */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Seu Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>

                {/* Telefone Opcional */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-500">
                    Telefone / Celular (com DDD)
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex: (11) 99999-9999"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>

                {/* Aviso amigável sobre Entrega/Retirada negociada via WhatsApp */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-slate-600">
                  <MessageCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800">Entrega ou Retirada</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      O endereço, taxa de entrega ou horário de retirada serão combinados diretamente no WhatsApp com a loja.
                    </p>
                  </div>
                </div>

                {/* 2. Forma de Pagamento */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Forma de Pagamento Preferida
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pix')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                        paymentMethod === 'pix'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      <span>PIX</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('credit_card')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                        paymentMethod === 'credit_card'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Cartão Crédito</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('debit_card')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                        paymentMethod === 'debit_card'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Cartão Débito</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('money')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                        paymentMethod === 'money'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <span>Dinheiro</span>
                    </button>
                  </div>

                  {paymentMethod === 'money' && (
                    <div className="pt-1 animate-fade-in">
                      <input
                        type="text"
                        placeholder="Precisa de troco para quanto? Ex: R$ 100,00"
                        value={changeFor}
                        onChange={(e) => setChangeFor(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                      />
                    </div>
                  )}

                  {paymentMethod === 'pix' && store.pix_key && (
                    <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2 animate-fade-in text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                          <QrCode className="w-4 h-4 text-emerald-600" />
                          <span>Chave PIX da Loja</span>
                        </div>
                        {store.pix_key_type && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/70 text-emerald-800 px-2 py-0.5 rounded-full">
                            {store.pix_key_type}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-lg p-2">
                        <span className="font-mono font-medium text-slate-800 truncate flex-1 select-all text-xs">
                          {store.pix_key}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                              navigator.clipboard.writeText(store.pix_key || '');
                              setCopiedPix(true);
                              setTimeout(() => setCopiedPix(false), 2500);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer flex-shrink-0"
                          title="Copiar Chave PIX"
                        >
                          {copiedPix ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar Chave</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-[10px] text-emerald-800/80">
                        Transfira no app do seu banco e envie o comprovante diretamente no WhatsApp ao finalizar!
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Observações Adicionais */}
                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <label className="block text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Observações do Pedido (opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Ponto de referência, preferência de horário, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Rodapé da Etapa 2 (Envio WhatsApp) */}
              <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-3 shadow-xl">
                {/* Alerta de Erro */}
                {checkoutError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  {appliedCoupon && discountAmount > 0 && (
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Subtotal</span>
                      <span>{formatCurrency(rawSubtotal, store.currency)}</span>
                    </div>
                  )}
                  {appliedCoupon && discountAmount > 0 && (
                    <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                      <span>Cupom ({appliedCoupon.codigo})</span>
                      <span>- {formatCurrency(discountAmount, store.currency)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm sm:text-base font-extrabold text-slate-900 pt-1 border-t border-slate-100">
                    <span>Total a pagar</span>
                    <span
                      className="text-lg sm:text-xl font-black"
                      style={{ color: store.primary_color || '#10b981' }}
                    >
                      {formatCurrency(finalTotal, store.currency)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCheckoutWhatsApp}
                  className="w-full py-3.5 px-4 rounded-2xl font-extrabold text-xs sm:text-sm text-white shadow-lg hover:brightness-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  style={{ backgroundColor: '#25D366' }} // Verde Oficial WhatsApp
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>Finalizar Pedido no WhatsApp</span>
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setStep('items')}
                    className="text-[11px] text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  >
                    &larr; Voltar e alterar produtos da sacola
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
