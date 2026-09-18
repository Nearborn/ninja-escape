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
      includeAssets: ['icons/ninja-192.png', 'icons/ninja-512.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Ninja Escape',
        short_name: 'Ninja Escape',
        description: 'Escape the ninjas through six voxel escape rooms, five mazes and a final vault.',
        theme_color: '#0d1117',
        background_color: '#0d1117',
        display: 'fullscreen',
        orientation: 'landscape',
        start_url: '.',
        scope: '.',
        categories: ['games'],
        icons: [
          { src: 'icons/ninja-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/ninja-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/ninja-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
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
