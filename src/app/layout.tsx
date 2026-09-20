import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Catálogo Digital SaaS',
  description: 'Catálogo digital multi-tenant para empresas locais',
};

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
