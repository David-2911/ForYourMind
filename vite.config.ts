import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const baseDir = process.cwd();

export default defineConfig({
  plugins: [
    react(),
    // Only include dev-only plugins when not building for production
    ...(process.env.NODE_ENV !== "production"
      ? [
          // Runtime error overlay (optional, dev-only)
          ...(await import("@replit/vite-plugin-runtime-error-modal")
            .then((m) => [m.default()])
            .catch(() => [])),
          // Replit cartographer (only in Replit dev env)
          ...(process.env.REPL_ID !== undefined
            ? [
                await import("@replit/vite-plugin-cartographer").then((m) =>
                  m.cartographer(),
                ),
              ]
            : []),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(baseDir, "client", "src"),
      "@shared": path.resolve(baseDir, "shared"),
      "@assets": path.resolve(baseDir, "attached_assets"),
    },
  },
  root: path.resolve(baseDir, "client"),
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
