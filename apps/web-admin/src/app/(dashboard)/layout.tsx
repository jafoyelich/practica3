'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { Menu, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();

  // Redirigir a login si no hay token de sesión
  useEffect(() => {
    if (!isLoading && !session.token) {
      router.push('/login');
    }
  }, [isLoading, session.token, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-slate-400 text-sm">Cargando panel de control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar - responsive state passed down */}
      <Sidebar 
        isOpenMobile={isMobileOpen} 
        onCloseMobile={() => setIsMobileOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Topbar for mobile screens */}
        <header className="md:hidden bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div
            onClick={() => {
              console.log('click');
              router.push('/');
            }}
            className="flex items-center space-x-3 cursor-pointer"
            style={{ cursor: 'pointer' }}
          >
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <Store className="h-5 w-5" />
            </div>
            <h1 className="font-bold text-base text-slate-200">
              ERP / POS
            </h1>
          </div>
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Dynamic page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
