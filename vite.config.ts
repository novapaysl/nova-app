import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 👈 1. ADDED THIS IMPORT
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/', // 👈 CHANGED THIS FROM './' TO '/'
  plugins: [
    react(),
    tailwindcss(), // 👈 2. ADDED THE PLUGIN HERE
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})