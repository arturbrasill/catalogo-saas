'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { api } from '@/lib/api';
import { CartProvider, useCart } from '@/lib/cart';
import { WishlistProvider, useWishlist } from '@/lib/wishlist';
import { ProductCard } from '@/components/catalog/ProductCard';
import { ProductModal } from '@/components/catalog/ProductModal';
import { CartDrawer } from '@/components/catalog/CartDrawer';
import { WishlistDrawer } from '@/components/catalog/WishlistDrawer';
import { BannerSlider } from '@/components/catalog/BannerSlider';
import { TrustBadges } from '@/components/catalog/TrustBadges';
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
  Heart,
  MessageCircle,
} from 'lucide-react';

interface CatalogContentProps {
  onStoreLoaded?: (store: StoreConfig) => void;
}

function CatalogContent({ onStoreLoaded }: CatalogContentProps) {
  const { openCart, getTotalItems, getSubtotal } = useCart();
  const { wishlistCount, openWishlist } = useWishlist();

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
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-4">
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
      {/* 1. Topbar Superior de Anúncios / Slogan Universal */}
      <aside aria-label="Aviso da Loja" className="bg-slate-950 text-white text-[11px] font-medium py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 mx-auto sm:mx-0 text-center sm:text-left">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Compre com segurança e receba no conforto da sua casa ou retire na loja física</span>
          </div>
          {store?.whatsapp && (
            <a
              href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center gap-1.5 text-[11px] font-bold text-slate-300 hover:text-white transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Atendimento via WhatsApp</span>
            </a>
          )}
        </div>
      </aside>

      {/* 2. Header Universal Sofisticado (Navbar) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/70 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
            {/* Logo e Nome da Marca */}
            <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-xs">
                {store?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={store.logo_url}
                    alt={store.store_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <StoreIcon className="w-6 h-6 text-slate-400 stroke-[1.5]" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base md:text-lg font-black text-slate-900 tracking-tight truncate leading-tight">
                  {store?.store_name || 'Catálogo Digital'}
                </h1>
                <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                  Catálogo Oficial • Produtos Originais
                </p>
              </div>
            </div>

            {/* Barra de Busca Centralizada (Desktop e Tablet) */}
            <div className="hidden md:flex flex-1 max-w-md mx-auto">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Buscar produtos, marcas, referências..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition shadow-2xs"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    aria-label="Limpar busca"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Ações: Favoritos e Sacola de Compras */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Botão de Favoritos (Wishlist) */}
              <button
                type="button"
                onClick={openWishlist}
                className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 hover:text-rose-500 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                title="Ver meus favoritos"
                aria-label="Ver meus favoritos"
              >
                <Heart className="w-5 h-5 stroke-[1.8]" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Botão da Sacola */}
              <button
                type="button"
                onClick={openCart}
                className="relative px-3.5 sm:px-5 py-2.5 rounded-2xl text-white shadow-xs hover:brightness-95 active:scale-97 transition-all flex items-center gap-2.5 cursor-pointer flex-shrink-0"
                style={{ backgroundColor: store?.primary_color || '#10b981' }}
                aria-label="Abrir sacola de compras"
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
                <div className="hidden sm:flex flex-col items-start leading-none">
                  <span className="text-[10px] font-bold opacity-85 uppercase tracking-wider">
                    Sacola
                  </span>
                  <span className="text-xs sm:text-sm font-black mt-0.5">
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
          </div>

          {/* Barra de Busca no Mobile */}
          <div className="md:hidden pb-3 pt-1">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar no catálogo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition"
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

        {/* 3. Navegação por Categorias em Formato Pílulas Modernas */}
        {!isLoading && categories.length > 0 && (
          <nav aria-label="Categorias do Catálogo" className="border-t border-slate-100 bg-white/90">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === 'ALL'
                      ? 'text-white shadow-xs'
                      : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                  style={
                    selectedCategory === 'ALL'
                      ? { backgroundColor: store?.primary_color || '#10b981' }
                      : undefined
                  }
                >
                  Todos os Produtos ({products.length})
                </button>
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const catProductCount = products.filter((p) => p.categoriaId === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'text-white shadow-xs'
                          : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                      style={
                        isSelected
                          ? { backgroundColor: store?.primary_color || '#10b981' }
                          : undefined
                      }
                    >
                      {cat.nome}
                      {catProductCount > 0 && (
                        <span className="ml-1.5 opacity-75 font-normal">
                          ({catProductCount})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Espaço para Banners Institucionais / Campanhas */}
        {!searchTerm && selectedCategory === 'ALL' && store?.banners && store.banners.length > 0 && (
          <section aria-label="Destaques da Loja" className="overflow-hidden rounded-3xl shadow-sm">
            <BannerSlider banners={store.banners} storeName={store.store_name} />
          </section>
        )}

        {/* Estado de Erro na API */}
        {errorMessage && (
          <div className="rounded-3xl bg-rose-50 border border-rose-200 p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-rose-900">
              Falha ao carregar o catálogo de produtos
            </h3>
            <p className="text-xs text-rose-700 max-w-sm mx-auto">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Estado de Carregamento (Loading Skeletons) */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="bg-white rounded-3xl border border-slate-200/70 p-4 space-y-3 animate-pulse shadow-2xs"
              >
                <div className="aspect-square bg-slate-200/70 rounded-2xl" />
                <div className="h-4 bg-slate-200/70 rounded-md w-3/4" />
                <div className="h-5 bg-slate-200/70 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Grid de Produtos Universal */}
        {!isLoading && !errorMessage && (
          <>
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center my-6 space-y-3 shadow-2xs">
                <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
                <h3 className="text-sm font-bold text-slate-900">
                  Nenhum produto encontrado
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchTerm
                    ? `Não encontramos itens para "${searchTerm}".`
                    : 'Nenhum produto disponível nesta categoria no momento.'}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="inline-flex items-center text-xs font-bold px-4 py-2 rounded-xl text-white shadow-xs transition cursor-pointer"
                    style={{ backgroundColor: store?.primary_color || '#10b981' }}
                  >
                    Ver todos os produtos
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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

        {/* 4. Selos de Confiança Universais (Trust Badges) */}
        {!isLoading && <TrustBadges primaryColor={store?.primary_color} />}
      </main>

      {/* Modal de Detalhes do Produto */}
      {store && (
        <ProductModal
          product={selectedProduct}
          onClose={handleCloseProduct}
          store={store}
        />
      )}

      {/* Drawer da Sacola de Compras */}
      {store && <CartDrawer store={store} />}

      {/* Drawer de Favoritos (Wishlist) */}
      {store && (
        <WishlistDrawer
          products={products}
          store={store}
          onSelectProduct={handleOpenProduct}
        />
      )}

      {/* 5. Rodapé Sofisticado */}
      <footer className="border-t border-slate-200/80 bg-white py-10 text-center text-xs text-slate-500 space-y-3">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-extrabold text-slate-800 text-sm">
            {store?.store_name || 'Catálogo Digital'}
          </p>
          <p className="text-[11px] text-slate-400">
            Catálogo digital de alta performance • Pedidos enviados diretamente para o WhatsApp oficial
          </p>
          <div className="pt-2 flex items-center justify-center gap-4 text-[11px]">
            <Link
              href="/admin/login"
              className="text-slate-500 hover:text-slate-800 font-medium underline transition"
            >
              Acesso do Lojista
            </Link>
            <span>•</span>
            <Link
              href="/criar-loja"
              className="text-slate-500 hover:text-slate-800 font-medium underline transition"
            >
              Criar Minha Loja
            </Link>
          </div>
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
      <WishlistProvider tenantId={storeId}>
        <CatalogContent
          onStoreLoaded={(loadedStore) => {
            if (loadedStore?.store_id) {
              setStoreId(loadedStore.store_id);
            }
          }}
        />
      </WishlistProvider>
    </CartProvider>
  );
}
