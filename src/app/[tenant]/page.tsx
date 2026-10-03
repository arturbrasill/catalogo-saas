'use client';

import React from 'react';
import { CatalogView } from '@/components/catalog/CatalogView';

interface DynamicTenantPageProps {
  params: {
    tenant: string;
  };
}

export default function DynamicTenantCatalogPage({ params }: DynamicTenantPageProps) {
  return <CatalogView initialTenant={params.tenant} />;
}
