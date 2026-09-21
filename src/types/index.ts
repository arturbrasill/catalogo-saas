/**
 * Contratos e Definições de Tipos TypeScript Estritos
 * Projeto: SaaS Catálogo Digital Multi-Tenant
 */

// ============================================================
// 1. CONFIGURAÇÃO DA LOJA (STORE)
// ============================================================

/**
 * Configurações públicas da loja acessíveis ao catálogo e visitantes.
 * NUNCA contém segredos como hashes de senha ou tokens.
 */
export interface StoreConfig {
  store_id: string;
  store_name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  background_color?: string;
  text_color?: string;
  banners?: string[];
  whatsapp: string;
  domain: string;
  currency: string;
  timezone: string;
  subscription_status?: SubscriptionStatus;
  subscription_expires_at?: string;
}

/**
 * Configurações internas completas armazenadas na planilha.
 * Utilizado exclusivamente no ambiente seguro do backend Apps Script.
 */
export interface StoreConfigInternal extends StoreConfig {
  admin_password_hash: string;
  api_token: string;
}

// ============================================================
// 2. CATEGORIA
// ============================================================

export interface Category {
  id: string;
  nome: string;
  slug: string;
  ativo: boolean;
  ordem: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  nome: string;
  slug?: string;
  ativo?: boolean;
  ordem?: number;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  id: string;
}

export interface DeleteCategoryInput {
  id: string;
}

// ============================================================
// 3. PRODUTOS E VARIAÇÕES
// ============================================================

/**
 * Opção de variação disponível no produto (ex.: Tamanho [P, M, G]).
 */
export interface VariationOption {
  tipo: string;
  opcoes: string[];
}

/**
 * Variações selecionadas pelo usuário para um item específico (ex.: { "Tamanho": "M" }).
 */
export type SelectedVariation = Record<string, string>;

/**
 * Modelo completo de Produto.
 */
export interface Product {
  id: string;
  categoriaId: string;
  nome: string;
  slug: string;
  descricao: string;
  preco: number;
  precoPromocional: number | null;
  imagens: string[];
  variacoes: VariationOption[];
  estoque: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ============================================================
// 4. SACOLA DE COMPRAS (CART)
// ============================================================

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  unitPrice: number;
  promotionalPrice?: number | null;
  quantity: number;
  variations: SelectedVariation;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  totalItems: number;
}

// ============================================================
// 5. RESPOSTA DA API E ERROS
// ============================================================

export interface APIError {
  code: string;
  message: string;
}

export interface APIResponseSuccess<T> {
  success: true;
  data: T;
  error: null;
}

export interface APIResponseError {
  success: false;
  data: null;
  error: APIError;
}

export type APIResponse<T> = APIResponseSuccess<T> | APIResponseError;

// ============================================================
// 6. MULTI-TENANCY & SAAS SUBSCRIPTIONS
// ============================================================

export type SubscriptionPlan = 'trial_30d' | 'monthly';
export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'blocked' | 'cancelled';

export interface Tenant {
  tenantId: string;
  apiUrl: string;
  name?: string;
  domain?: string;
  slug?: string;
  whatsapp?: string;
  plan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionExpiresAt?: string; // ISO string
  createdAt?: string;
  ownerEmail?: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  notes?: string;
  // Campos de Integração com Asaas
  asaasCustomerId?: string;
  asaasSubscriptionId?: string;
  asaasPaymentLink?: string;
}

export type TenantRegistry = Record<string, Tenant>;

export interface CreateTenantInput {
  name: string;
  slug: string;
  whatsapp: string;
  ownerEmail?: string;
  cpfCnpj?: string;
  password?: string;
  plan?: SubscriptionPlan;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  niche?: string;
}

export interface UpdateSubscriptionInput {
  tenantId: string;
  plan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionExpiresAt?: string;
  notes?: string;
  apiUrl?: string;
  spreadsheetUrl?: string;
  whatsapp?: string;
  name?: string;
  asaasCustomerId?: string;
  asaasSubscriptionId?: string;
  asaasPaymentLink?: string;
}

export interface AsaasCustomerInput {
  name: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
  externalReference?: string;
}

export interface AsaasPaymentInput {
  customer: string;
  billingType?: 'UNDEFINED' | 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  value: number;
  dueDate: string;
  description: string;
  externalReference: string;
}

export interface AsaasWebhookEvent {
  event: string;
  payment?: {
    id: string;
    customer: string;
    value: number;
    netValue?: number;
    status: string;
    billingType: string;
    externalReference?: string;
    invoiceUrl?: string;
    dueDate: string;
  };
}

export interface SaasMetrics {
  totalStores: number;
  activeStores: number;
  trialStores: number;
  expiredOrBlockedStores: number;
  estimatedMonthlyRevenue: number;
}

export interface MasterLoginResult {
  authenticated: boolean;
  token: string;
}

// ============================================================
// 7. PAYLOADS DE REQUISIÇÃO (ADMIN / POST)
// ============================================================

export interface LoginPayload {
  action: 'login';
  password: string;
}

export interface LoginResult {
  authenticated: boolean;
  token: string;
  expiresAt?: string;
}

export interface CreateProductInput {
  categoriaId: string;
  nome: string;
  slug: string;
  descricao: string;
  preco: number;
  precoPromocional?: number | null;
  imagens?: string[];
  variacoes?: VariationOption[];
  estoque: number;
  ativo?: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}

export interface DeleteProductInput {
  id: string;
}

export interface SaveConfigInput {
  store_name?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
  banners?: string[];
  whatsapp?: string;
  domain?: string;
  currency?: string;
  timezone?: string;
}

export interface CatalogInitialData {
  store: StoreConfig;
  categories: Category[];
  products: Product[];
}
