import Link from 'next/link';
import { AlertCircle, Home, Lock } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#E9ECEF] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#212529]/10 p-8 text-center space-y-6">
        <div className="flex items-center justify-center gap-2.5">
          <div className="h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/numclick-badge.png" alt="NumClick" className="w-full h-full object-contain" />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marca/marca-light.svg" alt="NumClick" className="h-5 w-auto object-contain" />
        </div>

        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FB5607]/10 text-[#FB5607] border border-[#FB5607]/25 shadow-xs">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-[#212529]">Página Não Encontrada (404)</h1>
          <p className="text-sm text-[#212529]/70">
            A página solicitada não existe ou o endereço foi digitado incorretamente.
          </p>
        </div>
        <div className="flex flex-col gap-2.5 pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#FB5607] hover:bg-[#8338EC] text-white text-sm font-bold transition shadow-sm"
          >
            <Home className="w-4 h-4" />
            Ir para a Vitrine
          </Link>
          <Link
            href="/admin/login"
            className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#E9ECEF] hover:bg-[#212529] text-[#212529] hover:text-[#E9ECEF] text-xs font-bold transition"
          >
            <Lock className="w-3.5 h-3.5" />
            Acessar Painel Administrativo (/admin/login)
          </Link>
        </div>
      </div>
    </div>
  );
}
