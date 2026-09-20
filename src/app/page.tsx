'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { CartProvider, useCart } from '@/lib/cart';
import { ProductCard } from '@/components/catalog/ProductCard';
import { ProductModal } from '@/components/catalog/ProductModal';
import { CartDrawer } from '@/components/catalog/CartDrawer';
import type { StoreConfig, Category, Product } from '@/types';
import {
  ShoppingBag,
  Search,
  X,
  Store as StoreIcon,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

function CatalogContent() {
  const { openCart, getTotalItems } = useCart();
  const [store, setStore] = useState<StoreConfig | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const initialData = await api.getAll();
      setStore(initialData.store);
      setCategories(initialData.categories || []);
      setProducts(initialData.products || []);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar o catálogo. Verifique sua conexão.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Aplicação dinâmica das cores do tema
  useEffect(() => {
    if (store) {
      if (store.primary_color) {
        document.documentElement.style.setProperty(
          '--primary-color',
          store.primary_color
        );
      }
      if (store.secondary_color) {
        document.documentElement.style.setProperty(
          '--secondary-color',
          store.secondary_color
        );
      }
    }
  }, [store]);

  // Filtragem de Produtos
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descricao.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'ALL' || p.categoriaId === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const totalItemsInCart = getTotalItems();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Fixo */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Logo & Nome da Loja */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-xs">
                {store?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={store.logo_url}
                    alt={store.store_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <StoreIcon className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-gray-900 truncate leading-tight">
                  {store?.store_name || 'Catálogo Digital'}
                </h1>
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Loja Online
                </span>
              </div>
            </div>

            {/* Botão da Sacola */}
            <button
              type="button"
              onClick={openCart}
              className="relative p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200/80 text-gray-800 transition flex items-center justify-center cursor-pointer"
              aria-label="Abrir sacola de compras"
            >
              <ShoppingBag className="w-5 h-5 text-gray-700" />
              {totalItemsInCart > 0 && (
                <span
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-[10px] font-black text-white flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: store?.primary_color || '#10b981' }}
                >
                  {totalItemsInCart}
                </span>
              )}
            </button>
          </div>

          {/* Barra de Busca */}
          <div className="pb-3 pt-1">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar produtos no catálogo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-100/70 pl-9 pr-8 py-2 text-sm text-gray-900 placeholder-gray-500 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 p-0.5"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Barra de Rolagem Horizontal de Categorias */}
        {!isLoading && categories.length > 0 && (
          <div className="border-t border-gray-100 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === 'ALL'
                      ? 'text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={
                    selectedCategory === 'ALL'
                      ? { backgroundColor: store?.primary_color || '#10b981' }
                      : undefined
                  }
                >
                  Todas as Categorias
                </button>
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        isSelected
                          ? 'text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      style={
                        isSelected
                          ? { backgroundColor: store?.primary_color || '#10b981' }
                          : undefined
                      }
                    >
                      {cat.nome}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Estado de Erro na API */}
        {errorMessage && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center space-y-3 my-8">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-red-900">
              Falha ao carregar o catálogo
            </h3>
            <p className="text-sm text-red-700 max-w-md mx-auto">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Estado de Carregamento (Loading Skeleton) */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse p-3 space-y-3"
              >
                <div className="aspect-square bg-gray-200 rounded-xl" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-6 bg-gray-200 rounded w-1/3 pt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Grid de Produtos */}
        {!isLoading && !errorMessage && (
          <>
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center my-8 space-y-3 shadow-xs">
                <SlidersHorizontal className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="text-base font-bold text-gray-900">
                  Nenhum produto encontrado
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {searchTerm
                    ? `Não encontramos itens correspondentes a "${searchTerm}".`
                    : 'Esta categoria não possui produtos disponíveis no momento.'}
                </p>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('ALL');
                    }}
                    className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"
                  >
                    Ver todos os produtos
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
                {filteredProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    store={store || { store_id: '', store_name: '', logo_url: '', primary_color: '#10b981', secondary_color: '#047857', whatsapp: '', domain: '', currency: 'BRL', timezone: '' }}
                    onSelect={(p) => setSelectedProduct(p)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal de Detalhes do Produto */}
      {store && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          store={store}
        />
      )}

      {/* Drawer da Sacola */}
      {store && <CartDrawer store={store} />}

      {/* Rodapé da Vitrine */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500 space-y-1">
        <p className="font-semibold text-gray-700">
          {store?.store_name || 'Catálogo Digital'}
        </p>
        <p>Todos os direitos reservados • Pedidos finalizados diretamente pelo WhatsApp</p>
        <div className="pt-2">
          <a
            href="/admin/login"
            className="text-[11px] text-gray-400 hover:text-gray-600 underline transition"
          >
            Acesso Lojista (/admin)
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <CartProvider>
      <CatalogContent />
    </CartProvider>
  );
}
