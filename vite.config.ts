import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    allowedHosts: true, // מאפשר כל host (כולל ngrok)
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
