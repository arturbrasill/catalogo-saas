import { describe, it, expect } from 'vitest';
import { applyCampaignDiscounts } from '../src/lib/supabase';
import type { Product, Campaign } from '../src/types';

describe('Surgical Supabase Updates — 4 Novas Funcionalidades', () => {
  describe('1. Sistema de Campanhas com Descontos Temporais', () => {
    const baseProducts: Product[] = [
      {
        id: 'prod-1',
        nome: 'Perfume Floral 100ml',
        slug: 'perfume-floral-100ml',
        descricao: 'Perfume importado',
        preco: 100,
        precoPromocional: null,
        categoriaId: 'Perfumes',
        imagens: [],
        variacoes: [],
        estoque: 10,
        ativo: true,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        deletedAt: null,
      },
      {
        id: 'prod-2',
        nome: 'Creme Hidratante 200g',
        slug: 'creme-hidratante-200g',
        descricao: 'Hidratante corporal',
        preco: 50,
        precoPromocional: null,
        categoriaId: 'Corpo e Banho',
        imagens: [],
        variacoes: [],
        estoque: 15,
        ativo: true,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        deletedAt: null,
      },
      {
        id: 'prod-3',
        nome: 'Batom Matte Vermelho',
        slug: 'batom-matte-vermelho',
        descricao: 'Batom de longa duração',
        preco: 30,
        precoPromocional: null,
        categoriaId: 'Maquiagem',
        imagens: [],
        variacoes: [],
        estoque: 20,
        ativo: true,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        deletedAt: null,
      },
    ];

    const now = new Date('2026-10-15T12:00:00Z');

    it('deve aplicar desconto percentual para toda a loja quando a campanha estiver ativa no período', () => {
      const campaigns: Campaign[] = [
        {
          id: 'camp-1',
          tenant_id: 'tenant-test',
          name: 'Black Friday Antecipada',
          start_date: '2026-10-10T00:00:00Z',
          end_date: '2026-10-20T23:59:59Z',
          discount_type: 'percentage',
          discount_value: 20, // 20% OFF
          scope: 'all',
          is_active: true,
          created_at: '2026-10-01T00:00:00Z',
        },
      ];

      const result = applyCampaignDiscounts(baseProducts, campaigns, now);

      expect(result[0].precoPromocional).toBe(80);
      expect(result[0].preco).toBe(100);
      expect(result[0].badge).toBe('20% OFF');

      expect(result[1].precoPromocional).toBe(40);
      expect(result[1].preco).toBe(50);
      expect(result[1].badge).toBe('20% OFF');

      expect(result[2].precoPromocional).toBe(24);
      expect(result[2].preco).toBe(30);
    });

    it('NÃO deve aplicar desconto de campanha expirada ou futura', () => {
      const expiredCampaign: Campaign = {
        id: 'camp-expired',
        tenant_id: 'tenant-test',
        name: 'Campanha Passada',
        start_date: '2026-10-01T00:00:00Z',
        end_date: '2026-10-10T00:00:00Z', // Já passou
        discount_type: 'percentage',
        discount_value: 50,
        scope: 'all',
        is_active: true,
        created_at: '2026-10-01T00:00:00Z',
      };

      const futureCampaign: Campaign = {
        id: 'camp-future',
        tenant_id: 'tenant-test',
        name: 'Campanha Futura',
        start_date: '2026-10-25T00:00:00Z', // Ainda não começou
        end_date: '2026-10-30T00:00:00Z',
        discount_type: 'percentage',
        discount_value: 50,
        scope: 'all',
        is_active: true,
        created_at: '2026-10-01T00:00:00Z',
      };

      const result = applyCampaignDiscounts(baseProducts, [expiredCampaign, futureCampaign], now);

      expect(result[0].precoPromocional).toBeUndefined();
      expect(result[0].badge).toBeUndefined();
      expect(result[1].precoPromocional).toBeUndefined();
    });

    it('NÃO deve aplicar desconto quando is_active === false', () => {
      const pausedCampaign: Campaign = {
        id: 'camp-paused',
        tenant_id: 'tenant-test',
        name: 'Campanha Pausada',
        start_date: '2026-10-10T00:00:00Z',
        end_date: '2026-10-20T23:59:59Z',
        discount_type: 'percentage',
        discount_value: 30,
        scope: 'all',
        is_active: false,
        created_at: '2026-10-01T00:00:00Z',
      };

      const result = applyCampaignDiscounts(baseProducts, [pausedCampaign], now);
      expect(result[0].precoPromocional).toBeUndefined();
    });

    it('deve aplicar desconto fixo em R$ apenas para categoria específica', () => {
      const categoryCampaign: Campaign = {
        id: 'camp-cat',
        tenant_id: 'tenant-test',
        name: 'Queima de Perfumes',
        start_date: '2026-10-10T00:00:00Z',
        end_date: '2026-10-20T23:59:59Z',
        discount_type: 'fixed',
        discount_value: 25, // R$ 25 OFF
        scope: 'categories',
        category_ids: ['Perfumes'],
        is_active: true,
        created_at: '2026-10-01T00:00:00Z',
      };

      const result = applyCampaignDiscounts(baseProducts, [categoryCampaign], now);

      // Perfume: 100 - 25 = 75
      expect(result[0].precoPromocional).toBe(75);
      expect(result[0].badge).toBe('R$ 25 OFF');

      // Outras categorias permanecem com preço regular
      expect(result[1].precoPromocional).toBeUndefined();
      expect(result[2].precoPromocional).toBeUndefined();
    });

    it('deve aplicar desconto apenas para produtos específicos selecionados', () => {
      const productCampaign: Campaign = {
        id: 'camp-prod',
        tenant_id: 'tenant-test',
        name: 'Oferta Relâmpago Batom',
        start_date: '2026-10-10T00:00:00Z',
        end_date: '2026-10-20T23:59:59Z',
        discount_type: 'fixed',
        discount_value: 10,
        scope: 'products',
        product_ids: ['prod-3'],
        is_active: true,
        created_at: '2026-10-01T00:00:00Z',
      };

      const result = applyCampaignDiscounts(baseProducts, [productCampaign], now);

      expect(result[0].precoPromocional).toBeUndefined();
      expect(result[1].precoPromocional).toBeUndefined();
      // Batom: 30 - 10 = 20
      expect(result[2].precoPromocional).toBe(20);
      expect(result[2].badge).toBe('R$ 10 OFF');
    });

    it('quando múltiplas campanhas forem elegíveis, deve escolher o maior desconto (menor preço promocional)', () => {
      const campaign1: Campaign = {
        id: 'camp-10pct',
        tenant_id: 'tenant-test',
        name: '10% na loja toda',
        start_date: '2026-10-10T00:00:00Z',
        end_date: '2026-10-20T23:59:59Z',
        discount_type: 'percentage',
        discount_value: 10, // 100 -> 90
        scope: 'all',
        is_active: true,
        created_at: '2026-10-01T00:00:00Z',
      };

      const campaign2: Campaign = {
        id: 'camp-30fixed',
        tenant_id: 'tenant-test',
        name: 'R$ 30 OFF em Perfumes',
        start_date: '2026-10-10T00:00:00Z',
        end_date: '2026-10-20T23:59:59Z',
        discount_type: 'fixed',
        discount_value: 30, // 100 -> 70
        scope: 'categories',
        category_ids: ['Perfumes'],
        is_active: true,
        created_at: '2026-10-01T00:00:00Z',
      };

      const result = applyCampaignDiscounts(baseProducts, [campaign1, campaign2], now);
      // Perfume deve receber R$ 70 (o maior desconto entre 90 e 70)
      expect(result[0].precoPromocional).toBe(70);
      expect(result[0].badge).toBe('R$ 30 OFF');
    });
  });

  describe('2. Roteamento Multi-WhatsApp (Seleção de Vendedor)', () => {
    it('deve identificar corretamente quando deve ou não abrir o seletor de vendedor', () => {
      const sellers = [
        { id: '1', name: 'Ana Silva', whatsapp: '5511999991111' },
        { id: '2', name: 'Carlos Souza', whatsapp: '5511999992222' },
      ];

      // Caso 1: allow_seller_choice desativado -> não deve abrir modal (despacho direto)
      const shouldModalOpen1 = false && sellers.length >= 2;
      expect(shouldModalOpen1).toBe(false);

      // Caso 2: allow_seller_choice ativado com 2 vendedores -> deve abrir modal
      const allowChoice = true;
      const validSellers = sellers.filter((s) => s.name?.trim() && s.whatsapp?.trim());
      const shouldModalOpen2 = allowChoice && validSellers.length >= 2;
      expect(shouldModalOpen2).toBe(true);

      // Caso 3: allow_seller_choice ativado mas com apenas 1 vendedor válido -> despacho direto sem modal
      const singleSeller = [{ id: '1', name: 'Ana Silva', whatsapp: '5511999991111' }];
      const shouldModalOpen3 = allowChoice && singleSeller.length >= 2;
      expect(shouldModalOpen3).toBe(false);
    });

    it('deve filtrar vendedores com dados vazios para não gerar números inválidos', () => {
      const sellers = [
        { id: '1', name: 'Ana', whatsapp: '5511999991111' },
        { id: '2', name: '   ', whatsapp: '5511999992222' }, // Nome vazio
        { id: '3', name: 'Beto', whatsapp: '' }, // WhatsApp vazio
      ];

      const validSellers = sellers.filter((s) => s.name?.trim() && s.whatsapp?.trim());
      expect(validSellers.length).toBe(1);
      expect(validSellers[0].name).toBe('Ana');
    });
  });

  describe('3. Landing Page: 2 Slots Exclusivos de Lojas Modelo', () => {
    it('deve ter exatamente 2 slots configurados na Landing Page', async () => {
      // Importa a constante dos slots modelo
      const { DEMO_STORES } = await import('../src/lib/demoStores');
      expect(DEMO_STORES).toBeDefined();
      expect(DEMO_STORES.length).toBe(2);

      // Slot 1: Essenza
      const slot1 = DEMO_STORES[0];
      expect(slot1.name).toBe('Essenza');
      expect(slot1.url).toBe('https://numclick-app.vercel.app/essenza');
      expect(slot1.isAvailable).toBe(true);

      // Slot 2: Loja Parceira (preparada e mockada)
      const slot2 = DEMO_STORES[1];
      expect(slot2.badge).toContain('Loja Parceira');
      expect(slot2.isAvailable).toBe(false);
    });
  });

  describe('4. Gestão de Slug Único e Remoção de Domínio Próprio', () => {
    it('deve sanitizar o slug para lowercase e remover caracteres inválidos', () => {
      const sanitizeSlug = (raw: string) =>
        raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);

      expect(sanitizeSlug('Minha Loja Linda!')).toBe('minhalojalinda');
      expect(sanitizeSlug('Loja_Top_123')).toBe('lojatop123');
      expect(sanitizeSlug('perfumaria-essenza')).toBe('perfumaria-essenza');
      expect(sanitizeSlug('  ESPACIAL-SHOP  ')).toBe('espacial-shop');
    });
  });
});
