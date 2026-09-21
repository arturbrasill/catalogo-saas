'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { VariationBuilder } from '@/components/admin/VariationBuilder';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Product, Category, VariationOption } from '@/types';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  X,
  Check,
  Package,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
} from 'lucide-react';

export default function AdminProdutosPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtros de Busca
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Estado do Modal de Produto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Campos do Formulário
  const [formNome, setFormNome] = useState('');
  const [formCategoriaId, setFormCategoriaId] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formPreco, setFormPreco] = useState('');
  const [formPrecoPromocional, setFormPrecoPromocional] = useState('');
  const [formEstoque, setFormEstoque] = useState('10');
  const [formAtivo, setFormAtivo] = useState(true);
  const [formImagens, setFormImagens] = useState<string[]>([]);
  const [formVariacoes, setFormVariacoes] = useState<VariationOption[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [prodsData, catsData] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
      ]);
      setProducts(prodsData || []);
      setCategories(catsData || []);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao carregar produtos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Abre modal para novo produto
  const handleOpenNew = () => {
    setEditingProduct(null);
    setFormNome('');
    setFormCategoriaId(categories[0]?.id || '');
    setFormDescricao('');
    setFormPreco('');
    setFormPrecoPromocional('');
    setFormEstoque('10');
    setFormAtivo(true);
    setFormImagens([]);
    setFormVariacoes([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Abre modal para editar produto
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormNome(p.nome);
    setFormCategoriaId(p.categoriaId);
    setFormDescricao(p.descricao);
    setFormPreco(String(p.preco));
    setFormPrecoPromocional(p.precoPromocional ? String(p.precoPromocional) : '');
    setFormEstoque(String(p.estoque));
    setFormAtivo(p.ativo);
    setFormImagens(p.imagens || []);
    setFormVariacoes(p.variacoes || []);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Duplicar produto
  const handleDuplicate = (p: Product) => {
    setEditingProduct(null);
    setFormNome(`${p.nome} (Cópia)`);
    setFormCategoriaId(p.categoriaId);
    setFormDescricao(p.descricao);
    setFormPreco(String(p.preco));
    setFormPrecoPromocional(p.precoPromocional ? String(p.precoPromocional) : '');
    setFormEstoque(String(p.estoque));
    setFormAtivo(true);
    setFormImagens(p.imagens || []);
    setFormVariacoes(p.variacoes || []);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Salvar formulário (Criar ou Atualizar)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setFormError('Sessão expirada. Faça login novamente.');
      return;
    }

    setFormError(null);

    // Validações no cliente
    if (!formNome.trim() || formNome.trim().length < 2) {
      setFormError('Nome do produto deve ter no mínimo 2 caracteres.');
      return;
    }
    if (!formCategoriaId) {
      setFormError('Selecione uma categoria para o produto.');
      return;
    }
    const precoNum = parseFloat(String(formPreco || '').replace(',', '.'));
    if (isNaN(precoNum) || precoNum <= 0) {
      setFormError('Preço deve ser um número maior que zero.');
      return;
    }

    let precoPromoNum: number | null = null;
    if (String(formPrecoPromocional || '').trim()) {
      precoPromoNum = parseFloat(String(formPrecoPromocional || '').replace(',', '.'));
      if (isNaN(precoPromoNum) || precoPromoNum <= 0) {
        setFormError('Preço promocional deve ser maior que zero.');
        return;
      }
      if (precoPromoNum >= precoNum) {
        setFormError('Preço promocional deve ser menor que o preço original.');
        return;
      }
    }

    const estoqueNum = parseInt(formEstoque, 10);
    if (isNaN(estoqueNum) || estoqueNum < -1) {
      setFormError('Estoque deve ser um número inteiro maior ou igual a -1.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        // Atualização
        const updated = await api.updateProduct(
          {
            id: editingProduct.id,
            nome: formNome.trim(),
            categoriaId: formCategoriaId,
            descricao: formDescricao.trim(),
            preco: precoNum,
            precoPromocional: precoPromoNum,
            estoque: estoqueNum,
            ativo: formAtivo,
            imagens: formImagens,
            variacoes: formVariacoes,
          },
          token
        );
        setProducts((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
      } else {
        // Criação
        const created = await api.createProduct(
          {
            nome: formNome.trim(),
            slug: '',
            categoriaId: formCategoriaId,
            descricao: formDescricao.trim(),
            preco: precoNum,
            precoPromocional: precoPromoNum,
            estoque: estoqueNum,
            ativo: formAtivo,
            imagens: formImagens,
            variacoes: formVariacoes,
          },
          token
        );
        setProducts((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Alternar Ativo / Inativo
  const handleToggleStatus = async (p: Product) => {
    if (!token) return;
    try {
      const updated = await api.updateProduct(
        {
          id: p.id,
          ativo: !p.ativo,
        },
        token
      );
      setProducts((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao alterar status.');
    }
  };

  // Soft Delete
  const handleDelete = async (p: Product) => {
    if (!token) return;
    const confirmDelete = window.confirm(
      `Deseja realmente arquivar o produto "${p.nome}"? Ele será desativado na vitrine.`
    );
    if (!confirmDelete) return;

    try {
      await api.deleteProduct(p.id, token);
      setProducts((prev) => prev.filter((item) => item.id !== p.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao remover produto.');
    }
  };

  // Filtragem
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descricao.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'ALL' || p.categoriaId === selectedCategory;

      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
          ? p.ativo
          : !p.ativo;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, statusFilter]);

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.nome : 'Sem Categoria';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Gerenciar Produtos
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Cadastre, edite preços, organize fotos e controle estoques em tempo real.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-md hover:shadow-lg active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Produto</span>
          </button>
        </div>

        {/* Barra de Filtros (Estilo LapakBaju) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row gap-3">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por nome ou descrição do produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-8 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro Categoria */}
          <div className="w-full md:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="ALL">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Status */}
          <div className="w-full md:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="ALL">Todos os Status</option>
              <option value="ACTIVE">Somente Ativos</option>
              <option value="INACTIVE">Somente Inativos</option>
            </select>
          </div>
        </div>

        {/* Tabela de Produtos ou Empty State */}
        {isLoading ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">Sincronizando produtos da loja...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
            <h3 className="text-base font-bold text-slate-900">
              Nenhum produto cadastrado ou encontrado
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {searchTerm || selectedCategory !== 'ALL' || statusFilter !== 'ALL'
                ? 'Tente alterar os termos de busca ou filtros selecionados.'
                : 'Cadastre seu primeiro produto para começar a receber pedidos no catálogo digital.'}
            </p>
            {!(searchTerm || selectedCategory !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={handleOpenNew}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Agora
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Produto & Detalhes</th>
                    <th className="px-4 py-3.5">Categoria</th>
                    <th className="px-4 py-3.5">Preço</th>
                    <th className="px-4 py-3.5">Estoque</th>
                    <th className="px-4 py-3.5">Visibilidade</th>
                    <th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Foto e Produto */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3.5">
                          <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200/70 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {prod.imagens && prod.imagens.length > 0 ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={prod.imagens[0]}
                                alt={prod.nome}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-300 stroke-1" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block leading-snug truncate max-w-xs">
                              {prod.nome}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {prod.variacoes && prod.variacoes.length > 0 ? (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold border border-emerald-100">
                                  {prod.variacoes.length} variação(ões)
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Padrão</span>
                              )}
                              {prod.descricao && (
                                <span className="text-[11px] text-slate-400 truncate max-w-[140px] hidden sm:inline">
                                  • {prod.descricao}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-700">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
                          {getCategoryName(prod.categoriaId)}
                        </span>
                      </td>

                      {/* Preço */}
                      <td className="px-4 py-3.5">
                        <div className="leading-tight">
                          <span className="font-bold text-slate-900 block">
                            R$ {prod.preco.toFixed(2).replace('.', ',')}
                          </span>
                          {prod.precoPromocional && (
                            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                              Promo: R$ {prod.precoPromocional.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estoque */}
                      <td className="px-4 py-3.5">
                        {prod.estoque === -1 ? (
                          <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                            Sob encomenda
                          </span>
                        ) : prod.estoque <= 3 && prod.estoque > 0 ? (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                            Apenas {prod.estoque} unid.
                          </span>
                        ) : prod.estoque === 0 ? (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                            Esgotado
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60">
                            {prod.estoque} unid.
                          </span>
                        )}
                      </td>

                      {/* Visibilidade / Status */}
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(prod)}
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition cursor-pointer ${
                            prod.ativo
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Clique para alternar visibilidade"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              prod.ativo ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                            }`}
                          />
                          <span>{prod.ativo ? 'Ativo na Loja' : 'Oculto'}</span>
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDuplicate(prod)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Duplicar produto"
                            aria-label={`Duplicar ${prod.nome}`}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="Editar produto"
                            aria-label={`Editar ${prod.nome}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(prod)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Remover produto"
                            aria-label={`Remover ${prod.nome}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de Criação / Edição do Produto */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col relative animate-scale-in">
              {/* Header do Modal */}
              <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Preencha as informações do produto para exibição no catálogo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Formulário */}
              <form onSubmit={handleSave} className="p-6 space-y-5">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Nome do Produto */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Tênis Air Max Sport Confort"
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Categoria *
                  </label>
                  <select
                    value={formCategoriaId}
                    onChange={(e) => setFormCategoriaId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white cursor-pointer"
                  >
                    <option value="">Selecione uma categoria...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grid Preço, Promoção & Estoque */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Preço Normal (R$) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="0,00"
                      value={formPreco}
                      onChange={(e) => setFormPreco(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Preço Promo (R$)
                    </label>
                    <input
                      type="text"
                      placeholder="Opcional"
                      value={formPrecoPromocional}
                      onChange={(e) => setFormPrecoPromocional(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Estoque (-1 p/ ilimitado)
                    </label>
                    <input
                      type="number"
                      value={formEstoque}
                      onChange={(e) => setFormEstoque(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Descrição Detalhada
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Detalhes, material, medidas, garantia..."
                    value={formDescricao}
                    onChange={(e) => setFormDescricao(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Imagens do Produto (ImageUploader) */}
                <div className="pt-2 border-t border-slate-100">
                  <ImageUploader
                    value={formImagens}
                    onChange={setFormImagens}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Variações do Produto (VariationBuilder) */}
                <div className="pt-2 border-t border-slate-100">
                  <VariationBuilder
                    value={formVariacoes}
                    onChange={setFormVariacoes}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Status Ativo / Inativo */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Produto Ativo na Vitrine
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Se desativado, o produto não aparecerá nas buscas dos clientes.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formAtivo}
                    onChange={(e) => setFormAtivo(e.target.checked)}
                    className="h-5 w-5 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                </div>

                {/* Botões do Rodapé */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Produto'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
