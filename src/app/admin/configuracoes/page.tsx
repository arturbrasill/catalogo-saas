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
} from 'lucide-react';

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

      setSuccessMessage('Configurações da loja salvas com sucesso!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao salvar configurações.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Configurações da Loja & Identidade Visual
          </h1>
          <p className="text-sm text-gray-500">
            Defina o nome fantasia, cores da marca, telefone do WhatsApp e logotipo.
          </p>
        </div>

        {/* Alertas */}
        {successMessage && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Carregando dados da loja...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulário de Configuração (2 Colunas) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
              <form onSubmit={handleSave} className="space-y-5">
                {/* Nome da Loja */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-gray-400" />
                    Nome da Loja *
                  </label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Ex: Minha Loja Digital"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Logotipo */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Logotipo da Loja
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://exemplo.com/logo.png"
                      className="flex-1 w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition flex-shrink-0">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={isUploadingLogo}
                        className="sr-only"
                      />
                      {isUploadingLogo ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          Fazer Upload
                        </>
                      )}
                    </label>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Insira a URL da imagem ou envie um arquivo diretamente do computador.
                  </p>
                </div>

                {/* Cores da Marca */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Cor Primária */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-gray-400" />
                      Cor Primária (Botões & Destaques)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-10 w-12 rounded-lg border border-gray-300 cursor-pointer p-1 bg-white"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        placeholder="#10b981"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Cor Secundária */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-gray-400" />
                      Cor Secundária (Fundo / Detalhes)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="h-10 w-12 rounded-lg border border-gray-300 cursor-pointer p-1 bg-white"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        placeholder="#047857"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-gray-400" />
                    Número do WhatsApp para Pedidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Ex: 5511999999999 (com DDI e DDD)"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Os clientes serão direcionados para este número ao finalizar a sacola.
                  </p>
                </div>

                {/* Domínio Próprio */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-gray-400" />
                    Domínio Próprio Associado
                  </label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="sualoja.com.br"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Configuração de apontamento de DNS (CNAME / Registro.br).
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Preview da Identidade Visual (1 Coluna) */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Preview em Tempo Real
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-md">
                {/* Header Mock com Cor Secundária */}
                <div
                  className="p-4 text-white flex items-center gap-3 transition-colors duration-200"
                  style={{ backgroundColor: secondaryColor }}
                >
                  <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center overflow-hidden flex-shrink-0">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Store className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight">
                      {storeName || 'Nome da Loja'}
                    </h4>
                    <span className="text-[11px] text-white/80">
                      {domain || 'loja-exemplo.com.br'}
                    </span>
                  </div>
                </div>

                {/* Card de Produto Simulado */}
                <div className="p-4 space-y-3 bg-gray-50/50">
                  <div className="aspect-video rounded-lg bg-gray-200 flex items-center justify-center text-xs text-gray-400 font-medium">
                    Foto do Produto
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm text-gray-900">
                      Exemplo de Produto
                    </h5>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-bold text-gray-900">
                        R$ 89,90
                      </span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Promoção
                      </span>
                    </div>
                  </div>

                  {/* Botão de WhatsApp com Cor Primária */}
                  <button
                    type="button"
                    className="w-full py-2 px-3 rounded-lg text-xs font-bold text-white shadow-xs transition duration-200 flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Pedir no WhatsApp
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-gray-100/70 p-3 text-xs text-gray-500">
                Este preview reflete como os elementos da sua marca serão exibidos aos clientes no catálogo público.
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
