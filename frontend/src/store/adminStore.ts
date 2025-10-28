import { create } from "zustand";
import { type Template, type Order } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface AdminStore {
    isLoading: boolean;
    orders: Order[];
    templates: Template[];
    error: string | null;
    setTemplates: (templates: Template[]) => void;
    toggleTemplateVisibility: (templateId: string) => Promise<void>;
    fetchAllTemplates: () => Promise<void>;
    importDesigns: () => Promise<Template[]>;
    fetchOrders: () => Promise<void>;
    approveOrder: (orderId: string) => Promise<Order>;
    rejectOrder: (orderId: string) => Promise<Order>;
    deleteTemplateSoft: (templateId: string) => Promise<any>;
    deleteTemplateExternal: (templateId: string) => Promise<any>;
    fetchPrices: (type?: string) => Promise<any>;
    updatePrices: (type: string, payload: { pricing: any[] }) => Promise<any>;
    setTemplateType: (templateId: string, type: string) => Promise<any>;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
    isLoading: false,
    error: null,
    orders: [],
    templates: [],
    setTemplates: (templates) => set({ templates }),
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

    // Soft-delete a template (hide from listings)
    deleteTemplateSoft: async (templateId: string) => {
        set({ isLoading: true, error: null });
        try {
            const token = (localStorage.getItem("token") || null);
            const response = await fetch(`${API_BASE_URL}/admin/templates/${templateId}/soft-delete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (!response.ok) throw new Error("Failed to soft-delete template");
            const data = await response.json();
            // remove from local list
            set((state) => ({ templates: state.templates.filter((t) => t._id !== templateId), isLoading: false }));
            return data;
        } catch (error) {
            set({ error: error instanceof Error ? error.message : String(error), isLoading: false });
            throw error;
        }
    },

    // Permanently delete from PostcardMania and DB
    deleteTemplateExternal: async (templateId: string) => {
        set({ isLoading: true, error: null });
        try {
            const token = (localStorage.getItem("token") || null);
            const response = await fetch(`${API_BASE_URL}/admin/templates/${templateId}/delete-external`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (!response.ok) throw new Error("Failed to delete template externally");
            const data = await response.json();
            // remove from local list
            set((state) => ({ templates: state.templates.filter((t) => t._id !== templateId), isLoading: false }));
            return data;
        } catch (error) {
            set({ error: error instanceof Error ? error.message : String(error), isLoading: false });
            throw error;
        }
    },

    // Prices
    fetchPrices: async (type: string = "postcard") => {
        set({ isLoading: true, error: null });
        try {
            const token = (localStorage.getItem("token") || null);
            const response = await fetch(`${API_BASE_URL}/admin/prices?type=${encodeURIComponent(type)}`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (!response.ok) throw new Error("Failed to fetch prices");
            const data = await response.json();
            set({ isLoading: false });
            return data;
        } catch (error) {
            set({ error: error instanceof Error ? error.message : String(error), isLoading: false });
            throw error;
        }
    },

    updatePrices: async (type: string, payload: { pricing: any[] }) => {
        set({ isLoading: true, error: null });
        try {
            const token = (localStorage.getItem("token") || null);
            const response = await fetch(`${API_BASE_URL}/admin/prices?type=${encodeURIComponent(type)}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error("Failed to update prices");
            const data = await response.json();
            set({ isLoading: false });
            return data;
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
            localStorage.removeItem("token")
            set({
                error: error instanceof Error ? error.message : "Unknown error",
                isLoading: false,
            });
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
    setTemplateType: async (templateId: string, type: string) => {
        set({ isLoading: true, error: null });
        try {
            const token = (localStorage.getItem("token") || null);
            const response = await fetch(`${API_BASE_URL}/templates/${templateId}/type`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ type }),
            });
            if (!response.ok) throw new Error("Failed to set template type");
            const updated = await response.json();
            set((state) => ({ templates: state.templates.map((t) => (t._id === templateId ? updated : t)), isLoading: false }));
            return updated;
        } catch (error) {
            set({ error: error instanceof Error ? error.message : String(error), isLoading: false });
            throw error;
        }
    },
}));
