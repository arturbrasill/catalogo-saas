/**
 * Contratos e Definições de Tipos TypeScript Estritos
 * Projeto: SaaS Catálogo Digital Multi-Tenant
 */

// ============================================================
// 1. CONFIGURAÇÃO DA LOJA (STORE)
// ============================================================

export type ThemePreset = 'modern' | 'editorial' | 'bold';
export type CatalogLayoutMode = 'grid' | 'list' | 'editorial';

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
  pix_key?: string;
  pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  is_open?: boolean;
  business_hours?: string;
  // Dynamic Theme Presets & Announcement Bar
  theme_preset?: ThemePreset;
  announcement_enabled?: boolean;
  announcement_text?: string;
  announcement_bg_color?: string;
  announcement_text_color?: string;
  // Layout da Vitrine
  catalog_layout?: CatalogLayoutMode;
  // Status de Pagamento Asaas
  subscription_plan?: SubscriptionPlan;
  pending_payment?: boolean;
  asaas_payment_link?: string;
  cpf_cnpj?: string;
}

/**
 * Configurações internas completas armazenadas no banco de dados / engine.
 * Utilizado exclusivamente no ambiente seguro do backend.
 */
export interface StoreConfigInternal extends StoreConfig {
  admin_username?: string;
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
  badge?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ============================================================
// 3.1 CUPONS DE DESCONTO (COUPONS)
// ============================================================

export type CouponType = 'percentage' | 'fixed';

export interface Coupon {
  id: string;
  codigo: string;
  tipo: CouponType;
  valor: number;
  valorMinimo?: number;
  ativo: boolean;
  validade?: string;
  descricao?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCouponInput {
  codigo: string;
  tipo: CouponType;
  valor: number;
  valorMinimo?: number;
  ativo?: boolean;
  validade?: string;
  descricao?: string;
}

export interface UpdateCouponInput extends Partial<CreateCouponInput> {
  id: string;
}

export interface ValidateCouponResult {
  valid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  message?: string;
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
  appliedCoupon?: Coupon | null;
  discountAmount?: number;
}

export type DeliveryType = 'delivery' | 'pickup';
export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'money';

export interface CustomerAddress {
  street?: string;
  number?: string;
  neighborhood?: string;
  complement?: string;
  city?: string;
}

export interface CustomerOrderInfo {
  customerName?: string;
  phone?: string;
  deliveryType?: DeliveryType;
  address?: CustomerAddress;
  paymentMethod?: PaymentMethod;
  changeFor?: string;
  notes?: string;
  appliedCoupon?: Coupon | null;
  discountAmount?: number;
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

export type SubscriptionPlan = 'trial_7d' | 'trial_30d' | 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'blocked' | 'cancelled';

export interface Tenant {
  tenantId: string;
  apiUrl: string;
  name?: string;
  domain?: string;
  slug?: string;
  whatsapp?: string;
  adminUsername?: string;
  plan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionExpiresAt?: string; // ISO string
  createdAt?: string;
  ownerEmail?: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  notes?: string;
  niche?: string;
  cpfCnpj?: string;
  apiToken?: string;
  // Campos de Integração com Asaas
  asaasCustomerId?: string;
  asaasSubscriptionId?: string;
  asaasPaymentLink?: string;
  pendingPayment?: boolean;
  // Campos visuais de tema e anúncio
  logo_url?: string;
  logoUrl?: string;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
  theme_preset?: ThemePreset;
  catalog_layout?: CatalogLayoutMode;
  announcement_enabled?: boolean;
  announcement_text?: string;
  announcement_bg_color?: string;
  announcement_text_color?: string;
}

export type TenantRegistry = Record<string, Tenant>;

export interface CreateTenantInput {
  name: string;
  slug: string;
  whatsapp: string;
  adminUsername?: string;
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
  ownerEmail?: string;
  adminUsername?: string;
  password?: string;
  asaasCustomerId?: string;
  asaasSubscriptionId?: string;
  asaasPaymentLink?: string;
  pendingPayment?: boolean;
  catalog_layout?: CatalogLayoutMode;
  theme_preset?: ThemePreset;
  announcement_enabled?: boolean;
  announcement_text?: string;
  announcement_bg_color?: string;
  announcement_text_color?: string;
  cpfCnpj?: string;
}

export interface AsaasCustomerInput {
  name: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
  externalReference?: string;
}

export interface AsaasCreditCardInput {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface AsaasCreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode?: string;
  addressNumber?: string;
  phone?: string;
  mobilePhone?: string;
}

export interface AsaasSubscriptionInput {
  customerId: string;
  value?: number;
  nextDueDate?: string;
  cycle?: 'MONTHLY' | 'YEARLY' | 'WEEKLY' | 'BIWEEKLY' | 'QUARTERLY' | 'SEMIANNUALLY';
  billingType?: 'UNDEFINED' | 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  description?: string;
  externalReference: string;
  creditCard?: AsaasCreditCardInput;
  creditCardHolderInfo?: AsaasCreditCardHolderInfo;
  creditCardToken?: string;
}

export interface AsaasPaymentInput {
  customer: string;
  billingType?: 'UNDEFINED' | 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  value?: number;
  dueDate: string;
  description?: string;
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
  username?: string;
  password: string;
}

export interface LoginResult {
  authenticated: boolean;
  token: string;
  expiresAt?: string;
  tenantSlug?: string;
  tenantId?: string;
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
  badge?: string | null;
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
  pix_key?: string;
  pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  is_open?: boolean;
  business_hours?: string;
  theme_preset?: ThemePreset;
  catalog_layout?: CatalogLayoutMode;
  announcement_enabled?: boolean;
  announcement_text?: string;
  announcement_bg_color?: string;
  announcement_text_color?: string;
  cpf_cnpj?: string;
}

export interface CatalogInitialData {
  store: StoreConfig;
  categories: Category[];
  products: Product[];
}
