import fs from 'fs';
import path from 'path';
import type {
  Tenant,
  TenantRegistry,
  CreateTenantInput,
  UpdateSubscriptionInput,
  SaasMetrics,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@/types';
import defaultTenants from './tenants.json';
import { getLocalEngine } from '@/backend/engine';
import {
  fetchAllTenantsFromSupabase,
  insertTenantIntoSupabase,
  updateTenantInSupabase,
} from '@/lib/supabase';

// Caminho para persistência local de novos tenants criados dinamicamente
const DYNAMIC_TENANTS_FILE = path.join(process.cwd(), 'src', 'lib', 'dynamicTenants.json');

// Registro mestre em memória com os tenants padrão pré-carregados
let inMemoryRegistry: TenantRegistry = { ...(defaultTenants as TenantRegistry) };

// Inicializa dados ricos nos tenants padrão (status, planos, validade, datas)
function initializeDefaultTenantDetails() {
  const now = new Date();
  const future30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const future1Year = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const past5Days = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();

  for (const [key, tenant] of Object.entries(inMemoryRegistry)) {
    if (!tenant.slug) {
      tenant.slug = tenant.tenantId.replace(/_/g, '-');
    }
    if (!tenant.createdAt) {
      tenant.createdAt = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (!tenant.whatsapp) {
      tenant.whatsapp = '5511999999999';
    }

    if (tenant.tenantId === 'loja_exemplo') {
      tenant.plan = 'monthly';
      tenant.subscriptionStatus = 'active';
      tenant.subscriptionExpiresAt = future30Days;
      tenant.spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/1ExemploSpreadsheetID/edit';
      tenant.notes = 'Loja de demonstração oficial';
    } else if (tenant.tenantId === 'moda_style') {
      tenant.plan = 'monthly';
      tenant.subscriptionStatus = 'active';
      tenant.subscriptionExpiresAt = future30Days;
      tenant.spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/1ModaStyleSpreadsheetID/edit';
    } else if (tenant.tenantId === 'calcados_express') {
      tenant.plan = 'trial_30d';
      tenant.subscriptionStatus = 'expired';
      tenant.subscriptionExpiresAt = past5Days;
      tenant.spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/1CalcadosSpreadsheetID/edit';
      tenant.notes = 'Período de teste de 30 dias finalizado';
    } else {
      tenant.plan = 'monthly';
      tenant.subscriptionStatus = 'active';
      tenant.subscriptionExpiresAt = future30Days;
    }
  }
}

initializeDefaultTenantDetails();

// ------------------------------------------------------------
// CONECTOR DE PERSISTÊNCIA DURADOURA (SERVERLESS KV & LOCAL)
// ------------------------------------------------------------

export function getKvConfig(): { url: string; token: string } | null {
  const url = process.env['KV_REST_API_URL'] || process.env['UPSTASH_REDIS_REST_URL'];
  const token = process.env['KV_REST_API_TOKEN'] || process.env['UPSTASH_REDIS_REST_TOKEN'];
  if (url && token) {
    return { url: url.replace(/\/$/, ''), token };
  }
  return null;
}

export function getMasterProvisionerUrl(): string | null {
  const url = process.env['GOOGLE_MASTER_PROVISIONER_URL'];
  return url && url.trim() ? url.trim() : null;
}

let cachedMasterSheetUrl: string | null = null;

export function getCachedMasterSheetUrl(): string | null {
  return cachedMasterSheetUrl;
}

/**
 * Sincroniza o registro em memória com a nuvem (Planilha Mestre Google Drive e/ou Vercel KV / Upstash)
 */
export async function syncTenantsFromRemote(): Promise<boolean> {
  let synced = false;

  // 1. Sincroniza com Supabase (Banco de Dados Oficial do SaaS)
  try {
    const supabaseTenants = await fetchAllTenantsFromSupabase();
    if (supabaseTenants && supabaseTenants.length > 0) {
      for (const t of supabaseTenants) {
        if (t.tenantId) {
          const domain = t.domain || `${t.slug || t.tenantId}.localhost`;
          const tenantObj: Tenant = {
            tenantId: t.tenantId,
            name: t.name,
            slug: t.slug || t.tenantId.replace(/_/g, '-'),
            domain,
            apiUrl: t.apiUrl || '',
            whatsapp: t.whatsapp || '',
            ownerEmail: t.ownerEmail || '',
            niche: t.niche || 'Geral',
            plan: t.plan || 'trial_30d',
            subscriptionStatus: t.subscriptionStatus || 'active',
            subscriptionExpiresAt: t.subscriptionExpiresAt,
            createdAt: t.createdAt,
            notes: t.notes,
            asaasCustomerId: t.asaasCustomerId,
            asaasSubscriptionId: t.asaasSubscriptionId,
            asaasPaymentLink: t.asaasPaymentLink,
          };
          inMemoryRegistry[domain] = tenantObj;
          if (t.slug) inMemoryRegistry[t.slug] = tenantObj;
          inMemoryRegistry[t.tenantId] = tenantObj;
        }
      }
      synced = true;
    }
  } catch (err) {
    console.warn('Nota: Não foi possível sincronizar com o Supabase:', err);
  }

  // 2. Sincroniza com Google Apps Script Master Provisioner (Fallback)
  const provisionerUrl = getMasterProvisionerUrl();
  if (provisionerUrl) {
    try {
      const res = await fetch(`${provisionerUrl}?action=listStores`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.masterSheetUrl) {
          cachedMasterSheetUrl = json.masterSheetUrl;
        }
        if (json.success && Array.isArray(json.stores)) {
          for (const s of json.stores) {
            if (s.tenantId) {
              const domain = s.domain || `${s.slug || s.tenantId}.localhost`;
              const tenantObj: Tenant = {
                tenantId: s.tenantId,
                name: s.name || s.storeName,
                slug: s.slug || s.tenantId.replace(/_/g, '-'),
                domain,
                apiUrl: s.apiUrl || '',
                whatsapp: s.whatsapp || '',
                ownerEmail: s.ownerEmail || '',
                niche: s.niche || 'Geral',
                plan: s.plan || 'trial_30d',
                subscriptionStatus: s.subscriptionStatus || 'active',
                subscriptionExpiresAt: s.subscriptionExpiresAt,
                createdAt: s.createdAt,
                spreadsheetId: s.spreadsheetId,
                spreadsheetUrl: s.spreadsheetUrl,
              };
              inMemoryRegistry[domain] = tenantObj;
              if (s.slug) inMemoryRegistry[s.slug] = tenantObj;
              inMemoryRegistry[s.tenantId] = tenantObj;
            }
          }
          synced = true;
        }
      }
    } catch (err) {
      console.warn('Nota: Não foi possível sincronizar com o Master Provisioner Google:', err);
    }
  }

  // 2. Sincroniza com Vercel KV / Upstash Redis
  const kv = getKvConfig();
  if (kv) {
    try {
      const res = await fetch(`${kv.url}/get/saas_tenants_registry`, {
        headers: {
          Authorization: `Bearer ${kv.token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        let parsed: any = data.result;
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
          } catch {
            // ignore
          }
        }

        if (parsed && typeof parsed === 'object') {
          inMemoryRegistry = { ...inMemoryRegistry, ...parsed };
          synced = true;
        }
      }
    } catch (err) {
      console.warn('Falha na sincronização com KV:', err);
    }
  }

  return synced;
}

/**
 * Envia o registro de lojas para o banco KV remoto
 */
export async function syncTenantsToRemote(): Promise<boolean> {
  const kv = getKvConfig();
  if (!kv) return false;

  try {
    const dynamicOnly: TenantRegistry = {};
    for (const [key, tenant] of Object.entries(inMemoryRegistry)) {
      if (!(key in defaultTenants) || tenant.subscriptionStatus !== undefined) {
        dynamicOnly[key] = tenant;
      }
    }

    const res = await fetch(`${kv.url}/set/saas_tenants_registry`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kv.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.stringify(dynamicOnly)),
    });

    return res.ok;
  } catch (err) {
    console.warn('Falha ao persistir no KV:', err);
    return false;
  }
}

// Carrega tenants dinâmicos já persistidos (disco local e nuvem KV)
function loadPersistedTenants() {
  try {
    if (fs.existsSync(DYNAMIC_TENANTS_FILE)) {
      const data = fs.readFileSync(DYNAMIC_TENANTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        inMemoryRegistry = { ...inMemoryRegistry, ...parsed };
      }
    }
  } catch (err) {
    console.warn('Nota: Não foi possível carregar dynamicTenants.json:', err);
  }

  const kv = getKvConfig();
  if (kv) {
    syncTenantsFromRemote().catch(() => {});
  }
}

loadPersistedTenants();

// Salva tenants criados dinamicamente em disco e no KV remoto
function persistDynamicTenants() {
  const dynamicOnly: TenantRegistry = {};
  for (const [key, tenant] of Object.entries(inMemoryRegistry)) {
    if (!(key in defaultTenants) || tenant.subscriptionStatus !== undefined) {
      dynamicOnly[key] = tenant;
    }
  }

  try {
    fs.writeFileSync(DYNAMIC_TENANTS_FILE, JSON.stringify(dynamicOnly, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Nota: Persistência em disco ignorada em ambiente read-only:', err);
  }

  const kv = getKvConfig();
  if (kv) {
    syncTenantsToRemote().catch(() => {});
  }
}

/**
 * Normaliza um slug gerado a partir do nome
 */
export function slugify(text: string): string {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Retorna todo o registro atualizado de tenants
 */
export function getTenantRegistry(): TenantRegistry {
  return inMemoryRegistry;
}

/**
 * Encontra um tenant por hostname, domínio, slug ou tenantId
 */
export function findTenant(identifier: string): Tenant | null {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();

  // 1. Busca direta por chave
  if (inMemoryRegistry[clean]) {
    return inMemoryRegistry[clean]!;
  }

  // 2. Busca por tenantId, slug ou domain
  for (const tenant of Object.values(inMemoryRegistry)) {
    if (
      tenant.tenantId.toLowerCase() === clean ||
      tenant.slug?.toLowerCase() === clean ||
      tenant.domain?.toLowerCase() === clean
    ) {
      return tenant;
    }
  }

  return null;
}

/**
 * Verifica se a assinatura da loja está ativa e dentro da validade
 */
export function isTenantActive(tenant: Tenant): {
  active: boolean;
  reason?: 'expired' | 'blocked' | 'cancelled';
  daysRemaining: number;
} {
  if (tenant.subscriptionStatus === 'blocked') {
    return { active: false, reason: 'blocked', daysRemaining: 0 };
  }
  if (tenant.subscriptionStatus === 'cancelled') {
    return { active: false, reason: 'cancelled', daysRemaining: 0 };
  }

  if (tenant.subscriptionExpiresAt) {
    const expires = new Date(tenant.subscriptionExpiresAt).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { active: false, reason: 'expired', daysRemaining: diffDays };
    }
    return { active: true, daysRemaining: diffDays };
  }

  // Se não tiver data definida, considera ativo
  return { active: true, daysRemaining: 999 };
}

/**
 * Cria e configura automaticamente uma nova loja (Auto-Provisioning)
 * - Cria a estrutura de banco de dados
 * - Gera a planilha no Google Sheets (real ou em nuvem integrada)
 * - Configura senhas, temas e abas
 * - Registra no multi-tenant
 */
export async function registerTenant(input: CreateTenantInput): Promise<{
  tenant: Tenant;
  spreadsheetUrl: string;
  spreadsheetId: string;
}> {
  const baseSlug = slugify(input.slug || input.name);
  let tenantId = baseSlug.replace(/-/g, '_');

  // Garante identificador único caso já exista
  let counter = 1;
  while (findTenant(tenantId)) {
    tenantId = `${baseSlug}_${counter}`.replace(/-/g, '_');
    counter++;
  }

  const finalSlug = tenantId.replace(/_/g, '-');
  const now = new Date();
  const plan: SubscriptionPlan = input.plan || 'trial_30d';

  // 30 dias de teste grátis ou 30 dias da mensalidade
  const durationDays = 30;
  const status: SubscriptionStatus = plan === 'trial_30d' ? 'trial' : 'active';
  const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  // 1. Tenta auto-provisionar via Google Apps Script Master Provisioner (cria planilha real privada no Google Drive do dono)
  const provisionerUrl = getMasterProvisionerUrl();
  let generatedSheetId = '1sheet_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  let spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${generatedSheetId}/edit`;

  if (provisionerUrl) {
    try {
      const res = await fetch(provisionerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'provisionStore',
          storeName: input.name.trim(),
          tenantId,
          slug: finalSlug,
          whatsapp: String(input.whatsapp || '').replace(/\D/g, ''),
          ownerEmail: input.ownerEmail?.trim() || '',
          niche: input.niche || 'Geral',
          primaryColor: input.primaryColor || '#10b981',
          secondaryColor: input.secondaryColor || '#047857',
          password: input.password || 'admin123',
          plan,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.spreadsheetUrl) {
          spreadsheetUrl = json.spreadsheetUrl;
          if (json.spreadsheetId) generatedSheetId = json.spreadsheetId;
          if (json.masterSheetUrl) cachedMasterSheetUrl = json.masterSheetUrl;
        }
      }
    } catch (err) {
      console.warn('Nota: Provisionador Google inacessível, gerando fallback local:', err);
    }
  }

  // Cria o registro do Tenant
  const newTenant: Tenant = {
    tenantId,
    name: input.name.trim(),
    slug: finalSlug,
    domain: `${finalSlug}.localhost`,
    apiUrl: process.env['APPS_SCRIPT_URL'] || '',
    whatsapp: String(input.whatsapp || '').replace(/\D/g, ''),
    plan,
    subscriptionStatus: status,
    subscriptionExpiresAt: expiresAt,
    createdAt: now.toISOString(),
    ownerEmail: input.ownerEmail?.trim() || '',
    spreadsheetId: generatedSheetId,
    spreadsheetUrl,
    niche: input.niche || 'Geral',
    notes: `Loja criada automaticamente via Onboarding (${input.niche || 'Geral'})`,
  };

  // Inicializa o engine de dados da loja com seus dados iniciais e senha
  const passwordToUse = input.password || 'admin123';
  const engine = getLocalEngine(tenantId);
  const passwordHash = engine.hashPassword(passwordToUse);

  engine.initDatabase({
    store_id: tenantId,
    store_name: input.name.trim(),
    whatsapp: String(input.whatsapp || '').replace(/\D/g, ''),
    primary_color: input.primaryColor || '#10b981',
    secondary_color: input.secondaryColor || '#047857',
    background_color: input.backgroundColor || '#f8fafc',
    text_color: input.textColor || '#0f172a',
    admin_password_hash: passwordHash,
    domain: newTenant.domain,
  });

  // Salva no registro em memória e persiste
  inMemoryRegistry[newTenant.domain!] = newTenant;
  inMemoryRegistry[finalSlug] = newTenant;
  inMemoryRegistry[tenantId] = newTenant;

  persistDynamicTenants();

  // Persiste no Supabase (Banco de Dados Oficial)
  try {
    await insertTenantIntoSupabase(input, tenantId, finalSlug);
  } catch (err) {
    console.warn('Nota: Falha ao inserir tenant no Supabase:', err);
  }

  return {
    tenant: newTenant,
    spreadsheetUrl,
    spreadsheetId: generatedSheetId,
  };
}

/**
 * Atualiza plano, status de assinatura ou validade de uma loja
 */
export function updateTenantSubscription(input: UpdateSubscriptionInput): Tenant | null {
  const tenant = findTenant(input.tenantId);
  if (!tenant) return null;

  if (input.plan) tenant.plan = input.plan;
  if (input.subscriptionStatus) tenant.subscriptionStatus = input.subscriptionStatus;
  if (input.subscriptionExpiresAt) tenant.subscriptionExpiresAt = input.subscriptionExpiresAt;
  if (input.notes !== undefined) tenant.notes = input.notes;
  if (input.apiUrl !== undefined) tenant.apiUrl = input.apiUrl;
  if (input.spreadsheetUrl !== undefined) tenant.spreadsheetUrl = input.spreadsheetUrl;
  if (input.whatsapp !== undefined) tenant.whatsapp = String(input.whatsapp || '').replace(/\D/g, '');
  if (input.name !== undefined) tenant.name = input.name.trim();
  if (input.ownerEmail !== undefined) tenant.ownerEmail = input.ownerEmail.trim();
  if (input.asaasCustomerId !== undefined) tenant.asaasCustomerId = input.asaasCustomerId;
  if (input.asaasSubscriptionId !== undefined) tenant.asaasSubscriptionId = input.asaasSubscriptionId;
  if (input.asaasPaymentLink !== undefined) tenant.asaasPaymentLink = input.asaasPaymentLink;

  // Atualiza referências no registro
  for (const [key, t] of Object.entries(inMemoryRegistry)) {
    if (t.tenantId === tenant.tenantId) {
      inMemoryRegistry[key] = { ...tenant };
    }
  }

  persistDynamicTenants();

  // Sincroniza atualização no Supabase
  try {
    updateTenantInSupabase(input).catch((err) => {
      console.warn('Nota: Falha ao atualizar tenant no Supabase:', err);
    });
  } catch (err) {
    console.warn('Nota: Erro ao despachar update para Supabase:', err);
  }

  return tenant;
}

/**
 * Calcula métricas do SaaS em tempo real
 */
export function getSaasMetrics(): SaasMetrics {
  const uniqueTenants = new Map<string, Tenant>();
  for (const t of Object.values(inMemoryRegistry)) {
    uniqueTenants.set(t.tenantId, t);
  }

  let totalStores = 0;
  let activeStores = 0;
  let trialStores = 0;
  let expiredOrBlockedStores = 0;
  let estimatedMonthlyRevenue = 0;

  for (const tenant of uniqueTenants.values()) {
    totalStores++;
    const status = isTenantActive(tenant);

    if (!status.active) {
      expiredOrBlockedStores++;
    } else if (tenant.plan === 'trial_30d') {
      trialStores++;
    } else {
      activeStores++;
      if (tenant.plan === 'monthly') {
        estimatedMonthlyRevenue += 129.9; // Plano mensal oficial R$ 129,90
      } else if (tenant.plan === 'yearly') {
        estimatedMonthlyRevenue += 99.9; // Plano anual proporcional R$ 99,90/mês
      }
    }
  }

  return {
    totalStores,
    activeStores,
    trialStores,
    expiredOrBlockedStores,
    estimatedMonthlyRevenue: Math.round(estimatedMonthlyRevenue * 100) / 100,
  };
}

/**
 * Reseta o registro para o estado padrão (útil para suítes de testes isoladas)
 */
export function resetDynamicTenants(): void {
  inMemoryRegistry = { ...(defaultTenants as TenantRegistry) };
  initializeDefaultTenantDetails();
  try {
    if (fs.existsSync(DYNAMIC_TENANTS_FILE)) {
      fs.unlinkSync(DYNAMIC_TENANTS_FILE);
    }
  } catch {
    // ignore
  }
}
