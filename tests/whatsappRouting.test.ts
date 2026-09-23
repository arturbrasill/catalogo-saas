import { describe, it, expect } from 'vitest';
import {
  normalizePhoneNumber,
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  type WhatsAppStoreInfo,
} from '@/lib/whatsapp';
import type { CartItem } from '@/types';

describe('WhatsApp Message Generation & Conditional Routing (QA Protocol)', () => {
  const store: WhatsAppStoreInfo = {
    store_name: 'Boutique Elegance & Charme',
    whatsapp: '(11) 98765-4321', // sem DDI 55
  };

  const sampleItems: CartItem[] = [
    {
      productId: 'prod_1',
      name: 'Vestido Seda Floral & Rendado',
      image: 'https://cdn.exemplo.com/vestido.jpg',
      unitPrice: 199.9,
      promotionalPrice: 159.9,
      quantity: 1,
      variations: { Tamanho: 'M', Cor: 'Azul Celeste' },
      subtotal: 159.9,
    },
    {
      productId: 'prod_2',
      name: 'Cinto Couro Legítimo 100%',
      image: 'https://cdn.exemplo.com/cinto.jpg',
      unitPrice: 49.9,
      promotionalPrice: null,
      quantity: 2,
      variations: { Tamanho: '95cm' },
      subtotal: 99.8,
    },
  ];

  describe('1. Sanitização Rigorosa do Número de Telefone', () => {
    it('deve remover caracteres não numéricos e adicionar 55 para números de 10 e 11 dígitos', () => {
      expect(normalizePhoneNumber('(11) 98765-4321')).toBe('5511987654321');
      expect(normalizePhoneNumber('11987654321')).toBe('5511987654321');
      expect(normalizePhoneNumber('+55 (11) 98765-4321')).toBe('5511987654321');
      expect(normalizePhoneNumber('011987654321')).toBe('5511987654321');
    });

    it('deve preservar número já contendo DDI 55', () => {
      expect(normalizePhoneNumber('5511987654321')).toBe('5511987654321');
    });

    it('deve lançar erro caso o número seja inválido ou vazio', () => {
      expect(() => normalizePhoneNumber('')).toThrow(/número de whatsapp não fornecido/i);
      expect(() => normalizePhoneNumber('12345')).toThrow(/número de whatsapp inválido/i);
    });
  });

  describe('2. Mensagem Estruturada e Codificação', () => {
    it('deve conter cabeçalho em negrito, itens com variações, divisória, total em Real e encerramento', () => {
      const msg = buildWhatsAppMessage(store, sampleItems);

      // Cabeçalho com o nome da loja em negrito
      expect(msg).toContain('*NOVO PEDIDO — BOUTIQUE ELEGANCE & CHARME*');

      // Detalhes do item 1 com variações destacadas
      expect(msg).toContain('*1x Vestido Seda Floral & Rendado*');
      expect(msg).toContain('_Tamanho: M | Cor: Azul Celeste_');
      expect(msg).toContain('Subtotal: *R$ 159,90*');

      // Detalhes do item 2
      expect(msg).toContain('*2x Cinto Couro Legítimo 100%*');
      expect(msg).toContain('_Tamanho: 95cm_');
      expect(msg).toContain('Subtotal: *R$ 99,80*');

      // Linha divisória
      expect(msg).toContain('----------------------------------------');

      // Total Geral em negrito formatado em Real (159.9 + 99.8 = 259.7)
      expect(msg).toContain('💰 *TOTAL DO PEDIDO: R$ 259,70*');

      // Texto de encerramento solicitando confirmação de estoque e dados de entrega
      expect(msg).toContain('itens em estoque e confirme os dados de entrega');
    });

    it('deve codificar caracteres especiais (&, +, %, acentos, quebras de linha e emojis)', () => {
      const url = buildWhatsAppUrl(store, sampleItems, undefined, { isMobile: true });
      expect(url).toContain('https://api.whatsapp.com/send?phone=5511987654321&text=');

      // Verifica que não há espaços literais ou caracteres não codificados no query param
      const queryParam = url.split('&text=')[1]!;
      expect(queryParam).not.toContain(' ');
      expect(decodeURIComponent(queryParam)).toContain('Vestido Seda Floral & Rendado');
      expect(decodeURIComponent(queryParam)).toContain('100%');
      expect(decodeURIComponent(queryParam)).toContain('🛍️');
    });
  });

  describe('3. Redirecionamento Condicional (Mobile vs Desktop)', () => {
    it('deve gerar api.whatsapp.com/send para dispositivos móveis', () => {
      const mobileUrl = buildWhatsAppUrl(store, sampleItems, undefined, { isMobile: true });
      expect(mobileUrl.startsWith('https://api.whatsapp.com/send?phone=5511987654321&text=')).toBe(true);
    });

    it('deve gerar web.whatsapp.com/send para computadores / desktop', () => {
      const desktopUrl = buildWhatsAppUrl(store, sampleItems, undefined, { isMobile: false });
      expect(desktopUrl.startsWith('https://web.whatsapp.com/send?phone=5511987654321&text=')).toBe(true);
    });
  });
});
