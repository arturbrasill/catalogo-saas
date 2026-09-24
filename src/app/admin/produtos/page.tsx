'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { VariationBuilder } from '@/components/admin/VariationBuilder';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { maskCurrency, unmaskCurrency } from '@/lib/masks';
import type { Product, Category, VariationOption } from '@/types';
import { hasVariationPricing } from '@/lib/variations';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Copy,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  Package,
  Layers,
  Sparkles,
  ArrowUpDown,
  Tag,
  Eye,
  AlertTriangle,
} from 'lucide-react';

export default function AdminProdutosPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtros de Busca em Tempo Real
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Estado do Modal de Produto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal de Confirmação de Exclusão (Soft Delete)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Campos do Formulário com Máscara de Moeda
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
    setFormPreco(maskCurrency(p.preco));
    setFormPrecoPromocional(p.precoPromocional ? maskCurrency(p.precoPromocional) : '');
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
    setFormPreco(maskCurrency(p.preco));
    setFormPrecoPromocional(p.precoPromocional ? maskCurrency(p.precoPromocional) : '');
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

    const precoNum = unmaskCurrency(formPreco);
    if (isNaN(precoNum) || precoNum <= 0) {
      setFormError('Preço deve ser maior que zero (ex: R$ 10,00).');
      return;
    }

    let precoPromoNum: number | null = null;
    if (formPrecoPromocional.trim()) {
      precoPromoNum = unmaskCurrency(formPrecoPromocional);
      if (isNaN(precoPromoNum) || precoPromoNum <= 0) {
        setFormError('Preço promocional deve ser maior que zero.');
        return;
      }
      if (precoPromoNum >= precoNum) {
        setFormError('O preço promocional deve ser menor que o preço normal de venda.');
        return;
      }
    }

    const estoqueNum = parseInt(formEstoque, 10);
    if (isNaN(estoqueNum) || estoqueNum < -1) {
      setFormError('Estoque deve ser um número inteiro válido (-1 para ilimitado).');
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

  // Alternar Ativo / Pausado via Switch Liga/Desliga
  const handleToggleStatus = async (p: Product) => {
    if (!token || togglingId) return;
    const nextStatus = !p.ativo;

    // Atualização otimista na UI
    setTogglingId(p.id);
    setProducts((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, ativo: nextStatus } : item))
    );

    try {
      const updated = await api.updateProduct(
        {
          id: p.id,
          ativo: nextStatus,
        },
        token
      );
      setProducts((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      // Reverte em caso de falha
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, ativo: !nextStatus } : item))
      );
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao alterar status do produto.');
    } finally {
      setTogglingId(null);
    }
  };

  // Soft Delete via Modal Customizado
  const confirmDeleteProduct = async () => {
    if (!token || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteProduct(deleteTarget.id, token);
      setProducts((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao arquivar produto.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtragem em Tempo Real
  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return products.filter((p) => {
      const matchesSearch =
        !term ||
        p.nome.toLowerCase().includes(term) ||
        p.descricao.toLowerCase().includes(term);

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

  // Contagem de produtos por categoria
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.categoriaId] = (counts[p.categoriaId] || 0) + 1;
    });
    return counts;
  }, [products]);

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
              Busca em tempo real, switch liga/desliga de produtos, fotos com preview e controle de variações.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-2xl shadow-sm hover:shadow active:scale-98 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Produto</span>
          </button>
        </div>

        {/* Barra de Filtros e Busca em Tempo Real */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Campo de Busca em Tempo Real */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar por nome ou palavras-chave do produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded-full"
                  title="Limpar busca"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro Status */}
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 focus:bg-white focus:border-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Todos os Status</option>
                <option value="ACTIVE">🟢 Somente Ativos</option>
                <option value="INACTIVE">⚪ Somente Pausados</option>
              </select>
            </div>
          </div>

          {/* Filtro Rápido por Pílulas de Categoria */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1 flex-shrink-0">
              <Filter className="w-3 h-3 text-slate-400" />
              Categorias:
            </span>

            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({products.length})
            </button>

            {categories.map((c) => {
              const count = categoryCounts[c.id] || 0;
              const isSelected = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.nome} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabela de Produtos ou Empty State */}
        {isLoading ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-14 text-center shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin text-slate-900 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Sincronizando produtos da loja...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
            <h3 className="text-base font-bold text-slate-900">
              Nenhum produto cadastrado ou encontrado
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {searchTerm || selectedCategory !== 'ALL' || statusFilter !== 'ALL'
                ? 'Tente ajustar os termos de busca ou remover os filtros aplicados.'
                : 'Cadastre seu primeiro produto para começar a vender pelo WhatsApp com catálogo digital.'}
            </p>
            {!(searchTerm || selectedCategory !== 'ALL' || statusFilter !== 'ALL') ? (
              <button
                type="button"
                onClick={handleOpenNew}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Agora
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('ALL');
                  setStatusFilter('ALL');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Produto & Variações</th>
                    <th className="px-4 py-4">Categoria</th>
                    <th className="px-4 py-4">Preço</th>
                    <th className="px-4 py-4">Estoque</th>
                    <th className="px-4 py-4">Status (Liga/Desliga)</th>
                    <th className="px-5 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Foto e Nome */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3.5">
                          <div className="h-12 w-12 rounded-2xl bg-slate-100 border border-slate-200/70 flex-shrink-0 overflow-hidden flex items-center justify-center">
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
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {prod.variacoes && prod.variacoes.length > 0 ? (
                                <span className="text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-semibold border border-slate-200/60">
                                  {prod.variacoes.length} {prod.variacoes.length === 1 ? 'variação' : 'variações'}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Padrão</span>
                              )}
                              {hasVariationPricing(prod.variacoes, prod.preco) && (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                                  Preço variável
                                </span>
                              )}
                              {prod.descricao && (
                                <span className="text-[11px] text-slate-400 truncate max-w-[150px] hidden sm:inline">
                                  • {prod.descricao}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-700">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200/60">
                          {getCategoryName(prod.categoriaId)}
                        </span>
                      </td>

                      {/* Preço */}
                      <td className="px-4 py-3.5">
                        <div className="leading-tight">
                          {hasVariationPricing(prod.variacoes, prod.preco) && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                              A partir de
                            </span>
                          )}
                          <span className="font-bold text-slate-900 block">
                            R$ {prod.preco.toFixed(2).replace('.', ',')}
                          </span>
                          {prod.precoPromocional && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                              Promo: R$ {prod.precoPromocional.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estoque */}
                      <td className="px-4 py-3.5">
                        {prod.estoque === -1 ? (
                          <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                            Ilimitado
                          </span>
                        ) : prod.estoque <= 3 && prod.estoque > 0 ? (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                            {prod.estoque} unid.
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

                      {/* Switch Visual Liga / Desliga */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={prod.ativo}
                            disabled={togglingId === prod.id}
                            onClick={() => handleToggleStatus(prod)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-50 ${
                              prod.ativo ? 'bg-emerald-600' : 'bg-slate-300'
                            }`}
                            title={prod.ativo ? 'Clique para pausar este produto' : 'Clique para ativar este produto'}
                            aria-label={`Alternar status de ${prod.nome}`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                prod.ativo ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className="text-xs font-semibold text-slate-700">
                            {prod.ativo ? (
                              <span className="text-emerald-700">Ativo</span>
                            ) : (
                              <span className="text-slate-400">Pausado</span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDuplicate(prod)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            title="Duplicar produto"
                            aria-label={`Duplicar ${prod.nome}`}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            title="Editar produto"
                            aria-label={`Editar ${prod.nome}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(prod)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Arquivar produto"
                            aria-label={`Arquivar ${prod.nome}`}
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
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Defina fotos, preços formatados, categorias e variações de compra.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  aria-label="Fechar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Formulário */}
              <form onSubmit={handleSave} className="p-6 space-y-5">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-center gap-2 text-xs text-rose-800 animate-shake">
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
                    placeholder="Ex: Tênis Runner Air Confort"
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/5"
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
                    className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/5 bg-white cursor-pointer"
                  >
                    <option value="">Selecione uma categoria...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grid Preço Normal, Preço Promo e Estoque com Máscara de Moeda (R$ 0,00) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Preço Normal *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="R$ 0,00"
                      value={formPreco}
                      onChange={(e) => setFormPreco(maskCurrency(e.target.value))}
                      className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/5 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Preço Promocional
                    </label>
                    <input
                      type="text"
                      placeholder="R$ 0,00 (Opcional)"
                      value={formPrecoPromocional}
                      onChange={(e) => setFormPrecoPromocional(maskCurrency(e.target.value))}
                      className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-emerald-700 focus:border-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/5 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Estoque (-1 ilimitado)
                    </label>
                    <input
                      type="number"
                      value={formEstoque}
                      onChange={(e) => setFormEstoque(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/5"
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
                    className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/5"
                  />
                </div>

                {/* Imagens do Produto com Preview em Tempo Real */}
                <div className="pt-2 border-t border-slate-100">
                  <ImageUploader
                    value={formImagens}
                    onChange={setFormImagens}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Variações do Produto (VariationBuilder intuitivo) */}
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
                      Se pausado, os clientes não verão este produto nas buscas do catálogo.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formAtivo}
                      onClick={() => setFormAtivo(!formAtivo)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-900/20 ${
                        formAtivo ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          formAtivo ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-slate-700">
                      {formAtivo ? 'Ativo' : 'Pausado'}
                    </span>
                  </div>
                </div>

                {/* Botões do Rodapé */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Salvando Produto...</span>
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

        {/* Modal de Confirmação de Exclusão */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 animate-scale-in">
              <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900">Arquivar Produto</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tem certeza que deseja arquivar <strong className="text-slate-800">{deleteTarget.nome}</strong>? Ele deixará de ser exibido na vitrine da loja.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteTarget(null)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmDeleteProduct}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Arquivar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
