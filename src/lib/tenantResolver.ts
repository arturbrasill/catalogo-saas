import type { Tenant, TenantRegistry } from '@/types';
import defaultTenants from './tenants.json';

/**
 * Normaliza o hostname da requisição HTTP:
 * - Converte para letras minúsculas;
 * - Remove portas (ex.: :3000, :8080);
 * - Remove o prefixo "www." (política canônica de domínio);
 * - Remove espaços e barras residuais.
 */
export function normalizeHostname(rawHost: string | null | undefined): string {
  if (!rawHost || typeof rawHost !== 'string') {
    return 'localhost';
  }

  return rawHost
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '') // remove :porta
    .replace(/^www\./, '') // remove www.
    .replace(/\/$/, ''); // remove barra final
}

/**
 * Resolve o tenant correspondente a partir do hostname normalizado.
 * Busca estritamente contra o registro conhecido de tenants para evitar spoofing.
 */
export function getTenantByHostname(
  rawHost: string | null | undefined,
  registry: TenantRegistry = defaultTenants as TenantRegistry
): Tenant | null {
  const normalized = normalizeHostname(rawHost);

  // 1. Busca direta no registro
  if (registry[normalized]) {
    return registry[normalized]!;
  }

  // 2. Tratamento para desenvolvimento local (localhost e 127.0.0.1) e domínios padrão Vercel (*.vercel.app)
  if (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized.endsWith('.vercel.app')
  ) {
    const defaultTenantKey = process.env['NEXT_PUBLIC_DEFAULT_TENANT'] || 'loja_exemplo';

    // Tenta encontrar tenant cujo tenantId seja o defaultTenantKey
    for (const [_, t] of Object.entries(registry)) {
      if (t.tenantId === defaultTenantKey) {
        return t;
      }
    }

    if (registry['localhost']) {
      return registry['localhost']!;
    }
  }

  // 3. Domínio não registrado
  return null;
}

/**
 * Retorna todos os tenants registrados no sistema.
 */
export function getAllTenants(
  registry: TenantRegistry = defaultTenants as TenantRegistry
): TenantRegistry {
  return registry;
}

/**
 * Valida se um tenantId é reconhecido no sistema.
 */
export function isValidTenant(
  tenantId: string,
  registry: TenantRegistry = defaultTenants as TenantRegistry
): boolean {
  if (!tenantId) return false;
  return Object.values(registry).some((t) => t.tenantId === tenantId);
}
