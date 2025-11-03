import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { version } from "../package.json";

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
  },
  plugins: [react()],
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'postcard-databaserus-backend.onrender.com',
      'pc.bookmarkpostcards.com',
    ],
  },
});
