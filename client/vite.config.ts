import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const config = defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    watch: {
      usePolling: true,
      interval: 200,
    },
  },
  plugins: [
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    viteReact(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
      },
      includeAssets: [
        'favicon/favicon.ico',
        'favicon/favicon.svg',
        'favicon/apple-touch-icon.png',
        'favicon/web-app-manifest-192x192.png',
        'favicon/web-app-manifest-512x512.png',
        'icons/paw.png',
      ],
      manifest: {
        name: 'Pawmed AI | Veterinary Diagnostics',
        short_name: 'Pawmed AI',
        description:
          'AI-assisted veterinary diagnostics for faster, clearer clinical decisions.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        icons: [
          {
            src: '/favicon/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/favicon/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],
})

export default config
