'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'catalogo_admin_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Carrega o token da sessão
    try {
      const storedToken = sessionStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        setToken(storedToken);
      }
    } catch {
      // Falha ao acessar sessionStorage
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await api.login(password);
      if (result.authenticated && result.token) {
        setToken(result.token);
        sessionStorage.setItem(TOKEN_KEY, result.token);
        router.push('/admin');
      } else {
        throw new Error('Credenciais inválidas.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
    router.push('/admin/login');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: Boolean(token),
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}

/**
 * Componente que envolve páginas administrativas para proteger acesso não autorizado.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/admin/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-gray-600">Verificando autorização...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
