import { create } from "zustand";
import { type Template, type Recipient } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface TemplateStore {
    templates: Template[];
    isLoading: boolean;
    error: string | null;

    fetchTemplates: () => Promise<void>;
    openTemplateEditor: (templateId: string) => Promise<Template>;
    openTemplateSimpleEditor: (templateId: string) => Promise<string>;
    createNewDesign: (payload: { name: string; size: string }) => Promise<{ template: any; url?: string }>;

    generateProofByTemplate: (
        size: string,
        recipient: Recipient,
        format: "pdf" | "jpg",
        templateId?: string,
        front?: string,
        back?: string,
    ) => Promise<{ front: string; back: string }>;

    generateletterProofByTemplate: (
        recipient: Recipient,
        font: string,
        type: string,
        fontColor: string,
        color: boolean,
        templateId?: string,
        front?: string,
    ) => Promise<{ front: string }>;
    fetchTemplatesByType: (type: string) => Promise<void>;
}

export const useTemplateStore = create<TemplateStore>((set) => ({
    templates: [],
    isLoading: false,
    error: null,

    // Fetch all public templates (no token)
    fetchTemplates: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_BASE_URL}/templates/public`);
            if (!response.ok) throw new Error("Failed to fetch templates");
            const templates = await response.json();
            set({ templates, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Unknown error",
                isLoading: false,
            });
        }
    },

    // fetch public templates filtered by type (postcard, letter, brochure, bookmark)
    fetchTemplatesByType: async (type: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_BASE_URL}/templates/public?type=${encodeURIComponent(type)}`);
            if (!response.ok) throw new Error("Failed to fetch templates");
            const templates = await response.json();
            set({ templates, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Unknown error",
                isLoading: false,
            });
        }
    },

    // Open template editor (full)
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

    // Open simple template editor
    openTemplateSimpleEditor: async (templateId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_BASE_URL}/templates/${templateId}/editme`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) throw new Error("Failed to open simple template editor");
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

    // Create new design
    createNewDesign: async (payload) => {
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

            set((state) => ({
                templates: [template, ...state.templates],
                isLoading: false,
            }));

            return { template, url };
        } catch (error) {
            set({ error: error instanceof Error ? error.message : String(error), isLoading: false });
            throw error;
        }
    },

    // Generate postcard/letter proof by template
    generateProofByTemplate: async (
        size,
        recipient,
        format = "pdf",
        templateId,
        front,
        back,
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

    // Generate letter proof
    generateletterProofByTemplate: async (
        recipient,
        font,
        type,
        fontColor,
        color,
        templateId,
        front,
    ) => {
        set({ isLoading: true, error: null });
        try {
            const payload: any = { recipient, color, envelope: { font, type, fontColor } };
            if (templateId) {
                payload.templateId = templateId;
            } else {
                payload.letter = front || null;
            }

            const response = await fetch(`${API_BASE_URL}/templates/proofletter`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("Failed to generate proof");
            const data = await response.json();
            return { front: data.pdf };
        } catch (error) {
            set({ error: error instanceof Error ? error.message : String(error) });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },
}));
