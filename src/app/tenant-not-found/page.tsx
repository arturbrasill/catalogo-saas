'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertOctagon, RefreshCw, HelpCircle, Sparkles } from 'lucide-react';

function TenantNotFoundContent() {
  const searchParams = useSearchParams();
  const rawHost = searchParams.get('host') || 'Domínio não informado';
  const host =
    rawHost.replace(/[^a-zA-Z0-9.:_-]/g, '').slice(0, 100) ||
    'Domínio não informado';

  return (
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#212529]/10 p-8 text-center space-y-6">
      <div className="flex items-center justify-center gap-2">
        <div className="h-8 w-8 rounded-xl overflow-hidden bg-[#212529] border border-[#212529]/20 flex items-center justify-center shadow-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/numclick-badge.png" alt="NumClick" className="w-full h-full object-cover" />
        </div>
        <span className="font-extrabold text-[#212529] text-base">
          Num<span className="text-[#FB5607]">Click</span>
        </span>
      </div>

      {/* Ícone */}
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FB5607]/10 text-[#FB5607] border border-[#FB5607]/25 shadow-xs">
        <AlertOctagon className="w-8 h-8" />
      </div>

      {/* Título & Mensagem */}
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-[#212529] tracking-tight">
          Loja Não Encontrada
        </h1>
        <p className="text-sm text-[#212529]/70">
          O endereço que você tentou acessar não está associado a nenhuma loja cadastrada nesta plataforma.
        </p>
      </div>

      {/* Endereço Consultado */}
      <div className="bg-[#E9ECEF] rounded-xl p-3 border border-[#212529]/10 font-mono text-xs text-[#212529] break-all">
        <span className="text-[#212529]/50 block text-[10px] uppercase font-sans font-bold mb-1">
          Endereço Solicitado
        </span>
        {host}
      </div>

      {/* Orientações */}
      <div className="text-left bg-[#8338EC]/10 rounded-xl p-4 border border-[#8338EC]/25 text-xs text-[#212529] space-y-1.5">
        <div className="font-bold flex items-center gap-1.5 text-[#8338EC]">
          <HelpCircle className="w-4 h-4" />
          Você é o lojista?
        </div>
        <p className="text-[#212529]/80 leading-relaxed">
          1. Verifique se o slug da vitrine está digitado corretamente no navegador.
          <br />
          2. Confira o link oficial da sua loja no Painel Administrativo em Configurações.
        </p>
      </div>

      {/* Botão de Ação */}
      <div className="pt-2 space-y-2.5">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#212529] hover:bg-black text-[#E9ECEF] text-sm font-bold shadow-sm transition cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar Novamente
        </button>

        <div className="flex items-center gap-2 pt-2">
          <Link
            href="/landing"
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#212529]/15 bg-[#E9ECEF]/50 hover:bg-[#E9ECEF] text-[#212529] text-xs font-bold transition"
          >
            <span>Conhecer o SaaS</span>
          </Link>

          <Link
            href="/criar-loja"
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#FB5607] hover:bg-[#8338EC] text-white text-xs font-bold transition shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Criar Minha Loja</span>
          </Link>
        </div>
      </div>

      <div className="text-[11px] text-[#212529]/50">
        NumClick SaaS • Catálogos Digitais Multi-Tenant
      </div>
    </div>
  );
}

export default function TenantNotFoundPage() {
  return (
    <div className="min-h-screen bg-[#E9ECEF] flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <p className="text-sm text-gray-500 animate-pulse">Carregando informações...</p>
          </div>
        }
      >
        <TenantNotFoundContent />
      </Suspense>
    </div>
  );
}
