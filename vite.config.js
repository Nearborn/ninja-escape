import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/ninja-escape/',

  plugins: [
    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: 'Ninja Escape',
        short_name: 'Ninja Escape',
        description: 'Ninja Escape 3D browser game',
        start_url: '/ninja-escape/',
        scope: '/ninja-escape/',
        display: 'standalone',
        orientation: 'landscape',
        background_color: '#111111',
        theme_color: '#111111',

        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
