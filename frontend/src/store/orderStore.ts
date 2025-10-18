import { create } from "zustand";
import type { Order, Recipient } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface OrderStore {
  currentOrder: Partial<Order>;
  isLoading: boolean;
  error: string | null;
  setCurrentOrder: (order: Partial<Order>) => void;
  addRecipient: (recipient: Recipient) => void;
  removeRecipient: (recipientId: string) => void;
  clearCurrentOrder: () => void;
  createOrder: (orderData: Partial<Order>) => Promise<Order>;
  createPaymentOrder: (orderId: string) => Promise<string>;
  submitOrder: (orderId: string) => Promise<Order>;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  token: typeof window !== "undefined" ? (localStorage.getItem("token") || null) : null,
  currentOrder: {},
  isLoading: false,
  error: null,

  setCurrentOrder: (order) =>
    set((state) => ({ currentOrder: { ...state.currentOrder, ...order } })),

  addRecipient: (recipient) =>
    set((state) => ({
      currentOrder: {
        ...state.currentOrder,
        recipients: [...(state.currentOrder.recipients || []), recipient],
      },
    })),

  removeRecipient: (recipientId) =>
    set((state) => ({
      currentOrder: {
        ...state.currentOrder,
        recipients: (state.currentOrder.recipients || []).filter(
          (r) => r.id !== recipientId
        ),
      },
    })),

  clearCurrentOrder: () => set({ currentOrder: {} }),

  createOrder: async (orderData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const data = await response.json().catch(() => ({})); // handle empty body safely

      if (!response.ok) {
        // Prefer backend-provided message
        const message =
          data?.error || data?.message || `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      // success
      set(() => ({
        isLoading: false,
      }));

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },


  createPaymentOrder: async (orderId: string) => {

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE_URL}/payments/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: orderId,
      });
      if (res.ok) {
        const payid = await res.json()
        return payid;
      } else {
        throw new Error("Failed to update order");
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
      throw error;
    }
  },

  submitOrder: async (orderId) => {
    set({ isLoading: true, error: null });
    try {
      const token = (localStorage.getItem("token") || null);
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const order = await response.json();
        set(() => ({
          isLoading: false,
        }));
        return order;
      } else {
        throw new Error("Failed to submit order");
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
      throw error;
    }
  },

}));
