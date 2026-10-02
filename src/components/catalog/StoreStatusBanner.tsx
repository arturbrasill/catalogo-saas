'use client';

import React, { useState, useEffect } from 'react';
import { Clock, X, MessageSquare, Info, ChevronDown, ChevronUp } from 'lucide-react';
import type { StoreConfig } from '@/types';
import { getStoreStatus } from '@/lib/storeStatus';

interface StoreStatusBannerProps {
  store?: Partial<StoreConfig> | null;
}

export function StoreStatusBanner({ store }: StoreStatusBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const status = getStoreStatus(store);

  // Se a loja estiver aberta, não há necessidade de banner intrusivo (o badge no header cumpre o papel)
  if (status.isOpen || isDismissed) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border-b border-amber-300/60 text-amber-950 px-4 py-2.5 sm:py-3 transition-all animate-fade-in select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-amber-100/90 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0 shadow-2xs border border-amber-200">
            <Clock className="w-4 h-4 stroke-[2.2]" />
          </div>

          <div className="text-xs min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                {status.headline}
              </span>
              {status.businessHours && (
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.2 rounded-md border border-amber-200/70">
                  Horário: {status.businessHours}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-amber-900/90 leading-snug mt-0.5">
              Você ainda pode navegar, escolher seus produtos e enviar seu pedido para nossa{' '}
              <strong className="font-bold underline decoration-amber-400">fila de atendimento no WhatsApp</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="text-amber-800 hover:text-amber-950 hover:bg-amber-200/50 p-1.5 rounded-lg transition cursor-pointer"
            title="Fechar aviso de horário"
            aria-label="Fechar aviso de horário"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
