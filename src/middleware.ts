import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTenantByHostname, normalizeHostname } from '@/lib/tenantResolver';

// Rotas públicas e estáticas que não devem ser interceptadas pelo resolver
const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Ignora assets estáticos, rotas internas do Next.js e página de erro
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/tenant-not-found' ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Extrai e normaliza o hostname
  const rawHost =
    request.headers.get('x-forwarded-host') || request.headers.get('host');
  const normalizedHost = normalizeHostname(rawHost);

  // 3. Resolve contra o registro conhecido de tenants
  const tenant = getTenantByHostname(normalizedHost);

  // 4. Se o domínio não for reconhecido, redireciona para a tela de erro
  if (!tenant) {
    const url = request.nextUrl.clone();
    url.pathname = '/tenant-not-found';
    url.searchParams.set('host', normalizedHost);
    return NextResponse.rewrite(url);
  }

  // 5. Injeta cabeçalhos seguros contendo a identidade do tenant
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', tenant.tenantId);
  requestHeaders.set('x-tenant-api-url', tenant.apiUrl || '');
  requestHeaders.set('x-tenant-host', normalizedHost);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
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
