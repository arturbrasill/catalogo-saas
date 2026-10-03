import { NextRequest, NextResponse } from 'next/server';
import {
  createOrGetAsaasCustomer,
  createAsaasSubscription,
  getAsaasSubscriptionInvoice,
  calculateTrialDueDate,
  ASAAS_MONTHLY_PRICE,
  ASAAS_YEARLY_PRICE,
} from '@/lib/asaas';
import { findTenantAsync, updateTenantSubscriptionAsync } from '@/lib/tenantStore';

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const {
      cpfCnpj,
      plan,
      billingType,
      creditCard,
      creditCardHolderInfo,
      creditCardToken,
    } = body;

    // Resolução resiliente do identificador da loja (suporte a tenantId, slug, storeId, headers e cookies)
    const rawTenantIdentifier =
      body.tenantId ||
      body.slug ||
      body.storeId ||
      body.store_id ||
      body.tenant ||
      request.headers.get('x-tenant-id') ||
      request.headers.get('x-tenant') ||
      request.cookies.get('app_tenant')?.value ||
      request.nextUrl.searchParams.get('tenant') ||
      request.nextUrl.searchParams.get('tenantId');

    if (!rawTenantIdentifier || !String(rawTenantIdentifier).trim()) {
      return NextResponse.json(
        { success: false, error: 'Identificador da loja (tenantId) obrigatório.' },
        { status: 400 }
      );
    }

    const tenant = await findTenantAsync(String(rawTenantIdentifier).trim());
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Loja não encontrada.' },
        { status: 404 }
      );
    }

    const effectiveCpfCnpj = (cpfCnpj || tenant.cpfCnpj)?.replace(/\D/g, '');
    const isYearly = plan ? plan === 'yearly' : tenant.plan === 'yearly';
    const chargeValue = isYearly ? ASAAS_YEARLY_PRICE : ASAAS_MONTHLY_PRICE;
    const planDesc = isYearly ? 'Anual' : 'Mensal';
    const cycle = isYearly ? 'YEARLY' : 'MONTHLY';
    const chosenBillingType =
      billingType || (creditCard || creditCardToken ? 'CREDIT_CARD' : 'UNDEFINED');

    // 1. Reutilização de Assinatura Ativa (evita criação de faturas e clientes duplicados no Asaas)
    // Só reutiliza se o plano requisitado for compatível com a assinatura atual
    const isPlanMatch = !plan || (isYearly ? tenant.plan === 'yearly' : tenant.plan !== 'yearly');
    if (tenant.asaasSubscriptionId && isPlanMatch && !creditCard && !creditCardToken) {
      try {
        const existingInvoice = await getAsaasSubscriptionInvoice(tenant.asaasSubscriptionId);
        if (existingInvoice && existingInvoice.invoiceUrl) {
          // Sincroniza o link no cadastro da loja caso estivesse desatualizado
          if (tenant.asaasPaymentLink !== existingInvoice.invoiceUrl || cpfCnpj) {
            await updateTenantSubscriptionAsync({
              tenantId: tenant.tenantId,
              asaasPaymentLink: existingInvoice.invoiceUrl,
              cpfCnpj: cpfCnpj || tenant.cpfCnpj,
            });
          }

          return NextResponse.json({
            success: true,
            data: {
              subscriptionId: tenant.asaasSubscriptionId,
              paymentId: existingInvoice.id,
              invoiceUrl: existingInvoice.invoiceUrl,
              value: existingInvoice.value || chargeValue,
              nextDueDate: existingInvoice.dueDate || tenant.subscriptionExpiresAt,
              dueDate: existingInvoice.dueDate || tenant.subscriptionExpiresAt,
              cycle,
              billingType: chosenBillingType,
            },
          });
        }
      } catch (checkErr) {
        console.warn('Nota: Erro ao verificar fatura existente no Asaas:', checkErr);
      }
    }

    // 2. Cadastra ou recupera cliente no Asaas
    const customer = await createOrGetAsaasCustomer({
      name: tenant.name || tenant.tenantId,
      email: tenant.ownerEmail,
      mobilePhone: tenant.whatsapp,
      cpfCnpj: effectiveCpfCnpj,
      externalReference: tenant.tenantId,
    });

    if (!customer.id) {
      return NextResponse.json(
        { success: false, error: customer.error || 'Falha ao registrar cliente no Asaas.' },
        { status: 400 }
      );
    }

    // 3. Data da primeira cobrança (exatamente 7 dias de trial gratuito após cadastro)
    const nextDueDate = calculateTrialDueDate(new Date(), 7);

    // 4. Cria Assinatura Recorrente no Asaas
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

    // 5. Salva os dados de assinatura e faturamento no cadastro da loja
    await updateTenantSubscriptionAsync({
      tenantId: tenant.tenantId,
      asaasCustomerId: customer.id,
      asaasSubscriptionId: subscription.id,
      asaasPaymentLink: subscription.invoiceUrl,
      cpfCnpj: cpfCnpj || tenant.cpfCnpj,
      plan: isYearly ? 'yearly' : 'monthly',
    });

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        paymentId: (subscription as any).paymentId || subscription.id,
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
