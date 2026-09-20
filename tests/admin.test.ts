import { describe, it, expect, beforeEach } from 'vitest';
import { BackendEngine } from '../src/backend/engine';
import { imageUploadService } from '../src/lib/imageUploadService';
import type { Product, Category, VariationOption } from '../src/types';

describe('Módulo 2 — Painel Administrativo (/admin)', () => {
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
  // 1. AUTENTICAÇÃO E SESSÃO
  // ============================================================
  describe('Autenticação do Painel (/admin/login)', () => {
    it('deve autenticar administrador com senha correta e gerar token de sessão', () => {
      const res = engine.doPost({
        action: 'login',
        password: 'admin123',
      });
      expect(res.success).toBe(true);
      expect((res.data as any).authenticated).toBe(true);
      expect((res.data as any).token).toBeDefined();
    });

    it('deve rejeitar acesso com senha incorreta', () => {
      const res = engine.doPost({
        action: 'login',
        password: 'senha_incorreta',
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('INVALID_CREDENTIALS');
    });

    it('deve bloquear operações administrativas sem token de autorização', () => {
      const res = engine.doPost({
        action: 'createProduct',
        product: {
          nome: 'Produto Bloqueado',
          categoriaId: 'cat_geral',
          preco: 50,
          estoque: 5,
        },
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('UNAUTHORIZED');
    });
  });

  // ============================================================
  // 2. GESTÃO DE PRODUTOS
  // ============================================================
  describe('Operações de Produtos (/admin/produtos)', () => {
    it('deve criar produto completo com imagens e variações estruturadas', () => {
      const variacoes: VariationOption[] = [
        { tipo: 'Tamanho', opcoes: ['P', 'M', 'G'] },
        { tipo: 'Cor', opcoes: ['Preto', 'Branco'] },
      ];

      const res = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: {
          categoriaId: 'cat_geral',
          nome: 'Camiseta Premium Dry-Fit',
          descricao: 'Tecido tecnológico de alta performance',
          preco: 89.9,
          precoPromocional: 69.9,
          estoque: 25,
          ativo: true,
          imagens: ['https://cdn.example.com/dryfit-1.jpg'],
          variacoes,
        },
      });

      expect(res.success).toBe(true);
      const prod = res.data as Product;
      expect(prod.id).toMatch(/^prod_/);
      expect(prod.nome).toBe('Camiseta Premium Dry-Fit');
      expect(prod.variacoes).toHaveLength(2);
      expect(prod.variacoes[0]?.tipo).toBe('Tamanho');
      expect(prod.variacoes[0]?.opcoes).toEqual(['P', 'M', 'G']);
    });

    it('deve editar produto existente atualizando campos e timestamp', () => {
      const createRes = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: {
          categoriaId: 'cat_geral',
          nome: 'Produto para Editar',
          preco: 100,
          estoque: 10,
        },
      });
      const original = createRes.data as Product;

      const updateRes = engine.doPost({
        action: 'updateProduct',
        token: adminToken,
        product: {
          id: original.id,
          nome: 'Produto Editado com Novo Nome',
          preco: 120,
          estoque: 15,
        },
      });

      expect(updateRes.success).toBe(true);
      const updated = updateRes.data as Product;
      expect(updated.nome).toBe('Produto Editado com Novo Nome');
      expect(updated.preco).toBe(120);
      expect(updated.estoque).toBe(15);
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(original.updatedAt).getTime()
      );
    });

    it('deve alternar status ativo/inativo do produto', () => {
      const createRes = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: {
          categoriaId: 'cat_geral',
          nome: 'Produto para Desativar',
          preco: 50,
          estoque: 5,
          ativo: true,
        },
      });
      const original = createRes.data as Product;

      const toggleRes = engine.doPost({
        action: 'updateProduct',
        token: adminToken,
        product: {
          id: original.id,
          ativo: false,
        },
      });

      expect(toggleRes.success).toBe(true);
      expect((toggleRes.data as Product).ativo).toBe(false);

      // Produto inativo não deve mais aparecer na listagem pública
      const publicProducts = engine.doGet({ action: 'products' });
      const list = publicProducts.data as Product[];
      expect(list.find((p) => p.id === original.id)).toBeUndefined();
    });

    it('deve realizar exclusão lógica (soft delete) mantendo histórico na base', () => {
      const createRes = engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: {
          categoriaId: 'cat_geral',
          nome: 'Produto para Soft Delete',
          preco: 70,
          estoque: 2,
        },
      });
      const original = createRes.data as Product;

      const deleteRes = engine.doPost({
        action: 'deleteProduct',
        token: adminToken,
        id: original.id,
      });

      expect(deleteRes.success).toBe(true);
      expect((deleteRes.data as any).deleted).toBe(true);
      expect((deleteRes.data as any).deletedAt).toBeTruthy();

      // Garantir remoção da listagem pública
      const publicList = engine.doGet({ action: 'products' });
      const prods = publicList.data as Product[];
      expect(prods.find((p) => p.id === original.id)).toBeUndefined();
    });

    it('deve filtrar produtos por busca e categoria', () => {
      const catRes = engine.doPost({
        action: 'createCategory',
        token: adminToken,
        category: { nome: 'Calçados', ordem: 2 },
      });
      const novaCat = catRes.data as Category;

      engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: { categoriaId: 'cat_geral', nome: 'Camiseta Algodão', preco: 40, estoque: 5 },
      });
      engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: { categoriaId: novaCat.id, nome: 'Tênis Corrida', preco: 180, estoque: 3 },
      });

      // Filtragem no engine por categoria
      const catFilterRes = engine.doGet({ action: 'products', categoryId: novaCat.id });
      const catProducts = catFilterRes.data as Product[];
      expect(catProducts).toHaveLength(1);
      expect(catProducts[0]?.nome).toBe('Tênis Corrida');
    });
  });

  // ============================================================
  // 3. GESTÃO DE CATEGORIAS
  // ============================================================
  describe('Operações de Categorias (/admin/categorias)', () => {
    it('deve criar categoria e ordenar por ordem de exibição', () => {
      engine.doPost({
        action: 'createCategory',
        token: adminToken,
        category: { nome: 'Acessórios', ordem: 0 },
      });

      const res = engine.doGet({ action: 'categories' });
      const cats = res.data as Category[];
      expect(cats).toHaveLength(2);
      expect(cats[0]?.nome).toBe('Acessórios'); // ordem 0
      expect(cats[1]?.nome).toBe('Geral'); // ordem 1
    });

    it('deve desativar categoria e ocultar seus produtos da vitrine', () => {
      const catRes = engine.doPost({
        action: 'createCategory',
        token: adminToken,
        category: { nome: 'Categoria Temporária', ordem: 5 },
      });
      const tempCat = catRes.data as Category;

      engine.doPost({
        action: 'createProduct',
        token: adminToken,
        product: { categoriaId: tempCat.id, nome: 'Item Temporário', preco: 30, estoque: 1 },
      });

      // Desativa a categoria
      engine.doPost({
        action: 'deleteCategory',
        token: adminToken,
        id: tempCat.id,
      });

      // Produtos pertencentes à categoria desativada não devem aparecer
      const prodsRes = engine.doGet({ action: 'products' });
      const prods = prodsRes.data as Product[];
      expect(prods.find((p) => p.categoriaId === tempCat.id)).toBeUndefined();
    });
  });

  // ============================================================
  // 4. CONFIGURAÇÕES DA LOJA
  // ============================================================
  describe('Configurações & Identidade Visual (/admin/configuracoes)', () => {
    it('deve atualizar nome da loja, WhatsApp e cores com sucesso', () => {
      const res = engine.doPost({
        action: 'saveConfig',
        token: adminToken,
        config: {
          store_name: 'Boutique Flor de Lis',
          primary_color: '#3b82f6',
          secondary_color: '#1e40af',
          whatsapp: '5511988887777',
          domain: 'flordelis.com.br',
        },
      });

      expect(res.success).toBe(true);
      const conf = res.data as any;
      expect(conf.store_name).toBe('Boutique Flor de Lis');
      expect(conf.primary_color).toBe('#3b82f6');
      expect(conf.whatsapp).toBe('5511988887777');
    });

    it('deve bloquear tentativa de modificar chaves imutáveis', () => {
      const res = engine.doPost({
        action: 'saveConfig',
        token: adminToken,
        config: {
          store_id: 'novo_id_invalido',
        },
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('FORBIDDEN_MODIFICATION');
    });
  });

  // ============================================================
  // 5. SERVIÇO DE UPLOAD DE IMAGENS
  // ============================================================
  describe('Serviço Desacoplado de Imagens (imageUploadService)', () => {
    it('deve validar tipos de arquivo suportados (JPG, PNG, WEBP)', () => {
      const validFile = new File(['dummy content'], 'foto.jpg', { type: 'image/jpeg' });
      const validation = imageUploadService.validate(validFile);
      expect(validation.valid).toBe(true);
    });

    it('deve rejeitar formatos de arquivo não suportados (ex: PDF)', () => {
      const invalidFile = new File(['dummy content'], 'documento.pdf', {
        type: 'application/pdf',
      });
      const validation = imageUploadService.validate(invalidFile);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Formato não suportado');
    });

    it('deve rejeitar imagens maiores que 5 MB', () => {
      // Cria um mock de arquivo com 6 MB
      const bigFile = {
        name: 'foto_pesada.png',
        type: 'image/png',
        size: 6 * 1024 * 1024,
      } as unknown as File;

      const validation = imageUploadService.validate(bigFile);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('máximo 5 MB');
    });
  });
});
