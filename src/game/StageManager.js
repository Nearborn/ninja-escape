import { STAGES } from '../data/stages.js'

export class StageManager {
  constructor(game) { this.game = game }

  get stage() { return STAGES[this.game.state.stageIndex] }

  flags(stageId) {
    if (!this.game.state.stageFlags[stageId]) this.game.state.stageFlags[stageId] = {}
    return this.game.state.stageFlags[stageId]
  }

  taskKey(stageId, taskId) { return `${stageId}:${taskId}` }
  taskDone(stageId, taskId) { return !!this.game.state.completedTasks[this.taskKey(stageId, taskId)] }
  roomTaskCount(stage = this.stage) { return stage.tasks?.filter(t => this.taskDone(stage.id, t.id)).length || 0 }

  load(showCard = true) {
    const stage = this.stage
    if (!stage) return
    this.game.world.build(stage)
    this.game.audio.setTheme(stage.theme)
    this.game.ui.updateHUD()
    if (showCard) this.game.ui.showStageCard(stage)
    this.game.commitSave()
  }

  reload() { this.load(false); this.game.ui.toast('Room restarted. Your completed tests and items are saved.', 'good') }

  completeTask(stage, task) {
    const key = this.taskKey(stage.id, task.id)
    if (this.game.state.completedTasks[key]) return
    this.game.state.completedTasks[key] = true
    if (task.reward) for (const [id, amount] of Object.entries(task.reward)) this.game.inventory.add(id, amount, false)
    if (task.rescue) {
      this.game.state.rescued += 1
      this.game.ui.toast(`Rescued! ${task.title} complete.`, 'good')
    } else this.game.ui.toast(`${task.title} complete!`, 'good')
    this.game.audio.success()
    this.game.commitSave()
    const position = this.game.player.position.clone()
    const yaw = this.game.player.yaw
    this.game.world.build(stage)
    this.game.player.reset(position, yaw)
    this.game.ui.updateHUD()
  }

  nextStage() {
    if (this.game.state.stageIndex >= STAGES.length - 1) return
    this.game.state.stageIndex += 1
    this.game.state.hunger = Math.min(100, this.game.state.hunger + 6)
    this.game.commitSave()
    this.load(true)
  }

  objectiveText() {
    const stage = this.stage
    if (!stage) return ''
    if (stage.type === 'maze') {
      const got = !!this.game.state.fragments[stage.level - 1]
      return got ? `Code fragment ${stage.level} found (${stage.fragment}). Now locate the exit portal. Bonus tests and secrets are optional.` : `Find code fragment ${stage.level}, then reach the exit. Search impossible shadows for secrets.`
    }
    const count = this.roomTaskCount(stage)
    if (stage.type === 'final') {
      if (count < 3) return `Complete at least 3 final tests (${count}/3) to activate the vault keypad.`
      return `Vault keypad active. Your fragments are ${this.game.state.fragments.map(v => v ?? '?').join(' ')}.`
    }
    const flags = this.flags(stage.id)
    if (count < 3) return `Complete at least 3 tests to reveal the key (${count}/3). Explore for food and components.`
    if (!flags.key) return 'Three tests complete. The escape-room key has appeared in the centre.'
    return 'You have the key. Unlock the EXIT door to enter the maze.'
  }

  checkVaultCode(value) {
    const expected = this.game.state.fragments.join('')
    if (value !== expected) { this.game.ui.badCode(); return }
    this.flags(this.stage.id).vaultOpened = true
    this.game.commitSave()
    this.game.audio.success()
    this.game.ui.toast('VAULT UNLOCKED!', 'good')
    setTimeout(() => this.game.win(), 700)
  }
}
