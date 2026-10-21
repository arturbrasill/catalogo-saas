'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  MessageCircle,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Zap,
  ShieldCheck,
  Smartphone,
  Palette,
  Layers,
  TrendingUp,
  Store,
  ChevronRight,
  HelpCircle,
  Clock,
  Globe,
  CreditCard,
  Award,
  XCircle,
  Eye,
  Plus,
} from 'lucide-react';

interface DemoProduct {
  name: string;
  category: string;
  price: string;
  oldPrice?: string;
  badge?: string;
  image: string;
}

interface DemoNiche {
  id: string;
  label: string;
  icon: string;
  storeName: string;
  subdomain: string;
  tagline: string;
  announcement: string;
  primaryColor: string;
  bgColor: string;
  presetName: string;
  layoutType: string;
  bannerImage: string;
  bannerTitle: string;
  bannerSubtitle: string;
  products: DemoProduct[];
}

export default function LandingPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activeNicheIndex, setActiveNicheIndex] = useState<number>(0);

  const demoNiches: DemoNiche[] = [
    {
      id: 'moda',
      label: 'Moda & Boutique',
      icon: '👗',
      storeName: 'Atelier Lumina',
      subdomain: 'lumina.numclick.app',
      tagline: 'Moda Feminina Autoral • Envios para todo Brasil',
      announcement: '✨ FRETE GRÁTIS NAS COMPRAS ACIMA DE R$ 299 • USE O CUPOM: LUMINA10',
      primaryColor: '#8338EC',
      bgColor: '#FAF9F6',
      presetName: 'Editorial Luxury',
      layoutType: 'Grade 2 Colunas',
      bannerImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&auto=format&fit=crop&q=80',
      bannerTitle: 'Coleção Outono / Inverno',
      bannerSubtitle: 'Alfaiataria contemporânea com tecidos nobres.',
      products: [
        {
          name: 'Blazer Linho Off-White',
          category: 'Alfaiataria',
          price: 'R$ 349,90',
          oldPrice: 'R$ 429,00',
          badge: 'Mais Vendido',
          image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&auto=format&fit=crop&q=80',
        },
        {
          name: 'Vestido Midi Seda Pura',
          category: 'Vestidos',
          price: 'R$ 289,90',
          badge: 'Lançamento',
          image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=80',
        },
        {
          name: 'Bolsa Couro Minimal',
          category: 'Acessórios',
          price: 'R$ 219,00',
          oldPrice: 'R$ 269,00',
          image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=80',
        },
        {
          name: 'Sandália Tiras Douradas',
          category: 'Calçados',
          price: 'R$ 198,00',
          image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=80',
        },
      ],
    },
    {
      id: 'gastronomia',
      label: 'Hamburgueria & Delivery',
      icon: '🍔',
      storeName: 'Brasa & Co. Burgers',
      subdomain: 'brasaburger.numclick.app',
      tagline: 'Smash Burgers Artesanais na Brasa • Entrega em 35 min',
      announcement: '🔥 COMBO CASAL COM REFRI GRÁTIS SÓ HOJE ATÉ ÀS 23H!',
      primaryColor: '#FB5607',
      bgColor: '#FFFDF9',
      presetName: 'Bold & Vibrant',
      layoutType: 'Lista Horizontal (Cardápio)',
      bannerImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=900&auto=format&fit=crop&q=80',
      bannerTitle: 'Smash Duplo Cheddar Bacon',
      bannerSubtitle: 'Blend 180g Angus, pão brioche selado na manteiga e molho da casa.',
      products: [
        {
          name: 'Combo Brasa Duplo + Fritas',
          category: 'Combos',
          price: 'R$ 44,90',
          oldPrice: 'R$ 54,90',
          badge: 'Campeão',
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
        },
        {
          name: 'Truffle Burger Artesanal',
          category: 'Burgers',
          price: 'R$ 38,90',
          badge: 'Chef',
          image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=80',
        },
        {
          name: 'Batata Rústica c/ Cheddar & Bacon',
          category: 'Porções',
          price: 'R$ 24,90',
          image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80',
        },
        {
          name: 'Milkshake Pistache Belga 400ml',
          category: 'Sobremesas',
          price: 'R$ 22,90',
          image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80',
        },
      ],
    },
    {
      id: 'cosmeticos',
      label: 'Cosméticos & Skincare',
      icon: '✨',
      storeName: 'Botanica Glow',
      subdomain: 'botanicaglow.numclick.app',
      tagline: 'Skincare Vegano & Dermatológico • Cruelty-Free',
      announcement: '💜 BRINDE EXCLUSIVO EM PEDIDOS ACIMA DE R$ 150 PELO WHATSAPP',
      primaryColor: '#8338EC',
      bgColor: '#F8FAFC',
      presetName: 'Modern Clean',
      layoutType: 'Grade 2 Colunas',
      bannerImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&auto=format&fit=crop&q=80',
      bannerTitle: 'Rotina Glow Vitamina C 20%',
      bannerSubtitle: 'Pele radiante, uniforme e hidratada desde a primeira semana.',
      products: [
        {
          name: 'Sérum Facial Vitamina C Pura',
          category: 'Séruns',
          price: 'R$ 119,90',
          oldPrice: 'R$ 149,90',
          badge: '-20% OFF',
          image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80',
        },
        {
          name: 'Kit Completo Hidratação Profunda',
          category: 'Kits',
          price: 'R$ 239,00',
          oldPrice: 'R$ 299,00',
          badge: 'Kit Favorito',
          image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
        },
        {
          name: 'Gel de Limpeza Botânico Suave',
          category: 'Limpeza',
          price: 'R$ 68,00',
          image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&auto=format&fit=crop&q=80',
        },
        {
          name: 'Protetor Solar Toque Seco FPS 60',
          category: 'Proteção',
          price: 'R$ 89,90',
          image: 'https://images.unsplash.com/photo-1608248597359-0e6d526a6828?w=500&auto=format&fit=crop&q=80',
        },
      ],
    },
    {
      id: 'eletronicos',
      label: 'Eletrônicos & Tech',
      icon: '🎧',
      storeName: 'PrimeTech Store',
      subdomain: 'primetech.numclick.app',
      tagline: 'Importados Originais & Acessórios Premium • Garantia Oficial',
      announcement: '⚡ 10% DE DESCONTO NO PIX IMEDIATO EM TODA A LINHA ÁUDIO & SMART',
      primaryColor: '#212529',
      bgColor: '#E9ECEF',
      presetName: 'Modern Clean',
      layoutType: 'Grade 2 Colunas',
      bannerImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&auto=format&fit=crop&q=80',
      bannerTitle: 'Semana Tech Sem Juros',
      bannerSubtitle: 'Fones Noise Cancelling, Smartwatches e Carregadores MagSafe.',
      products: [
        {
          name: 'Headphone Wireless ANC Pro',
          category: 'Áudio',
          price: 'R$ 549,00',
          oldPrice: 'R$ 699,00',
          badge: 'Oferta Relâmpago',
          image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=80',
        },
        {
          name: 'Smartwatch Ultra Titanium 49mm',
          category: 'Wearables',
          price: 'R$ 799,00',
          badge: 'Pronta Entrega',
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
        },
        {
          name: 'PowerBank MagSafe 10.000mAh',
          category: 'Energia',
          price: 'R$ 189,90',
          oldPrice: 'R$ 229,00',
          image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&auto=format&fit=crop&q=80',
        },
        {
          name: 'Caixa de Som Bluetooth Waterproof',
          category: 'Áudio',
          price: 'R$ 329,00',
          image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=80',
        },
      ],
    },
  ];

  const activeNiche = (demoNiches[activeNicheIndex] ?? demoNiches[0])!;

  const faqs = [
    {
      question: 'Preciso ter CNPJ ou cartão de crédito para começar os 7 dias grátis?',
      answer:
        'Não! Você pode criar sua loja agora mesmo apenas com seu nome, WhatsApp e e-mail. Você terá 7 dias completos para cadastrar produtos, personalizar cores e já realizar vendas reais sem pagar nada.',
    },
    {
      question: 'O NumClick cobra comissão sobre as minhas vendas?',
      answer:
        'Zero comissão! Diferente de marketplaces que ficam com até 27% do seu faturamento, no NumClick 100% do dinheiro das vendas vai direto para o seu PIX ou maquininha. Você paga apenas a assinatura fixa de R$ 79,90/mês após o período de teste.',
    },
    {
      question: 'Como o meu cliente faz o pedido e como ele chega no meu WhatsApp?',
      answer:
        'O cliente acessa o link exclusivo da sua loja (ex: sua-loja.numclick.app), escolhe os produtos, variações (tamanho, cor, sabor), aplica cupons se tiver e clica em "Finalizar no WhatsApp". O pedido chega no seu WhatsApp perfeitamente organizado com itens, quantidades, subtotal, endereço de entrega e forma de pagamento escolhida.',
    },
    {
      question: 'Posso personalizar a vitrine com a logo e as cores da minha marca?',
      answer:
        'Sim! O sistema é 100% White-Label. No seu Painel Administrativo você altera o logotipo, banners, cores da marca, barra de avisos no topo, tipografia (Moderna, Editorial ou Vibrante) e até o formato da grade de produtos em tempo real.',
    },
    {
      question: 'Tem limite de produtos, fotos ou pedidos por mês?',
      answer:
        'Não há limites! O plano único de R$ 79,90/mês inclui cadastro ilimitado de produtos e categorias, pedidos ilimitados via WhatsApp e hospedagem em nuvem de alta velocidade inclusa.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#E9ECEF] text-[#212529] font-sans selection:bg-[#FB5607] selection:text-white overflow-x-hidden">
      {/* ===================================================================== */}
      {/* 1. NAVBAR FIXA COM GLASSMORPHISM & MARCA OFICIAL NUMCLICK */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-50 border-b border-[#212529]/10 bg-[#E9ECEF]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo Oficial NumClick */}
          <Link href="/" className="flex items-center gap-3 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/numclick-badge.png"
              alt="NumClick"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl shadow-md shadow-[#FB5607]/25 group-hover:scale-105 transition-transform object-contain"
            />
            <div className="flex flex-col">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/marca/marca-light.svg"
                alt="NumClick"
                className="h-5 sm:h-6 w-auto object-contain object-left"
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8338EC] block mt-0.5">
                Catálogos Digitais
              </span>
            </div>
          </Link>

          {/* Links de Navegação Desktop */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-bold text-[#212529]/80">
            <a href="#exemplos" className="hover:text-[#FB5607] transition-colors">
              Lojas de Exemplo
            </a>
            <a href="#comparativo" className="hover:text-[#FB5607] transition-colors">
              Antes & Depois
            </a>
            <a href="#recursos" className="hover:text-[#FB5607] transition-colors">
              Recursos
            </a>
            <a href="#precos" className="hover:text-[#FB5607] transition-colors">
              Preço Único
            </a>
            <a href="#faq" className="hover:text-[#FB5607] transition-colors">
              Dúvidas
            </a>
          </nav>

          {/* Ações Rápidas */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/admin/login"
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#212529] hover:text-[#8338EC] hover:bg-white/70 transition-all"
            >
              Área do Lojista
            </Link>
            <Link
              href="/criar-loja"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-[#FB5607] hover:bg-[#8338EC] shadow-md shadow-[#FB5607]/25 transition-all active:scale-95"
            >
              <span>Criar Minha Loja</span>
              <ArrowRight className="w-4 h-4 hidden xs:inline" />
            </Link>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* SEÇÃO 1 (CLARA - #E9ECEF): HERO + VITRINE INTERATIVA DE LOJAS MODELO */}
      {/* ===================================================================== */}
      <section className="relative pt-10 pb-20 sm:pt-16 sm:pb-28 overflow-hidden bg-[#E9ECEF]">
        {/* Luzes de fundo sutis com as cores da marca (#FB5607 e #8338EC) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-36 left-1/2 -translate-x-1/2 w-[950px] h-[480px] bg-gradient-to-tr from-[#FB5607]/15 via-[#8338EC]/12 to-transparent rounded-full blur-3xl -z-10"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Bloco Central de Copywriting de Alta Conversão */}
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#8338EC]/25 text-[#8338EC] text-xs font-extrabold tracking-wide uppercase shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#FB5607]" />
              <span>Seu Catálogo Digital Profissional em 60 Segundos</span>
            </div>

            <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#212529] leading-[1.08]">
              Transforme seu WhatsApp em uma{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FB5607] to-[#8338EC]">
                Máquina de Vendas
              </span>{' '}
              sem pagar comissões.
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-[#212529]/75 leading-relaxed max-w-2xl mx-auto font-medium">
              Chega de perder horas respondendo preço por preço ou enviando PDFs pesados que ninguém abre. Crie sua vitrine online com a sua marca e receba pedidos prontos no WhatsApp.
            </p>

            {/* Botões de Ação Principal */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/criar-loja"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-base font-black text-white bg-[#FB5607] hover:bg-[#8338EC] shadow-xl shadow-[#FB5607]/30 hover:shadow-[#8338EC]/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Começar 7 Dias Grátis Agora</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </Link>
              <a
                href="#exemplos"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold text-[#212529] bg-white hover:bg-[#212529] hover:text-[#E9ECEF] border border-[#212529]/15 shadow-xs transition-all"
              >
                <Eye className="w-4 h-4 text-[#8338EC]" />
                <span>Testar Lojas de Exemplo</span>
              </a>
            </div>

            {/* Selos de Confiança Imediata */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-[#212529]/75">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#FB5607]" />
                7 dias grátis sem cartão
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#8338EC]" />
                0% de taxa por pedido
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#FB5607]" />
                Cancele quando quiser
              </span>
            </div>
          </div>

          {/* ================================================================= */}
          {/* VITRINE INTERATIVA DE LOJAS MODELO POR NICHO (#exemplos) */}
          {/* ================================================================= */}
          <div id="exemplos" className="mt-14 sm:mt-16 scroll-mt-24">
            <div className="text-center mb-5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#8338EC] block mb-2">
                 Clique em um segmento abaixo para ver como a sua loja vai ficar:
              </span>
              {/* Seletor de Nichos */}
              <div className="inline-flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-white border border-[#212529]/10 shadow-xs">
                {demoNiches.map((niche, idx) => {
                  const isActive = idx === activeNicheIndex;
                  return (
                    <button
                      key={niche.id}
                      type="button"
                      onClick={() => setActiveNicheIndex(idx)}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#212529] text-[#E9ECEF] shadow-sm scale-[1.01]'
                          : 'text-[#212529]/70 hover:text-[#212529] hover:bg-[#E9ECEF]/60'
                      }`}
                    >
                      <span>{niche.icon}</span>
                      <span>{niche.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Moldura de Navegador / Dispositivo Realista */}
            <div className="relative mx-auto max-w-5xl rounded-3xl bg-[#212529] p-2 sm:p-3.5 shadow-2xl border border-[#212529]">
              {/* Barra Superior do Browser */}
              <div className="flex items-center justify-between px-3 py-2.5 bg-[#212529] rounded-t-2xl border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FB5607]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8338EC]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E9ECEF]/40" />
                </div>

                {/* URL Dinâmica do Subdomínio */}
                <div className="flex items-center gap-2 px-4 py-1 rounded-lg bg-black/30 border border-white/10 text-[11px] font-mono text-[#E9ECEF] max-w-[260px] sm:max-w-md truncate">
                  <Globe className="w-3 h-3 text-[#FB5607] shrink-0" />
                  <span className="truncate">https://{activeNiche.subdomain}</span>
                </div>

                {/* Badges de Configuração Ativa */}
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#8338EC]/30 text-[#E9ECEF] border border-[#8338EC]/50">
                    Tema: {activeNiche.presetName}
                  </span>
                </div>
              </div>

              {/* Conteúdo da Loja Simulada */}
              <div
                className="rounded-b-2xl overflow-hidden transition-colors duration-300"
                style={{ backgroundColor: activeNiche.bgColor }}
              >
                {/* Barra de Anúncio do Topo */}
                <div
                  className="py-2 px-4 text-center text-[10px] sm:text-xs font-extrabold tracking-wide text-white"
                  style={{ backgroundColor: activeNiche.primaryColor }}
                >
                  {activeNiche.announcement}
                </div>

                {/* Cabeçalho da Loja Simulada */}
                <div className="bg-white/95 backdrop-blur-md border-b border-[#212529]/10 px-4 sm:px-6 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base shadow-xs"
                      style={{ backgroundColor: activeNiche.primaryColor }}
                    >
                      {activeNiche.storeName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm sm:text-base text-[#212529]">
                          {activeNiche.storeName}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FB5607]/10 text-[#FB5607] border border-[#FB5607]/25">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FB5607] animate-pulse" />
                          Aberto
                        </span>
                      </div>
                      <p className="text-[11px] text-[#212529]/60 hidden xs:block">
                        {activeNiche.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Sacola Simulada */}
                  <div className="flex items-center gap-2">
                    <Link
                      href="/criar-loja"
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition hover:opacity-95"
                      style={{ backgroundColor: activeNiche.primaryColor }}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Sacola (2)</span>
                      <span className="hidden sm:inline opacity-90">• Finalizar</span>
                    </Link>
                  </div>
                </div>

                {/* Corpo da Vitrine Simulada */}
                <div className="p-4 sm:p-6 space-y-5">
                  {/* Banner Hero da Loja */}
                  <div className="relative rounded-2xl overflow-hidden h-36 sm:h-48 bg-[#212529] flex items-end p-5 sm:p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeNiche.bannerImage}
                      alt={activeNiche.bannerTitle}
                      className="absolute inset-0 w-full h-full object-cover opacity-65"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#212529]/90 via-[#212529]/40 to-transparent" />
                    <div className="relative z-10 max-w-lg text-white">
                      <span
                        className="inline-block text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-md mb-1.5"
                        style={{ backgroundColor: activeNiche.primaryColor }}
                      >
                        Destaque da Semana
                      </span>
                      <h3 className="text-lg sm:text-2xl font-black leading-tight">
                        {activeNiche.bannerTitle}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#E9ECEF]/90 mt-0.5 line-clamp-1">
                        {activeNiche.bannerSubtitle}
                      </p>
                    </div>
                  </div>

                  {/* Grid de 4 Produtos Reais do Nicho */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {activeNiche.products.map((prod, pIdx) => (
                      <div
                        key={pIdx}
                        className="group bg-white rounded-2xl border border-[#212529]/10 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative aspect-[4/3] bg-[#E9ECEF] overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {prod.badge && (
                              <span
                                className="absolute top-2 left-2 text-[10px] font-extrabold text-white px-2 py-0.5 rounded-full shadow-xs"
                                style={{ backgroundColor: activeNiche.primaryColor }}
                              >
                                {prod.badge}
                              </span>
                            )}
                          </div>
                          <div className="p-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#212529]/50 block">
                              {prod.category}
                            </span>
                            <h4 className="text-xs sm:text-sm font-extrabold text-[#212529] mt-0.5 line-clamp-1">
                              {prod.name}
                            </h4>
                          </div>
                        </div>

                        <div className="px-3 pb-3 pt-1 flex items-center justify-between border-t border-[#E9ECEF]">
                          <div>
                            {prod.oldPrice && (
                              <span className="text-[10px] text-[#212529]/45 line-through block leading-none">
                                {prod.oldPrice}
                              </span>
                            )}
                            <span
                              className="text-xs sm:text-sm font-black"
                              style={{ color: activeNiche.primaryColor }}
                            >
                              {prod.price}
                            </span>
                          </div>
                          <Link
                            href="/criar-loja"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-2xs transition hover:scale-105"
                            style={{ backgroundColor: activeNiche.primaryColor }}
                            title="Criar uma loja como esta"
                          >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Barra Inferior de Ação na Vitrine */}
                  <div className="bg-white rounded-2xl border border-[#212529]/10 p-3.5 sm:px-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#212529]">
                      <MessageCircle className="w-5 h-5 text-[#FB5607] shrink-0" />
                      <span>
                        Gostou do visual da <strong>{activeNiche.storeName}</strong>? Crie uma igual para o seu negócio agora!
                      </span>
                    </div>
                    <Link
                      href="/criar-loja"
                      className="w-full sm:w-auto text-center px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-[#212529] hover:bg-[#FB5607] transition shrink-0"
                    >
                      Usar Este Modelo Grátis →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SEÇÃO 2 (ESCURA - #212529): COMPARATIVO ANTES & DEPOIS */}
      {/* ===================================================================== */}
      <section id="comparativo" className="py-20 sm:py-28 bg-[#212529] text-[#E9ECEF] scroll-mt-20 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px] bg-[#8338EC]/15 rounded-full blur-3xl"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#FB5607] block mb-2">
              Por que migrar para o NumClick?
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-[#E9ECEF]">
              Pare de perder clientes no atendimento manual
            </h2>
            <p className="text-sm sm:text-base text-[#E9ECEF]/75 mt-3">
              Veja a diferença entre atender no improviso pelo WhatsApp e ter uma vitrine automatizada trabalhando 24h por você.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Coluna 1: Sem NumClick (Dor) */}
            <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-2xl bg-[#FB5607]/20 border border-[#FB5607]/40 flex items-center justify-center text-[#FB5607]">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#FB5607] block">
                    O jeito antigo e cansativo
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-[#E9ECEF]">
                    Vender no Improviso
                  </h3>
                </div>
              </div>

              <ul className="space-y-4 text-sm text-[#E9ECEF]/80">
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-[#FB5607] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Mandar 30 fotos soltas no chat:</strong> Lotando a memória do celular do cliente e deixando a conversa confusa.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-[#FB5607] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Catálogos em PDF pesados:</strong> Demoram para baixar no 4G, não atualizam estoque e o cliente desiste da compra.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-[#FB5607] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">&quot;Qual o valor desse?&quot; o dia inteiro:</strong> Você perde horas respondendo perguntas repetidas em vez de apenas fechar pedidos.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-[#FB5607] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Taxas abusivas em apps de terceiros:</strong> Perder de 15% a 27% de comissão em cada venda realizada.
                  </span>
                </li>
              </ul>
            </div>

            {/* Coluna 2: Com NumClick (Solução) */}
            <div className="rounded-3xl bg-gradient-to-br from-[#8338EC]/25 via-[#212529] to-[#FB5607]/20 border-2 border-[#FB5607] p-6 sm:p-8 space-y-6 relative shadow-2xl shadow-[#FB5607]/10">
              <div className="absolute -top-3.5 right-6 bg-[#FB5607] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                O Padrão Profissional
              </div>

              <div className="flex items-center gap-3 pb-4 border-b border-white/15">
                <div className="w-10 h-10 rounded-2xl bg-[#FB5607] flex items-center justify-center text-white shadow-md shadow-[#FB5607]/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#FB5607] block">
                    Venda no piloto automático
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    Com Catálogo NumClick
                  </h3>
                </div>
              </div>

              <ul className="space-y-4 text-sm text-[#E9ECEF]">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#FB5607] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Link único na bio do Instagram e WhatsApp:</strong> Abre instantaneamente no navegador sem precisar instalar nenhum aplicativo.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#FB5607] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Sacola inteligente com variações e cupons:</strong> O próprio cliente escolhe tamanho, cor, aplica cupom e calcula tudo sozinho.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#FB5607] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Pedido chega mastigado no seu WhatsApp:</strong> Resumo estruturado com produtos, valores, troco ou PIX e endereço completo.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#FB5607] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">100% do lucro no seu bolso:</strong> Assinatura fixa acessível de R$ 79,90/mês sem nenhuma comissão sobre suas vendas.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SEÇÃO 3 (CLARA - #E9ECEF): BENTO GRID DE RECURSOS WHITE-LABEL */}
      {/* ===================================================================== */}
      <section id="recursos" className="py-20 sm:py-28 bg-[#E9ECEF] text-[#212529] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#8338EC] block mb-2">
              Tecnologia de Ponta para Negócios Locais
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-[#212529]">
              Tudo o que você precisa para vender mais todos os dias
            </h2>
            <p className="text-sm sm:text-base text-[#212529]/75 mt-3">
              Criado especificamente para lojistas que querem agilidade, visual de grande marca e conversão máxima no celular.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {/* Card Grande 1 (2 colunas) */}
            <div className="md:col-span-2 rounded-3xl bg-white border border-[#212529]/10 p-6 sm:p-8 flex flex-col justify-between hover:border-[#FB5607]/50 hover:shadow-lg transition-all">
              <div className="space-y-3 max-w-xl">
                <div className="w-11 h-11 rounded-2xl bg-[#FB5607] text-white flex items-center justify-center shadow-sm shadow-[#FB5607]/30">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#212529]">
                  Checkout Direto no WhatsApp + Roteamento Multi-Vendedor
                </h3>
                <p className="text-sm text-[#212529]/75 leading-relaxed">
                  Seu cliente monta o carrinho em segundos e envia o pedido pronto para o seu WhatsApp. Tem mais de um atendente na loja? Ative a escolha de vendedor para distribuir os atendimentos automaticamente para sua equipe!
                </p>
              </div>

              {/* Simulação Visual do Resumo do Pedido no WhatsApp */}
              <div className="mt-6 p-4 rounded-2xl bg-[#E9ECEF]/70 border border-[#212529]/10 font-mono text-xs text-[#212529] space-y-1">
                <div className="flex items-center justify-between text-[11px] font-sans font-bold text-[#FB5607] pb-1.5 border-b border-[#212529]/10">
                  <span>📲 Como o pedido chega para você no WhatsApp:</span>
                  <span className="bg-[#FB5607]/15 text-[#FB5607] px-2 py-0.5 rounded-full">Pronto para cobrar</span>
                </div>
                <p className="pt-1 font-bold text-[#212529]">🛍️ *NOVO PEDIDO — ATELIER LUMINA*</p>
                <p>• 1x Blazer Linho Off-White (Tam: M) — R$ 349,90</p>
                <p>• 1x Bolsa Couro Minimal (Cor: Caramelo) — R$ 219,00</p>
                <p className="text-[#8338EC] font-bold">🏷️ Cupom aplicado: LUMINA10 (-R$ 56,89)</p>
                <p className="font-bold text-[#212529] pt-1">💰 *Total Final: R$ 512,01* (Pagamento via PIX)</p>
              </div>
            </div>

            {/* Card 2 (1 coluna) - Personalização White-Label */}
            <div className="rounded-3xl bg-[#212529] text-[#E9ECEF] p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="space-y-3 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#8338EC] text-white flex items-center justify-center shadow-md shadow-[#8338EC]/30">
                  <Palette className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-white">
                  Estúdio de Identidade Visual Ao Vivo
                </h3>
                <p className="text-sm text-[#E9ECEF]/80 leading-relaxed">
                  Escolha entre 3 estilos tipográficos (Moderno, Editorial ou Vibrante), defina as cores da sua marca, banners rotativos e veja tudo mudar em tempo real no simulador mobile.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-[#FB5607]">
                <span>100% com a cara da sua marca</span>
                <Sparkles className="w-4 h-4 text-[#8338EC]" />
              </div>
            </div>

            {/* Card 3 - Campanhas e Cupons */}
            <div className="rounded-3xl bg-white border border-[#212529]/10 p-6 sm:p-7 space-y-3 hover:border-[#8338EC]/50 hover:shadow-lg transition-all">
              <div className="w-11 h-11 rounded-2xl bg-[#8338EC]/15 text-[#8338EC] flex items-center justify-center border border-[#8338EC]/25">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-[#212529]">
                Cupons de Desconto & Campanhas Relâmpago
              </h3>
              <p className="text-xs sm:text-sm text-[#212529]/75 leading-relaxed">
                Crie códigos de cupom (ex: BEMVINDO10) ou programe promoções automáticas com data de início e fim para girar seu estoque rapidamente.
              </p>
            </div>

            {/* Card 4 - Preços por Variação */}
            <div className="rounded-3xl bg-white border border-[#212529]/10 p-6 sm:p-7 space-y-3 hover:border-[#FB5607]/50 hover:shadow-lg transition-all">
              <div className="w-11 h-11 rounded-2xl bg-[#FB5607]/15 text-[#FB5607] flex items-center justify-center border border-[#FB5607]/25">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-[#212529]">
                Variações com Preço Dinâmico Real-Time
              </h3>
              <p className="text-xs sm:text-sm text-[#212529]/75 leading-relaxed">
                Venda produtos por tamanho (P, M, G), cor, voltagem ou adicionais pagos. O preço atualiza na hora na tela do cliente conforme a escolha.
              </p>
            </div>

            {/* Card 5 - Mobile First & Subdomínio */}
            <div className="rounded-3xl bg-white border border-[#212529]/10 p-6 sm:p-7 space-y-3 hover:border-[#8338EC]/50 hover:shadow-lg transition-all">
              <div className="w-11 h-11 rounded-2xl bg-[#212529] text-[#E9ECEF] flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-[#FB5607]" />
              </div>
              <h3 className="text-lg font-black text-[#212529]">
                Ultra Rápido no 4G & Link Exclusivo
              </h3>
              <p className="text-xs sm:text-sm text-[#212529]/75 leading-relaxed">
                Sua loja ganha endereço próprio (<code className="font-mono font-bold text-[#8338EC]">sualoja.numclick.app</code>) otimizado para abrir em menos de 1 segundo em qualquer celular.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SEÇÃO 4 (ESCURA - #212529): PREÇO ÚNICO & TRANSPARENTE */}
      {/* ===================================================================== */}
      <section id="precos" className="py-20 sm:py-28 bg-[#212529] text-[#E9ECEF] scroll-mt-20 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#8338EC]/20 via-[#FB5607]/20 to-transparent rounded-full blur-3xl"
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#FB5607] block mb-2">
              Simples, Justo e Sem Surpresas
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Um único plano completo para o seu negócio crescer
            </h2>
            <p className="text-sm sm:text-base text-[#E9ECEF]/75 mt-3">
              Sem planos limitados ou cobranças escondidas. Você tem acesso total a todas as ferramentas desde o primeiro dia.
            </p>
          </div>

          {/* Card de Preço Único em Destaque */}
          <div className="rounded-3xl bg-[#E9ECEF] text-[#212529] border-2 border-[#FB5607] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Lado Esquerdo: Benefícios Inclusos */}
            <div className="lg:col-span-7 p-6 sm:p-10 space-y-6 bg-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8338EC]/10 border border-[#8338EC]/25 text-[#8338EC] text-xs font-extrabold">
                <Award className="w-4 h-4 text-[#FB5607]" />
                <span>Plano PRO Ilimitado • Tudo Incluso</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-[#212529]">
                Sua loja online completa pronta para vender hoje
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm font-semibold text-[#212529]/85">
                {[
                  'Produtos e fotos ilimitados',
                  'Pedidos ilimitados no WhatsApp',
                  '0% de comissão sobre vendas',
                  'Subdomínio próprio (.numclick.app)',
                  'Cupons de desconto (% ou R$)',
                  'Campanhas e ofertas temporais',
                  'Roteamento para vários vendedores',
                  'Personalização total de cores e fontes',
                  'Variações com acréscimo de preço',
                  'Suporte prioritário em português',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#FB5607] shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lado Direito: Valor e CTA */}
            <div className="lg:col-span-5 bg-gradient-to-br from-[#212529] via-[#212529] to-[#8338EC]/40 text-white p-6 sm:p-10 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/10">
              <div className="space-y-4">
                <span className="inline-block text-xs font-extrabold uppercase tracking-wider text-[#E9ECEF] bg-[#8338EC] px-3 py-1 rounded-full">
                  7 Dias de Teste Grátis
                </span>

                <div>
                  <span className="text-xs text-[#E9ECEF]/60 line-through block">
                    De R$ 149,90/mês por apenas:
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-sm font-bold text-[#E9ECEF]/80">R$</span>
                    <span className="text-5xl sm:text-6xl font-black tracking-tight text-white">
                      79,90
                    </span>
                    <span className="text-sm font-semibold text-[#E9ECEF]/80">/mês</span>
                  </div>
                  <span className="text-xs text-[#FB5607] font-bold block mt-1">
                    Menos de R$ 2,66 por dia • Sem fidelidade
                  </span>
                </div>

                <p className="text-xs text-[#E9ECEF]/80 leading-relaxed">
                  Teste gratuitamente por 7 dias. Após o período de degustação, pague facilmente via PIX, Boleto ou Cartão pelo gateway oficial Asaas.
                </p>
              </div>

              <div className="pt-6 space-y-3">
                <Link
                  href="/criar-loja"
                  className="w-full py-4 px-6 rounded-2xl bg-[#FB5607] hover:bg-[#8338EC] text-white font-black text-sm sm:text-base shadow-lg shadow-[#FB5607]/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Criar Minha Loja Grátis</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <div className="flex items-center justify-center gap-4 text-[11px] text-[#E9ECEF]/70 font-medium">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FB5607]" />
                    Ambiente Seguro
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#8338EC]" />
                    Pronto em 1 minuto
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SEÇÃO 5 (CLARA - #E9ECEF): PERGUNTAS FREQUENTES (FAQ) */}
      {/* ===================================================================== */}
      <section id="faq" className="py-20 sm:py-24 bg-[#E9ECEF] text-[#212529] scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#8338EC] block mb-2">
              Tire suas dúvidas
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#212529]">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all ${
                    isOpen
                      ? 'bg-white border-[#8338EC] shadow-md'
                      : 'bg-white/80 border-[#212529]/10 hover:border-[#212529]/25'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-sm sm:text-base font-extrabold text-[#212529]">
                      {faq.question}
                    </span>
                    <ChevronRight
                      className={`w-5 h-5 text-[#FB5607] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-90 text-[#8338EC]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-[#212529]/80 leading-relaxed border-t border-[#E9ECEF] pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SEÇÃO 6 (ESCURA - #212529): CTA FINAL & RODAPÉ INSTITUCIONAL */}
      {/* ===================================================================== */}
      <footer className="bg-[#212529] text-[#E9ECEF] pt-16 pb-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Card CTA Final */}
          <div className="rounded-3xl bg-gradient-to-r from-[#FB5607] to-[#8338EC] p-8 sm:p-12 text-center text-white shadow-2xl mb-14 relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-5 relative z-10">
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                Comece hoje mesmo a vender de forma profissional pelo WhatsApp
              </h2>
              <p className="text-sm sm:text-base text-white/90">
                Crie sua conta em menos de 1 minuto, escolha seu modelo de loja e compartilhe seu link exclusivo com seus clientes.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/criar-loja"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#212529] text-[#E9ECEF] font-black text-sm sm:text-base hover:bg-black shadow-lg transition-all"
                >
                  <span>Criar Minha Loja Grátis (7 Dias)</span>
                  <ArrowRight className="w-5 h-5 text-[#FB5607]" />
                </Link>
                <Link
                  href="/admin/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm border border-white/25 transition-all"
                >
                  <span>Já sou assinante • Entrar</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Rodapé Links & Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-white/10 text-xs text-[#E9ECEF]/70">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/numclick-badge.png"
                alt="NumClick"
                className="w-8 h-8 rounded-xl object-contain"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/marca/marca-dark.svg"
                alt="NumClick"
                className="h-4 w-auto object-contain"
              />
              <span className="text-[#E9ECEF]/40">•</span>
              <span>Plataforma White-Label de Catálogos Digitais</span>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <Link href="/criar-loja" className="hover:text-[#FB5607] transition">
                Criar Loja
              </Link>
              <Link href="/admin/login" className="hover:text-[#FB5607] transition">
                Painel do Lojista
              </Link>
              <a href="#precos" className="hover:text-[#FB5607] transition">
                Planos
              </a>
              <span>© {new Date().getFullYear()} NumClick. Todos os direitos reservados.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
