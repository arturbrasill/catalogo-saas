-- ============================================================
-- SCHEMA SUPABASE: SAAS CATÁLOGO DIGITAL MULTI-TENANT
-- ============================================================
-- Execute este script no SQL Editor do seu projeto Supabase.
-- Ele cria todas as tabelas com integridade referencial,
-- índices para alta velocidade, gatilhos de sincronização automática
-- de telefone/nome e dados iniciais (seed).
-- ============================================================

-- 1. TABELA DE TENANTS (LOJISTAS DO SAAS)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT,
  whatsapp TEXT NOT NULL,
  owner_email TEXT,
  password_hash TEXT,
  api_token TEXT,
  plan TEXT NOT NULL DEFAULT 'trial_30d',
  subscription_status TEXT NOT NULL DEFAULT 'active',
  subscription_expires_at TIMESTAMPTZ,
  notes TEXT,
  niche TEXT DEFAULT 'Geral',
  asaas_customer_id TEXT,
  asaas_subscription_id TEXT,
  asaas_payment_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABELA DE CONFIGURAÇÕES DA LOJA (IDENTIDADE & TEMA)
CREATE TABLE IF NOT EXISTS public.store_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#10b981',
  secondary_color TEXT NOT NULL DEFAULT '#047857',
  background_color TEXT NOT NULL DEFAULT '#f8fafc',
  text_color TEXT NOT NULL DEFAULT '#0f172a',
  banners JSONB NOT NULL DEFAULT '[]'::jsonb,
  whatsapp TEXT NOT NULL,
  domain TEXT,
  currency TEXT NOT NULL DEFAULT 'BRL',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  is_open BOOLEAN NOT NULL DEFAULT true,
  business_hours TEXT,
  pix_key TEXT,
  pix_key_type TEXT DEFAULT 'cpf',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL,
  preco NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  preco_promocional NUMERIC(10, 2),
  categoria_id TEXT,
  descricao TEXT,
  imagens JSONB NOT NULL DEFAULT '[]'::jsonb,
  em_estoque BOOLEAN NOT NULL DEFAULT true,
  destaque BOOLEAN NOT NULL DEFAULT false,
  ordem INTEGER NOT NULL DEFAULT 0,
  variacoes JSONB NOT NULL DEFAULT '[]'::jsonb,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 5. TABELA DE CUPONS DE DESCONTO
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'percentage',
  valor NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  valor_minimo NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  ativo BOOLEAN NOT NULL DEFAULT true,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ÍNDICES DE ALTA PERFORMANCE PARA MULTI-TENANCY
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON public.tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(subscription_status);

CREATE INDEX IF NOT EXISTS idx_categories_tenant ON public.categories(tenant_id, ativo);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON public.products(tenant_id, ativo);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(tenant_id, categoria_id);
CREATE INDEX IF NOT EXISTS idx_coupons_tenant ON public.coupons(tenant_id, ativo);

-- ============================================================
-- TRIGGERS DE SINCRONIZAÇÃO AUTOMÁTICA (TELEFONE E NOME)
-- Garante que qualquer alteração de WhatsApp ou Nome feita
-- no painel do lojista reflita instantaneamente no painel mestre,
-- e vice-versa!
-- ============================================================

CREATE OR REPLACE FUNCTION sync_store_config_to_tenant()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tenants
  SET 
    whatsapp = NEW.whatsapp,
    name = NEW.store_name,
    updated_at = now()
  WHERE tenant_id = NEW.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_store_config_to_tenant ON public.store_configs;
CREATE TRIGGER trg_sync_store_config_to_tenant
AFTER INSERT OR UPDATE OF whatsapp, store_name ON public.store_configs
FOR EACH ROW
EXECUTE FUNCTION sync_store_config_to_tenant();

CREATE OR REPLACE FUNCTION sync_tenant_to_store_config()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.store_configs
  SET 
    whatsapp = NEW.whatsapp,
    store_name = NEW.name,
    updated_at = now()
  WHERE tenant_id = NEW.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_tenant_to_store_config ON public.tenants;
CREATE TRIGGER trg_sync_tenant_to_store_config
AFTER UPDATE OF whatsapp, name ON public.tenants
FOR EACH ROW
WHEN (pg_trigger_depth() = 0)
EXECUTE FUNCTION sync_tenant_to_store_config();

-- ============================================================
-- POLÍTICAS DE ACESSO (ROW LEVEL SECURITY - RLS)
-- Permite leitura anônima para catálogo público e escrita com anon/service_role
-- ============================================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Políticas públicas de leitura para a vitrine
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read tenants') THEN
    CREATE POLICY "Allow public read tenants" ON public.tenants FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read configs') THEN
    CREATE POLICY "Allow public read configs" ON public.store_configs FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read categories') THEN
    CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read products') THEN
    CREATE POLICY "Allow public read products" ON public.products FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read coupons') THEN
    CREATE POLICY "Allow public read coupons" ON public.coupons FOR SELECT USING (true);
  END IF;

  -- Políticas de escrita e gerenciamento
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all ops tenants') THEN
    CREATE POLICY "Allow all ops tenants" ON public.tenants FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all ops configs') THEN
    CREATE POLICY "Allow all ops configs" ON public.store_configs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all ops categories') THEN
    CREATE POLICY "Allow all ops categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all ops products') THEN
    CREATE POLICY "Allow all ops products" ON public.products FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all ops coupons') THEN
    CREATE POLICY "Allow all ops coupons" ON public.coupons FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- SEED INICIAL (TENANTS PADRÃO)
-- ============================================================
INSERT INTO public.tenants (tenant_id, name, slug, domain, whatsapp, plan, subscription_status, subscription_expires_at, notes, password_hash, api_token)
VALUES 
(
  'loja_exemplo', 
  'Minha Loja Digital', 
  'loja-exemplo', 
  'loja-exemplo.localhost', 
  '5511999999999', 
  'monthly', 
  'active', 
  now() + interval '30 days', 
  'Loja Oficial de Demonstração',
  -- SHA256('CATALOGO_SAAS_SALT_v1_admin123')
  'bcf909d3b0e1a1795ad18ff3945cf4076326c92983794fdb19b5bf08d5aa879f',
  'tok_mock_default_1234567890'
)
ON CONFLICT (tenant_id) DO UPDATE 
SET name = EXCLUDED.name, whatsapp = EXCLUDED.whatsapp;

INSERT INTO public.store_configs (tenant_id, store_name, logo_url, primary_color, secondary_color, background_color, text_color, banners, whatsapp, domain, is_open, business_hours, pix_key, pix_key_type)
VALUES (
  'loja_exemplo',
  'Minha Loja Digital',
  'https://images.unsplash.com/photo-example.jpg',
  '#10b981',
  '#047857',
  '#f8fafc',
  '#0f172a',
  '[]'::jsonb,
  '5511999999999',
  'loja-exemplo.com.br',
  true,
  'Seg a Sex: 08:00 às 18:00',
  'contato@lojadigital.com',
  'email'
)
ON CONFLICT (tenant_id) DO UPDATE 
SET store_name = EXCLUDED.store_name, whatsapp = EXCLUDED.whatsapp;

INSERT INTO public.categories (id, tenant_id, nome, slug, ativo, ordem)
VALUES 
  ('cat_geral', 'loja_exemplo', 'Geral', 'geral', true, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.coupons (id, tenant_id, codigo, tipo, valor, valor_minimo, ativo, descricao)
VALUES 
  ('coup_bemvindo10', 'loja_exemplo', 'BEMVINDO10', 'percentage', 10, 50, true, '10% OFF para compras acima de R$ 50,00'),
  ('coup_desconto20', 'loja_exemplo', 'DESCONTO20', 'fixed', 20, 100, true, 'R$ 20,00 de desconto em compras acima de R$ 100,00')
ON CONFLICT (id) DO NOTHING;
