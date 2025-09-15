import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { deepkitType } from "@deepkit/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), deepkitType()],
})
