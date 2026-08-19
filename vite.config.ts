import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Dedupe React so hooks/context work when the UI library is pre-bundled.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom", "use-sync-external-store"],
  },
  optimizeDeps: {
    include: [
      "@espressif/dashboard-ui-components",
      "@tanstack/react-table",
      "use-sync-external-store",
      "use-sync-external-store/shim",
      "react-hook-form",
    ],
  },
});
