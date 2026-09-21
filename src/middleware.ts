import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTenantByHostname, normalizeHostname, resolveTenant } from '@/lib/tenantResolver';

// Rotas públicas e estáticas que não devem ser interceptadas pelo resolver
const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Ignora assets estáticos, rotas internas do Next.js, rotas do SaaS e tela de erro
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/tenant-not-found' ||
    pathname === '/criar-loja' ||
    pathname === '/saas-admin' ||
    pathname === '/saas-login' ||
    pathname === '/landing' ||
    pathname === '/planos' ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Extrai e normaliza o hostname e possíveis parâmetros de tenant
  const rawHost =
    request.headers.get('x-forwarded-host') || request.headers.get('host');
  const normalizedHost = normalizeHostname(rawHost);
  const queryTenant = request.nextUrl.searchParams.get('tenant') || request.cookies.get('app_tenant')?.value;

  // 3. Resolve contra o registro conhecido de tenants
  const tenant = resolveTenant(normalizedHost, queryTenant);

  // 4. Se o domínio não for reconhecido, redireciona para a tela de erro
  if (!tenant) {
    const url = request.nextUrl.clone();
    url.pathname = '/tenant-not-found';
    url.searchParams.set('host', normalizedHost);
    return NextResponse.rewrite(url);
  }

  // 5. Injeta cabeçalhos seguros contendo a identidade do tenant e status de assinatura
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', tenant.tenantId);
  requestHeaders.set('x-tenant-api-url', tenant.apiUrl || '');
  requestHeaders.set('x-tenant-host', normalizedHost);
  requestHeaders.set('x-tenant-status', tenant.subscriptionStatus || 'active');
  if (tenant.subscriptionExpiresAt) {
    requestHeaders.set('x-tenant-expires-at', tenant.subscriptionExpiresAt);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Se veio por query param ?tenant=..., grava cookie de conveniência para navegação contínua
  const urlParamTenant = request.nextUrl.searchParams.get('tenant');
  if (urlParamTenant) {
    response.cookies.set('app_tenant', tenant.tenantId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Intercepta todas as rotas exceto:
     * - api (rotas de API)
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico (ícone)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
