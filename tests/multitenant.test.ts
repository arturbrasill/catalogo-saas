import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/backend/route';
import { getLocalEngine, resetLocalEngines } from '../src/backend/engine';
import {
  normalizeHostname,
  getTenantByHostname,
  getAllTenants,
  isValidTenant,
} from '../src/lib/tenantResolver';
import type { TenantRegistry } from '../src/types';

describe('Módulo 5 — Multi-Tenant e Resolução de Domínios (src/lib/tenantResolver.ts)', () => {
  beforeEach(() => {
    resetLocalEngines();
  });
  const mockRegistry: TenantRegistry = {
    'loja-exemplo.com.br': {
      tenantId: 'loja_exemplo',
      apiUrl: 'https://script.google.com/macros/s/LOJA_EXEMPLO/exec',
      name: 'Loja Exemplo',
      domain: 'loja-exemplo.com.br',
    },
    'moda-style.com.br': {
      tenantId: 'moda_style',
      apiUrl: 'https://script.google.com/macros/s/MODA_STYLE/exec',
      name: 'Moda Style',
      domain: 'moda-style.com.br',
    },
    'loja-a.localhost': {
      tenantId: 'loja_a',
      apiUrl: 'https://script.google.com/macros/s/LOJA_A/exec',
      name: 'Loja A Local',
      domain: 'loja-a.localhost',
    },
    localhost: {
      tenantId: 'loja_exemplo',
      apiUrl: '',
      name: 'Loja Local Padrão',
      domain: 'localhost',
    },
  };

  // ============================================================
  // 1. NORMALIZAÇÃO DE HOSTNAME
  // ============================================================
  describe('normalizeHostname()', () => {
    it('deve remover portas (ex: :3000, :8080)', () => {
      expect(normalizeHostname('localhost:3000')).toBe('localhost');
      expect(normalizeHostname('loja-exemplo.com.br:8080')).toBe('loja-exemplo.com.br');
    });

    it('deve remover prefixo www. (política canônica)', () => {
      expect(normalizeHostname('www.loja-exemplo.com.br')).toBe('loja-exemplo.com.br');
      expect(normalizeHostname('www.moda-style.com.br:3000')).toBe('moda-style.com.br');
    });

    it('deve converter para letras minúsculas', () => {
      expect(normalizeHostname('LOJA-EXEMPLO.COM.BR')).toBe('loja-exemplo.com.br');
      expect(normalizeHostname('WwW.Moda-Style.Com.Br:3000')).toBe('moda-style.com.br');
    });

    it('deve lidar com hosts vazios, nulos ou indefinidos de forma segura', () => {
      expect(normalizeHostname('')).toBe('localhost');
      expect(normalizeHostname(null)).toBe('localhost');
      expect(normalizeHostname(undefined)).toBe('localhost');
    });
  });

  // ============================================================
  // 2. BUSCA E RESOLUÇÃO DE TENANTS
  // ============================================================
  describe('getTenantByHostname()', () => {
    it('deve resolver tenant válido cadastrado no registro', () => {
      const tenant = getTenantByHostname('loja-exemplo.com.br', mockRegistry);
      expect(tenant).toBeTruthy();
      expect(tenant?.tenantId).toBe('loja_exemplo');
      expect(tenant?.apiUrl).toContain('LOJA_EXEMPLO');
    });

    it('deve resolver tenant com prefixo www e porta informados', () => {
      const tenant = getTenantByHostname('www.moda-style.com.br:3000', mockRegistry);
      expect(tenant).toBeTruthy();
      expect(tenant?.tenantId).toBe('moda_style');
      expect(tenant?.apiUrl).toContain('MODA_STYLE');
    });

    it('deve resolver localhost e subdomínios locais para desenvolvimento', () => {
      const localTenant = getTenantByHostname('localhost:3000', mockRegistry);
      expect(localTenant).toBeTruthy();
      expect(localTenant?.tenantId).toBe('loja_exemplo');

      const subTenantA = getTenantByHostname('loja-a.localhost:3000', mockRegistry);
      expect(subTenantA).toBeTruthy();
      expect(subTenantA?.tenantId).toBe('loja_a');
      expect(subTenantA?.apiUrl).toContain('LOJA_A');
    });

    it('deve retornar null para domínios desconhecidos ou não cadastrados', () => {
      const unknown1 = getTenantByHostname('loja-fantasma-inexistente.com.br', mockRegistry);
      expect(unknown1).toBeNull();

      const unknown2 = getTenantByHostname('random-sub.localhost:3000', mockRegistry);
      expect(unknown2).toBeNull();
    });
  });

  // ============================================================
  // 3. SEGURANÇA & TENTATIVAS DE TENANT SPOOFING
  // ============================================================
  describe('Segurança & Prevenção contra Spoofing', () => {
    it('NUNCA deve permitir resolução de host arbitrário fornecido por invasor', () => {
      const maliciousHosts = [
        'attacker.com',
        'loja-exemplo.com.br.attacker.com',
        'fake-loja.com.br',
        'localhost.attacker.com',
      ];

      for (const host of maliciousHosts) {
        const result = getTenantByHostname(host, mockRegistry);
        expect(result).toBeNull();
      }
    });

    it('deve isolar completamente APIs entre tenants distintos', () => {
      const tenantExemplo = getTenantByHostname('loja-exemplo.com.br', mockRegistry);
      const tenantModa = getTenantByHostname('moda-style.com.br', mockRegistry);

      expect(tenantExemplo?.apiUrl).not.toBe(tenantModa?.apiUrl);
      expect(tenantExemplo?.tenantId).not.toBe(tenantModa?.tenantId);
    });

    it('isValidTenant() deve validar existências de tenantId no registro', () => {
      expect(isValidTenant('loja_exemplo', mockRegistry)).toBe(true);
      expect(isValidTenant('moda_style', mockRegistry)).toBe(true);
      expect(isValidTenant('hacker_id_invalido', mockRegistry)).toBe(false);
      expect(isValidTenant('', mockRegistry)).toBe(false);
    });
  });

  // ============================================================
  // 4. TESTE DE ISOLAMENTO DE DADOS ENTRE DOIS TENANTS FICTÍCIOS
  // ============================================================
  describe('Isolamento de Dados Ponta a Ponta entre Tenants Fictícios (loja_a vs loja_b)', () => {
    it('deve garantir que produtos e categorias de loja_a NUNCA apareçam no catálogo de loja_b', async () => {
      // 1. Popula tenant A (loja-a.localhost)
      const engineA = getLocalEngine('loja_a');
      const loginA = engineA.doPost({ action: 'login', password: 'admin123' });
      const tokenA = (loginA.data as any).token;
      const catResA = engineA.doPost({
        action: 'createCategory',
        token: tokenA,
        category: { nome: 'Calçados Alpha', ativo: true, ordem: 1 },
      });
      const catA = catResA.data as any;
      engineA.doPost({
        action: 'createProduct',
        token: tokenA,
        product: {
          categoriaId: catA.id,
          nome: 'Tênis Runner Alpha',
          preco: 299.9,
          estoque: 10,
          ativo: true,
        },
      });

      // 2. Popula tenant B (loja-b.localhost)
      const engineB = getLocalEngine('loja_b');
      const loginB = engineB.doPost({ action: 'login', password: 'admin123' });
      const tokenB = (loginB.data as any).token;
      const catResB = engineB.doPost({
        action: 'createCategory',
        token: tokenB,
        category: { nome: 'Esportes Beta', ativo: true, ordem: 1 },
      });
      const catB = catResB.data as any;
      engineB.doPost({
        action: 'createProduct',
        token: tokenB,
        product: {
          categoriaId: catB.id,
          nome: 'Camisa DryFit Beta',
          preco: 129.9,
          estoque: 25,
          ativo: true,
        },
      });

      // 3. Consulta Catálogo da Loja A via hostname
      const reqA = new NextRequest('http://loja-a.localhost:3000/api/backend?action=all', {
        headers: { host: 'loja-a.localhost:3000' },
      });
      const resA = await GET(reqA);
      const jsonA = await resA.json();

      expect(jsonA.success).toBe(true);
      expect(jsonA.data.store.store_id).toBe('loja_a');

      const productNamesA = jsonA.data.products.map((p: any) => p.nome);
      expect(productNamesA).toContain('Tênis Runner Alpha');
      expect(productNamesA).not.toContain('Camisa DryFit Beta');

      const categoryNamesA = jsonA.data.categories.map((c: any) => c.nome);
      expect(categoryNamesA).toContain('Calçados Alpha');
      expect(categoryNamesA).not.toContain('Esportes Beta');

      // 4. Consulta Catálogo da Loja B via hostname
      const reqB = new NextRequest('http://loja-b.localhost:3000/api/backend?action=all', {
        headers: { host: 'loja-b.localhost:3000' },
      });
      const resB = await GET(reqB);
      const jsonB = await resB.json();

      expect(jsonB.success).toBe(true);
      expect(jsonB.data.store.store_id).toBe('loja_b');

      const productNamesB = jsonB.data.products.map((p: any) => p.nome);
      expect(productNamesB).toContain('Camisa DryFit Beta');
      expect(productNamesB).not.toContain('Tênis Runner Alpha');

      const categoryNamesB = jsonB.data.categories.map((c: any) => c.nome);
      expect(categoryNamesB).toContain('Esportes Beta');
      expect(categoryNamesB).not.toContain('Calçados Alpha');
    });
  });

  // ============================================================
  // 4. AUTO-PROVISIONAMENTO E GESTÃO DE ASSINATURAS SAAS
  // ============================================================
  describe('SaaS Auto-Provisioning & Gestão de Assinaturas (src/lib/tenantStore.ts)', () => {
    it('deve auto-provisionar nova loja com Google Sheets e credenciais de acesso', async () => {
      const { registerTenant, findTenant, resetDynamicTenants } = await import('../src/lib/tenantStore');
      resetDynamicTenants();

      const result = await registerTenant({
        name: 'Bella Boutique',
        slug: 'bella-boutique-teste',
        whatsapp: '11988887777',
        password: 'senhaSegura123',
        plan: 'trial_30d',
        primaryColor: '#e11d48',
        niche: 'Roupas e Moda',
      });

      expect(result.tenant).toBeTruthy();
      expect(result.tenant.name).toBe('Bella Boutique');
      expect(result.tenant.slug).toBe('bella-boutique-teste');
      expect(result.tenant.plan).toBe('trial_30d');
      expect(result.tenant.subscriptionStatus).toBe('trial');
      expect(result.spreadsheetUrl).toContain('docs.google.com/spreadsheets/d/');
      expect(result.spreadsheetId).toBeTruthy();

      const found = findTenant('bella-boutique-teste');
      expect(found).toBeTruthy();
      expect(found?.tenantId).toBe(result.tenant.tenantId);
    });

    it('deve atualizar status de assinatura, renovar validade e alternar bloqueio', async () => {
      const { updateTenantSubscription, isTenantActive, findTenant } = await import('../src/lib/tenantStore');

      const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      const updated = updateTenantSubscription({
        tenantId: 'bella-boutique-teste',
        plan: 'monthly',
        subscriptionStatus: 'active',
        subscriptionExpiresAt: futureDate,
      });

      expect(updated).toBeTruthy();
      expect(updated?.plan).toBe('monthly');
      expect(updated?.subscriptionStatus).toBe('active');

      const checkActive = isTenantActive(updated!);
      expect(checkActive.active).toBe(true);
      expect(checkActive.daysRemaining).toBeGreaterThan(0);

      // Testa bloqueio da loja
      const blocked = updateTenantSubscription({
        tenantId: 'bella-boutique-teste',
        subscriptionStatus: 'blocked',
      });

      const checkBlocked = isTenantActive(blocked!);
      expect(checkBlocked.active).toBe(false);
      expect(checkBlocked.reason).toBe('blocked');
    });

    it('deve calcular métricas consolidadas do SaaS (MRR, lojas ativas, total)', async () => {
      const { getSaasMetrics } = await import('../src/lib/tenantStore');
      const metrics = getSaasMetrics();

      expect(metrics.totalStores).toBeGreaterThan(0);
      expect(typeof metrics.activeStores).toBe('number');
      expect(typeof metrics.trialStores).toBe('number');
      expect(typeof metrics.expiredOrBlockedStores).toBe('number');
      expect(typeof metrics.estimatedMonthlyRevenue).toBe('number');
      expect(metrics.estimatedMonthlyRevenue).toBeGreaterThanOrEqual(0);
    });

    it('deve gerar cobrança Asaas de R$ 129,90 e processar webhook de confirmação', async () => {
      const { createAsaasPayment, ASAAS_MONTHLY_PRICE } = await import('../src/lib/asaas');
      const { POST: webhookHandler } = await import('../src/app/api/asaas/webhook/route');
      const { findTenant } = await import('../src/lib/tenantStore');

      expect(ASAAS_MONTHLY_PRICE).toBe(129.9);

      // 1. Gera cobrança
      const payment = await createAsaasPayment({
        customer: 'cus_test_123',
        value: 129.9,
        dueDate: '2026-10-30',
        description: 'Assinatura Mensal Catálogo Digital',
        externalReference: 'bella_boutique_teste',
      });

      expect(payment.id).toBeTruthy();
      expect(payment.invoiceUrl).toBeTruthy();

      // 2. Dispara webhook simulando confirmação de pagamento do Asaas
      const webhookPayload = {
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: payment.id,
          customer: 'cus_test_123',
          value: 129.9,
          status: 'CONFIRMED',
          billingType: 'PIX',
          externalReference: 'bella_boutique_teste',
          invoiceUrl: payment.invoiceUrl,
          dueDate: '2026-10-30',
        },
      };

      const req = new NextRequest('http://localhost:3000/api/asaas/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      });

      const res = await webhookHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);

      // Verifica se a loja foi ativada como pagante
      const store = findTenant('bella_boutique_teste');
      expect(store?.subscriptionStatus).toBe('active');
      expect(store?.plan).toBe('monthly');
    });
  });

  // ============================================================
  // 9. PERSISTÊNCIA DURADOURA VIA SERVERLESS KV (UPSTASH / VERCEL KV)
  // ============================================================
  describe('9. Persistência Serverless KV (getKvConfig, syncTenantsToRemote, syncTenantsFromRemote)', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    it('deve retornar null se variáveis KV não estiverem configuradas', async () => {
      delete process.env['KV_REST_API_URL'];
      delete process.env['KV_REST_API_TOKEN'];
      delete process.env['UPSTASH_REDIS_REST_URL'];
      delete process.env['UPSTASH_REDIS_REST_TOKEN'];

      const { getKvConfig, syncTenantsToRemote, syncTenantsFromRemote } = await import(
        '../src/lib/tenantStore'
      );

      expect(getKvConfig()).toBeNull();
      expect(await syncTenantsToRemote()).toBe(false);
      expect(await syncTenantsFromRemote()).toBe(false);
    });

    it('deve detectar configuração Vercel KV ou Upstash Redis REST', async () => {
      process.env['KV_REST_API_URL'] = 'https://clean-test.upstash.io/';
      process.env['KV_REST_API_TOKEN'] = 'secret_token_123';

      const { getKvConfig } = await import('../src/lib/tenantStore');
      const kv = getKvConfig();

      expect(kv).toBeTruthy();
      expect(kv?.url).toBe('https://clean-test.upstash.io');
      expect(kv?.token).toBe('secret_token_123');
    });

    it('deve sincronizar com sucesso quando KV remoto responde com sucesso', async () => {
      process.env['KV_REST_API_URL'] = 'https://clean-test.upstash.io';
      process.env['KV_REST_API_TOKEN'] = 'secret_token_123';

      const originalFetch = global.fetch;
      try {
        // Mock fetch para Upstash / Vercel KV REST
        const mockFetch = (async (input: RequestInfo | URL) => {
          const urlStr = input.toString();

          if (urlStr.includes('/set/saas_tenants_registry')) {
            return new Response(JSON.stringify({ result: 'OK' }), { status: 200 });
          }

          if (urlStr.includes('/get/saas_tenants_registry')) {
            const remotePayload = {
              'remote-store.com.br': {
                tenantId: 'remote_store',
                apiUrl: 'https://script.google.com/macros/s/REMOTE/exec',
                name: 'Loja Remota KV',
                domain: 'remote-store.com.br',
                plan: 'monthly',
                subscriptionStatus: 'active',
              },
            };
            return new Response(JSON.stringify({ result: JSON.stringify(remotePayload) }), {
              status: 200,
            });
          }

          return new Response('Not found', { status: 404 });
        }) as unknown as typeof fetch;

        global.fetch = mockFetch;

        const { syncTenantsToRemote, syncTenantsFromRemote, findTenant } = await import(
          '../src/lib/tenantStore'
        );

        const pushResult = await syncTenantsToRemote();
        expect(pushResult).toBe(true);

        const pullResult = await syncTenantsFromRemote();
        expect(pullResult).toBe(true);

        const remoteTenant = findTenant('remote_store');
        expect(remoteTenant).toBeTruthy();
        expect(remoteTenant?.name).toBe('Loja Remota KV');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});

