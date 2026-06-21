'use client';

import React, { useState, useEffect, useRef } from 'react';
import { axiosInstance } from '@/lib/axios';
import {
  Package,
  ArrowRightLeft,
  Upload,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  X,
  FileSpreadsheet,
  Layers,
  Store,
  Calendar,
  ChevronRight,
  Info,
  Loader2
} from 'lucide-react';

interface KardexMovement {
  id_kardex: string;
  tipo_movimiento: 'INGRESO' | 'EGRESO' | 'TRANSFERENCIA_ENTRADA' | 'TRANSFERENCIA_SALIDA';
  cantidad: number;
  fecha: string;
  id_producto: string;
  producto?: { nombre: string };
}

interface Product {
  id_producto: string;
  nombre: string;
  precio_unitario: number;
}

interface Branch {
  id_sucursal: string;
  nombre: string;
}

export default function InventoryPage() {
  // Lists
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [kardexMovements, setKardexMovements] = useState<KardexMovement[]>([]);

  // Consolidated nationwide stock mapping
  const [consolidatedStockMap, setConsolidatedStockMap] = useState<Record<string, number>>({});
  const [isLoadingAllConsolidated, setIsLoadingAllConsolidated] = useState(false);

  // Selected filters
  const [selectedBranch, setSelectedBranch] = useState('');
  const [consolidatedSearch, setConsolidatedSearch] = useState('');

  // States
  const [activeTab, setActiveTab] = useState<'kardex' | 'consolidated'>('kardex');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [isLoadingKardex, setIsLoadingKardex] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // Modal Open/Closing states (transitions.dev orchestration)
  const [modalType, setModalType] = useState<'input' | 'transfer' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);

  // Carga Inicial modal active tab: 'excel' or 'manual'
  const [cargaMode, setCargaMode] = useState<'excel' | 'manual'>('excel');

  // Carga Inicial manual form fields
  const [inputBranch, setInputBranch] = useState('');
  const [inputProduct, setInputProduct] = useState('');
  const [inputQuantity, setInputQuantity] = useState(1);
  const [isSubmittingInput, setIsSubmittingInput] = useState(false);

  // Excel upload file
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Transfer form fields
  const [transferOriginBranch, setTransferOriginBranch] = useState('');
  const [transferDestBranch, setTransferDestBranch] = useState('');
  const [transferProduct, setTransferProduct] = useState('');
  const [transferQuantity, setTransferQuantity] = useState(1);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Fetch catalogs on load
  useEffect(() => {
    async function fetchCatalogs() {
      setIsLoadingCatalog(true);
      try {
        const [prodRes, branchRes] = await Promise.all([
          axiosInstance.get('/products').catch(() => ({ data: [] })),
          axiosInstance.get('/branches').catch(() => ({ data: [] }))
        ]);

        const prodList = prodRes.data.length > 0 
          ? prodRes.data.map((p: any) => ({
              id_producto: p.id || p.id_producto,
              nombre: p.nombre,
              precio_unitario: p.precio_unitario ?? Number(p.precio_base) ?? 0
            }))
          : [
              { id_producto: 'b901a1c9-7323-4c91-bf9b-3a52e72bc13d', nombre: 'Coca Cola 2L', precio_unitario: 12.50 },
              { id_producto: 'a101a1c9-7323-4c91-bf9b-3a52e72bc13e', nombre: 'Leche Pil 1L', precio_unitario: 6.50 },
              { id_producto: 'c201a1c9-7323-4c91-bf9b-3a52e72bc13f', nombre: 'Aceite Fino 1L', precio_unitario: 15.00 },
              { id_producto: 'b901a1c9-7323-4c91-bf9b-3a52e72bc139', nombre: 'Detergente Omo 1kg', precio_unitario: 35.00 }
            ];

        const branchList = branchRes.data.length > 0 ? branchRes.data : [
          { id_sucursal: '5f3a0937-2cfc-4bf0-80d4-1a986c7b3370', nombre: 'Sucursal Prado' },
          { id_sucursal: '4a2a0937-2cfc-4bf0-80d4-1a986c7b3371', nombre: 'Sucursal El Alto' }
        ];

        setProducts(prodList);
        setBranches(branchList);

        if (branchList.length > 0) {
          setSelectedBranch(branchList[0].id_sucursal);
          setInputBranch(branchList[0].id_sucursal);
          setTransferOriginBranch(branchList[0].id_sucursal);
          setTransferDestBranch(branchList[1]?.id_sucursal || branchList[0].id_sucursal);
        }
        if (prodList.length > 0) {
          setInputProduct(prodList[0].id_producto);
          setTransferProduct(prodList[0].id_producto);
        }
      } catch (error) {
        console.error('Error fetching inventory page catalog:', error);
      } finally {
        setIsLoadingCatalog(false);
      }
    }
    fetchCatalogs();
  }, []);

  // Fetch Kardex history
  const fetchKardexHistory = async (branchId: string) => {
    if (!branchId) return;
    setIsLoadingKardex(true);
    try {
      const response = await axiosInstance.get(`/inventory/kardex/${branchId}`);
      // Sort by date desc
      const sorted = (response.data || []).sort(
        (a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
      setKardexMovements(sorted);
    } catch (err: any) {
      console.error('Error fetching Kardex:', err);
      setKardexMovements([]);
    } finally {
      setIsLoadingKardex(false);
    }
  };

  // Fetch all consolidated balances
  const fetchAllConsolidatedBalances = async () => {
    if (products.length === 0) return;
    setIsLoadingAllConsolidated(true);
    const tempMap: Record<string, number> = {};
    try {
      await Promise.all(
        products.map(async (p) => {
          try {
            const res = await axiosInstance.get(`/inventory/balance/${p.id_producto}/consolidated`);
            tempMap[p.id_producto] = res.data.total ?? 0;
          } catch {
            // Mock default consolidated value if service is offline
            tempMap[p.id_producto] = 120;
          }
        })
      );
      setConsolidatedStockMap(tempMap);
    } catch (err) {
      console.error('Error loading consolidated balances:', err);
    } finally {
      setIsLoadingAllConsolidated(false);
    }
  };

  // Trigger Kardex fetch on branch change
  useEffect(() => {
    if (selectedBranch) {
      fetchKardexHistory(selectedBranch);
    }
  }, [selectedBranch, products]);

  // Trigger Consolidated fetch on tab change
  useEffect(() => {
    if (activeTab === 'consolidated' && products.length > 0) {
      fetchAllConsolidatedBalances();
    }
  }, [activeTab, products]);

  // Toast Notification helper
  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: null, message: '' });
    }, 5000);
  };

  // Open modal (transitions.dev orchestration)
  const openModal = (type: 'input' | 'transfer') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  // Close modal (transitions.dev orchestration)
  const closeModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsModalClosing(false);
      setModalType(null);
      setExcelFile(null);
    }, 150); // Matching --modal-close-dur (150ms)
  };

  // Submit Manual Inventory Input (Carga Inicial)
  const handleManualInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputBranch || !inputProduct || inputQuantity <= 0) {
      showToast('error', 'Por favor llena todos los campos correctamente.');
      return;
    }

    setIsSubmittingInput(true);
    try {
      await axiosInstance.post('/inventory/input', {
        id_sucursal: inputBranch,
        id_producto: inputProduct,
        cantidad: Number(inputQuantity)
      });

      showToast('success', 'Ingreso manual registrado con éxito en Kardex.');
      closeModal();
      // Refresh current views
      if (selectedBranch === inputBranch) fetchKardexHistory(selectedBranch);
      if (activeTab === 'consolidated') fetchAllConsolidatedBalances();
    } catch (err: any) {
      console.error('Error submitting manual stock input:', err);
      const msg = err.response?.data?.message || err.message || 'Error en el backend';
      showToast('error', `Fallo al registrar ingreso: ${msg}`);
    } finally {
      setIsSubmittingInput(false);
    }
  };

  // Submit Excel File (Carga Inicial)
  const handleExcelUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) {
      showToast('error', 'Por favor selecciona un archivo Excel.');
      return;
    }

    setIsSubmittingInput(true);
    const formData = new FormData();
    formData.append('file', excelFile);

    try {
      await axiosInstance.post('/inventory/load_excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast('success', '¡Archivo Excel importado correctamente! Stock cargado en las sucursales.');
      closeModal();
      if (selectedBranch) fetchKardexHistory(selectedBranch);
      if (activeTab === 'consolidated') fetchAllConsolidatedBalances();
    } catch (err: any) {
      console.error('Error uploading excel:', err);
      const msg = err.response?.data?.message || err.message || 'Error en formato de datos';
      showToast('error', `Fallo al subir Excel: ${msg}`);
    } finally {
      setIsSubmittingInput(false);
    }
  };

  // Submit Stock Transfer
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferOriginBranch || !transferDestBranch || !transferProduct || transferQuantity <= 0) {
      showToast('error', 'Por favor completa todos los campos.');
      return;
    }

    if (transferOriginBranch === transferDestBranch) {
      showToast('error', 'Las sucursales de origen y destino no pueden ser iguales.');
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      await axiosInstance.post('/inventory/transfer', {
        id_sucursal_origen: transferOriginBranch,
        id_sucursal_destino: transferDestBranch,
        id_producto: transferProduct,
        cantidad: Number(transferQuantity)
      });

      showToast('success', '¡Transferencia de stock realizada y anotada en Kardex!');
      closeModal();
      
      // Refresh current views
      if (selectedBranch === transferOriginBranch || selectedBranch === transferDestBranch) {
        fetchKardexHistory(selectedBranch);
      }
      if (activeTab === 'consolidated') {
        fetchAllConsolidatedBalances();
      }
    } catch (err: any) {
      console.error('Error during stock transfer:', err);
      const msg = err.response?.data?.message || err.message || 'Stock insuficiente';
      showToast('error', `Fallo en transferencia: ${msg}`);
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  // Filter products by search in consolidated view
  const filteredConsolidated = products.filter(p =>
    p.nombre.toLowerCase().includes(consolidatedSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <div className="bg-blue-600/10 p-2.5 rounded-xl border border-blue-500/20">
              <Package className="h-8 w-8 text-blue-400" />
            </div>
            Inventario y Kardex
          </h1>
          <p className="text-slate-400 mt-1">Administra el stock físico de tus sucursales, realiza cargas iniciales y transfiere inventarios.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => openModal('input')}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 font-semibold text-xs px-4 py-3 rounded-xl transition cursor-pointer"
          >
            <Upload className="h-4 w-4 text-blue-400" />
            Carga Inicial
          </button>
          
          <button
            onClick={() => openModal('transfer')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-3 rounded-xl transition cursor-pointer shadow-lg shadow-blue-600/10"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Transferir Stock
          </button>
        </div>
      </div>

      {/* Floating alert toast */}
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

      {/* Segmented View Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('kardex')}
          className={`px-6 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 transition ${
            activeTab === 'kardex'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Kardex por Sucursal (GET)
        </button>
        <button
          onClick={() => setActiveTab('consolidated')}
          className={`px-6 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 transition ${
            activeTab === 'consolidated'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Balance Consolidado Total (GET)
        </button>
      </div>

      {/* Tab 1: Kardex por Sucursal */}
      {activeTab === 'kardex' && (
        <div className="space-y-6">
          {/* Sucursal filter */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-blue-400" />
              <div>
                <h3 className="font-bold text-slate-200 text-sm">Historial de Kardex</h3>
                <p className="text-xs text-slate-400">Ver todos los movimientos de stock asociados a esta sucursal.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-xs text-slate-400 font-bold whitespace-nowrap uppercase">Filtrar por Sucursal:</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition"
              >
                {branches.map(b => (
                  <option key={b.id_sucursal} value={b.id_sucursal}>{b.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Kardex Movements Table without Anterior and Nuevo Saldo */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[10px] font-bold uppercase bg-slate-950/20">
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">ID Movimiento</th>
                    <th className="px-6 py-4">Producto</th>
                    <th className="px-6 py-4 text-center">Tipo de Movimiento</th>
                    <th className="px-6 py-4 text-right">Cantidad Afectada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                  {isLoadingKardex ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-3 bg-slate-800 rounded w-24"></div></td>
                        <td className="px-6 py-4"><div className="h-3 bg-slate-800 rounded w-28"></div></td>
                        <td className="px-6 py-4"><div className="h-3 bg-slate-800 rounded w-32"></div></td>
                        <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-800 rounded-full w-20 mx-auto"></div></td>
                        <td className="px-6 py-4 text-right"><div className="h-3 bg-slate-800 rounded w-8 ml-auto"></div></td>
                      </tr>
                    ))
                  ) : kardexMovements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        <Info className="h-8 w-8 text-slate-750 mx-auto mb-2" />
                        <p className="text-xs">No se registraron movimientos físicos en esta sucursal.</p>
                      </td>
                    </tr>
                  ) : (
                    kardexMovements.map(mov => {
                      const prodName = mov.producto?.nombre || products.find(p => p.id_producto === mov.id_producto)?.nombre || 'Producto';
                      
                      let typeLabel = '';
                      let typeColor = '';
                      let amountSign = '';
                      let amountColor = '';

                      switch (mov.tipo_movimiento) {
                        case 'INGRESO':
                          typeLabel = 'Ingreso';
                          typeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                          amountSign = '+';
                          amountColor = 'text-emerald-400 font-bold';
                          break;
                        case 'TRANSFERENCIA_ENTRADA':
                          typeLabel = 'Entrada Trf.';
                          typeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                          amountSign = '+';
                          amountColor = 'text-blue-400 font-bold';
                          break;
                        case 'EGRESO':
                          typeLabel = 'Egreso';
                          typeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                          amountSign = '-';
                          amountColor = 'text-rose-400 font-bold';
                          break;
                        case 'TRANSFERENCIA_SALIDA':
                          typeLabel = 'Salida Trf.';
                          typeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                          amountSign = '-';
                          amountColor = 'text-amber-400 font-bold';
                          break;
                      }

                      return (
                        <tr key={mov.id_kardex} className="hover:bg-slate-800/10 transition-colors">
                          <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                            {new Date(mov.fecha).toLocaleDateString()} {new Date(mov.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 font-mono text-[10px] text-slate-500 break-all select-all">{mov.id_kardex}</td>
                          <td className="px-6 py-4 font-semibold text-slate-200">{prodName}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${typeColor}`}>
                              {typeLabel}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-right ${amountColor}`}>
                            {amountSign}{mov.cantidad}
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
      )}

      {/* Tab 2: Balance Consolidado Total (Refactored Grid layout) */}
      {activeTab === 'consolidated' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <Layers className="h-5 w-5 text-blue-400" />
              <div>
                <h3 className="font-bold text-slate-200 text-sm">Balance Consolidado Total</h3>
                <p className="text-xs text-slate-400">Existencias acumuladas en todo el territorio nacional por producto.</p>
              </div>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Filtrar por nombre..."
                value={consolidatedSearch}
                onChange={(e) => setConsolidatedSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Cards Grid */}
          {isLoadingAllConsolidated ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse space-y-4">
                  <div className="h-5 bg-slate-850 rounded w-1/2"></div>
                  <div className="h-10 bg-slate-850 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-850 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : filteredConsolidated.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
              <Package className="h-8 w-8 text-slate-700 mx-auto mb-2" />
              <p className="text-xs">No se encontraron productos coincidentes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredConsolidated.map(prod => {
                const total = consolidatedStockMap[prod.id_producto] ?? 0;
                const isLow = total <= 15;

                return (
                  <div
                    key={prod.id_producto}
                    className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-md flex flex-col justify-between hover:border-slate-700/80 transition"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-slate-200 text-sm line-clamp-1">{prod.nombre}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isLow ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {isLow ? 'Bajo Stock' : 'Óptimo'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono select-all truncate">{prod.id_producto}</p>
                    </div>

                    <div className="mt-6 flex items-baseline justify-between border-t border-slate-850/60 pt-4">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Total Nacional</span>
                        <span className="text-3xl font-black text-blue-400 mt-1 block">{total} u</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Precio Ref.</span>
                        <span className="text-xs font-semibold text-slate-300 mt-2 block">Bs. {prod.precio_unitario.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Carga Inicial Dialog Modal (Excel or Manual input - transitions.dev style) */}
      {isModalOpen && modalType === 'input' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={`fixed inset-0 bg-slate-950/80 backdrop-blur-sm t-modal-overlay ${
              isModalClosing ? 'is-closing' : 'is-open'
            }`}
            onClick={closeModal}
          />

          <div
            className={`bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl z-10 t-modal ${
              isModalClosing ? 'is-closing' : 'is-open'
            }`}
            role="dialog"
            aria-labelledby="input-modal-title"
          >
            <div className="px-6 py-4 border-b border-slate-855 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Upload className="h-4.5 w-4.5 text-blue-400" />
                <h3 id="input-modal-title" className="font-bold text-slate-100 text-sm">Carga Inicial de Inventario</h3>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-100 transition p-1 hover:bg-slate-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex border-b border-slate-855 bg-slate-950/20 text-xs">
              <button
                onClick={() => setCargaMode('excel')}
                className={`flex-1 py-3 text-center font-bold tracking-wide border-b-2 transition ${
                  cargaMode === 'excel' ? 'border-blue-500 text-white bg-slate-900/40' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Subir Archivo Excel
              </button>
              <button
                onClick={() => setCargaMode('manual')}
                className={`flex-1 py-3 text-center font-bold tracking-wide border-b-2 transition ${
                  cargaMode === 'manual' ? 'border-blue-500 text-white bg-slate-900/40' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Ingreso Manual (POST)
              </button>
            </div>

            <div className="p-6">
              {cargaMode === 'excel' && (
                <form onSubmit={handleExcelUploadSubmit} className="space-y-4">
                  <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-6 text-center cursor-pointer relative bg-slate-950/20 transition">
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      ref={fileInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setExcelFile(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                    <FileSpreadsheet className="h-10 w-10 text-blue-400 mx-auto mb-2" />
                    {excelFile ? (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-200">{excelFile.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{(excelFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-300">Presiona para arrastrar o subir</p>
                        <p className="text-[10px] text-slate-500">Soporta formatos Excel (.xls, .xlsx)</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-950 border border-slate-855 rounded-xl p-3 flex gap-2.5 items-start text-[11px] text-slate-400">
                    <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>El archivo debe contener las columnas exactas: <strong>id_sucursal</strong>, <strong>id_producto</strong> y <strong>cantidad</strong>.</span>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-855">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 font-semibold text-xs px-4 py-2.5 rounded-lg transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingInput || !excelFile}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSubmittingInput && <Loader2 className="h-3 w-3 animate-spin" />}
                      Procesar Excel
                    </button>
                  </div>
                </form>
              )}

              {cargaMode === 'manual' && (
                <form onSubmit={handleManualInputSubmit} className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sucursal de Destino</label>
                    <select
                      value={inputBranch}
                      onChange={(e) => setInputBranch(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition"
                    >
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
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition"
                    >
                      {products.map(p => (
                        <option key={p.id_producto} value={p.id_producto}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cantidad de Ingreso</label>
                    <input
                      type="number"
                      min={1}
                      value={inputQuantity}
                      onChange={(e) => setInputQuantity(Number(e.target.value))}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-855">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 font-semibold text-xs px-4 py-2.5 rounded-lg transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingInput || inputQuantity <= 0}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSubmittingInput && <Loader2 className="h-3 w-3 animate-spin" />}
                      Registrar Ingreso (POST)
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transfer Stock Dialog Modal (transitions.dev style) */}
      {isModalOpen && modalType === 'transfer' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={`fixed inset-0 bg-slate-950/80 backdrop-blur-sm t-modal-overlay ${
              isModalClosing ? 'is-closing' : 'is-open'
            }`}
            onClick={closeModal}
          />

          <div
            className={`bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl z-10 t-modal ${
              isModalClosing ? 'is-closing' : 'is-open'
            }`}
            role="dialog"
            aria-labelledby="transfer-modal-title"
          >
            <div className="px-6 py-4 border-b border-slate-855 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-4.5 w-4.5 text-blue-400" />
                <h3 id="transfer-modal-title" className="font-bold text-slate-100 text-sm">Transferir Stock Físico</h3>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-100 transition p-1 hover:bg-slate-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sucursal de Origen</label>
                  <select
                    value={transferOriginBranch}
                    onChange={(e) => setTransferOriginBranch(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition"
                  >
                    {branches.map(b => (
                      <option key={b.id_sucursal} value={b.id_sucursal}>{b.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sucursal de Destino</label>
                  <select
                    value={transferDestBranch}
                    onChange={(e) => setTransferDestBranch(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition"
                  >
                    {branches.map(b => (
                      <option key={b.id_sucursal} value={b.id_sucursal}>{b.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Producto a Transferir</label>
                <select
                  value={transferProduct}
                  onChange={(e) => setTransferProduct(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition"
                >
                  {products.map(p => (
                    <option key={p.id_producto} value={p.id_producto}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-855">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 font-semibold text-xs px-4 py-2.5 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransfer || transferQuantity <= 0}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingTransfer && <Loader2 className="h-3 w-3 animate-spin" />}
                  Transferir Stock (POST)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
