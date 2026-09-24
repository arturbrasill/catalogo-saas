import { NextRequest, NextResponse } from 'next/server';
import {
  getTenantRegistry,
  registerTenant,
  deleteTenant,
  getSaasMetrics,
  findTenant,
  syncTenantsFromRemote,
  getCachedMasterSheetUrl,
  getMasterProvisionerUrl,
} from '@/lib/tenantStore';
import type { CreateTenantInput } from '@/types';

// Senha mestra do SuperAdmin SaaS para proteger endpoints
const MASTER_SECRET = process.env['SAAS_MASTER_KEY'] || 'master_saas_antigravity_2026';

function isAuthorized(request: NextRequest): boolean {
  const token = request.headers.get('x-saas-token') || request.cookies.get('saas_token')?.value;
  return token === MASTER_SECRET;
}

export async function GET(request: NextRequest) {
  // Lista de lojas protegida para o painel SuperAdmin
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Acesso não autorizado ao painel SaaS Master.' },
      { status: 401 }
    );
  }

  // Sincroniza dados da nuvem em tempo real (Google Sheets Master e/ou Vercel KV)
  try {
    await syncTenantsFromRemote();
  } catch (err) {
    console.warn('Nota: Erro ao sincronizar lojas remotas em GET /api/saas/stores:', err);
  }

  const registry = getTenantRegistry();
  const stores = Object.values(registry);
  const metrics = getSaasMetrics();
  const masterSheetUrl = getCachedMasterSheetUrl();
  const hasGoogleProvisioner = Boolean(getMasterProvisionerUrl());

  // Remove dados duplicados por chaves diferentes (mantém um por tenantId)
  const uniqueStoresMap = new Map();
  for (const store of stores) {
    if (!uniqueStoresMap.has(store.tenantId)) {
      uniqueStoresMap.set(store.tenantId, store);
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      stores: Array.from(uniqueStoresMap.values()),
      metrics,
      masterSheetUrl,
      hasGoogleProvisioner,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<CreateTenantInput>;

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: 'O nome da loja é obrigatório.' },
        { status: 400 }
      );
    }

    if (!body.whatsapp || !String(body.whatsapp).replace(/\D/g, '')) {
      return NextResponse.json(
        { success: false, error: 'O WhatsApp da loja é obrigatório.' },
        { status: 400 }
      );
    }

    const input: CreateTenantInput = {
      name: body.name.trim(),
      slug: body.slug ? body.slug.trim() : body.name.trim(),
      whatsapp: String(body.whatsapp).replace(/\D/g, ''),
      ownerEmail: body.ownerEmail?.trim(),
      password: body.password || 'admin123',
      plan: body.plan || 'trial_30d',
      primaryColor: body.primaryColor || '#10b981',
      secondaryColor: body.secondaryColor || '#047857',
      backgroundColor: body.backgroundColor || '#f8fafc',
      textColor: body.textColor || '#0f172a',
      niche: body.niche || 'Geral',
    };

    // Auto-provisiona a loja e sua planilha no Google Sheets
    const result = await registerTenant(input);

    return NextResponse.json({
      success: true,
      data: {
        tenant: result.tenant,
        spreadsheetUrl: result.spreadsheetUrl,
        spreadsheetId: result.spreadsheetId,
        catalogUrl: `/?tenant=${result.tenant.slug}`,
        adminUrl: `/admin/login?tenant=${result.tenant.slug}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Falha ao criar loja: ' + String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Acesso não autorizado ao painel SaaS Master.' },
      { status: 401 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    let tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      try {
        const body = await request.json();
        tenantId = body?.tenantId;
      } catch {
        // body opcional se passado via query string
      }
    }

    if (!tenantId || !tenantId.trim()) {
      return NextResponse.json(
        { success: false, error: 'O identificador da loja (tenantId) é obrigatório.' },
        { status: 400 }
      );
    }

    await deleteTenant(tenantId.trim());

    return NextResponse.json({
      success: true,
      data: { tenantId: tenantId.trim(), deleted: true },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Falha ao excluir loja: ' + String(error) },
      { status: 500 }
    );
  }
}
