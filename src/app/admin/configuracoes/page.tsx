'use client';

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { imageUploadService } from '@/lib/imageUploadService';
import { maskWhatsApp, normalizeWhatsAppToApi, maskCpfCnpj, validateCpfCnpj } from '@/lib/masks';
import { THEME_PRESET_LIST, applyThemeToDocument } from '@/lib/themePresets';
import type { StoreConfig, ThemePreset, CatalogLayoutMode } from '@/types';
import {
  Store,
  Palette,
  Phone,
  Globe,
  Loader2,
  Check,
  AlertCircle,
  Upload,
  Sparkles,
  ShoppingBag,
  Smartphone,
  Save,
  Image as ImageIcon,
  Trash2,
  Plus,
  Clock,
  QrCode,
  Power,
  Link as LinkIcon,
  ArrowUp,
  ArrowDown,
  Megaphone,
  Layers,
  LayoutGrid,
  List as ListIcon,
  BookOpen,
  Sun,
  Coffee,
  Monitor,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

const COLOR_PRESETS = [
  { name: 'Esmeralda', primary: '#10b981', secondary: '#047857' },
  { name: 'Índigo Moderno', primary: '#6366f1', secondary: '#4338ca' },
  { name: 'Violeta Neon', primary: '#8b5cf6', secondary: '#6d28d9' },
  { name: 'Rosa Vibe', primary: '#ec4899', secondary: '#be185d' },
  { name: 'Âmbar Premium', primary: '#f59e0b', secondary: '#b45309' },
  { name: 'Azul Tech', primary: '#0ea5e9', secondary: '#0369a1' },
  { name: 'Dark Minimalista', primary: '#0f172a', secondary: '#020617' },
];

const BG_CHOICES = [
  {
    id: 'white',
    name: 'Branco Puro',
    hex: '#ffffff',
    icon: Sun,
    description: 'Clean, luminoso e moderno. Foco total nas fotos dos produtos.',
  },
  {
    id: 'cream',
    name: 'Off-White Creme',
    hex: '#faf8f5',
    icon: Coffee,
    description: 'Aconchegante, nobre e elegante. Ideal para moda e artesanato.',
  },
  {
    id: 'slate',
    name: 'Slate Suave',
    hex: '#f8fafc',
    icon: Monitor,
    description: 'Neutro, equilibrado e tecnológico. Perfeito para qualquer catálogo.',
  },
];

const VITRINE_FORMATS = [
  {
    id: 'grid' as CatalogLayoutMode,
    label: 'Grade',
    badge: '2 e 4 Colunas',
    icon: LayoutGrid,
    ideal: 'Moda, Roupas, Calçados e Acessórios',
    description: '2 colunas no celular e 4 colunas no computador. Formato padrão para navegação rápida e visual.',
  },
  {
    id: 'list' as CatalogLayoutMode,
    label: 'Lista',
    badge: 'Horizontal Compacto',
    icon: ListIcon,
    ideal: 'Alimentação, Delivery, Bares e Mercados',
    description: 'Card horizontal com imagem à esquerda, nome, descrição dos itens e botão direto "+" de compra.',
  },
  {
    id: 'editorial' as CatalogLayoutMode,
    label: 'Feed',
    badge: '1 Coluna Ampla',
    icon: BookOpen,
    ideal: 'Joalherias, Peças Exclusivas e Novidades',
    description: '1 coluna ampla com imagens grandes em destaque vertical e espaçamento generoso de revista.',
  },
];

const ANNOUNCEMENT_BG_PRESETS = [
  { name: 'Dark Slate (Padrão)', hex: '#0f172a' },
  { name: 'Esmeralda', hex: '#047857' },
  { name: 'Índigo', hex: '#4338ca' },
  { name: 'Rosa Escuro', hex: '#9d174d' },
  { name: 'Âmbar Noturno', hex: '#78350f' },
  { name: 'Preto Total', hex: '#000000' },
];

const ANNOUNCEMENT_SUGGESTIONS = [
  'Compre online e receba em casa com frete seguro ou retire na loja física',
  'Coleção com pronta-entrega e envio imediato para todo o Brasil',
  'Parcelamento em até 3x sem juros no cartão de crédito',
  'Use o cupom BEMVINDO10 para ganhar 10% OFF no seu primeiro pedido',
  'Atendimento rápido e personalizado direto pelo WhatsApp!',
];

export default function AdminConfiguracoesPage() {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Navegação Principal de Abas
  const [activeMainTab, setActiveMainTab] = useState<'appearance' | 'store_data' | 'subscription'>('appearance');

  // Sub-abas de Aparência
  const [appearanceSubTab, setAppearanceSubTab] = useState<
    'colors' | 'typography' | 'layout' | 'announcement'
  >('colors');

  const [currentStoreId, setCurrentStoreId] = useState<string>('');
  const [rawStore, setRawStore] = useState<StoreConfig | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [secondaryColor, setSecondaryColor] = useState('#047857');
  const [backgroundColor, setBackgroundColor] = useState('#f8fafc');
  const [textColor, setTextColor] = useState('#0f172a');
  const [banners, setBanners] = useState<string[]>([]);
  const [newBannerInput, setNewBannerInput] = useState('');
  const [showBannerUrlInput, setShowBannerUrlInput] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [domain, setDomain] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [businessHours, setBusinessHours] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'cnpj' | 'email' | 'phone' | 'random'>('cpf');
  const [themePreset, setThemePreset] = useState<ThemePreset>('modern');
  const [catalogLayout, setCatalogLayout] = useState<CatalogLayoutMode>('grid');
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);
  const [announcementText, setAnnouncementText] = useState(
    'Compre online e receba em casa com frete seguro ou retire na loja física'
  );
  const [announcementBgColor, setAnnouncementBgColor] = useState('#0f172a');
  const [announcementTextColor, setAnnouncementTextColor] = useState('#ffffff');
  const [cpfCnpj, setCpfCnpj] = useState('');

  const loadConfig = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getStore();
      setRawStore(data);
      if (data.store_id) {
        setCurrentStoreId(data.store_id);
      }
      setStoreName(String(data.store_name ?? ''));
      setLogoUrl(String(data.logo_url ?? ''));
      setPrimaryColor(String(data.primary_color ?? '#10b981'));
      setSecondaryColor(String(data.secondary_color ?? '#047857'));
      setBackgroundColor(String(data.background_color ?? '#f8fafc'));
      setTextColor(String(data.text_color ?? '#0f172a'));
      setBanners(Array.isArray(data.banners) ? data.banners.slice(0, 3) : []);
      setWhatsapp(maskWhatsApp(String(data.whatsapp ?? '')));
      setDomain(String(data.domain ?? ''));
      setIsOpen(data.is_open !== undefined ? Boolean(data.is_open) : true);
      setBusinessHours(String(data.business_hours ?? ''));
      setPixKey(String(data.pix_key ?? ''));
      setPixKeyType((data.pix_key_type as any) || 'cpf');
      setThemePreset((data.theme_preset as ThemePreset) || 'modern');
      setCatalogLayout((data.catalog_layout as CatalogLayoutMode) || 'grid');
      setAnnouncementEnabled(
        data.announcement_enabled !== undefined && data.announcement_enabled !== null
          ? data.announcement_enabled === true || String(data.announcement_enabled).toLowerCase() === 'true'
          : true
      );
      setAnnouncementText(
        String(
          data.announcement_text ||
            'Compre online e receba em casa com frete seguro ou retire na loja física'
        )
      );
      setAnnouncementBgColor(String(data.announcement_bg_color ?? '#0f172a'));
      setAnnouncementTextColor(String(data.announcement_text_color ?? '#ffffff'));
      setCpfCnpj(data.cpf_cnpj ? maskCpfCnpj(String(data.cpf_cnpj)) : '');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao carregar configurações.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'subscription') {
        setActiveMainTab('subscription');
      }
    }
  }, []);

  const handleGenerateInvoice = async () => {
    setIsGeneratingInvoice(true);
    try {
      const resolvedTenant =
        currentStoreId ||
        rawStore?.store_id ||
        (typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('tenant') ||
            document.cookie.match(/(?:^|;\s*)app_tenant=([^;]+)/)?.[1]
          : null);

      let effectiveDoc = cpfCnpj.trim() || String(rawStore?.cpf_cnpj || '').trim();
      if (!effectiveDoc) {
        const promptDoc = prompt('Para gerar a fatura no Asaas, é obrigatório informar o CPF ou CNPJ do titular:');
        if (!promptDoc || !promptDoc.trim()) {
          setIsGeneratingInvoice(false);
          return;
        }
        effectiveDoc = promptDoc.trim();
        setCpfCnpj(maskCpfCnpj(effectiveDoc));
      }

      const res = await fetch('/api/asaas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: resolvedTenant,
          cpfCnpj: effectiveDoc,
          plan: 'monthly',
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.invoiceUrl) {
        window.open(json.data.invoiceUrl, '_blank');
        await loadConfig();
      } else {
        alert(json.error || 'Não foi possível gerar a fatura no momento.');
      }
    } catch (err) {
      alert('Erro ao conectar ao Asaas: ' + String(err));
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const isTrial = Boolean(
    rawStore &&
      (rawStore.subscription_status === 'trial' ||
        rawStore.subscription_plan === 'trial_7d' ||
        rawStore.subscription_plan === 'trial_30d') &&
      !rawStore.pending_payment &&
      rawStore.subscription_status !== 'blocked' &&
      rawStore.subscription_status !== 'expired'
  );

  const isOverdueOrBlocked = Boolean(
    rawStore &&
      (rawStore.subscription_status === 'blocked' ||
        rawStore.subscription_status === 'expired' ||
        rawStore.pending_payment === true)
  );

  const daysRemaining = rawStore?.subscription_expires_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(rawStore.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : 7;

  const formattedNextDueDate = rawStore?.subscription_expires_at
    ? new Date(rawStore.subscription_expires_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Em 7 dias';

  // Sincroniza dinamicamente as variáveis CSS no documento em tempo real ao interagir com o Color Picker e temas
  useEffect(() => {
    if (!isLoading && primaryColor) {
      applyThemeToDocument({
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        background_color: backgroundColor,
        text_color: textColor,
        theme_preset: themePreset,
        announcement_bg_color: announcementBgColor,
        announcement_text_color: announcementTextColor,
      });
    }
  }, [
    isLoading,
    primaryColor,
    secondaryColor,
    backgroundColor,
    textColor,
    themePreset,
    announcementBgColor,
    announcementTextColor,
  ]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setErrorMessage(null);
    try {
      const url = await imageUploadService.upload(file);
      setLogoUrl(url);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao enviar logo.');
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (banners.length >= 3) {
      alert('Limite de 3 banners atingido. Remova um banner antes de adicionar outro.');
      e.target.value = '';
      return;
    }

    setIsUploadingBanner(true);
    setErrorMessage(null);
    try {
      const url = await imageUploadService.upload(file);
      setBanners((prev) => [...prev, url].slice(0, 3));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao enviar banner.');
    } finally {
      setIsUploadingBanner(false);
      e.target.value = '';
    }
  };

  const handleAddBannerUrl = () => {
    if (!newBannerInput.trim()) return;
    if (banners.length >= 3) {
      alert('Limite de 3 banners atingido.');
      return;
    }
    setBanners((prev) => [...prev, newBannerInput.trim()].slice(0, 3));
    setNewBannerInput('');
    setShowBannerUrlInput(false);
  };

  const handleRemoveBanner = (index: number) => {
    setBanners((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveBanner = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;
    const updated = [...banners];
    const temp = updated[index];
    const target = updated[newIndex];
    if (temp !== undefined && target !== undefined) {
      updated[index] = target;
      updated[newIndex] = temp;
      setBanners(updated);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const cleanWhatsapp = normalizeWhatsAppToApi(whatsapp);

      const updated = await api.saveConfig(
        {
          store_name: String(storeName ?? '').trim(),
          logo_url: String(logoUrl ?? '').trim(),
          primary_color: String(primaryColor ?? '#10b981').trim(),
          secondary_color: String(secondaryColor ?? '#047857').trim(),
          background_color: String(backgroundColor ?? '#f8fafc').trim(),
          text_color: String(textColor ?? '#0f172a').trim(),
          banners: banners.slice(0, 3),
          whatsapp: cleanWhatsapp,
          domain: String(domain ?? '').trim(),
          is_open: isOpen,
          business_hours: businessHours.trim(),
          pix_key: pixKey.trim(),
          pix_key_type: pixKeyType,
          theme_preset: themePreset,
          catalog_layout: catalogLayout,
          announcement_enabled: announcementEnabled,
          announcement_text: announcementText.trim(),
          announcement_bg_color: announcementBgColor.trim(),
          announcement_text_color: announcementTextColor.trim(),
          cpf_cnpj: cpfCnpj.trim() || undefined,
        },
        token,
        currentStoreId || undefined
      );

      if (updated.store_id) {
        setCurrentStoreId(updated.store_id);
      }
      setStoreName(String(updated.store_name ?? ''));
      setLogoUrl(String(updated.logo_url ?? ''));
      setPrimaryColor(String(updated.primary_color ?? '#10b981'));
      setSecondaryColor(String(updated.secondary_color ?? '#047857'));
      setBackgroundColor(String(updated.background_color ?? '#f8fafc'));
      setTextColor(String(updated.text_color ?? '#0f172a'));
      setBanners(Array.isArray(updated.banners) ? updated.banners.slice(0, 3) : []);
      setWhatsapp(maskWhatsApp(String(updated.whatsapp ?? '')));
      setDomain(String(updated.domain ?? ''));
      setIsOpen(updated.is_open !== undefined ? Boolean(updated.is_open) : true);
      setBusinessHours(String(updated.business_hours ?? ''));
      setPixKey(String(updated.pix_key ?? ''));
      setPixKeyType((updated.pix_key_type as any) || 'cpf');
      setThemePreset((updated.theme_preset as ThemePreset) || 'modern');
      setCatalogLayout((updated.catalog_layout as CatalogLayoutMode) || 'grid');
      setAnnouncementEnabled(
        updated.announcement_enabled !== undefined && updated.announcement_enabled !== null
          ? updated.announcement_enabled === true || String(updated.announcement_enabled).toLowerCase() === 'true'
          : true
      );
      setAnnouncementText(
        String(
          updated.announcement_text ||
            'Compre online e receba em casa com frete seguro ou retire na loja física'
        )
      );
      setAnnouncementBgColor(String(updated.announcement_bg_color ?? '#0f172a'));
      setAnnouncementTextColor(String(updated.announcement_text_color ?? '#ffffff'));

      setSuccessMessage('Configurações salvas e sincronizadas com sucesso!');
      applyThemeToDocument(updated);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao salvar configurações.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header do Painel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Configurações da Loja
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Personalize a identidade visual, cores da marca, tipografia, vitrine e dados de atendimento.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>

        {/* Alertas */}
        {successMessage && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs sm:text-sm text-emerald-800 flex items-center gap-2.5 shadow-xs animate-fade-in">
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs sm:text-sm text-rose-800 flex items-center gap-2.5 shadow-xs animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-14 text-center shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin text-slate-900 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Carregando configurações da loja...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Coluna 1: Abas de Configuração e Formulário (7 colunas) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Abas Principais: Aparência vs Dados da Loja vs Assinatura */}
              <div className="flex flex-col sm:flex-row bg-slate-100 p-1 rounded-2xl border border-slate-200/80 gap-1 sm:gap-0">
                <button
                  type="button"
                  onClick={() => setActiveMainTab('appearance')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeMainTab === 'appearance'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Palette className="w-4 h-4 text-emerald-600" />
                  <span>Aparência da Loja</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMainTab('store_data')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeMainTab === 'store_data'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>Dados & Contato</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMainTab('subscription')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                    activeMainTab === 'subscription'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Minha Assinatura</span>
                  {isTrial && (
                    <span className="hidden sm:inline-block text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                      {daysRemaining}d
                    </span>
                  )}
                </button>
              </div>

              {/* Formulário Principal */}
              <form onSubmit={handleSave} className="space-y-6">
                {/* ============================================================ */}
                {/* ABA 1: APARÊNCIA DA LOJA */}
                {/* ============================================================ */}
                {activeMainTab === 'appearance' && (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-6 animate-fade-in">
                    {/* Sub-Navegação de Aparência em 4 Blocos/Abas */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-2 border-b border-slate-100">
                      <button
                        type="button"
                        onClick={() => setAppearanceSubTab('colors')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex flex-col items-center gap-1.5 ${
                          appearanceSubTab === 'colors'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Palette className="w-4 h-4" />
                        <span>1. Cores</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAppearanceSubTab('typography')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex flex-col items-center gap-1.5 ${
                          appearanceSubTab === 'typography'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                        <span>2. Tipografia</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAppearanceSubTab('layout')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex flex-col items-center gap-1.5 ${
                          appearanceSubTab === 'layout'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                        <span>3. Vitrine</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAppearanceSubTab('announcement')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex flex-col items-center gap-1.5 ${
                          appearanceSubTab === 'announcement'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Megaphone className="w-4 h-4" />
                        <span>4. Anúncio</span>
                      </button>
                    </div>

                    {/* ------------------------------------------------------------ */}
                    {/* BLOCO 1: CORES (PRIMÁRIA + FUNDO) */}
                    {/* ------------------------------------------------------------ */}
                    {appearanceSubTab === 'colors' && (
                      <div className="space-y-6 animate-fade-in">
                        {/* Seção Cor Primária */}
                        <div className="space-y-3">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                              <Palette className="w-4 h-4 text-emerald-600" />
                              <span>Cor Primária da Marca</span>
                            </span>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Define botões de ação, badges promocionais, preços e destaques visuais do catálogo.
                            </p>
                          </div>

                          {/* Color Picker Nativo + Hex */}
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                            <div className="relative">
                              <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="h-11 w-11 rounded-xl border-2 border-white shadow-xs cursor-pointer p-0"
                                aria-label="Color Picker Nativo para Cor Primária"
                              />
                            </div>
                            <div className="flex-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                Código Hexadecimal
                              </span>
                              <input
                                type="text"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                placeholder="#10b981"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono font-bold uppercase text-slate-900 focus:outline-none focus:border-slate-800"
                              />
                            </div>
                          </div>

                          {/* Presets de Paletas Harmoniosas */}
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-semibold text-slate-600">
                              Paletas Harmoniosas Recomendadas:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {COLOR_PRESETS.map((preset) => {
                                const isSelected =
                                  primaryColor.toLowerCase() === preset.primary.toLowerCase();
                                return (
                                  <button
                                    key={preset.name}
                                    type="button"
                                    onClick={() => {
                                      setPrimaryColor(preset.primary);
                                      setSecondaryColor(preset.secondary);
                                    }}
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                                      isSelected
                                        ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                    }`}
                                  >
                                    <span
                                      className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                                      style={{ backgroundColor: preset.primary }}
                                    />
                                    <span>{preset.name}</span>
                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Seção Cor de Fundo da Vitrine */}
                        <div className="pt-5 border-t border-slate-100 space-y-3">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                              <Monitor className="w-4 h-4 text-emerald-600" />
                              <span>Cor de Fundo da Vitrine</span>
                            </span>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Escolha entre as 3 atmosferas visuais mais elegantes para ambientar seus produtos.
                            </p>
                          </div>

                          {/* 3 Opções em Destaque: Branco Puro vs Off-White Creme vs Slate Suave */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {BG_CHOICES.map((choice) => {
                              const isSelected =
                                backgroundColor.toLowerCase() === choice.hex.toLowerCase();
                              const IconComponent = choice.icon;
                              return (
                                <button
                                  key={choice.id}
                                  type="button"
                                  onClick={() => setBackgroundColor(choice.hex)}
                                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                    isSelected
                                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs"
                                          style={{ backgroundColor: choice.hex }}
                                        />
                                        <span
                                          className={`text-xs font-bold ${
                                            isSelected ? 'text-white' : 'text-slate-900'
                                          }`}
                                        >
                                          {choice.name}
                                        </span>
                                      </div>
                                      <IconComponent
                                        className={`w-3.5 h-3.5 ${
                                          isSelected ? 'text-slate-300' : 'text-slate-400'
                                        }`}
                                      />
                                    </div>
                                    <p
                                      className={`text-[10px] leading-relaxed ${
                                        isSelected ? 'text-slate-300' : 'text-slate-500'
                                      }`}
                                    >
                                      {choice.description}
                                    </p>
                                  </div>

                                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] mt-2">
                                    <span
                                      className={`font-mono font-semibold ${
                                        isSelected ? 'text-slate-300' : 'text-slate-400'
                                      }`}
                                    >
                                      {choice.hex}
                                    </span>
                                    {isSelected && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Seletor Livre de Fundo Customizado */}
                          <div className="pt-2 flex items-center gap-3">
                            <span className="text-[11px] font-semibold text-slate-500">
                              Ou personalize livremente:
                            </span>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                className="h-7 w-7 rounded-lg border border-slate-200 cursor-pointer p-0"
                                aria-label="Color picker para fundo customizado"
                              />
                              <input
                                type="text"
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                placeholder="#f8fafc"
                                className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono font-bold uppercase text-slate-800"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ------------------------------------------------------------ */}
                    {/* BLOCO 2: TIPOGRAFIA & ESTILO (3 PRESETS) */}
                    {/* ------------------------------------------------------------ */}
                    {appearanceSubTab === 'typography' && (
                      <div className="space-y-4 animate-fade-in">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-emerald-600" />
                            <span>Presets de Tipografia & Estilo Visual</span>
                          </span>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Altera instantaneamente as famílias tipográficas, arredondamento dos cartões e sombras da sua loja.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {THEME_PRESET_LIST.map((preset) => {
                            const isSelected = themePreset === preset.id;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => setThemePreset(preset.id)}
                                className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                  isSelected
                                    ? 'border-slate-900 bg-slate-900 text-white shadow-md ring-2 ring-slate-900/10'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1.5">
                                    <span
                                      className={`text-xs font-black tracking-tight ${
                                        isSelected ? 'text-white' : 'text-slate-900'
                                      }`}
                                    >
                                      {preset.name}
                                    </span>
                                    <span
                                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                        isSelected
                                          ? 'bg-white/20 text-white'
                                          : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {preset.radiusLabel}
                                    </span>
                                  </div>
                                  <p
                                    className={`text-[11px] leading-relaxed mb-3 ${
                                      isSelected ? 'text-slate-300' : 'text-slate-500'
                                    }`}
                                  >
                                    {preset.description}
                                  </p>

                                  {/* Demonstração Visual das Fontes */}
                                  <div
                                    className={`p-2.5 rounded-xl border mb-3 text-center ${
                                      isSelected
                                        ? 'bg-white/10 border-white/15'
                                        : 'bg-slate-50 border-slate-200/80'
                                    }`}
                                  >
                                    <p
                                      className={`text-sm font-black ${
                                        preset.id === 'editorial'
                                          ? 'font-serif'
                                          : preset.id === 'bold'
                                          ? 'font-mono'
                                          : 'font-sans'
                                      } ${isSelected ? 'text-white' : 'text-slate-900'}`}
                                    >
                                      {preset.id === 'editorial'
                                        ? 'Playfair Display'
                                        : preset.id === 'bold'
                                        ? 'Space Grotesk'
                                        : 'Plus Jakarta Sans'}
                                    </p>
                                    <span
                                      className={`text-[9px] block mt-0.5 ${
                                        isSelected ? 'text-slate-300' : 'text-slate-400'
                                      }`}
                                    >
                                      {preset.id === 'editorial'
                                        ? 'Títulos clássicos com serifa nobre'
                                        : preset.id === 'bold'
                                        ? 'Impacto visual marcante e moderno'
                                        : 'Sans-serif universal ultra legível'}
                                    </span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                                  <span
                                    className={
                                      isSelected ? 'text-slate-300 font-medium' : 'text-slate-400 font-medium'
                                    }
                                  >
                                    Cantos:{' '}
                                    <strong className={isSelected ? 'text-white' : 'text-slate-800'}>
                                      {preset.radiusLabel}
                                    </strong>
                                  </span>
                                  {isSelected && (
                                    <span className="flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500 text-white">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ------------------------------------------------------------ */}
                    {/* BLOCO 3: FORMATO DA VITRINE (RÁDIO GRADE, LISTA, FEED) */}
                    {/* ------------------------------------------------------------ */}
                    {appearanceSubTab === 'layout' && (
                      <div className="space-y-4 animate-fade-in">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <LayoutGrid className="w-4 h-4 text-emerald-600" />
                            <span>Formato da Vitrine de Produtos</span>
                          </span>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Escolha a distribuição estrutural dos cartões de produtos que melhor atende ao seu nicho de mercado.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {VITRINE_FORMATS.map((format) => {
                            const isSelected = catalogLayout === format.id;
                            const IconComp = format.icon;
                            return (
                              <button
                                key={format.id}
                                type="button"
                                onClick={() => setCatalogLayout(format.id)}
                                className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                  isSelected
                                    ? 'border-slate-900 bg-slate-900 text-white shadow-md ring-2 ring-slate-900/10'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`h-7 w-7 rounded-xl flex items-center justify-center ${
                                          isSelected
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-100 text-slate-700'
                                        }`}
                                      >
                                        <IconComp className="w-4 h-4" />
                                      </div>
                                      <span
                                        className={`text-xs font-black tracking-tight ${
                                          isSelected ? 'text-white' : 'text-slate-900'
                                        }`}
                                      >
                                        {format.label}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                        isSelected
                                          ? 'bg-white/20 text-white'
                                          : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {format.badge}
                                    </span>
                                  </div>

                                  <p
                                    className={`text-[11px] leading-relaxed mb-3 ${
                                      isSelected ? 'text-slate-300' : 'text-slate-500'
                                    }`}
                                  >
                                    {format.description}
                                  </p>
                                </div>

                                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                                  <span
                                    className={
                                      isSelected ? 'text-slate-300 font-medium' : 'text-slate-400 font-medium'
                                    }
                                  >
                                    Recomendado:{' '}
                                    <strong className={isSelected ? 'text-white' : 'text-slate-800'}>
                                      {format.ideal}
                                    </strong>
                                  </span>
                                  {isSelected && (
                                    <span className="flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500 text-white flex-shrink-0 ml-1">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ------------------------------------------------------------ */}
                    {/* BLOCO 4: BARRA DE ANÚNCIO (SWITCH + TEXTO + CORES) */}
                    {/* ------------------------------------------------------------ */}
                    {appearanceSubTab === 'announcement' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                              <Megaphone className="w-4 h-4 text-emerald-600" />
                              <span>Barra de Anúncios no Topo</span>
                            </span>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Exiba avisos importantes, promoções de frete ou cupons no cabeçalho de todas as páginas.
                            </p>
                          </div>

                          {/* Switch Ativa / Desativa */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={announcementEnabled}
                            onClick={() => setAnnouncementEnabled(!announcementEnabled)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-900/20 ${
                              announcementEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                announcementEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {announcementEnabled && (
                          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-fade-in">
                            {/* Input de Texto do Comunicado */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold text-slate-800">
                                  Texto do Comunicado / Slogan
                                </label>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {announcementText.length}/300
                                </span>
                              </div>
                              <input
                                type="text"
                                value={announcementText}
                                maxLength={300}
                                onChange={(e) => setAnnouncementText(e.target.value)}
                                placeholder="Ex: Compre online com frete grátis para todo o Brasil acima de R$ 199"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                              />
                            </div>

                            {/* Sugestões Rápidas de Anúncio */}
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Ideias Rápidas de Comunicado (1 clique para usar):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {ANNOUNCEMENT_SUGGESTIONS.map((sug, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setAnnouncementText(sug)}
                                    className="text-[10px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-400 text-slate-700 hover:text-slate-900 transition cursor-pointer text-left truncate max-w-xs"
                                  >
                                    {sug}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Cores da Barra de Anúncio */}
                            <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Cor de Fundo da Barra */}
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-700 block">
                                  Cor de Fundo da Barra
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={announcementBgColor}
                                    onChange={(e) => setAnnouncementBgColor(e.target.value)}
                                    className="h-8 w-8 rounded-lg border border-slate-200 cursor-pointer p-0"
                                  />
                                  <input
                                    type="text"
                                    value={announcementBgColor}
                                    onChange={(e) => setAnnouncementBgColor(e.target.value)}
                                    placeholder="#0f172a"
                                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono font-semibold uppercase text-slate-800"
                                  />
                                </div>
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {ANNOUNCEMENT_BG_PRESETS.map((p) => (
                                    <button
                                      key={p.hex}
                                      type="button"
                                      onClick={() => setAnnouncementBgColor(p.hex)}
                                      className={`h-5 w-5 rounded-full border border-black/10 transition cursor-pointer ${
                                        announcementBgColor.toLowerCase() === p.hex.toLowerCase()
                                          ? 'ring-2 ring-slate-800 scale-110'
                                          : ''
                                      }`}
                                      style={{ backgroundColor: p.hex }}
                                      title={p.name}
                                    />
                                  ))}
                                </div>
                              </div>

                              {/* Cor do Texto da Barra */}
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-700 block">
                                  Cor do Texto
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={announcementTextColor}
                                    onChange={(e) => setAnnouncementTextColor(e.target.value)}
                                    className="h-8 w-8 rounded-lg border border-slate-200 cursor-pointer p-0"
                                  />
                                  <input
                                    type="text"
                                    value={announcementTextColor}
                                    onChange={(e) => setAnnouncementTextColor(e.target.value)}
                                    placeholder="#ffffff"
                                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono font-semibold uppercase text-slate-800"
                                  />
                                </div>
                                <div className="flex gap-1.5 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setAnnouncementTextColor('#ffffff')}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded border transition cursor-pointer ${
                                      announcementTextColor.toLowerCase() === '#ffffff'
                                        ? 'border-slate-800 bg-slate-900 text-white'
                                        : 'border-slate-200 bg-white text-slate-700'
                                    }`}
                                  >
                                    Branco
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAnnouncementTextColor('#fef08a')}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded border transition cursor-pointer ${
                                      announcementTextColor.toLowerCase() === '#fef08a'
                                        ? 'border-slate-800 bg-slate-900 text-white'
                                        : 'border-slate-200 bg-amber-100 text-amber-900'
                                    }`}
                                  >
                                    Amarelo
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ============================================================ */}
                {/* ABA 2: DADOS DA LOJA & CONTATO */}
                {/* ============================================================ */}
                {activeMainTab === 'store_data' && (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-5 animate-fade-in">
                    {/* Nome da Loja */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-slate-400" />
                        <span>Nome da Loja *</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Ex: Boutique Elegance"
                        className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/5"
                      />
                    </div>

                    {/* Logotipo */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Logotipo da Loja
                      </label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <input
                          type="url"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="https://exemplo.com/logo.png"
                          className="flex-1 w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/5"
                        />
                        <label className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer transition shadow-2xs">
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>{isUploadingLogo ? 'Enviando...' : 'Upload Logo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            disabled={isUploadingLogo}
                            className="sr-only"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Banners do Topo */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-emerald-600" />
                            Banners do Topo ({banners.length}/3)
                          </span>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Exibidos no topo com carrossel deslizante. Proporção recomendada: 16:9 ou 21:9.
                          </p>
                        </div>
                        {banners.length < 3 && (
                          <button
                            type="button"
                            onClick={() => setShowBannerUrlInput(!showBannerUrlInput)}
                            className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline transition cursor-pointer"
                          >
                            {showBannerUrlInput ? 'Ocultar URL' : '+ Adicionar Link'}
                          </button>
                        )}
                      </div>

                      {showBannerUrlInput && banners.length < 3 && (
                        <div className="flex gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 animate-fade-in">
                          <div className="relative flex-1">
                            <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                            <input
                              type="url"
                              placeholder="Cole o link da imagem do banner..."
                              value={newBannerInput}
                              onChange={(e) => setNewBannerInput(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-800"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleAddBannerUrl}
                            disabled={!newBannerInput.trim()}
                            className="px-3.5 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition disabled:opacity-40 cursor-pointer"
                          >
                            Inserir
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {banners.map((bannerUrl, idx) => (
                          <div
                            key={idx}
                            className="group relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 aspect-[16/9] shadow-2xs hover:shadow-md transition"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={bannerUrl}
                              alt={`Banner ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveBanner(idx, 'up')}
                                  className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-white transition"
                                  title="Mover para esquerda"
                                >
                                  <ArrowUp className="w-3.5 h-3.5 -rotate-90" />
                                </button>
                              )}
                              {idx < banners.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveBanner(idx, 'down')}
                                  className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-white transition"
                                  title="Mover para direita"
                                >
                                  <ArrowDown className="w-3.5 h-3.5 -rotate-90" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveBanner(idx)}
                                className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition"
                                title="Remover banner"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {banners.length < 3 && (
                          <label className="flex flex-col items-center justify-center aspect-[16/9] rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer p-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleBannerUpload}
                              disabled={isUploadingBanner}
                              className="sr-only"
                            />
                            {isUploadingBanner ? (
                              <div className="flex flex-col items-center gap-1 text-slate-500">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-[10px] font-bold">Enviando...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-slate-500">
                                <Upload className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-bold">+ Upload Banner</span>
                                <span className="text-[9px] text-slate-400">1200x500px</span>
                              </div>
                            )}
                          </label>
                        )}
                      </div>
                    </div>

                    {/* WhatsApp de Atendimento */}
                    <div className="pt-3 border-t border-slate-100">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-emerald-600" />
                        <span>WhatsApp de Atendimento *</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(maskWhatsApp(e.target.value))}
                        placeholder="(11) 98765-4321"
                        maxLength={15}
                        className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/5 font-mono"
                      />
                    </div>

                    {/* CPF ou CNPJ para Faturamento Asaas */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-emerald-600" />
                          <span>CPF ou CNPJ do Titular (Cobrança Asaas)</span>
                        </label>
                        {cpfCnpj && validateCpfCnpj(cpfCnpj) ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Válido
                          </span>
                        ) : null}
                      </div>
                      <input
                        type="text"
                        value={cpfCnpj}
                        onChange={(e) => setCpfCnpj(maskCpfCnpj(e.target.value))}
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        maxLength={18}
                        className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/5 font-mono"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Utilizado pelo gateway Asaas para emissão de faturas e QR Code Pix oficial de R$ 79,90/mês.
                      </p>
                    </div>

                    {/* Domínio Customizado */}
                    <div className="pt-3 border-t border-slate-100">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <span>Domínio Customizado (Opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="Ex: catalogo.minhaloja.com.br"
                        className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/5"
                      />
                    </div>

                    {/* Status de Atendimento (Aberto / Fechado) */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Power className="w-4 h-4 text-emerald-600" />
                        <span>Status da Loja</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setIsOpen(true)}
                          className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                            isOpen
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>🟢 Aberto Agora</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsOpen(false)}
                          className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                            !isOpen
                              ? 'border-rose-400 bg-rose-50 text-rose-800 shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-rose-500" />
                          <span>🔴 Fechado no Momento</span>
                        </button>
                      </div>
                    </div>

                    {/* Horário de Atendimento */}
                    <div className="pt-3 border-t border-slate-100">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>Horário de Funcionamento</span>
                      </label>
                      <input
                        type="text"
                        value={businessHours}
                        onChange={(e) => setBusinessHours(e.target.value)}
                        placeholder="Ex: Seg a Sáb: 09h às 19h • Dom: 09h às 14h"
                        className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/5"
                      />
                    </div>

                    {/* Chave PIX */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-emerald-600" />
                        <span>Chave PIX da Loja</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <select
                          value={pixKeyType}
                          onChange={(e) => setPixKeyType(e.target.value as any)}
                          className="rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white focus:border-slate-800 focus:outline-none"
                        >
                          <option value="cpf">CPF</option>
                          <option value="cnpj">CNPJ</option>
                          <option value="phone">Celular</option>
                          <option value="email">E-mail</option>
                          <option value="random">Chave Aleatória</option>
                        </select>
                        <input
                          type="text"
                          value={pixKey}
                          onChange={(e) => setPixKey(e.target.value)}
                          placeholder="pix@minhaloja.com"
                          className="sm:col-span-2 rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/5 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ============================================================ */}
                {/* ABA 3: MINHA ASSINATURA */}
                {/* ============================================================ */}
                {activeMainTab === 'subscription' && (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-6 animate-fade-in">
                    {/* Header da Seção */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Gestão de Cobrança
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-1">Minha Assinatura</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Acompanhe os detalhes da sua assinatura e faturamento no Asaas.
                        </p>
                      </div>
                      <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                        <CreditCard className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Bento Grid: Plano Atual, Status e Próximo Vencimento */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Card 1: Plano Atual */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Plano Atual
                        </span>
                        <span className="font-extrabold text-slate-900 text-sm block">
                          Plano Mensal - R$ 79,90/mês
                        </span>
                        <span className="text-[11px] text-slate-500 block">Catálogo Digital Ilimitado</span>
                      </div>

                      {/* Card 2: Status */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Status
                        </span>
                        {isTrial ? (
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="font-extrabold text-amber-700 text-sm">
                              Período de Teste (7 dias)
                            </span>
                          </div>
                        ) : isOverdueOrBlocked ? (
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            <span className="font-extrabold text-rose-700 text-sm">
                              Pagamento Pendente
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="font-extrabold text-emerald-700 text-sm">
                              Assinatura Ativa
                            </span>
                          </div>
                        )}
                        <span className="text-[11px] text-slate-500 block">
                          {isTrial
                            ? `Restam ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'} grátis`
                            : 'Renovação automática'}
                        </span>
                      </div>

                      {/* Card 3: Próximo Vencimento */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Próximo Vencimento
                        </span>
                        <span className="font-extrabold text-slate-900 text-sm block">
                          {formattedNextDueDate}
                        </span>
                        <span className="text-[11px] text-slate-500 block">Fatura Asaas</span>
                      </div>
                    </div>

                    {/* Card de Documento de Cobrança (CPF/CNPJ) */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-emerald-600" />
                          <span>CPF ou CNPJ para Faturamento Asaas</span>
                        </label>
                        {cpfCnpj && validateCpfCnpj(cpfCnpj) ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 w-fit">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Documento Válido
                          </span>
                        ) : !cpfCnpj ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full w-fit">
                            Obrigatório para emissão de faturas
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full w-fit">
                            Dígitos verificadores incorretos
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <input
                          type="text"
                          value={cpfCnpj}
                          onChange={(e) => setCpfCnpj(maskCpfCnpj(e.target.value))}
                          placeholder="Informe seu CPF ou CNPJ"
                          className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/5 font-mono bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={isSubmitting}
                          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer disabled:opacity-60 whitespace-nowrap"
                        >
                          {isSubmitting ? 'Salvando...' : 'Salvar Documento'}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Obrigatório para registrar a assinatura mensal e gerar faturas seguras com QR Code Pix no Asaas.
                      </p>
                    </div>

                    {/* Detalhes de Fatura e Gateway Asaas */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white space-y-4 shadow-md">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-emerald-500/30">
                            Gateway Oficial Asaas
                          </span>
                          <h4 className="text-base font-bold text-white">
                            Link de Pagamento e Faturas
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Você pode pagar sua mensalidade com PIX, Cartão de Crédito ou Boleto bancário.
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-emerald-400 tracking-tight">R$ 79,90</span>
                          <span className="text-[10px] text-slate-400 block font-medium">/mês</span>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {rawStore?.asaas_payment_link && !rawStore.asaas_payment_link.includes('sandbox.asaas.com/s/') ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={rawStore.asaas_payment_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition text-center"
                            >
                              <CreditCard className="w-4 h-4" />
                              <span>Acessar Fatura no Asaas (R$ 79,90)</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={handleGenerateInvoice}
                              disabled={isGeneratingInvoice}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                              title="Sincronizar fatura ou emitir nova via"
                            >
                              <span>{isGeneratingInvoice ? 'Sincronizando...' : 'Atualizar Fatura'}</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleGenerateInvoice}
                            disabled={isGeneratingInvoice}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition disabled:opacity-60 cursor-pointer text-center"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>{isGeneratingInvoice ? 'Gerando Fatura...' : 'Acessar Link de Pagamento (R$ 79,90)'}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div className="text-[11px] text-slate-400 text-center sm:text-left flex-1">
                          Sem fidelidade • Cancele quando quiser • Acesso instantâneo
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botão de Salvar no Rodapé (oculto na aba de assinatura) */}
                {activeMainTab !== 'subscription' && (
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Salvando Configurações...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Salvar Todas as Configurações</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* ============================================================ */}
            {/* COLUNA 2: MINI LIVE PREVIEW RESPONSIVO EM TEMPO REAL */}
            {/* ============================================================ */}
            <div className="lg:col-span-5 space-y-3 sticky top-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Mini Live Preview</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Em Tempo Real
                </span>
              </div>

              {/* Mockup do Celular com Atualização Instantânea */}
              <div className="bg-slate-900 p-3 rounded-[2.5rem] shadow-2xl border-4 border-slate-800 max-w-sm mx-auto w-full">
                <div
                  className="rounded-[2rem] overflow-hidden flex flex-col min-h-[500px] border border-slate-200 transition-colors"
                  style={{
                    backgroundColor: backgroundColor,
                    color: textColor,
                  }}
                >
                  {/* Notch / Status Bar */}
                  <div className="bg-slate-900 text-white text-[9px] py-1 px-4 flex items-center justify-between font-bold">
                    <span>9:41</span>
                    <div className="h-1.5 w-10 bg-slate-800 rounded-full" />
                    <span>5G • 100%</span>
                  </div>

                  {/* 1. Barra de Anúncios no Topo Simulada */}
                  {announcementEnabled && (
                    <div
                      className="py-1 px-3 text-[9px] font-semibold flex items-center justify-between transition-colors shadow-2xs border-b border-black/10"
                      style={{
                        backgroundColor: announcementBgColor,
                        color: announcementTextColor,
                      }}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Sparkles className="w-2.5 h-2.5 fill-current animate-pulse flex-shrink-0" />
                        <span className="truncate">
                          {announcementText || 'Aviso da loja em destaque'}
                        </span>
                      </div>
                      <span className="text-[8px] opacity-75 flex-shrink-0 ml-1">✕</span>
                    </div>
                  )}

                  {/* 2. Header do Catálogo com Estilo do Preset */}
                  <div className="bg-white/95 backdrop-blur-xs p-3 border-b border-slate-200 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`h-7 w-7 bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0 ${
                          themePreset === 'editorial'
                            ? 'rounded-xs'
                            : themePreset === 'bold'
                            ? 'rounded-2xl'
                            : 'rounded-xl'
                        }`}
                      >
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logoUrl}
                            alt="Preview Logo"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Store className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span
                          className={`text-xs block leading-tight truncate ${
                            themePreset === 'editorial'
                              ? 'font-serif font-black tracking-wide text-slate-900'
                              : themePreset === 'bold'
                              ? 'font-mono font-black tracking-tight text-slate-900'
                              : 'font-sans font-extrabold text-slate-900'
                          }`}
                        >
                          {storeName || 'Nome da Loja'}
                        </span>
                        <span className="text-[8px] text-emerald-600 font-semibold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {isOpen ? 'Aberto Agora' : 'Fechado'}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`h-7 w-7 flex items-center justify-center text-white shadow-xs ${
                        themePreset === 'editorial'
                          ? 'rounded-xs'
                          : themePreset === 'bold'
                          ? 'rounded-full'
                          : 'rounded-lg'
                      }`}
                      style={{ backgroundColor: primaryColor }}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* 3. Corpo do Catálogo (Banners + Card do Produto Dinâmico) */}
                  <div className="p-3 space-y-3 flex-1 flex flex-col justify-between">
                    {/* Banner */}
                    {banners.length > 0 ? (
                      <div
                        className={`relative overflow-hidden aspect-[16/9] bg-slate-200 shadow-xs ${
                          themePreset === 'editorial'
                            ? 'rounded-xs'
                            : themePreset === 'bold'
                            ? 'rounded-3xl'
                            : 'rounded-2xl'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={banners[0]}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className={`p-2.5 border border-dashed border-slate-300 text-center text-[9px] text-slate-400 ${
                          themePreset === 'editorial'
                            ? 'rounded-xs'
                            : themePreset === 'bold'
                            ? 'rounded-3xl'
                            : 'rounded-2xl'
                        }`}
                      >
                        Banners aparecerão aqui
                      </div>
                    )}

                    {/* 4. Card de Produto Renderizado Conforme Formato da Vitrine */}
                    {catalogLayout === 'list' ? (
                      /* Layout List no Mockup */
                      <div
                        className={`bg-white p-2.5 border border-slate-200/80 flex items-stretch gap-2.5 transition-all ${
                          themePreset === 'editorial'
                            ? 'rounded-xs shadow-none border-slate-300'
                            : themePreset === 'bold'
                            ? 'rounded-2xl shadow-[2px_2px_0px_0px_rgba(15,23,42,0.12)] border-slate-900/20'
                            : 'rounded-xl shadow-2xs'
                        }`}
                      >
                        <div
                          className={`w-16 h-16 bg-slate-100 flex items-center justify-center text-slate-400 relative overflow-hidden flex-shrink-0 ${
                            themePreset === 'editorial'
                              ? 'rounded-xs'
                              : themePreset === 'bold'
                              ? 'rounded-xl'
                              : 'rounded-lg'
                          }`}
                        >
                          <Store className="w-5 h-5 stroke-1 text-slate-300" />
                          <span
                            className="absolute top-1 left-1 text-white text-[7px] font-black px-1 py-0.2 rounded-full uppercase"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Top
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <h5
                              className={`text-[10px] leading-tight truncate ${
                                themePreset === 'editorial'
                                  ? 'font-serif font-bold text-slate-900'
                                  : themePreset === 'bold'
                                  ? 'font-mono font-black text-slate-900'
                                  : 'font-sans font-bold text-slate-900'
                              }`}
                            >
                              Combo Burguer Artesanal
                            </h5>
                            <p className="text-[8px] text-slate-400 line-clamp-1 mt-0.5">
                              Blend 180g, queijo cheddar e bacon crocante
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black" style={{ color: primaryColor }}>
                              R$ 38,90
                            </span>
                            <div
                              className={`h-5 w-5 flex items-center justify-center text-white ${
                                themePreset === 'editorial'
                                  ? 'rounded-xs'
                                  : themePreset === 'bold'
                                  ? 'rounded-full'
                                  : 'rounded-md'
                              }`}
                              style={{ backgroundColor: primaryColor }}
                            >
                              <Plus className="w-3 h-3 stroke-[3]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : catalogLayout === 'editorial' ? (
                      /* Layout Feed / Editorial no Mockup */
                      <div
                        className={`bg-white border border-slate-200/80 overflow-hidden transition-all ${
                          themePreset === 'editorial'
                            ? 'rounded-xs shadow-none border-slate-300'
                            : themePreset === 'bold'
                            ? 'rounded-3xl shadow-[3px_3px_0px_0px_rgba(15,23,42,0.12)] border-slate-900/20'
                            : 'rounded-2xl shadow-2xs'
                        }`}
                      >
                        <div className="h-24 bg-slate-100 flex items-center justify-center text-slate-400 relative overflow-hidden">
                          <Store className="w-7 h-7 stroke-1 text-slate-300" />
                          <span
                            className="absolute top-2 left-2 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Exclusivo
                          </span>
                        </div>
                        <div className="p-2.5 space-y-1">
                          <h5
                            className={`text-xs leading-tight ${
                              themePreset === 'editorial'
                                ? 'font-serif font-black text-slate-900'
                                : themePreset === 'bold'
                                ? 'font-mono font-black text-slate-900'
                                : 'font-sans font-black text-slate-900'
                            }`}
                          >
                            Anel Solitário Diamante Nobre
                          </h5>
                          <p className="text-[8px] text-slate-500 line-clamp-1">
                            Ouro branco 18k com acabamento polido à mão.
                          </p>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-xs font-black" style={{ color: primaryColor }}>
                              R$ 1.890,00
                            </span>
                            <div
                              className={`px-2 py-1 text-[8px] font-bold text-white flex items-center gap-1 ${
                                themePreset === 'editorial'
                                  ? 'rounded-xs'
                                  : themePreset === 'bold'
                                  ? 'rounded-full'
                                  : 'rounded-lg'
                              }`}
                              style={{ backgroundColor: primaryColor }}
                            >
                              <span>Ver Opções</span>
                              <ShoppingBag className="w-2.5 h-2.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Layout Grade no Mockup (Padrão) */
                      <div
                        className={`bg-white p-2.5 border border-slate-200/80 space-y-2 transition-all ${
                          themePreset === 'editorial'
                            ? 'rounded-xs shadow-none border-slate-300'
                            : themePreset === 'bold'
                            ? 'rounded-3xl shadow-[3px_3px_0px_0px_rgba(15,23,42,0.12)] border-slate-900/20'
                            : 'rounded-2xl shadow-2xs'
                        }`}
                      >
                        <div
                          className={`h-24 bg-slate-100 flex items-center justify-center text-slate-400 relative overflow-hidden ${
                            themePreset === 'editorial'
                              ? 'rounded-xs'
                              : themePreset === 'bold'
                              ? 'rounded-2xl'
                              : 'rounded-xl'
                          }`}
                        >
                          <Store className="w-6 h-6 stroke-1 text-slate-300" />
                          <span
                            className="absolute top-1.5 left-1.5 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Mais Vendido
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <h5
                            className={`text-[11px] leading-tight ${
                              themePreset === 'editorial'
                                ? 'font-serif font-bold text-slate-900'
                                : themePreset === 'bold'
                                ? 'font-mono font-black text-slate-900'
                                : 'font-sans font-bold text-slate-900'
                            }`}
                          >
                            Vestido Midi Seda Floral
                          </h5>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-black" style={{ color: primaryColor }}>
                              R$ 189,90
                            </span>
                            <div
                              className={`h-6 w-6 flex items-center justify-center text-white ${
                                themePreset === 'editorial'
                                  ? 'rounded-xs'
                                  : themePreset === 'bold'
                                  ? 'rounded-full'
                                  : 'rounded-lg'
                              }`}
                              style={{ backgroundColor: primaryColor }}
                            >
                              <ShoppingBag className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Botão de WhatsApp Simulado no Rodapé */}
                    <div
                      className={`w-full py-2 px-3 text-white font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-xs transition-all ${
                        themePreset === 'editorial'
                          ? 'rounded-xs bg-slate-900'
                          : themePreset === 'bold'
                          ? 'rounded-full bg-emerald-600'
                          : 'rounded-xl bg-emerald-600'
                      }`}
                    >
                      <span>Pedir pelo WhatsApp</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-center text-slate-400">
                ✨ Prévia atualizada em tempo real conforme você altera as opções à esquerda.
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
