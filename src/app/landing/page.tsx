'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Check,
  Smartphone,
  Store,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Percent,
  ShieldCheck,
  Globe,
  Lock,
  X,
  XCircle,
} from 'lucide-react';
import { normalizePhoneNumber } from '@/lib/whatsapp';
import { DEMO_STORES } from '@/lib/demoStores';

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
    question: 'Como funciona o link da minha vitrine?',
    answer:
      'Sua loja recebe um link exclusivo e seguro (ex: numclick.app/sualoja) com certificado SSL gratuito. Basta colar o link na bio do Instagram ou compartilhar no WhatsApp para seus clientes comprarem instantaneamente.',
  },
  {
    question: 'Como funciona o teste grátis de 7 dias?',
    answer:
      'Você cria sua loja agora mesmo sem precisar cadastrar cartão de crédito. Experimente por 7 dias grátis com todas as funcionalidades liberadas. Só continua se o catálogo realmente aumentar suas vendas. Sem fidelidade, cancele quando quiser.',
  },
];

export default function SaaSCommercialLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
    <div className="min-h-screen bg-[#E9ECEF] text-[#212529] selection:bg-[#FB5607] selection:text-white font-sans antialiased w-full overflow-x-hidden">
      {/* ============================================================ */}
      {/* 1. NAVBAR MINIMALISTA & ELEGANTE — PALETA OFICIAL NUMCLICK   */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 bg-[#E9ECEF]/90 backdrop-blur-md border-b border-[#212529]/10 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo Oficial NumClick (Pasta marca/) */}
          <Link href="/landing" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl overflow-hidden shadow-xs border border-[#212529]/15 group-hover:scale-105 transition-transform flex items-center justify-center bg-[#FB5607]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/numclick-badge.png"
                alt="NumClick Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/marca/marca-light.svg"
                alt="NumClick"
                className="h-5 sm:h-6 w-auto object-contain object-left"
              />
              <span className="text-[10px] font-bold tracking-wide bg-[#8338EC]/12 text-[#8338EC] border border-[#8338EC]/25 px-1.5 py-0.5 rounded-md hidden sm:inline-block">
                SaaS
              </span>
            </div>
          </Link>

          {/* Navegação Desktop (Sem link de Calculadora) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-[#212529]/80">
            <a href="#exemplos" className="hover:text-[#FB5607] transition-colors">
              Exemplos
            </a>
            <a href="#comparativo" className="hover:text-[#FB5607] transition-colors">
              Antes & Depois
            </a>
            <a href="#recursos" className="hover:text-[#FB5607] transition-colors">
              Recursos
            </a>
            <a href="#precos" className="hover:text-[#FB5607] transition-colors">
              Preço
            </a>
            <a href="#faq" className="hover:text-[#FB5607] transition-colors">
              Dúvidas
            </a>
          </nav>

          {/* Ações Rápidas */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#212529]/80 hover:text-[#212529] hover:bg-white/70 transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-[#8338EC]" />
              <span>Painel</span>
            </Link>

            <Link
              href="/criar-loja"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-[#FB5607] hover:bg-[#8338EC] shadow-xs hover:shadow active:scale-[0.98] transition-all"
            >
              <span>Testar Grátis por 7 Dias</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* SEÇÃO 1 (FUNDO CLARO #E9ECEF): HERO + LOJAS DE EXEMPLO       */}
      {/* ============================================================ */}
      <section className="relative pt-10 sm:pt-16 md:pt-20 pb-16 sm:pb-24 overflow-x-hidden bg-[#E9ECEF]">
        {/* Efeito sutil de luz ambiente no fundo com as cores da marca */}
        <div className="absolute top-0 inset-x-0 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(251,86,7,0.12),rgba(131,56,236,0.06),transparent)] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5 sm:space-y-7 relative z-10">
          {/* Badge de Destaque no topo */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#8338EC]/30 text-xs font-bold text-[#8338EC] shadow-2xs max-w-full">
            <span className="flex h-2 w-2 rounded-full bg-[#FB5607] animate-pulse flex-shrink-0" />
            <span className="truncate">Experimente por 7 dias grátis • Sem cartão de crédito</span>
          </div>

          {/* Título Principal curto e focado na conversão */}
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#212529] leading-[1.14] max-w-3xl mx-auto break-words">
            Transforme seu WhatsApp em uma{' '}
            <span className="text-[#FB5607]">máquina de vendas</span>, sem taxas por pedido.
          </h1>

          {/* Subtítulo direto */}
          <p className="text-sm xs:text-base sm:text-lg md:text-xl text-[#212529]/75 font-normal leading-relaxed max-w-2xl mx-auto">
            Substitua PDFs pesados e conversas confusas por um catálogo rápido com seu link exclusivo, cores da sua marca e pedido detalhado direto no seu Zap.
          </p>

          {/* Grupo de CTAs de Alta Conversão */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-lg mx-auto">
            {/* Botão 1 (Destaque Principal de Conversão) */}
            <Link
              href="/criar-loja"
              title="Criar sua loja e testar 7 dias grátis sem cartão"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-[#FB5607] hover:bg-[#8338EC] shadow-md shadow-[#FB5607]/25 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Começar Teste de 7 Dias Grátis</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>

            {/* Botão 2 (Secundário Outline) */}
            <Link
              href="#exemplos"
              title="Conhecer lojas de exemplo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-[#212529] bg-white hover:bg-[#212529] hover:text-[#E9ECEF] border border-[#212529]/15 shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Ver Demonstração ao Vivo</span>
              <ArrowRight className="w-4 h-4 text-[#8338EC]" />
            </Link>
          </div>

          {/* Aviso sutil anti-objeção obrigatório */}
          <p className="text-xs text-[#212529]/65 font-medium pt-1">
            Sem fidelidade • Cancele quando quiser • Comece em menos de 2 minutos
          </p>

          {/* Micro-prova de confiança sutil */}
          <div className="pt-1 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-[#212529]/75 font-medium">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#FB5607] stroke-[2.5]" />
              Sem cartão de crédito
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#FB5607] stroke-[2.5]" />
              Configuração em 2 minutos
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#FB5607] stroke-[2.5]" />
              Sincronização em tempo real
            </span>
          </div>
        </div>

        {/* BLOCO: LOJAS DE EXEMPLO (EXATAMENTE 2 SLOTS EXCLUSIVOS) */}
        <div id="exemplos" className="mt-12 sm:mt-16 max-w-4xl mx-auto px-4 sm:px-6">
          {/* Cabeçalho Compacto das Lojas de Exemplo */}
          <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8 space-y-2 px-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8338EC] bg-white px-3 py-1 rounded-full border border-[#8338EC]/25 shadow-2xs">
              <Store className="w-3.5 h-3.5 text-[#FB5607]" />
              Lojas Modelo
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#212529] tracking-tight">
              Veja modelos de catálogos prontos
            </h2>
            <p className="text-xs sm:text-sm text-[#212529]/70">
              Acesse os modelos abaixo e veja na prática como a navegação e a experiência de compra são rápidas:
            </p>
          </div>

          {/* 2 Cards de Demonstração */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {DEMO_STORES.map((store) => {
              const isAvailable = store.isAvailable && store.url !== '#';

              if (!isAvailable) {
                return (
                  <div
                    key={store.id}
                    className="relative flex flex-col justify-between p-5 rounded-2xl bg-white/60 border border-dashed border-[#212529]/25 text-left opacity-90 select-none shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[#212529]/10 text-[#212529]/70 flex items-center justify-center flex-shrink-0">
                          <Store className="w-5 h-5" />
                        </div>
                        <span className="inline-flex items-center text-[10px] font-bold text-[#8338EC] bg-[#8338EC]/10 border border-[#8338EC]/25 px-2.5 py-0.5 rounded-full flex-shrink-0">
                          {store.badge}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#212529]">
                          {store.name}
                        </h3>
                        <p className="text-[11px] font-medium text-[#212529]/60 mt-0.5">
                          {store.category}
                        </p>
                        <p className="text-xs text-[#212529]/70 mt-2">
                          {store.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 pt-3 border-t border-[#212529]/10 flex items-center justify-between text-xs font-semibold text-[#212529]/50">
                      <span>Em breve no ar</span>
                      <span className="text-[10px] bg-[#212529]/10 px-2 py-0.5 rounded text-[#212529]/70 font-mono">
                        Slot 2
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <a
                  key={store.id}
                  href={store.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col justify-between p-5 rounded-2xl bg-white border border-[#212529]/15 hover:border-[#FB5607] hover:shadow-md active:scale-[0.98] transition-all duration-200 text-left shadow-xs cursor-pointer"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FB5607]/10 group-hover:bg-[#FB5607] text-[#FB5607] group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
                        <Store className="w-5 h-5" />
                      </div>
                      <span className="inline-flex items-center text-[10px] font-bold text-[#FB5607] bg-[#FB5607]/10 border border-[#FB5607]/25 px-2.5 py-0.5 rounded-full flex-shrink-0">
                        {store.badge}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#212529] group-hover:text-[#FB5607] transition-colors">
                        {store.name}
                      </h3>
                      <p className="text-[11px] font-semibold text-[#8338EC] mt-0.5">
                        {store.category}
                      </p>
                      <p className="text-xs text-[#212529]/70 mt-2 line-clamp-2">
                        {store.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 pt-3 border-t border-[#212529]/10 flex items-center justify-between text-xs font-bold text-[#212529] group-hover:text-[#FB5607] transition-colors">
                    <span>Acessar vitrine</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8338EC] group-hover:text-[#FB5607] group-hover:translate-x-1 transition-all" />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SEÇÃO 2 (FUNDO ESCURO #212529): COMPARATIVO 'ANTES & DEPOIS' */}
      {/* ============================================================ */}
      <section id="comparativo" className="py-20 sm:py-28 bg-[#212529] text-[#E9ECEF] border-y border-white/10 overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-14">
          {/* Cabeçalho da Seção em Dark Mode */}
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#FB5607] bg-[#FB5607]/15 border border-[#FB5607]/30 px-3 py-1 rounded-full">
              Comparativo Prático
            </span>
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-white tracking-tight break-words">
              A diferença real na rotina do seu comércio
            </h2>
            <p className="text-xs xs:text-sm sm:text-base text-[#E9ECEF]/75 leading-relaxed">
              Veja como você economiza tempo e elimina o estresse do atendimento manual no WhatsApp.
            </p>
          </div>

          {/* 2 Cards Lado a Lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            {/* Card 1: 'O Jeito Antigo' */}
            <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-5 sm:p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-bold">
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    O Jeito Antigo
                  </span>
                  <span className="text-[11px] font-semibold text-rose-400">Sem sistema</span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  Conversas caóticas e perda diária de pedidos
                </h3>
                <p className="text-xs sm:text-sm text-[#E9ECEF]/70 leading-relaxed">
                  Muito esforço manual para pouca conversão, com clientes impacientes esperando respostas.
                </p>

                <ul className="space-y-3.5 pt-2">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-xs sm:text-sm font-bold text-white block">
                        PDFs pesados de 40MB que travam o celular
                      </strong>
                      <p className="text-xs text-[#E9ECEF]/70 leading-relaxed">
                        Arquivos lentos que demoram para baixar no 4G, enchem a memória do cliente e ficam desatualizados no dia seguinte.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-xs sm:text-sm font-bold text-white block">
                        Cliente perguntando preço e tamanho o dia todo
                      </strong>
                      <p className="text-xs text-[#E9ECEF]/70 leading-relaxed">
                        Dezenas de mensagens manuais no direct e no WhatsApp para tirar dúvidas básicas que poderiam estar visíveis com 1 clique.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-xs sm:text-sm font-bold text-white block">
                        Pedidos anotados no papel com erro
                      </strong>
                      <p className="text-xs text-[#E9ECEF]/70 leading-relaxed">
                        Anotações perdidas em comandas ou blocos de notas, esquecimento de adicionais, troco errado e endereço incompleto.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-white/10 text-[11px] text-rose-400 font-medium">
                Resultado: Clientes desistem antes de comprar e o lojista perde horas no chat.
              </div>
            </div>

            {/* Card 2: 'Com Nosso Catálogo' (Card de Alto Destaque com Paleta NumClick) */}
            <div className="rounded-3xl bg-gradient-to-b from-[#8338EC]/20 to-black/40 border-2 border-[#FB5607] p-5 sm:p-8 space-y-6 flex flex-col justify-between shadow-2xl shadow-[#FB5607]/15 relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FB5607] text-white text-xs font-bold shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    Com NumClick
                  </span>
                  <span className="text-[11px] font-bold text-[#E9ECEF] bg-[#8338EC]/40 px-2.5 py-0.5 rounded-full border border-[#8338EC]/60">
                    Moderno & Rápido
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  Vendas rápidas, automáticas e organizadas
                </h3>
                <p className="text-xs sm:text-sm text-[#E9ECEF]/80 leading-relaxed">
                  O cliente tem autonomia para navegar e o pedido chega pronto para faturar.
                </p>

                <ul className="space-y-3.5 pt-2">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-[#FB5607]/20 text-[#FB5607] border border-[#FB5607]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-xs sm:text-sm font-bold text-white block">
                        Link limpo na bio do Instagram
                      </strong>
                      <p className="text-xs text-[#E9ECEF]/75 leading-relaxed">
                        Carregamento instantâneo no navegador do celular, sem necessidade de baixar aplicativo e sempre atualizado em tempo real.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-[#FB5607]/20 text-[#FB5607] border border-[#FB5607]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-xs sm:text-sm font-bold text-white block">
                        Cliente escolhe cor/tamanho e clica em pedir
                      </strong>
                      <p className="text-xs text-[#E9ECEF]/75 leading-relaxed">
                        Fotos nítidas, variações organizadas, cálculo automático de frete ou retirada e botão para copiar chave PIX em 1 toque.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-[#FB5607]/20 text-[#FB5607] border border-[#FB5607]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-xs sm:text-sm font-bold text-white block">
                        Pedido chega organizado e somado no WhatsApp
                      </strong>
                      <p className="text-xs text-[#E9ECEF]/75 leading-relaxed">
                        Mensagem pré-formatada com itens, adicionais, dados de entrega e valor total calculado, pronto para você só despachar.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-white/10 text-[11px] text-[#FB5607] font-bold flex items-center justify-between">
                <span>Resultado: Mais vendas diárias e menos tempo no chat.</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SEÇÃO 3 (FUNDO CLARO #E9ECEF): BENTO GRID DE RECURSOS        */}
      {/* ============================================================ */}
      <section id="recursos" className="py-20 sm:py-28 bg-[#E9ECEF] border-b border-[#212529]/10 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-14">
          {/* Cabeçalho do Bento Grid */}
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8338EC] bg-white px-3 py-1 rounded-full border border-[#8338EC]/25 uppercase tracking-wider shadow-2xs">
              Tecnologia e Performance
            </span>
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-[#212529] tracking-tight break-words">
              Tudo o que seu comércio precisa para vender em alto nível
            </h2>
            <p className="text-xs xs:text-sm sm:text-base text-[#212529]/75 leading-relaxed">
              Recursos de alta conversão empacotados em uma interface limpa, sem complexidade de programação.
            </p>
          </div>

          {/* Grid Assimétrico 4 Blocos */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">
            {/* Bloco 1 (Largo - col-span-12 lg:col-span-7): 'Sua Vitrine Instantânea na Web' */}
            <div className="lg:col-span-7 bg-white border border-[#212529]/10 rounded-3xl p-5 sm:p-8 space-y-6 flex flex-col justify-between shadow-xs hover:border-[#8338EC]/40 transition-all">
              <div className="space-y-2.5">
                <div className="h-10 w-10 rounded-xl bg-[#212529] text-white flex items-center justify-center shadow-xs">
                  <Globe className="w-4 h-4 text-[#FB5607]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#212529] tracking-tight">
                  Sua Vitrine Instantânea na Web
                </h3>
                <p className="text-xs sm:text-sm text-[#212529]/70 leading-relaxed max-w-xl">
                  Tenha presença profissional no mercado. Cada loja recebe um link exclusivo e otimizado (ex:{' '}
                  <code className="text-[#8338EC] font-mono text-xs bg-[#8338EC]/10 px-1.5 py-0.5 rounded font-bold">
                    numclick.app/sualoja
                  </code>
                  ) pronto para colocar na bio do Instagram e compartilhar no WhatsApp, com conexão ultrarrápida e certificado SSL.
                </p>
              </div>

              {/* Input simulado de navegador com URL e Badge SSL */}
              <div className="bg-[#E9ECEF]/70 border border-[#212529]/10 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-1.5 pb-1">
                  <span className="h-2 w-2 rounded-full bg-[#FB5607]" />
                  <span className="h-2 w-2 rounded-full bg-[#8338EC]" />
                  <span className="h-2 w-2 rounded-full bg-[#212529]/30" />
                  <span className="text-[10px] text-[#212529]/60 ml-2 font-mono truncate">
                    Navegador do Cliente
                  </span>
                </div>

                <div className="bg-white border border-[#212529]/15 rounded-xl px-2.5 sm:px-3 py-2 flex items-center justify-between text-xs font-mono shadow-inner gap-2 overflow-hidden">
                  <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                    <Lock className="w-3.5 h-3.5 text-[#FB5607] flex-shrink-0" />
                    <span className="text-[#212529]/45 text-[11px] hidden sm:inline">https://</span>
                    <span className="text-[#212529] font-bold text-xs truncate">
                      numclick.app/sualoja
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8338EC] bg-[#8338EC]/10 px-2 py-0.5 rounded-full border border-[#8338EC]/25 flex-shrink-0">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="hidden sm:inline">Certificado </span>SSL Grátis
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-[11px] text-[#212529]/70 pt-1 font-medium">
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-[#FB5607]" />
                    Sem menções a terceiros
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-[#FB5607]" />
                    Hospedagem inclusa
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-[#FB5607]" />
                    Pronto para bio
                  </span>
                </div>
              </div>
            </div>

            {/* Bloco 2 (Médio - col-span-12 lg:col-span-5): 'Zero Comissões' */}
            <div className="lg:col-span-5 bg-[#212529] text-white rounded-3xl p-5 sm:p-8 space-y-6 flex flex-col justify-between shadow-lg">
              <div className="space-y-2.5">
                <div className="h-10 w-10 rounded-xl bg-[#FB5607]/20 border border-[#FB5607]/40 text-[#FB5607] flex items-center justify-center">
                  <Percent className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Zero Comissões
                </h3>
                <p className="text-xs sm:text-sm text-[#E9ECEF]/75 leading-relaxed">
                  100% do lucro das suas vendas fica direto com você. Sem cobrança de porcentagem por pedido e sem reter dinheiro das suas vendas.
                </p>
              </div>

              {/* Destaque Visual 100% do Lucro */}
              <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-4 sm:p-5 text-center space-y-3">
                <div className="space-y-0.5">
                  <span className="text-4xl sm:text-5xl font-black text-[#FB5607] tracking-tight block">
                    100%
                  </span>
                  <span className="text-xs text-[#E9ECEF] font-semibold tracking-wide uppercase">
                    Do lucro fica com o lojista
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                  <div className="p-2 rounded-lg bg-black/30 border border-white/10 text-left">
                    <span className="text-[#E9ECEF]/60 block text-[10px]">Marketplaces</span>
                    <span className="text-rose-400 font-bold text-xs">18% a 27%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#8338EC]/25 border border-[#8338EC]/50 text-left">
                    <span className="text-[#E9ECEF]/80 block text-[10px]">NumClick</span>
                    <span className="text-[#FB5607] font-bold text-xs">0% (R$ 0,00)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 3 (Médio - col-span-12 lg:col-span-5): 'Painel Simples no Celular' */}
            <div className="lg:col-span-5 bg-white border border-[#212529]/10 rounded-3xl p-5 sm:p-8 space-y-6 flex flex-col justify-between shadow-xs hover:border-[#8338EC]/40 transition-all">
              <div className="space-y-2.5">
                <div className="h-10 w-10 rounded-xl bg-[#8338EC] text-white flex items-center justify-center shadow-xs">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#212529] tracking-tight">
                  Painel Simples no Celular
                </h3>
                <p className="text-xs sm:text-sm text-[#212529]/70 leading-relaxed">
                  Altere preços, estoque e fotos em segundos. Funciona perfeitamente direto pelo navegador do smartphone ou computador.
                </p>
              </div>

              {/* Ilustração Visual de Edição Rápida */}
              <div className="bg-[#E9ECEF]/70 border border-[#212529]/10 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#212529]/10 pb-2">
                  <span className="text-xs font-bold text-[#212529]">Edição Rápida</span>
                  <span className="text-[10px] font-bold text-[#FB5607] bg-[#FB5607]/10 px-2 py-0.5 rounded-full border border-[#FB5607]/25">
                    Salvo na hora
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#212529]/60 font-medium block">Preço Promocional</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-[#212529]/15 font-bold text-[#212529]">
                        R$ 38,90
                      </span>
                      <span className="text-[10px] text-[#212529]/45 line-through">R$ 44,90</span>
                      <span className="text-[10px] text-[#8338EC] font-bold bg-[#8338EC]/10 px-1.5 py-0.5 rounded">
                        -13% OFF
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[#212529]/70 text-xs">Status do Estoque:</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#212529] bg-white px-2.5 py-0.5 rounded-full border border-[#212529]/15">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#FB5607] animate-pulse" />
                      Pronta Entrega
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 4 (Largo - col-span-12 lg:col-span-7): 'Pedido Pré-Formatado' */}
            <div className="lg:col-span-7 bg-white border border-[#212529]/10 rounded-3xl p-5 sm:p-8 space-y-6 flex flex-col justify-between shadow-xs hover:border-[#FB5607]/40 transition-all">
              <div className="space-y-2.5">
                <div className="h-10 w-10 rounded-xl bg-[#FB5607] text-white flex items-center justify-center shadow-xs">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#212529] tracking-tight">
                  Pedido Pré-Formatado
                </h3>
                <p className="text-xs sm:text-sm text-[#212529]/70 leading-relaxed max-w-xl">
                  Adeus conversas truncadas. O cliente aperta um botão e você recebe uma mensagem padronizada no WhatsApp com item, tamanho, quantidade e subtotal calculado.
                </p>
              </div>

              {/* Caixa de Mensagem Realista do WhatsApp */}
              <div className="bg-[#E9ECEF] border border-[#212529]/15 rounded-2xl p-3 sm:p-4 space-y-2 shadow-inner">
                <div className="flex items-center justify-between text-[11px] text-[#212529]/70 pb-1 border-b border-[#212529]/10">
                  <div className="flex items-center gap-1.5">
                    <div className="h-4 w-4 rounded-full bg-[#FB5607] text-white flex items-center justify-center text-[9px] font-bold">
                      W
                    </div>
                    <span className="font-bold text-[#212529] truncate">WhatsApp da sua Loja</span>
                  </div>
                  <span className="text-[10px] text-[#212529]/60 flex-shrink-0">Hoje às 14:32</span>
                </div>

                {/* Balão do WhatsApp */}
                <div className="bg-white rounded-xl rounded-tl-xs p-3 text-xs text-[#212529] shadow-xs space-y-1.5 border border-[#212529]/10 max-w-lg">
                  <p className="font-bold text-[#212529] text-[11px]">
                    👋 Olá! Gostaria de fazer o seguinte pedido:
                  </p>
                  <div className="border-t border-[#212529]/10 pt-1.5 space-y-1 text-[11px] font-mono leading-relaxed">
                    <p className="font-bold text-[#212529] font-sans">
                      🛍️ 1x Double Smash Bacon Especial
                    </p>
                    <p className="text-[#212529]/70 text-[10px]">
                      • Ponto: Ao ponto | Molho: Da Casa
                    </p>
                    <p className="text-[#212529]/70 text-[10px]">
                      • Tipo: Entrega (Rua das Flores, 142 - Apto 32B)
                    </p>
                    <p className="text-[#212529]/70 text-[10px]">
                      • Pagamento: PIX (chave copiada no catálogo)
                    </p>
                    <div className="pt-1 border-t border-[#212529]/10 flex items-center justify-between font-sans text-xs">
                      <span className="font-extrabold text-[#FB5607]">Total: R$ 44,90</span>
                      <span className="text-[10px] text-[#8338EC] font-bold">14:32 ✓✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SEÇÃO 4 (FUNDO ESCURO #212529): PREÇO ÚNICO                  */}
      {/* (Alternância ajustada para Escuro após remoção das 2 seções) */}
      {/* ============================================================ */}
      <section id="precos" className="py-20 sm:py-28 bg-[#212529] text-[#E9ECEF] border-b border-white/10 overflow-x-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-14">
          <div className="text-center max-w-xl mx-auto space-y-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FB5607] bg-[#FB5607]/15 border border-[#FB5607]/30 px-3 py-1 rounded-full uppercase tracking-wider">
              Preço Transparente
            </span>
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-white tracking-tight break-words">
              Um único plano, sem pegadinhas nem fidelidade
            </h2>
            <p className="text-xs xs:text-sm sm:text-base text-[#E9ECEF]/75">
              Acesso irrestrito a todos os recursos da plataforma para vender mais no WhatsApp.
            </p>
          </div>

          {/* Selos em Destaque: 'Sem fidelidade' e 'Sem taxas sobre suas vendas' */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-1">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-xs font-bold text-white shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[#FB5607] flex-shrink-0" />
              <span>Sem fidelidade</span>
              <span className="text-[#E9ECEF]/60 font-normal hidden sm:inline">(Cancele quando quiser)</span>
            </div>

            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 rounded-full bg-[#8338EC]/20 border border-[#8338EC]/40 text-xs font-bold text-white shadow-2xs">
              <Percent className="w-4 h-4 text-[#FB5607] flex-shrink-0" />
              <span>Sem taxas sobre suas vendas</span>
              <span className="text-[#E9ECEF]/70 font-normal hidden sm:inline">(0% de comissão)</span>
            </div>

            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 rounded-full bg-[#FB5607]/15 border border-[#FB5607]/35 text-xs font-bold text-white shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#FB5607] flex-shrink-0" />
              <span>Experimente por 7 dias grátis</span>
              <span className="text-[#E9ECEF]/70 font-normal hidden sm:inline">(Sem cartão)</span>
            </div>
          </div>

          {/* Card Único de Plano Mensal */}
          <div className="max-w-md mx-auto">
            <div className="bg-white text-[#212529] border-2 border-[#FB5607] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-black/40 relative">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FB5607] text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-3.5 sm:px-4 py-1 rounded-full whitespace-nowrap shadow-md max-w-[92%] truncate text-center">
                Plano Único Exclusivo • 7 Dias Grátis
              </span>

              <div className="space-y-4 pt-1">
                <div>
                  <h3 className="text-lg font-bold text-[#212529]">Mensalidade Única</h3>
                  <p className="text-xs text-[#212529]/65 mt-0.5">
                    Liberdade total para o lojista, sem compromisso de longo prazo
                  </p>
                </div>

                <div className="border-y border-[#212529]/10 py-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-extrabold text-[#212529] tracking-tight">
                      R$ 79,90
                    </span>
                    <span className="text-xs sm:text-sm text-[#212529]/65 font-medium">/mês</span>
                    <span className="ml-auto text-[11px] font-bold text-[#8338EC] bg-[#8338EC]/10 border border-[#8338EC]/25 px-2 py-0.5 rounded-full">
                      Apenas R$ 2,66/dia
                    </span>
                  </div>
                  <span className="text-[11px] text-[#212529]/65 block mt-1.5">
                    Experimente por 7 dias grátis • Sem cartão de crédito para iniciar
                  </span>
                </div>

                {/* Lista dos Recursos Inclusos */}
                <ul className="space-y-3.5 text-xs sm:text-sm text-[#212529]/85">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FB5607] flex-shrink-0 stroke-[2.5]" />
                    <span>
                      <strong>Suporte Direto</strong> humanizado no WhatsApp
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FB5607] flex-shrink-0 stroke-[2.5]" />
                    <span>
                      <strong>Painel de Gestão</strong> para celular e computador
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FB5607] flex-shrink-0 stroke-[2.5]" />
                    <span>
                      <strong>Atualizações Ilimitadas</strong> (produtos, fotos e preços)
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FB5607] flex-shrink-0 stroke-[2.5]" />
                    <span>Chave PIX com cópia rápida em 1 clique</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FB5607] flex-shrink-0 stroke-[2.5]" />
                    <span>
                      <strong>Catálogo Rápido</strong> pronto para a bio do Instagram
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FB5607] flex-shrink-0 stroke-[2.5]" />
                    <span>
                      <strong>0% de taxas</strong> sobre suas vendas (lucro 100% seu)
                    </span>
                  </li>
                </ul>
              </div>

              {/* Ações: CTA Principal de Conversão Imediata + Suporte WhatsApp */}
              <div className="space-y-2.5 pt-2">
                <Link
                  href="/criar-loja"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#FB5607] hover:bg-[#8338EC] shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span>Começar Teste de 7 Dias Grátis</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </Link>

                <p className="text-[11px] text-center text-[#212529]/60 font-medium py-0.5">
                  Sem fidelidade • Cancele quando quiser • Comece em menos de 2 minutos
                </p>

                <a
                  href={commercialWhatsappHireUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold text-[#8338EC] hover:text-[#FB5607] transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#FB5607]" />
                  <span>Prefere falar com um especialista no WhatsApp?</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SEÇÃO 5 (FUNDO CLARO #E9ECEF): PERGUNTAS FREQUENTES (FAQ)    */}
      {/* ============================================================ */}
      <section id="faq" className="py-20 sm:py-28 bg-[#E9ECEF] border-b border-[#212529]/10 overflow-x-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8338EC] bg-white px-3 py-1 rounded-full border border-[#8338EC]/25 uppercase tracking-wider shadow-2xs">
              Tire Suas Dúvidas
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#212529] tracking-tight">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-xl bg-white border overflow-hidden transition-all shadow-2xs ${
                    isOpen ? 'border-[#8338EC]' : 'border-[#212529]/10'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-[#212529] leading-snug">
                      {item.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#FB5607] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#212529]/50 flex-shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-[#212529]/75 leading-relaxed border-t border-[#212529]/10">
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
      {/* SEÇÃO 6 (FUNDO ESCURO #212529): CTA FINAL & RODAPÉ           */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-28 bg-[#212529] text-white text-center overflow-x-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FB5607]/15 border border-[#FB5607]/35 text-xs font-bold text-[#FB5607] shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Experimente por 7 dias grátis</span>
          </div>

          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold tracking-tight break-words">
            Pronto para ver suas vendas no WhatsApp decolarem?
          </h2>
          <p className="text-xs xs:text-sm sm:text-base text-[#E9ECEF]/75 max-w-xl mx-auto leading-relaxed">
            Experimente por 7 dias grátis. Não precisa de cartão de crédito e sua loja fica pronta em menos de 2 minutos.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/criar-loja"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-[#FB5607] hover:bg-[#8338EC] shadow-lg shadow-[#FB5607]/25 transition-all cursor-pointer"
            >
              <span>Começar Teste de 7 Dias Grátis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href={commercialWhatsappHireUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-[#E9ECEF] bg-white/10 hover:bg-white/15 border border-white/15 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-[#FB5607]" />
              <span>Falar no WhatsApp Comercial</span>
            </a>
          </div>

          {/* Aviso sutil anti-objeção obrigatório */}
          <p className="text-xs text-[#E9ECEF]/65 font-medium pt-1">
            Sem fidelidade • Cancele quando quiser • Comece em menos de 2 minutos
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* RODAPÉ MINIMALISTA (FUNDO ESCURO #212529)                    */}
      {/* ============================================================ */}
      <footer className="bg-[#212529] border-t border-white/10 py-12 pb-24 md:pb-12 text-xs text-[#E9ECEF]/70 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg overflow-hidden border border-white/15 flex items-center justify-center bg-[#FB5607]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/numclick-badge.png"
                    alt="NumClick Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/marca/marca-dark.svg"
                  alt="NumClick"
                  className="h-5 w-auto object-contain"
                />
              </div>
              <p className="text-xs text-[#E9ECEF]/65 font-medium">
                Feito para fortalecer o comércio local
              </p>
            </div>

            {/* Links rápidos de contato e navegação */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-[#E9ECEF]/85">
              <a
                href={commercialWhatsappHireUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#FB5607] transition-colors flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#FB5607]" />
                <span>WhatsApp Comercial</span>
              </a>
              <Link href="/criar-loja" className="hover:text-[#FB5607] transition-colors">
                Criar Loja
              </Link>
              <Link href="/admin/login" className="hover:text-[#FB5607] transition-colors">
                Painel do Lojista
              </Link>
              <Link href="/saas-admin" className="hover:text-[#FB5607] transition-colors">
                Administração SaaS
              </Link>
            </div>
          </div>

          {/* Linha de Termos simples e Copyright */}
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#E9ECEF]/55">
            <p>© {new Date().getFullYear()} NumClick SaaS. Todos os direitos reservados.</p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
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
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FB5607] hover:bg-[#8338EC] text-white font-bold text-xs shadow-lg shadow-[#212529]/30 active:scale-95 transition-all ring-2 ring-white/90"
          aria-label="Falar com Especialista no WhatsApp"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          <MessageCircle className="w-4 h-4" />
          <span>Falar com Especialista</span>
        </a>
      </div>
    </div>
  );
}
