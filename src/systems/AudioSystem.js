export class AudioSystem {
  constructor() {
    this.ctx = null
    this.master = null
    this.ambientNodes = []
    this.enabled = true
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {})
      return
    }
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    this.ctx = new AC()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.22
    this.master.connect(this.ctx.destination)
  }

  tone(freq = 440, duration = .1, type = 'square', gain = .08, slide = 0) {
    if (!this.enabled) return
    this.ensure()
    if (!this.ctx) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, now)
    if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, now + duration)
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(Math.max(.0002, gain), now + .012)
    g.gain.exponentialRampToValueAtTime(.0001, now + duration)
    osc.connect(g).connect(this.master)
    osc.start(now)
    osc.stop(now + duration + .02)
  }

  click() { this.tone(240, .05, 'square', .035, 40) }
  jump() { this.tone(180, .09, 'square', .045, 120) }
  pickup() { this.tone(620, .08, 'square', .05, 170) }
  success() { this.tone(520, .09, 'triangle', .07, 120); setTimeout(() => this.tone(760, .12, 'triangle', .06, 110), 85) }
  fail() { this.tone(180, .18, 'sawtooth', .045, -60) }
  eat() { this.tone(330, .07, 'triangle', .035, 80) }
  shadow() { this.tone(82, .32, 'sawtooth', .05, -15) }

  setTheme(theme) {
    this.stopAmbient()
    this.ensure()
    if (!this.ctx || !this.enabled) return
    const configs = {
      dungeon: [65, 98], cold: [174, 261], hot: [73, 110], garden: [196, 247], dragon: [82, 123], money: [147, 220]
    }
    const freqs = configs[theme] || [110, 165]
    for (const [i, f] of freqs.entries()) {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const filter = this.ctx.createBiquadFilter()
      osc.type = theme === 'garden' ? 'sine' : 'triangle'
      osc.frequency.value = f
      filter.type = 'lowpass'
      filter.frequency.value = theme === 'hot' ? 420 : 650
      gain.gain.value = theme === 'garden' ? .015 : .009
      osc.connect(filter).connect(gain).connect(this.master)
      osc.start()
      this.ambientNodes.push(osc, gain, filter)
      if (i === 1 && theme === 'garden') osc.detune.value = 4
    }
  }

  stopAmbient() {
    for (const n of this.ambientNodes) {
      try { if (typeof n.stop === 'function') n.stop() } catch {}
      try { n.disconnect() } catch {}
    }
    this.ambientNodes.length = 0
  }
}
