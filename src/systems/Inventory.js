import { ITEM_NAMES, RECIPES } from '../data/stages.js'

export class Inventory {
  constructor(game) {
    this.game = game
  }

  get items() { return this.game.state.inventory }

  count(id) { return Number(this.items[id] || 0) }

  add(id, amount = 1, notify = true) {
    this.items[id] = this.count(id) + amount
    if (notify) this.game.ui.toast(`Found ${amount > 1 ? `${amount} × ` : ''}${ITEM_NAMES[id] || id}`, 'good')
    this.game.commitSave()
    this.game.ui.refreshBag()
  }

  has(id, amount = 1) { return this.count(id) >= amount }

  remove(id, amount = 1) {
    if (!this.has(id, amount)) return false
    this.items[id] -= amount
    this.game.commitSave()
    this.game.ui.refreshBag()
    return true
  }

  canCraft(recipe) {
    return Object.entries(recipe.needs).every(([id, n]) => this.has(id, n))
  }

  craft(recipeId) {
    const recipe = RECIPES.find(r => r.id === recipeId)
    if (!recipe || !this.canCraft(recipe)) return false
    for (const [id, n] of Object.entries(recipe.needs)) this.items[id] -= n
    for (const [id, n] of Object.entries(recipe.gives)) this.items[id] = this.count(id) + n
    this.game.ui.toast(`Crafted ${recipe.name}!`, 'good')
    this.game.audio.success()
    this.game.commitSave()
    this.game.ui.refreshBag()
    return true
  }

  eat() {
    if (!this.has('food', 1)) {
      this.game.ui.toast('No food in your backpack.', 'warn')
      return false
    }
    if (this.game.state.hunger >= 98) {
      this.game.ui.toast('You are not hungry yet.', 'warn')
      return false
    }
    this.items.food -= 1
    this.game.state.hunger = Math.min(100, this.game.state.hunger + 38)
    this.game.audio.eat()
    this.game.ui.toast('Yum! Hunger restored.', 'good')
    this.game.commitSave()
    this.game.ui.refreshBag()
    this.game.ui.updateHUD()
    return true
  }
}
