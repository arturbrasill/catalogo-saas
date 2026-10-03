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

  const cleanCpfCnpj = input.cpfCnpj?.replace(/\D/g, '') || undefined;
  const cleanEmail = input.email?.trim().toLowerCase() || undefined;
  const extRef = input.externalReference?.trim() || undefined;

  try {
    const payload = {
      name: input.name.trim(),
      email: cleanEmail,
      phone: input.phone || undefined,
      mobilePhone: input.mobilePhone || input.phone || undefined,
      cpfCnpj: cleanCpfCnpj,
      externalReference: extRef,
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

      // Recuperação resiliente: Se o cliente já existir no Asaas (por CPF, externalReference ou e-mail),
      // busca o ID já cadastrado em vez de falhar
      if (
        cleanCpfCnpj ||
        extRef ||
        cleanEmail ||
        (errMsg && (errMsg.toLowerCase().includes('já pertence') || errMsg.toLowerCase().includes('já existe')))
      ) {
        try {
          const queries = [
            extRef ? `externalReference=${encodeURIComponent(extRef)}` : null,
            cleanCpfCnpj ? `cpfCnpj=${cleanCpfCnpj}` : null,
            cleanEmail ? `email=${encodeURIComponent(cleanEmail)}` : null,
          ].filter(Boolean);

          for (const query of queries) {
            const searchRes = await fetch(`${baseUrl}/customers?${query}`, {
              headers: {
                'Content-Type': 'application/json',
                access_token: apiKey,
              },
            });
            if (searchRes.ok) {
              const searchData = await searchRes.json();
              if (searchData.data && Array.isArray(searchData.data) && searchData.data.length > 0) {
                return { id: searchData.data[0].id, name: searchData.data[0].name || input.name };
              }
            }
          }
        } catch (searchErr) {
          console.warn('Nota: Erro na busca de recuperação de cliente Asaas:', searchErr);
        }
      }

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
): Promise<{ id: string; invoiceUrl?: string; paymentId?: string; nextDueDate?: string; error?: string }> {
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

    // Busca o primeiro pagamento gerado automaticamente pelo Asaas para esta assinatura
    let paymentInvoiceUrl = data.invoiceUrl;
    let paymentId: string | undefined = undefined;

    try {
      const paymentsRes = await fetch(`${baseUrl}/subscriptions/${data.id}/payments?limit=1`, {
        headers: {
          'Content-Type': 'application/json',
          access_token: apiKey,
        },
      });
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        if (paymentsData.data && Array.isArray(paymentsData.data) && paymentsData.data.length > 0) {
          const firstPay = paymentsData.data[0];
          paymentId = firstPay.id;
          paymentInvoiceUrl = firstPay.invoiceUrl || firstPay.bankSlipUrl;
        }
      }
    } catch (pErr) {
      console.warn('Nota: Erro ao buscar pagamentos da assinatura Asaas:', pErr);
    }

    const domainBase = getAsaasEnv() === 'production' ? 'https://www.asaas.com' : 'https://sandbox.asaas.com';
    const fallbackInvoice = paymentInvoiceUrl || (paymentId ? `${domainBase}/i/${paymentId}` : `${domainBase}/s/${data.id}`);

    return {
      id: data.id,
      invoiceUrl: fallbackInvoice,
      paymentId,
      nextDueDate: data.nextDueDate || nextDueDate,
    };
  } catch (err) {
    return { id: '', error: String(err) };
  }
}

/**
 * Busca todos os pagamentos vinculados a uma assinatura no Asaas
 */
export async function getAsaasSubscriptionPayments(
  subscriptionId: string
): Promise<Array<Record<string, any>>> {
  const apiKey = getAsaasApiKey();
  const baseUrl = getAsaasBaseUrl();

  if (!apiKey || apiKey.includes('exemplo')) {
    return [];
  }

  try {
    const res = await fetch(`${baseUrl}/subscriptions/${subscriptionId}/payments?limit=10`, {
      headers: {
        'Content-Type': 'application/json',
        access_token: apiKey,
      },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : [];
  } catch (err) {
    console.warn('Erro ao consultar pagamentos da assinatura Asaas:', err);
    return [];
  }
}

/**
 * Obtém a fatura pendente ativa (ou a mais recente) de uma assinatura para envio ao cliente
 */
export async function getAsaasSubscriptionInvoice(
  subscriptionId: string
): Promise<{ id: string; invoiceUrl: string; dueDate?: string; value?: number; status?: string } | null> {
  const payments = await getAsaasSubscriptionPayments(subscriptionId);
  if (!payments || payments.length === 0) return null;

  // Prioriza fatura pendente
  const pendingPayment = payments.find((p) => p.status === 'PENDING') || payments[0];
  if (!pendingPayment) return null;

  const domainBase = getAsaasEnv() === 'production' ? 'https://www.asaas.com' : 'https://sandbox.asaas.com';
  const invoiceUrl =
    pendingPayment.invoiceUrl ||
    pendingPayment.bankSlipUrl ||
    `${domainBase}/i/${pendingPayment.id}`;

  return {
    id: pendingPayment.id,
    invoiceUrl,
    dueDate: pendingPayment.dueDate,
    value: pendingPayment.value,
    status: pendingPayment.status,
  };
}

/**
 * Consulta os dados do QR Code PIX (chave copia e cola + imagem base64) de uma cobrança Asaas
 */
export async function getAsaasPaymentPix(paymentId: string): Promise<{
  success: boolean;
  encodedImage?: string;
  payload?: string;
  expirationDate?: string;
  error?: string;
}> {
  const apiKey = getAsaasApiKey();
  const baseUrl = getAsaasBaseUrl();

  if (!apiKey || apiKey.includes('exemplo')) {
    return {
      success: true,
      payload: '00020101021226800014br.gov.bcb.pix...',
      encodedImage: '',
    };
  }

  try {
    const res = await fetch(`${baseUrl}/payments/${paymentId}/pixQrCode`, {
      headers: {
        'Content-Type': 'application/json',
        access_token: apiKey,
      },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.errors?.[0]?.description || 'QR Code Pix não disponível.',
      };
    }

    return {
      success: true,
      encodedImage: data.encodedImage,
      payload: data.payload,
      expirationDate: data.expirationDate,
    };
  } catch (err) {
    return { success: false, error: String(err) };
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
