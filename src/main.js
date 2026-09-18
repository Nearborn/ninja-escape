import * as THREE from 'three'
import './style.css'

const container = document.querySelector('#game')
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x87b7e3)
scene.fog = new THREE.Fog(0x87b7e3, 22, 65)

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 150)
camera.position.set(0, 5, 8)

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.setSize(innerWidth, innerHeight)
renderer.shadowMap.enabled = true
container.appendChild(renderer.domElement)

scene.add(new THREE.HemisphereLight(0xdbeafe, 0x1f2937, 1.8))
const sun = new THREE.DirectionalLight(0xffffff, 2.2)
sun.position.set(8, 12, 5)
sun.castShadow = true
scene.add(sun)

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.MeshStandardMaterial({ color: 0x426f45, roughness: 0.95 })
)
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)

const grid = new THREE.GridHelper(80, 80, 0xffffff, 0xffffff)
grid.material.opacity = 0.08
grid.material.transparent = true
scene.add(grid)

const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xffc857, roughness: 0.5 })
)
player.position.y = 0.5
player.castShadow = true
scene.add(player)

const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 })
for (const [x, z, sx, sy, sz] of [
  [-5, -4, 2, 2, 2],
  [4, -8, 2, 4, 2],
  [8, 2, 4, 1, 2],
  [-8, 6, 3, 2, 3],
  [1, 8, 2, 3, 4]
]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), obstacleMaterial)
  mesh.position.set(x, sy / 2, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  scene.add(mesh)
}

const keys = new Set()
const validKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'])

addEventListener('keydown', (event) => {
  if (validKeys.has(event.code)) {
    event.preventDefault()
    keys.add(event.code)
  }
})
addEventListener('keyup', (event) => keys.delete(event.code))
addEventListener('blur', () => keys.clear())

document.querySelectorAll('#touchControls button').forEach((button) => {
  const code = button.dataset.key
  const press = (event) => { event.preventDefault(); keys.add(code) }
  const release = (event) => { event.preventDefault(); keys.delete(code) }
  button.addEventListener('pointerdown', press)
  button.addEventListener('pointerup', release)
  button.addEventListener('pointercancel', release)
  button.addEventListener('pointerleave', release)
})

const clock = new THREE.Clock()
const move = new THREE.Vector3()
const desiredCamera = new THREE.Vector3()

function updatePlayer(dt) {
  move.set(0, 0, 0)
  if (keys.has('KeyW') || keys.has('ArrowUp')) move.z -= 1
  if (keys.has('KeyS') || keys.has('ArrowDown')) move.z += 1
  if (keys.has('KeyA') || keys.has('ArrowLeft')) move.x -= 1
  if (keys.has('KeyD') || keys.has('ArrowRight')) move.x += 1

  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(6 * dt)
    player.position.add(move)
    player.position.x = THREE.MathUtils.clamp(player.position.x, -38, 38)
    player.position.z = THREE.MathUtils.clamp(player.position.z, -38, 38)
    player.rotation.y = Math.atan2(move.x, move.z)
  }

  desiredCamera.set(player.position.x, 5.5, player.position.z + 8.5)
  camera.position.lerp(desiredCamera, 1 - Math.pow(0.001, dt))
  camera.lookAt(player.position.x, 0.8, player.position.z)
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05)
  updatePlayer(dt)
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}
animate()

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})

let installPrompt = null
const installButton = document.querySelector('#installButton')
addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  installPrompt = event
  installButton.hidden = false
})

installButton.addEventListener('click', async () => {
  if (!installPrompt) return
  installPrompt.prompt()
  await installPrompt.userChoice
  installPrompt = null
  installButton.hidden = true
})

addEventListener('appinstalled', () => {
  installButton.hidden = true
  installPrompt = null
})
