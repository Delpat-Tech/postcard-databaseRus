import { create } from "zustand";
import { type Template } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface PublicStore {
    templates: Template[];
    isLoading: boolean;
    error: string | null;
    prices: any[];
    fetchTemplatesByType: (type: string) => Promise<void>;
    fetchPricesByType: (type: string) => Promise<any>;
}

export const usePublicStore = create<PublicStore>((set) => ({
    templates: [],
    isLoading: false,
    error: null,
    prices: [],
    fetchTemplatesByType: async (type: string) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_BASE_URL}/templates/public?type=${encodeURIComponent(type)}`);
            if (!res.ok) throw new Error("Failed to fetch public templates");
            const templates = await res.json();
            set({ templates, isLoading: false });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
        }
    },
    fetchPricesByType: async (type: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/templates/prices?type=${encodeURIComponent(type)}`);
            if (!res.ok) throw new Error("Failed to fetch prices");
            const data = await res.json();
            // store the pricing array in the store for reuse across components
            set({ prices: data?.pricing || [] });
            return data;
        } catch (err) {
            throw err;
        }
    },
}));
