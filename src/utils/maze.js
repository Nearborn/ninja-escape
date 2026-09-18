import { mulberry32, shuffle } from './random.js'

const DIRS = [
  { dx: 0, dz: -1, a: 'n', b: 's' },
  { dx: 1, dz: 0, a: 'e', b: 'w' },
  { dx: 0, dz: 1, a: 's', b: 'n' },
  { dx: -1, dz: 0, a: 'w', b: 'e' }
]

export function generateMaze(width, height, seed) {
  const rand = mulberry32(seed)
  const cells = Array.from({ length: height }, (_, z) =>
    Array.from({ length: width }, (_, x) => ({ x, z, n: true, e: true, s: true, w: true, visited: false }))
  )
  const stack = [cells[0][0]]
  cells[0][0].visited = true

  while (stack.length) {
    const current = stack[stack.length - 1]
    const options = shuffle(DIRS, rand).filter(({ dx, dz }) => {
      const nx = current.x + dx
      const nz = current.z + dz
      return nx >= 0 && nz >= 0 && nx < width && nz < height && !cells[nz][nx].visited
    })
    if (!options.length) {
      stack.pop()
      continue
    }
    const d = options[0]
    const next = cells[current.z + d.dz][current.x + d.dx]
    current[d.a] = false
    next[d.b] = false
    next.visited = true
    stack.push(next)
  }

  for (const row of cells) for (const cell of row) cell.visited = false
  const distances = bfsDistances(cells, 0, 0)
  const sorted = [...distances.entries()].sort((a, b) => b[1] - a[1])
  const exitKey = sorted[0][0]
  const deadEnds = []
  for (const row of cells) {
    for (const c of row) {
      const openings = [c.n, c.e, c.s, c.w].filter(wall => !wall).length
      if (openings === 1 && !(c.x === 0 && c.z === 0)) deadEnds.push(c)
    }
  }
  deadEnds.sort((a, b) => (distances.get(`${b.x},${b.z}`) ?? 0) - (distances.get(`${a.x},${a.z}`) ?? 0))
  const exit = parseKey(exitKey)
  const fragment = deadEnds.find(c => c.x !== exit.x || c.z !== exit.z) || parseKey(sorted[1][0])
  const extras = deadEnds.filter(c => (c.x !== exit.x || c.z !== exit.z) && (c.x !== fragment.x || c.z !== fragment.z))

  return { cells, width, height, exit, fragment, extras, distances }
}

function bfsDistances(cells, sx, sz) {
  const h = cells.length
  const w = cells[0].length
  const queue = [[sx, sz]]
  const dist = new Map([[`${sx},${sz}`, 0]])
  for (let qi = 0; qi < queue.length; qi++) {
    const [x, z] = queue[qi]
    const c = cells[z][x]
    const steps = [
      ['n', x, z - 1], ['e', x + 1, z], ['s', x, z + 1], ['w', x - 1, z]
    ]
    for (const [wall, nx, nz] of steps) {
      if (c[wall]) continue
      if (nx < 0 || nz < 0 || nx >= w || nz >= h) continue
      const key = `${nx},${nz}`
      if (dist.has(key)) continue
      dist.set(key, dist.get(`${x},${z}`) + 1)
      queue.push([nx, nz])
    }
  }
  return dist
}

function parseKey(key) {
  const [x, z] = key.split(',').map(Number)
  return { x, z }
}
