import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

function githubPagesBase() {
  const slug = process.env.GITHUB_REPOSITORY
  if (!slug) return '/'
  const [owner, repo] = slug.split('/')
  if (!owner || !repo || repo.toLowerCase() === `${owner.toLowerCase()}.github.io`) return '/'
  return `/${repo}/`
}

export default defineConfig({
  base: githubPagesBase(),
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/pwa-192.png', 'icons/pwa-512.png'],
      manifest: {
        name: 'Three.js PWA Game',
        short_name: '3D Game',
        description: 'A browser-based 3D game starter built with Three.js.',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'fullscreen',
        orientation: 'landscape',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,glb,gltf,bin,mp3,ogg,wav}']
      }
    })
  ]
})
