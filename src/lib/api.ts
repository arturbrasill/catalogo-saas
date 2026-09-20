import type {
  StoreConfig,
  Category,
  Product,
  CatalogInitialData,
  LoginResult,
  CreateProductInput,
  UpdateProductInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  SaveConfigInput,
  APIResponse,
} from '@/types';

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(
    baseUrl = '/api/backend',
    defaultHeaders: Record<string, string> = {}
  ) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = defaultHeaders;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const res = await fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...this.defaultHeaders,
          ...(options?.headers || {}),
        },
      });

      if (!res.ok) {
        let errJson: APIResponse<unknown> | null = null;
        try {
          errJson = await res.json();
        } catch {
          // fallback
        }
        const errorMsg = errJson?.error?.message || `Erro de rede HTTP: status ${res.status}`;
        throw new Error(errorMsg);
      }

      const json: APIResponse<T> = await res.json();

      if (!json.success || !json.data) {
        throw new Error(json.error?.message || 'Falha desconhecida na requisição da API.');
      }

      return json.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(String(error));
    }
  }

  // ==========================================
  // CONSULTAS PÚBLICAS (GET)
  // ==========================================

  public async getStore(): Promise<StoreConfig> {
    return this.request<StoreConfig>(`${this.baseUrl}?action=store`);
  }

  public async getCategories(): Promise<Category[]> {
    return this.request<Category[]>(`${this.baseUrl}?action=categories`);
  }

  public async getProducts(categoryId?: string): Promise<Product[]> {
    const url = categoryId
      ? `${this.baseUrl}?action=products&categoryId=${encodeURIComponent(categoryId)}`
      : `${this.baseUrl}?action=products`;
    return this.request<Product[]>(url);
  }

  public async getAll(): Promise<CatalogInitialData> {
    return this.request<CatalogInitialData>(`${this.baseUrl}?action=all`);
  }

  // ==========================================
  // OPERAÇÕES ADMINISTRATIVAS (POST)
  // ==========================================

  public async login(password: string): Promise<LoginResult> {
    return this.request<LoginResult>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'login',
        password,
      }),
    });
  }

  public async createProduct(product: CreateProductInput, token: string): Promise<Product> {
    return this.request<Product>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'createProduct',
        token,
        product,
      }),
    });
  }

  public async updateProduct(product: UpdateProductInput, token: string): Promise<Product> {
    return this.request<Product>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'updateProduct',
        token,
        product,
      }),
    });
  }

  public async deleteProduct(id: string, token: string): Promise<{ id: string; deleted: boolean }> {
    return this.request<{ id: string; deleted: boolean }>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'deleteProduct',
        token,
        id,
      }),
    });
  }

  public async createCategory(category: CreateCategoryInput, token: string): Promise<Category> {
    return this.request<Category>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'createCategory',
        token,
        category,
      }),
    });
  }

  public async updateCategory(category: UpdateCategoryInput, token: string): Promise<Category> {
    return this.request<Category>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'updateCategory',
        token,
        category,
      }),
    });
  }

  public async deleteCategory(id: string, token: string): Promise<{ id: string; deleted: boolean }> {
    return this.request<{ id: string; deleted: boolean }>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'deleteCategory',
        token,
        id,
      }),
    });
  }

  public async saveConfig(config: SaveConfigInput, token: string): Promise<StoreConfig> {
    return this.request<StoreConfig>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'saveConfig',
        token,
        config,
      }),
    });
  }
}

export const api = new ApiClient();
