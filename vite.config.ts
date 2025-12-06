import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), viteSingleFile()],
    build: {
      target: "esnext",
      assetsInlineLimit: 100000000,
      chunkSizeWarningLimit: 100000000,
      cssCodeSplit: false,
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});