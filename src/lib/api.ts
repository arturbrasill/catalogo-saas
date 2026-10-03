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
  Coupon,
  CreateCouponInput,
  UpdateCouponInput,
  ValidateCouponResult,
} from '@/types';

import {
  normalizeProduct,
  normalizeCatalogInitialData,
} from '@/lib/sheetNormalization';

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

  public detectTenant(): string | null {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const query = params.get('tenant');
    if (query && query.trim()) return query.trim();

    const segments = window.location.pathname.split('/').filter(Boolean);
    const first = segments[0]?.toLowerCase();
    const reserved = [
      'admin',
      'api',
      'criar-loja',
      'saas-admin',
      'saas-login',
      'landing',
      'planos',
      'tenant-not-found',
      '_next',
      'static',
      'favicon.ico',
    ];
    if (first && !reserved.includes(first)) {
      return first;
    }

    const match = document.cookie.match(/(?:^|;\s*)app_tenant=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }

    return null;
  }

  private appendTenant(endpoint: string, explicitTenant?: string): string {
    const tenant = explicitTenant || this.detectTenant();
    if (!tenant) return endpoint;

    if (endpoint.includes('tenant=')) return endpoint;

    const separator = endpoint.includes('?') ? '&' : '?';
    return `${endpoint}${separator}tenant=${encodeURIComponent(tenant)}`;
  }

  private async request<T>(endpoint: string, options?: RequestInit, explicitTenant?: string): Promise<T> {
    const targetUrl = this.appendTenant(endpoint, explicitTenant);
    try {
      const res = await fetch(targetUrl, {
        cache: 'no-store',
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

  public async getStore(tenantId?: string): Promise<StoreConfig> {
    const data = await this.request<StoreConfig>(`${this.baseUrl}?action=store`, undefined, tenantId);
    return normalizeCatalogInitialData({ store: data }).store || data;
  }

  public async getCategories(tenantId?: string): Promise<Category[]> {
    return this.request<Category[]>(`${this.baseUrl}?action=categories`, undefined, tenantId);
  }

  public async getProducts(categoryId?: string, tenantId?: string): Promise<Product[]> {
    const url = categoryId
      ? `${this.baseUrl}?action=products&categoryId=${encodeURIComponent(categoryId)}`
      : `${this.baseUrl}?action=products`;
    const data = await this.request<Product[]>(url, undefined, tenantId);
    return Array.isArray(data) ? data.map(normalizeProduct) : [];
  }

  public async getAll(tenantId?: string): Promise<CatalogInitialData> {
    const data = await this.request<CatalogInitialData>(`${this.baseUrl}?action=all`, undefined, tenantId);
    return normalizeCatalogInitialData(data);
  }

  // ==========================================
  // OPERAÇÕES ADMINISTRATIVAS (POST)
  // ==========================================

  public async login(
    usernameOrPassword: string | { username: string; password: string },
    maybePassword?: string
  ): Promise<LoginResult> {
    let username: string | undefined;
    let password = '';

    if (typeof usernameOrPassword === 'object') {
      username = usernameOrPassword.username;
      password = usernameOrPassword.password;
    } else if (maybePassword !== undefined) {
      username = usernameOrPassword;
      password = maybePassword;
    } else {
      password = usernameOrPassword;
    }

    return this.request<LoginResult>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'login',
        username,
        password,
      }),
    });
  }

  public async createProduct(product: CreateProductInput, token: string): Promise<Product> {
    const data = await this.request<Product>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'createProduct',
        token,
        product,
      }),
    });
    return normalizeProduct(data);
  }

  public async updateProduct(product: UpdateProductInput, token: string): Promise<Product> {
    const data = await this.request<Product>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'updateProduct',
        token,
        product,
      }),
    });
    return normalizeProduct(data);
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

  public async saveConfig(config: SaveConfigInput, token: string, tenantId?: string): Promise<StoreConfig> {
    const data = await this.request<StoreConfig>(
      this.baseUrl,
      {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveConfig',
          token,
          config,
        }),
      },
      tenantId
    );
    return normalizeCatalogInitialData({ store: data }).store || data;
  }

  // ==========================================
  // CUPONS DE DESCONTO
  // ==========================================

  public async getCoupons(): Promise<Coupon[]> {
    return this.request<Coupon[]>(`${this.baseUrl}?action=coupons`);
  }

  public async validateCoupon(code: string, subtotal: number): Promise<ValidateCouponResult> {
    return this.request<ValidateCouponResult>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'validateCoupon',
        code,
        subtotal,
      }),
    });
  }

  public async createCoupon(coupon: CreateCouponInput, token: string): Promise<Coupon> {
    return this.request<Coupon>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'createCoupon',
        token,
        coupon,
      }),
    });
  }

  public async updateCoupon(coupon: UpdateCouponInput, token: string): Promise<Coupon> {
    return this.request<Coupon>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'updateCoupon',
        token,
        coupon,
      }),
    });
  }

  public async deleteCoupon(id: string, token: string): Promise<{ success: true; id: string }> {
    return this.request<{ success: true; id: string }>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'deleteCoupon',
        token,
        id,
      }),
    });
  }
}

export const api = new ApiClient();
