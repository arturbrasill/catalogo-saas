'use client';

import React, { useState, useEffect } from 'react';
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
  Flame,
} from 'lucide-react';
import { useAuth, ProtectedRoute } from '@/lib/auth';
import { api } from '@/lib/api';
import type { StoreConfig } from '@/types';
import { InadimplenciaModal } from '@/components/admin/InadimplenciaModal';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();
  const [store, setStore] = useState<StoreConfig | null>(null);
  const [overdueModalDismissed, setOverdueModalDismissed] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, badge: null },
    { name: 'Produtos', href: '/admin/produtos', icon: Package, badge: 'Inventário' },
    { name: 'Categorias', href: '/admin/categorias', icon: FolderTree, badge: null },
    { name: 'Campanhas', href: '/admin/campanhas', icon: Flame, badge: 'Descontos' },
    { name: 'Cupons', href: '/admin/cupons', icon: TicketPercent, badge: 'Promoções' },
    { name: 'Configurações', href: '/admin/configuracoes', icon: Settings, badge: 'Tema & Assinatura' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const [storeSlug, setStoreSlug] = useState<string>('');

  const loadStore = async () => {
    try {
      const st = await api.getStore();
      if (st) {
        setStore(st);
        if (st.store_id) {
          setStoreSlug(st.store_id);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTenant = params.get('tenant');
      if (urlTenant) {
        setStoreSlug(urlTenant);
        try {
          sessionStorage.setItem('catalogo_admin_tenant', urlTenant);
        } catch {}
      } else {
        try {
          const stored =
            sessionStorage.getItem('catalogo_admin_tenant') ||
            localStorage.getItem('catalogo_admin_tenant');
          if (stored) {
            setStoreSlug(stored);
          }
        } catch {}
        const match = document.cookie.match(/(?:^|;\s*)app_tenant=([^;]+)/);
        if (match && match[1]) {
          setStoreSlug(decodeURIComponent(match[1]));
        }
      }
    }
    loadStore();
  }, []);

  const isTrial = Boolean(
    store &&
      (store.subscription_status === 'trial' ||
        store.subscription_plan === 'trial_7d' ||
        store.subscription_plan === 'trial_30d') &&
      !store.pending_payment &&
      store.subscription_status !== 'blocked' &&
      store.subscription_status !== 'expired'
  );

  const daysRemaining = store?.subscription_expires_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(store.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : 7;

  const isOverdueOrBlocked = Boolean(
    store &&
      (store.subscription_status === 'blocked' ||
        store.subscription_status === 'expired' ||
        store.pending_payment === true ||
        (store.subscription_expires_at &&
          new Date(store.subscription_expires_at).getTime() < Date.now() &&
          store.subscription_status !== 'active'))
  );

  const catalogHref = storeSlug ? `/${storeSlug}` : '/';

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
      <div className="min-h-screen bg-[#E9ECEF] flex">
        {/* Sidebar Desktop (Modern Dark SaaS Theme - Paleta Oficial NumClick #212529) */}
        <aside
          data-admin-sidebar="true"
          className="hidden lg:flex flex-col w-64 bg-[#212529] !text-white border-r border-white/10 shadow-xl select-none"
          style={{ color: '#ffffff' }}
        >
          {/* Brand Header */}
          <div className="h-16 sm:h-20 flex items-center px-6 border-b border-white/10 gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center text-white font-black shadow-lg shadow-black/40 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/numclick-badge.png"
                alt="NumClick Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/marca/marca-dark.svg"
                alt="NumClick"
                className="h-4 w-auto object-contain object-left"
              />
              <span
                className="text-[11px] !text-[#FB5607] font-bold flex items-center gap-1 mt-1"
                style={{ color: '#FB5607' }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#FB5607] animate-pulse" />
                Painel do Lojista
              </span>
            </div>
          </div>

          {/* Links de Navegação */}
          <div className="flex-1 px-3 py-6 space-y-6 overflow-y-auto no-scrollbar">
            <div>
              <p
                className="px-3 text-[10px] font-bold uppercase tracking-wider !text-slate-400 mb-2"
                style={{ color: '#94a3b8' }}
              >
                Menu Principal
              </p>
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  const itemHref = storeSlug
                    ? `${item.href}?tenant=${encodeURIComponent(storeSlug)}`
                    : item.href;
                  return (
                    <a
                      key={item.name}
                      href={itemHref}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group !text-white ${
                        active
                          ? 'bg-white/10 border border-white/15 shadow-xs'
                          : 'hover:bg-white/5 active:bg-white/10 border border-transparent'
                      }`}
                      style={{ color: '#ffffff' }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 transition-transform group-hover:scale-105 !text-white ${
                            active ? 'opacity-100' : 'opacity-90 group-hover:opacity-100'
                          }`}
                          style={{ color: '#ffffff' }}
                        />
                        <span
                          className="truncate !text-white font-medium tracking-tight"
                          style={{ color: '#ffffff' }}
                        >
                          {item.name}
                        </span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-md !text-white border ${
                            active
                              ? 'bg-white/20 border-white/25'
                              : 'bg-white/10 border-white/15'
                          }`}
                          style={{ color: '#ffffff' }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Banner de Ajuda / Dica */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-[#8338EC]/20 to-black/30 border border-[#8338EC]/35 space-y-2 text-xs">
              <div
                className="flex items-center gap-1.5 !text-[#FB5607] font-bold text-[11px]"
                style={{ color: '#FB5607' }}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FB5607]" />
                <span style={{ color: '#FB5607' }}>Dica de Conversão</span>
              </div>
              <p
                className="!text-[#E9ECEF]/80 text-[11px] leading-relaxed"
                style={{ color: '#E9ECEF' }}
              >
                Mantenha suas fotos em boa resolução e configure o WhatsApp para receber os pedidos instantaneamente.
              </p>
            </div>
          </div>

          {/* Rodapé da Sidebar */}
          <div className="p-4 border-t border-white/10 space-y-2">
            <a
              href={catalogHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between w-full px-3.5 py-2.5 text-xs font-semibold !text-white hover:bg-[#FB5607] active:bg-[#8338EC] rounded-xl transition border border-white/15"
              style={{ color: '#ffffff' }}
            >
              <span className="flex items-center gap-2 !text-white" style={{ color: '#ffffff' }}>
                <ExternalLink className="w-4 h-4 !text-white" style={{ color: '#ffffff' }} />
                Ver Catálogo Público
              </span>
              <ChevronRight className="w-3.5 h-3.5 !text-white opacity-70" style={{ color: '#ffffff' }} />
            </a>

            <div className="flex items-center justify-between pt-2 px-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center !text-white font-bold text-xs">
                  <Shield className="w-4 h-4 !text-[#FB5607]" style={{ color: '#FB5607' }} />
                </div>
                <div className="truncate">
                  <span
                    className="text-xs font-bold !text-white block truncate leading-tight"
                    style={{ color: '#ffffff' }}
                  >
                    Administrador
                  </span>
                  <span
                    className="text-[10px] !text-[#E9ECEF]/70 block"
                    style={{ color: '#E9ECEF' }}
                  >
                    Sessão Segura
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="p-2 !text-[#E9ECEF]/70 hover:!text-[#FB5607] hover:bg-white/10 rounded-lg transition cursor-pointer"
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
          {/* Top Bar / Banner Fixo de Status de Teste */}
          {isTrial && (
            <aside
              aria-label="Status do teste gratuito"
              className="bg-gradient-to-r from-[#8338EC] via-[#8338EC] to-[#FB5607] text-white px-4 py-2.5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs sm:text-sm font-medium z-30 shadow-xs sticky top-0"
            >
              <div className="flex items-center gap-2 text-center sm:text-left">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 text-white font-bold text-[10px] sm:text-[11px] uppercase tracking-wider backdrop-blur-xs">
                  ⚡ Teste Gratuito
                </span>
                <span>
                  Você está no período de teste gratuito: restam <strong>{daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}</strong>. Sua assinatura será de <strong>R$ 79,90/mês</strong>.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {store?.asaas_payment_link ? (
                  <a
                    href={store.asaas_payment_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#212529] text-[#E9ECEF] font-bold hover:bg-black shadow-xs transition text-xs"
                  >
                    <span>Assinar Agora</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#FB5607]" />
                  </a>
                ) : (
                  <a
                    href="/admin/configuracoes?tab=subscription"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#212529] text-[#E9ECEF] font-bold hover:bg-black shadow-xs transition text-xs"
                  >
                    <span>Ver Detalhes do Pagamento</span>
                  </a>
                )}
              </div>
            </aside>
          )}

          {/* Top Bar Desktop / Header */}
          <header className="h-16 sm:h-20 bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
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
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
                  <span>Administração</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-slate-600">{getPageTitle()}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {getPageTitle()}
                </h2>
              </div>
            </div>

            {/* Ações Rápidas do Topbar */}
            <div className="flex items-center gap-3">
              <a
                href={catalogHref}
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
                className="fixed inset-0 bg-[#212529]/70 backdrop-blur-xs"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div
                data-admin-mobile-drawer="true"
                className="relative w-72 max-w-[80vw] bg-[#212529] !text-white flex flex-col z-10 shadow-2xl select-none"
                style={{ color: '#ffffff' }}
              >
                <div className="h-16 sm:h-20 flex items-center justify-between px-5 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/numclick-badge.png"
                        alt="NumClick Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/marca/marca-dark.svg"
                      alt="NumClick"
                      className="h-4 w-auto object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 !text-slate-400 hover:!text-white hover:bg-white/10 rounded-lg transition"
                    aria-label="Fechar menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                  {navigation.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    const itemHref = storeSlug
                      ? `${item.href}?tenant=${encodeURIComponent(storeSlug)}`
                      : item.href;
                    return (
                      <a
                        key={item.name}
                        href={itemHref}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition !text-white ${
                          active
                            ? 'bg-white/10 border border-white/15 shadow-xs'
                            : 'hover:bg-white/5 active:bg-white/10 border border-transparent'
                        }`}
                        style={{ color: '#ffffff' }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            className={`w-4 h-4 !text-white ${
                              active ? 'opacity-100' : 'opacity-90'
                            }`}
                            style={{ color: '#ffffff' }}
                          />
                          <span
                            className="!text-white truncate font-medium"
                            style={{ color: '#ffffff' }}
                          >
                            {item.name}
                          </span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-semibold px-2 py-0.5 rounded-md !text-white border ${
                              active
                                ? 'bg-white/20 border-white/25'
                                : 'bg-white/10 border-white/15'
                            }`}
                            style={{ color: '#ffffff' }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </a>
                    );
                  })}
                </nav>

                <div className="p-4 border-t border-slate-900 space-y-2">
                  <a
                    href={catalogHref}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-bold !text-white bg-slate-900 hover:bg-white/10 rounded-xl border border-white/10 transition"
                    style={{ color: '#ffffff' }}
                  >
                    <ExternalLink className="w-3.5 h-3.5 !text-white" style={{ color: '#ffffff' }} />
                    <span style={{ color: '#ffffff' }}>Ver Catálogo Público</span>
                  </a>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-bold !text-rose-400 hover:bg-white/10 rounded-xl transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sair da Conta
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Área de Visualização da Página */}
          <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl w-full mx-auto animate-fade-in">
            {children}
          </main>
        </div>

        {/* Modal Amigável de Bloqueio por Inadimplência / Pagamento Pendente */}
        {store && isOverdueOrBlocked && !overdueModalDismissed && (
          <InadimplenciaModal
            store={store}
            isOpen={true}
            onClose={() => setOverdueModalDismissed(true)}
            onRefreshStatus={loadStore}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
