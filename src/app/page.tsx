'use client';

import React, { useEffect, useState } from 'react';
import { CatalogView } from '@/components/catalog/CatalogView';
import SaaSCommercialLandingPage from '@/app/landing/page';

export default function RootPage() {
  const [showStoreCatalog, setShowStoreCatalog] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryTenant = params.get('tenant');
      const host = window.location.hostname
        .replace(/:\d+$/, '')
        .replace(/^www\./, '')
        .toLowerCase();

      const isSaasMainDomain =
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === 'numclick.app' ||
        host.endsWith('.vercel.app');

      setShowStoreCatalog(Boolean(queryTenant) || !isSaasMainDomain);
    }
  }, []);

  if (showStoreCatalog) {
    return <CatalogView />;
  }

  return <SaaSCommercialLandingPage />;
}
