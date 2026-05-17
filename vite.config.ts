import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 3000 },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          onnx: ['onnxruntime-web'],
          gsap: ['gsap'],
        },
      },
    },
  },
  assetsInclude: ['**/*.onnx'],
});
