'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { CartProvider, useCart } from '@/lib/cart';
import { WishlistProvider, useWishlist } from '@/lib/wishlist';
import { ProductCard } from '@/components/catalog/ProductCard';
import { ProductList } from '@/components/catalog/ProductList';
import { ProductModal } from '@/components/catalog/ProductModal';
import { CartDrawer } from '@/components/catalog/CartDrawer';
import { WishlistDrawer } from '@/components/catalog/WishlistDrawer';
import { FilterDrawer } from '@/components/catalog/FilterDrawer';
import { CatalogControlBar } from '@/components/catalog/CatalogControlBar';
import { BannerSlider } from '@/components/catalog/BannerSlider';
import { TrustBadges } from '@/components/catalog/TrustBadges';
import { ProductGridSkeleton, BannerSkeleton } from '@/components/catalog/ProductGridSkeleton';
import { TopAnnouncementBar } from '@/components/catalog/TopAnnouncementBar';
import { StoreStatusBanner } from '@/components/catalog/StoreStatusBanner';
import { applyThemeToDocument } from '@/lib/themePresets';
import { getStoreStatus } from '@/lib/storeStatus';
import type { StoreConfig, Category, Product, CatalogLayoutMode } from '@/types';
import {
  type CatalogFilterState,
  DEFAULT_FILTERS,
  filterAndSortProducts,
} from '@/lib/catalogFilters';
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
  ArrowRight,
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
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [layoutMode, setLayoutMode] = useState<CatalogLayoutMode>('grid');

  const [filters, setFilters] = useState<CatalogFilterState>(DEFAULT_FILTERS);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const storeStatus = useMemo(() => getStoreStatus(store), [store]);

  const updateFilters = useCallback((newFilters: Partial<CatalogFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

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
        if (initialData.store.catalog_layout) {
          setLayoutMode(initialData.store.catalog_layout);
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

  // Aplicação dinâmica dos tokens de tema e cores
  useEffect(() => {
    if (store) {
      applyThemeToDocument(store);
    }
  }, [store]);

  // Filtragem e Ordenação com suporte à Fase 2
  const filteredProducts = useMemo(() => {
    return filterAndSortProducts(products, filters);
  }, [products, filters]);

  const totalItemsCount = getTotalItems();
  const cartSubtotal = getSubtotal();

  // Pulso animado nos badges da sacola ao adicionar novo item
  const [hasNewItemPulse, setHasNewItemPulse] = useState(false);
  const prevItemsCountRef = useRef(totalItemsCount);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (totalItemsCount > prevItemsCountRef.current) {
      setHasNewItemPulse(true);
      timer = setTimeout(() => {
        setHasNewItemPulse(false);
      }, 1500);
    }
    prevItemsCountRef.current = totalItemsCount;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [totalItemsCount]);

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
          <h2 className="text-xl font-extrabold font-heading text-slate-900 tracking-tight">
            Catálogo Temporariamente Indisponível
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            A loja <strong>{store.store_name}</strong> está pausada para renovação da assinatura.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link
              href="/admin/login"
              className="px-4 py-2.5 rounded-btn bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
            >
              Acessar Painel do Lojista
            </Link>
            {store.whatsapp && (
              <a
                href={`https://wa.me/${String(store.whatsapp).replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-btn bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs hover:bg-emerald-100 transition-colors"
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
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        totalItemsCount > 0 ? 'pb-28 sm:pb-32' : ''
      }`}
      style={{
        backgroundColor: store?.background_color || 'var(--brand-surface, #f8fafc)',
        color: store?.text_color || 'var(--brand-text-main, #0f172a)',
      }}
    >
      {/* 1. Topbar Superior de Anúncios / Slogan Universal (Editável pelo lojista) */}
      <TopAnnouncementBar store={store} />

      {/* 2. Header Universal Sofisticado (Navbar) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/70 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
            {/* Logo e Nome da Marca com Selo de Status da Loja */}
            <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-card bg-slate-50 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-xs">
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
                <h1 className="text-sm sm:text-base md:text-lg font-black font-heading text-slate-900 tracking-tight truncate leading-tight">
                  {store?.store_name || 'Catálogo Digital'}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${storeStatus.badgeClass}`}
                    title={storeStatus.businessHours ? `Horário de atendimento: ${storeStatus.businessHours}` : storeStatus.statusLabel}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${storeStatus.dotClass}`} />
                    {storeStatus.statusLabel}
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">•</span>
                  <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                    Catálogo Oficial • Pedidos WhatsApp
                  </p>
                </div>
              </div>
            </div>

            {/* Barra de Busca Centralizada (Desktop e Tablet) */}
            <div className="hidden md:flex flex-1 max-w-md mx-auto">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Buscar produtos, marcas, referências..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                  className="w-full rounded-btn border border-slate-200 bg-slate-50 pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition shadow-2xs"
                />
                {filters.searchTerm && (
                  <button
                    type="button"
                    onClick={() => updateFilters({ searchTerm: '' })}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
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
                className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-btn border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 hover:text-rose-500 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
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
                className="relative px-3.5 sm:px-5 py-2.5 rounded-btn text-brand-contrast bg-brand-primary hover:bg-brand-primary-hover shadow-xs hover:brightness-95 active:scale-97 transition-all flex items-center gap-2.5 cursor-pointer flex-shrink-0"
                style={{ backgroundColor: store?.primary_color }}
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
                  <span
                    className={`h-5 min-w-[20px] px-1 rounded-full bg-white text-brand-text-main text-[11px] font-black flex items-center justify-center shadow-xs transition-transform duration-300 ${
                      hasNewItemPulse ? 'scale-125 ring-2 ring-emerald-400 animate-pulse' : 'scale-100'
                    }`}
                  >
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
                value={filters.searchTerm}
                onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                className="w-full rounded-btn border border-slate-200 bg-slate-50 pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition"
              />
              {filters.searchTerm && (
                <button
                  type="button"
                  onClick={() => updateFilters({ searchTerm: '' })}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
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
                  onClick={() => updateFilters({ selectedCategory: 'ALL' })}
                  className={`px-4 py-2 rounded-btn text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    filters.selectedCategory === 'ALL'
                      ? 'bg-brand-primary text-brand-contrast shadow-xs'
                      : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                  style={
                    filters.selectedCategory === 'ALL' && store?.primary_color
                      ? { backgroundColor: store.primary_color }
                      : undefined
                  }
                >
                  Todos os Produtos ({products.length})
                </button>
                {categories.map((cat) => {
                  const isSelected = filters.selectedCategory === cat.id;
                  const catProductCount = products.filter((p) => p.categoriaId === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => updateFilters({ selectedCategory: cat.id })}
                      className={`px-4 py-2 rounded-btn text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-brand-primary text-brand-contrast shadow-xs'
                          : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                      style={
                        isSelected && store?.primary_color
                          ? { backgroundColor: store.primary_color }
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

      {/* 2.1. Aviso Dinâmico de Loja Aberta/Fechada (Exibido quando a loja estiver fechada) */}
      <StoreStatusBanner store={store} />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Espaço para Banners Institucionais / Campanhas */}
        {isLoading ? (
          <BannerSkeleton />
        ) : (
          !filters.searchTerm &&
          filters.selectedCategory === 'ALL' &&
          store?.banners &&
          store.banners.length > 0 && (
            <section aria-label="Destaques da Loja" className="overflow-hidden rounded-card shadow-sm">
              <BannerSlider banners={store.banners} storeName={store.store_name} />
            </section>
          )
        )}

        {/* Barra de Controle de Filtros e Ordenação (Fase 2) */}
        {!isLoading && !errorMessage && products.length > 0 && (
          <CatalogControlBar
            filters={filters}
            onUpdateFilters={updateFilters}
            onResetFilters={resetFilters}
            onOpenFilterDrawer={() => setIsFilterDrawerOpen(true)}
            filteredCount={filteredProducts.length}
            totalCount={products.length}
            layoutMode={layoutMode}
            onChangeLayoutMode={setLayoutMode}
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
          />
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

        {/* Estado de Carregamento (Loading Skeletons com Shimmer Refinado) */}
        {isLoading && <ProductGridSkeleton count={8} layoutMode={layoutMode} />}

        {/* Lista/Grade de Produtos Configurável (Grid / List / Editorial) */}
        {!isLoading && !errorMessage && store && (
          <ProductList
            products={filteredProducts}
            store={store}
            layoutMode={layoutMode}
            onSelectProduct={handleOpenProduct}
            onResetFilters={resetFilters}
            emptySearchTerm={filters.searchTerm}
          />
        )}

        {/* Selos de Confiança Universais (Trust Badges) */}
        {!isLoading && <TrustBadges primaryColor={store?.primary_color} />}
      </main>

      {/* Modal de Detalhes do Produto */}
      {store && (
        <ProductModal
          product={selectedProduct}
          onClose={handleCloseProduct}
          store={store}
          allProducts={products}
          onSelectProduct={handleOpenProduct}
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

      {/* Drawer de Filtros e Ordenação Avançados (Fase 2) */}
      {store && (
        <FilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          filters={filters}
          onUpdateFilters={updateFilters}
          onResetFilters={resetFilters}
          categories={categories}
          totalResultsCount={filteredProducts.length}
          store={store}
        />
      )}

      {/* Rodapé Sofisticado */}
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

      {/* Sacola Flutuante Moderna (Floating Glassmorphism com Backdrop-Blur e Sombra Marcante) */}
      {totalItemsCount > 0 && (
        <aside
          aria-label="Sacola de compras flutuante"
          className="fixed bottom-4 sm:bottom-6 inset-x-0 z-40 px-3 sm:px-4 pointer-events-none flex justify-center animate-slide-up"
        >
          <div className="max-w-md sm:max-w-lg w-full pointer-events-auto">
            <button
              type="button"
              onClick={openCart}
              className="w-full group p-2.5 sm:p-3 rounded-2xl sm:rounded-full bg-slate-950/85 hover:bg-slate-900/95 text-white backdrop-blur-xl border border-white/20 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.45),0_0_20px_rgba(255,255,255,0.08)] flex items-center justify-between active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              {/* Esquerda: Ícone com Badge de Pulso Animado */}
              <div className="flex items-center gap-3 pl-1 sm:pl-2">
                <div
                  className="relative h-11 w-11 rounded-xl sm:rounded-full flex items-center justify-center text-white shadow-inner flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                  style={{ backgroundColor: store?.primary_color || '#10b981' }}
                >
                  <ShoppingBag className="w-5 h-5 stroke-[2]" />
                  {/* Badge com pulso animado */}
                  <span
                    className={`absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full text-[10px] font-black flex items-center justify-center shadow-md transition-all duration-300 ${
                      hasNewItemPulse
                        ? 'scale-125 bg-emerald-400 text-slate-950 ring-4 ring-emerald-400/40 animate-pulse'
                        : 'scale-100 bg-white text-slate-900'
                    }`}
                  >
                    {totalItemsCount}
                  </span>
                  {hasNewItemPulse && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-400 opacity-75 animate-ping pointer-events-none" />
                  )}
                </div>

                <div className="text-left leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black tracking-tight text-white block">
                      Ver Sacola
                    </span>
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <span className="text-[11px] sm:text-xs text-slate-300 font-medium">
                    {totalItemsCount} {totalItemsCount === 1 ? 'item adicionado' : 'itens adicionados'}
                  </span>
                </div>
              </div>

              {/* Direita: Subtotal e Botão de Ação */}
              <div className="flex items-center gap-2 sm:gap-3 pr-1">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold leading-none">
                    Total
                  </span>
                  <span className="text-xs sm:text-sm font-black text-white mt-0.5 block">
                    {formatCurrency(cartSubtotal, store?.currency)}
                  </span>
                </div>

                <div
                  className="h-9 px-3.5 sm:px-4 rounded-xl sm:rounded-full text-brand-contrast font-bold text-xs flex items-center gap-1.5 shadow-sm group-hover:brightness-110 active:scale-95 transition-all"
                  style={{ backgroundColor: store?.primary_color || '#10b981' }}
                >
                  <span className="hidden xs:inline">Avançar</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </button>
          </div>
        </aside>
      )}
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
