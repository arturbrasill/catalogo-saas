import { describe, it, expect } from 'vitest';
import { getStoreStatus } from '@/lib/storeStatus';
import type { StoreConfig } from '@/types';

describe('Aviso Dinâmico de Loja Aberta/Fechada (storeStatus)', () => {
  it('deve retornar status "Aberto Agora" por padrão quando is_open não for explicitamente falso', () => {
    const status = getStoreStatus({
      store_name: 'Loja Teste',
      is_open: true,
    } as StoreConfig);

    expect(status.isOpen).toBe(true);
    expect(status.statusLabel).toBe('Aberto Agora');
    expect(status.dotClass).toContain('animate-pulse');
    expect(status.badgeClass).toContain('text-emerald-700');
  });

  it('deve retornar status "Aberto Agora" quando store for nulo ou indefinido', () => {
    const status = getStoreStatus(null);

    expect(status.isOpen).toBe(true);
    expect(status.statusLabel).toBe('Aberto Agora');
  });

  it('deve retornar status "Fechado no Momento" quando is_open for false', () => {
    const status = getStoreStatus({
      store_name: 'Loja Teste',
      is_open: false,
      business_hours: 'Seg a Sex: 08h às 18h',
    } as StoreConfig);

    expect(status.isOpen).toBe(false);
    expect(status.statusLabel).toBe('Fechado no Momento');
    expect(status.dotClass).not.toContain('animate-pulse');
    expect(status.badgeClass).toContain('text-amber-800');
    expect(status.businessHours).toBe('Seg a Sex: 08h às 18h');
    expect(status.cartNotice).toContain('Seg a Sex: 08h às 18h');
  });

  it('deve formatar mensagens de atendimento contendo o horário configurado', () => {
    const status = getStoreStatus({
      store_name: 'Boutique',
      is_open: true,
      business_hours: '09:00 - 19:00',
    } as StoreConfig);

    expect(status.message).toContain('09:00 - 19:00');
  });
});
