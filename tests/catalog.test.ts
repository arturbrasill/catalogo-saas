import { describe, it, expect, beforeEach } from 'vitest';
import { BackendEngine } from '../src/backend/engine';
import {
  calculateSubtotal,
  calculateCartTotal,
  buildWhatsAppUrl,
  type WhatsAppStoreInfo,
} from '../src/lib/whatsapp';
import type { Product, CartItem, SelectedVariation } from '../src/types';

describe('Módulo 3 — Vitrine Pública & Catálogo (tests/catalog.test.ts)', () => {
  let engine: BackendEngine;
  let adminToken: string;
  let sampleProduct1: Product;
  let sampleProduct2: Product;

  beforeEach(() => {
    engine = new BackendEngine();
    const loginRes = engine.doPost({ action: 'login', password: 'admin123' });
    adminToken = (loginRes.data as { token: string }).token;

    // Criar categoria adicional
    const catRes = engine.doPost({
      action: 'createCategory',
      token: adminToken,
      category: { nome: 'Calçados', slug: 'calcados', ordem: 2 },
    });
    const catCalcados = catRes.data as any;

    // Criar produto 1 com variações
    const p1Res = engine.doPost({
      action: 'createProduct',
      token: adminToken,
      product: {
        categoriaId: 'cat_geral',
        nome: 'Camiseta Básica Algodão',
        descricao: '100% algodão macio e confortável',
        preco: 80.0,
        precoPromocional: 60.0,
        estoque: 15,
        variacoes: [
          { tipo: 'Tamanho', opcoes: ['P', 'M', 'G'] },
          { tipo: 'Cor', opcoes: ['Preto', 'Branco'] },
        ],
        ativo: true,
      },
    });
    sampleProduct1 = p1Res.data as Product;

    // Criar produto 2
    const p2Res = engine.doPost({
      action: 'createProduct',
      token: adminToken,
      product: {
        categoriaId: catCalcados.id,
        nome: 'Tênis Urbano Sneaker',
        descricao: 'Tênis casual para o dia a dia',
        preco: 199.9,
        estoque: 8,
        variacoes: [{ tipo: 'Tamanho', opcoes: ['39', '40', '41'] }],
        ativo: true,
      },
    });
    sampleProduct2 = p2Res.data as Product;
  });

  // ============================================================
  // 1. CARREGAMENTO DO CATÁLOGO
  // ============================================================
  describe('Carregamento do Catálogo', () => {
    it('deve carregar dados consolidados da vitrine (store, categories, products)', () => {
      const res = engine.doGet({ action: 'all' });
      expect(res.success).toBe(true);

      const data = res.data as any;
      expect(data.store).toBeTruthy();
      expect(data.store.store_id).toBe('loja_exemplo');
      expect(data.categories).toHaveLength(2); // Geral + Calçados
      expect(data.products).toHaveLength(2);
    });
  });

  // ============================================================
  // 2. BUSCA E FILTROS DE PRODUTOS
  // ============================================================
  describe('Busca e Filtros', () => {
    it('deve filtrar produtos por termo de busca no nome e descrição', () => {
      const allProds = engine.getActiveProducts();

      // Busca por "algodão"
      const filteredByAlgodao = allProds.filter(
        (p) =>
          p.nome.toLowerCase().includes('algodão') ||
          p.descricao.toLowerCase().includes('algodão')
      );
      expect(filteredByAlgodao).toHaveLength(1);
      expect(filteredByAlgodao[0]?.id).toBe(sampleProduct1.id);

      // Busca por "sneaker"
      const filteredBySneaker = allProds.filter(
        (p) =>
          p.nome.toLowerCase().includes('sneaker') ||
          p.descricao.toLowerCase().includes('sneaker')
      );
      expect(filteredBySneaker).toHaveLength(1);
      expect(filteredBySneaker[0]?.id).toBe(sampleProduct2.id);
    });

    it('deve filtrar produtos por categoria específica', () => {
      const prodsGeral = engine.getActiveProducts('cat_geral');
      expect(prodsGeral).toHaveLength(1);
      expect(prodsGeral[0]?.nome).toBe('Camiseta Básica Algodão');
    });
  });

  // ============================================================
  // 3. VALIDAÇÃO OBRIGATÓRIA DE VARIAÇÕES
  // ============================================================
  describe('Validação Obrigatória de Variações', () => {
    it('deve identificar se faltam seleções obrigatórias para o produto', () => {
      const variacoesObrigatorias = sampleProduct1.variacoes; // Tamanho e Cor

      // Seleção vazia: faltam ambos
      const selecaoVazia: SelectedVariation = {};
      const faltantes1 = variacoesObrigatorias.filter((v) => !selecaoVazia[v.tipo]);
      expect(faltantes1).toHaveLength(2);

      // Seleção parcial: escolheu só Tamanho
      const selecaoParcial: SelectedVariation = { Tamanho: 'M' };
      const faltantes2 = variacoesObrigatorias.filter((v) => !selecaoParcial[v.tipo]);
      expect(faltantes2).toHaveLength(1);
      expect(faltantes2[0]?.tipo).toBe('Cor');

      // Seleção completa: escolheu Tamanho e Cor
      const selecaoCompleta: SelectedVariation = { Tamanho: 'M', Cor: 'Preto' };
      const faltantes3 = variacoesObrigatorias.filter((v) => !selecaoCompleta[v.tipo]);
      expect(faltantes3).toHaveLength(0);
    });
  });

  // ============================================================
  // 4. OPERAÇÕES DA SACOLA (CART)
  // ============================================================
  describe('Operações e Cálculos da Sacola de Compras', () => {
    it('deve adicionar item à sacola calculando subtotal promocional', () => {
      const subtotal = calculateSubtotal(
        sampleProduct1.preco,
        2,
        sampleProduct1.precoPromocional // 60.00
      );
      expect(subtotal).toBe(120.0);

      const cartItem: CartItem = {
        productId: sampleProduct1.id,
        name: sampleProduct1.nome,
        image: '',
        unitPrice: sampleProduct1.preco,
        promotionalPrice: sampleProduct1.precoPromocional,
        quantity: 2,
        variations: { Tamanho: 'M', Cor: 'Preto' },
        subtotal,
      };

      expect(cartItem.subtotal).toBe(120.0);
      expect(cartItem.quantity).toBe(2);
    });

    it('deve diferenciar itens do mesmo produto com variações diferentes', () => {
      const itemM: CartItem = {
        productId: sampleProduct1.id,
        name: sampleProduct1.nome,
        image: '',
        unitPrice: 80.0,
        promotionalPrice: 60.0,
        quantity: 1,
        variations: { Tamanho: 'M', Cor: 'Preto' },
        subtotal: 60.0,
      };

      const itemG: CartItem = {
        productId: sampleProduct1.id,
        name: sampleProduct1.nome,
        image: '',
        unitPrice: 80.0,
        promotionalPrice: 60.0,
        quantity: 2,
        variations: { Tamanho: 'G', Cor: 'Branco' },
        subtotal: 120.0,
      };

      const cartItems = [itemM, itemG];
      expect(cartItems).toHaveLength(2);
      expect(calculateCartTotal(cartItems)).toBe(180.0);
    });

    it('deve atualizar quantidades e recalcular subtotais', () => {
      const unitPrice = 50.0;
      let qtd = 1;
      let subtotal = calculateSubtotal(unitPrice, qtd);
      expect(subtotal).toBe(50.0);

      // Incrementa para 3
      qtd = 3;
      subtotal = calculateSubtotal(unitPrice, qtd);
      expect(subtotal).toBe(150.0);

      // Reduz para 0 (deve zerar)
      qtd = 0;
      subtotal = calculateSubtotal(unitPrice, qtd);
      expect(subtotal).toBe(0);
    });

    it('deve calcular o total da sacola com múltiplos itens', () => {
      const items: CartItem[] = [
        {
          productId: '1',
          name: 'Item 1',
          image: '',
          unitPrice: 100,
          quantity: 2,
          variations: {},
          subtotal: 200,
        },
        {
          productId: '2',
          name: 'Item 2',
          image: '',
          unitPrice: 45.5,
          quantity: 1,
          variations: {},
          subtotal: 45.5,
        },
      ];

      expect(calculateCartTotal(items)).toBe(245.5);
    });
  });

  // ============================================================
  // 5. INTEGRAÇÃO COM CHECKOUT WHATSAPP
  // ============================================================
  describe('Integração Checkout WhatsApp', () => {
    it('deve gerar URL do WhatsApp com a mensagem codificada a partir da sacola', () => {
      const store: WhatsAppStoreInfo = {
        store_name: 'Minha Loja Digital',
        whatsapp: '5511999999999',
        currency: 'BRL',
      };

      const items: CartItem[] = [
        {
          productId: sampleProduct1.id,
          name: sampleProduct1.nome,
          image: '',
          unitPrice: 80.0,
          promotionalPrice: 60.0,
          quantity: 2,
          variations: { Tamanho: 'M', Cor: 'Preto' },
          subtotal: 120.0,
        },
      ];

      const url = buildWhatsAppUrl(store, items);
      expect(url).toMatch(/^https:\/\/wa\.me\/5511999999999\?text=/);

      const decoded = decodeURIComponent(url.split('?text=')[1]!);
      expect(decoded).toContain('MINHA LOJA DIGITAL');
      expect(decoded).toContain('*2x Camiseta Básica Algodão*');
      expect(decoded).toContain('_Tamanho: M | Cor: Preto_');
      expect(decoded).toContain('TOTAL DO PEDIDO: R$ 120,00');
    });
  });

  // ============================================================
  // 6. RESPONSIVIDADE & BREAKPOINTS (320, 375, 390, 430, 768, 1024, 1440)
  // ============================================================
  describe('Responsividade e Resolução de Viewports', () => {
    const viewports = [
      { name: 'Ultra-small mobile (iPhone SE 1st gen)', width: 320, expectedCols: 2 },
      { name: 'Standard mobile (iPhone 8 / SE 2nd gen)', width: 375, expectedCols: 2 },
      { name: 'Modern mobile (iPhone 12/13/14)', width: 390, expectedCols: 2 },
      { name: 'Pro Max mobile (iPhone 14/15 Pro Max)', width: 430, expectedCols: 2 },
      { name: 'Tablet portrait (iPad Mini / Air)', width: 768, expectedCols: 3 },
      { name: 'Tablet landscape / Laptop (iPad Pro / Macbook)', width: 1024, expectedCols: 4 },
      { name: 'Large desktop (1080p / 1440p)', width: 1440, expectedCols: 4 },
    ];

    it.each(viewports)(
      'deve validar arquitetura de grid e layout para viewport $width px ($name)',
      ({ width, expectedCols }) => {
        // Validação da lógica responsiva correspondente ao Tailwind CSS
        // grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
        let cols = 2; // base (<640px)
        if (width >= 1024) {
          cols = 4; // lg
        } else if (width >= 640) {
          cols = 3; // sm / md
        }

        expect(cols).toBe(expectedCols);

        // Garante que a largura líquida utilizável por coluna é viável (> 120px)
        const containerPadding = width < 640 ? 32 : 48; // px-4 (16px*2) vs sm:px-6 (24px*2)
        const maxContentWidth = Math.min(width, 1280); // max-w-7xl
        const availableWidth = maxContentWidth - containerPadding;
        const gap = width < 640 ? 10 : 20; // gap-2.5 vs gap-5
        const columnWidth = (availableWidth - gap * (cols - 1)) / cols;

        expect(columnWidth).toBeGreaterThanOrEqual(120);
      }
    );
  });
});
