import type { AsaasCustomerInput, AsaasPaymentInput } from '@/types';

export const ASAAS_MONTHLY_PRICE = 129.9;

const ASAAS_API_KEY = process.env['ASAAS_API_KEY'] || '';
const ASAAS_ENV = process.env['ASAAS_ENVIRONMENT'] || 'sandbox';
const ASAAS_WEBHOOK_SECRET = process.env['ASAAS_WEBHOOK_SECRET'] || '';

const ASAAS_BASE_URL =
  ASAAS_ENV === 'production'
    ? 'https://api.asaas.com/v3'
    : 'https://sandbox.asaas.com/api/v3';

/**
 * Cria ou localiza um cliente no Asaas a partir dos dados do lojista
 */
export async function createOrGetAsaasCustomer(
  input: AsaasCustomerInput
): Promise<{ id: string; name: string; error?: string }> {
  // Se a chave não estiver configurada, gera ID em modo de simulação seguro
  if (!ASAAS_API_KEY || ASAAS_API_KEY.includes('exemplo')) {
    const mockId = 'cus_mock_' + (input.externalReference || Math.random().toString(36).substring(2, 10));
    return { id: mockId, name: input.name };
  }

  try {
    const payload = {
      name: input.name.trim(),
      email: input.email?.trim() || undefined,
      phone: input.phone || undefined,
      mobilePhone: input.mobilePhone || input.phone || undefined,
      cpfCnpj: input.cpfCnpj?.replace(/\D/g, '') || undefined,
      externalReference: input.externalReference,
      notificationDisabled: false,
    };

    const res = await fetch(`${ASAAS_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: ASAAS_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.id) {
      const errMsg =
        data.errors && data.errors[0]
          ? data.errors[0].description
          : 'Erro ao cadastrar cliente no Asaas.';
      return { id: '', name: input.name, error: errMsg };
    }

    return { id: data.id, name: data.name };
  } catch (err) {
    return { id: '', name: input.name, error: String(err) };
  }
}

/**
 * Cria uma cobrança ou link de fatura avulso de R$ 129,90 via Asaas (PIX, Cartão, Boleto)
 */
export async function createAsaasPayment(
  input: AsaasPaymentInput
): Promise<{ id: string; invoiceUrl: string; error?: string }> {
  const valueToCharge = input.value || ASAAS_MONTHLY_PRICE;

  if (!ASAAS_API_KEY || ASAAS_API_KEY.includes('exemplo')) {
    const mockPaymentId = 'pay_mock_' + Math.random().toString(36).substring(2, 12);
    const mockInvoiceUrl = `https://sandbox.asaas.com/i/${mockPaymentId}`;
    return { id: mockPaymentId, invoiceUrl: mockInvoiceUrl };
  }

  try {
    const res = await fetch(`${ASAAS_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: ASAAS_API_KEY,
      },
      body: JSON.stringify({
        customer: input.customer,
        billingType: input.billingType || 'UNDEFINED',
        value: valueToCharge,
        dueDate: input.dueDate,
        description: input.description || 'Assinatura Mensal Catálogo Digital SaaS',
        externalReference: input.externalReference,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.id) {
      const errMsg =
        data.errors && data.errors[0]
          ? data.errors[0].description
          : 'Erro ao gerar cobrança no Asaas.';
      return { id: '', invoiceUrl: '', error: errMsg };
    }

    return {
      id: data.id,
      invoiceUrl: data.invoiceUrl || data.bankSlipUrl || `${ASAAS_BASE_URL}/payments/${data.id}`,
    };
  } catch (err) {
    return { id: '', invoiceUrl: '', error: String(err) };
  }
}

/**
 * Cria uma assinatura mensal recorrente de R$ 129,90 no Asaas
 */
export async function createAsaasSubscription(input: {
  customerId: string;
  value?: number;
  nextDueDate: string;
  externalReference: string;
  description?: string;
}): Promise<{ id: string; invoiceUrl?: string; error?: string }> {
  const valueToCharge = input.value || ASAAS_MONTHLY_PRICE;

  if (!ASAAS_API_KEY || ASAAS_API_KEY.includes('exemplo')) {
    const mockSubId = 'sub_mock_' + Math.random().toString(36).substring(2, 12);
    return {
      id: mockSubId,
      invoiceUrl: `https://sandbox.asaas.com/s/${mockSubId}`,
    };
  }

  try {
    const res = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: ASAAS_API_KEY,
      },
      body: JSON.stringify({
        customer: input.customerId,
        billingType: 'UNDEFINED',
        value: valueToCharge,
        nextDueDate: input.nextDueDate,
        cycle: 'MONTHLY',
        description: input.description || 'Assinatura Recorrente Mensal Catálogo SaaS (R$ 129,90)',
        externalReference: input.externalReference,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.id) {
      const errMsg =
        data.errors && data.errors[0]
          ? data.errors[0].description
          : 'Erro ao criar assinatura no Asaas.';
      return { id: '', error: errMsg };
    }

    return {
      id: data.id,
      invoiceUrl: data.invoiceUrl || `https://sandbox.asaas.com/s/${data.id}`,
    };
  } catch (err) {
    return { id: '', error: String(err) };
  }
}

/**
 * Validação de token de segurança do webhook enviado pelo Asaas
 */
export function verifyAsaasWebhookToken(tokenHeader: string | null): boolean {
  if (!ASAAS_WEBHOOK_SECRET) {
    return true; // Se o lojista não configurou secret no .env, aceita requisição
  }
  return tokenHeader === ASAAS_WEBHOOK_SECRET;
}
