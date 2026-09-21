'use client';

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { imageUploadService } from '@/lib/imageUploadService';
import type { StoreConfig } from '@/types';
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
  Eye,
  Smartphone,
  Save,
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

export default function AdminConfiguracoesPage() {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Campos de Configuração
  const [storeName, setStoreName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [secondaryColor, setSecondaryColor] = useState('#047857');
  const [whatsapp, setWhatsapp] = useState('');
  const [domain, setDomain] = useState('');

  const loadConfig = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getStore();
      setStoreName(String(data.store_name ?? ''));
      setLogoUrl(String(data.logo_url ?? ''));
      setPrimaryColor(String(data.primary_color ?? '#10b981'));
      setSecondaryColor(String(data.secondary_color ?? '#047857'));
      setWhatsapp(String(data.whatsapp ?? ''));
      setDomain(String(data.domain ?? ''));
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      let cleanWhatsapp = String(whatsapp ?? '').replace(/\D/g, '').replace(/^0+/, '');
      if ((cleanWhatsapp.length === 10 || cleanWhatsapp.length === 11) && !cleanWhatsapp.startsWith('55')) {
        cleanWhatsapp = '55' + cleanWhatsapp;
      }
      const updated = await api.saveConfig(
        {
          store_name: String(storeName ?? '').trim(),
          logo_url: String(logoUrl ?? '').trim(),
          primary_color: String(primaryColor ?? '#10b981').trim(),
          secondary_color: String(secondaryColor ?? '#047857').trim(),
          whatsapp: cleanWhatsapp,
          domain: String(domain ?? '').trim(),
        },
        token
      );

      setStoreName(String(updated.store_name ?? ''));
      setLogoUrl(String(updated.logo_url ?? ''));
      setPrimaryColor(String(updated.primary_color ?? '#10b981'));
      setSecondaryColor(String(updated.secondary_color ?? '#047857'));
      setWhatsapp(String(updated.whatsapp ?? ''));
      setDomain(String(updated.domain ?? ''));

      setSuccessMessage('Configurações da loja e identidade visual atualizadas com sucesso!');
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
            Personalize o nome fantasia, cores da marca, telefone de atendimento e logotipo da sua loja.
          </p>
        </div>

        {/* Alertas */}
        {successMessage && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs sm:text-sm text-emerald-800 flex items-center gap-2.5 shadow-xs">
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs sm:text-sm text-rose-800 flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">Carregando configurações da loja...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Coluna 1: Formulário de Configuração (7 colunas no desktop) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <form onSubmit={handleSave} className="space-y-5">
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
                    placeholder="Ex: Minha Loja Digital"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Aparecerá no cabeçalho da vitrine, mensagens do WhatsApp e na barra do navegador.
                  </span>
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
                      className="flex-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <label className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer transition shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isUploadingLogo ? 'Enviando...' : 'Fazer Upload'}</span>
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

                {/* WhatsApp de Atendimento */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp de Atendimento & Vendas *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Ex: 5511999998888"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Formato com DDD (ex: 5511999998888). O cliente será direcionado a este número para fechar o pedido.
                  </span>
                </div>

                {/* Paleta de Cores e Temas */}
                <div className="pt-3 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-slate-400" />
                        Cores da Marca
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Escolha um preset ou digite o código HEX da sua paleta.
                      </span>
                    </div>
                  </div>

                  {/* Presets Rápidos */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setPrimaryColor(preset.primary);
                          setSecondaryColor(preset.secondary);
                        }}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 text-xs font-medium transition cursor-pointer ${
                          primaryColor.toLowerCase() === preset.primary.toLowerCase()
                            ? 'border-slate-900 bg-slate-50 font-bold shadow-2xs'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className="h-5 w-5 rounded-full shadow-xs flex-shrink-0"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <span className="truncate text-slate-800">{preset.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Pickers HEX customizados */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Cor Primária (Botões e Destaques)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="h-9 w-9 rounded-lg border border-slate-300 p-0.5 cursor-pointer flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Cor Secundária
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="h-9 w-9 rounded-lg border border-slate-300 p-0.5 cursor-pointer flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-mono"
                        />
                      </div>
                    </div>
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
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Botão de Salvar */}
                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Salvando Configurações...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Salvar Alterações</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Coluna 2: Preview Interativo em Tempo Real (5 colunas no desktop) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Pré-visualização em Tempo Real</span>
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full font-semibold">
                  Visual do Catálogo
                </span>
              </div>

              {/* Mockup de Celular com Vitrine Interativa */}
              <div className="bg-slate-900 p-3.5 rounded-[2.5rem] shadow-2xl border-4 border-slate-800 max-w-sm mx-auto">
                <div className="bg-slate-50 rounded-[2rem] overflow-hidden flex flex-col min-h-[500px] border border-slate-200">
                  {/* Notch / Barra Superior */}
                  <div className="bg-slate-900 text-white text-[10px] py-1 px-4 flex items-center justify-between font-bold">
                    <span>9:41</span>
                    <div className="h-2 w-10 bg-slate-800 rounded-full" />
                    <span>5G • 100%</span>
                  </div>

                  {/* Header Simulado da Loja */}
                  <div className="bg-white p-3.5 border-b border-slate-200 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
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
                      <div>
                        <span className="font-extrabold text-xs text-slate-900 block leading-tight">
                          {storeName || 'Nome da Loja'}
                        </span>
                        <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Online
                        </span>
                      </div>
                    </div>

                    <div
                      className="h-8 w-8 rounded-xl flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Corpo Simulado do Catálogo */}
                  <div className="p-3 space-y-3 flex-1">
                    {/* Banner Simulado */}
                    <div
                      className="p-3 rounded-2xl text-white space-y-1 shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <span className="text-[9px] font-extrabold uppercase tracking-wider opacity-90">
                        Destaque da Semana
                      </span>
                      <h4 className="text-xs font-black leading-tight">
                        Encontre os melhores produtos aqui!
                      </h4>
                    </div>

                    {/* Card de Produto Exemplo */}
                    <div className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-2xs space-y-2">
                      <div className="h-28 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 relative overflow-hidden">
                        <Store className="w-8 h-8 stroke-1 text-slate-300" />
                        <span
                          className="absolute top-2 left-2 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: primaryColor }}
                        >
                          -20%
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400">★ 4.9 • Avaliação</span>
                        <h5 className="text-xs font-bold text-slate-900">
                          Exemplo de Produto
                        </h5>
                        <div className="flex items-center justify-between pt-1">
                          <span
                            className="text-xs font-black"
                            style={{ color: primaryColor }}
                          >
                            R$ 79,90
                          </span>
                          <div
                            className="h-6 w-6 rounded-lg flex items-center justify-center text-white shadow-2xs"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <ShoppingBag className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botão de Checkout WhatsApp Simulado */}
                    <div
                      className="w-full py-2.5 px-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span>Comprar pelo WhatsApp</span>
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
