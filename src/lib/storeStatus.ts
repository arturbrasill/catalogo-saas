import type { StoreConfig } from '@/types';

export interface StoreStatusInfo {
  isOpen: boolean;
  statusLabel: string;
  badgeClass: string;
  dotClass: string;
  message: string;
  businessHours?: string;
  headline: string;
  cartNotice: string;
}

/**
 * Calcula o status dinâmico de atendimento da loja (Aberta / Fechada)
 * com mensagens humanizadas e adequadas para conversão no WhatsApp.
 */
export function getStoreStatus(store?: Partial<StoreConfig> | null): StoreStatusInfo {
  const isOpen = store?.is_open !== false;
  const businessHours = store?.business_hours?.trim();

  if (isOpen) {
    return {
      isOpen: true,
      statusLabel: 'Aberto Agora',
      badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
      dotClass: 'bg-emerald-500 animate-pulse',
      headline: 'Estamos atendendo agora!',
      message: businessHours
        ? `Faça seus pedidos pelo WhatsApp com atendimento ao vivo. Horário: ${businessHours}.`
        : 'Faça seus pedidos normalmente pelo WhatsApp com atendimento rápido!',
      cartNotice: 'Seu pedido será enviado diretamente para nosso atendimento no WhatsApp.',
      businessHours,
    };
  }

  return {
    isOpen: false,
    statusLabel: 'Fechado no Momento',
    badgeClass: 'text-amber-800 bg-amber-50 border-amber-200/80',
    dotClass: 'bg-amber-500',
    headline: 'Loja fechada no momento',
    message: businessHours
      ? `Nosso expediente é: ${businessHours}. Você pode montar sua sacola e enviar seu pedido para nossa fila de atendimento no WhatsApp — responderemos assim que abrirmos!`
      : 'No momento estamos fechados. Você pode montar sua sacola e enviar seu pedido para nossa fila de atendimento no WhatsApp — responderemos assim que reabrirmos!',
    cartNotice: businessHours
      ? `A loja está fechada agora (${businessHours}). Seu pedido entrará na fila do WhatsApp e responderemos no próximo expediente!`
      : 'A loja está fechada agora. Seu pedido entrará na fila do WhatsApp e responderemos assim que abrirmos!',
    businessHours,
  };
}
