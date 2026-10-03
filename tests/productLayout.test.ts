import { describe, it, expect, beforeEach } from 'vitest';
import { BackendEngine } from '@/backend/engine';
import { SaveConfigSchema, CreateProductSchema, UpdateProductSchema } from '@/lib/schemas';
import type { CatalogLayoutMode } from '@/types';

describe('Layout Modes e Selos Promocionais (Vitrine Configurável)', () => {
  let engine: BackendEngine;
  let adminToken: string;

  beforeEach(() => {
    engine = new BackendEngine();
    const loginRes = engine.handleLogin('admin123');
    adminToken = loginRes.token || '';
  });

  describe('1. Validação de Esquema (Zod)', () => {
    it('deve aceitar os 3 modos de layout válidos: grid, list, editorial', () => {
      const validModes: CatalogLayoutMode[] = ['grid', 'list', 'editorial'];
      for (const mode of validModes) {
        const result = SaveConfigSchema.safeParse({ catalog_layout: mode });
        expect(result.success).toBe(true);
      }
    });

    it('deve rejeitar modo de layout inválido no schema', () => {
      const result = SaveConfigSchema.safeParse({ catalog_layout: 'carousel' });
      expect(result.success).toBe(false);
    });

    it('deve aceitar badge promocional válido em CreateProductSchema', () => {
      const validBadges = ['Mais Vendido', 'Promoção', 'Novo', 'Destaque', 'Top 10'];
      for (const badge of validBadges) {
        const result = CreateProductSchema.safeParse({
          categoriaId: 'cat_geral',
          nome: 'Produto Teste',
          preco: 100,
          estoque: 10,
          badge,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.badge).toBe(badge);
        }
      }
    });

    it('deve aceitar badge nulo ou indefinido', () => {
      const result = CreateProductSchema.safeParse({
        categoriaId: 'cat_geral',
        nome: 'Produto Sem Badge',
        preco: 50,
        estoque: 5,
        badge: null,
      });
      expect(result.success).toBe(true);
    });

    it('deve rejeitar badge com tamanho excessivo (> 40 chars)', () => {
      const result = CreateProductSchema.safeParse({
        categoriaId: 'cat_geral',
        nome: 'Produto Teste',
        preco: 50,
        estoque: 5,
        badge: 'A'.repeat(45),
      });
      expect(result.success).toBe(false);
    });

    it('deve validar badge em UpdateProductSchema', () => {
      const result = UpdateProductSchema.safeParse({
        id: 'prod_123',
        badge: 'Edição Limitada',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.badge).toBe('Edição Limitada');
      }
    });
  });

  describe('2. AppsScriptBackendEngine - Configuração do Layout da Loja', () => {
    it('deve iniciar com catalog_layout "grid" por padrão', () => {
      const config = engine.getPublicStoreConfig();
      expect(config.catalog_layout).toBe('grid');
    });

    it('deve salvar e retornar catalog_layout "list"', () => {
      const postRes = engine.doPost({
        action: 'saveConfig',
        token: adminToken,
        config: {
          catalog_layout: 'list',
        },
      });

      expect(postRes.success).toBe(true);
      if (postRes.success) {
        const data = postRes.data as any;
        expect(data.catalog_layout).toBe('list');
      }

      const getRes = engine.doGet({ action: 'store' });
      expect(getRes.success).toBe(true);
      if (getRes.success) {
        const data = getRes.data as any;
        expect(data.catalog_layout).toBe('list');
      }
    });

    it('deve salvar e retornar catalog_layout "editorial"', () => {
      const postRes = engine.doPost({
        action: 'saveConfig',
        token: adminToken,
        config: {
          catalog_layout: 'editorial',
        },
      });

      expect(postRes.success).toBe(true);
      if (postRes.success) {
        const data = postRes.data as any;
        expect(data.catalog_layout).toBe('editorial');
      }
    });

    it('deve rejeitar catalog_layout com valor não suportado', () => {
      const postRes = engine.doPost({
        action: 'saveConfig',
        token: adminToken,
        config: {
          catalog_layout: 'invalid_mode',
        },
      });

      expect(postRes.success).toBe(false);
      if (!postRes.success) {
        expect(postRes.error.code).toBe('VALIDATION_ERROR');
        expect(postRes.error.message).toContain('catalog_layout');
      }
    });
  });

  describe('3. AppsScriptBackendEngine - Produtos com Selo Promocional (Badge)', () => {
    it('deve criar produto com selo promocional (ex: "Mais Vendido")', () => {
      const prodRes = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: {
          categoriaId: 'cat_geral',
          nome: 'Vestido Midi Seda',
          preco: 199.9,
          estoque: 15,
          badge: 'Mais Vendido',
        },
      });

      expect(prodRes.success).toBe(true);
      if (prodRes.success) {
        const prod = prodRes.data as any;
        expect(prod.badge).toBe('Mais Vendido');
        expect(prod.nome).toBe('Vestido Midi Seda');
      }
    });

    it('deve atualizar o selo promocional do produto (ex: para "Promoção")', () => {
      const createRes = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: {
          categoriaId: 'cat_geral',
          nome: 'Tênis Runner',
          preco: 250,
          estoque: 8,
          badge: 'Novo',
        },
      });
      const created = (createRes as any).data;

      const updateRes = engine.doPost({
        action: 'updateProduct',
        token: adminToken,
        product: {
          id: created.id,
          badge: 'Promoção',
          precoPromocional: 199,
        },
      });

      expect(updateRes.success).toBe(true);
      if (updateRes.success) {
        const updated = updateRes.data as any;
        expect(updated.badge).toBe('Promoção');
        expect(updated.precoPromocional).toBe(199);
      }
    });

    it('deve permitir remover o selo promocional passando null ou string vazia', () => {
      const createRes = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: {
          categoriaId: 'cat_geral',
          nome: 'Bolsa Couro',
          preco: 180,
          estoque: 5,
          badge: 'Destaque',
        },
      });
      const created = (createRes as any).data;

      const updateRes = engine.doPost({
        action: 'updateProduct',
        token: adminToken,
        product: {
          id: created.id,
          badge: '',
        },
      });

      expect(updateRes.success).toBe(true);
      if (updateRes.success) {
        const updated = updateRes.data as any;
        expect(updated.badge).toBeNull();
      }
    });

    it('deve retornar badges cadastrados em getCatalog e getProducts', () => {
      engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: {
          categoriaId: 'cat_geral',
          nome: 'Produto Com Badge',
          preco: 120,
          estoque: 10,
          badge: 'Mais Vendido',
        },
      });

      const catalogRes = engine.doGet({ action: 'catalog' });
      expect(catalogRes.success).toBe(true);
      if (catalogRes.success) {
        const data = catalogRes.data as any;
        const prod = data.products.find((p: any) => p.nome === 'Produto Com Badge');
        expect(prod).toBeDefined();
        expect(prod.badge).toBe('Mais Vendido');
      }
    });
  });

  describe('4. Normalização do Catálogo Inicial (normalizeCatalogInitialData)', () => {
    it('deve preservar os modos de layout (grid, list, editorial) na carga inicial do catálogo', async () => {
      const { normalizeCatalogInitialData } = await import('@/lib/sheetNormalization');

      const modes: CatalogLayoutMode[] = ['grid', 'list', 'editorial'];
      for (const mode of modes) {
        const raw = {
          store: {
            store_id: 'test_store',
            store_name: 'Minha Loja',
            catalog_layout: mode,
          },
          categories: [],
          products: [],
        };
        const normalized = normalizeCatalogInitialData(raw);
        expect(normalized.store.catalog_layout).toBe(mode);
      }
    });

    it('deve adotar "grid" como fallback caso catalog_layout seja inválido ou não informado', async () => {
      const { normalizeCatalogInitialData } = await import('@/lib/sheetNormalization');

      const rawInvalid = {
        store: {
          store_id: 'test_store',
          catalog_layout: 'desconhecido_invalido',
        },
      };
      const normalized = normalizeCatalogInitialData(rawInvalid);
      expect(normalized.store.catalog_layout).toBe('grid');
    });
  });
});
