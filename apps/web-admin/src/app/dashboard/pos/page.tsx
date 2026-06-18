'use client';

import React, { useState } from 'react';
import { axiosInstance } from '@/lib/axios';
import { ShoppingCart, Trash2, Plus, AlertCircle, CheckCircle2, Store, User, ShoppingBag, X } from 'lucide-react';

interface Product {
  id_producto: string;
  nombre: string;
  precio_unitario: number;
  stock: number;
}

interface CartItem {
  id_producto: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface Notification {
  type: 'success' | 'error' | null;
  message: string;
}

// Datos Mockeados de sucursales y clientes para simular el POS
const SUCURSALES = [
  { id: '5f3a0937-2cfc-4bf0-80d4-1a986c7b3370', nombre: 'Sucursal Central La Paz' },
  { id: '4a2a0937-2cfc-4bf0-80d4-1a986c7b3371', nombre: 'Sucursal Santa Cruz (Equipetrol)' },
  { id: '3b1a0937-2cfc-4bf0-80d4-1a986c7b3372', nombre: 'Sucursal Cochabamba (Prado)' },
];

const CLIENTES = [
  { id: 'fa821102-1234-5678-abcd-ef0123456789', nombre: 'Juan Pérez (NIT: 4578129)' },
  { id: 'c1d56782-1234-5678-abcd-ef0123456780', nombre: 'María Gomez (NIT: 8712392)' },
  { id: '00000000-0000-0000-0000-000000000000', nombre: 'Cliente Inexistente (Error 400 en Backend)' },
];

const PRODUCTOS: Product[] = [
  { id_producto: 'b901a1c9-7323-4c91-bf9b-3a52e72bc13d', nombre: 'Coca Cola 2L', precio_unitario: 12.50, stock: 50 },
  { id_producto: 'a101a1c9-7323-4c91-bf9b-3a52e72bc13e', nombre: 'Leche Pil 1L', precio_unitario: 6.50, stock: 20 },
  { id_producto: 'c201a1c9-7323-4c91-bf9b-3a52e72bc13f', nombre: 'Aceite Fino 1L', precio_unitario: 15.00, stock: 100 },
  { id_producto: 'b901a1c9-7323-4c91-bf9b-3a52e72bc139', nombre: 'Detergente Omo (Prueba stock bajo: 2 unidades)', precio_unitario: 35.00, stock: 2 },
  { id_producto: '00000000-0000-0000-0000-000000000000', nombre: 'Producto Inexistente (Error 404 en Backend)', precio_unitario: 100.00, stock: 1 },
];

export default function POSPage() {
  const [selectedSucursal, setSelectedSucursal] = useState(SUCURSALES[0].id);
  const [selectedCliente, setSelectedCliente] = useState(CLIENTES[0].id);
  
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTOS[0].id_producto);
  const [productQuantity, setProductQuantity] = useState(1);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<Notification>({ type: null, message: '' });

  // Agregar producto al carrito local
  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    const product = PRODUCTOS.find(p => p.id_producto === selectedProduct);
    if (!product) return;

    if (productQuantity <= 0) {
      showNotification('error', 'La cantidad debe ser mayor a 0');
      return;
    }

    // Verificar si ya existe en el carrito
    const existingItemIdx = cart.findIndex(item => item.id_producto === selectedProduct);
    if (existingItemIdx > -1) {
      const updatedCart = [...cart];
      const newQty = updatedCart[existingItemIdx].cantidad + productQuantity;
      updatedCart[existingItemIdx].cantidad = newQty;
      updatedCart[existingItemIdx].subtotal = newQty * product.precio_unitario;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          id_producto: product.id_producto,
          nombre: product.nombre,
          cantidad: productQuantity,
          precio_unitario: product.precio_unitario,
          subtotal: productQuantity * product.precio_unitario,
        },
      ]);
    }

    showNotification('success', `Se agregó ${product.nombre} al carrito.`);
    // Resetear cantidad a 1
    setProductQuantity(1);
  };

  // Remover producto del carrito
  const handleRemoveFromCart = (id_producto: string) => {
    const item = cart.find(i => i.id_producto === id_producto);
    setCart(cart.filter(item => item.id_producto !== id_producto));
    if (item) {
      showNotification('success', `Se eliminó ${item.nombre} del carrito.`);
    }
  };

  // Calcular totales
  const subtotalCart = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const impuestoCart = subtotalCart * 0.13; // IVA 13% en Bolivia
  const totalCart = subtotalCart; // Asumimos subtotal incluye IVA o es el total neto

  // Helper para mostrar notificaciones flotantes temporales
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: null, message: '' });
    }, 5000);
  };

  // Finalizar venta en Backend
  const handleFinalizeSale = async () => {
    if (cart.length === 0) {
      showNotification('error', 'El carrito de compras está vacío.');
      return;
    }

    setIsSubmitting(true);
    setNotification({ type: null, message: '' });

    // Armar el payload requerido por el backend ms-sales
    const payload = {
      id_sucursal: selectedSucursal,
      id_cliente: selectedCliente,
      detalles: cart.map(item => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
      })),
    };

    try {
      console.log('Enviando payload a ms-sales:', payload);
      // Petición real al backend ms-sales que inyectará automáticamente el token
      const response = await axiosInstance.post('/sales', payload);

      showNotification('success', '¡Venta registrada con éxito en ms-sales! El comprobante ha sido emitido.');
      setCart([]); // Limpiar carrito tras venta exitosa
    } catch (error: any) {
      console.error('Error al registrar venta:', error);
      const errMsg = error.response?.data?.message || error.message || 'Error desconocido';
      showNotification('error', `Fallo al registrar la venta en ms-sales: ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-indigo-500" />
            Punto de Venta (POS)
          </h1>
          <p className="text-slate-400 mt-1">Registra ventas, valida inventario y emite comprobantes en tiempo real.</p>
        </div>
      </div>

      {/* Banner de Notificaciones */}
      {notification.type && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border animate-slideDown ${
            notification.type === 'success'
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
              : 'bg-red-950/20 border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center space-x-3">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification({ type: null, message: '' })}
            className="text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Layout POS: Formulario Izquierda | Carrito Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Columna Izquierda: Configuración y Selección de Productos */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Tarjeta 1: Sucursal y Cliente */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Store className="h-5 w-5 text-indigo-400" />
              Datos de Sucursal y Cliente
            </h2>

            <div className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Sucursal de Venta</label>
                <select
                  value={selectedSucursal}
                  onChange={(e) => setSelectedSucursal(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                >
                  {SUCURSALES.map(suc => (
                    <option key={suc.id} value={suc.id}>{suc.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Cliente (Para Comprobante)</label>
                <select
                  value={selectedCliente}
                  onChange={(e) => setSelectedCliente(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                >
                  {CLIENTES.map(cl => (
                    <option key={cl.id} value={cl.id}>{cl.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Agregar Producto */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <ShoppingBag className="h-5 w-5 text-indigo-400" />
              Añadir Producto
            </h2>

            <form onSubmit={handleAddToCart} className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Seleccionar Producto</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                >
                  {PRODUCTOS.map(prod => (
                    <option key={prod.id_producto} value={prod.id_producto}>
                      {prod.nombre} - Bs. {prod.precio_unitario.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Cantidad</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={productQuantity}
                    onChange={(e) => setProductQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition flex-1"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-3 text-sm font-semibold transition flex items-center space-x-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Columna Derecha: Detalle de la Compra (Carrito) */}
        <div className="lg:col-span-7 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl min-h-[480px] justify-between">
          <div>
            {/* Header del Carrito */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-indigo-400" />
                <h2 className="font-semibold text-slate-100 text-lg">Resumen de Venta</h2>
              </div>
              <span className="text-xs font-semibold bg-slate-800 text-slate-400 px-3 py-1 rounded-full">
                {cart.length} Ítem(s)
              </span>
            </div>

            {/* Tabla del Carrito */}
            {cart.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-4 bg-slate-950 rounded-full text-slate-600">
                  <ShoppingCart className="h-12 w-12" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-400 text-base">Carrito vacío</h3>
                  <p className="text-xs text-slate-600 mt-1">Selecciona productos a la izquierda para empezar la venta.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 text-xs font-semibold uppercase">
                      <th className="px-6 py-4">Producto</th>
                      <th className="px-6 py-4 text-center">Cant.</th>
                      <th className="px-6 py-4 text-right">Precio Unit.</th>
                      <th className="px-6 py-4 text-right">Subtotal</th>
                      <th className="px-6 py-4 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-sm text-slate-300">
                    {cart.map((item) => (
                      <tr key={item.id_producto} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-200">{item.nombre}</td>
                        <td className="px-6 py-4 text-center font-semibold">{item.cantidad}</td>
                        <td className="px-6 py-4 text-right">Bs. {item.precio_unitario.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-semibold text-white">Bs. {item.subtotal.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleRemoveFromCart(item.id_producto)}
                            className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Totales y Botón de Envío */}
          <div className="bg-slate-950 p-6 border-t border-slate-800 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal Neto</span>
                <span>Bs. {subtotalCart.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>IVA Estimado (13%)</span>
                <span>Bs. {impuestoCart.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-100 border-t border-slate-800 pt-2">
                <span>Total Cobrado</span>
                <span className="text-indigo-400">Bs. {totalCart.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleFinalizeSale}
              disabled={isSubmitting || cart.length === 0}
              className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer ${
                cart.length === 0
                  ? 'bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed shadow-none'
                  : isSubmitting
                  ? 'bg-indigo-650 text-slate-300 cursor-wait'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10 hover:shadow-indigo-600/20'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-slate-100 mr-2"></div>
                  <span>Procesando venta en ms-sales...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  <span>Finalizar y Confirmar Venta</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
