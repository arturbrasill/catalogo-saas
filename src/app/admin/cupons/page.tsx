'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Coupon, CouponType } from '@/types';
import { formatCurrency } from '@/lib/whatsapp';
import {
  Plus,
  Edit2,
  Trash2,
  TicketPercent,
  Loader2,
  AlertCircle,
  X,
  Check,
  Search,
  Copy,
  Calendar,
  CheckCircle2,
  XCircle,
  Tag,
  Percent,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

export default function AdminCuponsPage() {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formCodigo, setFormCodigo] = useState('');
  const [formTipo, setFormTipo] = useState<CouponType>('percentage');
  const [formValor, setFormValor] = useState('');
  const [formValorMinimo, setFormValorMinimo] = useState('');
  const [formValidade, setFormValidade] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formAtivo, setFormAtivo] = useState(true);

  // Modal State (Delete Confirmation)
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCoupons = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getCoupons();
      setCoupons(data || []);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao carregar cupons.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleOpenNew = () => {
    setEditingCoupon(null);
    setFormCodigo('');
    setFormTipo('percentage');
    setFormValor('10');
    setFormValorMinimo('');
    setFormValidade('');
    setFormDescricao('');
    setFormAtivo(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormCodigo(coupon.codigo);
    setFormTipo(coupon.tipo);
    setFormValor(String(coupon.valor));
    setFormValorMinimo(coupon.valorMinimo ? String(coupon.valorMinimo) : '');
    setFormValidade(coupon.validade ? coupon.validade.substring(0, 10) : '');
    setFormDescricao(coupon.descricao || '');
    setFormAtivo(coupon.ativo);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCopyCode = (codigo: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(codigo);
      setCopiedCode(codigo);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    if (!token) return;
    try {
      const updated = await api.updateCoupon(
        {
          id: coupon.id,
          ativo: !coupon.ativo,
        },
        token
      );
      setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar status do cupom.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setFormError(null);
    const cleanCode = formCodigo.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode || cleanCode.length < 2) {
      setFormError('O código do cupom deve ter pelo menos 2 caracteres.');
      return;
    }

    const valorNum = parseFloat(formValor.replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) {
      setFormError('Informe um valor de desconto válido e maior que zero.');
      return;
    }

    if (formTipo === 'percentage' && valorNum > 100) {
      setFormError('A porcentagem de desconto não pode ser maior que 100%.');
      return;
    }

    let valorMinimoNum: number | undefined = undefined;
    if (formValorMinimo.trim()) {
      valorMinimoNum = parseFloat(formValorMinimo.replace(',', '.'));
      if (isNaN(valorMinimoNum) || valorMinimoNum < 0) {
        setFormError('Informe um valor mínimo do pedido válido.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (editingCoupon) {
        const updated = await api.updateCoupon(
          {
            id: editingCoupon.id,
            codigo: cleanCode,
            tipo: formTipo,
            valor: valorNum,
            valorMinimo: valorMinimoNum,
            validade: formValidade.trim() || undefined,
            descricao: formDescricao.trim() || undefined,
            ativo: formAtivo,
          },
          token
        );
        setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await api.createCoupon(
          {
            codigo: cleanCode,
            tipo: formTipo,
            valor: valorNum,
            valorMinimo: valorMinimoNum,
            validade: formValidade.trim() || undefined,
            descricao: formDescricao.trim() || undefined,
            ativo: formAtivo,
          },
          token
        );
        setCoupons((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar cupom.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !token) return;
    setIsDeleting(true);
    try {
      await api.deleteCoupon(deleteTarget.id, token);
      setCoupons((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir cupom.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCoupons = useMemo(() => {
    if (!searchTerm.trim()) return coupons;
    const term = searchTerm.toLowerCase();
    return coupons.filter(
      (c) =>
        c.codigo.toLowerCase().includes(term) ||
        (c.descricao && c.descricao.toLowerCase().includes(term))
    );
  }, [coupons, searchTerm]);

  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => c.ativo).length;
    const percentage = coupons.filter((c) => c.tipo === 'percentage').length;
    const fixed = coupons.filter((c) => c.tipo === 'fixed').length;
    return { total, active, percentage, fixed };
  }, [coupons]);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 text-slate-900">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TicketPercent className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Cupons de Desconto</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Crie cupons promocionais (em % ou R$) para seus clientes aplicarem na sacola e fecharem mais pedidos.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cupom</span>
          </button>
        </div>

        {/* Métricas / Visão Geral */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total de Cupons
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.total}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">
              Cupons Ativos
            </span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats.active}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Em Porcentagem (%)
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.percentage}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Valor Fixo (R$)
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.fixed}</span>
          </div>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por código ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
            />
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Exibindo <strong>{filteredCoupons.length}</strong> de {coupons.length} cupons
          </span>
        </div>

        {/* Estado de Erro de Carregamento */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={loadCoupons}
              className="underline font-bold hover:text-rose-900"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Listagem de Cupons */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500">Carregando cupons da loja...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs space-y-3">
            <div className="h-16 w-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Tag className="w-8 h-8 stroke-1 text-slate-300" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {searchTerm ? 'Nenhum cupom encontrado' : 'Nenhum cupom cadastrado'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm
                ? 'Tente pesquisar com outro termo ou limpe o campo de busca.'
                : 'Crie seu primeiro cupom de desconto para incentivar novos clientes a comprarem no seu catálogo.'}
            </p>
            {!searchTerm && (
              <button
                type="button"
                onClick={handleOpenNew}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Cupom
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Código</th>
                    <th className="py-3.5 px-4">Desconto</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Regras</th>
                    <th className="py-3.5 px-4 hidden lg:table-cell">Validade</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCoupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-slate-50/60 transition">
                      {/* Código com botão copiar */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs sm:text-sm text-slate-900 bg-slate-100 px-2 py-1 rounded-md border border-slate-200/80">
                            {coupon.codigo}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(coupon.codigo)}
                            className="text-slate-400 hover:text-emerald-600 p-1 rounded-md hover:bg-slate-100 transition cursor-pointer"
                            title="Copiar código"
                          >
                            {copiedCode === coupon.codigo ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {coupon.descricao && (
                          <span className="text-[11px] text-slate-400 block mt-0.5 max-w-xs truncate">
                            {coupon.descricao}
                          </span>
                        )}
                      </td>

                      {/* Desconto */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full ${
                            coupon.tipo === 'percentage'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {coupon.tipo === 'percentage' ? (
                            <>
                              <Percent className="w-3 h-3" />
                              {coupon.valor}% OFF
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-3 h-3" />
                              {formatCurrency(coupon.valor)} OFF
                            </>
                          )}
                        </span>
                      </td>

                      {/* Regras (Valor mínimo) */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        {coupon.valorMinimo ? (
                          <span className="text-slate-600 font-medium">
                            Mínimo de {formatCurrency(coupon.valorMinimo)}
                          </span>
                        ) : (
                          <span className="text-slate-400">Sem pedido mínimo</span>
                        )}
                      </td>

                      {/* Validade */}
                      <td className="py-3.5 px-4 hidden lg:table-cell text-slate-500">
                        {coupon.validade ? (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(coupon.validade).toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-slate-400">Sem expiração</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(coupon)}
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md transition cursor-pointer ${
                            coupon.ativo
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                          }`}
                          title="Clique para alternar o status"
                        >
                          {coupon.ativo ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Inativo
                            </>
                          )}
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(coupon)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Editar cupom"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(coupon)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Excluir cupom"
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

        {/* Modal de Criação / Edição */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-scale-in">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <TicketPercent className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingCoupon ? 'Editar Cupom' : 'Novo Cupom de Desconto'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Código do Cupom */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Código do Cupom *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PROMO10, BEMVINDO, BLACKFRIDAY"
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    className="w-full px-3 py-2 text-xs font-mono uppercase font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Sem espaços. Será o código digitado pelo cliente na sacola.
                  </span>
                </div>

                {/* Tipo de Desconto */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Tipo de Desconto *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormTipo('percentage')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        formTipo === 'percentage'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Porcentagem (%)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormTipo('fixed')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        formTipo === 'fixed'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Valor Fixo (R$)</span>
                    </button>
                  </div>
                </div>

                {/* Valor do Desconto */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Valor do Desconto {formTipo === 'percentage' ? '(em %)' : '(em R$)'} *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={formTipo === 'percentage' ? 100 : 100000}
                      required
                      placeholder={formTipo === 'percentage' ? 'Ex: 10 (para 10%)' : 'Ex: 20.00 (para R$ 20)'}
                      value={formValor}
                      onChange={(e) => setFormValor(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Valor Mínimo do Pedido (Opcional) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Valor Mínimo do Pedido (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 50.00 (deixe em branco se não houver mínimo)"
                    value={formValorMinimo}
                    onChange={(e) => setFormValorMinimo(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    O cupom só será ativado se a soma dos produtos atingir este valor.
                  </span>
                </div>

                {/* Data de Validade (Opcional) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Data de Expiração (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formValidade}
                    onChange={(e) => setFormValidade(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>

                {/* Descrição / Anotação Interna */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Descrição / Regra (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Boas-vindas para primeira compra"
                    value={formDescricao}
                    onChange={(e) => setFormDescricao(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>

                {/* Ativo */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="formAtivo"
                    checked={formAtivo}
                    onChange={(e) => setFormAtivo(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="formAtivo" className="text-xs font-semibold text-slate-800 cursor-pointer">
                    Cupom Ativo (liberado para uso imediato no catálogo)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingCoupon ? 'Atualizar Cupom' : 'Salvar Cupom'}</span>
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
                <h3 className="text-base font-bold text-slate-900">Excluir Cupom</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tem certeza que deseja excluir o cupom{' '}
                  <strong className="font-mono text-slate-800">{deleteTarget.codigo}</strong>? Clientes não
                  poderão mais aplicá-lo.
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
                  onClick={handleDelete}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
