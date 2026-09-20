import crypto from 'crypto';
import type {
  Category,
  Product,
  StoreConfig,
  StoreConfigInternal,
  APIResponse,
  VariationOption,
} from '../types';

export class BackendEngine {
  private configMap: Map<string, string> = new Map();
  private categories: Category[] = [];
  private products: Product[] = [];
  private lockAcquired = false;

  constructor() {
    this.initDatabase();
  }

  public initDatabase(): void {
    // Configurações padrão
    const defaultPasswordHash = this.hashPassword('admin123');
    const defaultApiToken = 'tok_mock_default_1234567890';

    this.configMap.set('store_id', 'loja_exemplo');
    this.configMap.set('store_name', 'Minha Loja Digital');
    this.configMap.set('logo_url', 'https://images.unsplash.com/photo-example.jpg');
    this.configMap.set('primary_color', '#10b981');
    this.configMap.set('secondary_color', '#047857');
    this.configMap.set('whatsapp', '5511999999999');
    this.configMap.set('admin_password_hash', defaultPasswordHash);
    this.configMap.set('api_token', defaultApiToken);
    this.configMap.set('domain', 'loja-exemplo.com.br');
    this.configMap.set('currency', 'BRL');
    this.configMap.set('timezone', 'America/Sao_Paulo');

    // Categoria inicial
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

    // Produtos inicial vazia
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
      if (!payload || !payload.action) {
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

      // Validação de autorização para ações administrativas
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
    return this.products.filter((p) => {
      if (!p.ativo || p.deletedAt !== null) return false;
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
    if (!productData) {
      throw new Error('VALIDATION_ERROR: Dados do produto ausentes.');
    }

    if (!productData.nome || typeof productData.nome !== 'string' || productData.nome.trim().length < 2) {
      throw new Error('VALIDATION_ERROR: Nome do produto deve ter no mínimo 2 caracteres.');
    }

    if (!productData.categoriaId) {
      throw new Error('VALIDATION_ERROR: ID da categoria é obrigatório.');
    }

    const preco = parseFloat(productData.preco);
    if (isNaN(preco) || preco <= 0) {
      throw new Error('VALIDATION_ERROR: O preço deve ser um número positivo.');
    }

    let precoPromocional: number | null = null;
    if (productData.precoPromocional !== undefined && productData.precoPromocional !== null && productData.precoPromocional !== '') {
      precoPromocional = parseFloat(productData.precoPromocional);
      if (isNaN(precoPromocional) || precoPromocional <= 0) {
        throw new Error('VALIDATION_ERROR: O preço promocional deve ser maior que zero.');
      }
    }

    const id = 'prod_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);
    const slug = productData.slug ? String(productData.slug).trim() : this.generateSlug(productData.nome);
    const nowIso = new Date().toISOString();

    const product: Product = {
      id,
      categoriaId: String(productData.categoriaId),
      nome: String(productData.nome).trim(),
      slug,
      descricao: productData.descricao ? String(productData.descricao) : '',
      preco,
      precoPromocional,
      imagens: Array.isArray(productData.imagens) ? productData.imagens : [],
      variacoes: Array.isArray(productData.variacoes) ? productData.variacoes : [],
      estoque: Number.isInteger(productData.estoque) ? productData.estoque : 0,
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

    const targetIndex = this.products.findIndex((p) => p.id === String(productData.id));
    if (targetIndex === -1) {
      throw new Error('NOT_FOUND: Produto não encontrado com ID: ' + productData.id);
    }

    const current = this.products[targetIndex]!;
    const nowIso = new Date().toISOString();

    if (productData.preco !== undefined) {
      const p = parseFloat(productData.preco);
      if (isNaN(p) || p <= 0) throw new Error('VALIDATION_ERROR: Preço deve ser positivo.');
      current.preco = p;
    }

    if (productData.precoPromocional !== undefined) {
      if (productData.precoPromocional === null || productData.precoPromocional === '') {
        current.precoPromocional = null;
      } else {
        const pp = parseFloat(productData.precoPromocional);
        if (isNaN(pp) || pp <= 0) throw new Error('VALIDATION_ERROR: Preço promocional deve ser positivo.');
        current.precoPromocional = pp;
      }
    }

    if (productData.nome !== undefined) current.nome = String(productData.nome).trim();
    if (productData.categoriaId !== undefined) current.categoriaId = String(productData.categoriaId);
    if (productData.slug !== undefined) current.slug = String(productData.slug).trim();
    if (productData.descricao !== undefined) current.descricao = String(productData.descricao);
    if (productData.imagens !== undefined && Array.isArray(productData.imagens)) current.imagens = productData.imagens;
    if (productData.variacoes !== undefined && Array.isArray(productData.variacoes)) current.variacoes = productData.variacoes;
    if (productData.estoque !== undefined) current.estoque = parseInt(productData.estoque, 10) || 0;
    if (productData.ativo !== undefined) current.ativo = Boolean(productData.ativo);

    current.updatedAt = nowIso;
    this.products[targetIndex] = current;
    return current;
  }

  public handleDeleteProduct(productId: string) {
    if (!productId) {
      throw new Error('VALIDATION_ERROR: ID do produto é obrigatório.');
    }

    const target = this.products.find((p) => p.id === String(productId));
    if (!target) {
      throw new Error('NOT_FOUND: Produto não encontrado com ID: ' + productId);
    }

    const nowIso = new Date().toISOString();
    target.ativo = false;
    target.updatedAt = nowIso;
    target.deletedAt = nowIso;

    return {
      id: productId,
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

    for (const [key, value] of Object.entries(newConfigs)) {
      if (value !== undefined && value !== null) {
        this.configMap.set(key, String(value));
      }
    }

    return this.getPublicStoreConfig();
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
