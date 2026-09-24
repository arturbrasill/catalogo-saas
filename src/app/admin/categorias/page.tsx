'use client';

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Category } from '@/types';
import {
  Plus,
  Edit2,
  Trash2,
  FolderTree,
  Loader2,
  AlertCircle,
  X,
  Check,
  ArrowUpDown,
  Layers,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export default function AdminCategoriasPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal State (Delete Confirmation)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [formNome, setFormNome] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formOrdem, setFormOrdem] = useState('0');
  const [formAtivo, setFormAtivo] = useState(true);

  const loadCategories = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getCategories();
      setCategories(data || []);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao carregar categorias.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenNew = () => {
    setEditingCategory(null);
    setFormNome('');
    setFormSlug('');
    setFormOrdem(String(categories.length + 1));
    setFormAtivo(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    setFormNome(c.nome);
    setFormSlug(c.slug);
    setFormOrdem(String(c.ordem));
    setFormAtivo(c.ativo);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setFormError(null);
    if (!formNome.trim() || formNome.trim().length < 2) {
      setFormError('Nome da categoria deve ter no mínimo 2 caracteres.');
      return;
    }

    const ordemNum = parseInt(formOrdem, 10);
    if (isNaN(ordemNum) || ordemNum < 0) {
      setFormError('A ordem deve ser um número maior ou igual a zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        const updated = await api.updateCategory(
          {
            id: editingCategory.id,
            nome: formNome.trim(),
            slug: formSlug.trim() || undefined,
            ordem: ordemNum,
            ativo: formAtivo,
          },
          token
        );
        setCategories((prev) =>
          prev
            .map((c) => (c.id === updated.id ? updated : c))
            .sort((a, b) => a.ordem - b.ordem)
        );
      } else {
        const created = await api.createCategory(
          {
            nome: formNome.trim(),
            slug: formSlug.trim() || undefined,
            ordem: ordemNum,
            ativo: formAtivo,
          },
          token
        );
        setCategories((prev) => [...prev, created].sort((a, b) => a.ordem - b.ordem));
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar categoria.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!token || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteCategory(deleteTarget.id, token);
      setCategories((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao desativar categoria.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Gerenciar Categorias
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Defina as seções do catálogo e ajuste a ordem de visualização na vitrine.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-md hover:shadow-lg active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nova Categoria</span>
          </button>
        </div>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs sm:text-sm text-rose-800 flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={loadCategories}
              className="underline font-bold hover:text-rose-950 cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Tabela de Categorias */}
        {isLoading ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">Carregando categorias...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs space-y-3">
            <FolderTree className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
            <h3 className="text-base font-bold text-slate-900">
              Nenhuma categoria cadastrada
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Crie categorias como &quot;Roupas&quot;, &quot;Acessórios&quot; ou &quot;Ofertas&quot; para organizar seus produtos na vitrine.
            </p>
            <button
              type="button"
              onClick={handleOpenNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Criar Categoria
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Ordem</th>
                    <th className="px-5 py-3.5">Nome da Categoria</th>
                    <th className="px-5 py-3.5">Identificador (Slug)</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Ordem */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200/60">
                          #{cat.ordem}
                        </span>
                      </td>

                      {/* Nome */}
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {cat.nome}
                      </td>

                      {/* Slug */}
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-400">
                        {cat.slug || '-'}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            cat.ativo
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              cat.ativo ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{cat.ativo ? 'Ativa' : 'Oculta'}</span>
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="Editar categoria"
                            aria-label={`Editar ${cat.nome}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(cat)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Desativar categoria"
                            aria-label={`Desativar ${cat.nome}`}
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

        {/* Modal de Criação / Edição de Categoria */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-5 animate-scale-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nome da Categoria *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Calçados, Moda Praia, Acessórios..."
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Ordem de Exibição (Posição)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formOrdem}
                    onChange={(e) => setFormOrdem(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Números menores aparecem primeiro na barra de categorias da vitrine.
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Categoria Ativa</span>
                    <span className="text-[11px] text-slate-400">Exibir no catálogo público</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formAtivo}
                    onChange={(e) => setFormAtivo(e.target.checked)}
                    className="h-5 w-5 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
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
                      'Salvar Categoria'
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
                <h3 className="text-base font-bold text-slate-900">Desativar Categoria</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tem certeza que deseja desativar a categoria <strong className="text-slate-800">{deleteTarget.nome}</strong>? Os produtos vinculados a ela deixarão de aparecer na vitrine.
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
                  onClick={confirmDeleteCategory}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Desativar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
