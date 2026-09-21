'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { CartProvider, useCart } from '@/lib/cart';
import { ProductCard } from '@/components/catalog/ProductCard';
import { ProductModal } from '@/components/catalog/ProductModal';
import { CartDrawer } from '@/components/catalog/CartDrawer';
import type { StoreConfig, Category, Product } from '@/types';
import { formatCurrency } from '@/lib/whatsapp';
import {
  ShoppingBag,
  Search,
  X,
  Store as StoreIcon,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  Heart,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  MessageCircle,
  Tag,
  Flame,
} from 'lucide-react';

function CatalogContent() {
  const { openCart, getTotalItems, getSubtotal } = useCart();
  const [store, setStore] = useState<StoreConfig | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtros & Estado da Busca
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState<'POPULAR' | 'PRICE_ASC' | 'PRICE_DESC' | 'DISCOUNT'>('POPULAR');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Carrega favoritos do LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('catalog_favorites');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch {
      // Ignora erro de storage
    }
  }, []);

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      try {
        localStorage.setItem('catalog_favorites', JSON.stringify(updated));
      } catch {
        // Ignora erro
      }
      return updated;
    });
  };

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const initialData = await api.getAll();
      if (initialData.store) {
        initialData.store.whatsapp = String(initialData.store.whatsapp ?? '').trim();
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

  // Filtragem e Ordenação de Produtos
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      // Busca textual
      const matchesSearch =
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descricao.toLowerCase().includes(searchTerm.toLowerCase());

      // Categoria
      const matchesCategory =
        selectedCategory === 'ALL' || p.categoriaId === selectedCategory;

      // Filtro de promoção
      const matchesDiscount = onlyDiscount
        ? Boolean(p.precoPromocional && p.precoPromocional < p.preco)
        : true;

      // Filtro de estoque
      const matchesStock = onlyInStock ? p.estoque !== 0 : true;

      // Filtro de favoritos
      const matchesFavorites = onlyFavorites ? favorites.includes(p.id) : true;

      return matchesSearch && matchesCategory && matchesDiscount && matchesStock && matchesFavorites;
    });

    // Ordenação
    result = [...result].sort((a, b) => {
      const priceA = a.precoPromocional && a.precoPromocional < a.preco ? a.precoPromocional : a.preco;
      const priceB = b.precoPromocional && b.precoPromocional < b.preco ? b.precoPromocional : b.preco;

      if (sortBy === 'PRICE_ASC') return priceA - priceB;
      if (sortBy === 'PRICE_DESC') return priceB - priceA;
      if (sortBy === 'DISCOUNT') {
        const discountA = a.precoPromocional ? a.preco - a.precoPromocional : 0;
        const discountB = b.precoPromocional ? b.preco - b.precoPromocional : 0;
        return discountB - discountA;
      }
      return 0; // POPULAR (mantém ordem natural cadastrada)
    });

    return result;
  }, [products, searchTerm, selectedCategory, onlyDiscount, onlyInStock, onlyFavorites, favorites, sortBy]);

  const totalItemsCount = getTotalItems();
  const totalItemsInCart = totalItemsCount;
  const cartSubtotal = getSubtotal();

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setOnlyDiscount(false);
    setOnlyInStock(false);
    setOnlyFavorites(false);
    setSortBy('POPULAR');
  };

  const hasActiveFilters =
    Boolean(searchTerm) ||
    selectedCategory !== 'ALL' ||
    onlyDiscount ||
    onlyInStock ||
    onlyFavorites;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Barra de Aviso Superior (Announcement Bar) */}
      <div className="bg-slate-900 text-white text-[11px] sm:text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span>⚡ Atendimento rápido e pedidos finalizados direto no WhatsApp!</span>
      </div>

      {/* Header Fixo e Glassmorphism */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
            {/* Logo & Identidade da Loja */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-white border border-slate-200/80 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-xs">
                {store?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={store.logo_url}
                    alt={store.store_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <StoreIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 truncate leading-tight">
                  {store?.store_name || 'Catálogo Digital'}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Atendimento Online
                  </span>
                </div>
              </div>
            </div>

            {/* Ações da Direita: Busca Desktop, Favoritos & Botão da Sacola */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Botão de Favoritos */}
              <button
                type="button"
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                className={`p-2.5 rounded-xl border transition flex items-center justify-center cursor-pointer ${
                  onlyFavorites
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
                title="Ver meus produtos favoritos"
                aria-label="Filtrar favoritos"
              >
                <Heart
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    favorites.length > 0 ? 'fill-rose-500 text-rose-500' : ''
                  }`}
                />
                {favorites.length > 0 && (
                  <span className="ml-1.5 text-xs font-bold text-slate-700 hidden sm:inline">
                    {favorites.length}
                  </span>
                )}
              </button>

              {/* Botão da Sacola (Estilo NovaShop) */}
              <button
                type="button"
                onClick={openCart}
                className="relative px-3.5 py-2.5 rounded-2xl text-white shadow-md hover:brightness-95 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer flex-shrink-0"
                style={{ backgroundColor: store?.primary_color || '#10b981' }}
                aria-label="Abrir sacola de compras"
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                <div className="hidden sm:flex flex-col items-start leading-none text-left">
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">
                    Sua Sacola
                  </span>
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
          </div>

          {/* Barra de Busca Integrada */}
          <div className="pb-3.5 pt-0.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar por nome ou descrição do produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-100/80 pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Barra de Categorias Horizontal (Estilo LapakBaju e NovaShop) */}
        {!isLoading && categories.length > 0 && (
          <div className="border-t border-slate-100 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === 'ALL'
                      ? 'text-white shadow-sm scale-102'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                  style={
                    selectedCategory === 'ALL'
                      ? { backgroundColor: store?.primary_color || '#10b981' }
                      : undefined
                  }
                >
                  <span>Todos os Itens</span>
                  <span className="text-[10px] opacity-80">({products.length})</span>
                </button>
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const catCount = products.filter((p) => p.categoriaId === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'text-white shadow-sm scale-102'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                      }`}
                      style={
                        isSelected
                          ? { backgroundColor: store?.primary_color || '#10b981' }
                          : undefined
                      }
                    >
                      <span>{cat.nome}</span>
                      <span className="text-[10px] opacity-80">({catCount})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Banner Promocional Estilo NovaShop / BeautyShop (exibido apenas quando não há busca ativa) */}
        {!searchTerm && selectedCategory === 'ALL' && !onlyDiscount && !onlyFavorites && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-10 shadow-xl border border-slate-800">
            <div className="relative z-10 max-w-xl space-y-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
                <Sparkles className="w-3.5 h-3.5" />
                Catálogo Digital Interativo
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                Seus pedidos favoritos direto pelo WhatsApp.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
                Monte sua sacola, personalize suas opções e finalize com a gente sem taxas abusivas e com atendimento 100% humanizado.
              </p>

              {/* Selos de Benefício */}
              <div className="pt-2 flex flex-wrap gap-3 text-xs text-slate-200">
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ofertas Exclusivas</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Compra Segura</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl">
                  <MessageCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>Atendimento Direto</span>
                </div>
              </div>
            </div>

            {/* Decoração de fundo sutil */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
          </div>
        )}

        {/* Barra de Filtros Rápidos e Ordenação (Estilo LapakBaju e Beauty Shop) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          {/* Quick Filters Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setOnlyDiscount(!onlyDiscount)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                onlyDiscount
                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Apenas Promoções</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyInStock(!onlyInStock)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                onlyInStock
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Em Estoque</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer whitespace-nowrap"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {/* Ordenação */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="POPULAR">Mais Populares</option>
              <option value="PRICE_ASC">Menor Preço</option>
              <option value="PRICE_DESC">Maior Preço</option>
              <option value="DISCOUNT">Maior Desconto</option>
            </select>
          </div>
        </div>

        {/* Estado de Erro na API */}
        {errorMessage && (
          <div className="rounded-3xl bg-rose-50 border border-rose-200 p-8 text-center space-y-3 shadow-xs">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="text-base font-bold text-rose-900">
              Falha ao carregar os itens do catálogo
            </h3>
            <p className="text-xs sm:text-sm text-rose-700 max-w-md mx-auto leading-relaxed">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Estado de Carregamento (Loading Skeleton) */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden animate-pulse p-3.5 space-y-3"
              >
                <div className="aspect-square bg-slate-200 rounded-xl" />
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                <div className="h-6 bg-slate-200 rounded-md w-1/3 pt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Grid de Produtos */}
        {!isLoading && !errorMessage && (
          <>
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center my-6 space-y-3.5 shadow-xs">
                <SlidersHorizontal className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
                <h3 className="text-base font-bold text-slate-900">
                  Nenhum produto encontrado
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {searchTerm
                    ? `Não encontramos itens correspondentes a "${searchTerm}". Verifique a digitação ou remova filtros.`
                    : 'Não há produtos disponíveis com os filtros selecionados.'}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="inline-flex items-center text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    Ver todos os produtos
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
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
                    onSelect={(p) => setSelectedProduct(p)}
                    isFavorite={favorites.includes(prod.id)}
                    onToggleFavorite={toggleFavorite}
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

      {/* Drawer da Sacola de Compras */}
      {store && <CartDrawer store={store} />}

      {/* Rodapé da Vitrine (Estilo Beauty Shop e NovaShop) */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Selos de Confiança no Rodapé */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-slate-100 text-center sm:text-left">
            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">WhatsApp Direto</h4>
                <p className="text-xs text-slate-500">Tire dúvidas e negocie direto com o atendente</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Entrega Flexível</h4>
                <p className="text-xs text-slate-500">Combine a melhor forma de envio para seu endereço</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Catálogo Oficial</h4>
                <p className="text-xs text-slate-500">Produtos atualizados em tempo real pelo lojista</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              <span className="font-bold text-slate-800">
                {store?.store_name || 'Catálogo Digital'}
              </span>{' '}
              • Todos os direitos reservados.
            </div>
            <div>
              <a
                href="/admin/login"
                className="text-xs text-slate-500 hover:text-slate-800 hover:underline transition font-medium"
              >
                Área do Lojista (/admin)
              </a>
            </div>
          </div>
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
