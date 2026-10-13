-- ============================================================
-- MIGRAÇÃO SUPABASE: CAMPANHAS COM DESCONTOS TEMPORAIS & MULTI-WHATSAPP
-- ============================================================
-- Execute este script no SQL Editor do Supabase para atualizar
-- a base de dados em produção com as novas tabelas e colunas.
-- ============================================================

-- 1. TABELA DE CAMPANHAS COM DESCONTOS TEMPORAIS
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  scope TEXT NOT NULL CHECK (scope IN ('all', 'categories', 'products')),
  category_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  product_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de alta performance
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON public.campaigns(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON public.campaigns(tenant_id, start_date, end_date);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS) PARA CAMPANHAS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read campaigns') THEN
    CREATE POLICY "Allow public read campaigns" ON public.campaigns FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all ops campaigns') THEN
    CREATE POLICY "Allow all ops campaigns" ON public.campaigns FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. ROTEAMENTO MULTI-WHATSAPP (SELEÇÃO DE VENDEDOR)
ALTER TABLE public.store_configs ADD COLUMN IF NOT EXISTS allow_seller_choice BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.store_configs ADD COLUMN IF NOT EXISTS sellers JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS allow_seller_choice BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS sellers JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 4. ÍNDICE ADICIONAL DE BUSCA POR SLUG EM TENANTS
CREATE INDEX IF NOT EXISTS idx_tenants_slug_lower ON public.tenants (lower(slug));
