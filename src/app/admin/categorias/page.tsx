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

  const handleDelete = async (c: Category) => {
    if (!token) return;
    const confirmDelete = window.confirm(
      `Deseja realmente desativar a categoria "${c.nome}"? Os produtos vinculados a ela deixarão de aparecer na vitrine.`
    );
    if (!confirmDelete) return;

    try {
      await api.deleteCategory(c.id, token);
      setCategories((prev) => prev.filter((item) => item.id !== c.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao desativar categoria.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Categorias</h1>
            <p className="text-sm text-gray-500">
              Crie e organize as seções de navegação da vitrine.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Categoria
          </button>
        </div>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={loadCategories}
              className="underline font-medium hover:text-red-900"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Tabela ou Empty State */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Carregando categorias...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm space-y-3">
            <FolderTree className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-semibold text-gray-900">
              Nenhuma categoria cadastrada
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Crie categorias para agrupar e organizar os produtos na vitrine.
            </p>
            <button
              type="button"
              onClick={handleOpenNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Criar Primeira Categoria
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-semibold text-gray-700">
                  <tr>
                    <th className="px-4 py-3">Ordem</th>
                    <th className="px-4 py-3">Nome da Categoria</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-4 py-3 font-semibold text-gray-700 flex items-center gap-1.5">
                        <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                        {cat.ordem}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {cat.nome}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                        {cat.slug}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            cat.ativo
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border-gray-300'
                          }`}
                        >
                          {cat.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                            title="Editar categoria"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                            title="Desativar categoria"
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

        {/* Modal de Categoria */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
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
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Nome da Categoria *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder="Ex: Calçados Esportivos"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Ordem de Exibição *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formOrdem}
                    onChange={(e) => setFormOrdem(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Menores números aparecem primeiro na barra de categorias da vitrine.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Slug Opcional
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="calcados-esportivos (gerado automaticamente se vazio)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="catAtivo"
                    checked={formAtivo}
                    onChange={(e) => setFormAtivo(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="catAtivo" className="text-sm font-medium text-gray-800">
                    Categoria Ativa na Vitrine
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Salvar
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
