import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter, Playfair_Display, Space_Grotesk } from 'next/font/google';
import './globals.css';

import { headers } from 'next/headers';
import { findTenant } from '@/lib/tenantStore';
import { generateThemeCssVariables } from '@/lib/themePresets';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

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
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id');
  const host = headersList.get('x-tenant-host');
  const tenant = tenantId ? findTenant(tenantId) : (host ? findTenant(host) : null);

  const themePreset = tenant?.theme_preset || 'modern';
  const initialCssVariables = generateThemeCssVariables(
    tenant
      ? {
          primary_color: tenant.primary_color,
          secondary_color: tenant.secondary_color,
          background_color: tenant.background_color,
          text_color: tenant.text_color,
          theme_preset: tenant.theme_preset,
          announcement_bg_color: tenant.announcement_bg_color,
          announcement_text_color: tenant.announcement_text_color,
        }
      : null
  );

  return (
    <html
      lang="pt-BR"
      data-theme={themePreset}
      className={`${plusJakartaSans.variable} ${inter.variable} ${playfairDisplay.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        <style
          id="saas-theme-tokens"
          dangerouslySetInnerHTML={{ __html: initialCssVariables }}
        />
      </head>
      <body className="antialiased min-h-screen bg-slate-50 font-sans selection:bg-brand-primary selection:text-white transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
