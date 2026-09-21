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
  FileSpreadsheet,
  MessageCircle,
  MoreVertical,
  ChevronRight,
  Eye,
  Settings,
  X,
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
  const [masterSheetUrl, setMasterSheetUrl] = useState<string | null>(null);
  const [hasGoogleProvisioner, setHasGoogleProvisioner] = useState(false);
  const [showProvisionerModal, setShowProvisionerModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'expired' | 'blocked'>('all');

  // Modal de Edição de Loja / Assinatura
  const [editingStore, setEditingStore] = useState<Tenant | null>(null);
  const [editPlan, setEditPlan] = useState<SubscriptionPlan>('monthly');
  const [editStatus, setEditStatus] = useState<SubscriptionStatus>('active');
  const [editExpiry, setEditExpiry] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleLogout = useCallback(() => {
    setToken(null);
    localStorage.removeItem('saas_master_token');
    setStores([]);
    setMetrics(null);
    setMasterSheetUrl(null);
    setHasGoogleProvisioner(false);
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
      if (json.data.masterSheetUrl) {
        setMasterSheetUrl(json.data.masterSheetUrl);
      }
      if (typeof json.data.hasGoogleProvisioner === 'boolean') {
        setHasGoogleProvisioner(json.data.hasGoogleProvisioner);
      }
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
    setEditPlan(store.plan || 'monthly');
    setEditStatus(store.subscriptionStatus || 'active');
    setEditExpiry(
      store.subscriptionExpiresAt
        ? new Date(store.subscriptionExpiresAt).toISOString().substring(0, 10)
        : ''
    );
    setEditNotes(store.notes || '');
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
          plan: editPlan,
          subscriptionStatus: editStatus,
          subscriptionExpiresAt: expiryIso,
          notes: editNotes,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      showFeedback(`Configurações de "${editingStore.name}" atualizadas!`);
      setEditingStore(null);
      loadStores();
    } catch {
      showFeedback('Erro ao salvar alterações.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Gera cobrança via Asaas (R$ 129,90) com link de fatura
  const handleGenerateAsaasPayment = async (store: Tenant) => {
    try {
      showFeedback(`Gerando fatura Asaas (R$ 129,90) para "${store.name}"...`);
      const res = await fetch('/api/asaas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: store.tenantId }),
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

  // Cálculo de dias restantes e formatação de status
  const getStoreStatusDetails = (store: Tenant) => {
    if (store.subscriptionStatus === 'blocked') {
      return {
        badgeClass: 'bg-slate-200 text-slate-700 border-slate-300',
        text: 'Bloqueada',
        daysText: 'Acesso suspenso',
        isCritical: true,
      };
    }

    if (!store.subscriptionExpiresAt) {
      return {
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        text: 'Ativa Vitalícia',
        daysText: 'Sem expiração',
        isCritical: false,
      };
    }

    const expiryTime = new Date(store.subscriptionExpiresAt).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return {
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        text: 'Vencida',
        daysText: `Venceu há ${Math.abs(diffDays)} dia(s)`,
        isCritical: true,
      };
    }

    if (store.subscriptionStatus === 'trial' || store.plan === 'trial_30d') {
      return {
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        text: 'Teste (30d)',
        daysText: `Restam ${diffDays} dia(s)`,
        isCritical: diffDays <= 3,
      };
    }

    if (diffDays <= 5) {
      return {
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        text: 'Vencendo',
        daysText: `Restam ${diffDays} dia(s)`,
        isCritical: true,
      };
    }

    return {
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      text: 'Ativa',
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
        store.whatsapp?.includes(searchTerm.replace(/\D/g, '')) ||
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
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Painel Master SaaS</h1>
            <p className="text-xs text-slate-400 mt-1">
              Gerencie todos os lojistas, assinaturas e faturamento em tempo real.
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loggingIn ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Acessar Painel Master</span>
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center mt-6">
            Dica: A senha padrão inicial é <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded">master2026</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Header do Painel Master */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 sm:px-6 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
                  SuperAdmin SaaS
                </span>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200/60">
                  Online
                </span>
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:block">
                Gestão Central de Lojistas e Assinaturas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {masterSheetUrl && (
              <a
                href={masterSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-bold text-xs rounded-xl shadow-2xs transition"
                title="Abrir Planilha Mestre de Controle no Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Planilha Mestre</span>
                <ExternalLink className="w-3 h-3 text-emerald-500" />
              </a>
            )}

            <button
              type="button"
              onClick={() => loadStores()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="Sincronizar lojas com a nuvem (Google Sheets e KV)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden md:inline">Sincronizar Nuvem</span>
            </button>

            <Link
              href="/criar-loja"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Loja</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Banner de Status da Automação Google Drive & Planilha Mestre */}
        {hasGoogleProvisioner ? (
          <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <div>
                <span className="font-bold">Google Master Provisioner Conectado:</span>
                <span className="text-emerald-800 ml-1">
                  Cada nova loja cria automaticamente uma planilha privada no seu Google Drive com acesso exclusivo seu.
                </span>
              </div>
            </div>
            {masterSheetUrl && (
              <a
                href={masterSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs whitespace-nowrap self-start sm:self-auto"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Abrir Planilha Mestre no Drive</span>
                <ExternalLink className="w-3 h-3 text-emerald-500" />
              </a>
            )}
          </div>
        ) : (
          <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 text-xs shadow-md border border-slate-800">
            <div className="flex items-start sm:items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Criação Automática de Planilhas Privadas no seu Google Drive</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Conecte o script <code className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-emerald-300">backend/MasterProvisioner.gs</code> para que toda loja criada gere uma planilha privada real onde apenas você tem acesso.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowProvisionerModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 rounded-xl font-black whitespace-nowrap self-start sm:self-auto transition cursor-pointer shadow-sm"
            >
              Ver Como Ativar (2 min)
            </button>
          </div>
        )}

        {/* Cards de Métricas (KPIs) */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total de Lojas</span>
                <Store className="w-4 h-4 text-slate-600" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">{metrics.totalStores}</div>
              <span className="text-[10px] text-slate-400">Cadastradas na nuvem</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Lojas Ativas</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-600">{metrics.activeStores}</div>
              <span className="text-[10px] text-slate-400">Pagantes em dia</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Em Teste</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-blue-600">{metrics.trialStores}</div>
              <span className="text-[10px] text-slate-400">Período de avaliação</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Vencidas/Bloq</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-rose-600">{metrics.expiredOrBlockedStores}</div>
              <span className="text-[10px] text-slate-400">Necessitam renovação</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">MRR Estimado</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                R$ {metrics.estimatedMonthlyRevenue.toFixed(2).replace('.', ',')}
              </div>
              <span className="text-[10px] text-slate-400">Receita recorrente / mês</span>
            </div>
          </div>
        )}

        {/* Barra de Filtros e Busca */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por nome da loja, slug, whatsapp ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'active', 'trial', 'expired', 'blocked'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'all' && 'Todas'}
                {st === 'active' && 'Ativas'}
                {st === 'trial' && 'Em Teste'}
                {st === 'expired' && 'Vencidas'}
                {st === 'blocked' && 'Bloqueadas'}
              </button>
            ))}
          </div>
        </div>

        {/* Listagem de Lojas */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Visualização Desktop (Tabela) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Loja / Identificador</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">Plano</th>
                  <th className="py-3 px-4">Status & Validade</th>
                  <th className="py-3 px-4">Planilha Sheets</th>
                  <th className="py-3 px-4 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStores.map((store) => {
                  const statusInfo = getStoreStatusDetails(store);
                  const isBlocked = store.subscriptionStatus === 'blocked';
                  const waNumber = store.whatsapp?.replace(/\D/g, '') || '';
                  const waBillingMsg = encodeURIComponent(
                    `Olá ${store.name}! Notamos que a assinatura do seu catálogo digital está próxima do vencimento ou pendente. Gostaria de renovar para manter sua loja ativa online?`
                  );

                  return (
                    <tr key={store.tenantId} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Loja / Nome */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{store.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <span>?tenant={store.slug || store.tenantId}</span>
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
                            <span>{store.whatsapp}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Plano */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700 block">
                          {store.plan === 'trial_30d' && 'Teste 30 Dias'}
                          {store.plan === 'monthly' && 'Mensal (R$ 129,90)'}
                          {store.plan === 'yearly' && 'Anual (R$ 99,90/mês)'}
                          {!store.plan && 'Teste 30 Dias'}
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

                      {/* Planilha Google Sheets */}
                      <td className="py-3.5 px-4">
                        {store.spreadsheetUrl ? (
                          <a
                            href={store.spreadsheetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold text-xs hover:underline"
                            title="Abrir Planilha Google Sheets"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            <span>Abrir Planilha</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono">Em nuvem local</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Cobrança Asaas */}
                          <button
                            type="button"
                            onClick={() => handleGenerateAsaasPayment(store)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition-colors flex items-center gap-1"
                            title="Gerar Cobrança Asaas (R$ 129,90)"
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
                            href={`/?tenant=${store.slug || store.tenantId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                            title="Visualizar Catálogo"
                          >
                            <Eye className="w-3.5 h-3.5" />
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
              const waNumber = store.whatsapp?.replace(/\D/g, '') || '';
              const waBillingMsg = encodeURIComponent(
                `Olá ${store.name}! Sua assinatura do catálogo digital está pendente de renovação.`
              );

              return (
                <div key={store.tenantId} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{store.name}</h4>
                      <p className="text-[11px] font-mono text-slate-400">
                        ?tenant={store.slug || store.tenantId}
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
                        {store.plan === 'trial_30d' && 'Teste 30d'}
                        {store.plan === 'monthly' && 'Mensal (R$ 129,90)'}
                        {store.plan === 'yearly' && 'Anual (R$ 99,90)'}
                        {!store.plan && 'Teste 30d'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Validade:</span>
                      <span className="font-semibold">{statusInfo.daysText}</span>
                    </div>
                  </div>

                  {store.spreadsheetUrl && (
                    <a
                      href={store.spreadsheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Planilha Google Sheets</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}

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
                        href={`/?tenant=${store.slug || store.tenantId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => openEditModal(store)}
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200"
                      >
                        <Settings className="w-3.5 h-3.5" />
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plano de Acesso
                  </label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value as SubscriptionPlan)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="trial_30d">Teste 30 Dias Grátis</option>
                    <option value="monthly">Mensal (R$ 129,90)</option>
                    <option value="yearly">Anual (R$ 99,90/mês — R$ 1.198,80/ano)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status da Assinatura
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as SubscriptionStatus)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="active">Ativa</option>
                    <option value="trial">Em Teste (Trial)</option>
                    <option value="expired">Expirada</option>
                    <option value="blocked">Bloqueada</option>
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
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
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
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStore(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Instruções do Google Master Provisioner */}
      {showProvisionerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Automação de Planilhas Privadas no Google Drive
                  </h3>
                  <p className="text-xs text-slate-500">
                    Criação 100% automática com acesso exclusivo seu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProvisionerModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600">
              <p>
                Para que cada lojista que se cadastrar em <strong className="text-slate-800">/criar-loja</strong> tenha uma planilha Google Sheets real criada automaticamente na <strong>sua conta Google</strong> dentro de uma pasta privada:
              </p>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-800 block">Criar Script no Google Apps Script:</strong>
                    <span>Acesse <a href="https://script.google.com/home" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-bold">script.google.com</a>, clique em <em>Novo Projeto</em> e renomeie para &quot;SaaS Master Provisioner&quot;.</span>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-800 block">Copiar o código pronto:</strong>
                    <span>Substitua o código pelo arquivo <code className="bg-white px-1.5 py-0.5 rounded border font-mono text-emerald-700">backend/MasterProvisioner.gs</code> que já preparamos no projeto.</span>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-800 block">Implantar como Web App:</strong>
                    <span>Clique em <em>Implantar &gt; Nova implantação &gt; App da Web</em>. Em &quot;Executar como&quot; selecione <strong>Eu</strong> e em &quot;Quem pode acessar&quot; selecione <strong>Qualquer pessoa</strong>.</span>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                    4
                  </span>
                  <div>
                    <strong className="text-slate-800 block">Configurar URL no Vercel / .env:</strong>
                    <span>Copie a URL do Web App gerada e cole na variável de ambiente:</span>
                    <pre className="mt-1.5 p-2 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto">
                      GOOGLE_MASTER_PROVISIONER_URL=https://script.google.com/macros/s/.../exec
                    </pre>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>Privacidade Garantida:</strong> As planilhas das lojas são criadas dentro da pasta <em>&quot;SaaS - Planilhas das Lojas&quot;</em> no seu Google Drive pessoal. Ninguém além de você tem acesso aos arquivos.
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowProvisionerModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Entendi, Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-400">
        Painel Master SaaS Multi-Tenant • Plataforma Cloud
      </footer>
    </div>
  );
}
