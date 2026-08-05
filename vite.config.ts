import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// The UI library is consumed as a local `file:` dependency. To avoid a second
// copy of React (which breaks hooks/context) and the `use-sync-external-store`
// CommonJS shim issue, we dedupe React and pre-bundle the shim while excluding
// the library itself from dependency optimization.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom", "use-sync-external-store"],
  },
  optimizeDeps: {
    exclude: ["@espressif/dashboard-ui-components"],
    include: ["use-sync-external-store", "use-sync-external-store/shim"],
  },
  server: {
    fs: {
      // Allow Vite to read the sibling component library (file: dependency).
      allow: [path.resolve(import.meta.dirname, ".."), path.resolve(import.meta.dirname)],
    },
  },
});
