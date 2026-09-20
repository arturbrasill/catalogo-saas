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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard da Loja
            </h1>
            <p className="text-sm text-gray-500">
              Visão geral do inventário e configurações de{' '}
              <span className="font-semibold text-gray-800">
                {store?.store_name || 'sua loja'}
              </span>
              .
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <a
              href="/admin/produtos?action=new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Novo Produto
            </a>
          </div>
        </div>

        {/* Estado de Erro */}
        {errorMessage && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center justify-between text-sm text-red-700">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={loadData}
              className="font-medium underline hover:text-red-900"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Métricas Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Produtos */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-medium uppercase tracking-wider">Total de Produtos</span>
              <Package className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {isLoading ? '...' : totalProducts}
            </div>
            <p className="text-xs text-gray-500">Itens cadastrados na planilha</p>
          </div>

          {/* Card 2: Produtos Ativos */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Produtos Ativos</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-emerald-600">
              {isLoading ? '...' : activeProducts}
            </div>
            <p className="text-xs text-gray-500">Visíveis para compra na vitrine</p>
          </div>

          {/* Card 3: Categorias */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-medium uppercase tracking-wider">Categorias</span>
              <FolderTree className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {isLoading ? '...' : categories.length}
            </div>
            <p className="text-xs text-gray-500">Grupos de navegação ativos</p>
          </div>

          {/* Card 4: Estoque Baixo / Inativos */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Atenção Estoque</span>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-amber-600">
              {isLoading ? '...' : lowStockProducts}
            </div>
            <p className="text-xs text-gray-500">{inactiveProducts} produto(s) inativo(s)</p>
          </div>
        </div>

        {/* Atalhos e Próximas Ações */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <a
            href="/admin/produtos"
            className="group bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-emerald-500 transition space-y-2"
          >
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition flex items-center justify-between">
              Gerenciar Produtos
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
            </h3>
            <p className="text-xs text-gray-500">
              Cadastre, edite preços, controle estoque e fotos dos produtos.
            </p>
          </a>

          <a
            href="/admin/categorias"
            className="group bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-emerald-500 transition space-y-2"
          >
            <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FolderTree className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition flex items-center justify-between">
              Gerenciar Categorias
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
            </h3>
            <p className="text-xs text-gray-500">
              Organize os grupos do catálogo e a ordem de exibição na vitrine.
            </p>
          </a>

          <a
            href="/admin/configuracoes"
            className="group bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-emerald-500 transition space-y-2"
          >
            <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition flex items-center justify-between">
              Identidade & Loja
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition" />
            </h3>
            <p className="text-xs text-gray-500">
              Personalize nome, cores da marca, número do WhatsApp e logo.
            </p>
          </a>
        </div>
      </div>
    </AdminLayout>
  );
}
