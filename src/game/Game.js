import * as THREE from 'three'
import { SaveSystem, freshSave } from '../systems/SaveSystem.js'
import { Inventory } from '../systems/Inventory.js'
import { AudioSystem } from '../systems/AudioSystem.js'
import { MiniGameManager } from '../systems/MiniGames.js'
import { Input } from './Input.js'
import { Player } from './Player.js'
import { UI } from './UI.js'
import { StageManager } from './StageManager.js'
import { World } from '../world/World.js'

export class Game {
  constructor(container) {
    this.container = container
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, .08, 100)
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.65))
    this.renderer.setSize(innerWidth, innerHeight)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.container.appendChild(this.renderer.domElement)

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x334455, 1.0)
    this.sun = new THREE.DirectionalLight(0xffffff, .8)
    this.sun.position.set(7, 14, 9)
    this.scene.add(this.hemi, this.sun)

    this.state = freshSave()
    this.running = false
    this.lastTime = performance.now()
    this.saveTimer = 0

    this.audio = new AudioSystem()
    this.ui = new UI(this)
    this.inventory = new Inventory(this)
    this.player = new Player(this)
    this.world = new World(this)
    this.stageManager = new StageManager(this)
    this.miniGames = new MiniGameManager(this)
    this.input = new Input(this)

    window.addEventListener('resize', () => this.resize())
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.commitSave()
      this.lastTime = performance.now()
    })
    window.addEventListener('beforeunload', () => this.commitSave())
    this.resize()
    requestAnimationFrame(t => this.loop(t))
  }

  start(newGame = false) {
    this.audio.ensure()
    this.state = newGame ? freshSave() : SaveSystem.load()
    this.state.stageIndex = Math.max(0, Math.min(10, Number(this.state.stageIndex || 0)))
    this.inventory.game = this
    this.running = true
    this.ui.showGame()
    this.ui.refreshBag()
    this.stageManager.load(true)
    this.lastTime = performance.now()
    this.commitSave()
  }

  commitSave() {
    if (!this.running) return
    SaveSystem.save(this.state)
  }

  resize() {
    this.camera.aspect = innerWidth / innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.65))
    this.renderer.setSize(innerWidth, innerHeight)
  }

  update(dt) {
    if (!this.running) return
    if (!this.ui.modalOpen()) {
      this.state.playSeconds += dt
      this.state.hunger = Math.max(0, this.state.hunger - dt * .055)
      this.saveTimer += dt
      if (this.saveTimer > 8) { this.saveTimer = 0; this.commitSave() }
    }
    this.player.update(dt)
    this.world.update(dt)
    this.ui.updateHUD()
  }

  loop(now) {
    const dt = Math.min(.05, Math.max(0, (now - this.lastTime) / 1000))
    this.lastTime = now
    this.update(dt)
    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame(t => this.loop(t))
  }

  win() {
    this.running = false
    this.audio.stopAmbient()
    this.ui.showVictory()
    SaveSystem.save(this.state)
  }
}
