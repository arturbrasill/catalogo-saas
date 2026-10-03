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

  const storeName = tenant?.name || 'NumClick';
  const title = tenant?.name
    ? `${tenant.name} | Catálogo Oficial`
    : 'NumClick | Catálogos Digitais & Vendas via WhatsApp';
  const description = tenant?.name
    ? `Confira os produtos e novidades da loja ${tenant.name} e faça seu pedido direto pelo WhatsApp!`
    : 'NumClick: Plataforma White-Label de Catálogos Digitais de alta conversão para empresas locais venderem pelo WhatsApp sem taxas ou comissões.';

  const iconUrl = tenant?.logo_url || '/favicon.ico';

  return {
    title,
    description,
    icons: {
      icon: [
        { url: iconUrl, sizes: 'any' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon.png', sizes: '64x64', type: 'image/png' },
      ],
      apple: [{ url: tenant?.logo_url || '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
      shortcut: iconUrl,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'pt_BR',
      siteName: storeName,
      images: [
        {
          url: tenant?.logo_url || '/numclick-og.png',
          width: 1200,
          height: 630,
          alt: storeName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [tenant?.logo_url || '/numclick-og.png'],
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="64x64" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
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
