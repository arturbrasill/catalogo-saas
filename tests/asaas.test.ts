import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getAsaasApiKey,
  getAsaasEnv,
  getAsaasBaseUrl,
  getAsaasWebhookSecret,
  verifyAsaasWebhookToken,
  createOrGetAsaasCustomer,
  createAsaasPayment,
  createAsaasSubscription,
  ASAAS_MONTHLY_PRICE,
} from '../src/lib/asaas';
import {
  findTenant,
  updateTenantSubscription,
  registerTenant,
} from '../src/lib/tenantStore';
import { POST as handleWebhook } from '../src/app/api/asaas/webhook/route';
import { NextRequest } from 'next/server';

describe('Integração Asaas — Gateway de Pagamentos e Assinaturas', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('Configurações e Variáveis de Ambiente', () => {
    it('deve identificar o valor do plano mensal fixo de R$ 129,90', () => {
      expect(ASAAS_MONTHLY_PRICE).toBe(129.9);
    });

    it('deve ler chave de API dinamicamente', () => {
      process.env['ASAAS_API_KEY'] = 'test_api_key_123';
      expect(getAsaasApiKey()).toBe('test_api_key_123');
    });

    it('deve usar URL de produção quando ASAAS_ENVIRONMENT for production', () => {
      process.env['ASAAS_ENVIRONMENT'] = 'production';
      expect(getAsaasEnv()).toBe('production');
      expect(getAsaasBaseUrl()).toBe('https://api.asaas.com/v3');
    });

    it('deve usar URL de sandbox por padrão', () => {
      delete process.env['ASAAS_ENVIRONMENT'];
      expect(getAsaasBaseUrl()).toBe('https://sandbox.asaas.com/api/v3');
    });
  });

  describe('Validação de Token de Segurança do Webhook', () => {
    it('deve validar token correto configurado no ASAAS_WEBHOOK_SECRET', () => {
      process.env['ASAAS_WEBHOOK_SECRET'] = 'secret_webhook_token_xyz';
      expect(verifyAsaasWebhookToken('secret_webhook_token_xyz')).toBe(true);
      expect(verifyAsaasWebhookToken('token_errado')).toBe(false);
      expect(verifyAsaasWebhookToken(null)).toBe(false);
    });

    it('deve permitir requisições se nenhum secret estiver configurado', () => {
      delete process.env['ASAAS_WEBHOOK_SECRET'];
      expect(verifyAsaasWebhookToken('qualquer_token')).toBe(true);
      expect(verifyAsaasWebhookToken(null)).toBe(true);
    });
  });

  describe('Simulação Local / Fallback sem Chave Real', () => {
    it('deve gerar ID mock de cliente quando a chave não estiver configurada', async () => {
      delete process.env['ASAAS_API_KEY'];
      const res = await createOrGetAsaasCustomer({
        name: 'Loja Teste',
        externalReference: 'loja_teste_123',
      });
      expect(res.id).toContain('cus_mock_');
      expect(res.name).toBe('Loja Teste');
    });

    it('deve gerar link mock de cobrança avulsa quando a chave não estiver configurada', async () => {
      delete process.env['ASAAS_API_KEY'];
      const res = await createAsaasPayment({
        customer: 'cus_123',
        dueDate: '2026-10-30',
        externalReference: 'loja_teste_123',
      });
      expect(res.id).toContain('pay_mock_');
      expect(res.invoiceUrl).toContain('https://sandbox.asaas.com/i/');
    });

    it('deve gerar assinatura mock quando a chave não estiver configurada', async () => {
      delete process.env['ASAAS_API_KEY'];
      const res = await createAsaasSubscription({
        customerId: 'cus_123',
        nextDueDate: '2026-10-30',
        externalReference: 'loja_teste_123',
      });
      expect(res.id).toContain('sub_mock_');
      expect(res.invoiceUrl).toContain('https://sandbox.asaas.com/s/');
    });
  });

  describe('Chamadas HTTP Reais / Mockadas para API Asaas', () => {
    it('deve enviar requisição correta para /customers com access_token', async () => {
      process.env['ASAAS_API_KEY'] = '$aact_prod_mock';
      process.env['ASAAS_ENVIRONMENT'] = 'production';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'cus_asaas_real_999', name: 'João Calçados' }),
      });
      global.fetch = mockFetch;

      const res = await createOrGetAsaasCustomer({
        name: 'João Calçados',
        email: 'joao@calcados.com',
        phone: '11999998888',
        cpfCnpj: '12.345.678/0001-90',
        externalReference: 'joao_calcados',
      });

      expect(res.id).toBe('cus_asaas_real_999');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.asaas.com/v3/customers',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            access_token: '$aact_prod_mock',
          }),
        })
      );
    });

    it('deve criar cobrança de R$ 129,90 com vencimento especificado', async () => {
      process.env['ASAAS_API_KEY'] = '$aact_prod_mock';
      process.env['ASAAS_ENVIRONMENT'] = 'production';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'pay_asaas_real_123',
          invoiceUrl: 'https://www.asaas.com/i/pay_asaas_real_123',
        }),
      });
      global.fetch = mockFetch;

      const res = await createAsaasPayment({
        customer: 'cus_asaas_real_999',
        dueDate: '2026-10-25',
        externalReference: 'joao_calcados',
      });

      expect(res.id).toBe('pay_asaas_real_123');
      expect(res.invoiceUrl).toBe('https://www.asaas.com/i/pay_asaas_real_123');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.asaas.com/v3/payments',
        expect.objectContaining({
          body: expect.stringContaining('"value":129.9'),
        })
      );
    });
  });

  describe('Processamento de Webhooks do Asaas (/api/asaas/webhook)', () => {
    const testTenantId = 'tenant_asaas_test';

    beforeEach(async () => {
      // Registra tenant de teste
      await registerTenant({
        slug: testTenantId,
        name: 'Loja Teste Webhook',
        plan: 'monthly',
        ownerEmail: 'teste@loja.com',
        whatsapp: '5511999999999',
      });
    });

    it('deve rejeitar webhook com token incorreto (HTTP 401)', async () => {
      process.env['ASAAS_WEBHOOK_SECRET'] = 'secret_correto';

      const req = new NextRequest('http://localhost:3000/api/asaas/webhook', {
        method: 'POST',
        headers: {
          'asaas-access-token': 'token_falso',
        },
        body: JSON.stringify({
          event: 'PAYMENT_RECEIVED',
          payment: { id: 'pay_1', externalReference: testTenantId },
        }),
      });

      const res = await handleWebhook(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Token de webhook inválido');
    });

    it('deve processar PAYMENT_CONFIRMED, ativar loja e estender validade por 30 dias', async () => {
      process.env['ASAAS_WEBHOOK_SECRET'] = 'secret_correto';

      const req = new NextRequest('http://localhost:3000/api/asaas/webhook', {
        method: 'POST',
        headers: {
          'asaas-access-token': 'secret_correto',
        },
        body: JSON.stringify({
          event: 'PAYMENT_CONFIRMED',
          payment: {
            id: 'pay_confirmado_123',
            customer: 'cus_456',
            externalReference: testTenantId,
            invoiceUrl: 'https://asaas.com/i/pay_confirmado_123',
          },
        }),
      });

      const res = await handleWebhook(req);
      expect(res.status).toBe(200);

      const updatedTenant = findTenant(testTenantId);
      expect(updatedTenant).toBeDefined();
      expect(updatedTenant?.subscriptionStatus).toBe('active');
      expect(updatedTenant?.plan).toBe('monthly');
      expect(updatedTenant?.asaasCustomerId).toBe('cus_456');

      // Validade deve estar no futuro (~30 dias)
      const expiry = new Date(updatedTenant!.subscriptionExpiresAt!).getTime();
      expect(expiry).toBeGreaterThan(Date.now() + 25 * 24 * 60 * 60 * 1000);
    });

    it('deve suspender/expirar loja quando evento for PAYMENT_OVERDUE', async () => {
      process.env['ASAAS_WEBHOOK_SECRET'] = 'secret_correto';

      const req = new NextRequest('http://localhost:3000/api/asaas/webhook', {
        method: 'POST',
        headers: {
          'asaas-access-token': 'secret_correto',
        },
        body: JSON.stringify({
          event: 'PAYMENT_OVERDUE',
          payment: {
            id: 'pay_vencido_999',
            externalReference: testTenantId,
          },
        }),
      });

      const res = await handleWebhook(req);
      expect(res.status).toBe(200);

      const updatedTenant = findTenant(testTenantId);
      expect(updatedTenant?.subscriptionStatus).toBe('expired');
    });

    it('deve cancelar loja quando evento for SUBSCRIPTION_CANCELLED', async () => {
      process.env['ASAAS_WEBHOOK_SECRET'] = 'secret_correto';

      const req = new NextRequest('http://localhost:3000/api/asaas/webhook', {
        method: 'POST',
        headers: {
          'asaas-access-token': 'secret_correto',
        },
        body: JSON.stringify({
          event: 'SUBSCRIPTION_CANCELLED',
          payment: {
            id: 'pay_del_123',
            externalReference: testTenantId,
          },
        }),
      });

      const res = await handleWebhook(req);
      expect(res.status).toBe(200);

      const updatedTenant = findTenant(testTenantId);
      expect(updatedTenant?.subscriptionStatus).toBe('cancelled');
    });
  });
});
