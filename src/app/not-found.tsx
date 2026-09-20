import Link from 'next/link';
import { AlertCircle, Home, Lock } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-xs">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Página Não Encontrada (404)</h1>
          <p className="text-sm text-gray-600">
            A página solicitada não existe ou o endereço foi digitado incorretamente.
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition shadow-sm"
          >
            <Home className="w-4 h-4" />
            Ir para a Vitrine
          </Link>
          <Link
            href="/admin/login"
            className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition"
          >
            <Lock className="w-3.5 h-3.5" />
            Acessar Painel Administrativo (/admin/login)
          </Link>
        </div>
      </div>
    </div>
  );
}
