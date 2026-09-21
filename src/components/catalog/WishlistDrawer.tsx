'use client';

import React from 'react';
import { useWishlist } from '@/lib/wishlist';
import type { Product, StoreConfig } from '@/types';
import { formatCurrency } from '@/lib/whatsapp';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';

interface WishlistDrawerProps {
  products: Product[];
  store: StoreConfig;
  onSelectProduct: (product: Product) => void;
}

export function WishlistDrawer({
  products,
  store,
  onSelectProduct,
}: WishlistDrawerProps) {
  const { wishlistIds, isWishlistOpen, closeWishlist, toggleFavorite } = useWishlist();

  if (!isWishlistOpen) return null;

  const favoriteProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={closeWishlist}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-100">
          {/* Header do Drawer */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: `${store.primary_color || '#10b981'}15`,
                  color: store.primary_color || '#10b981',
                }}
              >
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Meus Favoritos
                </h3>
                <p className="text-[11px] text-slate-500">
                  {favoriteProducts.length}{' '}
                  {favoriteProducts.length === 1 ? 'item salvo' : 'itens salvos'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeWishlist}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Fechar favoritos"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lista de Favoritos */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {favoriteProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="h-16 w-16 rounded-3xl bg-rose-50 text-rose-400 flex items-center justify-center border border-rose-100">
                  <Heart className="w-8 h-8 stroke-1" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Sua lista de desejos está vazia
                </h4>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Clique no ícone de coração nos produtos que você mais gostou para salvá-los e encontrá-los facilmente aqui!
                </p>
                <button
                  type="button"
                  onClick={closeWishlist}
                  className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:brightness-95 transition cursor-pointer"
                  style={{ backgroundColor: store.primary_color || '#10b981' }}
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              favoriteProducts.map((product) => {
                const effectivePrice =
                  product.precoPromocional && product.precoPromocional < product.preco
                    ? product.precoPromocional
                    : product.preco;

                const firstImage =
                  product.imagens && product.imagens.length > 0 ? product.imagens[0] : null;

                return (
                  <div
                    key={product.id}
                    className="p-3 rounded-2xl border border-slate-200/70 hover:border-slate-300 bg-white transition flex items-center gap-3.5 group shadow-2xs"
                  >
                    {/* Imagem do Produto */}
                    <div
                      onClick={() => {
                        onSelectProduct(product);
                        closeWishlist();
                      }}
                      className="h-16 w-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 cursor-pointer border border-slate-200/60"
                    >
                      {firstImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={firstImage}
                          alt={product.nome}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-300">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    {/* Detalhes do Produto */}
                    <div className="flex-1 min-w-0">
                      <h4
                        onClick={() => {
                          onSelectProduct(product);
                          closeWishlist();
                        }}
                        className="text-xs font-bold text-slate-900 truncate hover:text-slate-700 cursor-pointer"
                      >
                        {product.nome}
                      </h4>
                      <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                        {formatCurrency(effectivePrice, store.currency)}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProduct(product);
                          closeWishlist();
                        }}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 mt-1 inline-block cursor-pointer"
                      >
                        Ver Detalhes →
                      </button>
                    </div>

                    {/* Botão Remover */}
                    <button
                      type="button"
                      onClick={() => toggleFavorite(product.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Remover dos favoritos"
                      aria-label="Remover dos favoritos"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
