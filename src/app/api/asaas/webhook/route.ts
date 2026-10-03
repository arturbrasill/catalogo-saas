import { NextRequest, NextResponse } from 'next/server';
import { verifyAsaasWebhookToken } from '@/lib/asaas';
import { findTenantAsync, updateTenantSubscriptionAsync } from '@/lib/tenantStore';
import type { AsaasWebhookEvent } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const tokenHeader = request.headers.get('asaas-access-token');

    // Validação do token de segurança do webhook
    if (!verifyAsaasWebhookToken(tokenHeader)) {
      return NextResponse.json(
        { success: false, error: 'Token de webhook inválido.' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as AsaasWebhookEvent;
    const { event, payment } = body;

    if (!payment) {
      return NextResponse.json({ success: true, message: 'Evento ignorado sem payload de pagamento.' });
    }

    const tenantIdentifier = payment.externalReference;
    const tenant = tenantIdentifier ? await findTenantAsync(tenantIdentifier) : null;

    if (!tenant) {
      console.warn(`Webhook Asaas: Loja não encontrada para externalReference "${tenantIdentifier}"`);
      return NextResponse.json({ success: true, message: 'Loja não vinculada.' });
    }

    // 1. Pagamento Confirmado ou Recebido -> Status ATIVO e Renovação Automática (+30 dias)
    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      const currentExpiry = tenant.subscriptionExpiresAt
        ? new Date(tenant.subscriptionExpiresAt).getTime()
        : Date.now();
      const baseTime = Math.max(currentExpiry, Date.now());
      const newExpiry = new Date(baseTime + 30 * 24 * 60 * 60 * 1000).toISOString();

      await updateTenantSubscriptionAsync({
        tenantId: tenant.tenantId,
        plan: 'monthly',
        subscriptionStatus: 'active',
        subscriptionExpiresAt: newExpiry,
        asaasCustomerId: payment.customer,
        asaasPaymentLink: payment.invoiceUrl || tenant.asaasPaymentLink,
        pendingPayment: false,
        notes: `Pagamento de R$ 79,90 confirmado via Asaas em ${new Date().toLocaleDateString('pt-BR')} (ID: ${payment.id}). Status mantido como ATIVO.`,
      });

      return NextResponse.json({
        success: true,
        message: `Assinatura da loja ${tenant.name} mantida como ATIVO até ${newExpiry}.`,
      });
    }

    // 2. Pagamento Vencido após os 7 dias de trial -> Bloqueio e Aviso de Pagamento Pendente
    if (event === 'PAYMENT_OVERDUE') {
      await updateTenantSubscriptionAsync({
        tenantId: tenant.tenantId,
        subscriptionStatus: 'blocked',
        pendingPayment: true,
        asaasPaymentLink: payment.invoiceUrl || tenant.asaasPaymentLink,
        notes: `Cobrança de R$ 79,90 vencida após os 7 dias de degustação no Asaas em ${new Date().toLocaleDateString('pt-BR')} (ID: ${payment.id}). Loja bloqueada com aviso de pagamento pendente.`,
      });

      return NextResponse.json({
        success: true,
        message: `Loja ${tenant.name} marcada para bloqueio por falta de pagamento (Cobrança pós-trial vencida).`,
      });
    }

    // 3. Assinatura Cancelada
    if (event === 'SUBSCRIPTION_CANCELLED' || event === 'PAYMENT_DELETED') {
      await updateTenantSubscriptionAsync({
        tenantId: tenant.tenantId,
        subscriptionStatus: 'cancelled',
        notes: `Assinatura cancelada no Asaas em ${new Date().toLocaleDateString('pt-BR')}`,
      });

      return NextResponse.json({
        success: true,
        message: `Loja ${tenant.name} cancelada no Asaas.`,
      });
    }

    return NextResponse.json({ success: true, message: `Evento ${event} registrado.` });
  } catch (err) {
    console.error('Erro ao processar webhook do Asaas:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno: ' + String(err) },
      { status: 500 }
    );
  }
}
