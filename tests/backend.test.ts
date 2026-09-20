import { describe, it, expect, beforeEach } from 'vitest';
import { BackendEngine } from '../src/backend/engine';
import {
  CreateProductSchema,
  UpdateProductSchema,
  VariationOptionSchema,
  SaveConfigSchema,
} from '../src/lib/schemas';
import type { StoreConfig, Product } from '../src/types';

describe('Módulo 1 — Backend Google Sheets + Apps Script', () => {
  let engine: BackendEngine;
  let adminToken: string;

  beforeEach(() => {
    engine = new BackendEngine();
    const loginRes = engine.doPost({
      action: 'login',
      password: 'admin123',
    });
    expect(loginRes.success).toBe(true);
    adminToken = (loginRes.data as { token: string }).token;
  });

  describe('1. Inicialização do Banco & Isolamento de Segurança', () => {
    it('deve inicializar o banco com configurações e categoria padrão', () => {
      const storeRes = engine.doGet({ action: 'store' });
      expect(storeRes.success).toBe(true);

      const store = storeRes.data as StoreConfig;
      expect(store.store_id).toBe('loja_exemplo');
      expect(store.store_name).toBe('Minha Loja Digital');
      expect(store.currency).toBe('BRL');

      const catRes = engine.doGet({ action: 'categories' });
      expect(catRes.success).toBe(true);
      expect(Array.isArray(catRes.data)).toBe(true);
      expect((catRes.data as any[]).length).toBe(1);
    });

    it('NUNCA deve expor admin_password_hash nem api_token em consultas públicas', () => {
      const storeRes = engine.doGet({ action: 'store' });
      expect(storeRes.success).toBe(true);

      const rawData = storeRes.data as Record<string, any>;
      expect(rawData['admin_password_hash']).toBeUndefined();
      expect(rawData['api_token']).toBeUndefined();

      const allRes = engine.doGet({ action: 'all' });
      expect(allRes.success).toBe(true);
      const allStore = (allRes.data as any).store as Record<string, any>;
      expect(allStore['admin_password_hash']).toBeUndefined();
      expect(allStore['api_token']).toBeUndefined();
    });

    it('deve retornar erro adequado para ação GET desconhecida', () => {
      const res = engine.doGet({ action: 'nonExistentAction' });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('UNKNOWN_ACTION');
    });
  });

  describe('2. Autenticação & Autorização', () => {
    it('deve autenticar com senha correta e retornar token', () => {
      const res = engine.doPost({
        action: 'login',
        password: 'admin123',
      });
      expect(res.success).toBe(true);
      expect(res.data).toHaveProperty('authenticated', true);
      expect(res.data).toHaveProperty('token');
    });

    it('deve rejeitar login com senha incorreta', () => {
      const res = engine.doPost({
        action: 'login',
        password: 'senha_errada_123',
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('INVALID_CREDENTIALS');
    });

    it('deve rejeitar login sem campo de senha', () => {
      const res = engine.doPost({
        action: 'login',
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('MISSING_PASSWORD');
    });

    it('deve rejeitar operações de escrita administrativas sem token', () => {
      const res = engine.doPost({
        action: 'createProduct',
        product: {
          nome: 'Produto Sem Auth',
          categoriaId: 'cat_geral',
          preco: 50,
        },
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('UNAUTHORIZED');
    });

    it('deve rejeitar operações de escrita administrativas com token inválido', () => {
      const res = engine.doPost({
        action: 'createProduct',
        token: 'token_falso_invalido',
        product: {
          nome: 'Produto Token Invalido',
          categoriaId: 'cat_geral',
          preco: 50,
        },
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('UNAUTHORIZED');
    });
  });

  describe('3. CRUD de Produtos & Soft Delete', () => {
    it('deve criar um produto com sucesso sob autenticação', () => {
      const newProductPayload = {
        categoriaId: 'cat_geral',
        nome: 'Camiseta Básica Algodão',
        slug: 'camiseta-basica-algodao',
        descricao: '100% algodão',
        preco: 79.9,
        precoPromocional: 59.9,
        imagens: ['https://example.com/cam.png'],
        variacoes: [
          {
            tipo: 'Tamanho',
            opcoes: ['P', 'M', 'G'],
          },
        ],
        estoque: 15,
        ativo: true,
      };

      const res = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: newProductPayload,
      });

      expect(res.success).toBe(true);
      const created = res.data as Product;
      expect(created.id).toMatch(/^prod_/);
      expect(created.nome).toBe('Camiseta Básica Algodão');
      expect(created.preco).toBe(79.9);
      expect(created.deletedAt).toBeNull();

      // Verificar listagem pública
      const listRes = engine.doGet({ action: 'products' });
      expect(listRes.success).toBe(true);
      const products = listRes.data as Product[];
      expect(products.length).toBe(1);
      expect(products[0]?.id).toBe(created.id);
    });

    it('deve rejeitar criação de produto com dados inválidos (preço negativo / sem nome)', () => {
      const invalidPayload = {
        categoriaId: 'cat_geral',
        nome: '',
        preco: -10,
      };

      const res = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: invalidPayload,
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION_ERROR');
    });

    it('deve atualizar campos de um produto existente', () => {
      const createRes = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: {
          categoriaId: 'cat_geral',
          nome: 'Produto para Atualizar',
          preco: 100,
          estoque: 10,
        },
      });
      const created = createRes.data as Product;

      const updateRes = engine.doPost({
        action: 'updateProduct',
        token: adminToken,
        product: {
          id: created.id,
          nome: 'Produto Atualizado com Sucesso',
          preco: 120,
          estoque: 8,
        },
      });

      expect(updateRes.success).toBe(true);
      const updated = updateRes.data as Product;
      expect(updated.nome).toBe('Produto Atualizado com Sucesso');
      expect(updated.preco).toBe(120);
      expect(updated.estoque).toBe(8);
    });

    it('deve realizar exclusão lógica (soft delete) sem apagar histórico', () => {
      const createRes = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: {
          categoriaId: 'cat_geral',
          nome: 'Produto para Soft Delete',
          preco: 50,
          estoque: 5,
        },
      });
      const created = createRes.data as Product;

      const deleteRes = engine.doPost({
        action: 'deleteProduct',
        token: adminToken,
        id: created.id,
      });

      expect(deleteRes.success).toBe(true);
      expect((deleteRes.data as any).deleted).toBe(true);
      expect((deleteRes.data as any).deletedAt).toBeTruthy();

      // Consulta pública não deve mais retornar o produto excluído
      const publicProductsRes = engine.doGet({ action: 'products' });
      const products = publicProductsRes.data as Product[];
      const found = products.find((p) => p.id === created.id);
      expect(found).toBeUndefined();
    });
  });

  describe('4. Salvamento de Configurações & Proteção Imutável', () => {
    it('deve salvar configurações permitidas com sucesso', () => {
      const res = engine.doPost({
        action: 'saveConfig',
        token: adminToken,
        config: {
          store_name: 'Minha Nova Loja Digital',
          primary_color: '#3b82f6',
          whatsapp: '5511988887777',
        },
      });

      expect(res.success).toBe(true);
      const updatedConfig = res.data as StoreConfig;
      expect(updatedConfig.store_name).toBe('Minha Nova Loja Digital');
      expect(updatedConfig.primary_color).toBe('#3b82f6');
      expect(updatedConfig.whatsapp).toBe('5511988887777');
    });

    it('deve BLOQUEAR qualquer tentativa de alterar api_token ou store_id via saveConfig', () => {
      const resToken = engine.doPost({
        action: 'saveConfig',
        token: adminToken,
        config: {
          api_token: 'hacker_injected_token',
        },
      });
      expect(resToken.success).toBe(false);
      expect(resToken.error?.code).toBe('FORBIDDEN_MODIFICATION');

      const resStoreId = engine.doPost({
        action: 'saveConfig',
        token: adminToken,
        config: {
          store_id: 'loja_roubada',
        },
      });
      expect(resStoreId.success).toBe(false);
      expect(resStoreId.error?.code).toBe('FORBIDDEN_MODIFICATION');
    });
  });

  describe('5. Validação de Esquemas Zod', () => {
    it('deve validar schema de variação de produto', () => {
      const validVariation = {
        tipo: 'Tamanho',
        opcoes: ['P', 'M', 'G'],
      };
      expect(() => VariationOptionSchema.parse(validVariation)).not.toThrow();

      const invalidVariation = {
        tipo: '',
        opcoes: [],
      };
      expect(() => VariationOptionSchema.parse(invalidVariation)).toThrow();
    });

    it('deve validar schema de criação de produto', () => {
      const validProduct = {
        categoriaId: 'cat_geral',
        nome: 'Tenis Esportivo',
        slug: 'tenis-esportivo',
        descricao: 'Confortável para corrida',
        preco: 199.9,
        estoque: 10,
        ativo: true,
      };
      expect(() => CreateProductSchema.parse(validProduct)).not.toThrow();

      const invalidProduct = {
        categoriaId: '',
        nome: 'T',
        preco: -50,
        estoque: -5,
      };
      expect(() => CreateProductSchema.parse(invalidProduct)).toThrow();
    });

    it('deve validar schema de configurações da loja', () => {
      const validConfig = {
        store_name: 'Boutique Flor',
        primary_color: '#ff5500',
        whatsapp: '5511999999999',
      };
      expect(() => SaveConfigSchema.parse(validConfig)).not.toThrow();

      const invalidConfig = {
        primary_color: 'cor-invalida',
        whatsapp: 'telefone com letras',
      };
      expect(() => SaveConfigSchema.parse(invalidConfig)).toThrow();
    });
  });
});
