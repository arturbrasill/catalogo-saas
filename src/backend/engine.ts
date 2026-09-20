import crypto from 'crypto';
import type {
  Category,
  Product,
  StoreConfig,
  APIResponse,
  VariationOption,
  CreateCategoryInput,
  UpdateCategoryInput,
  StoreConfigInternal,
} from '../types';

export class BackendEngine {
  private configMap: Map<string, string> = new Map();
  private categories: Category[] = [];
  private products: Product[] = [];

  constructor(initialConfig?: Partial<StoreConfigInternal>) {
    this.initDatabase(initialConfig);
  }

  public initDatabase(initialConfig?: Partial<StoreConfigInternal>): void {
    const defaultPasswordHash =
      initialConfig?.admin_password_hash || this.hashPassword('admin123');
    const defaultApiToken =
      initialConfig?.api_token || 'tok_mock_default_1234567890';

    this.configMap.set('store_id', initialConfig?.store_id || 'loja_exemplo');
    this.configMap.set('store_name', initialConfig?.store_name || 'Minha Loja Digital');
    this.configMap.set(
      'logo_url',
      initialConfig?.logo_url || 'https://images.unsplash.com/photo-example.jpg'
    );
    this.configMap.set('primary_color', initialConfig?.primary_color || '#10b981');
    this.configMap.set('secondary_color', initialConfig?.secondary_color || '#047857');
    this.configMap.set('whatsapp', initialConfig?.whatsapp || '5511999999999');
    this.configMap.set('admin_password_hash', defaultPasswordHash);
    this.configMap.set('api_token', defaultApiToken);
    this.configMap.set('domain', initialConfig?.domain || 'loja-exemplo.com.br');
    this.configMap.set('currency', initialConfig?.currency || 'BRL');
    this.configMap.set('timezone', initialConfig?.timezone || 'America/Sao_Paulo');

    const now = new Date().toISOString();
    this.categories = [
      {
        id: 'cat_geral',
        nome: 'Geral',
        slug: 'geral',
        ativo: true,
        ordem: 1,
        createdAt: now,
        updatedAt: now,
      },
    ];

    this.products = [];
  }

  public hashPassword(password: string): string {
    const salt = 'CATALOGO_SAAS_SALT_v1_';
    return crypto.createHash('sha256').update(salt + password).digest('hex');
  }

  public doGet(params: Record<string, string | undefined>): APIResponse<unknown> {
    try {
      const action = params['action'] || 'store';

      switch (action) {
        case 'store':
          return { success: true, data: this.getPublicStoreConfig(), error: null };
        case 'categories':
          return { success: true, data: this.getActiveCategories(), error: null };
        case 'products':
          return {
            success: true,
            data: this.getActiveProducts(params['categoryId']),
            error: null,
          };
        case 'all':
          return { success: true, data: this.getInitialCatalogData(), error: null };
        default:
          return {
            success: false,
            data: null,
            error: {
              code: 'UNKNOWN_ACTION',
              message: `Ação GET desconhecida: ${action}`,
            },
          };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  public doPost(payload: any): APIResponse<unknown> {
    try {
      if (!payload || typeof payload !== 'object' || !payload.action) {
        return {
          success: false,
          data: null,
          error: {
            code: 'INVALID_PAYLOAD',
            message: 'Payload ausente ou sem campo "action".',
          },
        };
      }

      if (payload.action === 'login') {
        const result = this.handleLogin(payload.password);
        return { success: true, data: result, error: null };
      }

      const authError = this.validateAuthorization(payload.token);
      if (authError) {
        return {
          success: false,
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: authError,
          },
        };
      }

      switch (payload.action) {
        case 'createProduct': {
          const product = this.handleCreateProduct(payload.product);
          return { success: true, data: product, error: null };
        }
        case 'updateProduct': {
          const updated = this.handleUpdateProduct(payload.product);
          return { success: true, data: updated, error: null };
        }
        case 'deleteProduct': {
          const deleted = this.handleDeleteProduct(payload.id);
          return { success: true, data: deleted, error: null };
        }
        case 'createCategory': {
          const category = this.handleCreateCategory(payload.category);
          return { success: true, data: category, error: null };
        }
        case 'updateCategory': {
          const updated = this.handleUpdateCategory(payload.category);
          return { success: true, data: updated, error: null };
        }
        case 'deleteCategory': {
          const deleted = this.handleDeleteCategory(payload.id);
          return { success: true, data: deleted, error: null };
        }
        case 'saveConfig': {
          const config = this.handleSaveConfig(payload.config);
          return { success: true, data: config, error: null };
        }
        default:
          return {
            success: false,
            data: null,
            error: {
              code: 'UNKNOWN_ACTION',
              message: `Ação POST desconhecida: ${payload.action}`,
            },
          };
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const codeMatch = msg.match(/^([A-Z_]+):\s*(.+)$/);
      return {
        success: false,
        data: null,
        error: {
          code: codeMatch && codeMatch[1] ? codeMatch[1] : 'INTERNAL_ERROR',
          message: codeMatch && codeMatch[2] ? codeMatch[2] : msg,
        },
      };
    }
  }

  public getPublicStoreConfig(): StoreConfig {
    const config: Partial<StoreConfig> = {};
    const sensitiveKeys = ['admin_password_hash', 'api_token'];

    this.configMap.forEach((val, key) => {
      if (!sensitiveKeys.includes(key)) {
        (config as any)[key] = val;
      }
    });

    return config as StoreConfig;
  }

  public getActiveCategories(): Category[] {
    return this.categories
      .filter((c) => c.ativo)
      .sort((a, b) => a.ordem - b.ordem);
  }

  public getActiveProducts(filterCategoryId?: string): Product[] {
    const activeCategoryIds = new Set(this.getActiveCategories().map((c) => c.id));

    return this.products.filter((p) => {
      if (!p.ativo || p.deletedAt !== null) return false;
      if (!activeCategoryIds.has(p.categoriaId)) return false;
      if (filterCategoryId && p.categoriaId !== filterCategoryId) return false;
      return true;
    });
  }

  public getInitialCatalogData() {
    return {
      store: this.getPublicStoreConfig(),
      categories: this.getActiveCategories(),
      products: this.getActiveProducts(),
    };
  }

  public handleLogin(password: string) {
    if (!password || typeof password !== 'string') {
      throw new Error('MISSING_PASSWORD: A senha é obrigatória.');
    }

    const storedHash = this.configMap.get('admin_password_hash');
    const apiToken = this.configMap.get('api_token');

    if (!storedHash) {
      throw new Error('CONFIG_ERROR: Senha administrativa não configurada.');
    }

    const inputHash = this.hashPassword(password);
    if (inputHash !== storedHash) {
      throw new Error('INVALID_CREDENTIALS: Senha incorreta.');
    }

    return {
      authenticated: true,
      token: apiToken,
    };
  }

  public handleCreateProduct(productData: any): Product {
    if (!productData || typeof productData !== 'object') {
      throw new Error('VALIDATION_ERROR: Dados do produto ausentes ou inválidos.');
    }

    if (!productData.nome || typeof productData.nome !== 'string' || productData.nome.trim().length < 2) {
      throw new Error('VALIDATION_ERROR: Nome do produto deve ter no mínimo 2 caracteres.');
    }

    if (!productData.categoriaId || typeof productData.categoriaId !== 'string') {
      throw new Error('VALIDATION_ERROR: ID da categoria é obrigatório.');
    }

    // Integridade referencial
    this.assertCategoryExists(productData.categoriaId.trim());

    const preco = parseFloat(productData.preco);
    if (isNaN(preco) || preco <= 0) {
      throw new Error('VALIDATION_ERROR: O preço deve ser um número positivo.');
    }

    let precoPromocional: number | null = null;
    if (
      productData.precoPromocional !== undefined &&
      productData.precoPromocional !== null &&
      productData.precoPromocional !== ''
    ) {
      precoPromocional = parseFloat(productData.precoPromocional);
      if (isNaN(precoPromocional) || precoPromocional <= 0) {
        throw new Error('VALIDATION_ERROR: O preço promocional deve ser maior que zero.');
      }
      if (precoPromocional >= preco) {
        throw new Error('VALIDATION_ERROR: O preço promocional deve ser estritamente menor que o preço original.');
      }
    }

    // Validação de estoque
    if (productData.estoque === undefined || productData.estoque === null || productData.estoque === '') {
      throw new Error('VALIDATION_ERROR: O estoque é obrigatório.');
    }
    const estoqueNum = Number(productData.estoque);
    if (!Number.isInteger(estoqueNum) || estoqueNum < -1) {
      throw new Error('VALIDATION_ERROR: O estoque deve ser um número inteiro maior ou igual a -1.');
    }

    // Validação de variações
    const validatedVariations = this.validateVariations(productData.variacoes);

    // Validação de imagens
    const validatedImagens = this.validateImages(productData.imagens);

    const id = 'prod_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);
    const slug = productData.slug ? String(productData.slug).trim() : this.generateSlug(productData.nome);
    const nowIso = new Date().toISOString();

    const product: Product = {
      id,
      categoriaId: productData.categoriaId.trim(),
      nome: String(productData.nome).trim(),
      slug,
      descricao: productData.descricao ? String(productData.descricao).trim() : '',
      preco,
      precoPromocional,
      imagens: validatedImagens,
      variacoes: validatedVariations,
      estoque: estoqueNum,
      ativo: productData.ativo !== false,
      createdAt: nowIso,
      updatedAt: nowIso,
      deletedAt: null,
    };

    this.products.push(product);
    return product;
  }

  public handleUpdateProduct(productData: any): Product {
    if (!productData || !productData.id) {
      throw new Error('VALIDATION_ERROR: ID do produto é obrigatório para atualização.');
    }

    const targetIndex = this.products.findIndex((p) => p.id === String(productData.id).trim());
    if (targetIndex === -1) {
      throw new Error('NOT_FOUND: Produto não encontrado com ID: ' + productData.id);
    }

    const current = this.products[targetIndex]!;
    const nowIso = new Date().toISOString();

    let updatedCategoriaId = current.categoriaId;
    if (productData.categoriaId !== undefined) {
      const catId = String(productData.categoriaId).trim();
      this.assertCategoryExists(catId);
      updatedCategoriaId = catId;
    }

    let updatedPreco = current.preco;
    if (productData.preco !== undefined) {
      const p = parseFloat(productData.preco);
      if (isNaN(p) || p <= 0) throw new Error('VALIDATION_ERROR: O preço deve ser um número positivo.');
      updatedPreco = p;
    }

    let updatedPrecoPromocional = current.precoPromocional;
    if (productData.precoPromocional !== undefined) {
      if (productData.precoPromocional === null || productData.precoPromocional === '') {
        updatedPrecoPromocional = null;
      } else {
        const pp = parseFloat(productData.precoPromocional);
        if (isNaN(pp) || pp <= 0) throw new Error('VALIDATION_ERROR: O preço promocional deve ser maior que zero.');
        if (pp >= updatedPreco) {
          throw new Error('VALIDATION_ERROR: O preço promocional deve ser estritamente menor que o preço original.');
        }
        updatedPrecoPromocional = pp;
      }
    }

    let updatedEstoque = current.estoque;
    if (productData.estoque !== undefined) {
      const est = Number(productData.estoque);
      if (!Number.isInteger(est) || est < -1) {
        throw new Error('VALIDATION_ERROR: O estoque deve ser um número inteiro maior ou igual a -1.');
      }
      updatedEstoque = est;
    }

    let updatedVariacoes = current.variacoes;
    if (productData.variacoes !== undefined) {
      updatedVariacoes = this.validateVariations(productData.variacoes);
    }

    let updatedImagens = current.imagens;
    if (productData.imagens !== undefined) {
      updatedImagens = this.validateImages(productData.imagens);
    }

    const updatedProduct: Product = {
      ...current,
      categoriaId: updatedCategoriaId,
      nome: productData.nome !== undefined ? String(productData.nome).trim() : current.nome,
      slug: productData.slug !== undefined ? String(productData.slug).trim() : current.slug,
      descricao: productData.descricao !== undefined ? String(productData.descricao).trim() : current.descricao,
      preco: updatedPreco,
      precoPromocional: updatedPrecoPromocional,
      imagens: updatedImagens,
      variacoes: updatedVariacoes,
      estoque: updatedEstoque,
      ativo: productData.ativo !== undefined ? Boolean(productData.ativo) : current.ativo,
      updatedAt: nowIso,
    };

    if (updatedProduct.nome.length < 2) {
      throw new Error('VALIDATION_ERROR: Nome do produto deve ter no mínimo 2 caracteres.');
    }

    this.products[targetIndex] = updatedProduct;
    return updatedProduct;
  }

  public handleDeleteProduct(productId: string) {
    if (!productId || typeof productId !== 'string') {
      throw new Error('VALIDATION_ERROR: ID do produto é obrigatório.');
    }

    const target = this.products.find((p) => p.id === String(productId).trim());
    if (!target) {
      throw new Error('NOT_FOUND: Produto não encontrado com ID: ' + productId);
    }

    const nowIso = new Date().toISOString();
    target.ativo = false;
    target.updatedAt = nowIso;
    target.deletedAt = nowIso;

    return {
      id: productId.trim(),
      deleted: true,
      deletedAt: nowIso,
    };
  }

  public handleCreateCategory(categoryData: CreateCategoryInput): Category {
    if (!categoryData || typeof categoryData !== 'object') {
      throw new Error('VALIDATION_ERROR: Dados da categoria ausentes.');
    }

    if (!categoryData.nome || typeof categoryData.nome !== 'string' || categoryData.nome.trim().length < 2) {
      throw new Error('VALIDATION_ERROR: Nome da categoria deve ter no mínimo 2 caracteres.');
    }

    const id = 'cat_' + crypto.randomUUID().replace(/-/g, '').substring(0, 8);
    const slug = categoryData.slug ? String(categoryData.slug).trim() : this.generateSlug(categoryData.nome);
    const nowIso = new Date().toISOString();

    const category: Category = {
      id,
      nome: categoryData.nome.trim(),
      slug,
      ativo: categoryData.ativo !== false,
      ordem: Number.isInteger(Number(categoryData.ordem)) ? Number(categoryData.ordem) : 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.categories.push(category);
    return category;
  }

  public handleUpdateCategory(categoryData: UpdateCategoryInput): Category {
    if (!categoryData || !categoryData.id) {
      throw new Error('VALIDATION_ERROR: ID da categoria é obrigatório.');
    }

    const targetIndex = this.categories.findIndex((c) => c.id === String(categoryData.id).trim());
    if (targetIndex === -1) {
      throw new Error('NOT_FOUND: Categoria não encontrada com ID: ' + categoryData.id);
    }

    const current = this.categories[targetIndex]!;
    const nowIso = new Date().toISOString();

    const updatedNome = categoryData.nome !== undefined ? String(categoryData.nome).trim() : current.nome;
    if (categoryData.nome !== undefined && updatedNome.length < 2) {
      throw new Error('VALIDATION_ERROR: Nome da categoria deve ter no mínimo 2 caracteres.');
    }

    const updatedCategory: Category = {
      ...current,
      nome: updatedNome,
      slug: categoryData.slug !== undefined ? String(categoryData.slug).trim() : current.slug,
      ativo: categoryData.ativo !== undefined ? Boolean(categoryData.ativo) : current.ativo,
      ordem: categoryData.ordem !== undefined ? Number(categoryData.ordem) || 0 : current.ordem,
      updatedAt: nowIso,
    };

    this.categories[targetIndex] = updatedCategory;
    return updatedCategory;
  }

  public handleDeleteCategory(categoryId: string) {
    if (!categoryId) {
      throw new Error('VALIDATION_ERROR: ID da categoria é obrigatório.');
    }

    const target = this.categories.find((c) => c.id === String(categoryId).trim());
    if (!target) {
      throw new Error('NOT_FOUND: Categoria não encontrada com ID: ' + categoryId);
    }

    const nowIso = new Date().toISOString();
    target.ativo = false;
    target.updatedAt = nowIso;

    return {
      id: String(categoryId).trim(),
      deleted: true,
      deletedAt: nowIso,
    };
  }

  public handleSaveConfig(newConfigs: Record<string, any>): StoreConfig {
    if (!newConfigs || typeof newConfigs !== 'object') {
      throw new Error('VALIDATION_ERROR: Objeto de configuração inválido.');
    }

    const immutableKeys = ['store_id', 'api_token', 'admin_password_hash'];
    for (const forbiddenKey of immutableKeys) {
      if (Object.prototype.hasOwnProperty.call(newConfigs, forbiddenKey)) {
        throw new Error(`FORBIDDEN_MODIFICATION: A chave "${forbiddenKey}" não pode ser alterada via API.`);
      }
    }

    const allowedKeys = [
      'store_name',
      'logo_url',
      'primary_color',
      'secondary_color',
      'whatsapp',
      'domain',
      'currency',
      'timezone',
    ];

    for (const [key, value] of Object.entries(newConfigs)) {
      if (allowedKeys.includes(key) && value !== undefined && value !== null) {
        let strVal = String(value).trim();
        if (key === 'whatsapp') {
          const digits = strVal.replace(/\D/g, '');
          if (digits.length < 10 || digits.length > 15) {
            throw new Error('VALIDATION_ERROR: O campo "whatsapp" deve conter entre 10 e 15 dígitos.');
          }
          strVal = digits;
        } else if (key === 'primary_color' || key === 'secondary_color') {
          if (!/^#([0-9a-fA-F]{3}){1,2}$/.test(strVal)) {
            throw new Error(`VALIDATION_ERROR: O campo "${key}" deve ser uma cor hexadecimal válida (ex: #10b981).`);
          }
        }
        this.configMap.set(key, strVal);
      }
    }

    return this.getPublicStoreConfig();
  }

  public validateVariations(variacoes: any): VariationOption[] {
    if (variacoes === undefined || variacoes === null) {
      return [];
    }
    if (!Array.isArray(variacoes)) {
      throw new Error('VALIDATION_ERROR: O campo "variacoes" deve ser um array.');
    }

    for (const v of variacoes) {
      if (!v || typeof v !== 'object' || Array.isArray(v)) {
        throw new Error('VALIDATION_ERROR: Cada variação deve ser um objeto.');
      }
      if (!v.tipo || typeof v.tipo !== 'string' || v.tipo.trim().length === 0) {
        throw new Error('VALIDATION_ERROR: O "tipo" da variação é obrigatório e não pode ser vazio.');
      }
      if (!Array.isArray(v.opcoes) || v.opcoes.length === 0) {
        throw new Error(`VALIDATION_ERROR: O campo "opcoes" da variação "${v.tipo}" deve ser um array com pelo menos 1 item.`);
      }
      for (const opt of v.opcoes) {
        if (typeof opt !== 'string' || opt.trim().length === 0) {
          throw new Error(`VALIDATION_ERROR: As opções da variação "${v.tipo}" devem ser strings não vazias.`);
        }
      }
    }

    return variacoes as VariationOption[];
  }

  public validateImages(imagens: any): string[] {
    if (imagens === undefined || imagens === null) {
      return [];
    }
    if (!Array.isArray(imagens)) {
      throw new Error('VALIDATION_ERROR: O campo "imagens" deve ser um array de URLs.');
    }
    return imagens.map((url) => {
      const trimmed = String(url).trim();
      if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://') && !trimmed.startsWith('data:image/')) {
        throw new Error('VALIDATION_ERROR: Cada imagem deve possuir protocolo válido (https://, http:// ou data:image/).');
      }
      return trimmed;
    });
  }

  public assertCategoryExists(categoriaId: string): void {
    const found = this.categories.find((c) => c.id === categoriaId);
    if (!found) {
      throw new Error('NOT_FOUND: A categoria informada não existe: ' + categoriaId);
    }
    if (!found.ativo) {
      throw new Error('VALIDATION_ERROR: A categoria informada está inativa: ' + categoriaId);
    }
  }

  private validateAuthorization(token: any): string | null {
    if (!token || typeof token !== 'string') {
      return 'Token de autorização ausente ou inválido.';
    }

    const storedToken = this.configMap.get('api_token');
    if (!storedToken || token.trim() !== storedToken.trim()) {
      return 'Token de autorização inválido ou expirado.';
    }

    return null;
  }

  private generateSlug(text: string): string {
    return String(text)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

// Gerenciador de instâncias in-memory por tenant para desenvolvimento e testes locais
const engineInstances: Map<string, BackendEngine> = new Map();

export function getLocalEngine(tenantId = 'loja_exemplo'): BackendEngine {
  let engine = engineInstances.get(tenantId);
  if (!engine) {
    const isTenantB = tenantId === 'loja_b';
    const isTenantA = tenantId === 'loja_a';
    engine = new BackendEngine({
      store_id: tenantId,
      store_name: isTenantB
        ? 'Esportes Radicais Store'
        : isTenantA
        ? 'Boutique Elegance'
        : 'Minha Loja Digital',
      whatsapp: isTenantB
        ? '5511922222222'
        : isTenantA
        ? '5511911111111'
        : '5511999999999',
      domain: isTenantB
        ? 'loja-b.localhost'
        : isTenantA
        ? 'loja-a.localhost'
        : 'loja-exemplo.com.br',
    });
    engineInstances.set(tenantId, engine);
  }
  return engine;
}

export function resetLocalEngines(): void {
  engineInstances.clear();
}

