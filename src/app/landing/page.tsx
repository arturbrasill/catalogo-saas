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
  Percent,
  Sliders,
  HelpCircle,
  Star,
  Users,
  ShieldCheck,
  Truck,
  Copy,
  ExternalLink,
  Globe,
  Lock,
  X,
  XCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/whatsapp';

// Mock de nichos para demonstração interativa na vitrine do smartphone
interface NicheData {
  id: string;
  tabLabel: string;
  storeName: string;
  storeCategory: string;
  badge: string;
  productName: string;
  productDescription: string;
  price: number;
  oldPrice: number;
  deliveryFee: number;
  image: string;
  options: string;
  deliveryTime: string;
}

const DEMO_NICHES: NicheData[] = [
  {
    id: 'food',
    tabLabel: 'Burgers & Delivery',
    storeName: 'Artesanal Burger & Beer',
    storeCategory: 'Hamburgueria & Porções',
    badge: 'Mais Pedido',
    productName: 'Double Smash Bacon Especial',
    productDescription: '2 carnes smash 110g, queijo cheddar inglês, bacon crocante e molho da casa no pão brioche.',
    price: 38.9,
    oldPrice: 44.9,
    deliveryFee: 6.0,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    options: 'Ponto: Ao ponto • Molho da Casa',
    deliveryTime: '30-40 min',
  },
  {
    id: 'fashion',
    tabLabel: 'Moda & Roupas',
    storeName: 'Bella Flor Boutique',
    storeCategory: 'Vestuário Feminino',
    badge: 'Lançamento',
    productName: 'Vestido Midi Floral Elegance',
    productDescription: 'Tecido leve premium com caimento fluido, amarração na cintura e estampa botânica exclusiva.',
    price: 189.9,
    oldPrice: 229.9,
    deliveryFee: 15.0,
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80',
    options: 'Tamanho: M • Cor: Terracota',
    deliveryTime: 'Envio Rápido / Retirada',
  },
  {
    id: 'beauty',
    tabLabel: 'Cosméticos & Skincare',
    storeName: 'Glow Natural Skincare',
    storeCategory: 'Cosméticos Naturais',
    badge: 'Vegano',
    productName: 'Sérum Facial Vitamina C 15%',
    productDescription: 'Fórmula antioxidante pura com ácido hialurônico de triplo peso molecular e toque seco.',
    price: 89.9,
    oldPrice: 119.9,
    deliveryFee: 10.0,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80',
    options: 'Frasco: 30ml • Toque Seco',
    deliveryTime: 'Pronta Entrega',
  },
  {
    id: 'shoes',
    tabLabel: 'Calçados & Tênis',
    storeName: 'Passo Firme Sneaker Store',
    storeCategory: 'Calçados Urbanos',
    badge: 'Destaque',
    productName: 'Sneaker Streetwear Couro Branco',
    productDescription: 'Acabamento em couro legítimo macio, solado vulcanizado e palmilha anti-impacto ultra conforto.',
    price: 249.9,
    oldPrice: 299.9,
    deliveryFee: 0.0,
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80',
    options: 'Numeração: 41 • Cor: Branco/Gelo',
    deliveryTime: 'Frete Grátis na Semana',
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
  const [selectedNiche, setSelectedNiche] = useState<NicheData>(DEMO_NICHES[0]!);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(15000);
  const [marketplaceFee, setMarketplaceFee] = useState<number>(18);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copiedPix, setCopiedPix] = useState(false);

  // Cálculos da calculadora de economia
  const monthlyFeeAmount = (monthlyRevenue * marketplaceFee) / 100;
  const yearlyMarketplaceLoss = monthlyFeeAmount * 12;
  const saasYearlyCost = 129.9 * 12; // R$ 129,90/mês
  const yearlySavings = Math.max(0, yearlyMarketplaceLoss - saasYearlyCost);

  const handleCopyPix = () => {
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const commercialWhatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(
    'Olá! Quero criar o catálogo digital da minha loja e começar meu teste grátis.'
  )}`;

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-500 selection:text-white font-sans antialiased">
      {/* ============================================================ */}
      {/* 1. NAVBAR MINIMALISTA & ELEGANTE (Linear / Raycast Style)   */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-4">
          {/* Logo Minimalista */}
          <Link href="/landing" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-slate-800 transition-colors">
              <ShoppingBag className="w-4 h-4 text-emerald-400 stroke-[2.2]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                Catálogo<span className="text-emerald-600">Zap</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wide bg-slate-100 text-slate-600 border border-slate-200/70 px-1.5 py-0.5 rounded-md hidden sm:inline-block">
                SaaS
              </span>
            </div>
          </Link>

          {/* Navegação Desktop */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
            <a href="#preview" className="hover:text-slate-900 transition-colors">
              Demonstração
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
              Planos
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
              <span>Criar Loja Grátis</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. HERO PRINCIPAL COM MOCKUP RESPONSIVO                      */}
      {/* ============================================================ */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 overflow-hidden">
        {/* Efeito sutil de luz ambiente no fundo */}
        <div className="absolute top-0 inset-x-0 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.09),transparent)] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 sm:space-y-8 relative z-10">
          {/* Badge de Novidade no topo */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 transition-colors">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>✨ A nova vitrine digital para empresas locais</span>
          </div>

          {/* Título Principal curto e focado na conversão */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.12] max-w-3xl mx-auto">
            Transforme seu WhatsApp em uma máquina de vendas, sem taxas por pedido.
          </h1>

          {/* Subtítulo direto */}
          <p className="text-base sm:text-lg md:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Substitua PDFs pesados e conversas confusas por um catálogo rápido com seu domínio próprio, cores da sua marca e pedido detalhado direto no seu Zap.
          </p>

          {/* Grupo de CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            {/* Botão 1 (Destaque): 'Ver Demonstração ao Vivo' */}
            <Link
              href="/?tenant=loja_exemplo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Ver Demonstração ao Vivo</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            {/* Botão 2 (Outline/Sutil): 'Criar Catálogo da Minha Loja' */}
            <a
              href={commercialWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs hover:border-slate-300 active:scale-[0.98] transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Criar Catálogo da Minha Loja</span>
            </a>
          </div>

          {/* Micro-prova de confiança sutil */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-normal">
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
              Google Sheets sincronizado
            </span>
          </div>
        </div>

        {/* PREVIEW VISUAL DO PRODUTO (CONTAINER + MOCKUP SMARTPHONE) */}
        <div id="preview" className="mt-12 sm:mt-16 max-w-5xl mx-auto px-4 sm:px-6">
          {/* Seletor de Segmentos */}
          <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8 overflow-x-auto py-1">
            {DEMO_NICHES.map((niche) => {
              const active = selectedNiche.id === niche.id;
              return (
                <button
                  key={niche.id}
                  type="button"
                  onClick={() => setSelectedNiche(niche)}
                  className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  {niche.tabLabel}
                </button>
              );
            })}
          </div>

          {/* Container Centralizado com Sombra Difusa (shadow-2xl) */}
          <div className="relative rounded-3xl sm:rounded-[36px] bg-slate-50/80 border border-slate-200/80 p-4 sm:p-8 lg:p-10 shadow-2xl shadow-slate-900/10">
            {/* Glow difuso ambiente */}
            <div className="absolute inset-x-8 top-10 bottom-10 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

            {/* Mockup Responsivo de Smartphone */}
            <div className="w-full max-w-[340px] sm:max-w-[360px] mx-auto bg-slate-950 rounded-[44px] sm:rounded-[48px] p-2.5 sm:p-3 ring-1 ring-slate-800 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.35)]">
              {/* Dynamic Island / Alto-falante */}
              <div className="w-24 sm:w-28 h-4 bg-slate-950 rounded-full mx-auto mb-2 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-800" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-slate-800/80" />
              </div>

              {/* Tela do Celular com Vitrine e Sacola Aberta */}
              <div className="bg-white rounded-[34px] sm:rounded-[38px] overflow-hidden text-slate-900 flex flex-col border border-slate-100 relative select-none font-sans min-h-[580px]">
                {/* 1. Header do Catálogo na Tela */}
                <div className="bg-white px-3.5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                      {selectedNiche.storeName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-tight">
                        {selectedNiche.storeName}
                      </h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          Aberto agora • {selectedNiche.deliveryTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botão da Sacola com Contador 1 */}
                  <div className="h-7 px-2 rounded-lg bg-slate-900 text-white flex items-center gap-1 text-[11px] font-bold shadow-2xs">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>1</span>
                  </div>
                </div>

                {/* 2. Vitrine Real com Produto (Background do Mockup) */}
                <div className="p-3.5 space-y-2.5 bg-slate-50/70 flex-1">
                  <div className="bg-white rounded-2xl border border-slate-200/70 p-2.5 shadow-2xs space-y-2">
                    <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedNiche.image}
                        alt={selectedNiche.productName}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-slate-900/90 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        {selectedNiche.badge}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block">
                        {selectedNiche.storeCategory}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {selectedNiche.productName}
                      </h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {selectedNiche.productDescription}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs font-extrabold text-slate-900">
                          {formatCurrency(selectedNiche.price, 'BRL')}
                        </span>
                        <span className="text-[10px] text-slate-400 line-through">
                          {formatCurrency(selectedNiche.oldPrice, 'BRL')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. SACOLA ABERTA (Bottom Sheet Drawer / Cart Overlay) */}
                <div className="bg-white border-t border-slate-200/90 rounded-t-3xl shadow-[0_-12px_28px_rgba(15,23,42,0.08)] p-3.5 space-y-3 relative z-20">
                  <div className="w-8 h-1 bg-slate-300 rounded-full mx-auto -mt-1 mb-1.5" />

                  {/* Cabeçalho da Sacola */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-slate-900">Sua Sacola</span>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded-full border border-emerald-200/60">
                        1 item
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Entrega rápida</span>
                  </div>

                  {/* Item Selecionado */}
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedNiche.image}
                        alt={selectedNiche.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                        {selectedNiche.productName}
                      </h5>
                      <p className="text-[9px] text-slate-500 truncate mt-0.5">
                        {selectedNiche.options}
                      </p>
                      <span className="text-[11px] font-extrabold text-slate-900 block mt-0.5">
                        {formatCurrency(selectedNiche.price, 'BRL')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-slate-700 shadow-2xs">
                      <span>1 un</span>
                    </div>
                  </div>

                  {/* Resumo Financeiro */}
                  <div className="space-y-1 text-[11px] pt-1">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>{formatCurrency(selectedNiche.price, 'BRL')}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3 text-slate-400" />
                        <span>Taxa de Entrega</span>
                      </span>
                      <span>
                        {selectedNiche.deliveryFee > 0
                          ? formatCurrency(selectedNiche.deliveryFee, 'BRL')
                          : 'Grátis'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-extrabold text-slate-900 pt-1 border-t border-slate-100">
                      <span>Total do Pedido</span>
                      <span className="text-emerald-700">
                        {formatCurrency(selectedNiche.price + selectedNiche.deliveryFee, 'BRL')}
                      </span>
                    </div>
                  </div>

                  {/* Pílula de Chave PIX Rápida */}
                  <div
                    onClick={handleCopyPix}
                    className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between text-[10px] cursor-pointer hover:bg-emerald-100/60 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-emerald-950 font-semibold truncate">
                      <QrCode className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">PIX da loja: 11999999999</span>
                    </div>
                    <span className="flex items-center gap-1 font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded shadow-2xs flex-shrink-0">
                      {copiedPix ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Copiar</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Botão de Finalização no WhatsApp */}
                  <div className="pt-0.5">
                    <Link
                      href="/?tenant=loja_exemplo"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>
                        Enviar no WhatsApp •{' '}
                        {formatCurrency(selectedNiche.price + selectedNiche.deliveryFee, 'BRL')}
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Legenda Explicativa */}
            <div className="mt-6 text-center text-xs text-slate-500 max-w-md mx-auto space-y-1">
              <p className="font-semibold text-slate-700">
                Experiência real sem downloads nem senhas para o cliente.
              </p>
              <p>
                O cliente abre pelo link da sua bio do Instagram, escolhe as opções e envia a mensagem pronta direto para você.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. SEÇÃO DE CONTRASTE 'ANTES & DEPOIS' (ROTINA DO LOJISTA)   */}
      {/* ============================================================ */}
      <section id="comparativo" className="py-20 sm:py-28 bg-slate-50/70 border-t border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16">
          {/* Cabeçalho da Seção */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Comparativo Prático
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              A diferença real na rotina do seu comércio
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Veja como você economiza tempo e elimina o estresse do atendimento manual no WhatsApp.
            </p>
          </div>

          {/* 2 Cards Lado a Lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            {/* Card 1: 'O Jeito Antigo' (Fundo levemente cinza/vermelho sutil) */}
            <div className="rounded-3xl bg-rose-50/50 border border-rose-200/70 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/80 text-rose-700 text-xs font-bold">
                    <XCircle className="w-3.5 h-3.5" />
                    O Jeito Antigo
                  </span>
                  <span className="text-[11px] font-semibold text-rose-500">Sem sistema</span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                  Conversas caóticas e perda diária de pedidos
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Muito esforço manual para pouca conversão, com clientes impacientes esperando respostas.
                </p>

                <ul className="space-y-4 pt-2">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-xs sm:text-sm font-bold text-slate-900 block">
                        PDFs pesados de 40MB que travam o celular
                      </strong>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Arquivos lentos que demoram para baixar no 4G, enchem a memória do cliente e ficam desatualizados no dia seguinte.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-xs sm:text-sm font-bold text-slate-900 block">
                        Cliente perguntando preço e tamanho o dia todo
                      </strong>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Dezenas de mensagens manuais no direct e no WhatsApp para tirar dúvidas básicas que poderiam estar visíveis com 1 clique.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-xs sm:text-sm font-bold text-slate-900 block">
                        Pedidos anotados no papel com erro
                      </strong>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Anotações perdidas em comandas ou blocos de notas, esquecimento de adicionais, troco errado e endereço incompleto.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-rose-200/60 text-[11px] text-rose-600 font-medium">
                Resultado: Clientes desistem antes de comprar e o lojista perde horas no chat.
              </div>
            </div>

            {/* Card 2: 'Com Nosso Catálogo' (Fundo branco com borda destacada e sombra) */}
            <div className="rounded-3xl bg-white border-2 border-emerald-500/90 p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xl shadow-slate-900/5 relative ring-1 ring-emerald-500/20">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Com Nosso Catálogo
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                    Moderno & Rápido
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                  Vendas rápidas, automáticas e organizadas
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  O cliente tem autonomia para navegar e o pedido chega pronto para faturar.
                </p>

                <ul className="space-y-4 pt-2">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-xs sm:text-sm font-bold text-slate-900 block">
                        Link limpo na bio do Instagram
                      </strong>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Carregamento instantâneo no navegador do celular, sem necessidade de baixar aplicativo e sempre atualizado em tempo real.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-xs sm:text-sm font-bold text-slate-900 block">
                        Cliente escolhe cor/tamanho e clica em pedir
                      </strong>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Fotos nítidas, variações organizadas, cálculo automático de frete ou retirada e botão para copiar chave PIX em 1 toque.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-xs sm:text-sm font-bold text-slate-900 block">
                        Pedido chega organizado e somado no WhatsApp
                      </strong>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Mensagem pré-formatada com itens, adicionais, dados de entrega e valor total calculado, pronto para você só despachar.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 text-[11px] text-emerald-700 font-semibold flex items-center justify-between">
                <span>Resultado: Mais vendas diárias e menos tempo no chat.</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. BENTO GRID DE RECURSOS (4 BLOCOS ASSIMÉTRICOS)            */}
      {/* ============================================================ */}
      <section id="recursos" className="py-20 sm:py-28 bg-white border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16">
          {/* Cabeçalho do Bento Grid */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Tecnologia e Performance
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Tudo o que seu comércio precisa para vender em alto nível
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Recursos de alta conversão empacotados em uma interface limpa, sem complexidade de programação.
            </p>
          </div>

          {/* Grid Assimétrico 4 Blocos */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Bloco 1 (Largo - col-span-12 lg:col-span-7): 'Sua Marca, Seu Domínio' */}
            <div className="lg:col-span-7 bg-slate-50/80 border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all">
              <div className="space-y-3">
                <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <Globe className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Sua Marca, Seu Domínio
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                  Tenha presença profissional no mercado. Use seu próprio domínio personalizado (ex: <code className="text-slate-800 font-mono text-xs bg-slate-200/70 px-1 py-0.5 rounded">sualoja.com.br</code>) ou subdomínio instantâneo, com conexão segura e otimização para carregamento mobile.
                </p>
              </div>

              {/* Input simulado de navegador com URL e Badge SSL */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3">
                {/* Topbar com botões de janela */}
                <div className="flex items-center gap-1.5 pb-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="text-[10px] text-slate-400 ml-2 font-mono">Navegador do Cliente</span>
                </div>

                {/* Barra de Endereço Simulada */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between text-xs font-mono shadow-inner gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-400 text-[11px]">https://</span>
                    <span className="text-slate-900 font-semibold text-xs truncate">
                      loja.seudominio.com.br
                    </span>
                  </div>
                  {/* Badge de certificado SSL grátis */}
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 flex-shrink-0">
                    <ShieldCheck className="w-3 h-3" />
                    Certificado SSL Grátis
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
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
                    Pronto para a bio do Instagram
                  </span>
                </div>
              </div>
            </div>

            {/* Bloco 2 (Médio - col-span-12 lg:col-span-5): 'Zero Comissões' */}
            <div className="lg:col-span-5 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-lg">
              <div className="space-y-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Percent className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Zero Comissões
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  100% do lucro das suas vendas fica direto com você. Sem cobrança de porcentagem por pedido e sem reter dinheiro das suas vendas.
                </p>
              </div>

              {/* Destaque Visual 100% do Lucro */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-center space-y-3">
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
                    <span className="text-slate-500 block">Marketplaces</span>
                    <span className="text-rose-400 font-bold">18% a 27% por pedido</span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-left">
                    <span className="text-slate-400 block">Nosso Catálogo</span>
                    <span className="text-emerald-400 font-bold">0% de taxa (R$ 0,00)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 3 (Médio - col-span-12 lg:col-span-5): 'Painel Simples no Celular' */}
            <div className="lg:col-span-5 bg-slate-50/80 border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all">
              <div className="space-y-3">
                <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Painel Simples no Celular
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Altere preços, estoque e fotos em segundos. Funciona perfeitamente pelo navegador do smartphone ou conectado à sua planilha Google Sheets.
                </p>
              </div>

              {/* Ilustração Visual de Edição Rápida */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-900">Edição Rápida de Produto</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                    Salvo instantaneamente
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
                    <span className="text-slate-600 text-xs">Estoque Ativo:</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Em Pronta Entrega
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 4 (Largo - col-span-12 lg:col-span-7): 'Pedido Pré-Formatado' */}
            <div className="lg:col-span-7 bg-slate-50/80 border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all">
              <div className="space-y-3">
                <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
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
                    <span className="font-semibold text-slate-800">WhatsApp da sua Loja</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Hoje às 14:32</span>
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
      {/* 5. CALCULADORA DE ECONOMIA (MARKETPLACE X CATÁLOGO PRÓPRIO)  */}
      {/* ============================================================ */}
      <section id="calculadora" className="py-20 sm:py-28 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Calculadora de Economia Real
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Quanto você deixa na mesa todos os meses em taxas abusivas?
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Arraste os seletores abaixo e veja na ponta do lápis quanto sobra no seu bolso vendendo com catálogo próprio.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-lg">
          {/* Controles da Calculadora */}
          <div className="lg:col-span-7 space-y-8">
            {/* Slider 1: Faturamento */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Seu Faturamento Mensal Estimado:
                </label>
                <span className="text-base sm:text-xl font-extrabold text-slate-900">
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
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>R$ 3.000</span>
                <span>R$ 40.000</span>
                <span>R$ 80.000+</span>
              </div>
            </div>

            {/* Slider 2: Taxa de Marketplace */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-slate-500" />
                  Taxa Cobrada por Apps / Marketplaces:
                </label>
                <span className="text-base sm:text-xl font-extrabold text-slate-900">
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
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>10% (Mínima)</span>
                <span>18% (Média de delivery)</span>
                <span>28% (Comissão máxima)</span>
              </div>
            </div>

            {/* Comparativo Rápido */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 block">Comissão Perdida/Mês:</span>
                <span className="text-base sm:text-lg font-bold text-rose-600">
                  {formatCurrency(monthlyFeeAmount, 'BRL')}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80">
                <span className="text-[11px] font-medium text-emerald-800 block">Comissão no Catálogo Zap:</span>
                <span className="text-base sm:text-lg font-bold text-emerald-700">
                  R$ 0,00 (0%)
                </span>
              </div>
            </div>
          </div>

          {/* Resultado do Lucro Retido */}
          <div className="lg:col-span-5 bg-slate-900 p-6 sm:p-8 rounded-2xl text-white text-center space-y-5">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
              Economia Estimada
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
                <span>Custo Anual do Sistema:</span>
                <span className="font-semibold text-white">{formatCurrency(saasYearlyCost, 'BRL')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Taxa por pedido:</span>
                <span className="font-bold text-emerald-400">0% (Isento)</span>
              </div>
            </div>

            <Link
              href="/criar-loja"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 shadow-sm transition-colors cursor-pointer"
            >
              <span>Economizar Agora</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. PROVA SOCIAL & DEPOIMENTOS DE LOJISTAS                    */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-28 bg-slate-50/60 border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16">
          {/* Métricas Principais da Plataforma */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 text-center space-y-1 shadow-2xs">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] block tracking-tight">1.200+</span>
              <span className="text-xs text-slate-500 font-medium block">Lojas Ativas</span>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 text-center space-y-1 shadow-2xs">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] block tracking-tight">R$ 4.8M+</span>
              <span className="text-xs text-slate-500 font-medium block">Transacionados</span>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 text-center space-y-1 shadow-2xs">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 block tracking-tight">R$ 0,00</span>
              <span className="text-xs text-slate-500 font-medium block">Retido em Taxas</span>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 text-center space-y-1 shadow-2xs">
              <div className="flex items-center justify-center gap-1 text-amber-500">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] block tracking-tight">4.9</span>
                <Star className="w-4 h-4 fill-amber-500 text-amber-500 inline" />
              </div>
              <span className="text-xs text-slate-500 font-medium block">Avaliação dos Lojistas</span>
            </div>
          </div>

          {/* Depoimentos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 flex flex-col justify-between space-y-4 shadow-2xs">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                &ldquo;Economizamos mais de R$ 2.400 por mês que antes iam embora em comissões de delivery. O cliente monta o lanche, copia o PIX e o pedido cai no nosso WhatsApp 100% pronto.&rdquo;
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-100">
                  FC
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Felipe Costa</h4>
                  <span className="text-[11px] text-slate-400 block">Artesanal Burger & Beer • SP</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 flex flex-col justify-between space-y-4 shadow-2xs">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                &ldquo;Nossa loja no Instagram converteu muito mais depois que colocamos o link na bio. O cliente vê os tamanhos disponíveis na hora e não fica horas perguntando preço no direct.&rdquo;
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                  CD
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Camila Duarte</h4>
                  <span className="text-[11px] text-slate-400 block">Bella Flor Boutique • MG</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 flex flex-col justify-between space-y-4 shadow-2xs">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                &ldquo;Atualizo os preços na planilha do Google Sheets direto pelo celular e em 5 segundos já tá no ar para os clientes. Praticidade nota 10, sem complicação de programação.&rdquo;
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-100">
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
      {/* 7. TABELA DE PLANOS & PREÇOS (TRANSPARÊNCIA TOTAL)           */}
      {/* ============================================================ */}
      <section id="precos" className="py-20 sm:py-28 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-14 space-y-3">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Investimento Transparente
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Plano único, sem pegadinhas nem fidelidade
          </h2>
          <p className="text-sm text-slate-600">
            Comece com 30 dias de teste grátis. Apenas R$ 129,90/mês após o teste. Cancele quando quiser com 1 clique.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-semibold uppercase tracking-wider px-3.5 py-0.5 rounded-full whitespace-nowrap">
              30 Dias Grátis para Testar
            </span>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Plano Mensal Completo</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Acesso irrestrito a todos os recursos da plataforma.
              </p>
            </div>

            <div className="border-y border-slate-100 py-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">R$ 129,90</span>
                <span className="text-xs text-slate-500 font-medium">/mês</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                Sem necessidade de cadastrar cartão para iniciar o teste.
              </span>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span><strong>0% de taxas</strong> por pedido</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Produtos e fotos ilimitados</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Google Sheets sincronizado em tempo real</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Chave PIX com cópia em 1 clique</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Suporte a domínio personalizado próprio</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Painel administrativo para celular e computador</span>
              </li>
            </ul>

            <Link
              href="/criar-loja?plan=monthly"
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-colors cursor-pointer"
            >
              <span>Começar Teste Grátis de 30 Dias</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. PERGUNTAS FREQUENTES (FAQ)                                */}
      {/* ============================================================ */}
      <section id="faq" className="py-20 sm:py-28 bg-slate-50/60 border-t border-slate-200/80">
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
      {/* 9. CTA FINAL DE CONVERSÃO                                    */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-28 bg-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Pronto para ver suas vendas no WhatsApp decolarem?
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Crie seu catálogo agora mesmo. Não precisa de cartão de crédito e sua loja fica pronta em menos de 2 minutos.
          </p>
          <div className="pt-2">
            <Link
              href="/criar-loja"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 shadow-sm transition-colors cursor-pointer"
            >
              <span>Criar Catálogo Grátis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 10. FOOTER INSTITUCIONAL                                     */}
      {/* ============================================================ */}
      <footer className="bg-white border-t border-slate-200/80 py-12 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-sm font-bold text-slate-900">
                Catálogo<span className="text-emerald-600">Zap</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-5 text-slate-500">
              <Link href="/criar-loja" className="hover:text-slate-900 transition-colors">
                Criar Nova Loja
              </Link>
              <Link href="/admin/login" className="hover:text-slate-900 transition-colors">
                Painel do Lojista
              </Link>
              <Link href="/saas-admin" className="hover:text-slate-900 transition-colors">
                Administração SaaS
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <p>© {new Date().getFullYear()} CatálogoZap SaaS. Todos os direitos reservados.</p>
            <p>Plataforma White-Label Multi-Tenant com Google Sheets & WhatsApp</p>
          </div>
        </div>
      </footer>

      {/* CTA Flutuante Discreto no Mobile */}
      <aside aria-label="Ação rápida no mobile" className="fixed bottom-0 inset-x-0 z-40 p-3 sm:hidden bg-white/90 backdrop-blur-md border-t border-slate-200">
        <Link
          href="/criar-loja"
          className="w-full py-3 px-4 rounded-xl text-xs font-semibold text-white bg-slate-900 shadow-sm flex items-center justify-center gap-2 active:scale-98 transition"
        >
          <span>Criar Catálogo Grátis • 30 Dias</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </aside>
    </div>
  );
}
