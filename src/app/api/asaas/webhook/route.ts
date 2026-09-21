import { NextRequest, NextResponse } from 'next/server';
import { verifyAsaasWebhookToken } from '@/lib/asaas';
import { findTenant, updateTenantSubscription } from '@/lib/tenantStore';
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
    const tenant = tenantIdentifier ? findTenant(tenantIdentifier) : null;

    if (!tenant) {
      console.warn(`Webhook Asaas: Loja não encontrada para externalReference "${tenantIdentifier}"`);
      return NextResponse.json({ success: true, message: 'Loja não vinculada.' });
    }

    // 1. Pagamento Confirmado ou Recebido -> Ativação e Renovação Automática (+30 dias)
    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      const currentExpiry = tenant.subscriptionExpiresAt
        ? new Date(tenant.subscriptionExpiresAt).getTime()
        : Date.now();
      const baseTime = Math.max(currentExpiry, Date.now());
      const newExpiry = new Date(baseTime + 30 * 24 * 60 * 60 * 1000).toISOString();

      updateTenantSubscription({
        tenantId: tenant.tenantId,
        plan: 'monthly',
        subscriptionStatus: 'active',
        subscriptionExpiresAt: newExpiry,
        asaasCustomerId: payment.customer,
        asaasPaymentLink: payment.invoiceUrl || tenant.asaasPaymentLink,
        notes: `Pagamento de R$ 129,90 confirmado via Asaas em ${new Date().toLocaleDateString('pt-BR')} (ID: ${payment.id})`,
      });

      return NextResponse.json({
        success: true,
        message: `Assinatura da loja ${tenant.name} ativada/renovada com sucesso até ${newExpiry}.`,
      });
    }

    // 2. Pagamento Vencido -> Cancela/Expira Acesso Automaticamente
    if (event === 'PAYMENT_OVERDUE') {
      updateTenantSubscription({
        tenantId: tenant.tenantId,
        subscriptionStatus: 'expired',
        notes: `Cobrança vencida no Asaas em ${new Date().toLocaleDateString('pt-BR')} (ID: ${payment.id})`,
      });

      return NextResponse.json({
        success: true,
        message: `Loja ${tenant.name} marcada como expirada por falta de pagamento.`,
      });
    }

    // 3. Assinatura Cancelada
    if (event === 'SUBSCRIPTION_CANCELLED' || event === 'PAYMENT_DELETED') {
      updateTenantSubscription({
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
