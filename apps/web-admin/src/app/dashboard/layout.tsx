'use client';

import React, { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading, login } = useAuth();

  // Simulación de auto-login para desarrollo para facilitar la visualización del ERP
  useEffect(() => {
    if (!isLoading && !session.token) {
      login(
        'mock-jwt-token-erp-supermarket-bolivia-2026',
        'Lic. Carlos Mendoza',
        'Administrador',
        'carlos.mendoza@supermarket.com.bo',
      );
    }
  }, [isLoading, session.token, login]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-slate-400 text-sm">Cargando panel de control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
