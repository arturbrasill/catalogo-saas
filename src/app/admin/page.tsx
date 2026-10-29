'use client';

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import type { Product, Category, StoreConfig } from '@/types';
import {
  Package,
  CheckCircle2,
  XCircle,
  FolderTree,
  AlertTriangle,
  Plus,
  ArrowRight,
  RefreshCw,
  Store,
  MessageCircle,
  Sparkles,
  ExternalLink,
  Sliders,
  Check,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [store, setStore] = useState<StoreConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getAll();
      setProducts(data.products || []);
      setCategories(data.categories || []);
      setStore(data.store || null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Falha ao carregar dados do dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.ativo).length;
  const inactiveProducts = totalProducts - activeProducts;
  const lowStockProducts = products.filter((p) => p.ativo && p.estoque >= 0 && p.estoque <= 3).length;

  const hasWhatsapp = Boolean(store?.whatsapp && String(store.whatsapp).trim().length >= 10);
  const hasLogo = Boolean(store?.logo_url && String(store.logo_url).trim().length > 0);
  const hasCategories = categories.length > 0;
  const hasProducts = products.length > 0;

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Banner de Boas-Vindas e Ações Rápidas */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                Painel do Lojista
              </span>
              <span className="text-xs font-semibold text-slate-500">• NumClick</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {store?.store_name ? `Olá, ${store.store_name}!` : 'Bem-vindo ao Painel!'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Acompanhe seu inventário, organize seções e controle as vendas do seu catálogo.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <a
              href="/admin/produtos"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Produto
            </a>
          </div>
        </div>

        {/* Estado de Erro */}
        {errorMessage && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-center justify-between text-sm text-rose-800">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={loadData}
              className="font-semibold underline hover:text-rose-950 cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Alerta de Pagamento Pendente / Bloqueio Asaas */}
        {(store?.pending_payment || store?.subscription_status === 'blocked' || store?.subscription_status === 'expired') && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-950 shadow-xs">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base text-amber-950 tracking-tight">
                  {store?.subscription_status === 'blocked' ? 'Acesso ao Catálogo Bloqueado' : 'Aviso de Pagamento Pendente'}
                </h3>
                <p className="text-xs sm:text-sm text-amber-800/90 mt-0.5">
                  A cobrança da assinatura mensal recorrente (R$ 89,90) após o término dos 7 dias gratuitos está pendente ou não foi processada no Asaas. Regularize sua assinatura para garantir o funcionamento contínuo do seu catálogo.
                </p>
              </div>
            </div>
            {store?.asaas_payment_link && (
              <a
                href={store.asaas_payment_link}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Pagar Fatura Pendente
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Bento Grid de Métricas (Modern SaaS KPI Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Produtos */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Cadastrado
              </span>
              <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 tracking-tight">
                {isLoading ? '...' : totalProducts}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Itens cadastrados no catálogo</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-600">
              <span className="font-semibold text-emerald-600">{activeProducts} ativos</span>
              <span>•</span>
              <span>{inactiveProducts} inativos</span>
            </div>
          </div>

          {/* Card 2: Produtos Ativos */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Visíveis na Vitrine
              </span>
              <div className="h-9 w-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 tracking-tight">
                {isLoading ? '...' : activeProducts}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Disponíveis para compra dos clientes</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-orange-600 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-600" />
              <span>Prontos para pedidos no WhatsApp</span>
            </div>
          </div>

          {/* Card 3: Categorias */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Categorias Ativas
              </span>
              <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <FolderTree className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 tracking-tight">
                {isLoading ? '...' : categories.length}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Seções de navegação do catálogo</p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-semibold">
              <span>Organizadas por prioridade</span>
            </div>
          </div>

          {/* Card 4: Atenção Estoque */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Atenção ao Estoque
              </span>
              <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 tracking-tight">
                {isLoading ? '...' : lowStockProducts}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Produtos com 3 ou menos unidades</p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-amber-700 font-semibold">
              <span>{lowStockProducts > 0 ? 'Necessita reposição breve' : 'Estoque regular'}</span>
            </div>
          </div>
        </div>

        {/* Seção Central: Checklist de Configuração da Loja */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                Status de Configuração da Loja
              </h3>
              <p className="text-xs text-slate-500">
                Verifique os itens essenciais para que seu catálogo converta com eficiência.
              </p>
            </div>
            <a
              href="/admin/configuracoes"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition"
            >
              Configurar Loja &rarr;
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${hasWhatsapp ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {hasWhatsapp ? <Check className="w-4 h-4 stroke-[2.5]" /> : <MessageCircle className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-900 block">WhatsApp de Vendas</span>
                <span className="text-[11px] text-slate-500">
                  {hasWhatsapp ? 'Cadastrado e Ativo' : 'Pendente de cadastro'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${hasLogo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                {hasLogo ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Store className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-900 block">Logotipo da Loja</span>
                <span className="text-[11px] text-slate-500">
                  {hasLogo ? 'Personalizado' : 'Usando ícone padrão'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${hasCategories ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {hasCategories ? <Check className="w-4 h-4 stroke-[2.5]" /> : <FolderTree className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-900 block">Categorias</span>
                <span className="text-[11px] text-slate-500">
                  {categories.length} categoria(s) criada(s)
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${hasProducts ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {hasProducts ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Package className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-900 block">Catálogo de Produtos</span>
                <span className="text-[11px] text-slate-500">
                  {products.length} produto(s) no total
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Atalhos Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/produtos"
            className="group bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-slate-400 transition space-y-3 cursor-pointer"
          >
            <div className="h-10 w-10 rounded-lg bg-orange-50 text-orange-600 border border-orange-200/60 flex items-center justify-center font-semibold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 tracking-tight group-hover:text-orange-600 transition flex items-center justify-between text-sm sm:text-base">
                Gerenciar Produtos
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Cadastre novos itens, edite preços, organize fotos e controle estoques.
              </p>
            </div>
          </a>

          <a
            href="/admin/categorias"
            className="group bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-slate-400 transition space-y-3 cursor-pointer"
          >
            <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-semibold">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 tracking-tight group-hover:text-orange-600 transition flex items-center justify-between text-sm sm:text-base">
                Gerenciar Categorias
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Crie e ordene as seções da vitrine para facilitar a navegação do cliente.
              </p>
            </div>
          </a>

          <a
            href="/admin/configuracoes"
            className="group bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-slate-400 transition space-y-3 cursor-pointer"
          >
            <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-semibold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 tracking-tight group-hover:text-orange-600 transition flex items-center justify-between text-sm sm:text-base">
                Identidade & WhatsApp
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Personalize nome da loja, cores da marca, número de WhatsApp e logo.
              </p>
            </div>
          </a>
        </div>
      </div>
    </AdminLayout>
  );
}
