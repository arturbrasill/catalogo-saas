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
  getAsaasSubscriptionPayments,
  getAsaasSubscriptionInvoice,
  getAsaasPaymentPix,
  calculateTrialDueDate,
  ASAAS_MONTHLY_PRICE,
  ASAAS_YEARLY_PRICE,
} from '../src/lib/asaas';
import {
  findTenant,
  findTenantAsync,
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
    it('deve identificar o valor do plano mensal fixo de R$ 79,90 e anual de R$ 718,80', () => {
      expect(ASAAS_MONTHLY_PRICE).toBe(79.9);
      expect(ASAAS_YEARLY_PRICE).toBe(718.8);
    });

    it('deve calcular a data de vencimento da primeira cobrança do trial de 7 dias no formato YYYY-MM-DD', () => {
      const fixedDate = new Date('2026-10-03T12:00:00Z');
      const trialDueDate = calculateTrialDueDate(fixedDate, 7);
      expect(trialDueDate).toBe('2026-10-10');
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

    it('deve gerar assinatura mock quando a chave não estiver configurada com trial de 7 dias', async () => {
      delete process.env['ASAAS_API_KEY'];
      const res = await createAsaasSubscription({
        customerId: 'cus_123',
        nextDueDate: '2026-10-10',
        externalReference: 'loja_teste_123',
      });
      expect(res.id).toContain('sub_mock_');
      expect(res.invoiceUrl).toContain('https://sandbox.asaas.com/s/');
      expect(res.nextDueDate).toBe('2026-10-10');
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

    it('deve criar assinatura recorrente com valor padrão 79.90, ciclo MONTHLY e vencimento pós-trial', async () => {
      process.env['ASAAS_API_KEY'] = '$aact_prod_mock';
      process.env['ASAAS_ENVIRONMENT'] = 'production';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'sub_asaas_real_456',
          invoiceUrl: 'https://www.asaas.com/s/sub_asaas_real_456',
          nextDueDate: '2026-10-10',
        }),
      });
      global.fetch = mockFetch;

      const res = await createAsaasSubscription({
        customerId: 'cus_asaas_real_999',
        nextDueDate: '2026-10-10',
        externalReference: 'joao_calcados',
      });

      expect(res.id).toBe('sub_asaas_real_456');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.asaas.com/v3/subscriptions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            customer: 'cus_asaas_real_999',
            billingType: 'UNDEFINED',
            value: 79.9,
            nextDueDate: '2026-10-10',
            cycle: 'MONTHLY',
            description: 'Assinatura Recorrente Mensal Catálogo Digital NumClick (R$ 79,90)',
            externalReference: 'joao_calcados',
          }),
        })
      );
    });

    it('deve agendar cobrança de cartão de crédito para após os 7 dias de trial gratuito', async () => {
      process.env['ASAAS_API_KEY'] = '$aact_prod_mock';
      process.env['ASAAS_ENVIRONMENT'] = 'production';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'sub_cartao_789',
          invoiceUrl: 'https://www.asaas.com/s/sub_cartao_789',
          nextDueDate: '2026-10-10',
        }),
      });
      global.fetch = mockFetch;

      const res = await createAsaasSubscription({
        customerId: 'cus_asaas_real_999',
        nextDueDate: '2026-10-10',
        externalReference: 'joao_calcados',
        creditCard: {
          holderName: 'JOAO SILVA',
          number: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2028',
          ccv: '123',
        },
      });

      expect(res.id).toBe('sub_cartao_789');
      const calledBody = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string);
      expect(calledBody.billingType).toBe('CREDIT_CARD');
      expect(calledBody.cycle).toBe('MONTHLY');
      expect(calledBody.value).toBe(79.9);
      expect(calledBody.nextDueDate).toBe('2026-10-10');
      expect(calledBody.creditCard.holderName).toBe('JOAO SILVA');
    });

    it('deve criar cobrança de R$ 79,90 com vencimento especificado', async () => {
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
          body: expect.stringContaining('"value":79.9'),
        })
      );
    });

    it('deve consultar pagamentos de uma assinatura no Asaas', async () => {
      process.env['ASAAS_API_KEY'] = '$aact_prod_mock';
      process.env['ASAAS_ENVIRONMENT'] = 'production';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'pay_sub_1',
              status: 'PENDING',
              value: 79.9,
              invoiceUrl: 'https://www.asaas.com/i/pay_sub_1',
              dueDate: '2026-10-10',
            },
          ],
        }),
      });
      global.fetch = mockFetch;

      const payments = await getAsaasSubscriptionPayments('sub_test_123');
      expect(payments).toHaveLength(1);
      expect(payments[0]?.id).toBe('pay_sub_1');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.asaas.com/v3/subscriptions/sub_test_123/payments?limit=10',
        expect.any(Object)
      );
    });

    it('deve obter a fatura pendente de uma assinatura existente', async () => {
      process.env['ASAAS_API_KEY'] = '$aact_prod_mock';
      process.env['ASAAS_ENVIRONMENT'] = 'production';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'pay_pending_99',
              status: 'PENDING',
              value: 79.9,
              invoiceUrl: 'https://www.asaas.com/i/pay_pending_99',
              dueDate: '2026-10-10',
            },
          ],
        }),
      });
      global.fetch = mockFetch;

      const invoice = await getAsaasSubscriptionInvoice('sub_test_123');
      expect(invoice).not.toBeNull();
      expect(invoice?.id).toBe('pay_pending_99');
      expect(invoice?.invoiceUrl).toBe('https://www.asaas.com/i/pay_pending_99');
      expect(invoice?.status).toBe('PENDING');
    });

    it('deve consultar dados do QR Code PIX de uma cobrança', async () => {
      process.env['ASAAS_API_KEY'] = '$aact_prod_mock';
      process.env['ASAAS_ENVIRONMENT'] = 'production';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          encodedImage: 'base64image...',
          payload: '00020101021226800014br.gov.bcb.pix...',
          expirationDate: '2027-10-10 23:59:59',
        }),
      });
      global.fetch = mockFetch;

      const pix = await getAsaasPaymentPix('pay_123');
      expect(pix.success).toBe(true);
      expect(pix.payload).toContain('00020101021226800014br.gov.bcb.pix');
      expect(pix.encodedImage).toBe('base64image...');
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

    it('deve processar PAYMENT_RECEIVED e manter status ATIVO da loja', async () => {
      process.env['ASAAS_WEBHOOK_SECRET'] = 'secret_correto';

      const req = new NextRequest('http://localhost:3000/api/asaas/webhook', {
        method: 'POST',
        headers: {
          'asaas-access-token': 'secret_correto',
        },
        body: JSON.stringify({
          event: 'PAYMENT_RECEIVED',
          payment: {
            id: 'pay_recebido_777',
            customer: 'cus_456',
            externalReference: testTenantId,
            invoiceUrl: 'https://asaas.com/i/pay_recebido_777',
          },
        }),
      });

      const res = await handleWebhook(req);
      expect(res.status).toBe(200);

      const updatedTenant = findTenant(testTenantId);
      expect(updatedTenant?.subscriptionStatus).toBe('active');
      expect(updatedTenant?.pendingPayment).toBe(false);
    });

    it('deve suspender e bloquear loja quando evento for PAYMENT_OVERDUE, ativando aviso de pendência', async () => {
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
      expect(updatedTenant?.subscriptionStatus).toBe('blocked');
      expect(updatedTenant?.pendingPayment).toBe(true);
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

  describe('Checkout Endpoint (/api/asaas/checkout)', () => {
    it('deve gerar assinatura mensal (R$ 79,90) e anual com trial de 7 dias', async () => {
      const { POST: handleCheckout } = await import('../src/app/api/asaas/checkout/route');

      // Tenant de teste
      const checkoutTenantId = 'loja_checkout_test';
      await registerTenant({
        slug: checkoutTenantId,
        name: 'Loja Checkout Teste',
        plan: 'monthly',
        ownerEmail: 'checkout@loja.com',
        whatsapp: '5511988887777',
      });

      // 1. Checkout Plano Mensal Recorrente
      const reqMonthly = new NextRequest('http://localhost:3000/api/asaas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: checkoutTenantId,
          cpfCnpj: '12345678901',
          plan: 'monthly',
        }),
      });

      const resMonthly = await handleCheckout(reqMonthly);
      expect(resMonthly.status).toBe(200);
      const dataMonthly = await resMonthly.json();
      expect(dataMonthly.success).toBe(true);
      expect(dataMonthly.data.value).toBe(79.9);
      expect(dataMonthly.data.cycle).toBe('MONTHLY');
      expect(dataMonthly.data.nextDueDate).toBeDefined();
      expect(dataMonthly.data.invoiceUrl).toMatch(/https:\/\/sandbox\.asaas\.com\/(i|s)\//);

      // 2. Checkout Plano Anual
      const reqYearly = new NextRequest('http://localhost:3000/api/asaas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: checkoutTenantId,
          cpfCnpj: '12345678901',
          plan: 'yearly',
        }),
      });

      const resYearly = await handleCheckout(reqYearly);
      expect(resYearly.status).toBe(200);
      const dataYearly = await resYearly.json();
      expect(dataYearly.success).toBe(true);
      expect(dataYearly.data.value).toBe(718.8);
      expect(dataYearly.data.cycle).toBe('YEARLY');
      expect(dataYearly.data.nextDueDate).toBeDefined();
      expect(dataYearly.data.invoiceUrl).toMatch(/https:\/\/sandbox\.asaas\.com\/(i|s)\//);

      // 3. Checkout com Cartão de Crédito (cobrança agendada para pós-trial)
      const reqCard = new NextRequest('http://localhost:3000/api/asaas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: checkoutTenantId,
          cpfCnpj: '12345678901',
          plan: 'monthly',
          creditCard: {
            holderName: 'MARIA SILVA',
            number: '5555444433332222',
            expiryMonth: '11',
            expiryYear: '2029',
            ccv: '999',
          },
        }),
      });

      const resCard = await handleCheckout(reqCard);
      expect(resCard.status).toBe(200);
      const dataCard = await resCard.json();
      expect(dataCard.success).toBe(true);
      expect(dataCard.data.billingType).toBe('CREDIT_CARD');
      expect(dataCard.data.nextDueDate).toBeDefined();
    });

    it('deve localizar a loja por slug com traço (ex: loja-checkout-test) mesmo se o tenantId for com underline', async () => {
      const { POST: handleCheckout } = await import('../src/app/api/asaas/checkout/route');

      const reqSlug = new NextRequest('http://localhost:3000/api/asaas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'loja-checkout-test',
          plan: 'monthly',
        }),
      });

      const resSlug = await handleCheckout(reqSlug);
      expect(resSlug.status).toBe(200);
      const dataSlug = await resSlug.json();
      expect(dataSlug.success).toBe(true);
      expect(dataSlug.data.invoiceUrl).toBeDefined();
    });

    it('deve resolver loja a partir do header x-tenant-id ou cookies se não enviado no body', async () => {
      const { POST: handleCheckout } = await import('../src/app/api/asaas/checkout/route');

      const reqHeader = new NextRequest('http://localhost:3000/api/asaas/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'loja_checkout_test',
        },
        body: JSON.stringify({
          plan: 'monthly',
        }),
      });

      const resHeader = await handleCheckout(reqHeader);
      expect(resHeader.status).toBe(200);
      const dataHeader = await resHeader.json();
      expect(dataHeader.success).toBe(true);
    });

    it('deve retornar erro 404 amigável se a loja não existir em nenhuma fonte', async () => {
      const { POST: handleCheckout } = await import('../src/app/api/asaas/checkout/route');

      const reqNotFound = new NextRequest('http://localhost:3000/api/asaas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'loja_inexistente_99999',
          plan: 'monthly',
        }),
      });

      const resNotFound = await handleCheckout(reqNotFound);
      expect(resNotFound.status).toBe(404);
      const dataNotFound = await resNotFound.json();
      expect(dataNotFound.success).toBe(false);
      expect(dataNotFound.error).toContain('Loja não encontrada');
    });

    it('deve retornar erro 400 se nenhum identificador for fornecido', async () => {
      const { POST: handleCheckout } = await import('../src/app/api/asaas/checkout/route');

      const reqEmpty = new NextRequest('http://localhost:3000/api/asaas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'monthly',
        }),
      });

      const resEmpty = await handleCheckout(reqEmpty);
      expect(resEmpty.status).toBe(400);
      const dataEmpty = await resEmpty.json();
      expect(dataEmpty.success).toBe(false);
    });
  });

  describe('Resolução Resiliente e Recuperação de Cliente Asaas', () => {
    it('findTenantAsync deve resolver loja por slug, tenantId e normalização de traços', async () => {
      const tenant = await findTenantAsync('loja-checkout-test');
      expect(tenant).not.toBeNull();
      expect(tenant?.tenantId).toBe('loja_checkout_test');
    });

    it('deve recuperar cliente existente no Asaas quando a criação POST falhar por duplicidade', async () => {
      process.env['ASAAS_API_KEY'] = '$aact_prod_mock';
      process.env['ASAAS_ENVIRONMENT'] = 'production';

      const mockFetch = vi
        .fn()
        // Primeira chamada (POST): Asaas avisa que CPF já pertence a outro cliente
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            errors: [{ description: 'O CPF/CNPJ informado já pertence a outro cliente.' }],
          }),
        })
        // Segunda chamada (GET de busca por externalReference ou CPF): recupera cliente existente
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            data: [{ id: 'cus_recuperado_123', name: 'Maria Loja Recuperada' }],
          }),
        });

      global.fetch = mockFetch;

      const customer = await createOrGetAsaasCustomer({
        name: 'Maria Loja',
        cpfCnpj: '99988877766',
        externalReference: 'maria_loja',
      });

      expect(customer.id).toBe('cus_recuperado_123');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('deve cadastrar e persistir CPF/CNPJ da loja no registerTenant e utilizá-lo no checkout do Asaas', async () => {
      const { POST: handleCheckout } = await import('../src/app/api/asaas/checkout/route');

      const lojaDocTenantId = 'loja_com_documento_cpf';
      await registerTenant({
        slug: lojaDocTenantId,
        name: 'Loja com Documento',
        plan: 'trial_30d',
        ownerEmail: 'doc@loja.com',
        whatsapp: '5511977776666',
        cpfCnpj: '529.982.247-25',
      });

      const tenant = findTenant(lojaDocTenantId);
      expect(tenant?.cpfCnpj).toBe('529.982.247-25');

      // Checkout sem passar CPF no body deve herdar o CPF salvo na loja
      const reqInherit = new NextRequest('http://localhost:3000/api/asaas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: lojaDocTenantId,
          plan: 'monthly',
        }),
      });

      const resInherit = await handleCheckout(reqInherit);
      expect(resInherit.status).toBe(200);
      const dataInherit = await resInherit.json();
      expect(dataInherit.success).toBe(true);
      expect(dataInherit.data.invoiceUrl).toBeDefined();
    });

    it('deve atualizar e salvar o CPF/CNPJ no cadastro da loja quando fornecido durante o checkout', async () => {
      const { POST: handleCheckout } = await import('../src/app/api/asaas/checkout/route');

      const lojaSemDoc = 'loja_sem_documento_inicial';
      await registerTenant({
        slug: lojaSemDoc,
        name: 'Loja Sem Doc Inicial',
        plan: 'trial_30d',
        ownerEmail: 'semdoc@loja.com',
        whatsapp: '5511966665555',
      });

      const reqAddDoc = new NextRequest('http://localhost:3000/api/asaas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: lojaSemDoc,
          cpfCnpj: '00.000.000/0001-91',
          plan: 'monthly',
        }),
      });

      const resAddDoc = await handleCheckout(reqAddDoc);
      expect(resAddDoc.status).toBe(200);

      const updatedTenant = findTenant(lojaSemDoc);
      expect(updatedTenant?.cpfCnpj).toBe('00.000.000/0001-91');
    });
  });
});
