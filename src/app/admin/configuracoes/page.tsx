'use client';

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { imageUploadService } from '@/lib/imageUploadService';
import { maskWhatsApp, normalizeWhatsAppToApi } from '@/lib/masks';
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
  MessageCircle,
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
  Type,
  LayoutGrid,
  List as ListIcon,
  BookOpen,
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

const BG_PRESETS = [
  { name: 'Gelo (Padrão)', hex: '#f8fafc' },
  { name: 'Branco Puro', hex: '#ffffff' },
  { name: 'Creme Suave', hex: '#faf8f5' },
  { name: 'Cinza Suave', hex: '#f1f5f9' },
  { name: 'Dark Mode', hex: '#0f172a' },
];

const TEXT_PRESETS = [
  { name: 'Escuro (Padrão)', hex: '#0f172a' },
  { name: 'Grafite', hex: '#1e293b' },
  { name: 'Preto Total', hex: '#000000' },
  { name: 'Claro (p/ Dark)', hex: '#f8fafc' },
];

export default function AdminConfiguracoesPage() {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Campos de Configuração
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

  const loadConfig = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getStore();
      setStoreName(String(data.store_name ?? ''));
      setLogoUrl(String(data.logo_url ?? ''));
      setPrimaryColor(String(data.primary_color ?? '#10b981'));
      setSecondaryColor(String(data.secondary_color ?? '#047857'));
      setBackgroundColor(String(data.background_color ?? '#f8fafc'));
      setTextColor(String(data.text_color ?? '#0f172a'));
      setBanners(Array.isArray(data.banners) ? data.banners.slice(0, 3) : []);
      // Aplica máscara ao carregar da API
      setWhatsapp(maskWhatsApp(String(data.whatsapp ?? '')));
      setDomain(String(data.domain ?? ''));
      setIsOpen(data.is_open !== undefined ? Boolean(data.is_open) : true);
      setBusinessHours(String(data.business_hours ?? ''));
      setPixKey(String(data.pix_key ?? ''));
      setPixKeyType((data.pix_key_type as any) || 'cpf');
      setThemePreset((data.theme_preset as ThemePreset) || 'modern');
      setCatalogLayout((data.catalog_layout as CatalogLayoutMode) || 'grid');
      setAnnouncementEnabled(
        data.announcement_enabled !== undefined ? Boolean(data.announcement_enabled) : true
      );
      setAnnouncementText(
        String(
          data.announcement_text ??
            'Compre online e receba em casa com frete seguro ou retire na loja física'
        )
      );
      setAnnouncementBgColor(String(data.announcement_bg_color ?? '#0f172a'));
      setAnnouncementTextColor(String(data.announcement_text_color ?? '#ffffff'));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao carregar configurações.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

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
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao enviar imagem do banner.');
    } finally {
      setIsUploadingBanner(false);
      e.target.value = '';
    }
  };

  const handleAddBannerUrl = () => {
    const trimmed = newBannerInput.trim();
    if (!trimmed) return;
    if (banners.length >= 3) {
      alert('Você já atingiu o limite de 3 banners.');
      return;
    }
    setBanners((prev) => [...prev, trimmed].slice(0, 3));
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
        },
        token
      );

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
        updated.announcement_enabled !== undefined ? Boolean(updated.announcement_enabled) : true
      );
      setAnnouncementText(
        String(
          updated.announcement_text ??
            'Compre online e receba em casa com frete seguro ou retire na loja física'
        )
      );
      setAnnouncementBgColor(String(updated.announcement_bg_color ?? '#0f172a'));
      setAnnouncementTextColor(String(updated.announcement_text_color ?? '#ffffff'));

      setSuccessMessage('Configurações da loja, temas e barra de anúncios salvas com sucesso!');

      // Atualiza variáveis CSS dinâmicas e tokens em tempo real
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
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Identidade Visual & Configurações
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Personalize cor primária da marca com color picker, WhatsApp mascarado, banners de topo e dados da loja.
          </p>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Coluna 1: Formulário de Configuração (7 colunas) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <form onSubmit={handleSave} className="space-y-6">
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

                {/* Gerenciamento de Banners de Topo */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                        Banners do Topo do Catálogo ({banners.length}/3)
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Exibidos no topo com carrossel deslizante e toque tátil. Recomendado: proporção 16:9 ou 21:9.
                      </p>
                    </div>
                    {banners.length < 3 && (
                      <button
                        type="button"
                        onClick={() => setShowBannerUrlInput(!showBannerUrlInput)}
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline transition cursor-pointer"
                      >
                        {showBannerUrlInput ? 'Ocultar URL' : '+ Adicionar por Link'}
                      </button>
                    )}
                  </div>

                  {/* Adicionar por URL direta */}
                  {showBannerUrlInput && banners.length < 3 && (
                    <div className="flex gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 animate-fade-in">
                      <div className="relative flex-1">
                        <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="url"
                          placeholder="Cole o link direto da imagem do banner..."
                          value={newBannerInput}
                          onChange={(e) => setNewBannerInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddBannerUrl();
                            }
                          }}
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

                  {/* Lista de Banners Atuais com Prévia e Ações */}
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
                        <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                          Banner {idx + 1}
                        </span>

                        {/* Botões de Ação no Hover */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveBanner(idx, 'up')}
                              className="p-1 bg-slate-900/80 text-white rounded-md hover:bg-slate-900 transition"
                              title="Mover para esquerda/anterior"
                            >
                              <ArrowUp className="w-3 h-3 -rotate-90" />
                            </button>
                          )}
                          {idx < banners.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveBanner(idx, 'down')}
                              className="p-1 bg-slate-900/80 text-white rounded-md hover:bg-slate-900 transition"
                              title="Mover para direita/próximo"
                            >
                              <ArrowDown className="w-3 h-3 -rotate-90" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveBanner(idx)}
                            className="p-1 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition cursor-pointer"
                            title="Remover banner"
                            aria-label={`Remover banner ${idx + 1}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Slot de Upload se < 3 */}
                    {banners.length < 3 && (
                      <label
                        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-800 hover:bg-slate-50 aspect-[16/9] cursor-pointer transition ${
                          isUploadingBanner ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          disabled={isUploadingBanner}
                          className="sr-only"
                        />
                        {isUploadingBanner ? (
                          <div className="flex flex-col items-center gap-1 text-slate-700">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-[10px] font-bold">Enviando Banner...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-slate-500">
                            <Upload className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold">+ Upload Banner</span>
                            <span className="text-[9px] text-slate-400">Dimensão ideal: 1200x500px</span>
                          </div>
                        )}
                      </label>
                    )}
                  </div>
                </div>

                {/* Seletor de Cores (Color Picker Primário + Presets da Marca) */}
                <div className="pt-3 border-t border-slate-100 space-y-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-emerald-600" />
                      Seletor de Cores da Marca (Color Picker)
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      A cor primária define os botões de compra, destaques e badges da sua loja.
                    </p>
                  </div>

                  {/* Presets Rápidos */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-600">Paletas Recomendadas:</span>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setPrimaryColor(preset.primary);
                            setSecondaryColor(preset.secondary);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                            primaryColor.toLowerCase() === preset.primary.toLowerCase()
                              ? 'border-slate-800 bg-slate-900 text-white shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                            style={{ backgroundColor: preset.primary }}
                          />
                          <span>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Picker Personalizado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Cor Primária */}
                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                      <label className="block text-xs font-bold text-slate-800">
                        Cor Primária da Marca
                      </label>
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="h-10 w-10 rounded-xl border-2 border-white shadow-xs cursor-pointer p-0"
                            aria-label="Seletor visual de cor primária"
                          />
                        </div>
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          placeholder="#10b981"
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-semibold uppercase text-slate-800 focus:outline-none focus:border-slate-800"
                        />
                      </div>
                    </div>

                    {/* Cor de Fundo do Catálogo */}
                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                      <label className="block text-xs font-bold text-slate-800">
                        Cor de Fundo da Vitrine
                      </label>
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <input
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="h-10 w-10 rounded-xl border-2 border-white shadow-xs cursor-pointer p-0"
                            aria-label="Seletor visual de cor de fundo"
                          />
                        </div>
                        <input
                          type="text"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          placeholder="#f8fafc"
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-semibold uppercase text-slate-800 focus:outline-none focus:border-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seletor de Tema Visual (Themes Presets) */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      Temas Visuais & Tipografia (Presets de Estilo)
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Altera instantaneamente a tipografia dos títulos e o arredondamento dos cartões e botões da sua loja.
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
                              className={`text-[11px] leading-relaxed mb-2 ${
                                isSelected ? 'text-slate-300' : 'text-slate-500'
                              }`}
                            >
                              {preset.description}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                            <span
                              className={
                                isSelected
                                  ? 'text-slate-300 font-medium'
                                  : 'text-slate-400 font-medium'
                              }
                            >
                              Títulos:{' '}
                              <strong
                                className={isSelected ? 'text-white' : 'text-slate-800'}
                              >
                                {preset.fontTitle}
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

                {/* Seletor de Modo de Exibição dos Produtos (Layout da Vitrine) */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <LayoutGrid className="w-4 h-4 text-emerald-600" />
                      Modo de Exibição dos Produtos (Layout da Vitrine)
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Defina como os cartões de produtos serão apresentados para os seus clientes por padrão.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Modo Grid */}
                    <button
                      type="button"
                      onClick={() => setCatalogLayout('grid')}
                      className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        catalogLayout === 'grid'
                          ? 'border-slate-900 bg-slate-900 text-white shadow-md ring-2 ring-slate-900/10'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span
                            className={`text-xs font-black tracking-tight ${
                              catalogLayout === 'grid' ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            Grade Dupla
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              catalogLayout === 'grid'
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            2 / 4 Colunas
                          </span>
                        </div>
                        <p
                          className={`text-[11px] leading-relaxed mb-2 ${
                            catalogLayout === 'grid' ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          2 colunas no celular e 4 colunas no computador. Ideal para moda, roupas, calçados e vitrines visuais.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                        <span className={catalogLayout === 'grid' ? 'text-slate-300' : 'text-slate-400'}>
                          Ideal: <strong className={catalogLayout === 'grid' ? 'text-white' : 'text-slate-800'}>Moda & Roupas</strong>
                        </span>
                        {catalogLayout === 'grid' && (
                          <span className="flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500 text-white">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Modo List */}
                    <button
                      type="button"
                      onClick={() => setCatalogLayout('list')}
                      className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        catalogLayout === 'list'
                          ? 'border-slate-900 bg-slate-900 text-white shadow-md ring-2 ring-slate-900/10'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span
                            className={`text-xs font-black tracking-tight ${
                              catalogLayout === 'list' ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            Lista Compacta
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              catalogLayout === 'list'
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            Horizontal
                          </span>
                        </div>
                        <p
                          className={`text-[11px] leading-relaxed mb-2 ${
                            catalogLayout === 'list' ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          Card horizontal com imagem à esquerda, nome, descrição, preço e botão &apos;+&apos; à direita. Ideal para alimentação e cardápios densos.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                        <span className={catalogLayout === 'list' ? 'text-slate-300' : 'text-slate-400'}>
                          Ideal: <strong className={catalogLayout === 'list' ? 'text-white' : 'text-slate-800'}>Alimentação & Delivery</strong>
                        </span>
                        {catalogLayout === 'list' && (
                          <span className="flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500 text-white">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Modo Editorial */}
                    <button
                      type="button"
                      onClick={() => setCatalogLayout('editorial')}
                      className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        catalogLayout === 'editorial'
                          ? 'border-slate-900 bg-slate-900 text-white shadow-md ring-2 ring-slate-900/10'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span
                            className={`text-xs font-black tracking-tight ${
                              catalogLayout === 'editorial' ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            Editorial Amplo
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              catalogLayout === 'editorial'
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            1 Coluna
                          </span>
                        </div>
                        <p
                          className={`text-[11px] leading-relaxed mb-2 ${
                            catalogLayout === 'editorial' ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          1 coluna com imagem grande e espaçamento generoso. Ideal para joalherias, peças exclusivas e coleções de alto padrão.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                        <span className={catalogLayout === 'editorial' ? 'text-slate-300' : 'text-slate-400'}>
                          Ideal: <strong className={catalogLayout === 'editorial' ? 'text-white' : 'text-slate-800'}>Luxo & Exclusivo</strong>
                        </span>
                        {catalogLayout === 'editorial' && (
                          <span className="flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500 text-white">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Barra de Anúncios Fixa no Topo (Top Announcement Bar / Ticker) */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Megaphone className="w-4 h-4 text-emerald-600" />
                        Barra de Anúncios no Topo (Top Announcement Bar)
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Exiba ofertas imperdíveis, avisos de frete ou cupons no topo de todo o catálogo.
                      </p>
                    </div>

                    {/* Toggle de Ativação */}
                    <button
                      type="button"
                      onClick={() => setAnnouncementEnabled(!announcementEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        announcementEnabled ? 'bg-emerald-600' : 'bg-slate-200'
                      }`}
                      aria-label="Ativar barra de anúncios"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          announcementEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {announcementEnabled && (
                    <div className="space-y-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 animate-fade-in">
                      {/* Input de Texto do Anúncio */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-800">
                            Texto do Anúncio / Slogan
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
                          placeholder="Ex: Compre online e receba em casa com frete grátis acima de R$ 199"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                        />
                      </div>

                      {/* Sugestões Rápidas de Anúncio */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Ideias Rápidas de Anúncio (Clique para Usar):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {ANNOUNCEMENT_SUGGESTIONS.map((sug, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setAnnouncementText(sug)}
                              className="text-[10px] px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-400 text-slate-600 hover:text-slate-900 transition cursor-pointer text-left truncate max-w-xs"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Seletor de Cores da Barra de Anúncio */}
                      <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Cor de Fundo */}
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
                          {/* Presets Rápidos de Fundo */}
                          <div className="flex flex-wrap gap-1 pt-1">
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

                        {/* Cor do Texto */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            Cor do Texto da Barra
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
                          {/* Presets Rápidos de Texto */}
                          <div className="flex gap-1.5 pt-1">
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
                              Amarelo Ouro
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* WhatsApp com Máscara (DD) 9XXXX-XXXX */}
                <div className="pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp de Atendimento da Loja *</span>
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-1 text-[11px] text-slate-400">
                    <span>Digite o DDD e o número com 9 dígitos. Máscara aplicada automaticamente.</span>
                    {whatsapp && (
                      <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 self-start sm:self-auto">
                        API: +{normalizeWhatsAppToApi(whatsapp)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Domínio Customizado (Opcional) */}
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
                    <span>Status de Atendimento da Loja</span>
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

                {/* Chave PIX da Loja */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <span>Chave PIX da Loja (Para Checkout Ágil)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={pixKeyType}
                      onChange={(e) => setPixKeyType(e.target.value as any)}
                      className="rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white focus:border-slate-800 focus:outline-none"
                    >
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="phone">Celular (com DDD)</option>
                      <option value="email">E-mail</option>
                      <option value="random">Chave Aleatória</option>
                    </select>
                    <input
                      type="text"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="Ex: 11999998888 ou pix@minhaloja.com"
                      className="sm:col-span-2 rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/5 font-mono"
                    />
                  </div>
                </div>

                {/* Botão de Salvar */}
                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                        <span>Salvando Configurações...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Salvar Todas as Alterações</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Coluna 2: Preview Interativo em Tempo Real (5 colunas) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Pré-visualização em Tempo Real</span>
                </div>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-semibold">
                  Visual Mobile do Catálogo
                </span>
              </div>

              {/* Mockup de Celular */}
              <div className="bg-slate-900 p-3.5 rounded-[2.5rem] shadow-2xl border-4 border-slate-800 max-w-sm mx-auto">
                <div
                  className="rounded-[2rem] overflow-hidden flex flex-col min-h-[520px] border border-slate-200 transition-colors"
                  style={{
                    backgroundColor: backgroundColor,
                    color: textColor,
                  }}
                >
                  {/* Notch / Barra Superior */}
                  <div className="bg-slate-900 text-white text-[10px] py-1 px-4 flex items-center justify-between font-bold">
                    <span>9:41</span>
                    <div className="h-2 w-10 bg-slate-800 rounded-full" />
                    <span>5G • 100%</span>
                  </div>

                  {/* Barra de Anúncios no Topo Simulada */}
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

                  {/* Header Simulado da Loja */}
                  <div className="bg-white/95 backdrop-blur-xs p-3.5 border-b border-slate-200 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`h-8 w-8 bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0 ${
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
                          <Store className="w-4 h-4 text-slate-500" />
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
                        <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1">
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

                  {/* Corpo Simulado com Banners */}
                  <div className="p-3 space-y-3 flex-1">
                    {/* Banners no Início */}
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
                        {banners.length > 1 && (
                          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 bg-black/40 px-2 py-0.5 rounded-full">
                            {banners.map((_, i) => (
                              <div
                                key={i}
                                className={`h-1 rounded-full ${i === 0 ? 'w-3 bg-white' : 'w-1 bg-white/50'}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`p-3 border border-dashed border-slate-300 text-center text-[10px] text-slate-400 ${
                          themePreset === 'editorial'
                            ? 'rounded-xs'
                            : themePreset === 'bold'
                            ? 'rounded-3xl'
                            : 'rounded-2xl'
                        }`}
                      >
                        Nenhum banner cadastrado
                      </div>
                    )}

                    {/* Card de Produto Exemplo com o Preset de Tema e o Layout Aplicado */}
                    {catalogLayout === 'list' ? (
                      /* Layout List no Mockup */
                      <div
                        className={`bg-white p-2 border border-slate-200/80 flex items-stretch gap-2.5 transition-all ${
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
                              Blend 180g, queijo cheddar, bacon crocante
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
                      /* Layout Editorial no Mockup */
                      <div
                        className={`bg-white border border-slate-200/80 overflow-hidden transition-all ${
                          themePreset === 'editorial'
                            ? 'rounded-xs shadow-none border-slate-300'
                            : themePreset === 'bold'
                            ? 'rounded-3xl shadow-[3px_3px_0px_0px_rgba(15,23,42,0.12)] border-slate-900/20'
                            : 'rounded-2xl shadow-2xs'
                        }`}
                      >
                        <div className="h-28 bg-slate-100 flex items-center justify-center text-slate-400 relative overflow-hidden">
                          <Store className="w-8 h-8 stroke-1 text-slate-300" />
                          <span
                            className={`absolute top-2 left-2 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider`}
                            style={{ backgroundColor: primaryColor }}
                          >
                            Exclusivo
                          </span>
                        </div>
                        <div className="p-2.5 space-y-1.5">
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
                          <p className="text-[9px] text-slate-500 line-clamp-2 leading-relaxed">
                            Ouro branco 18k com acabamento polido à mão e certificado.
                          </p>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-xs font-black" style={{ color: primaryColor }}>
                              R$ 1.890,00
                            </span>
                            <div
                              className={`px-2 py-1 text-[9px] font-bold text-white flex items-center gap-1 ${
                                themePreset === 'editorial'
                                  ? 'rounded-xs'
                                  : themePreset === 'bold'
                                  ? 'rounded-full'
                                  : 'rounded-lg'
                              }`}
                              style={{ backgroundColor: primaryColor }}
                            >
                              <span>Ver</span>
                              <ShoppingBag className="w-2.5 h-2.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Layout Grid no Mockup (Padrão) */
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
                            className={`absolute top-1.5 left-1.5 text-white text-[8px] font-black px-1.5 py-0.5 ${
                              themePreset === 'editorial'
                                ? 'rounded-xs'
                                : 'rounded-full'
                            }`}
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
                            <span
                              className="text-xs font-black"
                              style={{ color: primaryColor }}
                            >
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

                    {/* Botão de WhatsApp com o Estilo do Preset */}
                    <div
                      className={`w-full py-2.5 px-3 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-all ${
                        themePreset === 'editorial'
                          ? 'rounded-xs tracking-wider uppercase text-[10px]'
                          : themePreset === 'bold'
                          ? 'rounded-full tracking-tight text-xs'
                          : 'rounded-2xl'
                      }`}
                      style={{ backgroundColor: primaryColor }}
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-current" />
                      <span>{whatsapp ? `Chamar: ${whatsapp}` : 'Comprar pelo WhatsApp'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
