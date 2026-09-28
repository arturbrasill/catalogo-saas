'use client';

import React, { useState } from 'react';
import type { StoreConfig } from '@/types';
import { MessageCircle, X, Sparkles, Megaphone } from 'lucide-react';

interface TopAnnouncementBarProps {
  store?: StoreConfig | null;
}

export function TopAnnouncementBar({ store }: TopAnnouncementBarProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Se o lojista desabilitou explicitamente ou não está visível
  if (!isVisible) return null;
  if (store?.announcement_enabled === false) return null;

  const defaultText =
    'Compre online e receba em casa com frete seguro ou retire na loja física';
  const announcementText = (store?.announcement_text || defaultText).trim();

  const customBg = store?.announcement_bg_color || 'var(--announcement-bg, #0f172a)';
  const customText = store?.announcement_text_color || 'var(--announcement-text, #ffffff)';
  const whatsappClean = store?.whatsapp ? String(store.whatsapp).replace(/\D/g, '') : '';

  return (
    <aside
      aria-label="Aviso da Loja"
      className="relative z-40 text-[11px] sm:text-xs font-semibold py-2 px-3 sm:px-4 border-b border-black/10 transition-all shadow-2xs"
      style={{
        backgroundColor: customBg,
        color: customText,
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Lado Esquerdo / Centro: Ícone Ticker + Texto */}
        <div className="flex items-center gap-2 mx-auto sm:mx-0 text-center sm:text-left min-w-0">
          <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-white/20 flex-shrink-0">
            <Sparkles className="w-2.5 h-2.5 fill-current animate-pulse" />
          </span>
          <p className="truncate sm:whitespace-normal font-medium leading-tight">
            {announcementText}
          </p>
        </div>

        {/* Lado Direito: Ação Rápida WhatsApp + Botão Fechar */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {whatsappClean && (
            <a
              href={`https://wa.me/${whatsappClean}`}
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-[11px] font-bold transition-colors cursor-pointer"
              style={{ color: customText }}
              title="Atendimento via WhatsApp"
            >
              <MessageCircle className="w-3 h-3" />
              <span>WhatsApp</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="p-1 rounded-md hover:bg-white/20 transition-colors cursor-pointer opacity-80 hover:opacity-100"
            title="Fechar aviso"
            aria-label="Fechar aviso de destaque"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
