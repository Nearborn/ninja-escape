import * as THREE from 'three'
import { THEMES } from '../data/stages.js'
import { generateMaze } from '../utils/maze.js'

export class World {
  constructor(game) {
    this.game = game
    this.root = new THREE.Group()
    this.game.scene.add(this.root)
    this.colliders = []
    this.interactives = []
    this.hazards = []
    this.pushZones = []
    this.dynamic = []
    this.geometryCache = new Map()
    this.materialCache = new Map()
    this.raycaster = new THREE.Raycaster()
    this.center = new THREE.Vector2(0, 0)
    this.currentInteraction = null
    this.elapsed = 0
  }

  clear() {
    this.root.traverse(obj => {
      if (obj.userData?.disposeTexture) obj.userData.disposeTexture.dispose?.()
      if (obj.userData?.disposeGeometry) obj.geometry?.dispose?.()
      if (obj.userData?.disposeMaterial) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose?.())
        else obj.material?.dispose?.()
      }
    })
    while (this.root.children.length) this.root.remove(this.root.children[0])
    this.colliders.length = 0
    this.interactives.length = 0
    this.hazards.length = 0
    this.pushZones.length = 0
    this.dynamic.length = 0
    this.currentInteraction = null
    this.game.ui.showPrompt('')
  }

  geom(sx, sy, sz) {
    const key = `${sx}|${sy}|${sz}`
    if (!this.geometryCache.has(key)) this.geometryCache.set(key, new THREE.BoxGeometry(sx, sy, sz))
    return this.geometryCache.get(key)
  }

  mat(color, opts = {}) {
    const key = `${color}|${opts.emissive || 0}|${opts.opacity ?? 1}|${opts.transparent ? 1 : 0}`
    if (!this.materialCache.has(key)) {
      this.materialCache.set(key, new THREE.MeshLambertMaterial({
        color,
        emissive: opts.emissive || 0x000000,
        emissiveIntensity: opts.emissive ? .7 : 0,
        transparent: !!opts.transparent,
        opacity: opts.opacity ?? 1
      }))
    }
    return this.materialCache.get(key)
  }

  block(x, y, z, sx, sy, sz, color, options = {}) {
    const mesh = new THREE.Mesh(this.geom(sx, sy, sz), this.mat(color, options))
    mesh.position.set(x, y, z)
    mesh.castShadow = !!options.castShadow
    mesh.receiveShadow = options.receiveShadow !== false
    this.root.add(mesh)
    if (options.collider !== false) this.addCollider(x, y, z, sx, sy, sz)
    return mesh
  }

  addCollider(x, y, z, sx, sy, sz) {
    this.colliders.push({
      min: new THREE.Vector3(x - sx / 2, y - sy / 2, z - sz / 2),
      max: new THREE.Vector3(x + sx / 2, y + sy / 2, z + sz / 2)
    })
  }

  makeLabel(text, color = '#ffffff') {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'rgba(6,10,15,.82)'; ctx.fillRect(0, 0, 512, 128)
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 5; ctx.strokeRect(3, 3, 506, 122)
    ctx.fillStyle = color; ctx.font = 'bold 42px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    const short = text.length > 22 ? `${text.slice(0, 21)}…` : text
    ctx.fillText(short, 256, 64)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }))
    sprite.scale.set(4.2, 1.05, 1)
    sprite.userData.disposeTexture = tex
    sprite.userData.disposeMaterial = true
    return sprite
  }

  interactive(object, label, handler, maxDistance = 3.3) {
    object.userData.interaction = { label, handler, maxDistance }
    this.interactives.push(object)
    return object
  }

  build(stage) {
    this.clear()
    const theme = THEMES[stage.theme]
    this.game.scene.background = new THREE.Color(theme.sky)
    this.game.scene.fog = new THREE.Fog(theme.fog, 18, stage.type === 'maze' ? 58 : 44)
    this.game.hemi.color.set(theme.light)
    this.game.hemi.groundColor.set(theme.floor)
    this.game.hemi.intensity = theme.ambient * 2.0
    this.game.sun.color.set(theme.light)
    this.game.sun.intensity = .75
    if (stage.type === 'maze') this.buildMaze(stage, theme)
    else this.buildRoom(stage, theme)
  }

  buildRoom(stage, t) {
    const size = 28, h = 5
    this.block(0, -.45, 0, size, .9, size, t.floor, { collider: false })
    this.block(0, h / 2, -size / 2, size, h, .7, t.wall)
    this.block(0, h / 2, size / 2, size, h, .7, t.wall)
    this.block(-size / 2, h / 2, 0, .7, h, size, t.wall)
    this.block(size / 2, h / 2, 0, .7, h, size, t.wall)
    // ceiling beams keep the voxel room visually enclosed without a full ceiling.
    for (let x = -11; x <= 11; x += 5.5) this.block(x, 4.65, 0, .35, .35, 27, t.trim, { collider: false })

    stage.tasks.forEach((task, i) => this.makeTaskStation(stage, task, t, i))
    this.makeExitDoor(stage, t)
    this.decorateRoom(stage, t)
    this.updateRoomState(stage, t)
    this.game.player.reset(new THREE.Vector3(0, 1.65, 10), 0)
  }

  makeTaskStation(stage, task, t, index) {
    const [x,,z] = task.station
    const done = this.game.stageManager.taskDone(stage.id, task.id)
    this.block(x, .2, z, 3.4, .4, 3.4, t.trim, { collider: false })
    const pedestal = this.block(x, .75, z, 1.15, 1.5, 1.15, done ? 0x3c9b65 : t.accent, { collider: false, emissive: done ? 0x164c2f : 0x000000 })
    const marker = this.block(x, 1.75, z, .45, .45, .45, done ? 0x72ef9f : 0xf1d15b, { collider: false, emissive: done ? 0x224d31 : 0x5a4312 })
    marker.rotation.y = index * .6
    const label = this.makeLabel(done ? `✓ ${task.title}` : task.title, done ? '#9ff0bd' : '#ffffff')
    label.position.set(x, 2.6, z); this.root.add(label)

    if (task.rescue) this.makePrisoner(x + (x < 0 ? 1.9 : -1.9), 0, z, task.rescue, done)

    this.interactive(pedestal, done ? `${task.title} — complete` : `Start: ${task.title}`, () => {
      if (this.game.stageManager.taskDone(stage.id, task.id)) {
        this.game.ui.toast('You already passed this ninja test.', 'good'); return
      }
      this.game.miniGames.open(task.game, task.title, () => this.game.stageManager.completeTask(stage, task))
    })
  }

  updateRoomState(stage, t) {
    const count = this.game.stageManager.roomTaskCount(stage)
    const flags = this.game.stageManager.flags(stage.id)
    if (stage.type !== 'final' && count >= 3 && !flags.key && !this.root.getObjectByName('room-key')) {
      const key = this.block(0, 1.0, 0, .35, .8, .18, 0xf5d142, { collider: false, emissive: 0x6b5210 })
      key.name = 'room-key'; key.rotation.z = Math.PI / 2
      const label = this.makeLabel('THE KEY!', '#ffe36e'); label.position.set(0, 2.2, 0); label.name = 'room-key-label'; this.root.add(label)
      this.interactive(key, 'Take the escape-room key', () => {
        if (flags.key) return
        flags.key = true; key.visible = false; label.visible = false
        this.game.audio.pickup(); this.game.ui.toast('Escape-room key collected!', 'good'); this.game.commitSave(); this.game.ui.updateHUD()
      })
      if (!flags.keyAnnounced) { flags.keyAnnounced = true; this.game.ui.toast('CLUNK! A key appeared in the middle of the room.', 'good'); this.game.audio.success(); this.game.commitSave() }
    }
  }

  makeExitDoor(stage, t) {
    if (stage.type === 'final') {
      const door = this.block(0, 2.2, -13.55, 6.4, 4.4, .45, 0xb9902b, { collider: false, emissive: 0x332400 })
      this.block(-3.65, 2.2, -13.15, .55, 4.7, 1.2, 0x4b3b13)
      this.block(3.65, 2.2, -13.15, .55, 4.7, 1.2, 0x4b3b13)
      const label = this.makeLabel('FINAL VAULT', '#ffe06a'); label.position.set(0, 4.8, -13.1); this.root.add(label)
      this.interactive(door, 'Open the final vault keypad', () => {
        if (this.game.stageManager.roomTaskCount(stage) < 3) { this.game.ui.toast('The keypad is locked. Complete at least three tests.', 'warn'); return }
        if (this.game.state.fragments.some(v => !v)) { this.game.ui.toast('The vault needs all five code fragments.', 'warn'); return }
        this.game.ui.openKeypad()
      }, 4)
      return
    }
    const door = this.block(0, 1.7, -13.55, 3.5, 3.4, .4, t.trim, { collider: false })
    const label = this.makeLabel('EXIT', '#ffe06a'); label.position.set(0, 4.0, -13.1); this.root.add(label)
    this.interactive(door, 'Try the escape-room door', () => {
      const count = this.game.stageManager.roomTaskCount(stage)
      const flags = this.game.stageManager.flags(stage.id)
      if (count < 3) { this.game.ui.toast(`The lock has ${3-count} test seal${3-count===1?'':'s'} left.`, 'warn'); return }
      if (!flags.key) { this.game.ui.toast('The door is ready, but you still need the key.', 'warn'); return }
      this.game.stageManager.nextStage()
    }, 4)
  }

  makePrisoner(x, y, z, predicament, freed) {
    const g = new THREE.Group(); g.position.set(x, y, z)
    const skin = this.mat(0xe3b386), shirt = this.mat(0x3d6ca8), dark = this.mat(0x313840)
    const part = (px,py,pz,sx,sy,sz,m) => { const mesh = new THREE.Mesh(this.geom(sx,sy,sz),m);mesh.position.set(px,py,pz);g.add(mesh);return mesh }
    part(0,1.75,0,.65,.65,.65,skin); part(0,1.0,0,.8,.9,.45,shirt); part(-.48,1.05,0,.22,.85,.22,skin); part(.48,1.05,0,.22,.85,.22,skin);part(-.22,.35,0,.25,.8,.25,dark);part(.22,.35,0,.25,.8,.25,dark)
    if (!freed) {
      const c = predicament === 'glue' ? 0xd8cf75 : predicament === 'ice' ? 0xa9eaff : 0xe5e5df
      part(0,.45,.05,1.25,.16,.75,this.mat(c,{transparent:true,opacity:predicament==='ice'?.65:1}))
      part(0,1.05,.3,1.25,.12,.12,this.mat(c))
    }
    this.root.add(g)
  }

  decorateRoom(stage, t) {
    // Four corner lights.
    for (const [x,z] of [[-11,-11],[11,-11],[-11,11],[11,11]]) {
      const glow=this.block(x,2.4,z,.35,.8,.35,t.accent,{collider:false,emissive:t.accent})
      glow.scale.y=.6
      const light=new THREE.PointLight(t.light, stage.theme==='hot'?1.6:.9, 10, 2);light.position.set(x,2.5,z);this.root.add(light)
    }
    if (stage.theme === 'dungeon') {
      this.makeSkeleton(-11, -2); this.makeSkeleton(11, 3)
      // wet bed
      this.block(5,.22,10,4,.45,2.2,0x4a3d34,{collider:false}); this.block(5,.48,10,3.8,.16,2,0x51616c,{collider:false,transparent:true,opacity:.8})
      this.makeWeb(-12.7, 2.8, -8); this.makeWeb(12.7, 2.8, 8)
    } else if (stage.theme === 'cold') {
      for(let x=-11;x<=11;x+=3.5) this.block(x,.3,-12.9,.5,.9,.6,0xc8f5ff,{collider:false,transparent:true,opacity:.72})
      this.addWeather('snow', 220)
    } else if (stage.theme === 'hot') {
      this.addLavaPatch(-4,3); this.addLavaPatch(5,-2); this.makeFan(0, -11.8, new THREE.Vector3(0,0,1))
    } else if (stage.theme === 'garden') {
      this.addWeather('rain', 280)
      for(let x=-11;x<=11;x+=3) this.makeFlower(x,-12.7,Math.floor((x+12)%3))
    } else if (stage.theme === 'dragon') {
      this.makeDragon(-7, 6, -11.5, .7); this.makeDragon(7, 7, -11, -.8); this.makePanda(-2.2,-10.5); this.makePanda(2.2,-10.5)
    } else if (stage.theme === 'money') {
      for (const [x,z,r] of [[-10,-12.8,0],[0,-12.8,0],[10,-12.8,0],[-13,0,Math.PI/2],[13,0,-Math.PI/2]]) this.makeMoneyPanel(x,2.4,z,r)
    }
  }

  buildMaze(stage, t) {
    const data = generateMaze(stage.size, stage.size, stage.seed)
    const cell = 4, wallH = 3.4, thick = .42
    const ox = -(data.width - 1) * cell / 2
    const oz = -(data.height - 1) * cell / 2
    const wx = c => ox + c.x * cell
    const wz = c => oz + c.z * cell
    const totalW = data.width * cell + thick
    const totalH = data.height * cell + thick
    this.block(ox + (data.width-1)*cell/2, -.45, oz + (data.height-1)*cell/2, totalW, .9, totalH, t.floor, { collider: false })

    const addWall = (x,z,sx,sz) => this.block(x, wallH/2, z, sx, wallH, sz, t.wall)
    for (let z=0;z<data.height;z++) for(let x=0;x<data.width;x++) {
      const c=data.cells[z][x], cx=ox+x*cell, cz=oz+z*cell
      if(c.n) addWall(cx, cz-cell/2, cell+thick, thick)
      if(c.w) addWall(cx-cell/2, cz, thick, cell+thick)
      if(z===data.height-1&&c.s) addWall(cx,cz+cell/2,cell+thick,thick)
      if(x===data.width-1&&c.e) addWall(cx+cell/2,cz,thick,cell+thick)
    }

    const spawn = new THREE.Vector3(wx({x:0}), 1.65, wz({z:0}))
    this.game.player.reset(spawn, 0)

    this.makeMazePortal(wx(data.exit), wz(data.exit), stage, t)
    if (!this.game.state.fragments[stage.level-1]) this.makeFragment(wx(data.fragment), wz(data.fragment), stage.fragment, stage.level, t)

    const extra = [...data.extras]
    const secretCell = extra.shift() || {x:Math.floor(data.width/2),z:Math.floor(data.height/2)}
    this.makeShadowSecret(wx(secretCell), wz(secretCell), stage)

    const bonusCell = extra.shift()
    if (bonusCell) this.makeBonusStation(wx(bonusCell), wz(bonusCell), stage, t)

    stage.pickups.forEach((item,i)=>{
      const c=extra.shift() || {x:(i*2+2)%data.width,z:(i*3+1)%data.height}
      this.makePickup(wx(c)+(i%2?.8:-.8), wz(c), item, t)
    })
    if (stage.foundTool) {
      const c = extra.shift() || { x: Math.floor(data.width/2), z: Math.floor(data.height/2) }
      this.makePickup(wx(c)-.6, wz(c)+.6, stage.foundTool, t)
    }

    const toolCell = extra.shift()
    if (toolCell) this.makeToolCache(wx(toolCell), wz(toolCell), stage, t)

    // Dangerous shadows inhabit every maze, but are forgiving and only chase nearby players.
    const shadowCells = extra.slice(0, stage.level >= 4 ? 2 : 1)
    if (!shadowCells.length) shadowCells.push({x:Math.floor(data.width/2),z:Math.floor(data.height/2)})
    shadowCells.forEach((c,i)=>this.makeDangerShadow(wx(c),wz(c),i))

    if(stage.theme==='cold') this.addWeather('snow',240)
    if(stage.theme==='garden') {this.addWeather('rain',300); for(let i=0;i<20;i++){const x=ox+(i%data.width)*cell;const z=oz+Math.floor(i/data.width)*cell;this.makeFlower(x+1.1,z+1.1,i%3)}}
    if(stage.theme==='hot') {
      const candidates = extra.slice(2,5)
      candidates.forEach(c=>this.addLavaPatch(wx(c),wz(c)))
      this.makeFan(wx({x:0}), wz({z:0})-1.5, new THREE.Vector3(0,0,-1))
    }
    if(stage.theme==='dragon') {this.makeDragon(ox+cell*2,6,oz-1,.8);this.makeDragon(ox+cell*7,7,oz+cell*(data.height-1)+1,-.7)}
  }

  makeMazePortal(x,z,stage,t) {
    const tower=this.block(x,1.2,z,1.6,2.4,1.6,t.trim,{collider:false})
    const glow=this.block(x,2.7,z,.7,.7,.7,0x7ce0ff,{collider:false,emissive:0x265a6e});glow.rotation.y=.5
    const label=this.makeLabel('NEXT ESCAPE ROOM','#8cecff');label.position.set(x,3.65,z);this.root.add(label)
    this.interactive(tower,'Enter the next escape room',()=>{
      if(!this.game.state.fragments[stage.level-1]){this.game.ui.toast('A code fragment is still hidden in this maze.', 'warn');return}
      this.game.stageManager.nextStage()
    },3.4)
  }

  makeFragment(x,z,digit,level,t) {
    this.block(x,.35,z,1.6,.7,1.6,t.trim,{collider:false})
    const gem=this.block(x,1.35,z,.65,.9,.25,0xffd84f,{collider:false,emissive:0x6b4e00});gem.rotation.z=.2
    const label=this.makeLabel(`CODE FRAGMENT: ${digit}`,'#ffe26a');label.position.set(x,2.6,z);this.root.add(label)
    this.interactive(gem,`Take code fragment ${digit}`,()=>{
      if(this.game.state.fragments[level-1])return
      this.game.state.fragments[level-1]=digit;gem.visible=false;label.visible=false;this.game.audio.success();this.game.ui.toast(`Code fragment ${level}: ${digit}`, 'good');this.game.commitSave();this.game.ui.updateHUD()
    })
  }

  makePickup(x,z,item,t) {
    const colors={food:0xe85050,stick:0x8d633d,string:0xe7e2c9,feather:0xdff6ff,stone:0x757d86,bow:0xa97442,arrows:0xf1e4b8,spear:0x8a99a3}
    const mesh=this.block(x,.65,z,.55,.55,.55,colors[item]||t.accent,{collider:false,emissive:item==='food'?0x471010:0})
    this.dynamic.push({update:(dt,time)=>{mesh.rotation.y+=dt*1.5;mesh.position.y=.65+Math.sin(time*2+z)*.08}})
    this.interactive(mesh,`Pick up ${item}`,()=>{if(!mesh.visible)return;mesh.visible=false;this.game.inventory.add(item,1,false);this.game.audio.pickup();this.game.ui.toast(`Picked up ${item}.`, 'good')})
  }

  makeBonusStation(x,z,stage,t) {
    const flagKey=`bonus:${stage.id}`
    const done=!!this.game.state.completedTasks[flagKey]
    const mesh=this.block(x,.8,z,1.2,1.6,1.2,done?0x487b58:t.accent,{collider:false})
    const label=this.makeLabel(done?'BONUS COMPLETE':stage.bonusTitle, done?'#9ce5b3':'#ffffff');label.position.set(x,2.3,z);this.root.add(label)
    this.interactive(mesh,done?'Bonus test complete':`Bonus: ${stage.bonusTitle}`,()=>{
      if(this.game.state.completedTasks[flagKey]){this.game.ui.toast('You already beat this maze bonus.', 'good');return}
      this.game.miniGames.open(stage.bonusGame,stage.bonusTitle,()=>{this.game.state.completedTasks[flagKey]=true;this.game.inventory.add('food',1,false);mesh.material=this.mat(0x487b58);label.material.color.set(0x9ce5b3);this.game.audio.success();this.game.ui.toast('Bonus won: food added to your bag!', 'good');this.game.commitSave()})
    })
  }

  makeShadowSecret(x,z,stage) {
    const shadow=this.block(x,.025,z,2.2,.05,1.1,0x08090b,{collider:false,transparent:true,opacity:.72})
    shadow.rotation.y=.45
    const flag=this.game.stageManager.flags(stage.id)
    if(flag.shadowSecret) shadow.visible=false
    this.interactive(shadow,'Investigate the impossible shadow',()=>{
      if(flag.shadowSecret)return
      flag.shadowSecret=true;shadow.visible=false;this.game.state.secrets++;this.game.inventory.add(stage.secretReward||'food',1,false);this.game.audio.success();this.game.ui.toast('Secret found! The shadow was hiding a cache.', 'good');if(stage.clue)setTimeout(()=>this.game.ui.toast(`CLUE: ${stage.clue}`, 'good'),500);this.game.commitSave()
    },3.6)
  }

  makeToolCache(x,z,stage,t) {
    const flag=this.game.stageManager.flags(stage.id)
    const cache=this.block(x,.65,z,1.1,1.1,1.1,0x4b3625,{collider:false})
    if(flag.toolCache) cache.visible=false
    this.interactive(cache,'Open the reinforced secret cache',()=>{
      if(flag.toolCache)return
      const inv=this.game.inventory
      let used=''
      if(inv.has('spear')) used='spear'
      else if(inv.has('bow')&&inv.has('arrows')){used='bow';inv.remove('arrows',1)}
      if(!used){this.game.ui.toast('Too tough to open by hand. A spear or bow might help.', 'warn');return}
      flag.toolCache=true;cache.visible=false;this.game.state.secrets++;inv.add('food',2,false);this.game.audio.success();this.game.ui.toast(`${used==='spear'?'Spear':'Arrow'} opened the cache: 2 food!`, 'good');this.game.commitSave()
    })
  }

  makeDangerShadow(x,z,index=0) {
    const g=new THREE.Group();g.position.set(x,0,z)
    const m=this.mat(0x030405,{transparent:true,opacity:.76})
    const body=new THREE.Mesh(this.geom(.75,1.25,.55),m);body.position.y=.95;g.add(body)
    const head=new THREE.Mesh(this.geom(.62,.62,.62),m);head.position.y=1.9;g.add(head)
    const eyeMat=this.mat(0xe84a4a,{emissive:0x7a1010})
    for(const ex of[-.15,.15]){const e=new THREE.Mesh(this.geom(.08,.08,.05),eyeMat);e.position.set(ex,1.95,-.32);g.add(e)}
    this.root.add(g)
    const anchor=new THREE.Vector3(x,0,z)
    this.dynamic.push({update:(dt,time)=>{
      const p=this.game.player.position
      const dx=p.x-g.position.x,dz=p.z-g.position.z,dist=Math.hypot(dx,dz)
      if(dist<8&&dist>.001){const speed=dist<4?1.15:.55;g.position.x+=dx/dist*speed*dt;g.position.z+=dz/dist*speed*dt;g.lookAt(p.x,1.2,p.z)}else{g.position.x=anchor.x+Math.sin(time*.55+index)*1.1;g.position.z=anchor.z+Math.cos(time*.43+index)*1.1}
      if(dist<.72){this.game.audio.shadow();this.game.player.respawn('A living shadow caught you!')}
    }})
  }

  environmentForce(pos) {
    const out=new THREE.Vector3()
    for(const z of this.pushZones) if(pos.x>z.min.x&&pos.x<z.max.x&&pos.z>z.min.z&&pos.z<z.max.z) out.addScaledVector(z.dir,z.strength)
    return out
  }

  checkHazards(pos, player) {
    for(const h of this.hazards) if(pos.x>h.min.x&&pos.x<h.max.x&&pos.z>h.min.z&&pos.z<h.max.z) {player.respawn(h.message);return}
  }

  update(dt) {
    this.elapsed += dt
    for(const d of this.dynamic) d.update?.(dt,this.elapsed)
    if (!this.game.running || this.game.ui.modalOpen()) { this.game.ui.showPrompt(''); return }
    this.raycaster.setFromCamera(this.center,this.game.camera)
    this.raycaster.far=4.2
    const hits=this.raycaster.intersectObjects(this.interactives.filter(o=>o.visible),true)
    let found=null
    for(const hit of hits){let o=hit.object;while(o&&!o.userData.interaction)o=o.parent;if(o?.userData?.interaction&&hit.distance<=o.userData.interaction.maxDistance){found=o.userData.interaction;break}}
    this.currentInteraction=found
    this.game.ui.showPrompt(found?`E / ACTION · ${found.label}`:'')
    if(this.game.input.consumeAction()){if(found){this.game.audio.click();found.handler()}else this.game.ui.toast('Nothing to interact with here.')}
  }

  addLavaPatch(x,z) {
    this.block(x,.02,z,2.1,.08,2.1,0xef5a24,{collider:false,emissive:0x7a1906})
    this.hazards.push({min:new THREE.Vector3(x-1,-5,z-1),max:new THREE.Vector3(x+1,5,z+1),message:'The floor is lava! The ninjas pull you back.'})
  }

  makeFan(x,z,dir) {
    const hub=this.block(x,1.6,z,.45,.45,.45,0x8d684a,{collider:false})
    const blades=new THREE.Group();blades.position.copy(hub.position);this.root.add(blades)
    for(let i=0;i<4;i++){const b=new THREE.Mesh(this.geom(.25,2.2,.12),this.mat(0xd18a55));b.rotation.z=i*Math.PI/2;blades.add(b)}
    this.dynamic.push({update:dt=>{blades.rotation.z+=dt*5.5}})
    this.pushZones.push({min:new THREE.Vector3(x-2,-5,z-4),max:new THREE.Vector3(x+2,5,z+4),dir:dir.clone(),strength:2.2})
  }

  addWeather(kind,count=220) {
    const pos=new Float32Array(count*3)
    for(let i=0;i<count;i++){pos[i*3]=(Math.random()-.5)*36;pos[i*3+1]=Math.random()*9;pos[i*3+2]=(Math.random()-.5)*36}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3))
    const mat=new THREE.PointsMaterial({color:kind==='snow'?0xffffff:0xa9d8ff,size:kind==='snow'?.10:.055,transparent:true,opacity:.75})
    const points=new THREE.Points(geo,mat);points.userData.disposeGeometry=true;points.userData.disposeMaterial=true;this.root.add(points)
    this.dynamic.push({update:dt=>{const a=geo.attributes.position.array;for(let i=0;i<count;i++){a[i*3+1]-=dt*(kind==='snow'?1.1:6);if(a[i*3+1]<.1){a[i*3+1]=8+Math.random()*2;a[i*3]=this.game.player.position.x+(Math.random()-.5)*30;a[i*3+2]=this.game.player.position.z+(Math.random()-.5)*30}}geo.attributes.position.needsUpdate=true}})
  }

  makeWeb(x,y,z) {
    const m=this.mat(0xe7ecef,{transparent:true,opacity:.45});const g=new THREE.Group();g.position.set(x,y,z);this.root.add(g)
    for(let i=-2;i<=2;i++){const a=new THREE.Mesh(this.geom(.035,2.2,.035),m);a.rotation.z=i*.35;g.add(a);const b=new THREE.Mesh(this.geom(2.2,.035,.035),m);b.rotation.z=i*.35;g.add(b)}
  }

  makeSkeleton(x,z) {
    const m=this.mat(0xd9d7c8);const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=Math.random()*Math.PI;this.root.add(g)
    const add=(x,y,z,sx,sy,sz)=>{const mesh=new THREE.Mesh(this.geom(sx,sy,sz),m);mesh.position.set(x,y,z);g.add(mesh)}
    add(0,.25,0,.7,.18,.18);add(0,.65,0,.15,.75,.15);add(0,1.1,0,.45,.45,.35);add(-.35,.55,0,.12,.8,.12);add(.35,.55,0,.12,.8,.12)
  }

  makeFlower(x,z,variant=0) {
    this.block(x,.25,z,.08,.5,.08,0x3d7b3f,{collider:false});this.block(x,.55,z,.28,.28,.18,[0xf4d35e,0xea7fa8,0x8fc8ff][variant%3],{collider:false,emissive:0x161006})
  }

  makePanda(x,z) {
    const g=new THREE.Group();g.position.set(x,0,z);this.root.add(g);const w=this.mat(0xe9ecec),b=this.mat(0x181b1e)
    const part=(x,y,z,sx,sy,sz,m)=>{const p=new THREE.Mesh(this.geom(sx,sy,sz),m);p.position.set(x,y,z);g.add(p)}
    part(0,.8,0,.8,1.1,.55,w);part(0,1.55,0,.75,.75,.65,w);part(-.28,1.7,-.34,.18,.2,.12,b);part(.28,1.7,-.34,.18,.2,.12,b);part(-.42,1.82,0,.25,.25,.25,b);part(.42,1.82,0,.25,.25,.25,b);part(-.5,.8,0,.22,.85,.22,b);part(.5,.8,0,.22,.85,.22,b)
    this.dynamic.push({update:(dt,time)=>{g.rotation.y=Math.sin(time*3+x)*.45;g.position.y=Math.max(0,Math.sin(time*5+x)*.08)}})
  }

  makeDragon(x,y,z,dir=1) {
    const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(.8);this.root.add(g);const m=this.mat(0x4f9a66),dark=this.mat(0x315f41),eye=this.mat(0xffd64a,{emissive:0x5c4600})
    const part=(x,y,z,sx,sy,sz,mat)=>{const p=new THREE.Mesh(this.geom(sx,sy,sz),mat);p.position.set(x,y,z);g.add(p);return p}
    part(0,0,0,2.2,.7,.8,m);part(dir*1.25,.15,0,.8,.65,.65,m);part(dir*1.7,.2,0,.25,.18,.18,eye)
    const w1=part(-.2,.55,.5,1.5,.12,1.3,dark),w2=part(-.2,.55,-.5,1.5,.12,1.3,dark)
    this.dynamic.push({update:(dt,time)=>{g.position.x=x+Math.sin(time*.35+z)*2.2;g.rotation.y=Math.sin(time*.25)*.4;w1.rotation.x=Math.sin(time*3)*.35;w2.rotation.x=-Math.sin(time*3)*.35}})
  }

  makeMoneyPanel(x,y,z,rotation=0) {
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#2f8e49';c.fillRect(0,0,256,128);c.strokeStyle='#d9efc9';c.lineWidth=8;c.strokeRect(8,8,240,112);c.fillStyle='#e7f4d9';c.font='bold 74px serif';c.textAlign='center';c.textBaseline='middle';c.fillText('$',128,66)
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(3.4,1.7),new THREE.MeshBasicMaterial({map:tex}));mesh.userData.disposeTexture=tex;mesh.userData.disposeGeometry=true;mesh.userData.disposeMaterial=true;mesh.position.set(x,y,z);mesh.rotation.y=rotation;this.root.add(mesh)
  }
}
