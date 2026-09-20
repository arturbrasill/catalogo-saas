'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertOctagon, RefreshCw, HelpCircle } from 'lucide-react';

function TenantNotFoundContent() {
  const searchParams = useSearchParams();
  const host = searchParams.get('host') || 'Domínio não informado';

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center space-y-6">
      {/* Ícone */}
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-xs">
        <AlertOctagon className="w-8 h-8" />
      </div>

      {/* Título & Mensagem */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Loja Não Encontrada
        </h1>
        <p className="text-sm text-gray-600">
          O endereço que você tentou acessar não está associado a nenhuma loja cadastrada nesta plataforma.
        </p>
      </div>

      {/* Domínio Consultado */}
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-200/80 font-mono text-xs text-gray-700 break-all">
        <span className="text-gray-400 block text-[10px] uppercase font-sans font-semibold mb-1">
          Host Solicitado
        </span>
        {host}
      </div>

      {/* Orientações */}
      <div className="text-left bg-blue-50/50 rounded-xl p-4 border border-blue-100 text-xs text-blue-900 space-y-1.5">
        <div className="font-semibold flex items-center gap-1.5 text-blue-800">
          <HelpCircle className="w-4 h-4" />
          Você é o lojista deste domínio?
        </div>
        <p className="text-blue-700/90 leading-relaxed">
          1. Verifique se o domínio foi registrado no painel administrativo do SaaS.
          <br />
          2. Se alterou o DNS recentemente, a propagação pode levar até algumas horas.
        </p>
      </div>

      {/* Botão de Ação */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-black text-white text-sm font-semibold shadow-sm transition"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar Novamente
        </button>
      </div>

      <div className="text-[11px] text-gray-400">
        SaaS Catálogo Multi-Tenant • Isolamento de dados garantido
      </div>
    </div>
  );
}

export default function TenantNotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
