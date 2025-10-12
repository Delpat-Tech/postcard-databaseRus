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

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface DesignVariable {
  key: string;
  value: string;
}

export interface AddressingConfig {
  font?: "Bradley Hand" | "Blackjack" | "FG Cathies Hand" | "Crappy Dan" | "Dakota" | "Jenna Sue" | "Reenie Beanie";
  fontColor?: "Black" | "Green" | "Blue";
  exceptionalAddressingType?: "resident" | "occupant" | "business";
  extRefNbr?: string;
}

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
  variables?: DesignVariable[];
}

export interface Order {
  _id: string;
  templateId?: string;
  designType: "single" | "split" | "drip";
  designId?: number | string; // API allows integer
  designName?: string;
  designSize?: string; // e.g., 46, 68, 611, etc.
  isCustomDesign: boolean;
  mailClass: "FirstClass" | "Standard";
  externalReference?: string;
  mailDate: string; // YYYY-MM-DD
  brochureFold: "Tri-Fold" | "Bi-Fold";
  returnAddress?: Address;
  recipients: Recipient[];
  addons?: { addon: "UV" | "Livestamping" }[] | null;
  front?: string | null; // Raw HTML or URL to HTML/PDF/JPG/PNG
  back?: string | null;  // Raw HTML or URL to HTML/PDF/JPG/PNG
  addressing?: AddressingConfig;
  globalDesignVariables?: DesignVariable[];
  qrCodeID?: number;
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
  frontPdf?: File;
  backPdf?: File;
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
  url?: string;
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
  toggleTemplateVisibility: (templateId: string, isPublic?: boolean) => void;
  addRecipient: (recipient: Recipient) => void;
  removeRecipient: (recipientId: string) => void;
  clearCurrentOrder: () => void;
  fetchTemplates: () => Promise<void>;
  fetchAllTemplates: () => Promise<void>;
  generateProofByTemplate: (
    size: string,
    recipient: Recipient,
    format: "pdf" | "jpg",
    templateId?: string,
    front?: string,
    back?: string,
  ) => Promise<{ front: string; back: string }>;
  openTemplateEditor: (templateId: string) => Promise<Template>;
  openTemplateSimpleEditor: (templateId: string) => Promise<string>;
  createNewDesign: (payload: { name: string; size: string }) => Promise<{ template: any; url?: string }>;
  fetchOrders: () => Promise<void>;
  importDesigns: () => Promise<Template[]>;
  createOrder: (orderData: Partial<Order>) => Promise<Order>;
  updateOrder: (orderId: string, orderData: Partial<Order>) => Promise<Order>;
  submitOrder: (orderId: string) => Promise<Order>;
  approveOrder: (orderId: string) => Promise<Order>;
  rejectOrder: (orderId: string) => Promise<Order>;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
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
      const token = localStorage.getItem("token") || null;

      // determine desired visibility if not provided
      let desiredIsPublic = undefined as boolean | undefined;
      const state = get();
      const existing = state.templates.find((t) => t._id === templateId);
      if (existing) desiredIsPublic = !existing.isPublic;

      const response = await fetch(`${API_BASE_URL}/templates/${templateId}/public`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isPublic: desiredIsPublic }),
      });

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

  // Admin: fetch all templates (requires admin token)
  fetchAllTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem("token") || null;
      const response = await fetch(`${API_BASE_URL}/templates`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (response.ok) {
        const templates = await response.json();
        set({ templates, isLoading: false });
      } else {
        throw new Error("Failed to fetch all templates");
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  // Admin: import designs from PostcardMania and save as templates
  importDesigns: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem("token") || null;
      const response = await fetch(`${API_BASE_URL}/admin/designs/import`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (response.ok) {
        const data = await response.json();
        const designs = data.designs || [];
        // update local templates list with imported designs
        set({ templates: designs, isLoading: false });
        return designs;
      } else {
        throw new Error("Failed to import designs");
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
      throw error;
    }
  },

  openTemplateSimpleEditor: async (templateId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/templates/${templateId}/editme`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to open template editor");
      const data = await response.json();
      const url = data?.url || data?.editorUrl || data?.redirectUrl;
      if (!url) throw new Error("No editor URL returned");
      set({ isLoading: false });
      return url;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error), isLoading: false });
      throw error;
    }
  },
  openTemplateEditor: async (templateId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/templates/${templateId}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to open template editor");
      const data = await response.json();
      const url = data?.url || data?.editorUrl || data?.redirectUrl;
      if (!url) throw new Error("No editor URL returned");
      set({ isLoading: false });
      return data;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error), isLoading: false });
      throw error;
    }
  },
  generateProofByTemplate: async (
    size: string,
    recipient: Recipient,
    format: "pdf" | "jpg" = "pdf",
    templateId?: string,
    front?: string,
    back?: string,
  ) => {
    set({ isLoading: true, error: null });

    try {
      const payload: any = { format, recipient, size };

      if (templateId) {
        payload.templateId = templateId;
      } else {
        payload.front = front || null;
        payload.back = back || null;
      }

      const response = await fetch(`${API_BASE_URL}/templates/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to generate proof");

      const data = await response.json();
      return { front: data.front, back: data.back };
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },


  // Create a new design via backend (which calls PostcardMania), save as template, make public and select it
  createNewDesign: async (payload: { name: string; size: string }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/templates/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designData: payload }),
      });

      if (!response.ok) throw new Error("Failed to create new design");
      const data = await response.json();
      const template = data?.template || data;
      const url = data?.url || data?.editorUrl || data?.redirectUrl;

      // update templates list and select the new template
      set((state) => ({ templates: [template, ...state.templates], isLoading: false, currentOrder: { ...state.currentOrder, templateId: template._id, designId: template.pcmDesignId || template._id, designName: template.name, designSize: template.size, isCustomDesign: false } }));

      return { template, url };
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error), isLoading: false });
      throw error;
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
