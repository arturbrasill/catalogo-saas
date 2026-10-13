'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Campaign, CampaignDiscountType, CampaignScope, Category, Product } from '@/types';
import { formatCurrency } from '@/lib/whatsapp';
import {
  Plus,
  Edit2,
  Trash2,
  Flame,
  Loader2,
  AlertCircle,
  X,
  Check,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Tag,
  Percent,
  DollarSign,
  AlertTriangle,
  Layers,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

export default function AdminCampanhasPage() {
  const { token } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<CampaignDiscountType>('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState('');
  const [formScope, setFormScope] = useState<CampaignScope>('all');
  const [formCategoryIds, setFormCategoryIds] = useState<string[]>([]);
  const [formProductIds, setFormProductIds] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);

  // Busca interna no seletor de produtos dentro do modal
  const [productSearchInModal, setProductSearchInModal] = useState('');

  // Modal State (Delete Confirmation)
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper para formatar ISO string para datetime-local (YYYY-MM-DDTHH:mm)
  const toDateTimeLocal = (isoString?: string): string => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => String(n).padStart(2, '0');
      const year = d.getFullYear();
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [camps, cats, prods] = await Promise.all([
        api.getCampaigns().catch(() => []),
        api.getCategories().catch(() => []),
        api.getProducts().catch(() => []),
      ]);
      setCampaigns(camps || []);
      setCategories(cats || []);
      setProducts(prods || []);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao carregar campanhas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenNew = () => {
    setEditingCampaign(null);
    setFormName('');
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setFormStartDate(toDateTimeLocal(now.toISOString()));
    setFormEndDate(toDateTimeLocal(nextWeek.toISOString()));
    setFormDiscountType('percentage');
    setFormDiscountValue('15');
    setFormScope('all');
    setFormCategoryIds([]);
    setFormProductIds([]);
    setFormIsActive(true);
    setProductSearchInModal('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (camp: Campaign) => {
    setEditingCampaign(camp);
    setFormName(camp.name);
    setFormStartDate(toDateTimeLocal(camp.start_date));
    setFormEndDate(toDateTimeLocal(camp.end_date));
    setFormDiscountType(camp.discount_type);
    setFormDiscountValue(String(camp.discount_value));
    setFormScope(camp.scope);
    setFormCategoryIds(Array.isArray(camp.category_ids) ? camp.category_ids : []);
    setFormProductIds(Array.isArray(camp.product_ids) ? camp.product_ids : []);
    setFormIsActive(camp.is_active);
    setProductSearchInModal('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (camp: Campaign) => {
    if (!token) return;
    try {
      const updated = await api.updateCampaign(
        {
          id: camp.id,
          is_active: !camp.is_active,
        },
        token
      );
      setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar status da campanha.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = formName.trim();
    if (!cleanName) {
      setFormError('O nome da campanha é obrigatório.');
      return;
    }

    if (!formStartDate || !formEndDate) {
      setFormError('As datas de início e término são obrigatórias.');
      return;
    }

    const startMs = new Date(formStartDate).getTime();
    const endMs = new Date(formEndDate).getTime();

    if (isNaN(startMs) || isNaN(endMs)) {
      setFormError('Datas inválidas.');
      return;
    }

    if (endMs <= startMs) {
      setFormError('A data de término deve ser posterior à data de início.');
      return;
    }

    const cleanVal = parseFloat(formDiscountValue.replace(',', '.'));
    if (isNaN(cleanVal) || cleanVal <= 0) {
      setFormError('O valor de desconto deve ser um número maior que zero.');
      return;
    }

    if (formDiscountType === 'percentage' && cleanVal > 100) {
      setFormError('O desconto em porcentagem não pode ultrapassar 100%.');
      return;
    }

    if (formScope === 'categories' && formCategoryIds.length === 0) {
      setFormError('Selecione pelo menos uma categoria participante para o escopo.');
      return;
    }

    if (formScope === 'products' && formProductIds.length === 0) {
      setFormError('Selecione pelo menos um produto participante para o escopo.');
      return;
    }

    if (!token) {
      setFormError('Sessão expirada. Faça login novamente.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCampaign) {
        const updated = await api.updateCampaign(
          {
            id: editingCampaign.id,
            name: cleanName,
            start_date: new Date(formStartDate).toISOString(),
            end_date: new Date(formEndDate).toISOString(),
            discount_type: formDiscountType,
            discount_value: cleanVal,
            scope: formScope,
            category_ids: formScope === 'categories' ? formCategoryIds : [],
            product_ids: formScope === 'products' ? formProductIds : [],
            is_active: formIsActive,
          },
          token
        );
        setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setSuccessMessage(`Campanha "${cleanName}" atualizada com sucesso!`);
      } else {
        const created = await api.createCampaign(
          {
            name: cleanName,
            start_date: new Date(formStartDate).toISOString(),
            end_date: new Date(formEndDate).toISOString(),
            discount_type: formDiscountType,
            discount_value: cleanVal,
            scope: formScope,
            category_ids: formScope === 'categories' ? formCategoryIds : [],
            product_ids: formScope === 'products' ? formProductIds : [],
            is_active: formIsActive,
          },
          token
        );
        setCampaigns((prev) => [created, ...prev]);
        setSuccessMessage(`Campanha "${cleanName}" criada com sucesso!`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar campanha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !token) return;
    setIsDeleting(true);
    try {
      await api.deleteCampaign(deleteTarget.id, token);
      setCampaigns((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setSuccessMessage(`Campanha "${deleteTarget.name}" removida com sucesso.`);
      setDeleteTarget(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir campanha.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Status temporal da campanha
  const getCampaignStatus = (camp: Campaign) => {
    if (!camp.is_active) {
      return {
        label: 'Pausada',
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
    }
    const now = Date.now();
    const start = new Date(camp.start_date).getTime();
    const end = new Date(camp.end_date).getTime();

    if (now < start) {
      return {
        label: 'Agendada',
        color: 'bg-sky-50 text-sky-700 border-sky-200',
        dot: 'bg-sky-500',
      };
    }
    if (now > end) {
      return {
        label: 'Encerrada',
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-400',
      };
    }
    return {
      label: 'Ativa Agora',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500 animate-pulse',
    };
  };

  // Filtragem de campanhas por busca
  const filteredCampaigns = useMemo(() => {
    if (!searchTerm.trim()) return campaigns;
    const term = searchTerm.toLowerCase();
    return campaigns.filter((c) => c.name.toLowerCase().includes(term));
  }, [campaigns, searchTerm]);

  // Produtos filtrados dentro do modal
  const modalFilteredProducts = useMemo(() => {
    if (!productSearchInModal.trim()) return products;
    const term = productSearchInModal.toLowerCase();
    return products.filter((p) => p.nome.toLowerCase().includes(term));
  }, [products, productSearchInModal]);

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-600">
                <Flame className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Campanhas & Descontos Temporais
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Crie liquidações e promoções com data e hora marcadas para toda a loja, categorias ou produtos específicos.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Campanha</span>
          </button>
        </div>

        {/* Mensagens de Sucesso ou Erro Geral */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:bg-rose-100 rounded-lg text-rose-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Barra de Busca e Filtro */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar campanha por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 transition shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Listagem de Campanhas */}
        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">Carregando campanhas...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
              <Flame className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {searchTerm ? 'Nenhuma campanha encontrada' : 'Nenhuma campanha cadastrada'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              {searchTerm
                ? 'Tente buscar com outro termo ou limpe o filtro.'
                : 'Crie campanhas temporais de descontos (% ou R$) para datas comemorativas, queima de estoque ou Black Friday.'}
            </p>
            {!searchTerm && (
              <button
                type="button"
                onClick={handleOpenNew}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Primeira Campanha</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCampaigns.map((camp) => {
              const status = getCampaignStatus(camp);
              const startDateObj = new Date(camp.start_date);
              const endDateObj = new Date(camp.end_date);

              return (
                <div
                  key={camp.id}
                  className={`bg-white rounded-2xl border p-5 transition shadow-2xs hover:shadow-md flex flex-col justify-between ${
                    camp.is_active ? 'border-slate-200' : 'border-slate-200/60 opacity-80'
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Cabeçalho do Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${status.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-2 truncate" title={camp.name}>
                          {camp.name}
                        </h3>
                      </div>

                      {/* Desconto em destaque */}
                      <div className="text-right flex-shrink-0">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-sm">
                          {camp.discount_type === 'percentage' ? (
                            <>
                              <Percent className="w-3.5 h-3.5" />
                              <span>{camp.discount_value}% OFF</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>{formatCurrency(camp.discount_value)} OFF</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Escopo de Aplicação */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Layers className="w-3.5 h-3.5" />
                          <span>Escopo:</span>
                        </span>
                        <span className="text-slate-800 font-bold">
                          {camp.scope === 'all'
                            ? 'Toda a Loja'
                            : camp.scope === 'categories'
                            ? `${camp.category_ids?.length || 0} Categorias`
                            : `${camp.product_ids?.length || 0} Produtos`}
                        </span>
                      </div>

                      {/* Período */}
                      <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Início:</span>
                        </span>
                        <span className="font-mono text-slate-700">
                          {startDateObj.toLocaleDateString('pt-BR')} {startDateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Término:</span>
                        </span>
                        <span className="font-mono text-slate-700">
                          {endDateObj.toLocaleDateString('pt-BR')} {endDateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações do Card */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(camp)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                        camp.is_active
                          ? 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'
                          : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {camp.is_active ? 'Pausar' : 'Ativar'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(camp)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                        title="Editar campanha"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(camp)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                        title="Excluir campanha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Criação / Edição de Campanha */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col animate-scale-in">
              {/* Header do Modal */}
              <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 sticky top-0 z-10 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-600">
                    <Flame className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      {editingCampaign ? 'Editar Campanha' : 'Nova Campanha Promocional'}
                    </h2>
                    <p className="text-xs text-slate-500">Configure o período e o desconto</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Formulário */}
              <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-5">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Nome da Campanha */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nome da Campanha *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Liquidação de Inverno, Black Friday, Ofertas da Semana"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5"
                  />
                </div>

                {/* Período: Início e Fim */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Data & Hora de Início *</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Data & Hora de Término *</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 font-mono"
                    />
                  </div>
                </div>

                {/* Tipo de Desconto e Valor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Tipo de Desconto *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormDiscountType('percentage')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          formDiscountType === 'percentage'
                            ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <Percent className="w-3.5 h-3.5" />
                        <span>Porcentagem (%)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormDiscountType('fixed')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          formDiscountType === 'fixed'
                            ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Valor Fixo (R$)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      {formDiscountType === 'percentage' ? 'Valor do Desconto (%) *' : 'Valor do Desconto (R$) *'}
                    </label>
                    <input
                      type="number"
                      step={formDiscountType === 'percentage' ? '1' : '0.01'}
                      min="0.01"
                      max={formDiscountType === 'percentage' ? '100' : undefined}
                      required
                      placeholder={formDiscountType === 'percentage' ? 'Ex: 20' : 'Ex: 15.00'}
                      value={formDiscountValue}
                      onChange={(e) => setFormDiscountValue(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 font-mono"
                    />
                  </div>
                </div>

                {/* Seletor de Escopo */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Onde aplicar o desconto? *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormScope('all')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                        formScope === 'all'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Toda a Loja</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormScope('categories')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                        formScope === 'categories'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>Categorias</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormScope('products')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                        formScope === 'products'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4 text-emerald-600" />
                      <span>Produtos</span>
                    </button>
                  </div>
                </div>

                {/* Seleção de Categorias quando escopo = 'categories' */}
                {formScope === 'categories' && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Selecione as categorias participantes ({formCategoryIds.length} selecionadas):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (formCategoryIds.length === categories.length) {
                            setFormCategoryIds([]);
                          } else {
                            setFormCategoryIds(categories.map((c) => c.id));
                          }
                        }}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline"
                      >
                        {formCategoryIds.length === categories.length ? 'Desmarcar todas' : 'Marcar todas'}
                      </button>
                    </div>

                    <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                      {categories.map((cat) => {
                        const checked = formCategoryIds.includes(cat.id);
                        return (
                          <label
                            key={cat.id}
                            className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium cursor-pointer transition ${
                              checked ? 'bg-white border border-emerald-400 text-slate-900 shadow-2xs' : 'hover:bg-slate-200/50 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormCategoryIds((prev) => [...prev, cat.id]);
                                } else {
                                  setFormCategoryIds((prev) => prev.filter((id) => id !== cat.id));
                                }
                              }}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>{cat.nome}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Seleção de Produtos quando escopo = 'products' */}
                {formScope === 'products' && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Selecione os produtos participantes ({formProductIds.length} selecionados):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (formProductIds.length === products.length) {
                            setFormProductIds([]);
                          } else {
                            setFormProductIds(products.map((p) => p.id));
                          }
                        }}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline"
                      >
                        {formProductIds.length === products.length ? 'Desmarcar todos' : 'Marcar todos'}
                      </button>
                    </div>

                    {/* Busca rápida de produto */}
                    <input
                      type="text"
                      placeholder="Filtrar produto por nome..."
                      value={productSearchInModal}
                      onChange={(e) => setProductSearchInModal(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:border-slate-800"
                    />

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {modalFilteredProducts.map((prod) => {
                        const checked = formProductIds.includes(prod.id);
                        return (
                          <label
                            key={prod.id}
                            className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium cursor-pointer transition ${
                              checked ? 'bg-white border border-emerald-400 text-slate-900 shadow-2xs' : 'hover:bg-slate-200/50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormProductIds((prev) => [...prev, prod.id]);
                                  } else {
                                    setFormProductIds((prev) => prev.filter((id) => id !== prod.id));
                                  }
                                }}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="truncate">{prod.nome}</span>
                            </div>
                            <span className="font-mono text-[11px] text-slate-500 ml-2 flex-shrink-0">
                              {formatCurrency(prod.preco)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Status Ativo */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Campanha Ativa</span>
                    <span className="text-[11px] text-slate-500">
                      Quando ativada, os descontos vigorarão automaticamente dentro do período configurado.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Botões do Rodapé */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{editingCampaign ? 'Salvar Alterações' : 'Criar Campanha'}</span>
                      </>
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
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-in text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Excluir Campanha?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tem certeza que deseja remover a campanha <strong>{deleteTarget.name}</strong>? Os preços voltarão ao normal imediatamente.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Excluir</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
