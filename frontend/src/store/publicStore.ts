import { create } from "zustand";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface PublicStore {
    isLoading: boolean;
    error: string | null;
    prices: any[];
    fetchPricesByType: (type: string) => Promise<any>;
}

export const usePublicStore = create<PublicStore>((set) => ({
    templates: [],
    isLoading: false,
    error: null,
    prices: [],

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
