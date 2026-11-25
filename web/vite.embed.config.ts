import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: "src/embed/loader.ts",
      formats: ["iife"],
      name: "MonicaCV",
      fileName: () => "embed.js",
    },
  },
});
