'use client';

import React from 'react';
import { Package, CheckCircle, AlertTriangle, ArrowUpRight, TrendingDown } from 'lucide-react';

const MOCK_INVENTORY = [
  { id: 'b901a1c9-7323-4c91-bf9b-3a52e72bc13d', nombre: 'Coca Cola 2L', precio: 'Bs. 12.50', stock: 50, estado: 'En Stock' },
  { id: 'a101a1c9-7323-4c91-bf9b-3a52e72bc13e', nombre: 'Leche Pil 1L', precio: 'Bs. 6.50', stock: 20, estado: 'En Stock' },
  { id: 'c201a1c9-7323-4c91-bf9b-3a52e72bc13f', nombre: 'Aceite Fino 1L', precio: 'Bs. 15.00', stock: 100, estado: 'En Stock' },
  { id: 'b901a1c9-7323-4c91-bf9b-3a52e72bc139', nombre: 'Detergente Omo', precio: 'Bs. 35.00', stock: 2, estado: 'Stock Mínimo' },
];

export default function InventarioPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Package className="h-8 w-8 text-indigo-500" />
            Balance de Inventario
          </h1>
          <p className="text-slate-400 mt-1">Monitorea y controla las existencias físicas en tiempo real de tus sucursales.</p>
        </div>
      </div>

      {/* Grid de estado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center space-x-4 shadow-xl">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Productos Óptimos</p>
            <p className="text-xl font-bold text-slate-100">3 Productos</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center space-x-4 shadow-xl">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Productos Bajo Stock</p>
            <p className="text-xl font-bold text-slate-100">1 Producto</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center space-x-4 shadow-xl">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <ArrowUpRight className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Total Físico Estimado</p>
            <p className="text-xl font-bold text-slate-100">172 Unidades</p>
          </div>
        </div>
      </div>

      {/* Tabla de Inventario */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <h2 className="font-semibold text-slate-100 text-lg">Catálogo Físico de Productos</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs font-semibold uppercase bg-slate-900/50">
                <th className="px-6 py-4">ID del Producto (UUID)</th>
                <th className="px-6 py-4">Nombre del Producto</th>
                <th className="px-6 py-4 text-right">Precio unitario</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-sm text-slate-300">
              {MOCK_INVENTORY.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/10 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-500 text-xs">{item.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-200">{item.nombre}</td>
                  <td className="px-6 py-4 text-right font-semibold">{item.precio}</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-100">{item.stock}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                        item.estado === 'En Stock'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {item.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
