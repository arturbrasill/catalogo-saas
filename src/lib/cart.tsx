'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, Product, SelectedVariation, Coupon } from '@/types';
import { calculateSubtotal, calculateCartTotal } from '@/lib/whatsapp';
import { calculateEffectiveProductPrice } from '@/lib/variations';
import { api } from '@/lib/api';

interface CartContextType {
  items: CartItem[];
  addItem: (
    product: Product,
    quantity: number,
    selectedVariations: SelectedVariation,
    customPrice?: { unitPrice: number; promotionalPrice?: number | null }
  ) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, newQuantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotalItems: () => number;
  appliedCoupon: Coupon | null;
  discountAmount: number;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  getTotal: () => number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function getCartStorageKey(tenantId?: string): string {
  if (tenantId && tenantId.trim().length > 0 && tenantId !== 'default') {
    return `cart_${tenantId.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_')}`;
  }

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const queryTenant = params.get('tenant');
    if (queryTenant) {
      return `cart_${queryTenant.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_')}`;
    }
    const host = window.location.hostname
      .replace(/:\d+$/, '')
      .replace(/^www\./, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '_');
    if (host && host !== 'localhost' && host !== '127_0_0_1') {
      return `cart_${host}`;
    }
  }

  return 'cart_default';
}

export function CartProvider({
  children,
  tenantId,
}: {
  children: React.ReactNode;
  tenantId?: string;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const storageKey = getCartStorageKey(tenantId);
  const couponStorageKey = `${storageKey}_coupon`;

  // Carrega sacola salva no localStorage na inicialização e quando o storageKey mudar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: CartItem[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        } else {
          setItems([]);
        }
      } else {
        setItems([]);
      }

      const storedCoupon = localStorage.getItem(couponStorageKey);
      if (storedCoupon) {
        const parsedCoupon: Coupon = JSON.parse(storedCoupon);
        if (parsedCoupon && parsedCoupon.codigo) {
          setAppliedCoupon(parsedCoupon);
        }
      }
    } catch {
      // LocalStorage indisponível ou JSON inválido
      setItems([]);
      setAppliedCoupon(null);
    } finally {
      setIsInitialized(true);
    }
  }, [storageKey, couponStorageKey]);

  // Salva no localStorage a cada alteração
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
      if (appliedCoupon) {
        localStorage.setItem(couponStorageKey, JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem(couponStorageKey);
      }
    } catch {
      // Falha ao salvar no LocalStorage
    }
  }, [items, appliedCoupon, isInitialized, storageKey, couponStorageKey]);

  const areVariationsEqual = (v1: SelectedVariation, v2: SelectedVariation): boolean => {
    const keys1 = Object.keys(v1);
    const keys2 = Object.keys(v2);
    if (keys1.length !== keys2.length) return false;
    for (const key of keys1) {
      if (v1[key] !== v2[key]) return false;
    }
    return true;
  };

  const addItem = (
    product: Product,
    quantity: number,
    selectedVariations: SelectedVariation,
    customPrice?: { unitPrice: number; promotionalPrice?: number | null }
  ) => {
    if (quantity <= 0) return;

    // Calcula preços dinâmicos se não foram passados explicitamente
    const priceCalculation =
      customPrice !== undefined
        ? {
            unitPrice: customPrice.unitPrice,
            promotionalPrice: customPrice.promotionalPrice ?? null,
          }
        : calculateEffectiveProductPrice(
            product.preco,
            product.precoPromocional,
            selectedVariations,
            product.variacoes
          );

    const baseUnitPrice = priceCalculation.unitPrice;
    const basePromoPrice = priceCalculation.promotionalPrice;

    setItems((prevItems) => {
      // Verifica se o item já existe com o mesmo ID e mesmas variações
      const existingIndex = prevItems.findIndex(
        (item) =>
          item.productId === product.id &&
          areVariationsEqual(item.variations, selectedVariations)
      );

      if (existingIndex > -1) {
        const existing = prevItems[existingIndex]!;
        const updatedQuantity = existing.quantity + quantity;
        const updatedSubtotal = calculateSubtotal(
          baseUnitPrice,
          updatedQuantity,
          basePromoPrice
        );

        const updatedList = [...prevItems];
        updatedList[existingIndex] = {
          ...existing,
          unitPrice: baseUnitPrice,
          promotionalPrice: basePromoPrice,
          quantity: updatedQuantity,
          subtotal: updatedSubtotal,
        };
        return updatedList;
      }

      const subtotal = calculateSubtotal(
        baseUnitPrice,
        quantity,
        basePromoPrice
      );

      const newItem: CartItem = {
        productId: product.id,
        name: product.nome,
        image: product.imagens && product.imagens.length > 0 ? (product.imagens[0] ?? '') : '',
        unitPrice: baseUnitPrice,
        promotionalPrice: basePromoPrice,
        quantity,
        variations: selectedVariations,
        subtotal,
      };

      return [...prevItems, newItem];
    });

    setIsCartOpen(true);
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    setItems((prevItems) => {
      if (newQuantity <= 0) {
        return prevItems.filter((_, i) => i !== index);
      }

      const target = prevItems[index];
      if (!target) return prevItems;

      const updatedSubtotal = calculateSubtotal(
        target.unitPrice,
        newQuantity,
        target.promotionalPrice
      );

      const updated = [...prevItems];
      updated[index] = {
        ...target,
        quantity: newQuantity,
        subtotal: updatedSubtotal,
      };

      return updated;
    });
  };

  const removeItem = (index: number) => {
    setItems((prevItems) => prevItems.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const getSubtotal = (): number => {
    return calculateCartTotal(items);
  };

  const currentSubtotal = calculateCartTotal(items);

  const discountAmount = React.useMemo(() => {
    if (!appliedCoupon || items.length === 0) return 0;
    if (appliedCoupon.valorMinimo && currentSubtotal < appliedCoupon.valorMinimo) {
      return 0;
    }
    let calculated = 0;
    if (appliedCoupon.tipo === 'percentage') {
      calculated = (currentSubtotal * appliedCoupon.valor) / 100;
    } else {
      calculated = appliedCoupon.valor;
    }
    const finalDiscount = Math.min(currentSubtotal, calculated);
    return Math.round(finalDiscount * 100) / 100;
  }, [appliedCoupon, currentSubtotal, items.length]);

  const getTotal = (): number => {
    return Math.max(0, Math.round((currentSubtotal - discountAmount) * 100) / 100);
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Digite um código de cupom válido.' };
    }
    const subtotalNow = calculateCartTotal(items);
    if (subtotalNow <= 0) {
      return { success: false, message: 'Adicione produtos à sacola antes de aplicar um cupom.' };
    }

    try {
      const res = await api.validateCoupon(cleanCode, subtotalNow);
      if (res.valid && res.coupon) {
        setAppliedCoupon(res.coupon);
        return {
          success: true,
          message: res.message || `Cupom ${res.coupon.codigo} aplicado com sucesso!`,
        };
      } else {
        return {
          success: false,
          message: res.message || 'Cupom inválido ou valor mínimo não atingido.',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Erro ao validar cupom. Tente novamente.',
      };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const getTotalItems = (): number => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getSubtotal,
        getTotalItems,
        appliedCoupon,
        discountAmount,
        applyCoupon,
        removeCoupon,
        getTotal,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser utilizado dentro de um CartProvider');
  }
  return context;
}
