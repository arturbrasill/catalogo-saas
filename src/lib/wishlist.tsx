'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface WishlistContextType {
  wishlistIds: string[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
  wishlistCount: number;
  isWishlistOpen: boolean;
  openWishlist: () => void;
  closeWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({
  children,
  tenantId = 'default',
}: {
  children: React.ReactNode;
  tenantId?: string;
}) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const cleanTenant = (tenantId || 'default').toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_');
  const storageKey = `wishlist_${cleanTenant}`;

  // Carrega favoritos do LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setWishlistIds(parsed);
        }
      }
    } catch {
      // LocalStorage indisponível
    } finally {
      setIsInitialized(true);
    }
  }, [storageKey]);

  // Salva favoritos no LocalStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(wishlistIds));
    } catch {
      // Falha ao salvar no LocalStorage
    }
  }, [wishlistIds, isInitialized, storageKey]);

  const isFavorite = (productId: string): boolean => {
    return wishlistIds.includes(productId);
  };

  const toggleFavorite = (productId: string) => {
    setWishlistIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const openWishlist = () => setIsWishlistOpen(true);
  const closeWishlist = () => setIsWishlistOpen(false);

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        isFavorite,
        toggleFavorite,
        wishlistCount: wishlistIds.length,
        isWishlistOpen,
        openWishlist,
        closeWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist deve ser usado dentro de um WishlistProvider');
  }
  return context;
}
