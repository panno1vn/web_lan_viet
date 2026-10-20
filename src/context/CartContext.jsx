import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'lanviet.cart';
const MAX_QTY = 20;

// Giỏ hàng chỉ lưu mã sản phẩm + số lượng. Giá luôn lấy từ máy chủ, và máy chủ tính lại tổng tiền
// khi đặt hàng -> sửa localStorage cũng không thay đổi được giá (§2.5).
function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((it) => Number.isSafeInteger(it?.productId) && it.productId > 0 && Number.isSafeInteger(it?.quantity))
      .map((it) => ({ productId: it.productId, quantity: Math.min(Math.max(it.quantity, 1), MAX_QTY) }))
      .slice(0, 20);
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* trình duyệt chặn storage - giỏ hàng chỉ tồn tại trong phiên hiện tại */
    }
  }, [items]);

  const add = useCallback((productId, quantity = 1) => {
    setItems((prev) => {
      const found = prev.find((it) => it.productId === productId);
      if (found) {
        return prev.map((it) =>
          it.productId === productId ? { ...it, quantity: Math.min(it.quantity + quantity, MAX_QTY) } : it,
        );
      }
      return [...prev, { productId, quantity: Math.min(quantity, MAX_QTY) }].slice(0, 20);
    });
  }, []);

  const update = useCallback((productId, quantity) => {
    const q = Math.min(Math.max(Math.trunc(quantity) || 1, 1), MAX_QTY);
    setItems((prev) => prev.map((it) => (it.productId === productId ? { ...it, quantity: q } : it)));
  }, []);

  const remove = useCallback((productId) => {
    setItems((prev) => prev.filter((it) => it.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((sum, it) => sum + it.quantity, 0);
  const value = useMemo(() => ({ items, count, add, update, remove, clear, MAX_QTY }), [items, count, add, update, remove, clear]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
