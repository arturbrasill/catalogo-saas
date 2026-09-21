import { describe, it, expect, beforeEach } from 'vitest';
import { BackendEngine } from '../src/backend/engine';
import {
  CreateProductSchema,
  UpdateProductSchema,
  VariationOptionSchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  SaveConfigSchema,
} from '../src/lib/schemas';
import type { StoreConfig, Product, Category } from '../src/types';

describe('Módulo 1 — Backend Google Sheets + Apps Script (Auditoria & Testes Finais)', () => {
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

  // ============================================================
  // TESTES GET (CONSULTAS PÚBLICAS)
  // ============================================================
  describe('1. Consultas Públicas (GET)', () => {
    it('GET store: deve retornar dados públicos da loja e NUNCA segredos', () => {
      const res = engine.doGet({ action: 'store' });
      expect(res.success).toBe(true);
      expect(res.data).toBeTruthy();

      const store = res.data as StoreConfig;
      expect(store.store_id).toBe('loja_exemplo');
      expect(store.store_name).toBe('Minha Loja Digital');
      expect(store.currency).toBe('BRL');
      expect(store.whatsapp).toBe('5511999999999');

      const raw = res.data as Record<string, any>;
      expect(raw['admin_password_hash']).toBeUndefined();
      expect(raw['api_token']).toBeUndefined();
    });

    it('GET categories: deve retornar categorias ativas ordenadas por ordem', () => {
      // Criar mais uma categoria para testar ordenação
      engine.doPost({
        action: 'createCategory',
        token: adminToken,
        category: {
          nome: 'Acessórios',
          ordem: 0,
          ativo: true,
        },
      });

      const res = engine.doGet({ action: 'categories' });
      expect(res.success).toBe(true);
      const categories = res.data as Category[];
      expect(categories.length).toBe(2);
      // 'Acessórios' com ordem 0 deve vir antes de 'Geral' com ordem 1
      expect(categories[0]?.nome).toBe('Acessórios');
      expect(categories[1]?.nome).toBe('Geral');
    });

    it('GET products: deve retornar apenas produtos ativos de categorias ativas', () => {
      const createRes = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: {
          categoriaId: 'cat_geral',
          nome: 'Produto Ativo',
          preco: 50,
          estoque: 10,
        },
      });
      expect(createRes.success).toBe(true);

      const res = engine.doGet({ action: 'products' });
      expect(res.success).toBe(true);
      const products = res.data as Product[];
      expect(products.length).toBe(1);
      expect(products[0]?.nome).toBe('Produto Ativo');
      expect(products[0]?.deletedAt).toBeNull();
    });

    it('GET products: deve permitir filtragem por categoryId', () => {
      const catRes = engine.doPost({
        action: 'createCategory',
        token: adminToken,
        category: { nome: 'Calçados', ordem: 2 },
      });
      const novaCat = catRes.data as Category;

      engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: { categoriaId: 'cat_geral', nome: 'Item Geral', preco: 10, estoque: 5 },
      });
      engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: { categoriaId: novaCat.id, nome: 'Tênis Esportivo', preco: 150, estoque: 3 },
      });

      const filterRes = engine.doGet({ action: 'products', categoryId: novaCat.id });
      expect(filterRes.success).toBe(true);
      const filtered = filterRes.data as Product[];
      expect(filtered.length).toBe(1);
      expect(filtered[0]?.nome).toBe('Tênis Esportivo');
    });

    it('GET all: deve consolidar store, categories e products com alto desempenho', () => {
      const res = engine.doGet({ action: 'all' });
      expect(res.success).toBe(true);
      const data = res.data as { store: StoreConfig; categories: Category[]; products: Product[] };
      expect(data.store).toBeTruthy();
      expect(data.categories).toBeTruthy();
      expect(data.products).toBeTruthy();
      expect((data.store as any)['admin_password_hash']).toBeUndefined();
    });

    it('GET com ação inválida: deve retornar erro UNKNOWN_ACTION', () => {
      const res = engine.doGet({ action: 'invalid_action_xyz' });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('UNKNOWN_ACTION');
    });
  });

  // ============================================================
  // TESTES POST (MUTATOR & AUTH)
  // ============================================================
  describe('2. Autenticação & Autorização (POST)', () => {
    it('POST login: deve autenticar com senha correta e retornar token', () => {
      const res = engine.doPost({ action: 'login', password: 'admin123' });
      expect(res.success).toBe(true);
      expect(res.data).toHaveProperty('authenticated', true);
      expect(res.data).toHaveProperty('token');
    });

    it('POST login: deve falhar com senha incorreta (INVALID_CREDENTIALS)', () => {
      const res = engine.doPost({ action: 'login', password: 'senha_errada' });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('INVALID_CREDENTIALS');
    });

    it('POST login: deve falhar se senha não for enviada (MISSING_PASSWORD)', () => {
      const res = engine.doPost({ action: 'login' });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('MISSING_PASSWORD');
    });

    it('POST com token inválido: deve retornar UNAUTHORIZED', () => {
      const res = engine.doPost({
        action: 'createProduct',
        token: 'token_falso_invalido',
        product: { categoriaId: 'cat_geral', nome: 'Item Teste', preco: 10, estoque: 1 },
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('UNAUTHORIZED');
    });

    it('POST sem token: deve retornar UNAUTHORIZED', () => {
      const res = engine.doPost({
        action: 'createProduct',
        product: { categoriaId: 'cat_geral', nome: 'Item Teste', preco: 10, estoque: 1 },
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('UNAUTHORIZED');
    });

    it('POST com payload inválido/vazio: deve retornar INVALID_PAYLOAD', () => {
      const res = engine.doPost(null);
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('INVALID_PAYLOAD');

      const resEmpty = engine.doPost({});
      expect(resEmpty.success).toBe(false);
      expect(resEmpty.error?.code).toBe('INVALID_PAYLOAD');
    });
  });

  // ============================================================
  // TESTES DE CRUD DE PRODUTOS & VALIDAÇÕES CRÍTICAS
  // ============================================================
  describe('3. CRUD de Produtos & Casos Extremos (Edge Cases)', () => {
    it('POST createProduct: deve criar produto com dados válidos completos', () => {
      const payload = {
        categoriaId: 'cat_geral',
        nome: 'Camisa Polo Confort',
        slug: 'camisa-polo-confort',
        descricao: 'Polo em piquet de algodão',
        preco: 99.9,
        precoPromocional: 79.9,
        imagens: ['https://cdn.example.com/polo1.jpg'],
        variacoes: [
          { tipo: 'Tamanho', opcoes: ['P', 'M', 'G'] },
          { tipo: 'Cor', opcoes: ['Azul', 'Branco'] },
        ],
        estoque: 20,
        ativo: true,
      };

      const res = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: payload,
      });

      expect(res.success).toBe(true);
      const prod = res.data as Product;
      expect(prod.id).toMatch(/^prod_/);
      expect(prod.nome).toBe('Camisa Polo Confort');
      expect(prod.preco).toBe(99.9);
      expect(prod.precoPromocional).toBe(79.9);
      expect(prod.variacoes.length).toBe(2);
      expect(prod.deletedAt).toBeNull();
    });

    it('POST createProduct: deve rejeitar se categoria inexistente', () => {
      const res = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: {
          categoriaId: 'cat_fantasma_inexistente',
          nome: 'Produto Sem Categoria',
          preco: 50,
          estoque: 10,
        },
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('NOT_FOUND');
      expect(res.error?.message).toContain('A categoria informada não existe');
    });

    it('POST createProduct: deve rejeitar preço inválido (zero ou negativo)', () => {
      const resZero = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: { categoriaId: 'cat_geral', nome: 'Item Grátis', preco: 0, estoque: 10 },
      });
      expect(resZero.success).toBe(false);
      expect(resZero.error?.code).toBe('VALIDATION_ERROR');

      const resNeg = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: { categoriaId: 'cat_geral', nome: 'Item Negativo', preco: -15, estoque: 10 },
      });
      expect(resNeg.success).toBe(false);
      expect(resNeg.error?.code).toBe('VALIDATION_ERROR');
    });

    it('POST createProduct: deve rejeitar preço promocional maior ou igual ao preço normal', () => {
      const res = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: {
          categoriaId: 'cat_geral',
          nome: 'Promo Falsa',
          preco: 100,
          precoPromocional: 120, // maior que o preço normal!
          estoque: 5,
        },
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION_ERROR');
      expect(res.error?.message).toContain('estritamente menor');
    });

    it('POST createProduct: deve rejeitar estoque inválido (< -1 ou não inteiro)', () => {
      const resNegativo = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: { categoriaId: 'cat_geral', nome: 'Estoque Ruim', preco: 50, estoque: -5 },
      });
      expect(resNegativo.success).toBe(false);
      expect(resNegativo.error?.code).toBe('VALIDATION_ERROR');

      const resFracionado = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: { categoriaId: 'cat_geral', nome: 'Estoque Quebrado', preco: 50, estoque: 2.5 },
      });
      expect(resFracionado.success).toBe(false);
      expect(resFracionado.error?.code).toBe('VALIDATION_ERROR');
    });

    it('POST createProduct: deve aceitar estoque -1 (estoque ilimitado)', () => {
      const res = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: {
          categoriaId: 'cat_geral',
          nome: 'Produto Sob Encomenda',
          preco: 150,
          estoque: -1,
        },
      });
      expect(res.success).toBe(true);
      const prod = res.data as Product;
      expect(prod.estoque).toBe(-1);
    });

    it('POST createProduct: deve rejeitar JSON de variações inválido', () => {
      // Caso 1: Variação sem tipo
      const resSemTipo = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: {
          categoriaId: 'cat_geral',
          nome: 'Produto Var Ruim',
          preco: 50,
          estoque: 10,
          variacoes: [{ tipo: '', opcoes: ['A', 'B'] }],
        },
      });
      expect(resSemTipo.success).toBe(false);
      expect(resSemTipo.error?.code).toBe('VALIDATION_ERROR');

      // Caso 2: Variação com opções vazias
      const resOpcoesVazias = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: {
          categoriaId: 'cat_geral',
          nome: 'Produto Var Vazia',
          preco: 50,
          estoque: 10,
          variacoes: [{ tipo: 'Tamanho', opcoes: [] }],
        },
      });
      expect(resOpcoesVazias.success).toBe(false);
      expect(resOpcoesVazias.error?.code).toBe('VALIDATION_ERROR');

      // Caso 3: Opções contendo strings vazias
      const resStringVazia = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: {
          categoriaId: 'cat_geral',
          nome: 'Produto Var String Vazia',
          preco: 50,
          estoque: 10,
          variacoes: [{ tipo: 'Cor', opcoes: [''] }],
        },
      });
      expect(resStringVazia.success).toBe(false);
      expect(resStringVazia.error?.code).toBe('VALIDATION_ERROR');
    });

    it('POST updateProduct: deve atualizar produto e rejeitar se ID inexistente', () => {
      const createRes = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: { categoriaId: 'cat_geral', nome: 'Original', preco: 100, estoque: 5 },
      });
      const original = createRes.data as Product;

      // Update válido
      const updateRes = engine.doPost({
        action: 'updateProduct',
        token: adminToken,
        product: { id: original.id, nome: 'Nome Modificado', preco: 110 },
      });
      expect(updateRes.success).toBe(true);
      const updated = updateRes.data as Product;
      expect(updated.nome).toBe('Nome Modificado');
      expect(updated.preco).toBe(110);

      // Update com ID inexistente
      const updateInexistente = engine.doPost({
        action: 'updateProduct',
        token: adminToken,
        product: { id: 'prod_nao_existe', nome: 'Fantasma' },
      });
      expect(updateInexistente.success).toBe(false);
      expect(updateInexistente.error?.code).toBe('NOT_FOUND');
    });

    it('POST deleteProduct: deve realizar soft delete e rejeitar se ID inexistente', () => {
      const createRes = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: { categoriaId: 'cat_geral', nome: 'Para Deletar', preco: 80, estoque: 2 },
      });
      const original = createRes.data as Product;

      // Delete válido
      const deleteRes = engine.doPost({
        action: 'deleteProduct',
        token: adminToken,
        id: original.id,
      });
      expect(deleteRes.success).toBe(true);
      expect((deleteRes.data as any).deleted).toBe(true);
      expect((deleteRes.data as any).deletedAt).toBeTruthy();

      // Verificar que sumiu da vitrine pública
      const publicList = engine.doGet({ action: 'products' });
      const prods = publicList.data as Product[];
      expect(prods.find((p) => p.id === original.id)).toBeUndefined();

      // Delete com ID inexistente
      const deleteInexistente = engine.doPost({
        action: 'deleteProduct',
        token: adminToken,
        id: 'prod_inexistente_123',
      });
      expect(deleteInexistente.success).toBe(false);
      expect(deleteInexistente.error?.code).toBe('NOT_FOUND');
    });
  });

  // ============================================================
  // TESTES DE CONFIGURAÇÃO & CAMPOS PROTEGIDOS
  // ============================================================
  describe('4. Configuração da Loja & Proteção de Campos', () => {
    it('POST saveConfig: deve salvar configurações permitidas', () => {
      const res = engine.doPost({
        action: 'saveConfig',
        token: adminToken,
        config: {
          store_name: 'Boutique Elegância',
          primary_color: '#059669',
          secondary_color: '#064e3b',
          whatsapp: '5511977776666',
        },
      });

      expect(res.success).toBe(true);
      const conf = res.data as StoreConfig;
      expect(conf.store_name).toBe('Boutique Elegância');
      expect(conf.primary_color).toBe('#059669');
      expect(conf.whatsapp).toBe('5511977776666');
    });

    it('POST saveConfig: deve salvar e carregar status de funcionamento (is_open, business_hours) e chave PIX', () => {
      const res = engine.doPost({
        action: 'saveConfig',
        token: adminToken,
        config: {
          is_open: false,
          business_hours: 'Seg a Sáb: 09h às 19h',
          pix_key: '11988887777',
          pix_key_type: 'Celular',
        },
      });

      expect(res.success).toBe(true);
      const conf = res.data as StoreConfig;
      expect(conf.is_open).toBe(false);
      expect(conf.business_hours).toBe('Seg a Sáb: 09h às 19h');
      expect(conf.pix_key).toBe('11988887777');
      expect(conf.pix_key_type).toBe('Celular');

      // Verifica no GET store
      const storeRes = engine.doGet({ action: 'store' });
      expect(storeRes.success).toBe(true);
      const storeData = storeRes.data as StoreConfig;
      expect(storeData.is_open).toBe(false);
      expect(storeData.business_hours).toBe('Seg a Sáb: 09h às 19h');
      expect(storeData.pix_key).toBe('11988887777');
      expect(storeData.pix_key_type).toBe('Celular');
    });

    it('POST saveConfig: deve BLOQUEAR tentativa de alterar campos protegidos (store_id, api_token, admin_password_hash)', () => {
      // Teste store_id
      const resStoreId = engine.doPost({
        action: 'saveConfig',
        token: adminToken,
        config: { store_id: 'tentativa_de_hack' },
      });
      expect(resStoreId.success).toBe(false);
      expect(resStoreId.error?.code).toBe('FORBIDDEN_MODIFICATION');

      // Teste api_token
      const resToken = engine.doPost({
        action: 'saveConfig',
        token: adminToken,
        config: { api_token: 'novo_token_injetado' },
      });
      expect(resToken.success).toBe(false);
      expect(resToken.error?.code).toBe('FORBIDDEN_MODIFICATION');

      // Teste admin_password_hash
      const resHash = engine.doPost({
        action: 'saveConfig',
        token: adminToken,
        config: { admin_password_hash: 'hash_injetado' },
      });
      expect(resHash.success).toBe(false);
      expect(resHash.error?.code).toBe('FORBIDDEN_MODIFICATION');
    });
  });

  // ============================================================
  // TESTES DE CRUD DE CATEGORIAS
  // ============================================================
  describe('5. Gestão de Categorias (CRUD Completo)', () => {
    it('POST createCategory: deve criar uma nova categoria com sucesso', () => {
      const res = engine.doPost({
        action: 'createCategory',
        token: adminToken,
        category: {
          nome: 'Moda Feminina',
          slug: 'moda-feminina',
          ordem: 2,
        },
      });

      expect(res.success).toBe(true);
      const cat = res.data as Category;
      expect(cat.id).toMatch(/^cat_/);
      expect(cat.nome).toBe('Moda Feminina');
      expect(cat.ativo).toBe(true);
    });

    it('POST updateCategory: deve atualizar categoria existente e falhar se inexistente', () => {
      const createRes = engine.doPost({
        action: 'createCategory',
        token: adminToken,
        category: { nome: 'Infantil' },
      });
      const cat = createRes.data as Category;

      const updateRes = engine.doPost({
        action: 'updateCategory',
        token: adminToken,
        category: { id: cat.id, nome: 'Moda Infantil & Bebê' },
      });
      expect(updateRes.success).toBe(true);
      expect((updateRes.data as Category).nome).toBe('Moda Infantil & Bebê');

      const notFoundRes = engine.doPost({
        action: 'updateCategory',
        token: adminToken,
        category: { id: 'cat_inexistente', nome: 'Fantasma' },
      });
      expect(notFoundRes.success).toBe(false);
      expect(notFoundRes.error?.code).toBe('NOT_FOUND');
    });

    it('POST deleteCategory: deve desativar categoria com soft delete', () => {
      const createRes = engine.doPost({
        action: 'createCategory',
        token: adminToken,
        category: { nome: 'Categoria Temporaria' },
      });
      const cat = createRes.data as Category;

      const delRes = engine.doPost({
        action: 'deleteCategory',
        token: adminToken,
        id: cat.id,
      });
      expect(delRes.success).toBe(true);

      // Categoria inativa não deve aparecer na vitrine pública
      const publicCats = engine.doGet({ action: 'categories' });
      const cats = publicCats.data as Category[];
      expect(cats.find((c) => c.id === cat.id)).toBeUndefined();
    });
  });

  // ============================================================
  // TESTES DE SCHEMAS ZOD
  // ============================================================
  describe('6. Validações Zod Runtime', () => {
    it('deve validar e rejeitar variações com formatos inválidos', () => {
      expect(() =>
        VariationOptionSchema.parse({ tipo: 'Cor', opcoes: ['Azul'] })
      ).not.toThrow();

      expect(() =>
        VariationOptionSchema.parse({ tipo: '', opcoes: ['Azul'] })
      ).toThrow();

      expect(() =>
        VariationOptionSchema.parse({ tipo: 'Cor', opcoes: [] })
      ).toThrow();
    });

    it('deve rejeitar criação de produto com precoPromocional >= preco', () => {
      const invalido = {
        categoriaId: 'cat_geral',
        nome: 'Tenis',
        preco: 100,
        precoPromocional: 150,
        estoque: 10,
      };
      expect(() => CreateProductSchema.parse(invalido)).toThrow();
    });

    it('deve validar categoria Zod', () => {
      expect(() =>
        CreateCategorySchema.parse({ nome: 'Eletrônicos', ordem: 1 })
      ).not.toThrow();

      expect(() =>
        CreateCategorySchema.parse({ nome: 'A', ordem: -1 })
      ).toThrow();
    });
  });
});
