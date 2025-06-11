import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import path from "path";

export default defineConfig({
  plugins: [solidPlugin()],
  build: {
    rollupOptions: {
      input: {
        handlers: path.resolve(__dirname, "src/handler.ts"),
        ui: path.resolve(__dirname, "src/ui.tsx"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "shared/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        dir: "dist",
        format: "esm",
        exports: "named",
      },
      external: [
        // "@tauri-apps/api/core", // Uncomment if you want to keep Tauri external
        "solid-js",
      ],
      treeshake: {
        moduleSideEffects: true,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
      preserveEntrySignatures: "strict",
    },
    target: "esnext",
    minify: false,
    sourcemap: false,
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: ["solid-js"],
  },
});
