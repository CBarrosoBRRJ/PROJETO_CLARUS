import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Porta fixa + proxy /api e /auth -> FastAPI (localhost:8000)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
        // remove /api antes de enviar ao backend
        rewrite: (path) => path.replace(/^\/api/, ""),
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
            const sc = proxyRes.headers["set-cookie"];
            if (Array.isArray(sc)) {
              proxyRes.headers["set-cookie"] = sc.map((v) =>
                v.replace(/;(\s*)secure/ig, "")
              );
            }
          });
        },
      },
      "/auth": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
        // mantém /auth no caminho
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
            const sc = proxyRes.headers["set-cookie"];
            if (Array.isArray(sc)) {
              proxyRes.headers["set-cookie"] = sc.map((v) =>
                v.replace(/;(\s*)secure/ig, "")
              );
            }
          });
        },
      },
    },
  },
});
