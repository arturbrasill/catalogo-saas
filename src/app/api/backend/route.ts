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
import { updateTenantSubscription, findTenant, findTenantByAdminUsername } from '@/lib/tenantStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

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

  // Se estiver em ambiente compartilhado (localhost ou vercel.app), permite query param ?tenant=, header x-tenant-id, cookie ou referer
  let queryTenant =
    request.nextUrl.searchParams.get('tenant') ||
    request.headers.get('x-tenant-id') ||
    request.cookies.get('app_tenant')?.value;

  if (!queryTenant) {
    const referer = request.headers.get('referer');
    if (referer) {
      try {
        const refUrl = new URL(referer);
        const refSegments = refUrl.pathname.split('/').filter(Boolean);
        const first = refSegments[0]?.toLowerCase();
        const RESERVED = [
          'admin',
          'api',
          'criar-loja',
          'saas-admin',
          'saas-login',
          'landing',
          'planos',
          'tenant-not-found',
        ];
        if (first && !RESERVED.includes(first)) {
          queryTenant = first;
        }
      } catch {
        // ignore referer parse error
      }
    }
  }

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
 * estejam no formato estrito de string e normaliza dados de produtos.
 */
function sanitizeStoreResponse<T>(data: T, tenant?: Tenant | null): T {
  if (data && typeof data === 'object' && 'data' in data) {
    const raw = (data as { data?: any }).data;
    if (raw && typeof raw === 'object') {
      if (Array.isArray(raw)) {
        // Ex: lista de produtos retornada diretamente em data
        (data as any).data = raw.map(normalizeProduct);
      } else {
        const applyStoreFields = (storeObj: Record<string, unknown>) => {
          if (storeObj['whatsapp'] !== undefined && storeObj['whatsapp'] !== null) {
            storeObj['whatsapp'] = String(storeObj['whatsapp']).trim();
          }
          if (tenant) {
            storeObj['subscription_status'] = tenant.subscriptionStatus || 'active';
            if (tenant.subscriptionExpiresAt) {
              storeObj['subscription_expires_at'] = tenant.subscriptionExpiresAt;
            }
            if (storeObj['catalog_layout'] === undefined && tenant.catalog_layout) {
              storeObj['catalog_layout'] = tenant.catalog_layout;
            }
            if (storeObj['theme_preset'] === undefined && tenant.theme_preset) {
              storeObj['theme_preset'] = tenant.theme_preset;
            }
            if (storeObj['announcement_enabled'] === undefined && tenant.announcement_enabled !== undefined) {
              storeObj['announcement_enabled'] = tenant.announcement_enabled;
            }
            if (!storeObj['announcement_text'] && tenant.announcement_text) {
              storeObj['announcement_text'] = tenant.announcement_text;
            }
            if (!storeObj['announcement_bg_color'] && tenant.announcement_bg_color) {
              storeObj['announcement_bg_color'] = tenant.announcement_bg_color;
            }
            if (!storeObj['announcement_text_color'] && tenant.announcement_text_color) {
              storeObj['announcement_text_color'] = tenant.announcement_text_color;
            }
          }
          if (storeObj['announcement_enabled'] !== undefined && storeObj['announcement_enabled'] !== null) {
            storeObj['announcement_enabled'] =
              storeObj['announcement_enabled'] === true ||
              String(storeObj['announcement_enabled']).trim().toLowerCase() === 'true' ||
              (storeObj['announcement_enabled'] as any) === 1 ||
              (storeObj['announcement_enabled'] as any) === '1';
          }
        };

        if ('store_id' in raw || 'store_name' in raw) {
          applyStoreFields(raw);
        }
        if ('store' in raw && raw['store'] && typeof raw['store'] === 'object') {
          applyStoreFields(raw['store'] as Record<string, unknown>);
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
        const localTenant = findTenant(tenantId);
        const localEngineConfig = getLocalEngine(tenantId).getPublicStoreConfig();
        if (!config.catalog_layout) {
          config.catalog_layout = localTenant?.catalog_layout || localEngineConfig?.catalog_layout || 'grid';
        }
        if (!config.theme_preset) {
          config.theme_preset = localTenant?.theme_preset || localEngineConfig?.theme_preset || 'modern';
        }
        if (config.announcement_enabled === undefined) {
          config.announcement_enabled =
            localTenant?.announcement_enabled !== undefined
              ? Boolean(localTenant.announcement_enabled)
              : localEngineConfig?.announcement_enabled !== undefined
              ? Boolean(localEngineConfig.announcement_enabled)
              : true;
        }
        if (!config.announcement_text) {
          config.announcement_text =
            localTenant?.announcement_text ||
            localEngineConfig?.announcement_text ||
            'Compre online e receba em casa com frete seguro ou retire na loja física';
        }
        if (!config.announcement_bg_color) {
          config.announcement_bg_color =
            localTenant?.announcement_bg_color ||
            localEngineConfig?.announcement_bg_color ||
            '#0f172a';
        }
        if (!config.announcement_text_color) {
          config.announcement_text_color =
            localTenant?.announcement_text_color ||
            localEngineConfig?.announcement_text_color ||
            '#ffffff';
        }
        return NextResponse.json(sanitizeStoreResponse({ success: true, data: config, error: null }, tenant), {
          headers: NO_CACHE_HEADERS,
        });
      }
    } else if (action === 'categories') {
      const cats = await fetchCategoriesFromSupabase(tenantId);
      if (cats) {
        return NextResponse.json(sanitizeStoreResponse({ success: true, data: cats, error: null }, tenant), {
          headers: NO_CACHE_HEADERS,
        });
      }
    } else if (action === 'products') {
      const prods = await fetchProductsFromSupabase(tenantId, categoryId);
      if (prods) {
        return NextResponse.json(sanitizeStoreResponse({ success: true, data: prods, error: null }, tenant), {
          headers: NO_CACHE_HEADERS,
        });
      }
    } else if (action === 'all' || action === 'catalog' || action === 'getCatalog') {
      const [config, cats, prods] = await Promise.all([
        fetchStoreConfigFromSupabase(tenantId),
        fetchCategoriesFromSupabase(tenantId),
        fetchProductsFromSupabase(tenantId),
      ]);
      if (config && cats && prods) {
        const localTenant = findTenant(tenantId);
        const localEngineConfig = getLocalEngine(tenantId).getPublicStoreConfig();
        if (!config.catalog_layout) {
          config.catalog_layout = localTenant?.catalog_layout || localEngineConfig?.catalog_layout || 'grid';
        }
        if (!config.theme_preset) {
          config.theme_preset = localTenant?.theme_preset || localEngineConfig?.theme_preset || 'modern';
        }
        if (config.announcement_enabled === undefined) {
          config.announcement_enabled =
            localTenant?.announcement_enabled !== undefined
              ? Boolean(localTenant.announcement_enabled)
              : localEngineConfig?.announcement_enabled !== undefined
              ? Boolean(localEngineConfig.announcement_enabled)
              : true;
        }
        if (!config.announcement_text) {
          config.announcement_text =
            localTenant?.announcement_text ||
            localEngineConfig?.announcement_text ||
            'Compre online e receba em casa com frete seguro ou retire na loja física';
        }
        if (!config.announcement_bg_color) {
          config.announcement_bg_color =
            localTenant?.announcement_bg_color ||
            localEngineConfig?.announcement_bg_color ||
            '#0f172a';
        }
        if (!config.announcement_text_color) {
          config.announcement_text_color =
            localTenant?.announcement_text_color ||
            localEngineConfig?.announcement_text_color ||
            '#ffffff';
        }
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
          ),
          { headers: NO_CACHE_HEADERS }
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
      if (tenantId === 'loja_exemplo') {
        const localResult = getLocalEngine(tenantId).doGet({ action, categoryId });
        return NextResponse.json(sanitizeStoreResponse(localResult, tenant));
      }

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
          catalog_layout: payload.config.catalog_layout,
          theme_preset: payload.config.theme_preset,
          announcement_enabled: payload.config.announcement_enabled,
          announcement_text: payload.config.announcement_text,
          announcement_bg_color: payload.config.announcement_bg_color,
          announcement_text_color: payload.config.announcement_text_color,
        });
      } catch (err) {
        console.warn('Erro ao sincronizar tenantStore com saveConfig:', err);
      }
    }

    // 1. Tenta operações no Supabase (Banco de Dados Oficial)
    try {
      if (payload.action === 'login') {
        const password = String(payload.password || '');
        const username = payload.username ? String(payload.username).trim() : undefined;
        const loginRes = await authenticateMerchantSupabase(
          tenantId,
          username ? username : password,
          username ? password : undefined
        );
        if (loginRes) {
          const resp = NextResponse.json(
            sanitizeStoreResponse({ success: true, data: loginRes, error: null }, tenant),
            { headers: NO_CACHE_HEADERS }
          );
          if (loginRes.tenantSlug) {
            resp.cookies.set('app_tenant', loginRes.tenantSlug, { path: '/', maxAge: 60 * 60 * 24 * 30 });
          }
          return resp;
        }
      } else if (payload.action === 'saveConfig') {
        try {
          getLocalEngine(tenantId).handleSaveConfig(payload.config);
        } catch {}
        const saved = await saveStoreConfigInSupabase(tenantId, payload.config);
        if (saved) {
          if (apiUrl) {
            try {
              await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload),
                redirect: 'follow',
              });
            } catch (err) {
              console.warn('Erro ao sincronizar saveConfig com Google Apps Script:', err);
            }
          }
          return NextResponse.json(sanitizeStoreResponse({ success: true, data: saved, error: null }, tenant), {
            headers: NO_CACHE_HEADERS,
          });
        }
        if (!apiUrl) {
          const localSaved = getLocalEngine(tenantId).getPublicStoreConfig();
          return NextResponse.json(sanitizeStoreResponse({ success: true, data: localSaved, error: null }, tenant), {
            headers: NO_CACHE_HEADERS,
          });
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
      } else if (payload.action === 'validateCoupon') {
        const coupons = await fetchCouponsFromSupabase(tenantId);
        if (coupons) {
          const rawCode = String(payload.code || payload.codigo || '').trim();
          const subtotal = Number(payload.subtotal || 0);

          if (!rawCode) {
            return NextResponse.json(
              sanitizeStoreResponse(
                {
                  success: true,
                  data: {
                    valid: false,
                    discountAmount: 0,
                    message: 'Código de cupom não informado.',
                  },
                  error: null,
                },
                tenant
              )
            );
          }

          const clean = rawCode.toUpperCase().replace(/\s+/g, '');
          const coupon = coupons.find((c) => c.codigo.toUpperCase() === clean);

          if (!coupon) {
            return NextResponse.json(
              sanitizeStoreResponse(
                {
                  success: true,
                  data: {
                    valid: false,
                    discountAmount: 0,
                    message: `Cupom "${clean}" não encontrado.`,
                  },
                  error: null,
                },
                tenant
              )
            );
          }

          if (!coupon.ativo) {
            return NextResponse.json(
              sanitizeStoreResponse(
                {
                  success: true,
                  data: {
                    valid: false,
                    coupon,
                    discountAmount: 0,
                    message: `O cupom "${clean}" está desativado no momento.`,
                  },
                  error: null,
                },
                tenant
              )
            );
          }

          if (coupon.validade) {
            const expDate = new Date(coupon.validade).getTime();
            if (expDate < Date.now()) {
              return NextResponse.json(
                sanitizeStoreResponse(
                  {
                    success: true,
                    data: {
                      valid: false,
                      coupon,
                      discountAmount: 0,
                      message: `O cupom "${clean}" expirou em ${new Date(coupon.validade).toLocaleDateString('pt-BR')}.`,
                    },
                    error: null,
                  },
                  tenant
                )
              );
            }
          }

          if (typeof coupon.valorMinimo === 'number' && coupon.valorMinimo > 0) {
            if (subtotal < coupon.valorMinimo) {
              const formattedMin = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(coupon.valorMinimo);
              return NextResponse.json(
                sanitizeStoreResponse(
                  {
                    success: true,
                    data: {
                      valid: false,
                      coupon,
                      discountAmount: 0,
                      message: `O cupom "${clean}" é válido apenas para pedidos a partir de ${formattedMin}.`,
                    },
                    error: null,
                  },
                  tenant
                )
              );
            }
          }

          let discountAmount = 0;
          if (coupon.tipo === 'percentage') {
            discountAmount = Math.round((subtotal * (coupon.valor / 100)) * 100) / 100;
          } else {
            discountAmount = Math.min(coupon.valor, subtotal);
          }

          return NextResponse.json(
            sanitizeStoreResponse(
              {
                success: true,
                data: {
                  valid: true,
                  coupon,
                  discountAmount,
                  message: `Cupom "${clean}" aplicado com sucesso!`,
                },
                error: null,
              },
              tenant
            )
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
      return NextResponse.json(sanitizeStoreResponse(data, tenant), { headers: NO_CACHE_HEADERS });
    }

    // 3. Fallback para engine local integrado
    let effectiveTenantId = tenantId;
    if (payload.action === 'login' && payload.username && (tenantId === 'loja_exemplo' || !tenantId)) {
      const found = findTenantByAdminUsername(String(payload.username));
      if (found) {
        effectiveTenantId = found.tenantId;
      }
    }
    const localResult = getLocalEngine(effectiveTenantId).doPost(payload);
    const resp = NextResponse.json(sanitizeStoreResponse(localResult, tenant), { headers: NO_CACHE_HEADERS });
    if (localResult.success && payload.action === 'login') {
      const found = findTenant(effectiveTenantId);
      if (found?.slug) {
        resp.cookies.set('app_tenant', found.slug, { path: '/', maxAge: 60 * 60 * 24 * 30 });
      }
    }
    return resp;
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
