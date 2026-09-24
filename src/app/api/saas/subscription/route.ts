import { NextRequest, NextResponse } from 'next/server';
import { updateTenantSubscription, findTenant } from '@/lib/tenantStore';
import type { UpdateSubscriptionInput } from '@/types';

const MASTER_SECRET = process.env['SAAS_MASTER_KEY'] || 'master_saas_antigravity_2026';

function isAuthorized(request: NextRequest): boolean {
  const token = request.headers.get('x-saas-token') || request.cookies.get('saas_token')?.value;
  return token === MASTER_SECRET;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Acesso não autorizado.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { tenantId, daysToAdd } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Identificador do tenantId obrigatório.' },
        { status: 400 }
      );
    }

    const currentTenant = findTenant(tenantId);
    if (!currentTenant) {
      return NextResponse.json(
        { success: false, error: 'Loja não encontrada.' },
        { status: 404 }
      );
    }

    // Se solicitado adicionar dias (+30, +365, etc.)
    let newExpiresAt = body.subscriptionExpiresAt;
    if (typeof daysToAdd === 'number' && daysToAdd > 0) {
      const currentExpiry = currentTenant.subscriptionExpiresAt
        ? new Date(currentTenant.subscriptionExpiresAt).getTime()
        : Date.now();
      const baseTime = Math.max(currentExpiry, Date.now());
      newExpiresAt = new Date(baseTime + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
    }

    const input: UpdateSubscriptionInput = {
      tenantId,
      plan: body.plan,
      subscriptionStatus: body.subscriptionStatus || (daysToAdd ? 'active' : undefined),
      subscriptionExpiresAt: newExpiresAt,
      notes: body.notes,
      apiUrl: body.apiUrl,
      spreadsheetUrl: body.spreadsheetUrl,
      whatsapp: body.whatsapp,
      name: body.name,
      ownerEmail: body.ownerEmail,
    };

    const updated = updateTenantSubscription(input);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Falha ao atualizar assinatura: ' + String(error) },
      { status: 500 }
    );
  }
}
