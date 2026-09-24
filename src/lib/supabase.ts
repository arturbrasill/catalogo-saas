import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Tenant,
  StoreConfig,
  Category,
  Product,
  Coupon,
  CreateTenantInput,
  UpdateSubscriptionInput,
  SaveConfigInput,
  CreateProductInput,
  UpdateProductInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateCouponInput,
  UpdateCouponInput,
  LoginResult,
} from '@/types';
import crypto from 'crypto';

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClientInstance) return supabaseClientInstance;

  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const key =
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ||
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  if (url && key && url.trim().length > 0 && key.trim().length > 0) {
    try {
      supabaseClientInstance = createClient(url.trim(), key.trim(), {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      return supabaseClientInstance;
    } catch (err) {
      console.warn('Erro ao inicializar cliente Supabase:', err);
      return null;
    }
  }

  return null;
}

export function hashPassword(password: string): string {
  const salt = 'CATALOGO_SAAS_SALT_v1_';
  return crypto.createHash('sha256').update(salt + password).digest('hex');
}

// ============================================================
// TENANTS (LOJISTAS)
// ============================================================

export async function fetchAllTenantsFromSupabase(): Promise<Tenant[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Supabase fetchAllTenants error:', error?.message);
      return null;
    }

    return data.map((row: any) => ({
      tenantId: row.tenant_id,
      apiUrl: row.api_url || `/api/backend?tenant=${row.tenant_id}`,
      name: row.name,
      slug: row.slug,
      domain: row.domain,
      whatsapp: row.whatsapp,
      ownerEmail: row.owner_email,
      plan: row.plan,
      subscriptionStatus: row.subscription_status,
      subscriptionExpiresAt: row.subscription_expires_at,
      notes: row.notes,
      niche: row.niche,
      asaasCustomerId: row.asaas_customer_id,
      asaasSubscriptionId: row.asaas_subscription_id,
      asaasPaymentLink: row.asaas_payment_link,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn('Erro inesperado em fetchAllTenantsFromSupabase:', err);
    return null;
  }
}

export async function fetchTenantFromSupabase(identifier: string): Promise<Tenant | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const clean = identifier.trim().toLowerCase();
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .or(`tenant_id.ilike.${clean},slug.ilike.${clean},domain.ilike.${clean}`)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      tenantId: data.tenant_id,
      apiUrl: data.api_url || `/api/backend?tenant=${data.tenant_id}`,
      name: data.name,
      slug: data.slug,
      domain: data.domain,
      whatsapp: data.whatsapp,
      ownerEmail: data.owner_email,
      plan: data.plan,
      subscriptionStatus: data.subscription_status,
      subscriptionExpiresAt: data.subscription_expires_at,
      notes: data.notes,
      niche: data.niche,
      asaasCustomerId: data.asaas_customer_id,
      asaasSubscriptionId: data.asaas_subscription_id,
      asaasPaymentLink: data.asaas_payment_link,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.warn('Erro em fetchTenantFromSupabase:', err);
    return null;
  }
}

export async function insertTenantIntoSupabase(input: CreateTenantInput, tenantId: string, slug: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const cleanPhone = input.whatsapp.replace(/\D/g, '');
    const cleanDomain = `${slug}.localhost`;

    // 1. Insere o Tenant
    const { error: tenantErr } = await supabase.from('tenants').upsert(
      {
        tenant_id: tenantId,
        name: input.name.trim(),
        slug,
        domain: cleanDomain,
        whatsapp: cleanPhone,
        owner_email: input.ownerEmail?.trim() || null,
        password_hash: hashPassword(input.password || 'admin123'),
        api_token: 'tok_' + crypto.randomUUID().replace(/-/g, ''),
        plan: input.plan || 'trial_30d',
        subscription_status: input.plan === 'trial_30d' ? 'trial' : 'active',
        subscription_expires_at: expiresAt,
        notes: `Loja criada via Onboarding (${input.niche || 'Geral'})`,
        niche: input.niche || 'Geral',
      },
      { onConflict: 'tenant_id' }
    );

    if (tenantErr) {
      console.warn('Supabase insert tenant error:', tenantErr.message);
      return false;
    }

    // 2. Insere a Configuração Inicial da Loja
    await supabase.from('store_configs').upsert(
      {
        tenant_id: tenantId,
        store_name: input.name.trim(),
        primary_color: input.primaryColor || '#10b981',
        secondary_color: input.secondaryColor || '#047857',
        background_color: input.backgroundColor || '#f8fafc',
        text_color: input.textColor || '#0f172a',
        whatsapp: cleanPhone,
        domain: cleanDomain,
        currency: 'BRL',
        timezone: 'America/Sao_Paulo',
        is_open: true,
      },
      { onConflict: 'tenant_id' }
    );

    // 3. Categoria padrão
    await supabase.from('categories').upsert(
      {
        id: `cat_${tenantId}_geral`,
        tenant_id: tenantId,
        nome: 'Geral',
        slug: 'geral',
        ativo: true,
        ordem: 1,
      },
      { onConflict: 'id' }
    );

    return true;
  } catch (err) {
    console.warn('Erro ao inserir tenant no Supabase:', err);
    return false;
  }
}

export async function updateTenantInSupabase(input: UpdateSubscriptionInput): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (input.plan) updatePayload['plan'] = input.plan;
    if (input.subscriptionStatus) updatePayload['subscription_status'] = input.subscriptionStatus;
    if (input.subscriptionExpiresAt) updatePayload['subscription_expires_at'] = input.subscriptionExpiresAt;
    if (input.notes !== undefined) updatePayload['notes'] = input.notes;
    if (input.asaasCustomerId !== undefined) updatePayload['asaas_customer_id'] = input.asaasCustomerId;
    if (input.asaasSubscriptionId !== undefined) updatePayload['asaas_subscription_id'] = input.asaasSubscriptionId;
    if (input.asaasPaymentLink !== undefined) updatePayload['asaas_payment_link'] = input.asaasPaymentLink;

    if (input.whatsapp) {
      const cleanPhone = input.whatsapp.replace(/\D/g, '');
      updatePayload['whatsapp'] = cleanPhone;
      // Atualiza também em store_configs
      await supabase
        .from('store_configs')
        .update({ whatsapp: cleanPhone, updated_at: new Date().toISOString() })
        .eq('tenant_id', input.tenantId);
    }

    if (input.name) {
      updatePayload['name'] = input.name.trim();
      // Atualiza também em store_configs
      await supabase
        .from('store_configs')
        .update({ store_name: input.name.trim(), updated_at: new Date().toISOString() })
        .eq('tenant_id', input.tenantId);
    }

    const { error } = await supabase
      .from('tenants')
      .update(updatePayload)
      .eq('tenant_id', input.tenantId);

    if (error) {
      console.warn('Erro ao atualizar tenant no Supabase:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Erro em updateTenantInSupabase:', err);
    return false;
  }
}

// ============================================================
// CONFIGURAÇÕES DA LOJA (STORE CONFIG)
// ============================================================

export async function fetchStoreConfigFromSupabase(tenantId: string): Promise<StoreConfig | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('store_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      store_id: data.tenant_id,
      store_name: data.store_name,
      logo_url: data.logo_url,
      primary_color: data.primary_color,
      secondary_color: data.secondary_color,
      background_color: data.background_color,
      text_color: data.text_color,
      banners: Array.isArray(data.banners) ? data.banners : [],
      whatsapp: data.whatsapp,
      domain: data.domain,
      currency: data.currency,
      timezone: data.timezone,
      is_open: data.is_open,
      business_hours: data.business_hours,
      pix_key: data.pix_key,
      pix_key_type: data.pix_key_type,
    };
  } catch (err) {
    console.warn('Erro em fetchStoreConfigFromSupabase:', err);
    return null;
  }
}

export async function saveStoreConfigInSupabase(tenantId: string, config: SaveConfigInput): Promise<StoreConfig | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    let cleanPhone = config.whatsapp ? String(config.whatsapp).replace(/\D/g, '') : undefined;
    if (cleanPhone && (cleanPhone.length === 10 || cleanPhone.length === 11) && !cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }

    const payload: Record<string, any> = {
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
    };

    if (config.store_name !== undefined) payload['store_name'] = String(config.store_name).trim();
    if (config.logo_url !== undefined) payload['logo_url'] = String(config.logo_url).trim();
    if (config.primary_color !== undefined) payload['primary_color'] = String(config.primary_color).trim();
    if (config.secondary_color !== undefined) payload['secondary_color'] = String(config.secondary_color).trim();
    if (config.background_color !== undefined) payload['background_color'] = String(config.background_color).trim();
    if (config.text_color !== undefined) payload['text_color'] = String(config.text_color).trim();
    if (config.banners !== undefined) payload['banners'] = Array.isArray(config.banners) ? config.banners.slice(0, 3) : [];
    if (cleanPhone !== undefined) payload['whatsapp'] = cleanPhone;
    if (config.domain !== undefined) payload['domain'] = String(config.domain).trim();
    if (config.currency !== undefined) payload['currency'] = String(config.currency).trim();
    if (config.timezone !== undefined) payload['timezone'] = String(config.timezone).trim();
    if (config.is_open !== undefined) payload['is_open'] = Boolean(config.is_open);
    if (config.business_hours !== undefined) payload['business_hours'] = String(config.business_hours).trim();
    if (config.pix_key !== undefined) payload['pix_key'] = String(config.pix_key).trim();
    if (config.pix_key_type !== undefined) payload['pix_key_type'] = config.pix_key_type;

    const { data, error } = await supabase
      .from('store_configs')
      .upsert(payload, { onConflict: 'tenant_id' })
      .select()
      .single();

    if (error || !data) {
      console.warn('Erro ao salvar store_config no Supabase:', error?.message);
      return null;
    }

    // SINCRONIZAÇÃO AUTOMÁTICA IMEDIATA:
    // Se o WhatsApp ou Nome da loja foram alterados pelo lojista,
    // atualiza também na tabela 'tenants' para refletir no Painel Mestre SaaS!
    const tenantUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (cleanPhone) tenantUpdates['whatsapp'] = cleanPhone;
    if (config.store_name) tenantUpdates['name'] = String(config.store_name).trim();

    if (Object.keys(tenantUpdates).length > 1) {
      await supabase
        .from('tenants')
        .update(tenantUpdates)
        .eq('tenant_id', tenantId);
    }

    return {
      store_id: data.tenant_id,
      store_name: data.store_name,
      logo_url: data.logo_url,
      primary_color: data.primary_color,
      secondary_color: data.secondary_color,
      background_color: data.background_color,
      text_color: data.text_color,
      banners: Array.isArray(data.banners) ? data.banners : [],
      whatsapp: data.whatsapp,
      domain: data.domain,
      currency: data.currency,
      timezone: data.timezone,
      is_open: data.is_open,
      business_hours: data.business_hours,
      pix_key: data.pix_key,
      pix_key_type: data.pix_key_type,
    };
  } catch (err) {
    console.warn('Erro em saveStoreConfigInSupabase:', err);
    return null;
  }
}

// ============================================================
// CATEGORIAS (CATEGORIES)
// ============================================================

export async function fetchCategoriesFromSupabase(tenantId: string): Promise<Category[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      nome: row.nome,
      slug: row.slug,
      ativo: row.ativo,
      ordem: row.ordem,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.warn('Erro em fetchCategoriesFromSupabase:', err);
    return null;
  }
}

export async function createCategoryInSupabase(tenantId: string, input: CreateCategoryInput): Promise<Category | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const id = 'cat_' + crypto.randomUUID().replace(/-/g, '').substring(0, 8);
    const slug = input.slug || input.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const now = new Date().toISOString();

    const categoryRow = {
      id,
      tenant_id: tenantId,
      nome: input.nome.trim(),
      slug,
      ativo: input.ativo !== false,
      ordem: input.ordem || 0,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('categories')
      .insert(categoryRow)
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      nome: data.nome,
      slug: data.slug,
      ativo: data.ativo,
      ordem: data.ordem,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.warn('Erro em createCategoryInSupabase:', err);
    return null;
  }
}

export async function updateCategoryInSupabase(tenantId: string, input: UpdateCategoryInput): Promise<Category | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (input.nome !== undefined) payload['nome'] = input.nome.trim();
    if (input.slug !== undefined) payload['slug'] = input.slug.trim();
    if (input.ativo !== undefined) payload['ativo'] = Boolean(input.ativo);
    if (input.ordem !== undefined) payload['ordem'] = Number(input.ordem) || 0;

    const { data, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('tenant_id', tenantId)
      .eq('id', input.id)
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      nome: data.nome,
      slug: data.slug,
      ativo: data.ativo,
      ordem: data.ordem,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.warn('Erro em updateCategoryInSupabase:', err);
    return null;
  }
}

export async function deleteCategoryInSupabase(tenantId: string, id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('categories')
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('id', id);

    return !error;
  } catch {
    return false;
  }
}

// ============================================================
// PRODUTOS (PRODUCTS)
// ============================================================

export async function fetchProductsFromSupabase(tenantId: string, categoryId?: string): Promise<Product[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('ativo', true)
      .is('deleted_at', null)
      .order('ordem', { ascending: true });

    if (categoryId) {
      query = query.eq('categoria_id', categoryId);
    }

    const { data, error } = await query;
    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      nome: row.nome,
      slug: row.slug,
      preco: Number(row.preco) || 0,
      precoPromocional: row.preco_promocional !== null && row.preco_promocional !== undefined ? Number(row.preco_promocional) : null,
      categoriaId: row.categoria_id,
      descricao: row.descricao || '',
      imagens: Array.isArray(row.imagens) ? row.imagens : [],
      estoque: typeof row.estoque === 'number' ? row.estoque : (row.em_estoque === false ? 0 : 100),
      variacoes: Array.isArray(row.variacoes) ? row.variacoes : [],
      ativo: row.ativo !== false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at || null,
    }));
  } catch (err) {
    console.warn('Erro em fetchProductsFromSupabase:', err);
    return null;
  }
}

export async function createProductInSupabase(tenantId: string, input: CreateProductInput): Promise<Product | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const id = 'prod_' + crypto.randomUUID().replace(/-/g, '').substring(0, 10);
    const slug = input.slug || input.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const now = new Date().toISOString();

    const emEstoque = (input as any).emEstoque !== undefined
      ? Boolean((input as any).emEstoque)
      : (typeof input.estoque === 'number' ? input.estoque > 0 : true);

    const row = {
      id,
      tenant_id: tenantId,
      nome: input.nome.trim(),
      slug,
      preco: Number(input.preco) || 0,
      preco_promocional: input.precoPromocional !== undefined && input.precoPromocional !== null ? Number(input.precoPromocional) : null,
      categoria_id: input.categoriaId || null,
      descricao: input.descricao ? input.descricao.trim() : null,
      imagens: Array.isArray(input.imagens) ? input.imagens : [],
      em_estoque: emEstoque,
      destaque: Boolean((input as any).destaque),
      ordem: Number((input as any).ordem) || 0,
      variacoes: Array.isArray(input.variacoes) ? input.variacoes : [],
      ativo: input.ativo !== false,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase.from('products').insert(row).select().single();
    if (error || !data) return null;

    return {
      id: data.id,
      nome: data.nome,
      slug: data.slug,
      preco: Number(data.preco) || 0,
      precoPromocional: data.preco_promocional !== null && data.preco_promocional !== undefined ? Number(data.preco_promocional) : null,
      categoriaId: data.categoria_id,
      descricao: data.descricao || '',
      imagens: Array.isArray(data.imagens) ? data.imagens : [],
      estoque: typeof input.estoque === 'number' ? input.estoque : (data.em_estoque === false ? 0 : 100),
      variacoes: Array.isArray(data.variacoes) ? data.variacoes : [],
      ativo: data.ativo !== false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      deletedAt: data.deleted_at || null,
    };
  } catch (err) {
    console.warn('Erro em createProductInSupabase:', err);
    return null;
  }
}

export async function updateProductInSupabase(tenantId: string, input: UpdateProductInput): Promise<Product | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (input.nome !== undefined) payload['nome'] = input.nome.trim();
    if (input.slug !== undefined) payload['slug'] = input.slug.trim();
    if (input.preco !== undefined) payload['preco'] = Number(input.preco) || 0;
    if (input.precoPromocional !== undefined) {
      payload['preco_promocional'] = input.precoPromocional !== null ? Number(input.precoPromocional) : null;
    }
    if (input.categoriaId !== undefined) payload['categoria_id'] = input.categoriaId;
    if (input.descricao !== undefined) payload['descricao'] = input.descricao;
    if (input.imagens !== undefined) payload['imagens'] = Array.isArray(input.imagens) ? input.imagens : [];
    if ((input as any).emEstoque !== undefined) {
      payload['em_estoque'] = Boolean((input as any).emEstoque);
    } else if (input.estoque !== undefined) {
      payload['em_estoque'] = Number(input.estoque) > 0;
    }
    if ((input as any).destaque !== undefined) payload['destaque'] = Boolean((input as any).destaque);
    if ((input as any).ordem !== undefined) payload['ordem'] = Number((input as any).ordem) || 0;
    if (input.variacoes !== undefined) payload['variacoes'] = Array.isArray(input.variacoes) ? input.variacoes : [];
    if (input.ativo !== undefined) payload['ativo'] = Boolean(input.ativo);

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('tenant_id', tenantId)
      .eq('id', input.id)
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      nome: data.nome,
      slug: data.slug,
      preco: Number(data.preco) || 0,
      precoPromocional: data.preco_promocional !== null && data.preco_promocional !== undefined ? Number(data.preco_promocional) : null,
      categoriaId: data.categoria_id,
      descricao: data.descricao || '',
      imagens: Array.isArray(data.imagens) ? data.imagens : [],
      estoque: typeof input.estoque === 'number' ? input.estoque : (data.em_estoque === false ? 0 : 100),
      variacoes: Array.isArray(data.variacoes) ? data.variacoes : [],
      ativo: data.ativo !== false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      deletedAt: data.deleted_at || null,
    };
  } catch (err) {
    console.warn('Erro em updateProductInSupabase:', err);
    return null;
  }
}

export async function deleteProductInSupabase(tenantId: string, id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('products')
      .update({ ativo: false, deleted_at: now, updated_at: now })
      .eq('tenant_id', tenantId)
      .eq('id', id);

    return !error;
  } catch {
    return false;
  }
}

// ============================================================
// CUPONS DE DESCONTO (COUPONS)
// ============================================================

export async function fetchCouponsFromSupabase(tenantId: string): Promise<Coupon[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      codigo: row.codigo,
      tipo: row.tipo,
      valor: Number(row.valor) || 0,
      valorMinimo: Number(row.valor_minimo) || 0,
      ativo: Boolean(row.ativo),
      descricao: row.descricao || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.warn('Erro em fetchCouponsFromSupabase:', err);
    return null;
  }
}

export async function createCouponInSupabase(tenantId: string, input: CreateCouponInput): Promise<Coupon | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const id = 'coup_' + crypto.randomUUID().replace(/-/g, '').substring(0, 8);
    const now = new Date().toISOString();

    const row = {
      id,
      tenant_id: tenantId,
      codigo: input.codigo.trim().toUpperCase(),
      tipo: input.tipo || 'percentage',
      valor: Number(input.valor) || 0,
      valor_minimo: Number(input.valorMinimo) || 0,
      ativo: input.ativo !== false,
      descricao: input.descricao ? input.descricao.trim() : null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase.from('coupons').insert(row).select().single();
    if (error || !data) return null;

    return {
      id: data.id,
      codigo: data.codigo,
      tipo: data.tipo,
      valor: Number(data.valor) || 0,
      valorMinimo: Number(data.valor_minimo) || 0,
      ativo: Boolean(data.ativo),
      descricao: data.descricao || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.warn('Erro em createCouponInSupabase:', err);
    return null;
  }
}

export async function updateCouponInSupabase(tenantId: string, input: UpdateCouponInput): Promise<Coupon | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (input.codigo !== undefined) payload['codigo'] = input.codigo.trim().toUpperCase();
    if (input.tipo !== undefined) payload['tipo'] = input.tipo;
    if (input.valor !== undefined) payload['valor'] = Number(input.valor) || 0;
    if (input.valorMinimo !== undefined) payload['valor_minimo'] = Number(input.valorMinimo) || 0;
    if (input.ativo !== undefined) payload['ativo'] = Boolean(input.ativo);
    if (input.descricao !== undefined) payload['descricao'] = input.descricao ? input.descricao.trim() : null;

    const { data, error } = await supabase
      .from('coupons')
      .update(payload)
      .eq('tenant_id', tenantId)
      .eq('id', input.id)
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      codigo: data.codigo,
      tipo: data.tipo,
      valor: Number(data.valor) || 0,
      valorMinimo: Number(data.valor_minimo) || 0,
      ativo: Boolean(data.ativo),
      descricao: data.descricao || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.warn('Erro em updateCouponInSupabase:', err);
    return null;
  }
}

export async function deleteCouponInSupabase(tenantId: string, id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', id);

    return !error;
  } catch {
    return false;
  }
}

// ============================================================
// AUTENTICAÇÃO DO LOJISTA (MERCHANT LOGIN)
// ============================================================

export async function authenticateMerchantSupabase(tenantId: string, password: string): Promise<LoginResult | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const hash = hashPassword(password);
    const { data, error } = await supabase
      .from('tenants')
      .select('tenant_id, api_token, password_hash')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error || !data) return null;

    if (data.password_hash === hash) {
      return {
        authenticated: true,
        token: data.api_token || `tok_${tenantId}_authenticated`,
      };
    }

    return null;
  } catch (err) {
    console.warn('Erro em authenticateMerchantSupabase:', err);
    return null;
  }
}
