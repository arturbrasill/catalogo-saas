import { NextRequest, NextResponse } from 'next/server';
import {
  createOrGetAsaasCustomer,
  createAsaasPayment,
  ASAAS_MONTHLY_PRICE,
} from '@/lib/asaas';
import { findTenant, updateTenantSubscription } from '@/lib/tenantStore';

export async function POST(request: NextRequest) {
  try {
    const { tenantId, cpfCnpj } = await request.json();

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Identificador da loja (tenantId) obrigatório.' },
        { status: 400 }
      );
    }

    const tenant = findTenant(tenantId);
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Loja não encontrada.' },
        { status: 404 }
      );
    }

    // 1. Cadastra ou recupera cliente no Asaas
    const customer = await createOrGetAsaasCustomer({
      name: tenant.name || tenant.tenantId,
      email: tenant.ownerEmail,
      mobilePhone: tenant.whatsapp,
      cpfCnpj: cpfCnpj?.replace(/\D/g, ''),
      externalReference: tenant.tenantId,
    });

    if (!customer.id) {
      return NextResponse.json(
        { success: false, error: customer.error || 'Falha ao registrar cliente no Asaas.' },
        { status: 400 }
      );
    }

    // 2. Data de vencimento da fatura (3 dias a partir de hoje)
    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .substring(0, 10);

    // 3. Cria cobrança no Asaas de R$ 129,90
    const payment = await createAsaasPayment({
      customer: customer.id,
      billingType: 'UNDEFINED', // Permite PIX, Cartão e Boleto na mesma fatura
      value: ASAAS_MONTHLY_PRICE,
      dueDate,
      description: `Assinatura Mensal Catálogo Digital — Loja ${tenant.name}`,
      externalReference: tenant.tenantId,
    });

    if (!payment.invoiceUrl) {
      return NextResponse.json(
        { success: false, error: payment.error || 'Falha ao gerar cobrança no Asaas.' },
        { status: 400 }
      );
    }

    // Salva o link de pagamento gerado na loja
    updateTenantSubscription({
      tenantId: tenant.tenantId,
      asaasCustomerId: customer.id,
      asaasPaymentLink: payment.invoiceUrl,
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        invoiceUrl: payment.invoiceUrl,
        value: ASAAS_MONTHLY_PRICE,
        dueDate,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar fatura: ' + String(err) },
      { status: 500 }
    );
  }
}
