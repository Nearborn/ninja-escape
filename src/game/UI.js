import { ITEM_NAMES, RECIPES, STAGES } from '../data/stages.js'
import { SaveSystem } from '../systems/SaveSystem.js'

export class UI {
  constructor(game) {
    this.game = game
    this.start = document.getElementById('startScreen')
    this.hud = document.getElementById('hud')
    this.bag = document.getElementById('bagPanel')
    this.pause = document.getElementById('pausePanel')
    this.keypad = document.getElementById('keypadModal')
    this.victory = document.getElementById('victoryScreen')
    this.stageCard = document.getElementById('stageCard')
    this.prompt = document.getElementById('interactionPrompt')
    this.keypadValue = ''
    this.bind()
  }

  bind() {
    const cont = document.getElementById('continueButton')
    cont.hidden = !SaveSystem.hasSave()
    cont.addEventListener('click', () => this.game.start(false))
    document.getElementById('newGameButton').addEventListener('click', () => {
      if (SaveSystem.hasSave() && !confirm('Start over and erase the current Ninja Escape save?')) return
      this.game.start(true)
    })
    document.getElementById('bagButton').addEventListener('click', () => this.toggleBag())
    document.getElementById('pauseButton').addEventListener('click', () => this.togglePause())
    document.querySelector('[data-close="bag"]').addEventListener('click', () => this.closeBag())
    document.getElementById('eatButton').addEventListener('click', () => this.game.inventory.eat())
    document.getElementById('resumeButton').addEventListener('click', () => this.closePause())
    document.getElementById('restartStageButton').addEventListener('click', () => { this.closePause(); this.game.stageManager.reload() })
    document.getElementById('resetSaveButton').addEventListener('click', () => {
      if (!confirm('Erase all Ninja Escape progress?')) return
      SaveSystem.clear(); location.reload()
    })
    document.getElementById('keypadClear').addEventListener('click', () => { this.keypadValue = ''; this.renderKeypad() })
    document.getElementById('keypadClose').addEventListener('click', () => this.closeKeypad())
    document.getElementById('playAgainButton').addEventListener('click', () => { SaveSystem.clear(); location.reload() })

    const grid = document.getElementById('keypadGrid')
    for (let i = 1; i <= 9; i++) grid.appendChild(this.makeKey(String(i)))
    grid.appendChild(this.makeKey('0'))

    let deferredPrompt = null
    const install = document.getElementById('installButton')
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; install.hidden = false })
    install.addEventListener('click', async () => {
      if (!deferredPrompt) return
      deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; install.hidden = true
    })
  }

  makeKey(digit) {
    const b = document.createElement('button'); b.textContent = digit
    b.addEventListener('click', () => {
      if (this.keypadValue.length >= 5) return
      this.keypadValue += digit; this.game.audio.click(); this.renderKeypad()
      if (this.keypadValue.length === 5) setTimeout(() => this.game.stageManager.checkVaultCode(this.keypadValue), 180)
    })
    return b
  }

  showGame() {
    this.start.classList.add('hidden-ui')
    this.hud.classList.remove('hidden-ui')
    this.victory.classList.add('hidden-ui')
  }

  modalOpen() {
    return !this.bag.classList.contains('hidden-ui') || !this.pause.classList.contains('hidden-ui') ||
      !document.getElementById('miniGameModal').classList.contains('hidden-ui') || !this.keypad.classList.contains('hidden-ui') ||
      !this.victory.classList.contains('hidden-ui') || !this.start.classList.contains('hidden-ui')
  }

  updateHUD() {
    const stage = STAGES[this.game.state.stageIndex] || STAGES[0]
    document.getElementById('stageTitle').textContent = `${stage.level}. ${stage.title}`
    document.getElementById('objective').textContent = this.game.stageManager?.objectiveText?.() || stage.subtitle
    const h = Math.max(0, Math.min(100, this.game.state.hunger))
    document.getElementById('hungerFill').style.width = `${h}%`
    document.getElementById('hungerText').textContent = Math.round(h)
    document.getElementById('fragmentDisplay').textContent = this.game.state.fragments.map(v => v ?? '?').join(' ')
  }

  showPrompt(text = '') {
    this.prompt.textContent = text
    this.prompt.classList.toggle('visible', !!text)
    const b = document.getElementById('actionButton')
    if (text) b.textContent = 'ACTION'
  }

  toast(text, kind = '') {
    const el = document.createElement('div'); el.className = `toast ${kind}`; el.textContent = text
    document.getElementById('toastContainer').appendChild(el)
    setTimeout(() => el.remove(), 3100)
  }

  showStageCard(stage) {
    document.getElementById('stageNumber').textContent = stage.type === 'maze' ? `LEVEL ${stage.level} · MAZE` : stage.type === 'final' ? 'FINAL ESCAPE ROOM' : `LEVEL ${stage.level} · ESCAPE ROOM`
    document.getElementById('stageCardTitle').textContent = stage.title
    document.getElementById('stageCardSubtitle').textContent = stage.subtitle
    this.stageCard.classList.remove('hidden-ui')
    this.stageCard.style.animation = 'none'; void this.stageCard.offsetWidth; this.stageCard.style.animation = ''
    setTimeout(() => this.stageCard.classList.add('hidden-ui'), 2600)
  }

  refreshBag() {
    if (!this.game.inventory) return
    const list = document.getElementById('inventoryList'); list.innerHTML = ''
    const order = ['food','stick','string','feather','stone','bow','arrows','spear']
    for (const id of order) {
      const row = document.createElement('div'); row.className = 'inventory-row'
      row.innerHTML = `<span>${ITEM_NAMES[id]}</span><span class="count">× ${this.game.inventory.count(id)}</span>`
      list.appendChild(row)
    }
    const recipes = document.getElementById('recipeList'); recipes.innerHTML = ''
    for (const recipe of RECIPES) {
      const row = document.createElement('div'); row.className = 'recipe-row'
      const needs = Object.entries(recipe.needs).map(([id,n]) => `${n} ${ITEM_NAMES[id]}`).join(' + ')
      const left = document.createElement('div'); left.innerHTML = `<b>${recipe.name}</b><div class="recipe-desc">${needs}<br>${recipe.description}</div>`
      const b = document.createElement('button'); const ready = this.game.inventory.canCraft(recipe); b.textContent = ready ? 'Craft' : 'Need items'; b.disabled = !ready; if (ready) b.classList.add('ready')
      b.addEventListener('click', () => this.game.inventory.craft(recipe.id))
      row.append(left,b); recipes.appendChild(row)
    }
  }

  toggleBag() { if (this.bag.classList.contains('hidden-ui')) this.openBag(); else this.closeBag() }
  openBag() { if (!this.game.running || !document.getElementById('miniGameModal').classList.contains('hidden-ui')) return; this.refreshBag(); this.bag.classList.remove('hidden-ui'); document.exitPointerLock?.() }
  closeBag() { this.bag.classList.add('hidden-ui'); this.game.input?.clear() }
  togglePause() { if (!this.game.running) return; if (this.pause.classList.contains('hidden-ui')) this.openPause(); else this.closePause() }
  openPause() { this.pause.classList.remove('hidden-ui'); document.exitPointerLock?.() }
  closePause() { this.pause.classList.add('hidden-ui'); this.game.input?.clear() }

  openKeypad() { this.keypadValue = ''; this.renderKeypad(); this.keypad.classList.remove('hidden-ui'); document.exitPointerLock?.() }
  closeKeypad() { this.keypad.classList.add('hidden-ui'); this.game.input?.clear() }
  renderKeypad() { document.getElementById('keypadDisplay').textContent = `${this.keypadValue}${'_'.repeat(5-this.keypadValue.length)}`.split('').join(' ') }
  badCode() { this.keypadValue = ''; this.renderKeypad(); this.toast('Wrong code. Read the fragments in the order you found them.', 'warn'); this.game.audio.fail() }

  showVictory() {
    this.closeKeypad(); this.hud.classList.add('hidden-ui'); this.victory.classList.remove('hidden-ui')
    const mins = Math.max(1, Math.round(this.game.state.playSeconds / 60))
    document.getElementById('victoryStats').innerHTML = `Prisoners rescued: <b>${this.game.state.rescued}</b> · Secrets found: <b>${this.game.state.secrets}</b> · Escape time: <b>${mins} min</b>`
  }
}
