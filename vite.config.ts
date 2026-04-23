import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  base: "./",
  server: {
    port: 5173,
    // Proxy Aladin TTB OpenAPI to sidestep CORS when running from the browser.
    // Front-end calls "/aladin-api/ItemSearch.aspx"; Vite forwards to aladin.co.kr.
    proxy: {
      "/aladin-api": {
        target: "https://www.aladin.co.kr",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/aladin-api/, "/ttb/api"),
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
