// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/", // מאפשר ל-Vercel לטעון קבצים מ-root
  build: {
    outDir: "dist", // תיקייה סופית ל-build
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    allowedHosts: [
      "e380b7b9-bbe7-4a76-892f-33849450663d-00-3c1ov27exm1uf.sisko.replit.dev",
    ],
  },
});
