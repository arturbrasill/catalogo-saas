'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Check,
  Zap,
  TrendingUp,
  ShieldCheck,
  Clock,
  QrCode,
  Smartphone,
  Store,
  DollarSign,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  FileSpreadsheet,
  Palette,
  ExternalLink,
  Percent,
  Sliders,
  HelpCircle,
  Star,
  Users,
  Award,
} from 'lucide-react';
import { formatCurrency } from '@/lib/whatsapp';

// Mock de nichos para demonstração interativa
const DEMO_NICHES = [
  {
    id: 'food',
    name: 'Burgers & Delivery',
    storeName: 'Artesanal Burger & Beer',
    category: 'Hambúrgueres Artesanais',
    productName: 'Double Smash Bacon Especial',
    price: 38.9,
    oldPrice: 44.9,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    options: 'Ponto da carne, Queijo cheddar, Molho da casa',
    deliveryTime: '30-45 min',
  },
  {
    id: 'fashion',
    name: 'Moda & Roupas',
    storeName: 'Bella Flor Boutique',
    category: 'Vestidos & Coleção Verão',
    productName: 'Vestido Midi Floral Elegance',
    price: 189.9,
    oldPrice: 229.9,
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80',
    options: 'Tamanhos P, M, G | Cores: Terracota, Verde Oliva',
    deliveryTime: 'Envio Rápido / Retirada',
  },
  {
    id: 'beauty',
    name: 'Cosméticos & Skincare',
    storeName: 'Glow Natural Beauty',
    category: 'Cuidados com a Pele',
    productName: 'Sérum Facial Vitamina C 15%',
    price: 89.9,
    oldPrice: 119.9,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80',
    options: 'Frasco 30ml | Vegano & Cruelty-free',
    deliveryTime: 'Pronta Entrega',
  },
  {
    id: 'shoes',
    name: 'Calçados & Tênis',
    storeName: 'Passo Firme Calçados',
    category: 'Tênis Urbanos',
    productName: 'Sneaker Streetwear Couro Branco',
    price: 249.9,
    oldPrice: 299.9,
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80',
    options: 'Numeração 38 ao 43',
    deliveryTime: 'Retirada na Loja / Frete',
  },
];

// Perguntas frequentes
const FAQ_ITEMS = [
  {
    question: 'Vocês cobram alguma comissão ou porcentagem sobre as minhas vendas?',
    answer:
      'NÃO! Cobramos ZERO comissão por pedido. Você paga apenas a mensalidade fixa do sistema e todo o dinheiro das suas vendas cai direto na sua conta bancária (via PIX, dinheiro ou maquininha). Não retemos um único centavo.',
  },
  {
    question: 'Como os pedidos chegam para mim?',
    answer:
      'O cliente monta a sacola no catálogo pelo celular, escolhe os adicionais/tamanhos, seleciona se quer entrega (com endereço e bairro) ou retirada, escolhe a forma de pagamento (com opção de copiar sua chave PIX com 1 clique) e clica em enviar. O pedido chega no seu WhatsApp 100% pronto e formatado, sem você perder tempo digitando.',
  },
  {
    question: 'Como atualizo meus produtos, preços e fotos?',
    answer:
      'Você tem duas opções simples: atualizar pelo Painel Administrativo no navegador do celular ou direto pela sua Planilha Google Sheets! Mudou o preço ou estoque na planilha, o catálogo atualiza na mesma hora.',
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
    question: 'Como funciona o teste grátis de 30 dias?',
    answer:
      'Você cria sua loja agora mesmo sem precisar cadastrar cartão de crédito. Usa todas as funcionalidades completas durante 30 dias. Só continua se o catálogo realmente aumentar suas vendas.',
  },
];

export default function SaaSCommercialLandingPage() {
  // Estado da calculadora de economia
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(15000);
  const [marketplaceFee, setMarketplaceFee] = useState<number>(18);
  const [selectedNiche, setSelectedNiche] = useState(DEMO_NICHES[0]!);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Cálculos da calculadora
  const monthlyFeeAmount = (monthlyRevenue * marketplaceFee) / 100;
  const yearlyMarketplaceLoss = monthlyFeeAmount * 12;
  const saasYearlyCost = billingCycle === 'yearly' ? 99.9 * 12 : 129.9 * 12;
  const yearlySavings = Math.max(0, yearlyMarketplaceLoss - saasYearlyCost);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white font-sans">
      {/* ============================================================ */}
      {/* 1. BARRA SUPERIOR / HEADER FIXO */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo & Marca */}
          <Link href="/landing" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-white">
                  Catálogo<span className="text-emerald-400">Zap</span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md hidden sm:inline-block">
                  SaaS Oficial
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                Vendas no WhatsApp Sem Taxas
              </span>
            </div>
          </Link>

          {/* Navegação Desktop */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#diferenciais" className="hover:text-emerald-400 transition">
              Diferenciais
            </a>
            <a href="#calculadora" className="hover:text-emerald-400 transition">
              Calculadora de Economia
            </a>
            <a href="#demonstracao" className="hover:text-emerald-400 transition">
              Demonstração ao Vivo
            </a>
            <a href="#precos" className="hover:text-emerald-400 transition">
              Planos & Preços
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition">
              Dúvidas
            </a>
          </nav>

          {/* Ações e CTAs */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/login"
              className="hidden sm:inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Painel do Lojista</span>
            </Link>

            <Link
              href="/criar-loja"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:brightness-110 shadow-lg shadow-emerald-500/25 active:scale-95 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Criar Loja Grátis</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. HERO SECTION */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-24">
        {/* Glows de Fundo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[750px] h-[350px] bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6 sm:space-y-8">
          {/* Badge de Destaque */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-bold shadow-md shadow-emerald-950/40 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>A plataforma mais rápida para transformar seu WhatsApp em catálogo de vendas</span>
          </div>

          {/* Título Principal */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Venda no WhatsApp com a velocidade de um app moderno{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              e ZERO comissões.
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="text-sm sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Diga adeus aos PDFs pesados e às comissões de até 27% dos marketplaces. Seu cliente monta a sacola,
            escolhe entrega ou retirada, copia sua chave PIX com 1 clique e o pedido chega{' '}
            <strong className="text-slate-200">100% pronto no seu WhatsApp</strong>.
          </p>

          {/* CTAs do Hero */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <Link
              href="/criar-loja"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl text-sm sm:text-base font-extrabold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:brightness-110 shadow-xl shadow-emerald-500/30 active:scale-98 transition cursor-pointer"
            >
              <span>Testar 30 Dias Grátis</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <a
              href="#demonstracao"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm sm:text-base font-bold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 transition cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Ver Demonstração</span>
            </a>
          </div>

          {/* Badges de Confiança */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Sem cartão para testar
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Configure em 2 minutos
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Integrado com Google Sheets
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. CALCULADORA DE ECONOMIA (MARKETPLACE X NOSSO CATÁLOGO) */}
      {/* ============================================================ */}
      <section id="calculadora" className="py-16 sm:py-24 bg-slate-900/50 border-y border-slate-800/80 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Percent className="w-3.5 h-3.5" />
              Calculadora de Economia Real
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Quanto você deixa na mesa todos os meses em taxas abusivas?
            </h2>
            <p className="text-xs sm:text-base text-slate-400">
              Arraste os seletores abaixo e veja na ponta do lápis quanto sobra no seu bolso vendendo com catálogo próprio.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
            {/* Controles da Calculadora */}
            <div className="lg:col-span-7 space-y-8">
              {/* Slider 1: Faturamento */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-slate-300 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Seu Faturamento Mensal Estimado:
                  </label>
                  <span className="text-base sm:text-xl font-black text-emerald-400">
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
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>R$ 3.000</span>
                  <span>R$ 40.000</span>
                  <span>R$ 80.000+</span>
                </div>
              </div>

              {/* Slider 2: Taxa de Marketplace */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-slate-300 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    Taxa Média Cobrada por Marketplaces / Apps:
                  </label>
                  <span className="text-base sm:text-xl font-black text-amber-400">
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
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>10% (Taxa mínima)</span>
                  <span>18% (Média de delivery)</span>
                  <span>28% (Comissão máxima)</span>
                </div>
              </div>

              {/* Comparativo Rápido */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-900/40">
                  <span className="text-[11px] font-semibold text-rose-400 block">Comissão Perdida/Mês:</span>
                  <span className="text-base sm:text-lg font-black text-rose-200">
                    {formatCurrency(monthlyFeeAmount, 'BRL')}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-900/40">
                  <span className="text-[11px] font-semibold text-emerald-400 block">Comissão no Catálogo Zap:</span>
                  <span className="text-base sm:text-lg font-black text-emerald-300">
                    R$ 0,00 (0%)
                  </span>
                </div>
              </div>
            </div>

            {/* Resultado do Lucro Retido */}
            <div className="lg:col-span-5 bg-gradient-to-b from-emerald-950/40 to-slate-950 p-6 sm:p-8 rounded-3xl border border-emerald-500/30 text-center space-y-5">
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Economia Real no Seu Bolso
              </span>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">Você economiza anualmente cerca de:</span>
                <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight block">
                  {formatCurrency(yearlySavings, 'BRL')}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  livres de taxas para reinvestir em estoque, marketing ou lucro puro.
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Custo Anual do Catálogo SaaS:</span>
                  <span className="font-bold text-slate-200">{formatCurrency(saasYearlyCost, 'BRL')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Taxas por cada venda:</span>
                  <span className="font-bold text-emerald-400">0% (Isento)</span>
                </div>
              </div>

              <Link
                href="/criar-loja"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-xs sm:text-sm font-extrabold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                <span>Garantir Minha Economia Agora</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. DEMONSTRAÇÃO INTERATIVA & PREVIEW MOBILE */}
      {/* ============================================================ */}
      <section id="demonstracao" className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Smartphone className="w-3.5 h-3.5" />
            Experiência do Consumidor
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Veja como seu cliente compra em menos de 40 segundos
          </h2>
          <p className="text-xs sm:text-base text-slate-400">
            Selecione um segmento abaixo para ver a velocidade e a beleza do catálogo adaptado para qualquer tipo de negócio.
          </p>

          {/* Abas de Nichos */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
            {DEMO_NICHES.map((niche) => {
              const active = selectedNiche.id === niche.id;
              return (
                <button
                  key={niche.id}
                  type="button"
                  onClick={() => setSelectedNiche(niche)}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    active
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {niche.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mockup do Smartphone com o Catálogo */}
        <div className="max-w-md mx-auto bg-slate-900 border-4 border-slate-700/80 rounded-[42px] p-3 shadow-2xl shadow-emerald-950/50 relative">
          {/* Câmera / Notch do Celular */}
          <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-2" />

          {/* Tela do Celular */}
          <div className="bg-white rounded-[32px] overflow-hidden text-slate-900 flex flex-col shadow-inner">
            {/* Header Simulado do Catálogo */}
            <div className="bg-white p-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center font-black text-emerald-700 text-xs">
                  {selectedNiche.storeName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 leading-none">{selectedNiche.storeName}</h4>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Aberto agora • {selectedNiche.deliveryTime}
                  </span>
                </div>
              </div>
              <div className="h-7 w-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-black shadow-xs">
                1
              </div>
            </div>

            {/* Imagem e Detalhes do Produto */}
            <div className="p-3.5 space-y-3 bg-slate-50">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedNiche.image}
                  alt={selectedNiche.productName}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                  Destaque da Loja
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  {selectedNiche.category}
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                  {selectedNiche.productName}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{selectedNiche.options}</p>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-black text-emerald-600">
                    {formatCurrency(selectedNiche.price, 'BRL')}
                  </span>
                  <span className="text-xs text-slate-400 line-through">
                    {formatCurrency(selectedNiche.oldPrice, 'BRL')}
                  </span>
                </div>
              </div>

              {/* Bloco de Ação Rápida PIX */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-emerald-950 font-bold">
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px]">Chave PIX rápida com 1 clique</span>
                </div>
                <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-black px-1.5 py-0.5 rounded">
                  Copiar
                </span>
              </div>

              {/* Botão de Envio WhatsApp */}
              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Pedir no WhatsApp • {formatCurrency(selectedNiche.price, 'BRL')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. DIFERENCIAIS E FUNCIONALIDADES DO SISTEMA */}
      {/* ============================================================ */}
      <section id="diferenciais" className="py-16 sm:py-24 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              Recursos de Alta Performance
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Tudo o que seu comércio precisa para vender mais todo dia
            </h2>
            <p className="text-xs sm:text-base text-slate-400">
              Desenvolvido ouvindo donos de lojas reais: nada de complicação técnica, apenas velocidade e conversão.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white">0% de Comissões por Venda</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Todo o lucro da venda é seu. Sem surpresas na fatura no fim do mês e sem porcentagens descontadas dos seus produtos.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition">
              <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white">Google Sheets como Banco de Dados</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Altere preços, estoque e adicione fotos pelo celular no aplicativo do Google Sheets ou no Painel Administrativo.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white">Chave PIX Rápida com 1 Clique</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                O cliente copia sua chave no checkout sem precisar pedir no WhatsApp, acelerando pagamentos e reduzindo desistências.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white">Horário & Status Aberto/Fechado</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Com apenas 1 toque você define se está aberto agora ou recebendo pedidos agendados para abertura com aviso amigável.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white">Sua Marca & Identidade Visual</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Personalize com suas cores institucionais, banners rotativos de promoções e logotipo próprio em alta definição.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white">Checkout em 2 Etapas Otimizado</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                O cliente escolhe entrega ou retirada, informa endereço, método de pagamento e troco. Retém dados para compras futuras.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5.5. PROVA SOCIAL, MÉTRICAS E DEPOIMENTOS DE LOJISTAS        */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-900/60 to-slate-950 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16">
          {/* Métricas Principais da Plataforma */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
              <span className="text-2xl sm:text-4xl font-black text-emerald-400 block tracking-tight">1.200+</span>
              <span className="text-xs text-slate-400 font-semibold block">Lojas Ativas no Brasil</span>
            </div>
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
              <span className="text-2xl sm:text-4xl font-black text-teal-300 block tracking-tight">R$ 4.8M+</span>
              <span className="text-xs text-slate-400 font-semibold block">Em Pedidos Transacionados</span>
            </div>
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
              <span className="text-2xl sm:text-4xl font-black text-cyan-400 block tracking-tight">R$ 0,00</span>
              <span className="text-xs text-slate-400 font-semibold block">Retido em Comissões</span>
            </div>
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-amber-400">
                <span className="text-2xl sm:text-4xl font-black block tracking-tight">4.9</span>
                <Star className="w-5 h-5 fill-amber-400 text-amber-400 inline" />
              </div>
              <span className="text-xs text-slate-400 font-semibold block">Avaliação dos Lojistas</span>
            </div>
          </div>

          {/* Título da Seção de Depoimentos */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              Histórias de Sucesso
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Quem usa, não volta para os marketplaces
            </h2>
            <p className="text-xs sm:text-base text-slate-400">
              Veja como negócios locais estão aumentando suas margens de lucro com catálogo próprio.
            </p>
          </div>

          {/* Cards de Depoimentos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Depoimento 1 */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  &ldquo;Economizamos mais de R$ 2.400 todos os meses que antes iam embora em taxas de delivery. O cliente monta o lanche, escolhe os adicionais, copia o PIX e o pedido cai no nosso WhatsApp 100% pronto.&rdquo;
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/30">
                  FC
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Felipe Costa</h4>
                  <span className="text-[11px] text-slate-400 block">Artesanal Burger & Beer • SP</span>
                </div>
              </div>
            </div>

            {/* Depoimento 2 */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  &ldquo;Nossa loja no Instagram explodiu depois que colocamos o link do catálogo na bio. O cliente vê os tamanhos disponíveis na mesma hora e não fica horas perguntando &apos;quanto custa&apos; no direct.&rdquo;
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-teal-500/20 text-teal-400 font-black text-xs flex items-center justify-center border border-teal-500/30">
                  CD
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Camila Duarte</h4>
                  <span className="text-[11px] text-slate-400 block">Bella Flor Boutique • MG</span>
                </div>
              </div>
            </div>

            {/* Depoimento 3 */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  &ldquo;Atualizo os preços e o estoque na minha planilha do Google Sheets direto pelo celular e em 5 segundos já tá no ar para os clientes. Praticidade nota 10, sem complicação de programação.&rdquo;
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-cyan-500/20 text-cyan-400 font-black text-xs flex items-center justify-center border border-cyan-500/30">
                  MS
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Mariana Souza</h4>
                  <span className="text-[11px] text-slate-400 block">Glow Natural Skincare • PR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. TABELA DE PLANOS & PREÇOS */}
      {/* ============================================================ */}
      <section id="precos" className="py-16 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <DollarSign className="w-3.5 h-3.5" />
            Planos Sem Pegadinhas
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Investimento acessível que se paga nas primeiras vendas
          </h2>
          <p className="text-xs sm:text-base text-slate-400">
            Comece com 30 dias de teste grátis. Cancele quando quiser, sem multas nem contratos de fidelidade.
          </p>

          {/* Toggle Mensal / Anual */}
          <div className="pt-4 flex items-center justify-center gap-3 text-xs sm:text-sm font-bold">
            <span className={billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}>
              Faturamento Mensal
            </span>
            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="w-14 h-8 bg-slate-800 rounded-full p-1 transition cursor-pointer border border-slate-700 relative"
              aria-label="Alternar ciclo de pagamento"
            >
              <div
                className={`w-6 h-6 rounded-full bg-emerald-400 transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`flex items-center gap-1 ${billingCycle === 'yearly' ? 'text-emerald-400' : 'text-slate-400'}`}>
              <span>Faturamento Anual</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-black">
                -23% OFF
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Plano Mensal */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-extrabold text-white">Plano Mensal Flexível</h3>
                <p className="text-xs text-slate-400 mt-1">Ideal para começar e testar sem compromisso anual.</p>
              </div>

              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-white">R$ 129,90</span>
                  <span className="text-xs text-slate-400 font-semibold">/mês</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-bold block mt-1">
                  Primeiros 30 dias 100% grátis
                </span>
              </div>

              <ul className="space-y-3 pt-2 text-xs sm:text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Produtos e fotos ilimitados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Pedidos ilimitados no WhatsApp</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Chave PIX com botão de copiar</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Google Sheets integrado em tempo real</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Painel Admin do Lojista no celular</span>
                </li>
              </ul>
            </div>

            <Link
              href="/criar-loja?plan=monthly"
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
            >
              <span>Começar Teste de 30 Dias</span>
            </Link>
          </div>

          {/* Plano Anual Recomendado */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative shadow-2xl shadow-emerald-950/40">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
              Mais Escolhido pelos Lojistas
            </span>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-extrabold text-white">Plano Anual Pro</h3>
                <p className="text-xs text-slate-400 mt-1">Máxima economia com todos os recursos liberados.</p>
              </div>

              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400">R$ 99,90</span>
                  <span className="text-xs text-slate-400 font-semibold">/mês</span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Cobrado anualmente (R$ 1.198,80) • <strong>Economia de R$ 360,00</strong>
                </span>
              </div>

              <ul className="space-y-3 pt-2 text-xs sm:text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span><strong>Tudo</strong> do plano mensal</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Suporte prioritário VIP via WhatsApp</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Suporte a Domínio Próprio (.com.br)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Auxílio gratuito na configuração da planilha</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Garantia incondicional de 15 dias</span>
                </li>
              </ul>
            </div>

            <Link
              href="/criar-loja?plan=yearly"
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:brightness-110 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <span>Garantir Plano Anual com Desconto</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. PERGUNTAS FREQUENTES (FAQ) */}
      {/* ============================================================ */}
      <section id="faq" className="py-16 sm:py-24 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              Tire Suas Dúvidas
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Perguntas Frequentes
            </h2>
            <p className="text-xs sm:text-base text-slate-400">
              Tudo o que você precisa saber antes de começar seu teste gratuito.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-white leading-snug">
                      {item.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60">
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
      {/* 8. CTA FINAL DE CONVERSÃO */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-24 relative overflow-hidden bg-gradient-to-b from-slate-950 via-emerald-950/20 to-slate-950 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-300 mx-auto flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/20">
            <Sparkles className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Pronto para ver suas vendas no WhatsApp decolarem?
          </h2>

          <p className="text-xs sm:text-base text-slate-400 max-w-xl mx-auto">
            Crie seu catálogo agora mesmo. Não precisa de cartão de crédito e sua loja fica pronta em menos de 2 minutos.
          </p>

          <div className="pt-2">
            <Link
              href="/criar-loja"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-sm sm:text-base font-extrabold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:brightness-110 shadow-xl shadow-emerald-500/30 active:scale-98 transition cursor-pointer"
            >
              <span>Criar Meu Catálogo Grátis Agora</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. FOOTER INSTITUCIONAL */}
      {/* ============================================================ */}
      <footer className="bg-slate-950 border-t border-slate-800 py-10 sm:py-14 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-sm font-black text-white">
                Catálogo<span className="text-emerald-400">Zap</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-5 text-slate-400">
              <Link href="/criar-loja" className="hover:text-white transition">
                Criar Nova Loja
              </Link>
              <Link href="/admin/login" className="hover:text-white transition">
                Painel do Lojista
              </Link>
              <Link href="/saas-admin" className="hover:text-white transition">
                Administração do SaaS
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <p>© {new Date().getFullYear()} CatálogoZap SaaS. Todos os direitos reservados.</p>
            <p>Plataforma White-Label Multi-Tenant com Google Sheets & WhatsApp</p>
          </div>
        </div>
      </footer>

      {/* Floating CTA bar on mobile */}
      <aside aria-label="Ação rápida no mobile" className="fixed bottom-0 inset-x-0 z-40 p-3 sm:hidden bg-slate-950/90 backdrop-blur-md border-t border-slate-800">
        <Link
          href="/criar-loja"
          className="w-full py-3 px-4 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:brightness-110 shadow-lg flex items-center justify-center gap-2 active:scale-98 transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>Criar Loja Grátis • Testar 30 Dias</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </aside>
    </div>
  );
}
