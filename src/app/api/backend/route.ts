import { NextRequest, NextResponse } from 'next/server';
import { getLocalEngine } from '@/backend/engine';
import { getTenantByHostname, normalizeHostname } from '@/lib/tenantResolver';

function resolveTenantId(request: NextRequest): string {
  const headerTenantId = request.headers.get('x-tenant-id');
  if (headerTenantId && headerTenantId.trim().length > 0) {
    return headerTenantId.trim();
  }
  const rawHost =
    request.headers.get('x-forwarded-host') || request.headers.get('host');
  const tenant = getTenantByHostname(rawHost);
  if (tenant && tenant.tenantId) {
    return tenant.tenantId;
  }
  return 'loja_exemplo';
}

function resolveTenantApiUrl(request: NextRequest): string | null {
  // 1. Tenta obter do header injetado com segurança pelo middleware
  const headerApiUrl = request.headers.get('x-tenant-api-url');
  if (headerApiUrl && headerApiUrl.trim().length > 0) {
    return headerApiUrl.trim();
  }

  // 2. Se não houver no header, resolve a partir do host da requisição
  const rawHost =
    request.headers.get('x-forwarded-host') || request.headers.get('host');
  const tenant = getTenantByHostname(rawHost);
  if (tenant && tenant.apiUrl && tenant.apiUrl.trim().length > 0) {
    return tenant.apiUrl.trim();
  }

  // 3. Fallback para variável global de ambiente (se definida)
  return process.env['APPS_SCRIPT_URL'] || null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'store';
  const categoryId = searchParams.get('categoryId') || undefined;

  const remoteUrl = resolveTenantApiUrl(request);
  if (remoteUrl) {
    try {
      const url = new URL(remoteUrl);
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
          error: { code: 'GATEWAY_ERROR', message: 'Falha na comunicação com a API do tenant: ' + String(err) },
        },
        { status: 502 }
      );
    }
  }

  // Fallback para engine local integrado (desenvolvimento / teste)
  const tenantId = resolveTenantId(request);
  const localResult = getLocalEngine(tenantId).doGet({ action, categoryId });
  return NextResponse.json(localResult);
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const remoteUrl = resolveTenantApiUrl(request);
    if (remoteUrl) {
      const response = await fetch(remoteUrl, {
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
    const tenantId = resolveTenantId(request);
    const localResult = getLocalEngine(tenantId).doPost(payload);
    return NextResponse.json(localResult);
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: 'INVALID_PAYLOAD', message: 'Erro ao processar corpo da requisição: ' + String(err) },
      },
      { status: 400 }
    );
  }
}
