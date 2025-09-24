import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { deepkitType } from "@deepkit/vite"
import path from 'path'
import fs from 'fs'
import { env } from 'process'

const DB_PREFIX = env.DB_PREFIX;

export default defineConfig({
  publicDir: `public-${DB_PREFIX}`,
  server: {
    open: true,
  },
  plugins: [ 
    react(),
    deepkitType(),
    {
      name: 'rename-index',
      configureServer(server) {
        server.middlewares.use((req, _, next) => {
          if (req.headers.accept?.includes('text/html')) {
            req.url = `/index-${DB_PREFIX}.html`;
          }
          next();
        });
      },
      writeBundle() {
        const oldPath = path.resolve(__dirname, `dist-${DB_PREFIX}/index-${DB_PREFIX}.html`);
        const newPath = path.resolve(__dirname, `dist-${DB_PREFIX}/index.html`);
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
        }
      }
    },
  ],
  build: {
    outDir: `dist-${DB_PREFIX}`,
    rollupOptions: {
      input: `index-${DB_PREFIX}.html`,
    }
  },
  define: {
    'import.meta.env.VITE_DB_PREFIX': `"${DB_PREFIX}"`,
  },
})
