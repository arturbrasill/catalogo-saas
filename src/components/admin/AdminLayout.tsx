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
  ChevronRight,
  Shield,
  Sparkles,
  TicketPercent,
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
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, badge: null },
    { name: 'Produtos', href: '/admin/produtos', icon: Package, badge: 'Inventário' },
    { name: 'Categorias', href: '/admin/categorias', icon: FolderTree, badge: null },
    { name: 'Cupons', href: '/admin/cupons', icon: TicketPercent, badge: 'Promoções' },
    { name: 'Configurações', href: '/admin/configuracoes', icon: Settings, badge: 'Tema & WhatsApp' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const getPageTitle = () => {
    if (pathname === '/admin') return 'Visão Geral';
    if (pathname.startsWith('/admin/produtos')) return 'Catálogo de Produtos';
    if (pathname.startsWith('/admin/categorias')) return 'Gestão de Categorias';
    if (pathname.startsWith('/admin/cupons')) return 'Cupons de Desconto';
    if (pathname.startsWith('/admin/configuracoes')) return 'Identidade & Configurações';
    return 'Painel';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-100/70 flex">
        {/* Sidebar Desktop (Modern Dark SaaS Theme) */}
        <aside className="hidden lg:flex flex-col w-64 bg-slate-950 text-slate-300 border-r border-slate-900 shadow-xl select-none">
          {/* Brand Header */}
          <div className="h-18 flex items-center px-6 border-b border-slate-900/80 gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-950/50 flex-shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-white block leading-tight text-sm tracking-tight truncate">
                Painel Lojista
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SaaS Multi-tenant
              </span>
            </div>
          </div>

          {/* Links de Navegação */}
          <div className="flex-1 px-3 py-6 space-y-6 overflow-y-auto no-scrollbar">
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Menu Principal
              </p>
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                        active
                          ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 shadow-xs'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                            active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800">
                          {item.badge}
                        </span>
                      )}
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Banner de Ajuda / Dica */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dica de Conversão</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Mantenha suas fotos em boa resolução e configure o WhatsApp para receber os pedidos instantaneamente.
              </p>
            </div>
          </div>

          {/* Rodapé da Sidebar */}
          <div className="p-4 border-t border-slate-900 space-y-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between w-full px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition border border-slate-800/60"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                Ver Catálogo Público
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </a>

            <div className="flex items-center justify-between pt-2 px-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="truncate">
                  <span className="text-xs font-bold text-white block truncate leading-tight">
                    Administrador
                  </span>
                  <span className="text-[10px] text-slate-500 block">Sessão Segura</span>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition cursor-pointer"
                title="Sair do painel administrativo"
                aria-label="Sair da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Conteúdo Principal */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar Desktop / Header */}
          <header className="h-18 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
            <div className="flex items-center gap-3">
              {/* Hamburger Mobile */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                aria-label="Abrir menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-0.5">
                  <span>Administração</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-slate-600">{getPageTitle()}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-none">
                  {getPageTitle()}
                </h2>
              </div>
            </div>

            {/* Ações Rápidas do Topbar */}
            <div className="flex items-center gap-3">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Abrir Vitrine</span>
              </a>

              <div className="h-4 w-px bg-slate-200 hidden sm:block" />

              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desconectar</span>
              </button>
            </div>
          </header>

          {/* Drawer Menu Mobile */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="relative w-72 max-w-[80vw] bg-slate-950 text-slate-300 flex flex-col z-10 shadow-2xl">
                <div className="h-16 flex items-center justify-between px-5 border-b border-slate-900">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                      <Store className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-white text-sm">Painel Lojista</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                    aria-label="Fechar menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                  {navigation.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                          active
                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </a>
                    );
                  })}
                </nav>

                <div className="p-4 border-t border-slate-900 space-y-2">
                  <a
                    href="/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-bold text-slate-300 bg-slate-900 rounded-xl"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver Catálogo Público
                  </a>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-bold text-rose-400 hover:bg-slate-900 rounded-xl"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sair da Conta
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Área de Visualização da Página */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
