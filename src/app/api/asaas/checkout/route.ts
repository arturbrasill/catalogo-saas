import { NextRequest, NextResponse } from 'next/server';
import {
  createOrGetAsaasCustomer,
  createAsaasSubscription,
  calculateTrialDueDate,
  ASAAS_MONTHLY_PRICE,
  ASAAS_YEARLY_PRICE,
} from '@/lib/asaas';
import { findTenant, updateTenantSubscription } from '@/lib/tenantStore';

export async function POST(request: NextRequest) {
  try {
    const {
      tenantId,
      cpfCnpj,
      plan,
      billingType,
      creditCard,
      creditCardHolderInfo,
      creditCardToken,
    } = await request.json();

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

    // 2. Data da primeira cobrança (exatamente 7 dias de trial gratuito após cadastro)
    const nextDueDate = calculateTrialDueDate(new Date(), 7);

    const isYearly = plan === 'yearly' || tenant.plan === 'yearly';
    const chargeValue = isYearly ? ASAAS_YEARLY_PRICE : ASAAS_MONTHLY_PRICE;
    const planDesc = isYearly ? 'Anual' : 'Mensal';
    const cycle = isYearly ? 'YEARLY' : 'MONTHLY';
    const chosenBillingType =
      billingType || (creditCard || creditCardToken ? 'CREDIT_CARD' : 'UNDEFINED');

    // 3. Cria Assinatura Recorrente no Asaas
    // Se o cartão for informado no onboarding, a primeira cobrança é agendada para após os 7 dias
    const subscription = await createAsaasSubscription({
      customerId: customer.id,
      billingType: chosenBillingType,
      value: chargeValue,
      nextDueDate,
      cycle,
      description: `Assinatura Recorrente ${planDesc} NumClick — Loja ${tenant.name}`,
      externalReference: tenant.tenantId,
      creditCard,
      creditCardHolderInfo,
      creditCardToken,
    });

    if (!subscription.id || !subscription.invoiceUrl) {
      return NextResponse.json(
        { success: false, error: subscription.error || 'Falha ao gerar assinatura no Asaas.' },
        { status: 400 }
      );
    }

    // 4. Salva os dados de assinatura e faturamento no cadastro da loja
    updateTenantSubscription({
      tenantId: tenant.tenantId,
      asaasCustomerId: customer.id,
      asaasSubscriptionId: subscription.id,
      asaasPaymentLink: subscription.invoiceUrl,
      plan: isYearly ? 'yearly' : 'monthly',
    });

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        paymentId: subscription.id,
        invoiceUrl: subscription.invoiceUrl,
        value: chargeValue,
        nextDueDate,
        dueDate: nextDueDate,
        cycle,
        billingType: chosenBillingType,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar fatura/assinatura: ' + String(err) },
      { status: 500 }
    );
  }
}
