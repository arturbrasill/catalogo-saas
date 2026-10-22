'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Store,
  MessageCircle,
  DollarSign,
  Zap,
  Calendar,
  ShoppingBag,
  Clock,
  Sparkles,
} from 'lucide-react';
import { normalizePhoneNumber } from '@/lib/whatsapp';
import { DEMO_STORES, type DemoStore } from '@/lib/demoStores';

/**
 * Constrói URL sanitizada e codificada de forma segura para WhatsApp
 */
function getSanitizedWhatsappUrl(rawPhone: string | undefined, message: string): string {
  let cleanPhone = '5511999999999';
  try {
    if (rawPhone && rawPhone.trim()) {
      cleanPhone = normalizePhoneNumber(rawPhone);
    }
  } catch {
    cleanPhone = '5511999999999';
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Símbolo/Glifo Oficial NumClick — Laranja sólido (#EA580C), 100% sem moldura e fundo transparente
 */
function NumClickGlyph({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 815 815"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0.212857 310.892C-1.95741 294.198 12.8292 280.265 29.3642 283.424L430.575 360.054C440.509 361.951 448.286 369.71 450.207 379.64L528.648 785.097C531.85 801.65 517.906 816.482 501.187 814.305L394.982 800.482C382.473 798.854 373.196 788.068 373.458 775.456L379.167 500.383L195.979 754.849C187.117 767.158 169.362 768.658 158.562 758.009L52.7476 653.686C41.8609 642.953 43.2292 625.01 55.6175 616.051L310.427 431.789L39.2631 439.102C26.5928 439.444 15.717 430.147 14.0829 417.578L0.212857 310.892Z"
        fill="#EA580C"
      />
      <path
        d="M232.34 54.6935C226.646 40.3947 235.262 24.4245 250.339 21.3319L351.843 0.511793C366.677 -2.53097 380.736 8.35833 381.499 23.4822L391.49 221.558C392.354 238.686 375.941 251.468 359.546 246.435L312.941 232.125C305.78 229.926 300.002 224.599 297.23 217.64L232.34 54.6935Z"
        fill="#EA580C"
      />
      <path
        d="M759.82 580.983C774.106 586.648 790.043 578.043 793.144 562.991L813.993 461.779C817.051 446.937 806.156 432.862 791.022 432.102L592.454 422.129C575.315 421.268 562.535 437.703 567.591 454.101L581.895 500.489C584.103 507.649 589.44 513.422 596.405 516.184L759.82 580.983Z"
        fill="#EA580C"
      />
      <path
        d="M476.008 287.636C467.44 278.99 466.442 265.392 473.656 255.587L597.439 87.3464C606.402 75.1642 624.106 73.8148 634.812 84.4978L727.955 177.443C738.705 188.169 737.331 205.961 725.063 214.911L555.849 338.359C545.976 345.561 532.322 344.468 523.72 335.788L476.008 287.636Z"
        fill="#EA580C"
      />
    </svg>
  );
}

/**
 * 1. HEADER MINIMALISTA
 */
function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link
          href="/landing"
          className="inline-flex items-center gap-2 focus:outline-none"
          aria-label="NumClick Página Inicial"
        >
          <NumClickGlyph className="w-6 h-6 flex-shrink-0" />
          <span className="text-lg font-bold tracking-tight text-slate-900">
            NumClick
          </span>
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600"
        >
          <a href="#como-funciona" className="hover:text-slate-900 transition-colors">
            Como Funciona
          </a>
          <a href="#demonstracao" className="hover:text-slate-900 transition-colors">
            Demonstração
          </a>
          <a href="#planos" className="hover:text-slate-900 transition-colors">
            Planos
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/login"
            className="hidden sm:inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/criar-loja"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-colors"
          >
            <span>Testar por 7 Dias</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      {/* Barra de navegação compacta para Mobile */}
      <nav
        aria-label="Navegação mobile"
        className="flex md:hidden items-center justify-center gap-6 px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs font-medium text-slate-600"
      >
        <a href="#como-funciona" className="hover:text-slate-900 transition-colors">
          Como Funciona
        </a>
        <a href="#demonstracao" className="hover:text-slate-900 transition-colors">
          Demonstração
        </a>
        <a href="#planos" className="hover:text-slate-900 transition-colors">
          Planos
        </a>
      </nav>
    </header>
  );
}

/**
 * Mockup realista e limpo de Smartphone exibindo o catálogo com sacola aberta e cálculo visível
 */
function SmartphoneCatalogMockup() {
  return (
    <div className="w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3 shadow-sm hover:border-slate-300 transition-colors">
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          {/* Barra superior do navegador mobile */}
          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="w-2 h-2 rounded-full bg-slate-300" />
            </div>
            <div className="px-2.5 py-1 rounded bg-white border border-slate-200 text-[11px] font-mono text-slate-700 truncate">
              numclick.app/essenza
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
              Online
            </span>
          </div>

          {/* Cabeçalho da Loja no Mockup */}
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Essenza Cosméticos</p>
              <p className="text-[11px] text-slate-500">Entrega rápida • Retirada na loja</p>
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-700">
              <ShoppingBag className="w-3.5 h-3.5 text-orange-600" strokeWidth={1.75} />
              <span>2 itens</span>
            </div>
          </div>

          {/* Sacola aberta com opções e cálculo visível */}
          <div className="p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Sua Sacola de Pedido
              </span>
              <span className="text-[11px] font-medium text-slate-500">Cálculo automático</span>
            </div>

            {/* Item 1 */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-slate-900">
                  1x Eau de Parfum Essenza Gold
                </p>
                <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
                  R$ 139,90
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Volume: 100ml • Embalagem: Presente
              </p>
            </div>

            {/* Item 2 */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-slate-900">
                  1x Hidratante Corporal Karité
                </p>
                <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
                  R$ 59,90
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Fragrância: Baunilha • Tamanho: 250ml
              </p>
            </div>

            {/* Resumo do Cálculo */}
            <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal (2 itens)</span>
                <span>R$ 199,80</span>
              </div>
              <div className="flex items-center justify-between text-emerald-700 font-medium">
                <span>Cupom BEMVINDO10</span>
                <span>- R$ 10,00</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Entrega (Centro)</span>
                <span>Grátis</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-bold text-slate-900">
                <span>Total do Pedido</span>
                <span>R$ 189,80</span>
              </div>
            </div>

            {/* Botão simulado de disparo para WhatsApp */}
            <div className="pt-1">
              <div className="w-full py-2.5 px-3 rounded-lg bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-orange-500" strokeWidth={1.75} />
                <span>Enviar Pedido Pronto no WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. HERO SECTION (CLAREZA IMEDIATA - FUNDO BRANCO PURO)
 */
function HeroSection() {
  return (
    <section className="bg-white py-14 sm:py-20 lg:py-24 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Coluna de Texto e CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-orange-600" />
                <span>Catálogo digital para comércio local</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-xs font-semibold">
                <Sparkles className="w-3 h-3 text-orange-600" strokeWidth={1.75} />
                <span>✨ 7 dias grátis</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15]">
              O catálogo da sua loja no WhatsApp do seu cliente, sem taxas por pedido.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              Substitua PDFs pesados e conversas confusas. O cliente escolhe opções, cores e tamanhos em um link rápido, e o pedido chega somado e pronto no seu WhatsApp.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/criar-loja"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-colors"
              >
                <span>Começar Teste de 7 Dias Grátis</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </Link>

              <a
                href="#demonstracao"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-orange-600" strokeWidth={1.75} />
                <span>Ver Lojas de Exemplo</span>
              </a>
            </div>

            <div className="pt-1 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-orange-600" strokeWidth={1.75} />
                Sem cartão de crédito
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-orange-600" strokeWidth={1.75} />
                0% de comissão sobre vendas
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-orange-600" strokeWidth={1.75} />
                Pronto em 2 minutos
              </span>
            </div>
          </div>

          {/* Coluna do Mockup do Smartphone */}
          <div className="lg:col-span-5">
            <SmartphoneCatalogMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 3. DEMONSTRAÇÃO: RIGOROSAMENTE 2 LOJAS MODELO (FUNDO CLARO SUAVE #F8FAFC)
 * Para ativar o Slot 2 futuramente, basta atualizar o segundo item em `src/lib/demoStores.ts`
 * (`url: 'https://numclick.app/sua-loja'` e `isAvailable: true`) sem alterar o CSS.
 */
function DemoStoresSection({ stores }: { stores: DemoStore[] }) {
  return (
    <section id="demonstracao" className="bg-slate-50 py-16 sm:py-24 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700">
            <Store className="w-3.5 h-3.5 text-orange-600" strokeWidth={1.75} />
            <span>Demonstração ao Vivo</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Teste a experiência real de compra
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Navegue por uma vitrine ativa, adicione variações na sacola e veja exatamente como seu cliente faz o pedido pelo celular.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stores.slice(0, 2).map((store) => {
            const isAvailable = store.isAvailable && store.url !== '#';

            if (!isAvailable) {
              // Card 2 (Slot Reserva): Estrutura documentada e pronta para receber a próxima loja modelo
              return (
                <div
                  key={store.id}
                  data-slot-id={store.id}
                  className="flex flex-col justify-between p-6 rounded-xl bg-white border border-slate-200 hover:border-slate-400 shadow-sm transition-colors"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
                        <Clock className="w-5 h-5" strokeWidth={1.75} />
                      </div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                        Em Breve
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold tracking-tight text-slate-900">
                          {store.name}
                        </h3>
                        <span className="text-xs font-medium text-slate-500">
                          • {store.category}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {store.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-medium text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                      <span>Nova loja demonstrativa em homologação</span>
                    </span>
                    <span className="font-mono text-slate-400">numclick.app/...</span>
                  </div>
                </div>
              );
            }

            // Card 1 (Loja Essenza): Demonstração ativa de Perfumaria e Cosméticos
            return (
              <a
                key={store.id}
                href={store.url}
                target="_blank"
                rel="noopener noreferrer"
                data-slot-id={store.id}
                className="group flex flex-col justify-between p-6 rounded-xl bg-white border border-slate-200 hover:border-slate-400 shadow-sm transition-all duration-200"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-700">
                      {store.badge}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
                        {store.name}
                      </h3>
                      <span className="text-xs font-medium text-slate-500">
                        • {store.category}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {store.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-900">
                  <span className="inline-flex items-center gap-1.5 group-hover:text-orange-600 transition-colors">
                    <span>Acessar catálogo ao vivo</span>
                    <ArrowUpRight
                      className="w-4 h-4 text-orange-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                      strokeWidth={1.75}
                    />
                  </span>
                  <span className="font-mono text-slate-600">numclick.app/essenza</span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * 4. SEÇÃO ESCURA 1: BENTO GRID DE RECURSOS (4 BLOCOS OBJETIVOS EM #0B0F19)
 */
const BENTO_FEATURES = [
  {
    title: 'Sem Comissão por Venda',
    pill: 'Zero Taxas',
    description:
      '100% do lucro direto com o lojista. Você paga apenas a assinatura fixa mensal e recebe o valor integral dos pedidos via PIX, cartão ou dinheiro direto na sua conta.',
    highlight: '0% de comissão • Recebimento integral na conta da loja',
    icon: DollarSign,
  },
  {
    title: 'Rápido no Celular',
    pill: 'Carregamento Instantâneo',
    description:
      'Sem aplicativos para baixar e com abertura imediata em qualquer navegador. Seu cliente acessa o link exclusivo na bio do Instagram ou no WhatsApp e compra em segundos.',
    highlight: 'Link próprio numclick.app/sualoja com SSL incluso',
    icon: Zap,
  },
  {
    title: 'Campanhas e Descontos',
    pill: 'Ofertas & Datas',
    description:
      'Descontos programados para datas comemorativas direto no painel. Ative promoções com preço original riscado, selos de oferta e cupons de desconto sem retrabalho.',
    highlight: 'Ativação imediata de ofertas e cupons no catálogo',
    icon: Calendar,
  },
  {
    title: 'Múltiplos Atendentes',
    pill: 'Equipe no WhatsApp',
    description:
      'Opção para o cliente escolher o vendedor no WhatsApp antes de enviar o pedido. Ideal para lojas com equipe de vendas ou atendimento setorizado.',
    highlight: 'Roteamento direto do pedido para o WhatsApp de cada vendedor',
    icon: MessageCircle,
  },
];

function BentoFeaturesSection() {
  return (
    <section id="como-funciona" className="bg-[#0B0F19] py-20 sm:py-24 border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-semibold text-orange-400">
            <Zap className="w-3.5 h-3.5 text-orange-400" strokeWidth={1.75} />
            <span>Recursos & Diferenciais</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Estrutura direta para vender todos os dias
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Desenvolvido para eliminar o atrito no atendimento via WhatsApp e manter o controle total na mão do comerciante.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {BENTO_FEATURES.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.title}
                className="p-6 sm:p-7 rounded-xl bg-[#131B2E] border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400">
                      <IconComponent className="w-4 h-4 text-orange-400" strokeWidth={1.75} />
                      <span className="text-xs font-semibold">{feature.pill}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center gap-2 text-xs font-medium text-slate-300">
                  <Check className="w-4 h-4 text-orange-400 flex-shrink-0" strokeWidth={1.75} />
                  <span>{feature.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * 5. SEÇÃO DE PREÇO TRANSPARENTE (PLANO ÚNICO - FUNDO CLARO #F8FAFC)
 */
const PLAN_INCLUSIONS = [
  'Catálogo ilimitado de produtos, fotos e categorias',
  'Grade completa de variações (cores, tamanhos, opções e adicionais)',
  'Painel administrativo rápido para celular e computador',
  'Campanhas de desconto, cupons e múltiplos atendentes no WhatsApp',
  'Suporte direto no WhatsApp e todas as atualizações inclusas',
];

function PricingSection() {
  return (
    <section id="planos" className="bg-slate-50 py-16 sm:py-24 border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-700">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" strokeWidth={1.75} />
            <span>✨ 7 dias grátis • Assinatura Simples</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Preço único, transparente e sem taxas ocultas
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Todos os recursos liberados desde o primeiro dia para sua loja profissionalizar os pedidos no WhatsApp.
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="rounded-xl bg-white border border-slate-200 hover:border-slate-400 transition-colors p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-bold tracking-tight text-slate-900">
                Plano Completo
              </h3>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-700">
                7 Dias de Teste Grátis • Cancele quando quiser
              </span>
            </div>

            <div className="py-5 border-y border-slate-200 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
                R$ 79,90
              </span>
              <span className="text-sm font-medium text-slate-600">/ mês</span>
            </div>

            <ul className="space-y-3 text-sm text-slate-700">
              {PLAN_INCLUSIONS.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2 space-y-3">
              <Link
                href="/criar-loja"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-colors"
              >
                <span>Iniciar 7 Dias Grátis</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </Link>
              <p className="text-xs text-center text-slate-500">
                Não cobramos comissão por venda • Ativação imediata sem cartão
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 6. SEÇÃO ESCURA 2: CTA FINAL DE FECHAMENTO (ANTES DO RODAPÉ - #0B0F19)
 */
function FinalCtaSection({ whatsappUrl }: { whatsappUrl: string }) {
  return (
    <section className="bg-[#0B0F19] py-20 sm:py-24 border-b border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-semibold text-orange-400">
          <Sparkles className="w-3.5 h-3.5 text-orange-400" strokeWidth={1.75} />
          <span>✨ 7 dias grátis • Sem cartão de crédito</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white max-w-2xl mx-auto">
          Pronto para transformar as vendas da sua loja?
        </h2>

        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          Crie seu catálogo digital em menos de 2 minutos e receba pedidos organizados, somados e sem comissões direto no seu WhatsApp.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/criar-loja"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg text-sm bg-orange-600 hover:bg-orange-500 text-white font-medium shadow-lg shadow-orange-950/40 transition-colors"
          >
            <span>Começar Teste de 7 Dias Grátis</span>
            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-sm font-medium border border-slate-700 text-slate-300 hover:bg-slate-900 hover:text-white hover:border-slate-600 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-orange-400" strokeWidth={1.75} />
            <span>Falar com Suporte no WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  );
}

/**
 * 7. RODAPÉ FUNCIONAL
 */
function LandingFooter({ whatsappUrl }: { whatsappUrl: string }) {
  return (
    <footer className="bg-white py-12 text-slate-600">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <Link href="/landing" className="inline-flex items-center gap-2">
              <NumClickGlyph className="w-5 h-5 flex-shrink-0" />
              <span className="text-base font-bold tracking-tight text-slate-900">
                NumClick
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-600">
              Feito para fortalecer o comércio local
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs sm:text-sm font-medium text-slate-600">
            <a href="#como-funciona" className="hover:text-slate-900 transition-colors">
              Como Funciona
            </a>
            <a href="#demonstracao" className="hover:text-slate-900 transition-colors">
              Demonstração
            </a>
            <a href="#planos" className="hover:text-slate-900 transition-colors">
              Planos
            </a>
            <Link href="/admin/login" className="hover:text-slate-900 transition-colors">
              Painel do Lojista
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-orange-600" strokeWidth={1.75} />
              <span>Suporte no WhatsApp</span>
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} NumClick. Todos os direitos reservados.</p>
          <p>Catálogo digital multi-tenant • 0% de taxas por pedido</p>
        </div>
      </div>
    </footer>
  );
}

export default function SaaSCommercialLandingPage() {
  const commercialPhone =
    process.env.NEXT_PUBLIC_COMMERCIAL_WHATSAPP ||
    process.env.NEXT_PUBLIC_WHATSAPP ||
    '5511999999999';

  const supportWhatsappUrl = useMemo(
    () =>
      getSanitizedWhatsappUrl(
        commercialPhone,
        'Olá! Gostaria de tirar uma dúvida sobre o catálogo NumClick.'
      ),
    [commercialPhone]
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased w-full overflow-x-hidden">
      <LandingHeader />
      <main>
        <HeroSection />
        <DemoStoresSection stores={DEMO_STORES} />
        <BentoFeaturesSection />
        <PricingSection />
        <FinalCtaSection whatsappUrl={supportWhatsappUrl} />
      </main>
      <LandingFooter whatsappUrl={supportWhatsappUrl} />
    </div>
  );
}
