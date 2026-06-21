'use client';

import React, { useState, useEffect } from 'react';
import { axiosInstance } from '@/lib/axios';
import {
  ShieldAlert,
  Store,
  UserPlus,
  PlusCircle,
  Building,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Loader2,
  X,
  Plus,
  MinusCircle
} from 'lucide-react';

interface Company {
  id_compania: string;
  nombre: string;
}

interface City {
  id_ciudad: string;
  nombre: string;
}

interface Product {
  id_producto: string;
  nombre: string;
}

interface Branch {
  id_sucursal: string;
  nombre: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'company' | 'branch' | 'customer' | 'input' | 'loss'>('company');

  // Common metadata lists
  const [companies, setCompanies] = useState<Company[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Loading and Notification States
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // --- Form 1: Crear Compañía ---
  const [companyName, setCompanyName] = useState('');

  // --- Form 2: Crear Sucursal ---
  const [branchCompany, setBranchCompany] = useState('');
  const [branchCity, setBranchCity] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');

  // --- Form 3: Crear Cliente ---
  const [customerName, setCustomerName] = useState('');
  const [customerCI, setCustomerCI] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerStatus, setCustomerStatus] = useState('ACTIVO');
  const [customerPoints, setCustomerPoints] = useState(0);

  // --- Form 4: Ingreso Manual ---
  const [inputBranch, setInputBranch] = useState('');
  const [inputProduct, setInputProduct] = useState('');
  const [inputQuantity, setInputQuantity] = useState(1);
  const [inputReason, setInputReason] = useState('Carga inicial manual');

  // --- Form 5: Registrar Merma/Baja ---
  const [lossBranch, setLossBranch] = useState('');
  const [lossProduct, setLossProduct] = useState('');
  const [lossQuantity, setLossQuantity] = useState(1);
  const [lossReason, setLossReason] = useState('');

  // Load catalogs on mount
  const fetchCatalogs = async () => {
    setIsLoadingCatalogs(true);
    try {
      const [compRes, cityRes, prodRes, branchRes] = await Promise.all([
        axiosInstance.get('/companies').catch(() => ({ data: [] })),
        axiosInstance.get('/cities').catch(() => ({ data: [] })),
        axiosInstance.get('/products').catch(() => ({ data: [] })),
        axiosInstance.get('/branches').catch(() => ({ data: [] }))
      ]);

      setCompanies(compRes.data);
      setCities(cityRes.data);
      
      const mappedProducts = (prodRes.data || []).map((p: any) => ({
        id_producto: p.id || p.id_producto,
        nombre: p.nombre
      }));
      setProducts(mappedProducts);
      setBranches(branchRes.data);

      // Pre-select first options if available
      if (compRes.data.length > 0) setBranchCompany(compRes.data[0].id_compania);
      if (cityRes.data.length > 0) setBranchCity(cityRes.data[0].id_ciudad);
      
      if (mappedProducts.length > 0) {
        setInputProduct(mappedProducts[0].id_producto);
        setLossProduct(mappedProducts[0].id_producto);
      }
      if (branchRes.data.length > 0) {
        setInputBranch(branchRes.data[0].id_sucursal);
        setLossBranch(branchRes.data[0].id_sucursal);
      }
    } catch (err) {
      console.error('Error fetching admin page metadata catalogs:', err);
    } finally {
      setIsLoadingCatalogs(false);
    }
  };

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: null, message: '' });
    }, 5000);
  };

  // Submit Form 1: Crear Compañía
  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      showNotification('error', 'El nombre del supermercado es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post('/companies', {
        nombre: companyName
      });

      showNotification('success', `Supermercado/Compañía "${companyName}" creado con éxito.`);
      setCompanyName('');
      // Reload catalogs to show in branch selector
      const compRes = await axiosInstance.get('/companies');
      setCompanies(compRes.data);
      if (compRes.data.length > 0) setBranchCompany(compRes.data[0].id_compania);
    } catch (err: any) {
      console.error('Error creating company:', err);
      const msg = err.response?.data?.message || err.message || 'Error desconocido';
      showNotification('error', `Error al crear compañía: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Form 2: Crear Sucursal
  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchCompany || !branchCity || !branchName.trim() || !branchAddress.trim()) {
      showNotification('error', 'Por favor, completa todos los campos de la sucursal.');
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post('/branches', {
        id_compania: branchCompany,
        id_ciudad: branchCity,
        nombre: branchName,
        direccion: branchAddress
      });

      showNotification('success', `Sucursal "${branchName}" creada con éxito.`);
      setBranchName('');
      setBranchAddress('');
      
      // Reload branches list
      const branchRes = await axiosInstance.get('/branches');
      setBranches(branchRes.data);
      if (branchRes.data.length > 0) {
        setInputBranch(branchRes.data[0].id_sucursal);
        setLossBranch(branchRes.data[0].id_sucursal);
      }
    } catch (err: any) {
      console.error('Error creating branch:', err);
      const msg = err.response?.data?.message || err.message || 'Error desconocido';
      showNotification('error', `Error al crear sucursal: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Form 3: Crear Cliente
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerCI.trim()) {
      showNotification('error', 'Nombre y Carnet/NIT son campos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post('/customers', {
        nombre: customerName,
        ci: customerCI,
        email: customerEmail.trim() || undefined,
        telefono: customerPhone.trim() || undefined,
        estado: customerStatus,
        puntos: Number(customerPoints)
      });

      showNotification('success', `Cliente "${customerName}" registrado con éxito.`);
      setCustomerName('');
      setCustomerCI('');
      setCustomerEmail('');
      setCustomerPhone('');
      setCustomerPoints(0);
    } catch (err: any) {
      console.error('Error creating customer:', err);
      const msg = err.response?.data?.message || err.message || 'Error desconocido';
      showNotification('error', `Error al registrar cliente: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Form 4: Ingreso Manual
  const handleManualInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputBranch || !inputProduct || inputQuantity <= 0) {
      showNotification('error', 'Por favor completa todos los campos del ingreso de inventario.');
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post('/inventory/input', {
        id_sucursal: inputBranch,
        id_producto: inputProduct,
        cantidad: Number(inputQuantity),
        motivo: inputReason
      });

      showNotification('success', 'Ingreso de inventario registrado correctamente.');
      setInputQuantity(1);
      setInputReason('Carga inicial manual');
    } catch (err: any) {
      console.error('Error in manual stock input:', err);
      const msg = err.response?.data?.message || err.message || 'Error en el backend';
      showNotification('error', `Error al registrar inventario: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Form 5: Registrar Merma/Baja
  const handleLossSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lossBranch || !lossProduct || lossQuantity <= 0 || !lossReason.trim()) {
      showNotification('error', 'Por favor completa todos los campos de la merma.');
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post('/inventory/loss', {
        id_sucursal: lossBranch,
        id_producto: lossProduct,
        cantidad: Number(lossQuantity),
        motivo: lossReason
      });

      showNotification('success', 'Baja por merma/pérdida registrada con éxito y Kardex descontado.');
      setLossQuantity(1);
      setLossReason('');
    } catch (err: any) {
      console.error('Error registering inventory loss:', err);
      const msg = err.response?.data?.message || err.message || 'Error en el backend';
      showNotification('error', `Error al registrar merma: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <div className="bg-blue-600/10 p-2.5 rounded-xl border border-blue-500/20">
              <ShieldAlert className="h-8 w-8 text-blue-400" />
            </div>
            Panel de Administración
          </h1>
          <p className="text-slate-400 mt-1">Crea supermercados, configura nuevas sucursales, registra clientes e ingresa o da de baja inventarios.</p>
        </div>
      </div>

      {/* Notification Toast */}
      {notification.type && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border max-w-2xl animate-slideDown ${
            notification.type === 'success'
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
              : 'bg-red-950/20 border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center space-x-3">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification({ type: null, message: '' })}
            className="text-slate-400 hover:text-slate-100 transition-colors ml-4"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-800 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveTab('company')}
          className={`px-6 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'company'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Building className="h-4 w-4" />
          Crear Compañía (POST)
        </button>
        <button
          onClick={() => setActiveTab('branch')}
          className={`px-6 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'branch'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Store className="h-4 w-4" />
          Crear Sucursal (POST)
        </button>
        <button
          onClick={() => setActiveTab('customer')}
          className={`px-6 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'customer'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Crear Cliente (POST)
        </button>
        <button
          onClick={() => setActiveTab('input')}
          className={`px-6 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'input'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <PlusCircle className="h-4 w-4" />
          Ingreso Manual (POST)
        </button>
        <button
          onClick={() => setActiveTab('loss')}
          className={`px-6 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'loss'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <MinusCircle className="h-4 w-4" />
          Registrar Merma (POST)
        </button>
      </div>

      {/* Tabs Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-2xl mx-auto shadow-xl">
        {isLoadingCatalogs ? (
          <div className="flex flex-col items-center py-12 space-y-3">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="text-slate-400 text-xs font-semibold">Cargando opciones del ERP...</p>
          </div>
        ) : (
          <>
            {/* Tab 0: Crear Compañía */}
            {activeTab === 'company' && (
              <form onSubmit={handleCompanySubmit} className="space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
                  <Building className="h-5 w-5 text-blue-400" />
                  <h3 className="font-bold text-slate-100 text-base">Registrar Nuevo Supermercado / Compañía</h3>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre del Supermercado</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. OXXO Bolivia o SuperMarket Bolivia S.A."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !companyName.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-855 disabled:text-slate-500 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registrando Supermercado...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Crear Compañía (POST /companies)
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Tab 1: Crear Sucursal */}
            {activeTab === 'branch' && (
              <form onSubmit={handleBranchSubmit} className="space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
                  <Store className="h-5 w-5 text-blue-400" />
                  <h3 className="font-bold text-slate-100 text-base">Registrar Sucursal Nueva</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Building className="h-3.5 w-3.5 text-slate-500" /> Compañía / Supermercado
                    </label>
                    <select
                      value={branchCompany}
                      onChange={(e) => setBranchCompany(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition cursor-pointer"
                    >
                      <option value="">-- Selecciona Compañía --</option>
                      {companies.map(c => (
                        <option key={c.id_compania} value={c.id_compania}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" /> Ciudad
                    </label>
                    <select
                      value={branchCity}
                      onChange={(e) => setBranchCity(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition cursor-pointer"
                    >
                      <option value="">-- Selecciona Ciudad --</option>
                      {cities.map(ct => (
                        <option key={ct.id_ciudad} value={ct.id_ciudad}>{ct.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre de Sucursal</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Sucursal Prado o Sucursal El Alto"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dirección física</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Av. 16 de Julio #1440, El Prado"
                    value={branchAddress}
                    onChange={(e) => setBranchAddress(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-850 disabled:text-slate-500 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registrando Sucursal...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Crear Sucursal (POST /branches)
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Tab 2: Crear Cliente */}
            {activeTab === 'customer' && (
              <form onSubmit={handleCustomerSubmit} className="space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
                  <UserPlus className="h-5 w-5 text-blue-400" />
                  <h3 className="font-bold text-slate-100 text-base">Registrar Nuevo Cliente</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Juanito Pérez"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Carnet de Identidad / NIT</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 12345678"
                      value={customerCI}
                      onChange={(e) => setCustomerCI(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Correo Electrónico</label>
                    <input
                      type="email"
                      placeholder="Ej. juanito@supermarket.bo"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Número Telefónico</label>
                    <input
                      type="text"
                      placeholder="Ej. 77712345"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado de Cliente</label>
                    <select
                      value={customerStatus}
                      onChange={(e) => setCustomerStatus(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition cursor-pointer"
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Puntos de fidelidad iniciales</label>
                    <input
                      type="number"
                      min={0}
                      value={customerPoints}
                      onChange={(e) => setCustomerPoints(Number(e.target.value))}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-850 disabled:text-slate-500 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registrando Cliente...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Registrar Cliente (POST /customers)
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Tab 3: Ingreso Manual */}
            {activeTab === 'input' && (
              <form onSubmit={handleManualInputSubmit} className="space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
                  <PlusCircle className="h-5 w-5 text-blue-400" />
                  <h3 className="font-bold text-slate-100 text-base">Registrar Ingreso Manual Físico</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sucursal</label>
                    <select
                      value={inputBranch}
                      onChange={(e) => setInputBranch(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition cursor-pointer"
                    >
                      <option value="">-- Seleccionar Sucursal --</option>
                      {branches.map(b => (
                        <option key={b.id_sucursal} value={b.id_sucursal}>{b.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Producto</label>
                    <select
                      value={inputProduct}
                      onChange={(e) => setInputProduct(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition cursor-pointer"
                    >
                      <option value="">-- Seleccionar Producto --</option>
                      {products.map(p => (
                        <option key={p.id_producto} value={p.id_producto}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cantidad de Ingreso</label>
                  <input
                    type="number"
                    min={1}
                    value={inputQuantity}
                    onChange={(e) => setInputQuantity(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Motivo u Observación</label>
                  <input
                    type="text"
                    placeholder="Ej. Carga inicial manual o Ajuste por diferencia"
                    value={inputReason}
                    onChange={(e) => setInputReason(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || inputQuantity <= 0}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-855 disabled:text-slate-500 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registrando Ingreso...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Registrar Ingreso (POST /inventory/input)
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Tab 4: Registrar Merma/Baja */}
            {activeTab === 'loss' && (
              <form onSubmit={handleLossSubmit} className="space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
                  <MinusCircle className="h-5 w-5 text-red-400" />
                  <h3 className="font-bold text-slate-100 text-base">Registrar Baja por Merma o Pérdida</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sucursal</label>
                    <select
                      value={lossBranch}
                      onChange={(e) => setLossBranch(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition cursor-pointer"
                    >
                      <option value="">-- Seleccionar Sucursal --</option>
                      {branches.map(b => (
                        <option key={b.id_sucursal} value={b.id_sucursal}>{b.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Producto</label>
                    <select
                      value={lossProduct}
                      onChange={(e) => setLossProduct(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition cursor-pointer"
                    >
                      <option value="">-- Seleccionar Producto --</option>
                      {products.map(p => (
                        <option key={p.id_producto} value={p.id_producto}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cantidad a dar de baja</label>
                  <input
                    type="number"
                    min={1}
                    value={lossQuantity}
                    onChange={(e) => setLossQuantity(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Motivo de la baja</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Producto vencido, rotura de envase, robo"
                    value={lossReason}
                    onChange={(e) => setLossReason(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || lossQuantity <= 0 || !lossReason.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-855 disabled:text-slate-500 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer shadow-md shadow-red-600/10"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registrando Baja...
                    </>
                  ) : (
                    <>
                      <MinusCircle className="h-4 w-4" />
                      Registrar Merma (POST /inventory/loss)
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
