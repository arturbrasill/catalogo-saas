import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatVariation,
  calculateSubtotal,
  calculateCartTotal,
  formatCartItem,
  normalizePhoneNumber,
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  type WhatsAppStoreInfo,
} from '../src/lib/whatsapp';
import type { CartItem, Cart } from '../src/types';

describe('Módulo 4 — Motor de WhatsApp (src/lib/whatsapp.ts)', () => {
  const mockStore: WhatsAppStoreInfo = {
    store_name: 'Moda & Estilo Store',
    whatsapp: '+55 (11) 98765-4321',
    currency: 'BRL',
  };

  const sampleItem1: CartItem = {
    productId: 'prod_1',
    name: 'Camiseta Algodão Egípcio',
    image: 'https://cdn.example.com/cam.jpg',
    unitPrice: 89.9,
    promotionalPrice: null,
    quantity: 2,
    variations: { Tamanho: 'M', Cor: 'Preto' },
    subtotal: 179.8,
  };

  const sampleItem2: CartItem = {
    productId: 'prod_2',
    name: 'Bermuda Sarja Confort',
    image: 'https://cdn.example.com/bermuda.jpg',
    unitPrice: 120.0,
    promotionalPrice: 99.0, // Em promoção!
    quantity: 1,
    variations: { Tamanho: '42' },
    subtotal: 99.0,
  };

  // ============================================================
  // 1. FORMATAÇÃO MONETÁRIA
  // ============================================================
  describe('formatCurrency()', () => {
    it('deve formatar valores em Reais (BRL) corretamente', () => {
      expect(formatCurrency(89.9)).toBe('R$ 89,90');
      expect(formatCurrency(0)).toBe('R$ 0,00');
      expect(formatCurrency(1250.5)).toBe('R$ 1.250,50');
      expect(formatCurrency(1000000)).toBe('R$ 1.000.000,00');
    });

    it('deve lidar com valores inválidos ou NaN com segurança', () => {
      expect(formatCurrency(NaN)).toBe('R$ 0,00');
      expect(formatCurrency(Infinity)).toBe('R$ 0,00');
    });
  });

  // ============================================================
  // 2. FORMATAÇÃO DE VARIAÇÕES
  // ============================================================
  describe('formatVariation()', () => {
    it('deve formatar mapa de variações para markdown itálico do WhatsApp', () => {
      const formatted = formatVariation({ Tamanho: 'G', Cor: 'Azul Marinho' });
      expect(formatted).toBe('_Tamanho: G | Cor: Azul Marinho_');
    });

    it('deve retornar string vazia para variações vazias ou nulas', () => {
      expect(formatVariation({})).toBe('');
      expect(formatVariation(null)).toBe('');
      expect(formatVariation(undefined)).toBe('');
    });
  });

  // ============================================================
  // 3. CÁLCULO DE SUBTOTAL E TOTAL
  // ============================================================
  describe('calculateSubtotal() e calculateCartTotal()', () => {
    it('deve calcular subtotal multiplicando preço e quantidade', () => {
      expect(calculateSubtotal(50, 2)).toBe(100);
      expect(calculateSubtotal(29.9, 3)).toBe(89.7);
    });

    it('deve aplicar preço promocional no cálculo quando válido', () => {
      // Preço cheio 100, promo 80, 2 unidades -> 160
      expect(calculateSubtotal(100, 2, 80)).toBe(160);
    });

    it('deve ignorar preço promocional se for maior ou igual ao preço cheio', () => {
      // Preço cheio 100, promo falsa 120 -> deve usar 100
      expect(calculateSubtotal(100, 2, 120)).toBe(200);
    });

    it('deve calcular o total da sacola somando todos os subtotais', () => {
      const items = [sampleItem1, sampleItem2];
      // Item 1: 89.9 * 2 = 179.80
      // Item 2: 99.0 * 1 = 99.00
      // Total: 278.80
      expect(calculateCartTotal(items)).toBe(278.8);
    });
  });

  // ============================================================
  // 4. NORMALIZAÇÃO DE TELEFONE
  // ============================================================
  describe('normalizePhoneNumber()', () => {
    it('deve normalizar números de telefone removendo pontuação e espaços', () => {
      expect(normalizePhoneNumber('+55 (11) 98765-4321')).toBe('5511987654321');
      expect(normalizePhoneNumber('55 11 99999 0000')).toBe('5511999990000');
      expect(normalizePhoneNumber('+55-21-98888-7777')).toBe('5521988887777');
    });

    it('deve adicionar automaticamente DDI 55 para números de 10 ou 11 dígitos sem DDI', () => {
      expect(normalizePhoneNumber('(86) 99945-6987')).toBe('5586999456987');
      expect(normalizePhoneNumber('86999456987')).toBe('5586999456987');
      expect(normalizePhoneNumber('11987654321')).toBe('5511987654321');
      expect(normalizePhoneNumber('086999456987')).toBe('5586999456987');
    });

    it('deve aceitar tipo numérico vindo do Google Sheets sem erros', () => {
      expect(normalizePhoneNumber(5586999456987)).toBe('5586999456987');
      expect(normalizePhoneNumber(86999456987)).toBe('5586999456987');
    });

    it('deve lançar erro para telefones inválidos com menos de 10 dígitos', () => {
      expect(() => normalizePhoneNumber('12345')).toThrow(/inválido/i);
      expect(() => normalizePhoneNumber('')).toThrow(/não fornecido/i);
      expect(() => normalizePhoneNumber('abc-def')).toThrow(/inválido/i);
    });
  });

  // ============================================================
  // 5. CASOS OBRIGATÓRIOS DO PROMPT
  // ============================================================
  describe('buildWhatsAppMessage() e buildWhatsAppUrl() — Casos Específicos', () => {
    // Caso 1: Carrinho vazio
    it('Caso 1: Carrinho Vazio — deve lançar erro impedindo finalização sem produtos', () => {
      expect(() => buildWhatsAppMessage(mockStore, [])).toThrow(/vazia/i);
      expect(() => buildWhatsAppUrl(mockStore, [])).toThrow(/vazia/i);

      const emptyCart: Cart = { items: [], total: 0, totalItems: 0 };
      expect(() => buildWhatsAppMessage(mockStore, emptyCart)).toThrow(/vazia/i);
    });

    // Caso 2: Um produto
    it('Caso 2: Um Produto — deve gerar mensagem estruturada corretamente', () => {
      const msg = buildWhatsAppMessage(mockStore, [sampleItem1]);
      expect(msg).toContain('🛍️ *NOVO PEDIDO — MODA & ESTILO STORE*');
      expect(msg).toContain('*2x Camiseta Algodão Egípcio*');
      expect(msg).toContain('_Tamanho: M | Cor: Preto_');
      expect(msg).toContain('Subtotal: *R$ 179,80*');
      expect(msg).toContain('📸 Foto: https://cdn.example.com/cam.jpg');
      expect(msg).toContain('💰 *TOTAL DO PEDIDO: R$ 179,80*');
    });

    // Caso 3: Vários produtos
    it('Caso 3: Vários Produtos — deve consolidar todos os itens e totais', () => {
      const cart: Cart = {
        items: [sampleItem1, sampleItem2],
        total: 278.8,
        totalItems: 3,
      };

      const msg = buildWhatsAppMessage(mockStore, cart);
      expect(msg).toContain('1. *2x Camiseta Algodão Egípcio*');
      expect(msg).toContain('2. *1x Bermuda Sarja Confort*');
      expect(msg).toContain('💰 *TOTAL DO PEDIDO: R$ 278,80*');
      expect(msg).toContain('📦 *Quantidade total de itens:* 3');
    });

    // Caso 4: Variações
    it('Caso 4: Variações — deve exibir as variações escolhidas em itálico', () => {
      const msg = buildWhatsAppMessage(mockStore, [sampleItem1]);
      expect(msg).toContain('_Tamanho: M | Cor: Preto_');
    });

    // Caso 5: Promoção
    it('Caso 5: Promoção — deve indicar preço promocional e calcular corretamente', () => {
      const msg = buildWhatsAppMessage(mockStore, [sampleItem2]);
      expect(msg).toContain('~R$ 120,00~ por R$ 99,00');
      expect(msg).toContain('Subtotal: *R$ 99,00*');
    });

    // Caso 6: Múltiplas quantidades
    it('Caso 6: Múltiplas Quantidades — deve multiplicar corretamente os subtotais', () => {
      const itemMultiplo: CartItem = {
        productId: 'prod_3',
        name: 'Meia Esportiva',
        image: '',
        unitPrice: 15.0,
        promotionalPrice: null,
        quantity: 5, // 5 x 15 = 75
        variations: {},
        subtotal: 75.0,
      };

      const msg = buildWhatsAppMessage(mockStore, [itemMultiplo]);
      expect(msg).toContain('*5x Meia Esportiva*');
      expect(msg).toContain('Subtotal: *R$ 75,00*');
      expect(msg).toContain('💰 *TOTAL DO PEDIDO: R$ 75,00*');
    });

    // Caso 7: Caracteres especiais e acentos
    it('Caso 7: Caracteres Especiais & Acentos — deve codificar via encodeURIComponent sem perdas', () => {
      const itemAcentuado: CartItem = {
        productId: 'prod_4',
        name: 'Açaí & Café Gourmet com Maçã / Canela',
        image: '',
        unitPrice: 25.5,
        promotionalPrice: null,
        quantity: 1,
        variations: { 'Opção Especial': 'Mais Açúcar & Canela + Chantilly' },
        subtotal: 25.5,
      };

      const storeAcentuada: WhatsAppStoreInfo = {
        store_name: 'Café & Delícias — Tradição & Sabor',
        whatsapp: '+55 11 91234-5678',
      };

      const url = buildWhatsAppUrl(storeAcentuada, [itemAcentuado]);

      // Validação da URL base
      expect(url).toMatch(/^https:\/\/wa\.me\/5511912345678\?text=/);

      // Decodificação deve restaurar todos os acentos e símbolos originais perfeitamente
      const encodedText = url.split('?text=')[1]!;
      const decoded = decodeURIComponent(encodedText);

      expect(decoded).toContain('CAFÉ & DELÍCIAS — TRADIÇÃO & SABOR');
      expect(decoded).toContain('Açaí & Café Gourmet com Maçã / Canela');
      expect(decoded).toContain('Mais Açúcar & Canela + Chantilly');
    });

    // Caso 8: Emojis
    it('Caso 8: Emojis — deve preservar emojis nativos e codificar na URL', () => {
      const itemComEmoji: CartItem = {
        productId: 'prod_5',
        name: 'Tênis Esportivo 👟 Runner Pro 🚀',
        image: '',
        unitPrice: 199.9,
        promotionalPrice: null,
        quantity: 1,
        variations: { Cor: 'Preto & Dourado ⭐' },
        subtotal: 199.9,
      };

      const url = buildWhatsAppUrl(mockStore, [itemComEmoji]);
      const encodedText = url.split('?text=')[1]!;
      const decoded = decodeURIComponent(encodedText);

      expect(decoded).toContain('👟');
      expect(decoded).toContain('🚀');
      expect(decoded).toContain('⭐');
      expect(decoded).toContain('🛍️');
      expect(decoded).toContain('💰');
    });

    // Caso 9: Telefone inválido
    it('Caso 9: Telefone Inválido — deve lançar exceção na geração da URL', () => {
      const storeInvalida: WhatsAppStoreInfo = {
        store_name: 'Loja Sem WhatsApp Válido',
        whatsapp: '999', // inválido: muito curto
      };

      expect(() => buildWhatsAppUrl(storeInvalida, [sampleItem1])).toThrow(
        /número de whatsapp inválido/i
      );
    });

    // Caso 10: Pedido com Entrega em Domicílio e PIX
    it('Caso 10: Pedido com Dados do Cliente, Entrega em Domicílio e PIX', () => {
      const orderInfo = {
        customerName: 'Artur Brasil',
        phone: '11999998888',
        deliveryType: 'delivery' as const,
        address: {
          street: 'Av. Paulista',
          number: '1000',
          neighborhood: 'Bela Vista',
          complement: 'Apto 42',
          city: 'São Paulo',
        },
        paymentMethod: 'pix' as const,
        notes: 'Deixar na portaria com o porteiro.',
      };

      const msg = buildWhatsAppMessage(mockStore, [sampleItem1], orderInfo);
      expect(msg).toContain('👤 *DADOS DO PEDIDO:*');
      expect(msg).toContain('• *Cliente:* Artur Brasil');
      expect(msg).toContain('• *Telefone:* 11999998888');
      expect(msg).toContain('• *Tipo:* 🛵 Entrega em Domicílio');
      expect(msg).toContain('• *Endereço:* Av. Paulista, 1000 - Bairro: Bela Vista - (Apto 42) - São Paulo');
      expect(msg).toContain('• *Pagamento:* ⚡ PIX');
      expect(msg).toContain('• *Observações:* Deixar na portaria com o porteiro.');
      expect(msg).toContain('taxa de entrega e tempo estimado');

      const url = buildWhatsAppUrl(mockStore, [sampleItem1], orderInfo);
      expect(url).toContain('https://wa.me/5511987654321?text=');
      expect(decodeURIComponent(url)).toContain('Artur Brasil');
    });

    // Caso 11: Pedido com Retirada no Balcão e Dinheiro com Troco
    it('Caso 11: Pedido com Retirada no Balcão e Pagamento em Dinheiro com Troco', () => {
      const orderInfo = {
        customerName: 'Mariana Costa',
        deliveryType: 'pickup' as const,
        paymentMethod: 'money' as const,
        changeFor: 'R$ 200,00',
      };

      const msg = buildWhatsAppMessage(mockStore, [sampleItem1], orderInfo);
      expect(msg).toContain('• *Cliente:* Mariana Costa');
      expect(msg).toContain('• *Tipo:* 🏬 Retirada no Balcão / Loja');
      expect(msg).toContain('• *Pagamento:* 💵 Dinheiro (Troco para R$ 200,00)');
      expect(msg).toContain('quando posso retirar');
      expect(msg).not.toContain('• *Endereço:*');
    });

    // Caso 12: Pedido com Cupom de Desconto Aplicado
    it('Caso 12: Pedido com Cupom de Desconto — deve detalhar subtotal, desconto e total final', () => {
      // sampleItem1 subtotal: 179.80
      const orderWithCoupon = {
        customerName: 'Carlos Eduardo',
        paymentMethod: 'pix' as const,
        appliedCoupon: {
          id: 'coup_1',
          codigo: 'BLACK10',
          tipo: 'percentage' as const,
          valor: 10,
          ativo: true,
        },
        discountAmount: 17.98,
      };

      const msg = buildWhatsAppMessage(mockStore, [sampleItem1], orderWithCoupon);
      expect(msg).toContain('• *Cliente:* Carlos Eduardo');
      expect(msg).toContain('💵 *Subtotal:* R$ 179,80');
      expect(msg).toContain('🎟️ *Cupom (BLACK10):* - R$ 17,98 (10% OFF)');
      expect(msg).toContain('💰 *TOTAL DO PEDIDO: R$ 161,82*');
    });

    // Caso 13: Pedido sem definição prévia de frete (combinar entrega no WhatsApp)
    it('Caso 13: Pedido com entrega a combinar — não exibe tipo ou endereço', () => {
      const orderACombinar = {
        customerName: 'Fernanda Lima',
        paymentMethod: 'pix' as const,
      };

      const msg = buildWhatsAppMessage(mockStore, [sampleItem1], orderACombinar);
      expect(msg).toContain('• *Cliente:* Fernanda Lima');
      expect(msg).not.toContain('• *Tipo:*');
      expect(msg).not.toContain('• *Endereço:*');
      expect(msg).toContain('informe a disponibilidade dos itens');
    });
  });
});
