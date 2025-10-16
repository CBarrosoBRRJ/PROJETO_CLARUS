import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Porta fixa + proxy /api -> FastAPI (localhost:8000)
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
        // remove o prefixo /api antes de mandar para o backend
        rewrite: (path) => path.replace(/^\/api/, ""),
        // garante que qualquer flag "Secure" indevida não bloqueie o cookie no dev http
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
