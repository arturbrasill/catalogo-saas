'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { api } from '@/lib/api';
import { CartProvider, useCart } from '@/lib/cart';
import { ProductCard } from '@/components/catalog/ProductCard';
import { ProductModal } from '@/components/catalog/ProductModal';
import { CartDrawer } from '@/components/catalog/CartDrawer';
import { BannerSlider } from '@/components/catalog/BannerSlider';
import type { StoreConfig, Category, Product } from '@/types';
import { formatCurrency } from '@/lib/whatsapp';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  X,
  Store as StoreIcon,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Package,
  Clock,
} from 'lucide-react';

interface CatalogContentProps {
  onStoreLoaded?: (store: StoreConfig) => void;
}

function CatalogContent({ onStoreLoaded }: CatalogContentProps) {
  const { openCart, getTotalItems, getSubtotal } = useCart();
  const [store, setStore] = useState<StoreConfig | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const initialData = await api.getAll();
      if (initialData.store) {
        initialData.store.whatsapp = String(initialData.store.whatsapp ?? '').trim();
        if (typeof document !== 'undefined' && initialData.store.store_name) {
          document.title = `${initialData.store.store_name} | Catálogo Oficial`;
        }
        onStoreLoaded?.(initialData.store);
      }
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
  }, [onStoreLoaded]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Deep linking: Abre produto direto caso venha por query param ?p=slug ou ?produto=slug
  useEffect(() => {
    if (products.length > 0 && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const productSlug = params.get('p') || params.get('produto');
      if (productSlug) {
        const found = products.find(
          (p) => p.slug === productSlug || p.id === productSlug
        );
        if (found) {
          setSelectedProduct(found);
        }
      }
    }
  }, [products]);

  const handleOpenProduct = (p: Product) => {
    setSelectedProduct(p);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('p', p.slug || p.id);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleCloseProduct = () => {
    setSelectedProduct(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('p');
      url.searchParams.delete('produto');
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Aplicação dinâmica das cores do tema (primária, secundária, fundo e textos)
  useEffect(() => {
    if (store) {
      if (store.primary_color) {
        document.documentElement.style.setProperty('--primary-color', store.primary_color);
      }
      if (store.secondary_color) {
        document.documentElement.style.setProperty('--secondary-color', store.secondary_color);
      }
      if (store.background_color) {
        document.documentElement.style.setProperty('--bg-color', store.background_color);
      }
      if (store.text_color) {
        document.documentElement.style.setProperty('--text-color', store.text_color);
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

  const totalItemsCount = getTotalItems();
  const cartSubtotal = getSubtotal();

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
  };

  const hasActiveFilters = Boolean(searchTerm) || selectedCategory !== 'ALL';

  const isSuspended =
    store?.subscription_status === 'blocked' ||
    store?.subscription_status === 'expired' ||
    Boolean(
      store?.subscription_expires_at &&
        new Date(store.subscription_expires_at).getTime() < Date.now()
    );

  if (!isLoading && store && isSuspended) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200/60">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Catálogo Temporariamente Indisponível
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            A loja <strong>{store.store_name}</strong> está pausada para renovação da assinatura.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link
              href="/admin/login"
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
            >
              Acessar Painel do Lojista
            </Link>
            {store.whatsapp && (
              <a
                href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs hover:bg-emerald-100 transition-colors"
              >
                Falar com a Loja
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-200"
      style={{
        backgroundColor: store?.background_color || 'var(--bg-color, #f8fafc)',
        color: store?.text_color || 'var(--text-color, #0f172a)',
      }}
    >
      {/* Header Minimalista & Otimizado para Celular e PC */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/70 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="h-16 sm:h-18 flex items-center justify-between gap-3">
            {/* Logo e Nome */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {store?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={store.logo_url}
                    alt={store.store_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <StoreIcon className="w-5 h-5 text-slate-500" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate leading-tight">
                  {store?.store_name || 'Catálogo Digital'}
                </h1>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {store?.is_open === false ? (
                    <span className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      Fechado no momento
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Aberto agora
                    </span>
                  )}
                  {store?.business_hours && (
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 border-l border-slate-200 pl-2">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[140px] sm:max-w-none">{store.business_hours}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Botão da Sacola */}
            <button
              type="button"
              onClick={openCart}
              className="relative px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-white shadow-xs hover:brightness-95 active:scale-95 transition-all flex items-center gap-2 cursor-pointer flex-shrink-0"
              style={{ backgroundColor: store?.primary_color || '#10b981' }}
              aria-label="Abrir sacola de compras"
            >
              <ShoppingBag className="w-4 h-4" />
              <div className="hidden sm:flex flex-col items-start leading-none">
                <span className="text-[10px] font-bold opacity-85">Sacola</span>
                <span className="text-xs font-black">
                  {formatCurrency(cartSubtotal, store?.currency)}
                </span>
              </div>
              {totalItemsCount > 0 && (
                <span className="h-5 w-5 rounded-full bg-white text-slate-900 text-[11px] font-black flex items-center justify-center shadow-xs">
                  {totalItemsCount}
                </span>
              )}
            </button>
          </div>

          {/* Barra de Busca Minimalista */}
          <div className="pb-3 pt-0.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-100/80 pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Categorias em Pills Horizontais */}
        {!isLoading && categories.length > 0 && (
          <div className="border-t border-slate-100 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === 'ALL'
                      ? 'text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={
                    selectedCategory === 'ALL'
                      ? { backgroundColor: store?.primary_color || '#10b981' }
                      : undefined
                  }
                >
                  Todos
                </button>
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5">
        {/* Aviso de Loja Fechada */}
        {store?.is_open === false && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 flex items-start gap-3 shadow-xs">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <p className="font-bold text-amber-950">A loja está fechada no momento</p>
              <p className="text-amber-800 mt-0.5">
                Você pode montar seu pedido e enviar normalmente! Ele será processado assim que abrirmos
                {store.business_hours ? ` (${store.business_hours})` : ''}.
              </p>
            </div>
          </div>
        )}

        {/* Espaço para até 3 Banners (bem no início do app) */}
        {!searchTerm && selectedCategory === 'ALL' && store?.banners && store.banners.length > 0 && (
          <section aria-label="Banners da Loja">
            <BannerSlider banners={store.banners} storeName={store.store_name} />
          </section>
        )}

        {/* Estado de Erro na API */}
        {errorMessage && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-rose-900">
              Falha ao carregar os itens do catálogo
            </h3>
            <p className="text-xs text-rose-700 max-w-sm mx-auto">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Estado de Carregamento (Loading Skeleton) */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-slate-200/70 p-3 space-y-2.5 animate-pulse"
              >
                <div className="aspect-square bg-slate-200 rounded-xl" />
                <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Grid de Produtos */}
        {!isLoading && !errorMessage && (
          <>
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center my-6 space-y-3 shadow-2xs">
                <Package className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
                <h3 className="text-sm font-bold text-slate-900">
                  Nenhum produto encontrado
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchTerm
                    ? `Não encontramos itens para "${searchTerm}".`
                    : 'Nenhum produto disponível nesta categoria.'}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="inline-flex items-center text-xs font-bold px-3.5 py-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer"
                  >
                    Ver todos os produtos
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    store={
                      store || {
                        store_id: '',
                        store_name: '',
                        logo_url: '',
                        primary_color: '#10b981',
                        secondary_color: '#047857',
                        whatsapp: '',
                        domain: '',
                        currency: 'BRL',
                        timezone: '',
                      }
                    }
                    onSelect={handleOpenProduct}
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
          onClose={handleCloseProduct}
          store={store}
        />
      )}

      {/* Drawer da Sacola */}
      {store && <CartDrawer store={store} />}

      {/* Rodapé Minimalista */}
      <footer className="border-t border-slate-200/60 py-6 text-center text-xs opacity-70 space-y-1">
        <p className="font-semibold">
          {store?.store_name || 'Catálogo Digital'}
        </p>
        <p className="text-[11px]">Pedidos finalizados diretamente pelo WhatsApp</p>
        <div className="pt-2">
          <a
            href="/admin/login"
            className="text-[11px] underline opacity-60 hover:opacity-100 transition"
          >
            Área do Lojista (/admin)
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function CatalogPage() {
  const [storeId, setStoreId] = useState<string>('default');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryTenant = params.get('tenant');
      const host = window.location.hostname.replace(/:\d+$/, '').replace(/^www\./, '');
      setStoreId(queryTenant || host || 'default');
    }
  }, []);

  return (
    <CartProvider tenantId={storeId}>
      <CatalogContent
        onStoreLoaded={(loadedStore) => {
          if (loadedStore?.store_id) {
            setStoreId(loadedStore.store_id);
          }
        }}
      />
    </CartProvider>
  );
}
