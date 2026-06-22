import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures paths work correctly when deployed to a subfolder in XAMPP
  server: {
    allowedHosts: ['nesting.pouchen.online'],
  },
})