import { describe, it, expect, beforeEach } from 'vitest';
import { getCartStorageKey } from '@/lib/cart';

describe('LocalStorage Multi-Tenant Isolation', () => {
  const memoryStore: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: (key: string) => memoryStore[key] || null,
    setItem: (key: string, val: string) => {
      memoryStore[key] = val;
    },
    removeItem: (key: string) => {
      delete memoryStore[key];
    },
    clear: () => {
      Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
    },
  };

  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('deve gerar chave no formato cart_${tenantId} vinculada a cada loja', () => {
    expect(getCartStorageKey('loja_a')).toBe('cart_loja_a');
    expect(getCartStorageKey('loja_b')).toBe('cart_loja_b');
    expect(getCartStorageKey('Boutique-Elegance')).toBe('cart_boutique-elegance');
  });

  it('deve tratar domínios especiais e caracteres seguros', () => {
    expect(getCartStorageKey('catalogo.minhaloja.com.br')).toBe('cart_catalogo_minhaloja_com_br');
  });

  it('deve garantir isolamento total de dados no LocalStorage entre diferentes lojas', () => {
    const keyStoreA = getCartStorageKey('loja_a');
    const keyStoreB = getCartStorageKey('loja_b');

    // Carrinho da Loja A
    const itemsLojaA = [{ productId: 'prod_1', name: 'Vestido', quantity: 2 }];
    mockLocalStorage.setItem(keyStoreA, JSON.stringify(itemsLojaA));

    // Carrinho da Loja B
    const itemsLojaB = [{ productId: 'prod_2', name: 'Tênis', quantity: 1 }];
    mockLocalStorage.setItem(keyStoreB, JSON.stringify(itemsLojaB));

    // Verificação de isolamento
    const recoveredA = JSON.parse(mockLocalStorage.getItem(keyStoreA)!);
    const recoveredB = JSON.parse(mockLocalStorage.getItem(keyStoreB)!);

    expect(recoveredA).toEqual(itemsLojaA);
    expect(recoveredB).toEqual(itemsLojaB);
    expect(recoveredA).not.toEqual(recoveredB);
  });
});
