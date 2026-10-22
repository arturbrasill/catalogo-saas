'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Store,
  CreditCard,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  ExternalLink,
  Plus,
  RefreshCw,
  LogOut,
  TrendingUp,
  Clock,
  Database,
  MessageCircle,
  MoreVertical,
  ChevronRight,
  Eye,
  Settings,
  X,
  Trash2,
  LogIn,
  KeyRound,
  User,
} from 'lucide-react';
import type { Tenant, SaasMetrics, SubscriptionPlan, SubscriptionStatus } from '@/types';

export default function SaasAdminPage() {
  // Autenticação Master
  const [token, setToken] = useState<string | null>(null);
  const [masterPassword, setMasterPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Dados do SaaS
  const [stores, setStores] = useState<Tenant[]>([]);
  const [metrics, setMetrics] = useState<SaasMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'expired' | 'blocked'>('all');

  // Modal de Edição de Loja / Assinatura
  const [editingStore, setEditingStore] = useState<Tenant | null>(null);
  const [editName, setEditName] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editOwnerEmail, setEditOwnerEmail] = useState('');
  const [editAdminUsername, setEditAdminUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPlan, setEditPlan] = useState<SubscriptionPlan>('monthly');
  const [editStatus, setEditStatus] = useState<SubscriptionStatus>('active');
  const [editExpiry, setEditExpiry] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal de Exclusão de Loja
  const [storeToDelete, setStoreToDelete] = useState<Tenant | null>(null);
  const [deletingStore, setDeletingStore] = useState(false);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleLogout = useCallback(() => {
    setToken(null);
    localStorage.removeItem('saas_master_token');
    setStores([]);
    setMetrics(null);
  }, []);

  const loadStores = useCallback(async (authToken = token) => {
    if (!authToken) return;
    setLoading(true);

    try {
      const res = await fetch('/api/saas/stores', {
        headers: {
          'x-saas-token': authToken,
        },
      });

      const json = await res.json();
      if (!json.success) {
        if (res.status === 401) {
          handleLogout();
          return;
        }
        throw new Error(json.error || 'Erro ao carregar lojas.');
      }

      setStores(json.data.stores);
      setMetrics(json.data.metrics);
    } catch {
      showFeedback('Erro ao sincronizar lojas.', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, handleLogout]);

  // Verifica se já possui sessão salva no localStorage ou cookies
  useEffect(() => {
    const saved = localStorage.getItem('saas_master_token');
    if (saved) {
      setToken(saved);
      loadStores(saved);
    }
  }, [loadStores]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);

    try {
      const res = await fetch('/api/saas/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: masterPassword }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Senha incorreta.');
      }

      const authToken = json.data.token;
      setToken(authToken);
      localStorage.setItem('saas_master_token', authToken);
      loadStores(authToken);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Falha ao autenticar.');
    } finally {
      setLoggingIn(false);
    }
  };

  // Ação Rápida: Renovar Assinatura (+30 dias ou +1 ano)
  const handleQuickRenew = async (store: Tenant, days: number) => {
    try {
      const res = await fetch('/api/saas/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-saas-token': token || '',
        },
        body: JSON.stringify({
          tenantId: store.tenantId,
          daysToAdd: days,
          subscriptionStatus: 'active',
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      showFeedback(`Assinatura de "${store.name}" renovada (+${days} dias)!`);
      loadStores();
    } catch (err) {
      showFeedback('Falha ao renovar assinatura: ' + String(err), 'error');
    }
  };

  // Ação Rápida: Bloquear ou Desbloquear Loja
  const handleToggleBlock = async (store: Tenant) => {
    const isCurrentlyBlocked = store.subscriptionStatus === 'blocked';
    const newStatus: SubscriptionStatus = isCurrentlyBlocked ? 'active' : 'blocked';

    try {
      const res = await fetch('/api/saas/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-saas-token': token || '',
        },
        body: JSON.stringify({
          tenantId: store.tenantId,
          subscriptionStatus: newStatus,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      showFeedback(
        isCurrentlyBlocked
          ? `Loja "${store.name}" desbloqueada com sucesso!`
          : `Loja "${store.name}" bloqueada.`
      );
      loadStores();
    } catch (err) {
      showFeedback('Erro ao atualizar status: ' + String(err), 'error');
    }
  };

  // Abre Modal de Edição
  const openEditModal = (store: Tenant) => {
    setEditingStore(store);
    setEditName(store.name || '');
    setEditWhatsapp(store.whatsapp ? String(store.whatsapp) : '');
    setEditOwnerEmail(store.ownerEmail || '');
    setEditAdminUsername(store.adminUsername || store.slug || 'admin');
    setEditPassword('');
    setEditPlan(store.plan || 'monthly');
    setEditStatus(store.subscriptionStatus || 'active');
    setEditExpiry(
      store.subscriptionExpiresAt
        ? new Date(store.subscriptionExpiresAt).toISOString().substring(0, 10)
        : ''
    );
    setEditNotes(store.notes ? store.notes.replace(/<!--STORE_SETTINGS:(.+?)-->/, '').trim() : '');
  };

  // Salva Edição do Modal
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;
    setSavingEdit(true);

    try {
      const expiryIso = editExpiry
        ? new Date(editExpiry + 'T23:59:59.000Z').toISOString()
        : undefined;

      const res = await fetch('/api/saas/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-saas-token': token || '',
        },
        body: JSON.stringify({
          tenantId: editingStore.tenantId,
          name: editName.trim(),
          whatsapp: String(editWhatsapp || '').replace(/\D/g, ''),
          ownerEmail: editOwnerEmail.trim(),
          adminUsername: editAdminUsername.trim() || undefined,
          password: editPassword.trim() || undefined,
          plan: editPlan,
          subscriptionStatus: editStatus,
          subscriptionExpiresAt: expiryIso,
          notes: editNotes,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      showFeedback(`Configurações de "${editName || editingStore.name}" atualizadas com sucesso!`);
      setEditingStore(null);
      loadStores();
    } catch {
      showFeedback('Erro ao salvar alterações.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Exclusão definitiva de Loja
  const handleDeleteStore = async () => {
    if (!storeToDelete) return;
    setDeletingStore(true);
    try {
      const res = await fetch(`/api/saas/stores?tenantId=${encodeURIComponent(storeToDelete.tenantId)}`, {
        method: 'DELETE',
        headers: {
          'x-saas-token': token || '',
        },
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao excluir loja.');
      }

      showFeedback(`Loja "${storeToDelete.name}" excluída definitivamente com sucesso!`);
      setStoreToDelete(null);
      loadStores();
    } catch (err) {
      showFeedback('Erro ao excluir loja: ' + String(err), 'error');
    } finally {
      setDeletingStore(false);
    }
  };

  // Gera cobrança via Asaas (R$ 79,90) com link de fatura
  const handleGenerateAsaasPayment = async (store: Tenant) => {
    try {
      let docToUse = store.cpfCnpj;
      if (!docToUse) {
        const promptDoc = prompt(`A loja "${store.name}" não possui CPF/CNPJ cadastrado. Informe o CPF ou CNPJ para emissão da fatura no Asaas:`);
        if (!promptDoc || !promptDoc.trim()) {
          showFeedback('Operação cancelada: CPF ou CNPJ obrigatório para o Asaas.', 'error');
          return;
        }
        docToUse = promptDoc.trim();
      }

      showFeedback(`Gerando fatura Asaas (R$ 79,90) para "${store.name}"...`);
      const res = await fetch('/api/asaas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: store.tenantId,
          slug: store.slug,
          cpfCnpj: docToUse,
          plan: store.plan === 'yearly' ? 'yearly' : 'monthly',
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      showFeedback(`Fatura Asaas gerada com sucesso para "${store.name}"!`);
      loadStores();

      if (json.data?.invoiceUrl) {
        window.open(json.data.invoiceUrl, '_blank');
      }
    } catch (err) {
      showFeedback('Falha ao gerar cobrança no Asaas: ' + String(err), 'error');
    }
  };

  // Cálculo de dias restantes e formatação de status padronizado
  const getStoreStatusDetails = (store: Tenant) => {
    if (store.subscriptionStatus === 'blocked') {
      return {
        badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200',
        text: 'Inadimplente / Bloqueado',
        daysText: 'Acesso suspenso',
        isCritical: true,
      };
    }

    if (!store.subscriptionExpiresAt) {
      return {
        badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        text: 'Assinante Ativo',
        daysText: 'Sem expiração',
        isCritical: false,
      };
    }

    const expiryTime = new Date(store.subscriptionExpiresAt).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return {
        badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200',
        text: 'Inadimplente / Bloqueado',
        daysText: `Venceu há ${Math.abs(diffDays)} dia(s)`,
        isCritical: true,
      };
    }

    if (store.subscriptionStatus === 'trial' || store.plan === 'trial_30d') {
      return {
        badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
        text: 'Trial Ativo',
        daysText: `Restam ${diffDays} dia(s)`,
        isCritical: diffDays <= 3,
      };
    }

    if (diffDays <= 5) {
      return {
        badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
        text: 'Trial Ativo',
        daysText: `Restam ${diffDays} dia(s)`,
        isCritical: true,
      };
    }

    return {
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      text: 'Assinante Ativo',
      daysText: `Restam ${diffDays} dia(s)`,
      isCritical: false,
    };
  };

  // Filtra e pesquisa lojas
  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const matchesSearch =
        !searchTerm.trim() ||
        store.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(store.whatsapp || '').includes(searchTerm.replace(/\D/g, '')) ||
        store.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'blocked') return store.subscriptionStatus === 'blocked';
      if (statusFilter === 'trial') return store.plan === 'trial_30d' || store.subscriptionStatus === 'trial';
      if (statusFilter === 'expired') {
        if (!store.subscriptionExpiresAt) return false;
        return new Date(store.subscriptionExpiresAt).getTime() <= Date.now();
      }
      if (statusFilter === 'active') {
        if (store.subscriptionStatus === 'blocked') return false;
        if (!store.subscriptionExpiresAt) return true;
        return new Date(store.subscriptionExpiresAt).getTime() > Date.now();
      }

      return true;
    });
  }, [stores, searchTerm, statusFilter]);

  // Se não estiver logado, exibe tela de login do SuperAdmin
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 sm:p-6 py-12 sm:py-16">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center mx-auto mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/favicon.svg"
                alt="NumClick"
                className="w-6 h-6 object-contain"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">NumClick SuperAdmin</h1>
            <p className="text-xs text-slate-500 mt-1">
              Gerencie todos os lojistas, assinaturas e faturamento em tempo real.
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Senha Master de Administrador
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Informe a chave mestre"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loggingIn ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Acessar Painel Master</span>
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center mt-6">
            Dica: A senha padrão inicial é <code className="text-slate-900 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono">master2026</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Header do Painel Master */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-8 flex items-center">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0B0F19] border border-slate-800 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/favicon.svg"
                alt="NumClick"
                className="w-5 h-5 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                  NumClick SuperAdmin
                </span>
                <span className="bg-orange-50 text-orange-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-orange-200">
                  Master
                </span>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:block">
                Gestão Central de Lojistas e Assinaturas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => loadStores()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition cursor-pointer"
              title="Sincronizar lojas com o Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-600' : ''}`} />
              <span className="hidden md:inline">Sincronizar</span>
            </button>

            <Link
              href="/criar-loja"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-xl shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Loja</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer"
              title="Sair do Painel"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Alerta de Feedback Flutuante */}
      {feedbackMsg && (
        <div
          className={`fixed top-16 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-top-2 ${
            feedbackMsg.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Conteúdo Central */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        {/* Banner de Status do Banco de Dados Supabase Oficial (Sólido Escuro #0B0F19) */}
        <div className="p-4 sm:p-5 bg-[#0B0F19] text-slate-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 text-xs border border-slate-800">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0">
              <Database className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-white text-sm tracking-tight">Banco de Dados Oficial Conectado (Supabase)</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  PostgreSQL Ativo
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Todas as lojas, produtos, configurações e pedidos sincronizam de forma 100% automática e instantânea no banco de dados Supabase.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-[11px] text-slate-400">
            <span>SaaS Multi-Tenant</span>
          </div>
        </div>

        {/* Cards de Métricas Globais (KPIs) */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total de Lojas</span>
                <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{metrics.totalStores}</div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Cadastradas na nuvem</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Assinantes</span>
                <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{metrics.activeStores}</div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Pagantes em dia</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Trial Ativo</span>
                <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{metrics.trialStores}</div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Período de 7 dias</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Inadimplentes</span>
                <div className="h-8 w-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{metrics.expiredOrBlockedStores}</div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Vencidas ou bloqueadas</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">MRR Estimado</span>
                <div className="h-8 w-8 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                R$ {metrics.estimatedMonthlyRevenue.toFixed(2).replace('.', ',')}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Receita recorrente / mês</span>
            </div>
          </div>
        )}

        {/* Barra de Filtros e Busca */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por nome da loja, slug, whatsapp ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'active', 'trial', 'expired', 'blocked'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'all' && 'Todas'}
                {st === 'active' && 'Assinantes'}
                {st === 'trial' && 'Trial Ativo'}
                {st === 'expired' && 'Inadimplentes'}
                {st === 'blocked' && 'Bloqueadas'}
              </button>
            ))}
          </div>
        </div>

        {/* Listagem de Lojas (Tenants) */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Visualização Desktop (Tabela) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Loja / Identificador</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">Plano</th>
                  <th className="py-3 px-4">Status & Validade</th>
                  <th className="py-3 px-4">Banco de Dados</th>
                  <th className="py-3 px-4 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStores.map((store) => {
                  const statusInfo = getStoreStatusDetails(store);
                  const isBlocked = store.subscriptionStatus === 'blocked';
                  const waNumber = String(store.whatsapp || '').replace(/\D/g, '');
                  const waBillingMsg = encodeURIComponent(
                    `Olá ${store.name}! Notamos que a assinatura do seu catálogo digital está próxima do vencimento ou pendente. Gostaria de renovar para manter sua loja ativa online?`
                  );

                  return (
                    <tr key={store.tenantId} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Loja / Nome */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{store.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <span>/{store.slug || store.tenantId}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 font-mono flex items-center gap-1 mt-0.5" title="Usuário de acesso ao painel do lojista">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>Login: <strong className="text-slate-800">{store.adminUsername || store.slug || 'admin'}</strong></span>
                        </div>
                      </td>

                      {/* WhatsApp */}
                      <td className="py-3.5 px-4">
                        {waNumber ? (
                          <a
                            href={`https://wa.me/${waNumber}?text=${waBillingMsg}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-600 font-mono text-xs transition-colors"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{String(store.whatsapp || '')}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Plano */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700 block">
                          {store.plan === 'trial_30d' && 'Teste 7 Dias'}
                          {store.plan === 'monthly' && 'Mensal (R$ 79,90)'}
                          {store.plan === 'yearly' && 'Anual (Legado)'}
                          {!store.plan && 'Teste 7 Dias'}
                        </span>
                      </td>

                      {/* Status & Validade */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${statusInfo.badgeClass}`}
                          >
                            {statusInfo.text}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {statusInfo.daysText}
                          </span>
                        </div>
                      </td>

                      {/* Banco de Dados Supabase */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 shadow-2xs">
                          <Database className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Supabase</span>
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Cobrança Asaas */}
                          <button
                            type="button"
                            onClick={() => handleGenerateAsaasPayment(store)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition-colors flex items-center gap-1"
                            title="Gerar Cobrança Asaas (R$ 79,90)"
                          >
                            <CreditCard className="w-3 h-3 text-blue-600" />
                            <span>Asaas</span>
                          </button>

                          {/* Renovar +30 dias */}
                          <button
                            type="button"
                            onClick={() => handleQuickRenew(store, 30)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors"
                            title="Renovar por +30 dias"
                          >
                            +30d
                          </button>

                          {/* Renovar +1 ano */}
                          <button
                            type="button"
                            onClick={() => handleQuickRenew(store, 365)}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 transition-colors"
                            title="Renovar por +1 ano"
                          >
                            +1 ano
                          </button>

                          {/* Bloquear / Desbloquear */}
                          <button
                            type="button"
                            onClick={() => handleToggleBlock(store)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isBlocked
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                            }`}
                            title={isBlocked ? 'Desbloquear loja' : 'Bloquear loja'}
                          >
                            {isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>

                          {/* Ver Catálogo */}
                          <a
                            href={`/${store.slug || store.tenantId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                            title="Visualizar Catálogo"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>

                          {/* Acessar Painel Lojista */}
                          <a
                            href={`/admin/login?tenant=${store.slug || store.tenantId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                            title="Entrar no Painel do Lojista"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                          </a>

                          {/* Editar Assinatura Completa */}
                          <button
                            type="button"
                            onClick={() => openEditModal(store)}
                            className="p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                            title="Editar Assinatura e Dados"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>

                          {/* Excluir Loja Definitivamente */}
                          <button
                            type="button"
                            onClick={() => setStoreToDelete(store)}
                            className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors"
                            title="Excluir Loja Definitivamente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Visualização Mobile (Cards) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {filteredStores.map((store) => {
              const statusInfo = getStoreStatusDetails(store);
              const isBlocked = store.subscriptionStatus === 'blocked';
              const waNumber = String(store.whatsapp || '').replace(/\D/g, '');
              const waBillingMsg = encodeURIComponent(
                `Olá ${store.name}! Sua assinatura do catálogo digital está pendente de renovação.`
              );

              return (
                <div key={store.tenantId} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{store.name}</h4>
                      <p className="text-[11px] font-mono text-slate-400">
                        /{store.slug || store.tenantId}
                      </p>
                      <p className="text-[11px] font-mono text-slate-600 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Login: <strong className="text-slate-800">{store.adminUsername || store.slug || 'admin'}</strong></span>
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusInfo.badgeClass}`}
                    >
                      {statusInfo.text}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Plano:</span>
                      <span className="font-semibold">
                        {store.plan === 'trial_30d' && 'Teste 7d'}
                        {store.plan === 'monthly' && 'Mensal (R$ 79,90)'}
                        {store.plan === 'yearly' && 'Anual (Legado)'}
                        {!store.plan && 'Teste 7d'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Validade:</span>
                      <span className="font-semibold">{statusInfo.daysText}</span>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/70">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Supabase PostgreSQL</span>
                  </div>

                  {/* Ações Mobile */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleGenerateAsaasPayment(store)}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200"
                        title="Fatura Asaas"
                      >
                        Asaas
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickRenew(store, 30)}
                        className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200"
                      >
                        +30d
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleBlock(store)}
                        className={`p-1.5 rounded-lg border text-xs ${
                          isBlocked
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {waNumber && (
                        <a
                          href={`https://wa.me/${waNumber}?text=${waBillingMsg}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <a
                        href={`/${store.slug || store.tenantId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200"
                        title="Ver Catálogo"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`/admin/login?tenant=${store.slug || store.tenantId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200"
                        title="Entrar no Painel do Lojista"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => openEditModal(store)}
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200"
                        title="Editar Assinatura e Dados"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setStoreToDelete(store)}
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200"
                        title="Excluir Loja"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredStores.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-sm">
              Nenhuma loja encontrada com os filtros atuais.
            </div>
          )}
        </div>
      </main>

      {/* Modal de Edição de Loja / Assinatura */}
      {editingStore && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-semibold text-slate-900 tracking-tight text-base">
                  Editar Loja: {editingStore.name}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {editingStore.tenantId}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingStore(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome da Loja
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    placeholder="Ex: Minha Loja Digital"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp de Atendimento (com DDD)
                  </label>
                  <input
                    type="text"
                    required
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-mono"
                    placeholder="Ex: 5511999999999"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail do Proprietário / Lojista (Opcional)
                </label>
                <input
                  type="email"
                  value={editOwnerEmail}
                  onChange={(e) => setEditOwnerEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  placeholder="Ex: contato@lojista.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plano de Acesso
                  </label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value as SubscriptionPlan)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="trial_30d">Teste 7 Dias Grátis</option>
                    <option value="monthly">Plano Mensal (R$ 79,90)</option>
                    {editPlan === 'yearly' && (
                      <option value="yearly">Anual (Legado - R$ 99,90/mês)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status da Assinatura
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as SubscriptionStatus)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="active">Assinante Ativo</option>
                    <option value="trial">Trial Ativo (7d)</option>
                    <option value="expired">Inadimplente / Vencida</option>
                    <option value="blocked">Inadimplente / Bloqueada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data de Validade (Expiração)
                </label>
                <input
                  type="date"
                  value={editExpiry}
                  onChange={(e) => setEditExpiry(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Usuário de Login (Lojista)</span>
                  </label>
                  <input
                    type="text"
                    value={editAdminUsername}
                    onChange={(e) => setEditAdminUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-mono"
                    placeholder="Ex: admin ou essenza"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Usado para entrar no painel /admin/login
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                    <span>Redefinir Senha</span>
                  </label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-mono"
                    placeholder="Nova senha (vazio p/ manter)"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Deixe em branco para não alterar
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Anotações Internas do SaaS
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Pagamento confirmado via Pix, cliente solicitou desconto anual..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStore(null)}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Loja */}
      {storeToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Excluir Loja Definitivamente</h3>
                <p className="text-xs text-slate-500">Ação irreversível de administrador</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Você tem certeza que deseja excluir a loja{' '}
              <strong className="text-slate-900 font-semibold">{storeToDelete.name}</strong> (
              <span className="font-mono text-xs text-slate-500">/{storeToDelete.slug || storeToDelete.tenantId}</span>)?
            </p>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl mb-5 text-xs text-rose-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                Atenção aos dados que serão removidos:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-rose-700 pl-1">
                <li>Todos os produtos, variações e preços cadastrados</li>
                <li>Todas as categorias e cupons da loja</li>
                <li>Configurações visuais, horários e chave PIX</li>
                <li>Registro do tenant no Supabase e URLs de vitrine</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={deletingStore}
                onClick={() => setStoreToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingStore}
                onClick={handleDeleteStore}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {deletingStore ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Excluindo Loja...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sim, Excluir Loja</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-400">
        NumClick SuperAdmin SaaS • Plataforma Cloud
      </footer>
    </div>
  );
}
