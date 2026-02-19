import { builtinModules } from "node:module";
import { defineConfig } from "vite";

const external = [
  "better-sqlite3",
  "electron",
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
];

export default defineConfig({
  build: {
    rollupOptions: {
      external,
    },
  },
  optimizeDeps: {
    exclude: ["better-sqlite3"],
  },
});
