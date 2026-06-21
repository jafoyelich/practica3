'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Store, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { session, login, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirigir si ya tiene sesión activa
  useEffect(() => {
    if (!authLoading && session.token) {
      router.push('/');
    }
  }, [session.token, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    // Validación básica de formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    setLoading(true);

    // Simular un pequeño retardo para mejorar la UX (micro-animación/feedback)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Si coincide con las credenciales QA oficiales o las credenciales por defecto:
    if (email.toLowerCase() === 'admin@supermarket.bo' && password === 'admin123') {
      login(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJub21icmUiOiJBZG1pbmlzdHJhZG9yIFFBIiwiZW1haWwiOiJhZG1pbkBzdXBlcm1hcmtldC5ibyIsInJvbGUiOiJhZG1pbmlzdHJhZG9yIiwiZXhwIjoxOTAwMDAwMDAwfQ.SaolpUp0lBkYXPSCsuB_WAKa53EBFoTnbz3uyA-0jJA',
        'Administrador QA',
        'administrador',
        'admin@supermarket.bo'
      );
      router.push('/');
    } else {
      setError('Credenciales incorrectas. Para QA, usa admin@supermarket.bo / admin123');
      setLoading(false);
    }
  };

  const handleQuickLogin = () => {
    setEmail('admin@supermarket.bo');
    setPassword('admin123');
    setError(null);
  };

  if (authLoading || (session.token && !authLoading)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-slate-400 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden px-4">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-slate-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-8 md:p-10 rounded-3xl shadow-2xl z-10 transition-all duration-300">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl text-white mb-4 shadow-lg shadow-blue-600/30">
            <Store className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Iniciar Sesión</h2>
          <p className="text-slate-400 text-sm mt-1">Plataforma ERP / POS - OXXO Bolivia</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-950/30 border border-red-800/50 text-red-200 px-4 py-3 rounded-xl flex items-start space-x-3 animate-shake text-sm">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 pointer-events-none">
                <Mail className="h-5 w-5" />
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@supermarket.bo"
                disabled={loading}
                className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 text-slate-100 rounded-xl placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 pointer-events-none">
                <Lock className="h-5 w-5" />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full pl-11 pr-12 py-3 bg-slate-950/50 border border-slate-800 text-slate-100 rounded-xl placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer disabled:opacity-50"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all duration-200 active:scale-98 shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800/80"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900/60 px-3 text-slate-500">O ingresa rápido</span>
          </div>
        </div>

        {/* QA Administrator Credentials Auto-Filler */}
        <button
          onClick={handleQuickLogin}
          disabled={loading}
          className="w-full bg-slate-800/60 hover:bg-slate-800 hover:border-slate-700/80 border border-slate-800 text-slate-300 text-sm font-medium py-2.5 rounded-xl transition-all duration-200 active:scale-98 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Autocompletar Administrador QA</span>
        </button>

        {/* Help Tip */}
        <p className="text-center text-xs text-slate-500 mt-6 leading-relaxed">
          Credenciales recomendadas de demostración:<br />
          <span className="font-mono text-slate-400">admin@supermarket.bo</span> / <span className="font-mono text-slate-400">admin123</span>
        </p>

      </div>
    </div>
  );
}
