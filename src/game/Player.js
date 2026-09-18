import * as THREE from 'three'

export class Player {
  constructor(game) {
    this.game = game
    this.position = new THREE.Vector3(0, 1.7, 8)
    this.spawn = this.position.clone()
    this.yaw = Math.PI
    this.pitch = 0
    this.velocityY = 0
    this.radius = .38
    this.eyeHeight = 1.65
    this.grounded = true
    this.walkTime = 0
    this.lastHazard = 0
  }

  reset(position = new THREE.Vector3(0, 1.7, 8), yaw = Math.PI) {
    this.position.copy(position)
    this.spawn.copy(position)
    this.yaw = yaw
    this.pitch = 0
    this.velocityY = 0
    this.grounded = true
    this.applyCamera()
  }

  respawn(message = 'Ouch! Back to the last safe point.') {
    const now = performance.now()
    if (now - this.lastHazard < 900) return
    this.lastHazard = now
    this.position.copy(this.spawn)
    this.velocityY = 0
    this.game.state.hunger = Math.max(1, this.game.state.hunger - 5)
    this.game.ui.toast(message, 'warn')
    this.game.audio.fail()
    this.game.commitSave()
  }

  update(dt) {
    const input = this.game.input
    const look = input.consumeLook()
    this.yaw -= look.x * .0023
    this.pitch -= look.y * .0021
    this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch))

    if (!this.game.running || this.game.ui.modalOpen()) {
      this.applyCamera()
      return
    }

    const m = input.movement()
    const hunger = this.game.state.hunger
    const speedMul = hunger < 10 ? .68 : hunger < 30 ? .84 : 1
    const speed = 5.1 * speedMul
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw))
    const desired = forward.multiplyScalar(m.y).add(right.multiplyScalar(m.x))
    if (desired.lengthSq() > 1) desired.normalize()
    desired.multiplyScalar(speed * dt)

    const push = this.game.world.environmentForce(this.position)
    desired.x += push.x * dt
    desired.z += push.z * dt

    this.moveAxis('x', desired.x)
    this.moveAxis('z', desired.z)

    if (input.consumeJump() && this.grounded) {
      this.velocityY = 6.6
      this.grounded = false
      this.game.audio.jump()
    }
    this.velocityY -= 17.5 * dt
    this.position.y += this.velocityY * dt
    if (this.position.y <= this.eyeHeight) {
      this.position.y = this.eyeHeight
      this.velocityY = 0
      this.grounded = true
    }

    if (this.position.y < -4) this.respawn('You fell! The ninjas return you to safety.')
    this.game.world.checkHazards(this.position, this)
    if (Math.abs(m.x) + Math.abs(m.y) > .05 && this.grounded) this.walkTime += dt * 10
    this.applyCamera()
  }

  moveAxis(axis, amount) {
    if (!amount) return
    const proposed = this.position.clone()
    proposed[axis] += amount
    if (!this.collides(proposed)) this.position[axis] = proposed[axis]
  }

  collides(pos) {
    const r = this.radius
    for (const box of this.game.world.colliders) {
      if (pos.x + r <= box.min.x || pos.x - r >= box.max.x || pos.z + r <= box.min.z || pos.z - r >= box.max.z) continue
      const feet = pos.y - this.eyeHeight
      const head = pos.y
      if (head <= box.min.y + .05 || feet >= box.max.y - .05) continue
      return true
    }
    return false
  }

  applyCamera() {
    const bob = this.grounded ? Math.sin(this.walkTime) * .018 : 0
    this.game.camera.position.set(this.position.x, this.position.y + bob, this.position.z)
    this.game.camera.rotation.order = 'YXZ'
    this.game.camera.rotation.y = this.yaw
    this.game.camera.rotation.x = this.pitch
  }
}
