import { NextRequest, NextResponse } from 'next/server';
import { getLocalEngine } from '@/backend/engine';
import { getTenantByHostname, normalizeHostname } from '@/lib/tenantResolver';
import type { Tenant } from '@/types';

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

    if (process.env.NODE_ENV === 'test' && isPlaceholder) {
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

  const tenant = getTenantByHostname(rawHost);

  if (!tenant) {
    // Se não for localhost e o domínio for desconhecido, bloqueia
    if (normalized !== 'localhost' && normalized !== '127.0.0.1') {
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

export async function GET(request: NextRequest) {
  const { tenantId, apiUrl, isAllowed } = resolveContextTenant(request);

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

  // Se houver URL de Web App validada, despacha chamada remota
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
      return NextResponse.json(data);
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

  // Fallback para engine local integrado (desenvolvimento / teste)
  const localResult = getLocalEngine(tenantId).doGet({ action, categoryId });
  return NextResponse.json(localResult);
}

export async function POST(request: NextRequest) {
  const { tenantId, apiUrl, isAllowed } = resolveContextTenant(request);

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
      return NextResponse.json(data);
    }

    // Fallback para engine local integrado
    const localResult = getLocalEngine(tenantId).doPost(payload);
    return NextResponse.json(localResult);
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
