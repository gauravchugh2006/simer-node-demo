import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const storageKey = 'ccd-cart';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { token } = useAuth();
  const [items, setItems] = useState(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to read cart storage', error);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback((item) => {
    setItems((prev) => {
      const existing = prev.find((entry) => entry.id === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    const sanitized = Number.isFinite(quantity) && quantity > 0 ? Math.round(quantity) : 1;
    setItems((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: sanitized } : item))
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const checkout = useCallback(async () => {
    if (!token) {
      throw new Error('AUTH_REQUIRED');
    }
    if (items.length === 0) {
      throw new Error('CART_EMPTY');
    }
    const formattedItems = items.flatMap((item) =>
      Array.from({ length: item.quantity }, () => ({ name: item.name }))
    );
    const payload = {
      items: formattedItems,
      totalPrice: Number(total.toFixed(2))
    };
    const { data } = await api.post('/api/orders', payload);
    clearCart();
    return data;
  }, [items, total, token, clearCart]);

  const value = useMemo(
    () => ({
      cartItems: items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal: total,
      checkout
    }),
    [items, addToCart, removeFromCart, updateQuantity, clearCart, total, checkout]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
