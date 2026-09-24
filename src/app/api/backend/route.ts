import { NextRequest, NextResponse } from 'next/server';
import { getLocalEngine } from '@/backend/engine';
import { getTenantByHostname, normalizeHostname, resolveTenant } from '@/lib/tenantResolver';
import type { Tenant } from '@/types';
import {
  fetchStoreConfigFromSupabase,
  fetchCategoriesFromSupabase,
  fetchProductsFromSupabase,
  fetchCouponsFromSupabase,
  authenticateMerchantSupabase,
  saveStoreConfigInSupabase,
  createProductInSupabase,
  updateProductInSupabase,
  deleteProductInSupabase,
  createCategoryInSupabase,
  updateCategoryInSupabase,
  deleteCategoryInSupabase,
  createCouponInSupabase,
  updateCouponInSupabase,
  deleteCouponInSupabase,
} from '@/lib/supabase';
import { updateTenantSubscription } from '@/lib/tenantStore';

/**
 * Validação rigorosa de segurança para URLs remotas de API.
 * Previne SSRF (Server-Side Request Forgery) garantindo que chamadas externas
 * sejam feitas estritamente para o domínio oficial do Google Apps Script.
 */
function isValidGasApiUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const isValidStructure =
      parsed.protocol === 'https:' &&
      parsed.hostname === 'script.google.com' &&
      parsed.pathname.startsWith('/macros/s/');

    // Em ambiente de teste ou desenvolvimento local, URLs com placeholders não devem realizar chamadas de rede reais
    const isPlaceholder =
      urlStr.includes('EXEMPLO') ||
      urlStr.includes('_ID/') ||
      urlStr.includes('_ID/exec');

    if (process.env.NODE_ENV === 'test') {
      return false;
    }

    return isValidStructure;
  } catch {
    return false;
  }
}

/**
 * Resolve o tenant a partir do hostname canônico da requisição.
 * NUNCA confia em cabeçalhos arbitrários 'x-tenant-api-url' ou 'x-tenant-id' enviados pelo cliente.
 */
function resolveContextTenant(request: NextRequest): {
  tenant: Tenant | null;
  tenantId: string;
  apiUrl: string | null;
  isAllowed: boolean;
} {
  const rawHost =
    request.headers.get('x-forwarded-host') || request.headers.get('host');
  const normalized = normalizeHostname(rawHost);

  // Prioridade canônica para o Host registrado (previne header injection)
  let tenant = getTenantByHostname(rawHost);

  // Se estiver em ambiente compartilhado (localhost ou vercel.app), permite query param ?tenant= ou cookie
  const queryTenant =
    request.nextUrl.searchParams.get('tenant') ||
    request.cookies.get('app_tenant')?.value;
  if (queryTenant && (normalized === 'localhost' || normalized === '127.0.0.1' || normalized.endsWith('.vercel.app') || !tenant)) {
    const resolvedFromQuery = resolveTenant(rawHost, queryTenant);
    if (resolvedFromQuery) {
      tenant = resolvedFromQuery;
    }
  }

  if (!tenant) {
    // Se não for localhost ou vercel.app e o domínio for desconhecido, bloqueia
    if (
      normalized !== 'localhost' &&
      normalized !== '127.0.0.1' &&
      !normalized.endsWith('.vercel.app')
    ) {
      return {
        tenant: null,
        tenantId: '',
        apiUrl: null,
        isAllowed: false,
      };
    }

    return {
      tenant: null,
      tenantId: 'loja_exemplo',
      apiUrl: process.env['APPS_SCRIPT_URL'] || null,
      isAllowed: true,
    };
  }

  let validApiUrl: string | null = null;
  if (tenant.apiUrl && tenant.apiUrl.trim().length > 0) {
    if (isValidGasApiUrl(tenant.apiUrl)) {
      validApiUrl = tenant.apiUrl.trim();
    }
  } else if (process.env['APPS_SCRIPT_URL']) {
    const envUrl = process.env['APPS_SCRIPT_URL'].trim();
    if (isValidGasApiUrl(envUrl)) {
      validApiUrl = envUrl;
    }
  }

  return {
    tenant,
    tenantId: tenant.tenantId,
    apiUrl: validApiUrl,
    isAllowed: true,
  };
}

import { normalizeProduct } from '@/lib/sheetNormalization';

/**
 * Assegura que o campo whatsapp e outros campos sensíveis retornados da API
 * estejam no formato estrito de string e normaliza dados de produtos do Sheets.
 */
function sanitizeStoreResponse<T>(data: T, tenant?: Tenant | null): T {
  if (data && typeof data === 'object' && 'data' in data) {
    const raw = (data as { data?: any }).data;
    if (raw && typeof raw === 'object') {
      if (Array.isArray(raw)) {
        // Ex: lista de produtos retornada diretamente em data
        (data as any).data = raw.map(normalizeProduct);
      } else {
        if ('whatsapp' in raw && raw['whatsapp'] !== undefined && raw['whatsapp'] !== null) {
          raw['whatsapp'] = String(raw['whatsapp']).trim();
        }
        if (tenant) {
          raw['subscription_status'] = tenant.subscriptionStatus || 'active';
          if (tenant.subscriptionExpiresAt) {
            raw['subscription_expires_at'] = tenant.subscriptionExpiresAt;
          }
        }
        if ('store' in raw && raw['store'] && typeof raw['store'] === 'object') {
          const store = raw['store'] as Record<string, unknown>;
          if (store['whatsapp'] !== undefined && store['whatsapp'] !== null) {
            store['whatsapp'] = String(store['whatsapp']).trim();
          }
          if (tenant) {
            store['subscription_status'] = tenant.subscriptionStatus || 'active';
            if (tenant.subscriptionExpiresAt) {
              store['subscription_expires_at'] = tenant.subscriptionExpiresAt;
            }
          }
        }
        if ('products' in raw && Array.isArray(raw['products'])) {
          raw['products'] = raw['products'].map(normalizeProduct);
        }
        if ('product' in raw && raw['product'] && typeof raw['product'] === 'object') {
          raw['product'] = normalizeProduct(raw['product']);
        }
      }
    }
  }
  return data;
}

export async function GET(request: NextRequest) {
  const { tenant, tenantId, apiUrl, isAllowed } = resolveContextTenant(request);

  if (!isAllowed) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: 'Loja não cadastrada para o domínio informado.',
        },
      },
      { status: 404 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'store';
  const categoryId = searchParams.get('categoryId') || undefined;

  // 1. Tenta carregar dados em tempo real do Supabase (Banco de Dados Oficial)
  try {
    if (action === 'store') {
      const config = await fetchStoreConfigFromSupabase(tenantId);
      if (config) {
        return NextResponse.json(sanitizeStoreResponse({ success: true, data: config, error: null }, tenant));
      }
    } else if (action === 'categories') {
      const cats = await fetchCategoriesFromSupabase(tenantId);
      if (cats) {
        return NextResponse.json(sanitizeStoreResponse({ success: true, data: cats, error: null }, tenant));
      }
    } else if (action === 'products') {
      const prods = await fetchProductsFromSupabase(tenantId, categoryId);
      if (prods) {
        return NextResponse.json(sanitizeStoreResponse({ success: true, data: prods, error: null }, tenant));
      }
    } else if (action === 'all' || action === 'catalog' || action === 'getCatalog') {
      const [config, cats, prods] = await Promise.all([
        fetchStoreConfigFromSupabase(tenantId),
        fetchCategoriesFromSupabase(tenantId),
        fetchProductsFromSupabase(tenantId),
      ]);
      if (config && cats && prods) {
        return NextResponse.json(
          sanitizeStoreResponse(
            {
              success: true,
              data: {
                store: config,
                categories: cats,
                products: prods,
              },
              error: null,
            },
            tenant
          )
        );
      }
    } else if (action === 'coupons') {
      const coupons = await fetchCouponsFromSupabase(tenantId);
      if (coupons) {
        return NextResponse.json(sanitizeStoreResponse({ success: true, data: coupons, error: null }, tenant));
      }
    }
  } catch (err) {
    console.warn('Nota: Fallback Supabase em GET /api/backend:', err);
  }

  // 2. Se houver URL de Web App validada, despacha chamada remota
  if (apiUrl) {
    try {
      const url = new URL(apiUrl);
      url.searchParams.set('action', action);
      if (categoryId) url.searchParams.set('categoryId', categoryId);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        redirect: 'follow',
      });
      const data = await response.json();
      return NextResponse.json(sanitizeStoreResponse(data, tenant));
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'GATEWAY_ERROR',
            message: 'Falha na comunicação com a API do tenant: ' + String(err),
          },
        },
        { status: 502 }
      );
    }
  }

  // 3. Fallback para engine local integrado (desenvolvimento / teste)
  const localResult = getLocalEngine(tenantId).doGet({ action, categoryId });
  return NextResponse.json(sanitizeStoreResponse(localResult, tenant));
}

export async function POST(request: NextRequest) {
  const { tenant, tenantId, apiUrl, isAllowed } = resolveContextTenant(request);

  if (!isAllowed) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: 'Loja não cadastrada para o domínio informado.',
        },
      },
      { status: 404 }
    );
  }

  try {
    const payload = await request.json();

    // SINCRONIZAÇÃO AUTOMÁTICA UNIVERSAL:
    // Sempre que o lojista salvar configurações (como o WhatsApp de atendimento ou Nome da Loja),
    // atualizamos imediatamente o registro da loja no SaaS Master Panel para refletir na hora!
    if (payload.action === 'saveConfig' && payload.config) {
      try {
        updateTenantSubscription({
          tenantId,
          whatsapp: payload.config.whatsapp,
          name: payload.config.store_name,
        });
      } catch (err) {
        console.warn('Erro ao sincronizar tenantStore com saveConfig:', err);
      }
    }

    // 1. Tenta operações no Supabase (Banco de Dados Oficial)
    try {
      if (payload.action === 'login') {
        const loginRes = await authenticateMerchantSupabase(tenantId, payload.password);
        if (loginRes) {
          return NextResponse.json(sanitizeStoreResponse({ success: true, data: loginRes, error: null }, tenant));
        }
      } else if (payload.action === 'saveConfig') {
        const saved = await saveStoreConfigInSupabase(tenantId, payload.config);
        if (saved) {
          try {
            getLocalEngine(tenantId).handleSaveConfig(payload.config);
          } catch {}
          return NextResponse.json(sanitizeStoreResponse({ success: true, data: saved, error: null }, tenant));
        }
      } else if (payload.action === 'createProduct') {
        const prod = await createProductInSupabase(tenantId, payload.product);
        if (prod) {
          return NextResponse.json(sanitizeStoreResponse({ success: true, data: prod, error: null }, tenant));
        }
      } else if (payload.action === 'updateProduct') {
        const prod = await updateProductInSupabase(tenantId, payload.product);
        if (prod) {
          return NextResponse.json(sanitizeStoreResponse({ success: true, data: prod, error: null }, tenant));
        }
      } else if (payload.action === 'deleteProduct') {
        const deleted = await deleteProductInSupabase(tenantId, payload.id);
        if (deleted) {
          return NextResponse.json(
            sanitizeStoreResponse({ success: true, data: { id: payload.id, deleted: true }, error: null }, tenant)
          );
        }
      } else if (payload.action === 'createCategory') {
        const cat = await createCategoryInSupabase(tenantId, payload.category);
        if (cat) {
          return NextResponse.json(sanitizeStoreResponse({ success: true, data: cat, error: null }, tenant));
        }
      } else if (payload.action === 'updateCategory') {
        const cat = await updateCategoryInSupabase(tenantId, payload.category);
        if (cat) {
          return NextResponse.json(sanitizeStoreResponse({ success: true, data: cat, error: null }, tenant));
        }
      } else if (payload.action === 'deleteCategory') {
        const deleted = await deleteCategoryInSupabase(tenantId, payload.id);
        if (deleted) {
          return NextResponse.json(
            sanitizeStoreResponse({ success: true, data: { id: payload.id, deleted: true }, error: null }, tenant)
          );
        }
      } else if (payload.action === 'createCoupon') {
        const coup = await createCouponInSupabase(tenantId, payload.coupon);
        if (coup) {
          return NextResponse.json(sanitizeStoreResponse({ success: true, data: coup, error: null }, tenant));
        }
      } else if (payload.action === 'updateCoupon') {
        const coup = await updateCouponInSupabase(tenantId, payload.coupon);
        if (coup) {
          return NextResponse.json(sanitizeStoreResponse({ success: true, data: coup, error: null }, tenant));
        }
      } else if (payload.action === 'deleteCoupon') {
        const deleted = await deleteCouponInSupabase(tenantId, payload.id);
        if (deleted) {
          return NextResponse.json(
            sanitizeStoreResponse({ success: true, data: { success: true, id: payload.id }, error: null }, tenant)
          );
        }
      }
    } catch (err) {
      console.warn('Nota: Fallback Supabase em POST /api/backend:', err);
    }

    // 2. Se houver apiUrl externa
    if (apiUrl) {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });
      const data = await response.json();
      return NextResponse.json(sanitizeStoreResponse(data, tenant));
    }

    // 3. Fallback para engine local integrado
    const localResult = getLocalEngine(tenantId).doPost(payload);
    return NextResponse.json(sanitizeStoreResponse(localResult, tenant));
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Erro ao processar corpo da requisição: ' + String(err),
        },
      },
      { status: 400 }
    );
  }
}
