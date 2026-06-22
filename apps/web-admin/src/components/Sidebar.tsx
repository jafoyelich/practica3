'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, ShoppingCart, Package, LogOut, Store, User, X, ShieldAlert } from 'lucide-react';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile = false, onCloseMobile }) => {
  const pathname = usePathname();
  const { session, logout } = useAuth();

  const menuItems = [
    { name: 'Punto de Venta (POS)', path: '/sales', icon: ShoppingCart },
    { name: 'Inventario y Kardex', path: '/inventory', icon: Package },
    { name: 'Administración', path: '/admin', icon: ShieldAlert },
    { name: 'Reportes Diarios', path: '/reports', icon: LayoutDashboard },
  ];

  const handleLogoutClick = () => {
    localStorage.clear();
    sessionStorage.clear();
    logout();
    window.location.reload();
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside 
        className={`fixed md:sticky top-0 left-0 z-40 w-64 h-screen bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800 transition-transform duration-300 md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Logotipo */}
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
  <Link
    href="/"
    className="flex items-center space-x-3 cursor-pointer hover:opacity-90 transition-opacity"
  >
    <div className="bg-blue-600 p-2 rounded-lg text-white">
      <Store className="h-6 w-6" />
    </div>
    <div>
      <h1 className="font-bold text-lg leading-none">ERP / POS</h1>
      <span className="text-[10px] text-slate-400">Panel Corporativo</span>
    </div>
  </Link>
            {/* Close button for mobile */}
            {onCloseMobile && (
              <button 
                onClick={onCloseMobile} 
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white md:hidden cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Listado de Rutas */}
          <nav className="p-4 space-y-1 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || pathname.startsWith(item.path);
              
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={onCloseMobile}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-600/10'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Perfil del Usuario y Cierre de Sesión */}
        <div className="p-4 border-t border-slate-800 space-y-4">
          {session.token ? (
            <div className="flex items-center space-x-3 px-2">
              <div className="h-10 w-10 rounded-full bg-slate-850 flex items-center justify-center text-blue-400 border border-slate-800">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{session.nombre}</p>
                <p className="text-xs text-slate-500 truncate uppercase">{session.rol}</p>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 px-2">Sin sesión activa</div>
          )}

          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-950/20 hover:text-red-400 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};
