# Three.js PWA Game Starter

A minimal browser-based 3D game scaffold using **Three.js + Vite + vite-plugin-pwa**, ready for **GitHub Pages**.

## 1. Run locally

Install Node.js 22 LTS or newer, then from this folder:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## 2. Put it on GitHub

Create an empty GitHub repository, for example `my-3d-game`, then run:

```bash
git init
git add .
git commit -m "Initial 3D PWA game"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/my-3d-game.git
git push -u origin main
```

## 3. Enable GitHub Pages

On GitHub:

1. Open the repository.
2. Go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Open the **Actions** tab and wait for `Deploy game to GitHub Pages` to finish.
5. Return to **Settings → Pages** and use **Visit site**.

For a repository named `my-3d-game`, the URL will normally be:

`https://YOUR_USERNAME.github.io/my-3d-game/`

The Vite configuration automatically uses the repository name as the GitHub Pages base path.

## 4. PWA installation

The app includes a generated service worker and web-app manifest. On supported browsers, users can install it from the browser's install UI. The demo also exposes an **Install game** button when the browser provides the install prompt.

On iPhone/iPad, installation is generally done from Safari's **Share → Add to Home Screen** UI.

## 5. Replace the demo with the actual game

- `src/main.js`: game/Three.js logic
- `src/style.css`: HUD and touch controls
- `public/`: static assets such as models, textures, audio, level data
- `vite.config.js`: PWA and deployment settings

A scalable next structure is:

```text
src/
  main.js
  game/
    Game.js
    Player.js
    World.js
    Input.js
    Camera.js
  systems/
    Physics.js
    Audio.js
    SaveGame.js
  levels/
  ui/
public/
  models/
  textures/
  audio/
```

For GLB/GLTF assets, place them in `public/models/` and load them using URLs based on `import.meta.env.BASE_URL`, e.g.:

```js
loader.load(`${import.meta.env.BASE_URL}models/robot.glb`, ...)
```

This matters on GitHub Pages because project sites are hosted under `/REPOSITORY_NAME/`, not at the domain root.

## Notes for larger games

GitHub Pages is a static host. It is excellent for single-player/client-side games and prototypes. A backend is required later for authoritative multiplayer, accounts, cloud saves, matchmaking, or private server-side secrets.

The PWA cache in this starter allows individual build assets up to 25 MB. For large games, avoid precaching every high-resolution texture/audio/model; use runtime caching and asset streaming instead.
