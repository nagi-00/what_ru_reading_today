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
    // Proxy Kakao Book Search to avoid CORS when running in a plain browser.
    // Front-end calls "/kakao-api/v3/search/book"; Vite forwards it to dapi.kakao.com.
    proxy: {
      "/kakao-api": {
        target: "https://dapi.kakao.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/kakao-api/, ""),
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
