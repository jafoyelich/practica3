import { create } from 'zustand';

export interface CartItem {
  id_producto: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface CartStore {
  detalles: CartItem[];
  id_sucursal: string;
  id_cliente: string;
  setSucursal: (id: string) => void;
  setCliente: (id: string) => void;
  addItem: (product: { id_producto: string; nombre: string; precio_unitario: number }, quantity: number) => void;
  removeItem: (id_producto: string) => void;
  updateQuantity: (id_producto: string, quantity: number) => void;
  clearCart: () => void;
  getTotals: () => { subtotal: number; total: number };
}

export const useCartStore = create<CartStore>((set, get) => ({
  detalles: [],
  id_sucursal: '', // Empty by default to enforce selection
  id_cliente: '',  // Empty by default to enforce selection

  setSucursal: (id_sucursal) => set({ id_sucursal }),
  setCliente: (id_cliente) => set({ id_cliente }),

  addItem: (product, quantity) => {
    set((state) => {
      const existingItemIndex = state.detalles.findIndex(
        (item) => item.id_producto === product.id_producto
      );

      let newDetalles = [...state.detalles];

      if (existingItemIndex > -1) {
        const item = newDetalles[existingItemIndex];
        const newQuantity = item.cantidad + quantity;
        newDetalles[existingItemIndex] = {
          ...item,
          cantidad: newQuantity,
          subtotal: Number((newQuantity * product.precio_unitario).toFixed(2)),
        };
      } else {
        newDetalles.push({
          id_producto: product.id_producto,
          nombre: product.nombre,
          cantidad: quantity,
          precio_unitario: product.precio_unitario,
          subtotal: Number((quantity * product.precio_unitario).toFixed(2)),
        });
      }

      return { detalles: newDetalles };
    });
  },

  removeItem: (id_producto) => {
    set((state) => ({
      detalles: state.detalles.filter((item) => item.id_producto !== id_producto),
    }));
  },

  updateQuantity: (id_producto, quantity) => {
    set((state) => ({
      detalles: state.detalles.map((item) =>
        item.id_producto === id_producto
          ? {
              ...item,
              cantidad: quantity,
              subtotal: Number((quantity * item.precio_unitario).toFixed(2)),
            }
          : item
      ),
    }));
  },

  clearCart: () => set({ detalles: [] }),

  getTotals: () => {
    const detalles = get().detalles;
    const subtotal = detalles.reduce((acc, item) => acc + item.subtotal, 0);
    return {
      subtotal: Number(subtotal.toFixed(2)),
      total: Number(subtotal.toFixed(2)),
    };
  },
}));
