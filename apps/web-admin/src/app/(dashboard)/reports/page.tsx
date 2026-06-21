'use client';

import React, { useState, useEffect } from 'react';
import { axiosInstance } from '@/lib/axios';
import {
  LayoutDashboard,
  Calendar,
  DollarSign,
  CreditCard,
  TrendingUp,
  FileText,
  AlertCircle,
  RefreshCw,
  Search,
  Store,
  User,
  Loader2,
  X
} from 'lucide-react';

interface PaymentGroup {
  tipo_pago: string;
  total: number;
}

interface DailyReportRes {
  fecha: string;
  total_consolidado: number;
  ingresos_por_metodo_pago: PaymentGroup[];
}

interface SaleTransaction {
  id_venta: string;
  id_sucursal: string;
  id_cliente: string;
  tipo_pago: string;
  total: number;
  fecha: string;
}

interface Branch {
  id_sucursal: string;
  nombre: string;
}

interface Customer {
  id_cliente: string;
  nombre: string;
}

export default function ReportsPage() {
  // Get today's date formatted as YYYY-MM-DD in local time
  const getTodayString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [report, setReport] = useState<DailyReportRes | null>(null);
  const [transactions, setTransactions] = useState<SaleTransaction[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load catalogs (branches, customers)
  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [branchRes, custRes] = await Promise.all([
          axiosInstance.get('/branches').catch(() => ({ data: [] })),
          axiosInstance.get('/customers').catch(() => ({ data: [] }))
        ]);
        setBranches(branchRes.data);
        setCustomers(custRes.data);
      } catch (err) {
        console.error('Error loading report catalogs:', err);
      }
    }
    loadCatalogs();
  }, []);

  // Fetch report and all sales filtered by date
  const fetchReportData = async (dateStr: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [reportRes, salesRes] = await Promise.all([
        axiosInstance.get(`/sales/reports/daily?date=${dateStr}`),
        axiosInstance.get('/sales').catch(() => ({ data: [] }))
      ]);

      setReport(reportRes.data);

      // Filter sales belonging to the selected date (YYYY-MM-DD)
      const allSales: SaleTransaction[] = salesRes.data || [];
      const filteredSales = allSales.filter(sale => {
        if (!sale.fecha) return false;
        return sale.fecha.startsWith(dateStr);
      });
      setTransactions(filteredSales);

    } catch (err: any) {
      console.error('Error fetching daily sales report:', err);
      const msg = err.response?.data?.message || err.message || 'Error del servidor';
      setErrorMsg(`No se pudo obtener el reporte diario: ${msg}`);
      
      // Fallback mocks
      setReport({
        fecha: dateStr,
        total_consolidado: 1250.00,
        ingresos_por_metodo_pago: [
          { tipo_pago: 'EFECTIVO', total: 800.00 },
          { tipo_pago: 'TARJETA', total: 450.00 }
        ]
      });
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger load on date change
  useEffect(() => {
    if (selectedDate) {
      fetchReportData(selectedDate);
    }
  }, [selectedDate]);

  // Extract payment type values safely
  const getPaymentTotal = (type: string) => {
    if (!report) return 0;
    const group = report.ingresos_por_metodo_pago.find(
      g => g.tipo_pago.toUpperCase() === type.toUpperCase()
    );
    return group ? group.total : 0;
  };

  const totalEfectivo = getPaymentTotal('EFECTIVO');
  const totalTarjeta = getPaymentTotal('TARJETA');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <div className="bg-indigo-600/10 p-2.5 rounded-xl border border-indigo-500/20">
              <LayoutDashboard className="h-8 w-8 text-indigo-400" />
            </div>
            Reportes de Ventas
          </h1>
          <p className="text-slate-400 mt-1">Visualiza los ingresos consolidados agrupados por método de pago y audita el desglose de transacciones.</p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 w-full sm:w-auto">
          <Calendar className="h-4 w-4 text-indigo-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Error notification */}
      {errorMsg && (
        <div className="flex items-center gap-3 bg-red-950/20 border border-red-500/30 text-red-400 p-4 rounded-xl">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
          <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-400/80 hover:text-red-200">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Summary cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Total Consolidated */}
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 relative overflow-hidden shadow-xl flex items-center gap-4">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.03]">
            <TrendingUp className="h-32 w-32 text-indigo-400" />
          </div>
          <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ingresos Totales (Día)</p>
            {isLoading ? (
              <div className="h-8 bg-slate-800 rounded w-24 mt-2 animate-pulse"></div>
            ) : (
              <p className="text-2xl font-black text-slate-100 mt-1">
                Bs. {report?.total_consolidado.toFixed(2) || '0.00'}
              </p>
            )}
          </div>
        </div>

        {/* Card 2: Cash Total */}
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 relative overflow-hidden shadow-xl flex items-center gap-4">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.03]">
            <DollarSign className="h-32 w-32 text-emerald-400" />
          </div>
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ventas en Efectivo</p>
            {isLoading ? (
              <div className="h-8 bg-slate-800 rounded w-24 mt-2 animate-pulse"></div>
            ) : (
              <p className="text-2xl font-black text-slate-100 mt-1">
                Bs. {totalEfectivo.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Card 3: Card Total */}
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 relative overflow-hidden shadow-xl flex items-center gap-4">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.03]">
            <CreditCard className="h-32 w-32 text-sky-400" />
          </div>
          <div className="p-3.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ventas por Tarjeta</p>
            {isLoading ? (
              <div className="h-8 bg-slate-800 rounded w-24 mt-2 animate-pulse"></div>
            ) : (
              <p className="text-2xl font-black text-slate-100 mt-1">
                Bs. {totalTarjeta.toFixed(2)}
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Daily Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-indigo-400" />
              Auditoría de Ventas del Día
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Lista de todas las ventas emitidas y registradas localmente en este día.</p>
          </div>
          <button
            onClick={() => fetchReportData(selectedDate)}
            className="text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-[10px] font-bold uppercase bg-slate-950/20">
                <th className="px-6 py-4">ID Venta (UUID)</th>
                <th className="px-6 py-4">Hora</th>
                <th className="px-6 py-4">Sucursal</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4 text-center">Método</th>
                <th className="px-6 py-4 text-right">Total Venta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
              {isLoading ? (
                [1, 2].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-3 bg-slate-800 rounded w-44"></div></td>
                    <td className="px-6 py-4"><div className="h-3 bg-slate-800 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-3 bg-slate-800 rounded w-36"></div></td>
                    <td className="px-6 py-4"><div className="h-3 bg-slate-800 rounded w-24"></div></td>
                    <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-800 rounded-full w-16 mx-auto"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-3 bg-slate-800 rounded w-12 ml-auto"></div></td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <FileText className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-xs">No se encontraron transacciones individuales registradas en esta fecha.</p>
                  </td>
                </tr>
              ) : (
                transactions.map(tx => {
                  const sucursalName = branches.find(b => b.id_sucursal === tx.id_sucursal)?.nombre || 'Sucursal';
                  const clienteName = customers.find(c => c.id_cliente === tx.id_cliente)?.nombre || 'Cliente General';
                  
                  return (
                    <tr key={tx.id_venta} className="hover:bg-slate-800/10 transition-colors">
                      <td className="px-6 py-4 font-mono text-[10px] text-slate-500 break-all select-all">{tx.id_venta}</td>
                      <td className="px-6 py-4 text-slate-400">
                        {tx.fecha ? new Date(tx.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-300 flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5 text-slate-500" />
                        {sucursalName}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-500" />
                          {clienteName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-md border text-[9px] font-bold ${
                          tx.tipo_pago === 'EFECTIVO'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        }`}>
                          {tx.tipo_pago}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-100">
                        Bs. {Number(tx.total).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
