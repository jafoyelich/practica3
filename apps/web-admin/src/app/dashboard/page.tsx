'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ShoppingBag, TrendingUp, Package, Users, PlusCircle, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { session } = useAuth();

  const stats = [
    { name: 'Ventas de Hoy', value: 'Bs. 4,850.00', change: '+12.5%', icon: TrendingUp, color: 'text-emerald-400 bg-emerald-500/10' },
    { name: 'Productos Registrados', value: '1,248', change: 'En stock', icon: Package, color: 'text-indigo-400 bg-indigo-500/10' },
    { name: 'Clientes Registrados', value: '382', change: '+4 esta semana', icon: Users, color: 'text-amber-400 bg-amber-500/10' },
    { name: 'Transacciones de Ventas', value: '184', change: '+8%', icon: ShoppingBag, color: 'text-sky-400 bg-sky-500/10' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard General</h1>
        <p className="text-slate-400 mt-2">
          Bienvenido de vuelta, <span className="text-indigo-400 font-semibold">{session.nombre || 'Administrador'}</span>. Aquí está el resumen del ERP de hoy.
        </p>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-400">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
                <span className="inline-block text-xs font-semibold text-slate-500">{stat.change}</span>
              </div>
              <div className={`p-4 rounded-xl ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Accesos y Acciones Rápidas</h2>
          <p className="text-sm text-slate-400 mt-1">Realiza las operaciones comunes en el sistema ERP con un solo click.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/dashboard/pos"
            className="flex items-center justify-between p-6 bg-slate-850 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/30 rounded-2xl group transition-all duration-300 shadow-lg"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-105 transition-transform duration-200">
                <PlusCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">Nueva Venta (POS)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Registrar venta en ms-sales</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-600 group-hover:text-indigo-400 transition-colors duration-200" />
          </Link>

          <Link
            href="/dashboard/inventario"
            className="flex items-center justify-between p-6 bg-slate-850 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/30 rounded-2xl group transition-all duration-300 shadow-lg"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-105 transition-transform duration-200">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">Gestionar Inventario</h3>
                <p className="text-xs text-slate-500 mt-0.5">Ver stock e importaciones</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-600 group-hover:text-indigo-400 transition-colors duration-200" />
          </Link>

          <div
            className="flex items-center justify-between p-6 bg-slate-850 border border-slate-800 rounded-2xl shadow-lg opacity-60 cursor-not-allowed"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-slate-800 rounded-xl text-slate-500">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-400">Clientes ERP</h3>
                <p className="text-xs text-slate-500 mt-0.5">Módulo de CRM (Próximamente)</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
