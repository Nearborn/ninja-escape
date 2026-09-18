const KEY = 'ninja-escape-save-v1'

export function freshSave() {
  return {
    version: 1,
    stageIndex: 0,
    hunger: 100,
    inventory: { food: 2, stick: 0, string: 0, feather: 0, stone: 0, bow: 0, arrows: 0, spear: 0 },
    fragments: [null, null, null, null, null],
    completedTasks: {},
    stageFlags: {},
    rescued: 0,
    secrets: 0,
    startedAt: Date.now(),
    playSeconds: 0
  }
}

export class SaveSystem {
  static hasSave() {
    try { return !!localStorage.getItem(KEY) } catch { return false }
  }

  static load() {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return freshSave()
      const parsed = JSON.parse(raw)
      if (parsed?.version !== 1) return freshSave()
      const base = freshSave()
      return {
        ...base,
        ...parsed,
        inventory: { ...base.inventory, ...(parsed.inventory || {}) },
        fragments: Array.isArray(parsed.fragments) ? parsed.fragments.slice(0, 5) : base.fragments,
        completedTasks: parsed.completedTasks || {},
        stageFlags: parsed.stageFlags || {}
      }
    } catch {
      return freshSave()
    }
  }

  static save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {}
  }

  static clear() {
    try { localStorage.removeItem(KEY) } catch {}
  }
}
