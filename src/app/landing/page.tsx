'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Check,
  Smartphone,
  Store,
  DollarSign,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Percent,
  Sliders,
  Star,
  ShieldCheck,
  Globe,
  Lock,
  X,
  XCircle,
} from 'lucide-react';
import { formatCurrency, normalizePhoneNumber } from '@/lib/whatsapp';

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

// Configuração das lojas de exemplo para demonstração
// Atualize os links (url) e nomes (name) conforme as lojas forem criadas
interface DemoStore {
  id: string;
  name: string;
  badge: string;
  description: string;
  url: string;
}

const DEMO_STORES: DemoStore[] = [
  {
    id: 'loja-1',
    name: 'Essenza',
    badge: 'Modelo 1',
    description: 'Catálogo demonstrativo em tempo real',
    url: 'https://numclick-app.vercel.app/essenza',
  },
  {
    id: 'loja-2',
    name: 'Loja de Exemplo 02',
    badge: 'Modelo 2',
    description: 'Catálogo demonstrativo em tempo real',
    url: '#', // Substituir pela URL da segunda loja
  },
  {
    id: 'loja-3',
    name: 'Loja de Exemplo 03',
    badge: 'Modelo 3',
    description: 'Catálogo demonstrativo em tempo real',
    url: '#', // Substituir pela URL da terceira loja
  },
];

// Perguntas frequentes
const FAQ_ITEMS = [
  {
    question: 'Vocês cobram alguma comissão ou porcentagem sobre as minhas vendas?',
    answer:
      'NÃO! Cobramos ZERO comissão por pedido. Você paga apenas a assinatura mensal fixa do sistema e todo o dinheiro das suas vendas cai direto na sua conta bancária (via PIX, dinheiro ou maquininha). Não retemos um único centavo.',
  },
  {
    question: 'Como os pedidos chegam para mim?',
    answer:
      'O cliente monta a sacola no catálogo pelo celular, escolhe os adicionais/tamanhos, seleciona se quer entrega (com endereço e bairro) ou retirada, escolhe a forma de pagamento (com opção de copiar sua chave PIX com 1 clique) e clica em enviar. O pedido chega no seu WhatsApp 100% pronto e formatado, sem você perder tempo digitando.',
  },
  {
    question: 'Como atualizo meus produtos, preços e fotos?',
    answer:
      'Basta acessar o seu Painel Administrativo direto no navegador do celular ou computador! Mudou o preço, foto ou estoque no painel, o catálogo atualiza na mesma hora de forma 100% instantânea.',
  },
  {
    question: 'Preciso de computador ou conhecimento de programação?',
    answer:
      'Nenhum conhecimento técnico é necessário. O sistema foi desenvolvido para ser gerenciado 100% pelo smartphone. Em menos de 2 minutos sua loja já está no ar pronta para vender.',
  },
  {
    question: 'Posso usar meu próprio domínio (ex: www.minhaloja.com.br)?',
    answer:
      'Sim! O sistema suporta domínio personalizado próprio (ex: suaempresa.com.br) ou subdomínios automáticos prontos para colocar no link da bio do Instagram.',
  },
  {
    question: 'Como funciona o teste grátis de 7 dias?',
    answer:
      'Você cria sua loja agora mesmo sem precisar cadastrar cartão de crédito. Experimente por 7 dias grátis com todas as funcionalidades liberadas. Só continua se o catálogo realmente aumentar suas vendas. Sem fidelidade, cancele quando quiser.',
  },
];

export default function SaaSCommercialLandingPage() {
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(15000);
  const [marketplaceFee, setMarketplaceFee] = useState<number>(18);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Cálculos da calculadora de economia baseada no plano mensal único
  const monthlyFeeAmount = (monthlyRevenue * marketplaceFee) / 100;
  const yearlyMarketplaceLoss = monthlyFeeAmount * 12;
  const saasYearlyCost = 79.9 * 12; // R$ 79,90/mês
  const yearlySavings = Math.max(0, yearlyMarketplaceLoss - saasYearlyCost);

  // Mensagem para contratação direta via WhatsApp com sanitização rigorosa de número
  const commercialHireMessage = 'Olá! Tenho interesse em implantar o catálogo na minha loja.';
  const specialistMessage = 'Olá! Gostaria de falar com um especialista sobre o catálogo para minha loja.';

  const commercialPhone =
    process.env.NEXT_PUBLIC_COMMERCIAL_WHATSAPP ||
    process.env.NEXT_PUBLIC_WHATSAPP ||
    '5511999999999';

  const commercialWhatsappHireUrl = useMemo(
    () => getSanitizedWhatsappUrl(commercialPhone, commercialHireMessage),
    [commercialPhone]
  );

  const specialistWhatsappUrl = useMemo(
    () => getSanitizedWhatsappUrl(commercialPhone, specialistMessage),
    [commercialPhone]
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-500 selection:text-white font-sans antialiased w-full overflow-x-hidden">
      {/* ============================================================ */}
      {/* 1. NAVBAR MINIMALISTA & ELEGANTE (Linear / Raycast Style)   */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo Oficial NumClick */}
          <Link href="/landing" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl overflow-hidden shadow-xs border border-slate-200/60 group-hover:scale-105 transition-transform flex items-center justify-center bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/numclick-badge.png"
                alt="NumClick Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                Num<span className="text-emerald-600">Click</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wide bg-slate-100 text-slate-600 border border-slate-200/70 px-1.5 py-0.5 rounded-md hidden sm:inline-block">
                SaaS
              </span>
            </div>
          </Link>

          {/* Navegação Desktop */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
            <a href="#exemplos" className="hover:text-slate-900 transition-colors">
              Exemplos
            </a>
            <a href="#comparativo" className="hover:text-slate-900 transition-colors">
              Antes & Depois
            </a>
            <a href="#recursos" className="hover:text-slate-900 transition-colors">
              Recursos
            </a>
            <a href="#calculadora" className="hover:text-slate-900 transition-colors">
              Calculadora
            </a>
            <a href="#precos" className="hover:text-slate-900 transition-colors">
              Preço
            </a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">
              Dúvidas
            </a>
          </nav>

          {/* Ações Rápidas */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span>Painel</span>
            </Link>

            <Link
              href="/criar-loja"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-xs hover:shadow active:scale-[0.98] transition-all"
            >
              <span>Testar Grátis por 7 Dias</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. HERO PRINCIPAL COM MOCKUP RESPONSIVO (FUNDO CLARO)       */}
      {/* ============================================================ */}
      <section className="relative pt-10 sm:pt-16 md:pt-20 pb-16 sm:pb-24 overflow-x-hidden bg-white">
        {/* Efeito sutil de luz ambiente no fundo */}
        <div className="absolute top-0 inset-x-0 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.09),transparent)] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5 sm:space-y-7 relative z-10">
          {/* Badge de Destaque no topo */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/90 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100/70 transition-colors max-w-full">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="truncate">Experimente por 7 dias grátis • Sem cartão de crédito</span>
          </div>

          {/* Título Principal curto e focado na conversão */}
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.14] max-w-3xl mx-auto break-words">
            Transforme seu WhatsApp em uma máquina de vendas, sem taxas por pedido.
          </h1>

          {/* Subtítulo direto */}
          <p className="text-sm xs:text-base sm:text-lg md:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Substitua PDFs pesados e conversas confusas por um catálogo rápido com seu domínio próprio, cores da sua marca e pedido detalhado direto no seu Zap.
          </p>

          {/* Grupo de CTAs de Alta Conversão */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-lg mx-auto">
            {/* Botão 1 (Destaque Principal de Conversão): 'Começar Teste de 7 Dias Grátis' */}
            <Link
              href="/criar-loja"
              title="Criar sua loja e testar 7 dias grátis sem cartão"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Começar Teste de 7 Dias Grátis</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </Link>

            {/* Botão 2 (Secundário Outline): 'Ver Demonstração ao Vivo' */}
            <Link
              href="#exemplos"
              title="Conhecer lojas de exemplo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs hover:border-slate-300 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Ver Demonstração ao Vivo</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          {/* Aviso sutil anti-objeção obrigatório */}
          <p className="text-xs text-slate-500 font-medium pt-1">
            Sem fidelidade • Cancele quando quiser • Comece em menos de 2 minutos
          </p>

          {/* Micro-prova de confiança sutil */}
          <div className="pt-1 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-500 font-normal">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
              Sem cartão de crédito
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
              Configuração em 2 minutos
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
              Sincronização em tempo real
            </span>
          </div>
        </div>

        {/* BLOCO: LOJAS DE EXEMPLO (3 BOTÕES DE REDIRECIONAMENTO) */}
        <div id="exemplos" className="mt-12 sm:mt-16 max-w-4xl mx-auto px-4 sm:px-6">
          {/* Cabeçalho Compacto das Lojas de Exemplo */}
          <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8 space-y-2 px-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              Lojas de Exemplo
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Veja modelos de catálogos prontos
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Acesse os exemplos abaixo e veja na prática como a navegação e a experiência de compra são rápidas:
            </p>
          </div>

          {/* 3 Botões de Redirecionamento para Páginas de Exemplo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 max-w-3xl mx-auto">
            {DEMO_STORES.map((store) => {
              const isExternalOrInternalLink =
                store.url.startsWith('http') || (store.url.startsWith('/') && store.url !== '#');

              return (
                <a
                  key={store.id}
                  href={store.url}
                  target={isExternalOrInternalLink ? '_blank' : undefined}
                  rel={isExternalOrInternalLink ? 'noopener noreferrer' : undefined}
                  className="group flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500/60 hover:shadow-md active:scale-[0.98] transition-all duration-200 text-left shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-50 text-slate-700 group-hover:text-emerald-700 flex items-center justify-center transition-colors flex-shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full flex-shrink-0">
                      {store.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {store.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {store.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-emerald-700 transition-colors">
                    <span>Acessar vitrine</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. SEÇÃO DE CONTRASTE 'ANTES & DEPOIS' (FUNDO ESCURO - DARK) */}
      {/* ============================================================ */}
      <section id="comparativo" className="py-20 sm:py-28 bg-slate-950 text-slate-100 border-y border-slate-800/80 overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-14">
          {/* Cabeçalho da Seção em Dark Mode */}
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
              Comparativo Prático
            </span>
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-white tracking-tight break-words">
              A diferença real na rotina do seu comércio
            </h2>
            <p className="text-xs xs:text-sm sm:text-base text-slate-400 leading-relaxed">
              Veja como você economiza tempo e elimina o estresse do atendimento manual no WhatsApp.
            </p>
          </div>

          {/* 2 Cards Lado a Lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            {/* Card 1: 'O Jeito Antigo' (Fundo sutil escuro com toques de alerta) */}
            <div className="rounded-3xl bg-rose-950/20 border border-rose-900/40 p-5 sm:p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/50 text-xs font-bold">
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    O Jeito Antigo
                  </span>
                  <span className="text-[11px] font-semibold text-rose-400">Sem sistema</span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  Conversas caóticas e perda diária de pedidos
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Muito esforço manual para pouca conversão, com clientes impacientes esperando respostas.
                </p>

                <ul className="space-y-3.5 pt-2">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-rose-950/60 border border-rose-800/50 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-xs sm:text-sm font-bold text-slate-200 block">
                        PDFs pesados de 40MB que travam o celular
                      </strong>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Arquivos lentos que demoram para baixar no 4G, enchem a memória do cliente e ficam desatualizados no dia seguinte.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-rose-950/60 border border-rose-800/50 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-xs sm:text-sm font-bold text-slate-200 block">
                        Cliente perguntando preço e tamanho o dia todo
                      </strong>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Dezenas de mensagens manuais no direct e no WhatsApp para tirar dúvidas básicas que poderiam estar visíveis com 1 clique.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-rose-950/60 border border-rose-800/50 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-xs sm:text-sm font-bold text-slate-200 block">
                        Pedidos anotados no papel com erro
                      </strong>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Anotações perdidas em comandas ou blocos de notas, esquecimento de adicionais, troco errado e endereço incompleto.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-rose-900/40 text-[11px] text-rose-400 font-medium">
                Resultado: Clientes desistem antes de comprar e o lojista perde horas no chat.
              </div>
            </div>

            {/* Card 2: 'Com Nosso Catálogo' (Card de Alto Destaque Dark com Borda Esmeralda) */}
            <div className="rounded-3xl bg-slate-900 border-2 border-emerald-500 p-5 sm:p-8 space-y-6 flex flex-col justify-between shadow-2xl shadow-emerald-950/40 relative ring-1 ring-emerald-500/20">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Com Nosso Catálogo
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Moderno & Rápido
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  Vendas rápidas, automáticas e organizadas
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  O cliente tem autonomia para navegar e o pedido chega pronto para faturar.
                </p>

                <ul className="space-y-3.5 pt-2">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-xs sm:text-sm font-bold text-white block">
                        Link limpo na bio do Instagram
                      </strong>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Carregamento instantâneo no navegador do celular, sem necessidade de baixar aplicativo e sempre atualizado em tempo real.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-xs sm:text-sm font-bold text-white block">
                        Cliente escolhe cor/tamanho e clica em pedir
                      </strong>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Fotos nítidas, variações organizadas, cálculo automático de frete ou retirada e botão para copiar chave PIX em 1 toque.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-xs sm:text-sm font-bold text-white block">
                        Pedido chega organizado e somado no WhatsApp
                      </strong>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Mensagem pré-formatada com itens, adicionais, dados de entrega e valor total calculado, pronto para você só despachar.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-800 text-[11px] text-emerald-400 font-semibold flex items-center justify-between">
                <span>Resultado: Mais vendas diárias e menos tempo no chat.</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. BENTO GRID DE RECURSOS (FUNDO CLARO - LIGHT)              */}
      {/* ============================================================ */}
      <section id="recursos" className="py-20 sm:py-28 bg-white border-b border-slate-200/80 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-14">
          {/* Cabeçalho do Bento Grid */}
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Tecnologia e Performance
            </span>
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight break-words">
              Tudo o que seu comércio precisa para vender em alto nível
            </h2>
            <p className="text-xs xs:text-sm sm:text-base text-slate-600 leading-relaxed">
              Recursos de alta conversão empacotados em uma interface limpa, sem complexidade de programação.
            </p>
          </div>

          {/* Grid Assimétrico 4 Blocos */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">
            {/* Bloco 1 (Largo - col-span-12 lg:col-span-7): 'Sua Marca, Seu Domínio' */}
            <div className="lg:col-span-7 bg-slate-50/80 border border-slate-200/80 rounded-3xl p-5 sm:p-8 space-y-6 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all">
              <div className="space-y-2.5">
                <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <Globe className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Sua Marca, Seu Domínio
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                  Tenha presença profissional no mercado. Use seu próprio domínio personalizado (ex: <code className="text-slate-800 font-mono text-xs bg-slate-200/70 px-1 py-0.5 rounded">sualoja.com.br</code>) ou subdomínio instantâneo, com conexão segura e otimização para carregamento mobile.
                </p>
              </div>

              {/* Input simulado de navegador com URL e Badge SSL */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-1.5 pb-1">
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  <span className="text-[10px] text-slate-400 ml-2 font-mono truncate">Navegador do Cliente</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-2 flex items-center justify-between text-xs font-mono shadow-inner gap-2 overflow-hidden">
                  <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-400 text-[11px] hidden sm:inline">https://</span>
                    <span className="text-slate-900 font-semibold text-xs truncate">
                      loja.seudominio.com.br
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 flex-shrink-0">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="hidden sm:inline">Certificado </span>SSL Grátis
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Sem menções a terceiros
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Hospedagem inclusa
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Pronto para bio
                  </span>
                </div>
              </div>
            </div>

            {/* Bloco 2 (Médio - col-span-12 lg:col-span-5): 'Zero Comissões' */}
            <div className="lg:col-span-5 bg-slate-900 text-white rounded-3xl p-5 sm:p-8 space-y-6 flex flex-col justify-between shadow-lg">
              <div className="space-y-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Percent className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Zero Comissões
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  100% do lucro das suas vendas fica direto com você. Sem cobrança de porcentagem por pedido e sem reter dinheiro das suas vendas.
                </p>
              </div>

              {/* Destaque Visual 100% do Lucro */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 text-center space-y-3">
                <div className="space-y-0.5">
                  <span className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight block">
                    100%
                  </span>
                  <span className="text-xs text-slate-300 font-semibold tracking-wide uppercase">
                    Do lucro fica com o lojista
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-left">
                    <span className="text-slate-500 block text-[10px]">Marketplaces</span>
                    <span className="text-rose-400 font-bold text-xs">18% a 27%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-left">
                    <span className="text-slate-400 block text-[10px]">NumClick</span>
                    <span className="text-emerald-400 font-bold text-xs">0% (R$ 0,00)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 3 (Médio - col-span-12 lg:col-span-5): 'Painel Simples no Celular' */}
            <div className="lg:col-span-5 bg-slate-50/80 border border-slate-200/80 rounded-3xl p-5 sm:p-8 space-y-6 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all">
              <div className="space-y-2.5">
                <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Painel Simples no Celular
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Altere preços, estoque e fotos em segundos. Funciona perfeitamente direto pelo navegador do smartphone ou computador.
                </p>
              </div>

              {/* Ilustração Visual de Edição Rápida */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-900">Edição Rápida</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                    Salvo na hora
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Preço Promocional</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-bold text-slate-900">
                        R$ 38,90
                      </span>
                      <span className="text-[10px] text-slate-400 line-through">R$ 44,90</span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                        -13% OFF
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-600 text-xs">Status do Estoque:</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Pronta Entrega
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 4 (Largo - col-span-12 lg:col-span-7): 'Pedido Pré-Formatado' */}
            <div className="lg:col-span-7 bg-slate-50/80 border border-slate-200/80 rounded-3xl p-5 sm:p-8 space-y-6 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all">
              <div className="space-y-2.5">
                <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Pedido Pré-Formatado
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                  Adeus conversas truncadas. O cliente aperta um botão e você recebe uma mensagem padronizada no WhatsApp com item, tamanho, quantidade e subtotal calculado.
                </p>
              </div>

              {/* Caixa de Mensagem Realista do WhatsApp */}
              <div className="bg-[#EFEAE2] border border-slate-300/80 rounded-2xl p-3 sm:p-4 space-y-2 shadow-inner">
                <div className="flex items-center justify-between text-[11px] text-slate-600 pb-1 border-b border-slate-300/40">
                  <div className="flex items-center gap-1.5">
                    <div className="h-4 w-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">
                      W
                    </div>
                    <span className="font-semibold text-slate-800 truncate">WhatsApp da sua Loja</span>
                  </div>
                  <span className="text-[10px] text-slate-500 flex-shrink-0">Hoje às 14:32</span>
                </div>

                {/* Balão do WhatsApp */}
                <div className="bg-white rounded-xl rounded-tl-xs p-3 text-xs text-slate-800 shadow-xs space-y-1.5 border border-slate-200/60 max-w-lg">
                  <p className="font-bold text-slate-900 text-[11px]">
                    👋 Olá! Gostaria de fazer o seguinte pedido:
                  </p>
                  <div className="border-t border-slate-100 pt-1.5 space-y-1 text-[11px] font-mono leading-relaxed">
                    <p className="font-bold text-slate-900 font-sans">
                      🛍️ 1x Double Smash Bacon Especial
                    </p>
                    <p className="text-slate-600 text-[10px]">
                      • Ponto: Ao ponto | Molho: Da Casa
                    </p>
                    <p className="text-slate-600 text-[10px]">
                      • Tipo: Entrega (Rua das Flores, 142 - Apto 32B)
                    </p>
                    <p className="text-slate-600 text-[10px]">
                      • Pagamento: PIX (chave copiada no catálogo)
                    </p>
                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between font-sans text-xs">
                      <span className="font-extrabold text-slate-900">Total: R$ 44,90</span>
                      <span className="text-[10px] text-slate-400">14:32 ✓✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. CALCULADORA DE ECONOMIA (FUNDO ESCURO - DARK)             */}
      {/* ============================================================ */}
      <section id="calculadora" className="py-20 sm:py-28 bg-slate-950 text-slate-100 border-y border-slate-800/80 overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
              Calculadora de Economia Real
            </span>
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-white tracking-tight break-words">
              Quanto você deixa na mesa todos os meses em taxas abusivas?
            </h2>
            <p className="text-xs xs:text-sm sm:text-base text-slate-400 leading-relaxed">
              Arraste os seletores abaixo e veja na ponta do lápis quanto sobra no seu bolso vendendo com catálogo próprio.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-10 shadow-2xl">
            {/* Controles da Calculadora */}
            <div className="lg:col-span-7 space-y-7">
              {/* Slider 1: Faturamento */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-slate-300 flex items-center gap-1.5 sm:gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Faturamento Mensal Estimado:</span>
                  </label>
                  <span className="text-base sm:text-xl font-extrabold text-emerald-400">
                    {formatCurrency(monthlyRevenue, 'BRL')}
                  </span>
                </div>
                <input
                  type="range"
                  min={3000}
                  max={80000}
                  step={1000}
                  value={monthlyRevenue}
                  onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>R$ 3.000</span>
                  <span>R$ 40.000</span>
                  <span>R$ 80.000+</span>
                </div>
              </div>

              {/* Slider 2: Taxa de Marketplace */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-slate-300 flex items-center gap-1.5 sm:gap-2">
                    <Sliders className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Taxa Cobrada por Marketplaces:</span>
                  </label>
                  <span className="text-base sm:text-xl font-extrabold text-amber-400">
                    {marketplaceFee}% por pedido
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={28}
                  step={1}
                  value={marketplaceFee}
                  onChange={(e) => setMarketplaceFee(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>10% (Mínima)</span>
                  <span>18% (Média delivery)</span>
                  <span>28% (Máxima)</span>
                </div>
              </div>

              {/* Comparativo Rápido */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1 text-xs">
                <div className="p-3 sm:p-3.5 rounded-2xl bg-rose-950/30 border border-rose-900/40">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-rose-400 block leading-tight">Comissão Perdida/Mês:</span>
                  <span className="text-sm sm:text-lg font-black text-rose-200 mt-0.5 block truncate">
                    {formatCurrency(monthlyFeeAmount, 'BRL')}
                  </span>
                </div>
                <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-900/40">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 block leading-tight">Comissão no NumClick:</span>
                  <span className="text-sm sm:text-lg font-black text-emerald-300 mt-0.5 block truncate">
                    R$ 0,00 (0%)
                  </span>
                </div>
              </div>
            </div>

            {/* Resultado do Lucro Retido */}
            <div className="lg:col-span-5 bg-gradient-to-b from-emerald-950/40 to-slate-950 p-6 sm:p-8 rounded-3xl border border-emerald-500/30 text-center space-y-4 sm:space-y-5">
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Economia Real
              </span>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">Você economiza anualmente cerca de:</span>
                <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight block">
                  {formatCurrency(yearlySavings, 'BRL')}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  livres de taxas para reinvestir no seu comércio ou lucro puro.
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Custo Anual (R$ 79,90/mês):</span>
                  <span className="font-semibold text-white">{formatCurrency(saasYearlyCost, 'BRL')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Taxa por pedido:</span>
                  <span className="font-bold text-emerald-400">0% (Isento)</span>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  href="/criar-loja"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <span>Testar Grátis por 7 Dias</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-[11px] text-center text-slate-400 font-medium">
                  Sem fidelidade • Cancele quando quiser • Comece em menos de 2 minutos
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. PROVA SOCIAL & DEPOIMENTOS DE LOJISTAS (FUNDO CLARO)      */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-28 bg-slate-50/70 border-b border-slate-200/80 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-14">
          {/* Métricas Principais da Plataforma */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 text-center space-y-1 shadow-2xs">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] block tracking-tight">1.200+</span>
              <span className="text-xs text-slate-500 font-medium block">Lojas Ativas</span>
            </div>
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 text-center space-y-1 shadow-2xs">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] block tracking-tight">R$ 4.8M+</span>
              <span className="text-xs text-slate-500 font-medium block">Transacionados</span>
            </div>
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 text-center space-y-1 shadow-2xs">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 block tracking-tight">R$ 0,00</span>
              <span className="text-xs text-slate-500 font-medium block">Retido em Taxas</span>
            </div>
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 text-center space-y-1 shadow-2xs">
              <div className="flex items-center justify-center gap-1 text-amber-500">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] block tracking-tight">4.9</span>
                <Star className="w-4 h-4 fill-amber-500 text-amber-500 inline" />
              </div>
              <span className="text-xs text-slate-500 font-medium block">Avaliação dos Lojistas</span>
            </div>
          </div>

          {/* Depoimentos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 flex flex-col justify-between space-y-4 shadow-2xs">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                &ldquo;Economizamos mais de R$ 2.400 por mês que antes iam embora em comissões de delivery. O cliente monta o lanche, copia o PIX e o pedido cai no nosso WhatsApp 100% pronto.&rdquo;
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-100 flex-shrink-0">
                  FC
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Felipe Costa</h4>
                  <span className="text-[11px] text-slate-400 block">Artesanal Burger & Beer • SP</span>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 flex flex-col justify-between space-y-4 shadow-2xs">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                &ldquo;Nossa loja no Instagram converteu muito mais depois que colocamos o link na bio. O cliente vê os tamanhos disponíveis na hora e não fica horas perguntando preço no direct.&rdquo;
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 flex-shrink-0">
                  CD
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Camila Duarte</h4>
                  <span className="text-[11px] text-slate-400 block">Bella Flor Boutique • MG</span>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 flex flex-col justify-between space-y-4 shadow-2xs">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                &ldquo;Atualizo os preços no painel administrativo direto pelo celular e em 5 segundos já tá no ar para os clientes. Praticidade nota 10, sem complicação de programação.&rdquo;
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-100 flex-shrink-0">
                  MS
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Mariana Souza</h4>
                  <span className="text-[11px] text-slate-400 block">Glow Natural Skincare • PR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. SEÇÃO DE PREÇO ÚNICO (FUNDO CLARO - ITENS SOLICITADOS)    */}
      {/* ============================================================ */}
      <section id="precos" className="py-20 sm:py-28 bg-white max-w-4xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-14 overflow-x-hidden">
        <div className="text-center max-w-xl mx-auto space-y-2.5">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Preço Transparente
          </span>
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight break-words">
            Um único plano, sem pegadinhas nem fidelidade
          </h2>
          <p className="text-xs xs:text-sm sm:text-base text-slate-600">
            Acesso irrestrito a todos os recursos da plataforma para vender mais no WhatsApp.
          </p>
        </div>

        {/* Selos em Destaque: 'Sem fidelidade' e 'Sem taxas sobre suas vendas' */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-1">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Sem fidelidade</span>
            <span className="text-slate-400 font-normal hidden sm:inline">(Cancele quando quiser)</span>
          </div>

          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 shadow-2xs">
            <Percent className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Sem taxas sobre suas vendas</span>
            <span className="text-emerald-700 font-normal hidden sm:inline">(0% de comissão)</span>
          </div>

          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 shadow-2xs">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Experimente por 7 dias grátis</span>
            <span className="text-emerald-700 font-normal hidden sm:inline">(Sem cartão)</span>
          </div>
        </div>

        {/* Card Único de Plano Mensal com Itens Solicitados */}
        <div className="max-w-md mx-auto">
          <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative ring-1 ring-slate-900/10">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-3.5 sm:px-4 py-1 rounded-full whitespace-nowrap shadow-md max-w-[92%] truncate text-center">
              Plano Único Exclusivo • 7 Dias Grátis
            </span>

            <div className="space-y-4 pt-1">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Mensalidade Única</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Liberdade total para o lojista, sem compromisso de longo prazo
                </p>
              </div>

              <div className="border-y border-slate-100 py-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">R$ 79,90</span>
                  <span className="text-xs sm:text-sm text-slate-500 font-medium">/mês</span>
                  <span className="ml-auto text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                    Apenas R$ 2,66/dia
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1.5">
                  Experimente por 7 dias grátis • Sem cartão de crédito para iniciar
                </span>
              </div>

              {/* Lista dos Recursos Inclusos */}
              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span><strong>Suporte Direto</strong> humanizado no WhatsApp</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span><strong>Painel de Gestão</strong> para celular e computador</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span><strong>Atualizações Ilimitadas</strong> (produtos, fotos e preços)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Chave PIX com cópia rápida em 1 clique</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span><strong>Catálogo Rápido</strong> pronto para a bio do Instagram</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span><strong>0% de taxas</strong> sobre suas vendas (lucro 100% seu)</span>
                </li>
              </ul>
            </div>

            {/* Ações: CTA Principal de Conversão Imediata + Suporte WhatsApp */}
            <div className="space-y-2.5 pt-2">
              <Link
                href="/criar-loja"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>Começar Teste de 7 Dias Grátis</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </Link>

              <p className="text-[11px] text-center text-slate-500 font-medium py-0.5">
                Sem fidelidade • Cancele quando quiser • Comece em menos de 2 minutos
              </p>

              <a
                href={commercialWhatsappHireUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-slate-500 hover:text-emerald-700 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Prefere falar com um especialista no WhatsApp?</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. PERGUNTAS FREQUENTES (FAQ) (FUNDO SUAVE - LIGHT)          */}
      {/* ============================================================ */}
      <section id="faq" className="py-20 sm:py-28 bg-slate-50/70 border-t border-slate-200/80 overflow-x-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Tire Suas Dúvidas
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-white border border-slate-200/80 overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {item.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. CTA FINAL DE CONVERSÃO (FUNDO ESCURO - DARK)              */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-28 bg-slate-900 text-white text-center border-t border-slate-800 overflow-x-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Experimente por 7 dias grátis</span>
          </div>

          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold tracking-tight break-words">
            Pronto para ver suas vendas no WhatsApp decolarem?
          </h2>
          <p className="text-xs xs:text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Experimente por 7 dias grátis. Não precisa de cartão de crédito e sua loja fica pronta em menos de 2 minutos.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/criar-loja"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <span>Começar Teste de 7 Dias Grátis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href={commercialWhatsappHireUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Falar no WhatsApp Comercial</span>
            </a>
          </div>

          {/* Aviso sutil anti-objeção obrigatório */}
          <p className="text-xs text-slate-400 font-medium pt-1">
            Sem fidelidade • Cancele quando quiser • Comece em menos de 2 minutos
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 10. RODAPÉ MINIMALISTA (FUNDO ESCURO - DARK)                 */}
      {/* ============================================================ */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 pb-24 md:pb-12 text-xs text-slate-400 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/numclick-badge.png"
                    alt="NumClick Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-base font-extrabold tracking-tight text-white">
                  Num<span className="text-emerald-400">Click</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Feito para fortalecer o comércio local
              </p>
            </div>

            {/* Links rápidos de contato e navegação */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-300">
              <a
                href={commercialWhatsappHireUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Comercial</span>
              </a>
              <Link href="/criar-loja" className="hover:text-white transition-colors">
                Criar Loja
              </Link>
              <Link href="/admin/login" className="hover:text-white transition-colors">
                Painel do Lojista
              </Link>
              <Link href="/saas-admin" className="hover:text-white transition-colors">
                Administração SaaS
              </Link>
            </div>
          </div>

          {/* Linha de Termos simples e Copyright */}
          <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} NumClick SaaS. Todos os direitos reservados.</p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-slate-500">
              <span>Termos de Uso Simplificados</span>
              <span>•</span>
              <span>Privacidade e Segurança</span>
              <span>•</span>
              <span>0% de Comissões por Venda</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ============================================================ */}
      {/* BOTÃO FLUTUANTE DE WHATSAPP (MOBILE ONLY - CANTO INFERIOR)   */}
      {/* ============================================================ */}
      <div className="fixed bottom-4 right-4 z-50 md:hidden">
        <a
          href={specialistWhatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-950/25 active:scale-95 transition-all ring-2 ring-white/90"
          aria-label="Falar com Especialista no WhatsApp"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          <MessageCircle className="w-4 h-4" />
          <span>Falar com Especialista</span>
        </a>
      </div>
    </div>
  );
}
