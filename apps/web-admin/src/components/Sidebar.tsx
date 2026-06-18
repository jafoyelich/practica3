'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, ShoppingCart, Package, LogOut, Store, User } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { session, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Nueva Venta (POS)', path: '/dashboard/pos', icon: ShoppingCart },
    { name: 'Inventario', path: '/dashboard/inventario', icon: Package },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800 h-screen sticky top-0">
      {/* Header Logotipo */}
      <div>
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">SuperMarket</h1>
            <span className="text-xs text-slate-400">Bolivia S.A.</span>
          </div>
        </div>

        {/* Listado de Rutas */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Se calcula si el ítem de menú está activo
            const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/10'
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
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{session.nombre}</p>
              <p className="text-xs text-slate-500 truncate">{session.rol}</p>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 px-2">Sin sesión activa</div>
        )}

        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-950/20 hover:text-red-400 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
