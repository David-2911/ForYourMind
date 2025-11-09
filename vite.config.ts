// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(async () => {
  const plugins = [react()];

  // Replit-specific plugins removed - not needed for standalone deployment

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve("client", "src"),
        "@shared": path.resolve("shared"),
        "@assets": path.resolve("attached_assets"),
      },
    },
    root: path.resolve("client"),
    build: { outDir: "dist", emptyOutDir: true },
    server: {
      proxy: { "/api": { target: "http://localhost:5000", changeOrigin: true } },
    },
  };
});
