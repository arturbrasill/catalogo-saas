'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Lock,
  Loader2,
  Store,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { LoginSchema } from '@/lib/schemas';
import { z } from 'zod';

type LoginFormData = z.infer<typeof LoginSchema>;

export default function AdminLoginPage() {
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    try {
      await login(data.password);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Falha na autenticação. Verifique a senha.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Elementos visuais sutis de iluminação de fundo (Design minimalista moderno) */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-1/4 w-80 h-80 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

      <main className="w-full max-w-[420px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-slate-200/80 p-8 sm:p-10 space-y-7 relative z-10 animate-fade-in transition-all">
        {/* Cabeçalho de Identidade */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md shadow-slate-900/10">
            <Store className="w-7 h-7 stroke-[1.8]" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100/80 text-[11px] font-semibold text-emerald-700 mb-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Painel do Lojista</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Acesso Administrativo
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-[280px] mx-auto leading-relaxed">
              Gerencie seus produtos, estoque, pedidos e personalize a identidade do seu catálogo.
            </p>
          </div>
        </div>

        {/* Alerta de Erro com feedback visual */}
        {errorMessage && (
          <div
            role="alert"
            className="rounded-2xl bg-rose-50 border border-rose-200/80 p-3.5 flex items-start gap-2.5 text-xs text-rose-800 animate-shake"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Formulário de Acesso */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="admin-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Senha de Acesso
              </label>
              <span className="text-[11px] text-slate-400">Protegida por hash</span>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua senha..."
                autoComplete="current-password"
                disabled={isSubmitting}
                {...register('password')}
                className="block w-full rounded-2xl border border-slate-200 bg-slate-50/60 pl-10 pr-11 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition font-mono tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {errors.password && (
              <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 inline" />
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 px-4 text-xs sm:text-sm font-bold text-white shadow-md shadow-slate-900/10 hover:bg-slate-800 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-slate-900/10 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                <span>Validando Acesso...</span>
              </>
            ) : (
              <>
                <span>Entrar no Painel</span>
                <ArrowRight className="w-4 h-4 text-slate-300 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        {/* Rodapé com Selo de Segurança e Navegação */}
        <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-2.5 text-xs text-slate-400 text-center">
          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/70 border border-emerald-100/60 px-3 py-1 rounded-full text-[11px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ambiente seguro e isolado por tenant</span>
          </div>

          <a
            href="/"
            className="text-slate-500 hover:text-slate-900 font-medium transition inline-flex items-center gap-1 mt-1 hover:underline underline-offset-4"
          >
            &larr; Voltar para a vitrine pública da loja
          </a>
        </div>
      </main>
    </div>
  );
}
