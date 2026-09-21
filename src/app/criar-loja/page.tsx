'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Store,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Copy,
  ArrowRight,
  Lock,
  Phone,
  FileSpreadsheet,
  Palette,
  ShieldCheck,
  Zap,
  Globe,
} from 'lucide-react';
import type { SubscriptionPlan } from '@/types';

const COLOR_PRESETS = [
  { name: 'Esmeralda', primary: '#10b981', secondary: '#047857', bg: '#f8fafc' },
  { name: 'Índigo', primary: '#6366f1', secondary: '#4338ca', bg: '#f8fafc' },
  { name: 'Terracota', primary: '#ea580c', secondary: '#c2410c', bg: '#fffaf8' },
  { name: 'Rose', primary: '#e11d48', secondary: '#be123c', bg: '#fff5f7' },
  { name: 'Dark Luxe', primary: '#0f172a', secondary: '#334155', bg: '#f8fafc' },
];

const NICHES = [
  'Roupas e Moda',
  'Calçados & Acessórios',
  'Restaurante, Doceria & Delivery',
  'Cosméticos & Beleza',
  'Eletrônicos & Celulares',
  'Artesanato & Presentes',
  'Outro',
];

export default function CriarLojaPage() {
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [niche, setNiche] = useState(NICHES[0]);
  const [plan, setPlan] = useState<SubscriptionPlan>('trial_7d');
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]!);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Resultado após criação
  const [createdData, setCreatedData] = useState<{
    tenant: any;
    spreadsheetUrl: string;
    catalogUrl: string;
    adminUrl: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Auto-gera slug baseado no nome da loja
  const handleNameChange = (val: string) => {
    setStoreName(val);
    const autoSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(autoSlug);
  };

  // Formata telefone (WhatsApp) com máscara brasileira
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').substring(0, 11);
    if (raw.length <= 2) {
      setWhatsapp(raw);
    } else if (raw.length <= 7) {
      setWhatsapp(`(${raw.substring(0, 2)}) ${raw.substring(2)}`);
    } else {
      setWhatsapp(`(${raw.substring(0, 2)}) ${raw.substring(2, 7)}-${raw.substring(7)}`);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!storeName.trim()) {
      setError('Por favor, informe o nome da sua loja.');
      return;
    }

    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Por favor, informe um WhatsApp válido com DDD (ex: 11 99999-9999).');
      return;
    }

    if (!password || password.length < 6) {
      setError('A senha do painel admin deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setLoadingStep(1);

    try {
      // Simulação visual de progresso dos passos de auto-provisionamento
      setTimeout(() => setLoadingStep(2), 700);
      setTimeout(() => setLoadingStep(3), 1400);

      const res = await fetch('/api/saas/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: storeName,
          slug,
          whatsapp: cleanPhone,
          ownerEmail,
          password,
          niche,
          plan,
          primaryColor: selectedColor.primary,
          secondaryColor: selectedColor.secondary,
          backgroundColor: selectedColor.bg,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Falha ao criar loja.');
      }

      setCreatedData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar loja.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Header Minimalista */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 py-3.5 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
              C
            </div>
            <div className="leading-tight">
              <span className="font-bold text-slate-900 tracking-tight text-sm sm:text-base">
                Catálogo SaaS
              </span>
              <span className="text-[10px] text-slate-500 block">Plataforma Multi-Tenant</span>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/saas-admin"
              className="text-slate-600 hover:text-slate-900 font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Painel Master
            </Link>
            <Link
              href="/admin/login"
              className="bg-slate-900 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs"
            >
              Entrar na Loja
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12">
        {!createdData ? (
          <div>
            {/* Título e Apresentação */}
            <div className="text-center mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-emerald-200/60">
                <Sparkles className="w-3.5 h-3.5" />
                Crie seu catálogo em 1 minuto
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Abra sua Loja Digital Agora
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                Tudo configurado automaticamente na nuvem: catálogo, painel admin e integração com Google Sheets.
              </p>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Formulário de Criação */}
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-8 space-y-6"
            >
              {/* Seção 1: Dados da Loja */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-slate-600" />
                  1. Dados da Loja
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nome da Loja *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Bella Boutique"
                      value={storeName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nicho de Atuação
                    </label>
                    <select
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    >
                      {NICHES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Link do Catálogo (Slug)
                  </label>
                  <div className="flex items-center text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-500">
                    <Globe className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                    <span className="opacity-70">seucatalogo.com/?tenant=</span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="flex-1 bg-transparent font-semibold text-slate-900 focus:outline-none ml-0.5"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Contato e Senha Admin */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-slate-600" />
                  2. Acesso e Contato
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>WhatsApp da Loja *</span>
                      <span className="text-[10px] text-slate-400 font-normal">Para receber pedidos</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="(11) 99999-9999"
                        value={whatsapp}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Senha do Painel Admin *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    E-mail do Responsável (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Seção 3: Identidade Visual Inicial */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-slate-600" />
                  3. Tema Inicial
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setSelectedColor(preset)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                        selectedColor.name === preset.name
                          ? 'border-slate-900 ring-2 ring-slate-900/10 bg-slate-50 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-4 h-4 rounded-full shadow-xs"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <span
                          className="w-3 h-3 rounded-full opacity-70"
                          style={{ backgroundColor: preset.secondary }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-800 truncate">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seção 4: Escolha do Plano */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-slate-600" />
                  4. Plano de Acesso
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Teste Grátis */}
                  <label
                    className={`relative p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      plan === 'trial_7d'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value="trial_7d"
                      checked={plan === 'trial_7d'}
                      onChange={() => setPlan('trial_7d')}
                      className="sr-only"
                    />
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          Recomendado
                        </span>
                        {plan === 'trial_7d' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">Teste 7 Dias</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Sem cartão de crédito</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/60 font-extrabold text-sm text-slate-900">
                      Grátis
                    </div>
                  </label>

                  {/* Mensal */}
                  <label
                    className={`relative p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      plan === 'monthly'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value="monthly"
                      checked={plan === 'monthly'}
                      onChange={() => setPlan('monthly')}
                      className="sr-only"
                    />
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-600">Mensal</span>
                        {plan === 'monthly' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">Plano Pro</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Pagamento a cada 30 dias</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/60 font-extrabold text-sm text-slate-900">
                      R$ 49,90 <span className="text-[10px] font-normal text-slate-500">/mês</span>
                    </div>
                  </label>

                  {/* Anual */}
                  <label
                    className={`relative p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      plan === 'annual'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value="annual"
                      checked={plan === 'annual'}
                      onChange={() => setPlan('annual')}
                      className="sr-only"
                    />
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
                          2 Meses OFF
                        </span>
                        {plan === 'annual' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">Plano Anual</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Acesso garantido por 1 ano</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/60 font-extrabold text-sm text-slate-900">
                      R$ 499,00 <span className="text-[10px] font-normal text-slate-500">/ano</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Botão de Submissão com Estado de Loading */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>
                        {loadingStep === 1 && 'Criando loja e credenciais...'}
                        {loadingStep === 2 && 'Provisionando Google Sheets...'}
                        {loadingStep === 3 && 'Finalizando catálogo...'}
                      </span>
                    </div>
                  ) : (
                    <>
                      <span>Criar Meu Catálogo Agora</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-slate-400 mt-3 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Seus dados e produtos ficam 100% seguros na nuvem e integrados à sua planilha.
                </p>
              </div>
            </form>
          </div>
        ) : (
          /* Tela de Sucesso Completa com Credenciais e Links */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6 text-center animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Sua Loja Foi Criada com Sucesso!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                O catálogo de <strong>{createdData.tenant.name}</strong> e as tabelas do Google Sheets já estão online e prontos para uso.
              </p>
            </div>

            {/* Caixa de Links Importantes */}
            <div className="space-y-3.5 text-left bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200/70">
              {/* Link do Catálogo */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  1. Link Público do seu Catálogo (Compartilhe com seus clientes)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 truncate">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}${createdData.catalogUrl}`
                      : createdData.catalogUrl}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `${window.location.origin}${createdData.catalogUrl}`,
                        'catalog'
                      )
                    }
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                    title="Copiar Link"
                  >
                    {copiedLink === 'catalog' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href={createdData.catalogUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                    title="Abrir Catálogo"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Link do Admin */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  2. Painel Administrativo da sua Loja (Para cadastrar produtos)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 truncate">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}${createdData.adminUrl}`
                      : createdData.adminUrl}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `${window.location.origin}${createdData.adminUrl}`,
                        'admin'
                      )
                    }
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                    title="Copiar Link"
                  >
                    {copiedLink === 'admin' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href={createdData.adminUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                    title="Abrir Painel Admin"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Google Sheets Provisionado */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  3. Planilha no Google Sheets da Loja
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 truncate">
                    {createdData.spreadsheetUrl}
                  </div>
                  <a
                    href={createdData.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs border border-emerald-200 transition-colors"
                  >
                    <span>Abrir Tabela</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Botão de Ação Imediata */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={createdData.adminUrl}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Acessar Painel da Minha Loja</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={createdData.catalogUrl}
                target="_blank"
                className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span>Ver Catálogo Online</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-400">
        Plataforma SaaS Multi-Tenant • Acesso em tempo real em qualquer dispositivo
      </footer>
    </div>
  );
}
