import type { Metadata } from 'next';
import './globals.css';

import { headers } from 'next/headers';
import { findTenant } from '@/lib/tenantStore';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id');
  const host = headersList.get('x-tenant-host');
  const tenant = tenantId ? findTenant(tenantId) : (host ? findTenant(host) : null);

  const storeName = tenant?.name || 'Catálogo Digital';
  const title = `${storeName} | Catálogo Oficial`;
  const description = `Confira os produtos e novidades da loja ${storeName} e faça seu pedido direto pelo WhatsApp!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'pt_BR',
      siteName: storeName,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
