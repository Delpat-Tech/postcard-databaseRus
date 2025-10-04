import { create } from "zustand";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface Recipient {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  externalReferenceNumber?: string;
}

export interface Order {
  _id: string;
  designType: "single" | "split" | "drip";
  designId?: string;
  designName?: string;
  designSize?: string;
  isCustomDesign: boolean;
  mailClass: "First Class" | "Standard";
  externalReference?: string;
  mailDate: string;
  brochureFold: "Tri-Fold" | "Bi-Fold";
  returnAddress?: {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  recipients: Recipient[];
  status:
  | "draft"
  | "pending_admin_approval"
  | "submitted_to_pcm"
  | "approved"
  | "rejected";
  pcmOrderId?: string;
  pcmResponse?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Template {
  _id: string;
  pcmDesignId: string;
  name: string;
  size: string;
  previewUrl: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderStore {
  token: string | null;
  adminLogin: (username: string, password: string) => Promise<void>;
  adminLogout: () => void;
  currentOrder: Partial<Order>;
  orders: Order[];
  templates: Template[];
  isLoading: boolean;
  error: string | null;
  setCurrentOrder: (order: Partial<Order>) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
  setTemplates: (templates: Template[]) => void;
  toggleTemplateVisibility: (templateId: string) => void;
  addRecipient: (recipient: Recipient) => void;
  removeRecipient: (recipientId: string) => void;
  clearCurrentOrder: () => void;
  fetchTemplates: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  createOrder: (orderData: Partial<Order>) => Promise<Order>;
  updateOrder: (orderId: string, orderData: Partial<Order>) => Promise<Order>;
  submitOrder: (orderId: string) => Promise<Order>;
  approveOrder: (orderId: string) => Promise<Order>;
  rejectOrder: (orderId: string) => Promise<Order>;
}

export const useOrderStore = create<OrderStore>((set) => ({
  token: typeof window !== "undefined" ? (localStorage.getItem("token") || null) : null,
  currentOrder: {},
  orders: [],
  templates: [],
  isLoading: false,
  error: null,

  setCurrentOrder: (order) =>
    set((state) => ({ currentOrder: { ...state.currentOrder, ...order } })),

  addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),

  updateOrderStatus: (orderId, status) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order._id === orderId ? { ...order, status } : order
      ),
    })),

  setTemplates: (templates) => set({ templates }),

  adminLogin: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      const token = data.token;
      if (!token) throw new Error("No token returned");
      localStorage.setItem("token", token);
      set({ token, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
      throw err;
    }
  },

  adminLogout: () => {
    localStorage.removeItem("token");
    set({ token: null });
  },

  toggleTemplateVisibility: async (templateId) => {
    try {
      const token = (localStorage.getItem("token") || null);
      const response = await fetch(
        `${API_BASE_URL}/templates/${templateId}/public`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ isPublic: true }), // Toggle logic would be handled by backend
        }
      );

      if (response.ok) {
        const updatedTemplate = await response.json();
        set((state) => ({
          templates: state.templates.map((template) =>
            template._id === templateId ? updatedTemplate : template
          ),
        }));
      }
    } catch (error) {
      console.error("Error toggling template visibility:", error);
    }
  },

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

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/templates/public`);
      if (response.ok) {
        const templates = await response.json();
        set({ templates, isLoading: false });
      } else {
        throw new Error("Failed to fetch templates");
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = (localStorage.getItem("token") || null);
      const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (response.ok) {
        const orders = await response.json();
        set({ orders, isLoading: false });
      } else {
        throw new Error("Failed to fetch orders");
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  createOrder: async (orderData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const order = await response.json();
        set((state) => ({
          orders: [order, ...state.orders],
          isLoading: false,
        }));
        return order;
      } else {
        throw new Error("Failed to create order");
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
      throw error;
    }
  },

  updateOrder: async (orderId, orderData) => {
    set({ isLoading: true, error: null });
    try {
      const token = (localStorage.getItem("token") || null);
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const order = await response.json();
        set((state) => ({
          orders: state.orders.map((o) => (o._id === orderId ? order : o)),
          isLoading: false,
        }));
        return order;
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
        set((state) => ({
          orders: state.orders.map((o) => (o._id === orderId ? order : o)),
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

  approveOrder: async (orderId) => {
    set({ isLoading: true, error: null });
    try {
      const token = (localStorage.getItem("token") || null);
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const order = await response.json();
        set((state) => ({
          orders: state.orders.map((o) => (o._id === orderId ? order : o)),
          isLoading: false,
        }));
        return order;
      } else {
        throw new Error("Failed to approve order");
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
      throw error;
    }
  },

  rejectOrder: async (orderId) => {
    set({ isLoading: true, error: null });
    try {
      const token = (localStorage.getItem("token") || null);
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const order = await response.json();
        set((state) => ({
          orders: state.orders.map((o) => (o._id === orderId ? order : o)),
          isLoading: false,
        }));
        return order;
      } else {
        throw new Error("Failed to reject order");
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
