// src/stores/authStore.ts
import { create } from "zustand";
import { API_BASE_URL } from "./types";

interface AuthStore {
    token: string | null;
    isLoading: boolean;
    error: string | null;
    adminLogin: (username: string, password: string) => Promise<void>;
    adminLogout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
    isLoading: false,
    error: null,

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
            set({
                error: err instanceof Error ? err.message : String(err),
                isLoading: false,
            });
            throw err;
        }
    },

    adminLogout: () => {
        localStorage.removeItem("token");
        set({ token: null });
    },
}));
