import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

export type CartItem = {
  productId: number;
  name: string;
  unitName?: string;
  unitPrice?: number;
  imageUrl?: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
};

type AddPayload = Omit<CartItem, 'quantity'> & { quantity?: number };
type UpdatePayload = { productId: number; quantity: number };
type RemovePayload = { productId: number };

type CartAction =
  | { type: 'ADD_ITEM'; payload: AddPayload }
  | { type: 'UPDATE_QTY'; payload: UpdatePayload }
  | { type: 'REMOVE_ITEM'; payload: RemovePayload }
  | { type: 'CLEAR' };

const CART_STORAGE_KEY = 'franchise_cart_v1';

const CartContext = createContext<{
  items: CartItem[];
  totalQuantity: number;
  addItem: (payload: AddPayload) => void;
  updateQuantity: (payload: UpdatePayload) => void;
  removeItem: (payload: RemovePayload) => void;
  clear: () => void;
} | null>(null);

function safeLoadCartState(): CartState {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as Partial<CartState> | null;
    const items = Array.isArray(parsed?.items) ? parsed!.items : [];

    const normalized: CartItem[] = items
      .map((i: any) => ({
        productId: Number(i?.productId),
        name: String(i?.name ?? ''),
        unitName: i?.unitName ? String(i.unitName) : undefined,
        unitPrice: i?.unitPrice != null ? Number(i.unitPrice) : undefined,
        imageUrl: i?.imageUrl ? String(i.imageUrl) : undefined,
        quantity: Number(i?.quantity ?? 0),
      }))
      .filter((i) => Number.isFinite(i.productId) && i.productId > 0 && !!i.name && Number.isFinite(i.quantity) && i.quantity > 0);

    return { items: normalized };
  } catch {
    return { items: [] };
  }
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const qtyToAdd = Math.max(1, Number(action.payload.quantity ?? 1));
      const idx = state.items.findIndex((i) => i.productId === action.payload.productId);
      if (idx === -1) {
        return {
          items: [
            ...state.items,
            {
              productId: action.payload.productId,
              name: action.payload.name,
              unitName: action.payload.unitName,
              unitPrice: action.payload.unitPrice,
              imageUrl: action.payload.imageUrl,
              quantity: qtyToAdd,
            },
          ],
        };
      }
      return {
        items: state.items.map((i) =>
          i.productId === action.payload.productId
            ? { ...i, quantity: i.quantity + qtyToAdd }
            : i
        ),
      };
    }
    case 'UPDATE_QTY': {
      const nextQty = Math.max(0, Number(action.payload.quantity));
      if (Number.isNaN(nextQty)) return state;
      if (nextQty === 0) {
        return { items: state.items.filter((i) => i.productId !== action.payload.productId) };
      }
      return {
        items: state.items.map((i) =>
          i.productId === action.payload.productId ? { ...i, quantity: nextQty } : i
        ),
      };
    }
    case 'REMOVE_ITEM': {
      return { items: state.items.filter((i) => i.productId !== action.payload.productId) };
    }
    case 'CLEAR': {
      return { items: [] };
    }
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, safeLoadCartState);

  useEffect(() => {
    try {
      if (state.items.length === 0) {
        localStorage.removeItem(CART_STORAGE_KEY);
        return;
      }
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: state.items }));
    } catch {
      // ignore storage errors (quota/private mode)
    }
  }, [state.items]);

  const value = useMemo(() => {
    const totalQuantity = state.items.reduce((sum, i) => sum + i.quantity, 0);
    return {
      items: state.items,
      totalQuantity,
      addItem: (payload: AddPayload) => dispatch({ type: 'ADD_ITEM', payload }),
      updateQuantity: (payload: UpdatePayload) => dispatch({ type: 'UPDATE_QTY', payload }),
      removeItem: (payload: RemovePayload) => dispatch({ type: 'REMOVE_ITEM', payload }),
      clear: () => dispatch({ type: 'CLEAR' }),
    };
  }, [state.items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}

