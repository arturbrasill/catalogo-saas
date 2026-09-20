'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  ExternalLink,
} from 'lucide-react';
import { useAuth, ProtectedRoute } from '@/lib/auth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Produtos', href: '/admin/produtos', icon: Package },
    { name: 'Categorias', href: '/admin/categorias', icon: FolderTree },
    { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar Desktop */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
          <div className="h-16 flex items-center px-6 border-b border-gray-100 gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-gray-900 block leading-tight text-sm">
                Painel Lojista
              </span>
              <span className="text-[11px] text-gray-500 block">SaaS Catálogo</span>
            </div>
          </div>

          {/* Links de Navegação */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                    active
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-gray-400'}`} />
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* Rodapé da Sidebar */}
          <div className="p-4 border-t border-gray-100 space-y-1.5">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                Ver Catálogo Público
              </span>
            </a>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair do Painel
            </button>
          </div>
        </aside>

        {/* Conteúdo Principal */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header Mobile */}
          <header className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-emerald-600 flex items-center justify-center text-white font-bold">
                <Store className="w-4 h-4" />
              </div>
              <span className="font-bold text-gray-900 text-sm">Painel Lojista</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-gray-600 hover:text-gray-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </header>

          {/* Drawer Menu Mobile */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 space-y-1 shadow-lg">
              {navigation.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                      active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </a>
                );
              })}
              <div className="pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da Conta
                </button>
              </div>
            </div>
          )}

          {/* Área de Visualização da Página */}
          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
