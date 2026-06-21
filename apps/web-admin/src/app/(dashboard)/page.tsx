'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { axiosInstance } from '@/lib/axios';
import Link from 'next/link';
import { 
  TrendingUp, 
  Package, 
  Store, 
  Users, 
  ArrowRight, 
  ShoppingCart, 
  ShieldAlert, 
  LayoutDashboard, 
  Activity, 
  Database, 
  MessageSquare, 
  Zap,
  Clock
} from 'lucide-react';

interface MetricState {
  salesCount: number;
  salesTotal: number;
  productsCount: number;
  branchesCount: number;
  customersCount: number;
}

interface RecentSale {
  id: string;
  id_cliente: string;
  id_sucursal: string;
  total: number;
  fecha: string;
  clienteNombre?: string;
  sucursalNombre?: string;
}

export default function HomePage() {
  const { session } = useAuth();
  const [metrics, setMetrics] = useState<MetricState>({
    salesCount: 0,
    salesTotal: 0,
    productsCount: 0,
    branchesCount: 0,
    customersCount: 0,
  });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState('');
  
  const [statusMap, setStatusMap] = useState({
    gateway: 'loading',
    database: 'loading',
    rabbitmq: 'loading',
    redis: 'loading',
    notifications: 'loading',
  });

  const renderStatusBadge = (status: string) => {
    if (status === 'loading') {
      return (
        <span className="text-[10px] font-bold px-2 py-1 bg-slate-800/60 text-slate-400 rounded-lg border border-slate-700/60 uppercase tracking-wider animate-pulse">
          Consultando...
        </span>
      );
    }
    if (status === 'online') {
      return (
        <span className="text-[10px] font-bold px-2 py-1 bg-emerald-950/30 text-emerald-400 rounded-lg border border-emerald-900/30 uppercase tracking-wider">
          En Línea
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-1 bg-red-950/30 text-red-400 rounded-lg border border-red-900/30 uppercase tracking-wider">
        Desconectado
      </span>
    );
  };

  // Actualizar hora local en tiempo real
  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      };
      setCurrentDateTime(new Date().toLocaleDateString('es-BO', options));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        setLoading(true);

        let isGatewayOnline = false;
        let isDatabaseOnline = true;
        let isProductsOnline = false;
        let isSalesOnline = false;
        let isCompanyOnline = false;
        let isCustomerOnline = false;
        let isNotificationsOnline = false;
        let isInventoryOnline = false;

        // 1. Probar conexión general al Gateway
        try {
          const testRes = await axiosInstance.get('/');
          if (testRes.status === 200 || testRes.status === 404) {
            isGatewayOnline = true;
          }
        } catch (err: any) {
          if (err.response) {
            isGatewayOnline = true;
          } else {
            isGatewayOnline = false;
          }
        }

        if (!isGatewayOnline) {
          setStatusMap({
            gateway: 'offline',
            database: 'offline',
            rabbitmq: 'offline',
            redis: 'offline',
            notifications: 'offline',
          });
          setLoading(false);
          return;
        }

        // Helper para diagnosticar la salud de servicios individuales
        const checkService = async (endpoint: string) => {
          try {
            const res = await axiosInstance.get(endpoint);
            return { success: true, dbError: false, serviceOffline: false, data: res.data };
          } catch (err: any) {
            if (err.response) {
              const status = err.response.status;
              const data = err.response.data || {};
              
              // 502 de Gateway proxy (NestJS proxy) cuando el microservicio está caído
              if (status === 502 && (data.message?.includes('no responde') || data.message?.includes('Bad Gateway'))) {
                return { success: false, dbError: false, serviceOffline: true, data: [] };
              }
              
              // 500 o error de conexión a Base de Datos
              const errStr = (JSON.stringify(data) + (err.message || '')).toLowerCase();
              if (status === 500 || errStr.includes('database') || errStr.includes('connection') || errStr.includes('supabase') || errStr.includes('relation') || errStr.includes('db_') || errStr.includes('pool')) {
                return { success: false, dbError: true, serviceOffline: false, data: [] };
              }
              
              // Si devolvió otro error HTTP pero el servicio contestó
              return { success: true, dbError: false, serviceOffline: false, data: [] };
            }
            return { success: false, dbError: false, serviceOffline: true, data: [] };
          }
        };

        const [salesCheck, productsCheck, branchesCheck, customersCheck] = await Promise.all([
          checkService('/sales'),
          checkService('/products'),
          checkService('/branches'),
          checkService('/customers'),
        ]);

        // Si cualquiera da error de BD, el estado general de Supabase se marca offline
        if (salesCheck.dbError || productsCheck.dbError || branchesCheck.dbError || customersCheck.dbError) {
          isDatabaseOnline = false;
        }

        isProductsOnline = productsCheck.success && !productsCheck.serviceOffline;
        isSalesOnline = salesCheck.success && !salesCheck.serviceOffline;
        isCompanyOnline = branchesCheck.success && !branchesCheck.serviceOffline;
        isCustomerOnline = customersCheck.success && !customersCheck.serviceOffline;

        // Probar ms-notification con uuid inexistente
        const notificationsCheck = await checkService('/notifications/history/00000000-0000-0000-0000-000000000000');
        isNotificationsOnline = notificationsCheck.success && !notificationsCheck.serviceOffline;
        if (notificationsCheck.dbError) {
          isDatabaseOnline = false;
        }

        // Probar ms-inventory
        const inventoryCheck = await checkService('/inventory/balance');
        isInventoryOnline = inventoryCheck.success && !inventoryCheck.serviceOffline;
        if (inventoryCheck.dbError) {
          isDatabaseOnline = false;
        }

        // Redis cache: requiere que ms-inventory funcione y no dé error de base de datos (se asume activo si cacheo responde)
        const isRedisOnline = isInventoryOnline && !inventoryCheck.dbError;

        // RabbitMQ: si ms-sales e ms-inventory están activos, RabbitMQ está corriendo (de lo contrario el backend no iniciaría)
        const isRabbitmqOnline = isSalesOnline && isInventoryOnline;

        setStatusMap({
          gateway: 'online',
          database: isDatabaseOnline ? 'online' : 'offline',
          rabbitmq: isRabbitmqOnline ? 'online' : 'offline',
          redis: isRedisOnline ? 'online' : 'offline',
          notifications: isNotificationsOnline ? 'online' : 'offline',
        });

        // Set metrics if database is online
        const salesData = Array.isArray(salesCheck.data) ? salesCheck.data : [];
        const productsData = Array.isArray(productsCheck.data) ? productsCheck.data : [];
        const branchesData = Array.isArray(branchesCheck.data) ? branchesCheck.data : [];
        const customersData = Array.isArray(customersCheck.data) ? customersCheck.data : [];

        const totalAmount = salesData.reduce((sum: number, sale: any) => sum + (parseFloat(sale.total) || 0), 0);

        setMetrics({
          salesCount: salesData.length,
          salesTotal: totalAmount,
          productsCount: productsData.length,
          branchesCount: branchesData.length,
          customersCount: customersData.length,
        });

        // Mapear nombres a las últimas 5 ventas para el feed de actividad reciente
        const slicedSales = salesData.slice(0, 5);
        const mappedSales = slicedSales.map((sale: any) => {
          const client = customersData.find((c: any) => c.id === sale.id_cliente || c.id_cliente === sale.id_cliente);
          const branch = branchesData.find((b: any) => b.id_sucursal === sale.id_sucursal);
          return {
            id: sale.id || sale.id_venta,
            id_cliente: sale.id_cliente,
            id_sucursal: sale.id_sucursal,
            total: parseFloat(sale.total) || 0,
            fecha: sale.fecha || sale.created_at || new Date().toISOString(),
            clienteNombre: client?.nombre || 'Cliente Genérico',
            sucursalNombre: branch?.nombre || 'Sucursal Externa',
          };
        });

        setRecentSales(mappedSales);
      } catch (err) {
        console.error('Error cargando métricas de dashboard', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardMetrics();
  }, []);

  // Formateador de moneda boliviana (Bs)
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(val);
  };

  return (
    <div className="space-y-8">
      {/* Header section with Welcome text */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xs">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Bienvenido, {session.nombre || 'Administrador'}
          </h1>
          <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>{currentDateTime}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60">
            Rol: {session.rol || 'administrador'}
          </span>
        </div>
      </div>

      {/* Grid de Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Metric Ventas */}
        <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-sm hover:border-slate-700/80 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ingresos Totales</span>
            <div className="bg-emerald-950/40 text-emerald-400 p-2.5 rounded-xl border border-emerald-900/30">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {loading ? (
                <div className="h-8 w-28 bg-slate-800 animate-pulse rounded-lg" />
              ) : (
                formatCurrency(metrics.salesTotal)
              )}
            </h3>
            <p className="text-slate-500 text-xs mt-1.5">
              Acumulado de {metrics.salesCount} ventas registradas
            </p>
          </div>
        </div>

        {/* Metric Productos */}
        <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-sm hover:border-slate-700/80 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Catálogo Productos</span>
            <div className="bg-blue-950/40 text-blue-400 p-2.5 rounded-xl border border-blue-900/30">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {loading ? (
                <div className="h-8 w-20 bg-slate-800 animate-pulse rounded-lg" />
              ) : (
                metrics.productsCount
              )}
            </h3>
            <p className="text-slate-500 text-xs mt-1.5">
              Productos registrados a nivel nacional
            </p>
          </div>
        </div>

        {/* Metric Sucursales */}
        <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-sm hover:border-slate-700/80 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sucursales</span>
            <div className="bg-amber-950/40 text-amber-400 p-2.5 rounded-xl border border-amber-900/30">
              <Store className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {loading ? (
                <div className="h-8 w-16 bg-slate-800 animate-pulse rounded-lg" />
              ) : (
                metrics.branchesCount
              )}
            </h3>
            <p className="text-slate-500 text-xs mt-1.5">
              Puntos de venta distribuidos activos
            </p>
          </div>
        </div>

        {/* Metric Clientes */}
        <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-sm hover:border-slate-700/80 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clientes Activos</span>
            <div className="bg-indigo-950/40 text-indigo-400 p-2.5 rounded-xl border border-indigo-900/30">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {loading ? (
                <div className="h-8 w-16 bg-slate-800 animate-pulse rounded-lg" />
              ) : (
                metrics.customersCount
              )}
            </h3>
            <p className="text-slate-500 text-xs mt-1.5">
              Clientes en programa de fidelización
            </p>
          </div>
        </div>
      </div>

      {/* Sección Acciones Rápidas */}
      <div>
        <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" /> Acciones Rápidas de Operación
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* POS Link */}
          <Link href="/sales" className="group bg-slate-900 hover:bg-slate-850 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between h-40 transition-all duration-200 cursor-pointer hover:border-blue-600/30 shadow-md">
            <div className="bg-blue-950/30 text-blue-400 p-3 rounded-xl border border-blue-900/20 w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-200 group-hover:text-white transition-colors text-sm">Punto de Venta (POS)</h3>
              <p className="text-xs text-slate-500 mt-1">Registrar ventas, facturar y asignar puntos de cliente</p>
            </div>
            <div className="flex items-center text-xs text-blue-400 font-medium group-hover:text-blue-300 gap-1.5 self-end mt-2">
              <span>Ingresar</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Inventory Link */}
          <Link href="/inventory" className="group bg-slate-900 hover:bg-slate-850 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between h-40 transition-all duration-200 cursor-pointer hover:border-blue-600/30 shadow-md">
            <div className="bg-blue-950/30 text-blue-400 p-3 rounded-xl border border-blue-900/20 w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-200 group-hover:text-white transition-colors text-sm">Inventario y Kardex</h3>
              <p className="text-xs text-slate-500 mt-1">Auditar existencias consolidado, transferencias y lotes</p>
            </div>
            <div className="flex items-center text-xs text-blue-400 font-medium group-hover:text-blue-300 gap-1.5 self-end mt-2">
              <span>Ingresar</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Admin Link */}
          <Link href="/admin" className="group bg-slate-900 hover:bg-slate-850 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between h-40 transition-all duration-200 cursor-pointer hover:border-blue-600/30 shadow-md">
            <div className="bg-blue-950/30 text-blue-400 p-3 rounded-xl border border-blue-900/20 w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-200 group-hover:text-white transition-colors text-sm">Administración</h3>
              <p className="text-xs text-slate-500 mt-1">Crear sucursales, compañías, registrar bajas y clientes</p>
            </div>
            <div className="flex items-center text-xs text-blue-400 font-medium group-hover:text-blue-300 gap-1.5 self-end mt-2">
              <span>Ingresar</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Reports Link */}
          <Link href="/reports" className="group bg-slate-900 hover:bg-slate-850 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between h-40 transition-all duration-200 cursor-pointer hover:border-blue-600/30 shadow-md">
            <div className="bg-blue-950/30 text-blue-400 p-3 rounded-xl border border-blue-900/20 w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-200 group-hover:text-white transition-colors text-sm">Reportes Diarios</h3>
              <p className="text-xs text-slate-500 mt-1">Reportes contables, ingresos en efectivo y transacciones tarjeta</p>
            </div>
            <div className="flex items-center text-xs text-blue-400 font-medium group-hover:text-blue-300 gap-1.5 self-end mt-2">
              <span>Ingresar</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Panel Inferior: Actividad Reciente & Monitoreo de Infraestructura */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Feed de Actividad Reciente */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800/85 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" /> Últimas Ventas Registradas
            </h2>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-14 bg-slate-850 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : recentSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 bg-slate-950/40 rounded-xl border border-slate-800/60 border-dashed">
                <p className="text-slate-500 text-sm">No se han registrado ventas en el sistema aún.</p>
                <Link href="/sales" className="mt-3 text-xs text-blue-400 hover:underline">Ir a realizar una venta →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div 
                    key={sale.id}
                    className="flex items-center justify-between p-3.5 bg-slate-950/40 rounded-xl border border-slate-850 hover:border-slate-800 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700/50 text-xs font-bold">
                        V
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{sale.clienteNombre}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {sale.sucursalNombre} • {new Date(sale.fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-emerald-400">{formatCurrency(sale.total)}</p>
                      <span className="inline-flex items-center text-[10px] font-semibold text-emerald-500 bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-900/40 mt-1">
                        Emitida
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-end">
            <Link href="/reports" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
              Ver reporte financiero completo <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Monitoreo de Microservicios */}
        <div className="bg-slate-900 border border-slate-800/85 p-6 rounded-2xl">
          <h2 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-400" /> Estado de la Arquitectura
          </h2>
          <p className="text-slate-500 text-xs mb-6">
            Monitoreo en tiempo real de los servicios y dependencias conectados al API Gateway.
          </p>

          <div className="space-y-4">
            {/* API Gateway */}
            <div className="flex items-center justify-between p-3 bg-slate-950/30 rounded-xl border border-slate-850">
              <div className="flex items-center gap-2.5">
                <Zap className={`h-4 w-4 ${statusMap.gateway === 'online' ? 'text-emerald-400' : 'text-red-400'}`} />
                <div className="text-xs font-semibold text-slate-300">API Gateway</div>
              </div>
              {renderStatusBadge(statusMap.gateway)}
            </div>

            {/* PostgreSQL Supabase */}
            <div className="flex items-center justify-between p-3 bg-slate-950/30 rounded-xl border border-slate-850">
              <div className="flex items-center gap-2.5">
                <Database className={`h-4 w-4 ${statusMap.database === 'online' ? 'text-emerald-400' : 'text-red-400'}`} />
                <div className="text-xs font-semibold text-slate-300">Base de Datos Supabase</div>
              </div>
              {renderStatusBadge(statusMap.database)}
            </div>

            {/* RabbitMQ */}
            <div className="flex items-center justify-between p-3 bg-slate-950/30 rounded-xl border border-slate-850">
              <div className="flex items-center gap-2.5">
                <MessageSquare className={`h-4 w-4 ${statusMap.rabbitmq === 'online' ? 'text-emerald-400' : 'text-red-400'}`} />
                <div className="text-xs font-semibold text-slate-300">RabbitMQ Broker</div>
              </div>
              {renderStatusBadge(statusMap.rabbitmq)}
            </div>

            {/* Redis Cache */}
            <div className="flex items-center justify-between p-3 bg-slate-950/30 rounded-xl border border-slate-850">
              <div className="flex items-center gap-2.5">
                <Zap className={`h-4 w-4 ${statusMap.redis === 'online' ? 'text-emerald-400' : 'text-red-400'}`} />
                <div className="text-xs font-semibold text-slate-300">Redis Cache</div>
              </div>
              {renderStatusBadge(statusMap.redis)}
            </div>

            {/* Notification Service */}
            <div className="flex items-center justify-between p-3 bg-slate-950/30 rounded-xl border border-slate-850">
              <div className="flex items-center gap-2.5">
                <Users className={`h-4 w-4 ${statusMap.notifications === 'online' ? 'text-emerald-400' : 'text-red-400'}`} />
                <div className="text-xs font-semibold text-slate-300">Servicio Notificaciones</div>
              </div>
              {renderStatusBadge(statusMap.notifications)}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
