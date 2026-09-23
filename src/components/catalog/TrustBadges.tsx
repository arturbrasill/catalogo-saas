import React from 'react';
import { Truck, ShieldCheck, MessageCircle, RefreshCw } from 'lucide-react';

interface TrustBadgesProps {
  primaryColor?: string;
}

export function TrustBadges({ primaryColor }: TrustBadgesProps) {
  const badges = [
    {
      icon: Truck,
      title: 'Envio Ágil e Seguro',
      description: 'Entrega rápida na sua região ou retirada na loja física',
    },
    {
      icon: ShieldCheck,
      title: 'Compra 100% Confiável',
      description: 'Pedido oficial emitido diretamente para o lojista',
    },
    {
      icon: MessageCircle,
      title: 'Atendimento VIP WhatsApp',
      description: 'Tire dúvidas e negocie diretamente com a equipe',
    },
    {
      icon: RefreshCw,
      title: 'Garantia de Satisfação',
      description: 'Produtos de qualidade e facilidade para trocas',
    },
  ];

  return (
    <section
      className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-2xs"
      aria-label="Benefícios da Loja"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {badges.map((badge, idx) => {
          const Icon = badge.icon;
          return (
            <div
              key={idx}
              className="flex items-start gap-4 p-2 rounded-2xl hover:bg-slate-50/80 transition-colors"
            >
              <div
                className="h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs bg-brand-primary/10 text-brand-primary"
                style={
                  primaryColor
                    ? {
                        backgroundColor: `${primaryColor}15`,
                        color: primaryColor,
                      }
                    : undefined
                }
              >
                <Icon className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                  {badge.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
                  {badge.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
