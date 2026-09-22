import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import * as apiClient from '../api/client';
import type { CartView } from '../types';

interface CartCtx {
  cart: CartView | null;
  count: number;
  refresh: () => Promise<void>;
  add: (productId: number, qty?: number) => Promise<void>;
  setQty: (productId: number, qty: number) => Promise<void>;
  remove: (productId: number) => Promise<void>;
  clear: () => Promise<void>;
}

const Ctx = createContext<CartCtx>(null!);
export const useCart = () => useContext(Ctx);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartView | null>(null);

  const refresh = useCallback(async () => {
    setCart(await apiClient.getCart());
  }, []);

  const add = useCallback(async (productId: number, qty = 1) => {
    setCart(await apiClient.addToCart(productId, qty));
  }, []);
  const setQty = useCallback(async (productId: number, qty: number) => {
    setCart(await apiClient.updateCart(productId, qty));
  }, []);
  const remove = useCallback(async (productId: number) => {
    setCart(await apiClient.removeFromCart(productId));
  }, []);
  const clear = useCallback(async () => {
    await apiClient.clearCart();
    setCart(await apiClient.getCart());
  }, []);

  useEffect(() => { refresh().catch(() => {}); }, [refresh]);

  const count = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <Ctx.Provider value={{ cart, count, refresh, add, setQty, remove, clear }}>
      {children}
    </Ctx.Provider>
  );
}
