'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Loader2, Store, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { LoginSchema } from '@/lib/schemas';
import { z } from 'zod';

type LoginFormData = z.infer<typeof LoginSchema>;

export default function AdminLoginPage() {
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setErrorMessage(err instanceof Error ? err.message : 'Falha na autenticação.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6">
        {/* Header do Login */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Painel Administrativo
          </h1>
          <p className="text-sm text-gray-500">
            Digite a senha cadastrada na planilha para acessar o catálogo.
          </p>
        </div>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3.5 flex items-start gap-2.5 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
            >
              Senha de Acesso
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isSubmitting}
                {...register('password')}
                className="block w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verificando...
              </>
            ) : (
              'Entrar no Painel'
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-gray-400">
          SaaS Catálogo Multi-Tenant • Protegido por criptografia
        </div>
      </div>
    </div>
  );
}
