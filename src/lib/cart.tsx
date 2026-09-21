'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, Product, SelectedVariation } from '@/types';
import { calculateSubtotal, calculateCartTotal } from '@/lib/whatsapp';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number, selectedVariations: SelectedVariation) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, newQuantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotalItems: () => number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'catalogo_saas_cart_items_v1';

export function CartProvider({
  children,
  tenantId,
}: {
  children: React.ReactNode;
  tenantId?: string;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const storageKey = tenantId
    ? `catalogo_saas_cart_${tenantId.toLowerCase().trim()}`
    : 'catalogo_saas_cart_items_v1';

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
    } catch {
      // LocalStorage indisponível ou JSON inválido
      setItems([]);
    } finally {
      setIsInitialized(true);
    }
  }, [storageKey]);

  // Salva no localStorage a cada alteração
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // Falha ao salvar no LocalStorage
    }
  }, [items, isInitialized, storageKey]);

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
    selectedVariations: SelectedVariation
  ) => {
    if (quantity <= 0) return;

    setItems((prevItems) => {
      // Verifica se o item já existe com o mesmo ID e mesmas variações
      const existingIndex = prevItems.findIndex(
        (item) =>
          item.productId === product.id &&
          areVariationsEqual(item.variations, selectedVariations)
      );

      const effectivePrice =
        typeof product.precoPromocional === 'number' &&
        product.precoPromocional > 0 &&
        product.precoPromocional < product.preco
          ? product.precoPromocional
          : product.preco;

      if (existingIndex > -1) {
        const existing = prevItems[existingIndex]!;
        const updatedQuantity = existing.quantity + quantity;
        const updatedSubtotal = calculateSubtotal(
          product.preco,
          updatedQuantity,
          product.precoPromocional
        );

        const updatedList = [...prevItems];
        updatedList[existingIndex] = {
          ...existing,
          quantity: updatedQuantity,
          subtotal: updatedSubtotal,
        };
        return updatedList;
      }

      const subtotal = calculateSubtotal(
        product.preco,
        quantity,
        product.precoPromocional
      );

      const newItem: CartItem = {
        productId: product.id,
        name: product.nome,
        image: product.imagens && product.imagens.length > 0 ? (product.imagens[0] ?? '') : '',
        unitPrice: product.preco,
        promotionalPrice: product.precoPromocional,
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
  };

  const getSubtotal = (): number => {
    return calculateCartTotal(items);
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
