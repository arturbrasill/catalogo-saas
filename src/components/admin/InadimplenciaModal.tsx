'use client';

import React, { useState } from 'react';
import type { StoreConfig } from '@/types';
import {
  AlertTriangle,
  CreditCard,
  QrCode,
  ExternalLink,
  RefreshCw,
  X,
  CheckCircle2,
  Copy,
  Lock,
  MessageCircle,
} from 'lucide-react';

interface InadimplenciaModalProps {
  store: StoreConfig;
  isOpen: boolean;
  onClose: () => void;
  onRefreshStatus?: () => void;
}

export function InadimplenciaModal({
  store,
  isOpen,
  onClose,
  onRefreshStatus,
}: InadimplenciaModalProps) {
  const [copiedPix, setCopiedPix] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [showPixDetails, setShowPixDetails] = useState(false);

  if (!isOpen) return null;

  // Código Pix Copia e Cola padrão ou link da fatura
  const invoiceUrl = store.asaas_payment_link || '/admin/configuracoes?tab=subscription';
  const pixKeySimulated =
    '00020126580014br.gov.bcb.pix0136numclick-faturas@asaas.com.br520400005303986540579.905802BR5920NumClick Tecnologia6009Sao Paulo62070503***6304B9A2';

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKeySimulated);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleVerify = async () => {
    setCheckingPayment(true);
    try {
      if (onRefreshStatus) {
        await onRefreshStatus();
      } else {
        window.location.reload();
      }
    } finally {
      setTimeout(() => setCheckingPayment(false), 1200);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inadimplencia-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 transition-all">
        {/* Top Header com Gradiente */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar aviso"
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white/90 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full inline-block">
                Assinatura Pendente
              </span>
              <h2 id="inadimplencia-title" className="text-xl font-black tracking-tight mt-1 text-white">
                Seu Teste Gratuito de 7 Dias Expirou
              </h2>
            </div>
          </div>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 sm:p-7 space-y-5">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            O período de degustação de 7 dias da loja <strong>{store.store_name}</strong> terminou.
            Para manter seu catálogo público online e continuar recebendo pedidos pelo WhatsApp, regularize sua assinatura mensal.
          </p>

          {/* Card Resumo do Plano */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Plano Selecionado
              </span>
              <span className="font-extrabold text-sm sm:text-base text-slate-900">
                Plano Mensal NumClick
              </span>
              <span className="text-xs text-slate-500 block">Sem fidelidade • Cancele quando quiser</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-600 tracking-tight">R$ 79,90</span>
              <span className="text-[10px] text-slate-400 block font-medium">/mês</span>
            </div>
          </div>

          {/* Opção PIX Instantâneo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowPixDetails(!showPixDetails)}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer underline"
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>{showPixDetails ? 'Ocultar QR Code PIX' : 'Pagar via QR Code PIX (Liberação Imediata)'}</span>
              </button>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Mais Rápido
              </span>
            </div>

            {showPixDetails && (
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3 animate-fade-in text-center">
                <p className="text-xs text-emerald-900 font-medium">
                  Escaneie o QR Code abaixo no app do seu banco ou use a chave Copia e Cola:
                </p>
                <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl border border-emerald-300 shadow-xs flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      pixKeySimulated
                    )}`}
                    alt="QR Code PIX R$ 79,90"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pixKeySimulated}
                    className="flex-1 px-3 py-1.5 text-[11px] font-mono bg-white border border-emerald-200 rounded-lg text-slate-600 truncate focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedPix ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="space-y-2.5 pt-2">
            <a
              href={invoiceUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Pagar Fatura no Asaas (R$ 79,90)</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handleVerify}
                disabled={checkingPayment}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingPayment ? 'animate-spin' : ''}`} />
                <span>{checkingPayment ? 'Verificando...' : 'Já Paguei • Atualizar Status'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-800 font-semibold text-xs transition cursor-pointer"
              >
                Lembrar Mais Tarde
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé com Suporte */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Dúvidas ou suporte com pagamentos?</span>
          {store.whatsapp && (
            <a
              href={`https://wa.me/5511999999999?text=${encodeURIComponent(
                `Olá, preciso de ajuda com a assinatura da minha loja ${store.store_name} no NumClick.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Falar no WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
