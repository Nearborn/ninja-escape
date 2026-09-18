export class Input {
  constructor(game) {
    this.game = game
    this.keys = new Set()
    this.move = { x: 0, y: 0 }
    this.jumpQueued = false
    this.actionQueued = false
    this.lookDX = 0
    this.lookDY = 0
    this.isTouch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
    this.joyPointer = null
    this.lookPointer = null
    this.lookLast = null
    this.bind()
  }

  bind() {
    window.addEventListener('keydown', e => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault()
      this.keys.add(e.code)
      if (e.code === 'Space') this.jumpQueued = true
      if (e.code === 'KeyE') this.actionQueued = true
      if (e.code === 'KeyC') this.game.ui.toggleBag()
      if (e.code === 'Escape') this.game.ui.togglePause()
    }, { passive: false })
    window.addEventListener('keyup', e => this.keys.delete(e.code))

    this.game.renderer.domElement.addEventListener('click', () => {
      if (!this.isTouch && this.game.running && !this.game.ui.modalOpen()) {
        this.game.renderer.domElement.requestPointerLock?.()
      }
    })
    document.addEventListener('mousemove', e => {
      if (document.pointerLockElement === this.game.renderer.domElement && this.game.running) {
        this.lookDX += e.movementX
        this.lookDY += e.movementY
      }
    })

    const pad = document.getElementById('movePad')
    const thumb = document.getElementById('moveThumb')
    const updateJoy = e => {
      const r = pad.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      let dx = e.clientX - cx
      let dy = e.clientY - cy
      const max = r.width * .32
      const len = Math.hypot(dx, dy)
      if (len > max) { dx *= max / len; dy *= max / len }
      this.move.x = dx / max
      this.move.y = -dy / max
      thumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`
    }
    const resetJoy = () => {
      this.joyPointer = null
      this.move.x = this.move.y = 0
      thumb.style.transform = 'translate(-50%,-50%)'
    }
    pad.addEventListener('pointerdown', e => { this.joyPointer = e.pointerId; pad.setPointerCapture(e.pointerId); updateJoy(e) })
    pad.addEventListener('pointermove', e => { if (e.pointerId === this.joyPointer) updateJoy(e) })
    pad.addEventListener('pointerup', e => { if (e.pointerId === this.joyPointer) resetJoy() })
    pad.addEventListener('pointercancel', resetJoy)

    document.getElementById('jumpButton').addEventListener('pointerdown', e => { e.preventDefault(); this.jumpQueued = true })
    document.getElementById('actionButton').addEventListener('pointerdown', e => { e.preventDefault(); this.actionQueued = true })

    const canvas = this.game.renderer.domElement
    canvas.addEventListener('pointerdown', e => {
      if (!this.isTouch || this.lookPointer !== null || e.clientX < innerWidth * .32) return
      this.lookPointer = e.pointerId
      this.lookLast = { x: e.clientX, y: e.clientY }
      canvas.setPointerCapture(e.pointerId)
    })
    canvas.addEventListener('pointermove', e => {
      if (e.pointerId !== this.lookPointer || !this.lookLast) return
      this.lookDX += (e.clientX - this.lookLast.x) * 1.2
      this.lookDY += (e.clientY - this.lookLast.y) * 1.2
      this.lookLast = { x: e.clientX, y: e.clientY }
    })
    const endLook = e => { if (e.pointerId === this.lookPointer) { this.lookPointer = null; this.lookLast = null } }
    canvas.addEventListener('pointerup', endLook)
    canvas.addEventListener('pointercancel', endLook)
  }

  movement() {
    let x = this.move.x
    let y = this.move.y
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y += 1
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y -= 1
    const len = Math.hypot(x, y)
    if (len > 1) { x /= len; y /= len }
    return { x, y }
  }

  consumeJump() { const v = this.jumpQueued; this.jumpQueued = false; return v }
  consumeAction() { const v = this.actionQueued; this.actionQueued = false; return v }
  consumeLook() { const out = { x: this.lookDX, y: this.lookDY }; this.lookDX = this.lookDY = 0; return out }
  clear() { this.keys.clear(); this.move.x = this.move.y = 0; this.jumpQueued = this.actionQueued = false }
}
