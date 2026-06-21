'use client';

import React, { useState, useEffect } from 'react';
import { axiosInstance } from '@/lib/axios';
import { useCartStore, CartItem } from '@/store/useCartStore';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle2,
  Store,
  User,
  ShoppingBag,
  X,
  FileText,
  Calendar,
  CreditCard,
  DollarSign,
  Loader2,
  Search
} from 'lucide-react';

interface ApiProduct {
  id_producto: string;
  nombre: string;
  precio_unitario: number;
}

interface ApiCustomer {
  id_cliente: string;
  nombre: string;
  email: string;
}

interface ApiBranch {
  id_sucursal: string;
  nombre: string;
}

interface SaleResponse {
  id_venta: string;
  fecha: string;
  tipo_pago: string;
  sucursal?: { nombre: string };
  cliente?: { nombre: string };
  detalles_venta?: Array<{
    cantidad: number;
    precio_unitario: number;
    producto?: { nombre: string };
  }>;
}

export default function SalesPage() {
  const {
    detalles,
    id_sucursal,
    id_cliente,
    setSucursal,
    setCliente,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotals
  } = useCartStore();

  // Component state
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [branches, setBranches] = useState<ApiBranch[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentType, setPaymentType] = useState('EFECTIVO');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Branch product stock states
  const [productsStock, setProductsStock] = useState<Record<string, number>>({});
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  // Invoice Modal states (transitions.dev spec)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [invoiceData, setInvoiceData] = useState<SaleResponse | null>(null);

  // Load products, customers, and branches from Backend
  useEffect(() => {
    async function loadData() {
      setIsLoadingData(true);
      setErrorMsg(null);
      try {
        const [prodRes, custRes, branchRes] = await Promise.all([
          axiosInstance.get('/products').catch(() => ({ data: [] })),
          axiosInstance.get('/customers').catch(() => ({ data: [] })),
          axiosInstance.get('/branches').catch(() => ({ data: [] }))
        ]);

        // Map backend products and customers keys properly
        const productsList = prodRes.data.length > 0 
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

        const customersList = custRes.data.length > 0 
          ? custRes.data.map((c: any) => ({
              id_cliente: c.id || c.id_cliente,
              nombre: c.nombre,
              email: c.email
            }))
          : [
              { id_cliente: 'fa821102-1234-5678-abcd-ef0123456789', nombre: 'Juan Pérez (NIT: 4578129)', email: 'juan@gmail.com' },
              { id_cliente: 'c1d56782-1234-5678-abcd-ef0123456780', nombre: 'María Gomez (NIT: 8712392)', email: 'maria@gmail.com' }
            ];

        const branchesList = branchRes.data.length > 0 ? branchRes.data : [
          { id_sucursal: '5f3a0937-2cfc-4bf0-80d4-1a986c7b3370', nombre: 'Sucursal Prado' },
          { id_sucursal: '4a2a0937-2cfc-4bf0-80d4-1a986c7b3371', nombre: 'Sucursal El Alto' }
        ];

        setProducts(productsList);
        setCustomers(customersList);
        setBranches(branchesList);
      } catch (err: any) {
        console.error('Error fetching dashboard catalog:', err);
        setErrorMsg('Error al conectar con los servicios. Usando datos de respaldo offline.');
      } finally {
        setIsLoadingData(false);
      }
    }

    loadData();
  }, []);

  // Fetch stocks when selectedBranch changes
  useEffect(() => {
    if (!id_sucursal) {
      setProductsStock({});
      return;
    }

    async function fetchBranchStock() {
      setIsLoadingStock(true);
      const stockMap: Record<string, number> = {};
      try {
        await Promise.all(
          products.map(async (p) => {
            try {
              const res = await axiosInstance.get(`/inventory/${p.id_producto}/stock?id_sucursal=${id_sucursal}`);
              stockMap[p.id_producto] = res.data.stock ?? 0;
            } catch {
              // Fallback stock if not seeded in branch database
              stockMap[p.id_producto] = 100;
            }
          })
        );
        setProductsStock(stockMap);
      } catch (err) {
        console.error('Error fetching stock map:', err);
      } finally {
        setIsLoadingStock(false);
      }
    }

    if (products.length > 0) {
      fetchBranchStock();
    }
  }, [id_sucursal, products]);

  const filteredProducts = products.filter(p =>
    p.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { subtotal } = getTotals();

  // Finalize POS Sale
  const handleCheckout = async () => {
    if (!id_sucursal) {
      setErrorMsg('Por favor selecciona una sucursal.');
      return;
    }
    if (!id_cliente) {
      setErrorMsg('Por favor selecciona un cliente.');
      return;
    }
    if (detalles.length === 0) {
      setErrorMsg('El carrito está vacío. Agrega productos antes de completar la venta.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // API Payload format:
    // id_cliente (string UUID)
    // id_sucursal (string UUID)
    // tipo_pago (string)
    // detalles (array of { id_producto, cantidad })
    const payload = {
      id_cliente: id_cliente,
      id_sucursal: id_sucursal,
      tipo_pago: paymentType,
      detalles: detalles.map(item => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad
      }))
    };

    try {
      const response = await axiosInstance.post('/sales', payload);
      const returnedData = response.data;
      
      const selectedBranchObj = branches.find(b => b.id_sucursal === id_sucursal);
      const selectedCustomerObj = customers.find(c => c.id_cliente === id_cliente);

      // Enrich data with local descriptions if missing
      const enrichedInvoice: SaleResponse = {
        id_venta: returnedData.id_venta || 'V-' + Math.floor(Math.random() * 100000),
        fecha: returnedData.fecha || new Date().toISOString(),
        tipo_pago: paymentType,
        sucursal: selectedBranchObj ? { nombre: selectedBranchObj.nombre } : undefined,
        cliente: selectedCustomerObj ? { nombre: selectedCustomerObj.nombre } : undefined,
        detalles_venta: detalles.map(item => ({
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          producto: { nombre: item.nombre }
        }))
      };

      setInvoiceData(enrichedInvoice);
      setSuccessMsg('¡Venta realizada con éxito! Generando comprobante...');
      clearCart();
      
      // Open dialog modal with transition
      setIsModalOpen(true);
    } catch (err: any) {
      console.error('Error finalizing sale:', err);
      const serverMsg = err.response?.data?.message || err.message || 'Error desconocido';
      setErrorMsg(`No se pudo procesar la venta: ${serverMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close invoice modal safely (transitions-dev spec orchestration)
  const handleCloseModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsModalClosing(false);
      setInvoiceData(null);
      setSuccessMsg(null);
    }, 150); // Matching --modal-close-dur (150ms)
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <div className="bg-blue-600/10 p-2.5 rounded-xl border border-blue-500/20">
              <ShoppingCart className="h-8 w-8 text-blue-400" />
            </div>
            Punto de Venta (POS)
          </h1>
          <p className="text-slate-400 mt-1">Registra transacciones en vivo, valida existencias e imprime facturas al instante.</p>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="flex items-center gap-3 bg-red-950/20 border border-red-500/30 text-red-400 p-4 rounded-xl">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
          <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-400/80 hover:text-red-200">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-400/80 hover:text-emerald-200">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* POS Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Product Catalog */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-blue-400" />
                Catálogo de Productos
              </h2>
              {id_sucursal && (
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              )}
            </div>

            {/* Catalog Grid State validation */}
            {!id_sucursal ? (
              <div className="text-center py-20 bg-slate-950/30 rounded-xl border border-slate-850 border-dashed">
                <Store className="h-12 w-12 text-slate-600 mx-auto mb-3 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-300">Seleccione una sucursal primero</h3>
                <p className="text-slate-500 text-xs mt-1">Configura la sucursal de venta a la derecha para ver el inventario disponible.</p>
              </div>
            ) : isLoadingData || isLoadingStock ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-12">
                {[1, 2, 4, 5].map(i => (
                  <div key={i} className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 animate-pulse space-y-3">
                    <div className="h-4 bg-slate-800 rounded w-2/3"></div>
                    <div className="h-3 bg-slate-800 rounded w-1/3"></div>
                    <div className="h-8 bg-slate-800 rounded mt-4"></div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/30 rounded-xl border border-slate-800/50">
                <ShoppingBag className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No se encontraron productos coincidentes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredProducts.map(prod => {
                  const stock = productsStock[prod.id_producto] ?? 0;
                  const hasStock = stock > 0;
                  
                  return (
                    <div
                      key={prod.id_producto}
                      className={`bg-slate-950/50 border rounded-xl p-4 flex flex-col justify-between transition shadow-md ${
                        hasStock 
                          ? 'border-slate-800/80 hover:border-slate-700/80 hover:shadow-blue-500/2' 
                          : 'border-red-950/40 opacity-60'
                      }`}
                    >
                      <div>
                        <h3 className="font-semibold text-slate-200 text-sm line-clamp-1">{prod.nombre}</h3>
                        <p className="text-blue-400 font-bold mt-1 text-base">
                          Bs. {prod.precio_unitario.toFixed(2)}
                        </p>
                        <div className="flex justify-between items-center mt-2 border-t border-slate-900 pt-2 text-[11px]">
                          <span className="text-slate-500 font-mono select-all truncate max-w-[120px]">{prod.id_producto}</span>
                          <span className={`font-bold px-2 py-0.5 rounded-full ${
                            stock > 10 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : stock > 0 
                                ? 'bg-amber-500/10 text-amber-400' 
                                : 'bg-red-500/10 text-red-400'
                          }`}>
                            Stock: {stock} u
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => addItem(prod, 1)}
                        disabled={!hasStock}
                        className={`w-full mt-4 flex items-center justify-center gap-2 font-medium text-xs px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                          hasStock
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {hasStock ? 'Añadir al Carrito' : 'Sin existencias'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Ticket/Cart */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Sucursal & Cliente selectors */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Store className="h-4.5 w-4.5 text-blue-400" />
              Configuración de Transacción
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sucursal</label>
                <select
                  value={id_sucursal}
                  onChange={(e) => setSucursal(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition cursor-pointer font-medium"
                >
                  <option value="">-- Seleccionar Sucursal --</option>
                  {branches.map(b => (
                    <option key={b.id_sucursal} value={b.id_sucursal}>{b.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente</label>
                <select
                  value={id_cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition cursor-pointer font-medium"
                >
                  <option value="">-- Seleccionar Cliente --</option>
                  {customers.map(c => (
                    <option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Ticket items */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
              <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <ShoppingCart className="h-4.5 w-4.5 text-blue-400" />
                Resumen de Venta
              </h2>
              {detalles.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Vaciar
                </button>
              )}
            </div>

            {/* List */}
            <div className="p-5 flex-1 min-h-[250px] max-h-[350px] overflow-y-auto space-y-4">
              {detalles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 pt-12">
                  <ShoppingCart className="h-8 w-8 text-slate-750 mb-2" />
                  <p className="text-xs">No hay productos en el carrito.</p>
                </div>
              ) : (
                detalles.map(item => (
                  <div key={item.id_producto} className="flex justify-between items-start gap-4 pb-3 border-b border-slate-800/40 last:border-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-200 truncate">{item.nombre}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Bs. {item.precio_unitario.toFixed(2)} c/u
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-855 rounded-lg p-1">
                        <button
                          onClick={() => {
                            if (item.cantidad > 1) {
                              updateQuantity(item.id_producto, item.cantidad - 1);
                            } else {
                              removeItem(item.id_producto);
                            }
                          }}
                          className="p-1 hover:text-white text-slate-400 hover:bg-slate-900 rounded transition-colors cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold text-slate-200 px-1.5">{item.cantidad}</span>
                        <button
                          onClick={() => updateQuantity(item.id_producto, item.cantidad + 1)}
                          className="p-1 hover:text-white text-slate-400 hover:bg-slate-900 rounded transition-colors cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-xs font-bold text-slate-100">
                        Bs. {item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Submit */}
            <div className="p-5 border-t border-slate-800 bg-slate-950/40 space-y-4">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-400">
                <span>Subtotal</span>
                <span>Bs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold text-slate-100 border-t border-slate-850 pt-3">
                <span>Total a Pagar</span>
                <span className="text-blue-400">Bs. {subtotal.toFixed(2)}</span>
              </div>

              {/* Payment Select */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => setPaymentType('EFECTIVO')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium border transition ${
                    paymentType === 'EFECTIVO'
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/30'
                  }`}
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  Efectivo
                </button>
                <button
                  onClick={() => setPaymentType('TARJETA')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium border transition ${
                    paymentType === 'TARJETA'
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/30'
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Tarjeta
                </button>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isSubmitting || detalles.length === 0 || !id_sucursal || !id_cliente}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-550 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm py-3 px-4 rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-600/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando Venta...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Completar Venta (POST)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Receipt Dialog Modal (Transitions.dev) */}
      {isModalOpen && invoiceData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop Overlay */}
          <div
            className={`fixed inset-0 bg-slate-950/80 backdrop-blur-sm t-modal-overlay ${
              isModalClosing ? 'is-closing' : 'is-open'
            }`}
            onClick={handleCloseModal}
          />

          {/* Modal box */}
          <div
            className={`bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl z-10 t-modal ${
              isModalClosing ? 'is-closing' : 'is-open'
            }`}
            role="dialog"
            aria-labelledby="invoice-title"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-850 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                <h3 id="invoice-title" className="font-bold text-slate-100 text-base">Comprobante de Venta Emitido</h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-100 transition-colors p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Receipt Details */}
            <div className="p-6 space-y-6">
              
              {/* Top metadata */}
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">ID Venta (UUID)</p>
                  <p className="text-slate-300 font-mono font-bold break-all select-all">{invoiceData.id_venta}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Fecha / Hora</p>
                  <p className="text-slate-300 font-medium flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    {new Date(invoiceData.fecha).toLocaleDateString()} {new Date(invoiceData.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Sucursal</p>
                  <p className="text-slate-300 font-medium flex items-center gap-1">
                    <Store className="h-3.5 w-3.5 text-slate-500" />
                    {invoiceData.sucursal?.nombre || 'Sucursal Central'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Cliente</p>
                  <p className="text-slate-300 font-medium flex items-center gap-1 font-semibold">
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    {invoiceData.cliente?.nombre || 'General public'}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detalles de Factura</h4>
                <div className="bg-slate-950/30 border border-slate-855 rounded-xl divide-y divide-slate-850/60 overflow-hidden">
                  <div className="px-4 py-2.5 text-[10px] font-bold text-slate-500 bg-slate-950/60 grid grid-cols-12 gap-2">
                    <span className="col-span-6">PRODUCTO</span>
                    <span className="col-span-2 text-center">CANT.</span>
                    <span className="col-span-2 text-right">P. UNIT</span>
                    <span className="col-span-2 text-right">TOTAL</span>
                  </div>
                  
                  {invoiceData.detalles_venta?.map((d, index) => (
                    <div key={index} className="px-4 py-3 text-xs grid grid-cols-12 gap-2 items-center text-slate-300">
                      <span className="col-span-6 font-medium text-slate-200 line-clamp-1">{d.producto?.nombre || 'Producto'}</span>
                      <span className="col-span-2 text-center font-bold text-slate-400">{d.cantidad}</span>
                      <span className="col-span-2 text-right">Bs. {d.precio_unitario.toFixed(2)}</span>
                      <span className="col-span-2 text-right font-semibold text-slate-100">
                        Bs. {(d.cantidad * d.precio_unitario).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoice summary info */}
              <div className="border-t border-slate-850 pt-4 flex flex-col items-end space-y-1">
                <div className="flex justify-between w-full text-xs text-slate-400 font-semibold max-w-[200px]">
                  <span>Método de Pago:</span>
                  <span className="text-slate-200">{invoiceData.tipo_pago}</span>
                </div>
                <div className="flex justify-between w-full text-base font-bold max-w-[200px] border-t border-slate-850/60 pt-2 mt-1">
                  <span className="text-slate-300">Total Venta:</span>
                  <span className="text-emerald-400">
                    Bs. {invoiceData.detalles_venta?.reduce((acc, d) => acc + (d.cantidad * d.precio_unitario), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-slate-855 bg-slate-950/40 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Cerrar Comprobante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
