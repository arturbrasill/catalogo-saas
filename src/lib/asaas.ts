import type {
  AsaasCustomerInput,
  AsaasPaymentInput,
  AsaasSubscriptionInput,
  AsaasCreditCardInput,
  AsaasCreditCardHolderInfo,
} from '@/types';

export const ASAAS_MONTHLY_PRICE = 79.9;
export const ASAAS_YEARLY_PRICE = 718.8; // R$ 59,90/mês cobrado anualmente

/**
 * Calcula a data da primeira cobrança exatamente 7 dias após o cadastro (Trial/Degustação)
 * Retorna no formato YYYY-MM-DD exigido pela API do Asaas.
 */
export function calculateTrialDueDate(startDate: Date = new Date(), trialDays: number = 7): string {
  const target = new Date(startDate.getTime() + trialDays * 24 * 60 * 60 * 1000);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getAsaasApiKey(): string {
  return process.env['ASAAS_API_KEY'] || '';
}

export function getAsaasEnv(): string {
  return process.env['ASAAS_ENVIRONMENT'] || 'sandbox';
}

export function getAsaasBaseUrl(): string {
  return getAsaasEnv() === 'production'
    ? 'https://api.asaas.com/v3'
    : 'https://sandbox.asaas.com/api/v3';
}

export function getAsaasWebhookSecret(): string {
  return process.env['ASAAS_WEBHOOK_SECRET'] || '';
}

/**
 * Cria ou localiza um cliente no Asaas a partir dos dados do lojista
 */
export async function createOrGetAsaasCustomer(
  input: AsaasCustomerInput
): Promise<{ id: string; name: string; error?: string }> {
  const apiKey = getAsaasApiKey();
  const baseUrl = getAsaasBaseUrl();

  // Se a chave não estiver configurada, gera ID em modo de simulação seguro
  if (!apiKey || apiKey.includes('exemplo')) {
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

    const res = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: apiKey,
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
 * Cria uma cobrança ou link de fatura avulso de R$ 79,90 via Asaas (PIX, Cartão, Boleto)
 */
export async function createAsaasPayment(
  input: AsaasPaymentInput
): Promise<{ id: string; invoiceUrl: string; error?: string }> {
  const apiKey = getAsaasApiKey();
  const baseUrl = getAsaasBaseUrl();
  const valueToCharge = input.value || ASAAS_MONTHLY_PRICE;

  if (!apiKey || apiKey.includes('exemplo')) {
    const mockPaymentId = 'pay_mock_' + Math.random().toString(36).substring(2, 12);
    const mockInvoiceUrl = `https://sandbox.asaas.com/i/${mockPaymentId}`;
    return { id: mockPaymentId, invoiceUrl: mockInvoiceUrl };
  }

  try {
    const res = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: apiKey,
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
      invoiceUrl: data.invoiceUrl || data.bankSlipUrl || `${baseUrl}/payments/${data.id}`,
    };
  } catch (err) {
    return { id: '', invoiceUrl: '', error: String(err) };
  }
}

/**
 * Cria uma assinatura mensal recorrente (padrão R$ 79,90) no Asaas
 * - Valor padrão: 79.90
 * - Ciclo: 'MONTHLY'
 * - billingType: 'UNDEFINED' (ou 'CREDIT_CARD', 'PIX', 'BOLETO')
 * - Trial de 7 dias: primeira cobrança agendada para dataAtual + 7 dias (YYYY-MM-DD)
 * - Se cartão fornecido, cadastra no Asaas com cobrança postergada para o fim dos 7 dias gratuitos
 */
export async function createAsaasSubscription(
  input: AsaasSubscriptionInput
): Promise<{ id: string; invoiceUrl?: string; nextDueDate?: string; error?: string }> {
  const apiKey = getAsaasApiKey();
  const baseUrl = getAsaasBaseUrl();
  const valueToCharge = typeof input.value === 'number' ? input.value : ASAAS_MONTHLY_PRICE;
  const nextDueDate = input.nextDueDate || calculateTrialDueDate(new Date(), 7);
  const cycle = input.cycle || 'MONTHLY';
  const billingType =
    input.billingType || (input.creditCard || input.creditCardToken ? 'CREDIT_CARD' : 'UNDEFINED');

  if (!apiKey || apiKey.includes('exemplo')) {
    const mockSubId = 'sub_mock_' + Math.random().toString(36).substring(2, 12);
    return {
      id: mockSubId,
      invoiceUrl: `https://sandbox.asaas.com/s/${mockSubId}`,
      nextDueDate,
    };
  }

  try {
    const payload: Record<string, unknown> = {
      customer: input.customerId,
      billingType,
      value: valueToCharge,
      nextDueDate,
      cycle,
      description: input.description || 'Assinatura Recorrente Mensal Catálogo Digital NumClick (R$ 79,90)',
      externalReference: input.externalReference,
    };

    if (billingType === 'CREDIT_CARD') {
      if (input.creditCard) payload['creditCard'] = input.creditCard;
      if (input.creditCardHolderInfo) payload['creditCardHolderInfo'] = input.creditCardHolderInfo;
      if (input.creditCardToken) payload['creditCardToken'] = input.creditCardToken;
    }

    const res = await fetch(`${baseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: apiKey,
      },
      body: JSON.stringify(payload),
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
      nextDueDate: data.nextDueDate || nextDueDate,
    };
  } catch (err) {
    return { id: '', error: String(err) };
  }
}

/**
 * Validação de token de segurança do webhook enviado pelo Asaas
 */
export function verifyAsaasWebhookToken(tokenHeader: string | null): boolean {
  const secret = getAsaasWebhookSecret();
  if (!secret) {
    return true; // Se o lojista não configurou secret no .env, aceita requisição
  }
  return tokenHeader === secret;
}
