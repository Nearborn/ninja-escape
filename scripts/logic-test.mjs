import fs from 'node:fs'
import path from 'node:path'
import { STAGES, RECIPES } from '../src/data/stages.js'
import { generateMaze } from '../src/utils/maze.js'

const fail = msg => { throw new Error(msg) }
const assert = (cond, msg) => { if (!cond) fail(msg) }

assert(STAGES.length === 11, `Expected 11 stages, got ${STAGES.length}`)
assert(new Set(STAGES.map(s => s.id)).size === STAGES.length, 'Stage IDs must be unique')
const expectedTypes = ['room','maze','room','maze','room','maze','room','maze','room','maze','final']
assert(STAGES.every((s,i)=>s.type===expectedTypes[i]), 'Stage order is invalid')
const mazes = STAGES.filter(s=>s.type==='maze')
assert(mazes.length===5, 'Expected 5 mazes')
assert(mazes.map(m=>m.fragment).join('')==='72941', 'Fragment code changed unexpectedly')

for (const stage of STAGES) {
  if (stage.type !== 'maze') {
    assert(stage.tasks?.length >= 3, `${stage.id} needs at least 3 tasks`)
    assert(new Set(stage.tasks.map(t=>t.id)).size===stage.tasks.length, `${stage.id} task IDs not unique`)
  } else {
    const m = generateMaze(stage.size, stage.size, stage.seed)
    assert(m.distances.size === stage.size * stage.size, `${stage.id} maze is not fully connected`)
    assert(m.exit.x !== m.fragment.x || m.exit.z !== m.fragment.z, `${stage.id} exit and fragment overlap`)
    assert(m.distances.get(`${m.exit.x},${m.exit.z}`) > 0, `${stage.id} exit is not reachable`)
  }
}

for (const r of RECIPES) {
  assert(Object.keys(r.needs).length>0, `${r.id} recipe has no ingredients`)
  assert(Object.keys(r.gives).length>0, `${r.id} recipe gives nothing`)
}

const root = path.resolve(new URL('..', import.meta.url).pathname)
const html = fs.readFileSync(path.join(root,'index.html'),'utf8')
const jsFiles = []
const walk = dir => {
  for (const ent of fs.readdirSync(dir,{withFileTypes:true})) {
    const p=path.join(dir,ent.name)
    if(ent.isDirectory()) walk(p)
    else if(p.endsWith('.js')) jsFiles.push(p)
  }
}
walk(path.join(root,'src'))
const referenced = new Set()
for(const file of jsFiles){
  const text=fs.readFileSync(file,'utf8')
  for(const m of text.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)) referenced.add(m[1])
}
const missing=[...referenced].filter(id=>!new RegExp(`id=["']${id}["']`).test(html))
assert(missing.length===0, `Missing DOM IDs: ${missing.join(', ')}`)

console.log(`Ninja Escape logic tests passed: ${STAGES.length} stages, ${mazes.length} mazes, ${referenced.size} DOM bindings.`)
