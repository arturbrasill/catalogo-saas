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
    setEditingProduct(null); // Como novo produto
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

    // Validações básicas no cliente
    if (!formNome.trim() || formNome.trim().length < 2) {
      setFormError('Nome do produto deve ter no mínimo 2 caracteres.');
      return;
    }
    if (!formCategoriaId) {
      setFormError('Selecione uma categoria.');
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
      `Deseja realmente remover o produto "${p.nome}"? O produto será desativado e arquivado.`
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
      // Filtro texto
      const matchesSearch =
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descricao.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro categoria
      const matchesCategory =
        selectedCategory === 'ALL' || p.categoriaId === selectedCategory;

      // Filtro status
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
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Produtos</h1>
            <p className="text-sm text-gray-500">
              Cadastre, edite preços, variações e controle seu estoque.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row gap-3">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Filtro Categoria */}
          <div className="w-full md:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value="ALL">Todos os Status</option>
              <option value="ACTIVE">Somente Ativos</option>
              <option value="INACTIVE">Somente Inativos</option>
            </select>
          </div>
        </div>

        {/* Tabela de Produtos / Empty State */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Carregando catálogo de produtos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm space-y-3">
            <Package className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-semibold text-gray-900">
              Nenhum produto encontrado
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              {searchTerm || selectedCategory !== 'ALL' || statusFilter !== 'ALL'
                ? 'Tente ajustar os filtros ou o termo de busca.'
                : 'Cadastre seu primeiro produto para exibi-lo no catálogo.'}
            </p>
            {!(searchTerm || selectedCategory !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={handleOpenNew}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Agora
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-semibold text-gray-700">
                  <tr>
                    <th className="px-4 py-3">Foto / Produto</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Preço</th>
                    <th className="px-4 py-3">Estoque</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-gray-50/80 transition">
                      {/* Produto & Thumbnail */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-gray-100 border border-gray-200 flex-shrink-0 overflow-hidden">
                            {prod.imagens && prod.imagens.length > 0 ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={prod.imagens[0]}
                                alt={prod.nome}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-300">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 block leading-tight">
                              {prod.nome}
                            </span>
                            <span className="text-xs text-gray-400">
                              {prod.variacoes && prod.variacoes.length > 0
                                ? `${prod.variacoes.length} variação(ões)`
                                : 'Sem variações'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="px-4 py-3 text-xs text-gray-700 font-medium">
                        {getCategoryName(prod.categoriaId)}
                      </td>

                      {/* Preço */}
                      <td className="px-4 py-3">
                        <div className="leading-tight">
                          <span className="font-semibold text-gray-900 block">
                            R$ {prod.preco.toFixed(2).replace('.', ',')}
                          </span>
                          {prod.precoPromocional && (
                            <span className="text-xs text-emerald-600 font-medium">
                              Promo: R$ {prod.precoPromocional.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estoque */}
                      <td className="px-4 py-3">
                        {prod.estoque === -1 ? (
                          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            Sob encomenda
                          </span>
                        ) : prod.estoque <= 3 ? (
                          <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                            {prod.estoque} unid.
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-gray-700">
                            {prod.estoque} unid.
                          </span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(prod)}
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                            prod.ativo
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {prod.ativo ? (
                            <>
                              <Eye className="w-3 h-3" /> Ativo
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" /> Inativo
                            </>
                          )}
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                            title="Editar produto"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(prod)}
                            className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                            title="Duplicar produto"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(prod)}
                            className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                            title="Excluir produto (Soft Delete)"
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

        {/* Modal de Criação / Edição de Produto */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700 p-1 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder="Ex: Tênis Esportivo Pro Runner"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Categoria *
                  </label>
                  <select
                    required
                    value={formCategoriaId}
                    onChange={(e) => setFormCategoriaId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">Selecione uma categoria...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preços e Estoque */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Preço Normal (R$) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formPreco}
                      onChange={(e) => setFormPreco(e.target.value)}
                      placeholder="89.90"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Preço Promo (Opcional)
                    </label>
                    <input
                      type="text"
                      value={formPrecoPromocional}
                      onChange={(e) => setFormPrecoPromocional(e.target.value)}
                      placeholder="69.90"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Estoque (-1 = ilimitado) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formEstoque}
                      onChange={(e) => setFormEstoque(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Descrição Detalhada
                  </label>
                  <textarea
                    rows={3}
                    value={formDescricao}
                    onChange={(e) => setFormDescricao(e.target.value)}
                    placeholder="Detalhes, material, medidas ou orientações sobre o produto..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Upload de Imagens */}
                <ImageUploader
                  value={formImagens}
                  onChange={setFormImagens}
                  disabled={isSubmitting}
                />

                {/* Variation Builder */}
                <VariationBuilder
                  value={formVariacoes}
                  onChange={setFormVariacoes}
                  disabled={isSubmitting}
                />

                {/* Status Ativo */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="formAtivo"
                    checked={formAtivo}
                    onChange={(e) => setFormAtivo(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="formAtivo" className="text-sm font-medium text-gray-800">
                    Produto Ativo (visível no catálogo público)
                  </label>
                </div>

                {/* Ações do Modal */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Salvar Produto
                      </>
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
