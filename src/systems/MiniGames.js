import { shuffle } from '../utils/random.js'

export class MiniGameManager {
  constructor(game) {
    this.game = game
    this.modal = document.getElementById('miniGameModal')
    this.title = document.getElementById('miniGameTitle')
    this.instructions = document.getElementById('miniGameInstructions')
    this.content = document.getElementById('miniGameContent')
    this.status = document.getElementById('miniGameStatus')
    this.cleanupFns = []
    this.finished = false
    document.getElementById('miniGameClose').addEventListener('click', () => this.close())
  }

  open(type, title, onWin) {
    this.close(false)
    this.finished = false
    this.onWin = onWin
    this.title.textContent = title
    this.status.textContent = ''
    this.content.innerHTML = ''
    this.modal.classList.remove('hidden-ui')
    this.game.input.clear()
    const fn = this[`game_${type}`] || this.game_memory
    fn.call(this)
  }

  addCleanup(fn) { this.cleanupFns.push(fn) }

  close(showToast = true) {
    while (this.cleanupFns.length) {
      try { this.cleanupFns.pop()() } catch {}
    }
    this.modal.classList.add('hidden-ui')
    this.content.innerHTML = ''
    if (showToast && !this.finished && this.game.running) this.game.ui.toast('Test paused. You can try again.', 'warn')
  }

  win(message = 'Test complete!') {
    if (this.finished) return
    this.finished = true
    this.status.textContent = message
    this.game.audio.success()
    const cb = this.onWin
    setTimeout(() => {
      this.close(false)
      cb?.()
    }, 700)
  }

  fail(message = 'Not quite — try again!') {
    if (this.finished) return
    this.status.textContent = message
    this.game.audio.fail()
  }

  button(text, cls = 'mg-button') {
    const b = document.createElement('button')
    b.className = cls
    b.textContent = text
    return b
  }

  game_memory() {
    this.instructions.textContent = 'Match all six pairs of ninja symbols.'
    const symbols = shuffle(['◆','●','▲','✦','☯','♣','◆','●','▲','✦','☯','♣'])
    const grid = document.createElement('div')
    grid.className = 'memory-grid'
    let open = []
    let matched = 0
    let locked = false
    symbols.forEach((symbol, index) => {
      const card = document.createElement('button')
      card.className = 'memory-card'
      card.textContent = '?'
      card.addEventListener('click', () => {
        if (locked || card.classList.contains('matched') || open.some(v => v.index === index)) return
        this.game.audio.click()
        card.textContent = symbol
        card.classList.add('flipped')
        open.push({ index, symbol, card })
        if (open.length === 2) {
          locked = true
          if (open[0].symbol === open[1].symbol) {
            open.forEach(v => v.card.classList.add('matched'))
            matched += 2
            open = []
            locked = false
            if (matched === symbols.length) this.win('Every pair matched!')
          } else {
            setTimeout(() => {
              open.forEach(v => { v.card.textContent = '?'; v.card.classList.remove('flipped') })
              open = []
              locked = false
            }, 550)
          }
        }
      })
      grid.appendChild(card)
    })
    this.content.appendChild(grid)
  }

  game_whack() {
    this.instructions.textContent = 'Tap 8 targets before the ninja timer runs out.'
    const wrap = document.createElement('div')
    wrap.className = 'whack-grid'
    const holes = []
    let active = -1
    let hits = 0
    let remaining = 12
    for (let i = 0; i < 9; i++) {
      const h = document.createElement('button')
      h.className = 'whack-hole'
      h.textContent = '•'
      h.addEventListener('click', () => {
        if (i !== active) return
        hits++
        h.classList.remove('active')
        h.textContent = '•'
        active = -1
        this.game.audio.click()
        this.status.textContent = `${hits}/8 hits · ${remaining}s`
        if (hits >= 8) this.win('Fast hands!')
      })
      holes.push(h); wrap.appendChild(h)
    }
    this.content.appendChild(wrap)
    const pop = setInterval(() => {
      if (this.finished) return
      if (active >= 0) { holes[active].classList.remove('active'); holes[active].textContent = '•' }
      active = Math.floor(Math.random() * holes.length)
      holes[active].classList.add('active')
      holes[active].textContent = Math.random() < .25 ? '🕷' : '●'
    }, 620)
    const timer = setInterval(() => {
      remaining--
      this.status.textContent = `${hits}/8 hits · ${remaining}s`
      if (remaining <= 0 && hits < 8) { clearInterval(timer); clearInterval(pop); this.fail('The targets escaped. Close and try again!') }
    }, 1000)
    this.addCleanup(() => { clearInterval(pop); clearInterval(timer) })
    this.status.textContent = '0/8 hits · 12s'
  }

  game_race() {
    this.instructions.textContent = 'Tap the boost button quickly enough to fill the meter before time runs out.'
    const wrap = document.createElement('div'); wrap.className = 'mg-center'
    const meter = document.createElement('div'); meter.className = 'race-meter'
    const fill = document.createElement('div'); fill.className = 'race-fill'; meter.appendChild(fill)
    const tap = this.button('BOOST!', 'mg-button mg-primary')
    tap.style.fontSize = '1.25rem'; tap.style.padding = '18px 34px'
    let score = 0, remaining = 7
    tap.addEventListener('click', () => {
      score = Math.min(24, score + 1)
      fill.style.width = `${score / 24 * 100}%`
      this.game.audio.click()
      if (score >= 24) this.win('Timer filled!')
    })
    wrap.append(meter, tap); this.content.appendChild(wrap)
    const t = setInterval(() => {
      remaining--
      this.status.textContent = `${remaining}s remaining`
      if (remaining <= 0 && score < 24) { clearInterval(t); tap.disabled = true; this.fail('Too slow! Close and try again.') }
    }, 1000)
    this.addCleanup(() => clearInterval(t))
    this.status.textContent = `${remaining}s remaining`
  }

  game_stack() {
    this.instructions.textContent = 'Tap DROP to stack six moving blocks. Unsupported pieces are chopped away.'
    const area = document.createElement('div'); area.className = 'stack-area'
    const base = document.createElement('div'); base.className = 'stack-base'; area.appendChild(base)
    const controls = document.createElement('div'); controls.className = 'mg-center'; controls.style.minHeight = '70px'
    const drop = this.button('DROP', 'mg-button mg-primary'); controls.appendChild(drop)
    this.content.append(area, controls)
    let level = 0, dir = 1, x = 5, width = 48, prevX = 26, prevWidth = 48, raf = 0, last = performance.now()
    let block = null
    const makeBlock = () => {
      block = document.createElement('div'); block.className = 'stack-block'; area.appendChild(block)
      x = dir > 0 ? 3 : 97 - width
      block.style.width = `${width}%`; block.style.left = `${x}%`; block.style.bottom = `${32 + level * 27}px`
    }
    makeBlock()
    const animate = now => {
      const dt = Math.min(.05, (now - last) / 1000); last = now
      x += dir * (26 + level * 3) * dt
      if (x <= 0) { x = 0; dir = 1 }
      if (x + width >= 100) { x = 100 - width; dir = -1 }
      if (block) block.style.left = `${x}%`
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    this.addCleanup(() => cancelAnimationFrame(raf))
    drop.addEventListener('click', () => {
      const left = Math.max(x, prevX), right = Math.min(x + width, prevX + prevWidth)
      const overlap = right - left
      if (overlap <= 4) { drop.disabled = true; this.fail('The tower fell! Close and try again.'); return }
      x = left; width = overlap
      block.style.left = `${x}%`; block.style.width = `${width}%`
      prevX = x; prevWidth = width; level++; dir *= -1
      this.game.audio.click()
      if (level >= 6) { cancelAnimationFrame(raf); drop.disabled = true; this.win('Tower complete!'); return }
      makeBlock()
      this.status.textContent = `${level}/6 blocks stacked`
    })
    this.status.textContent = '0/6 blocks stacked'
  }

  game_drop() {
    this.instructions.textContent = 'The bucket moves by itself. Time six drops and land at least three balls inside.'
    const area = document.createElement('div'); area.className = 'drop-area'
    const bucket = document.createElement('div'); bucket.className = 'drop-bucket'; area.appendChild(bucket)
    const controls = document.createElement('div'); controls.className = 'mg-center'; controls.style.minHeight = '68px'
    const drop = this.button('DROP BALL', 'mg-button mg-primary'); controls.appendChild(drop)
    this.content.append(area, controls)
    let bucketX = 10, dir = 1, shots = 0, catches = 0, raf = 0, last = performance.now(), falling = false
    const animate = now => {
      const dt = Math.min(.05, (now - last) / 1000); last = now
      bucketX += dir * 32 * dt
      if (bucketX < 2) { bucketX = 2; dir = 1 }
      if (bucketX > 78) { bucketX = 78; dir = -1 }
      bucket.style.left = `${bucketX}%`
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate); this.addCleanup(() => cancelAnimationFrame(raf))
    const shoot = () => {
      if (falling || shots >= 6) return
      shots++; falling = true
      const ball = document.createElement('div'); ball.className = 'drop-ball'; ball.style.left = '48%'; ball.style.top = '5px'; area.appendChild(ball)
      let y = 5, t0 = performance.now()
      const fall = now => {
        const dt = Math.min(.05, (now - t0) / 1000); t0 = now; y += 150 * dt; ball.style.top = `${y}px`
        if (y < area.clientHeight - 55) { requestAnimationFrame(fall); return }
        const ballCenter = area.clientWidth * .48 + 12
        const bLeft = area.clientWidth * bucketX / 100
        if (ballCenter > bLeft && ballCenter < bLeft + 86) { catches++; this.game.audio.pickup() }
        ball.remove(); falling = false
        this.status.textContent = `${catches} caught · ${shots}/6 drops`
        if (shots >= 6) {
          drop.disabled = true
          if (catches >= 3) this.win(`${catches} perfect catches!`)
          else this.fail(`Only ${catches} caught. Close and try again.`)
        }
      }
      requestAnimationFrame(fall)
    }
    drop.addEventListener('click', shoot)
    this.status.textContent = '0 caught · 0/6 drops'
  }

  game_sokoban() {
    this.instructions.textContent = 'Push the two stone blocks onto the gold target squares. You can push, but not pull.'
    const W = 6, H = 6
    const walls = new Set(['0,0','1,0','2,0','3,0','4,0','5,0','0,1','5,1','0,2','5,2','0,3','5,3','0,4','5,4','0,5','1,5','2,5','3,5','4,5','5,5','3,2'])
    const goals = new Set(['4,1','4,4'])
    const boxes = [{x:2,y:2},{x:2,y:4}]
    const player = {x:1,y:3}
    const host = document.createElement('div')
    const grid = document.createElement('div'); grid.className = 'sokoban'
    const controls = document.createElement('div'); controls.className = 'soko-controls'
    const dirs = [['▲',0,-1],['◀',-1,0],['▼',0,1],['▶',1,0]]
    const key = (x,y) => `${x},${y}`
    const boxAt = (x,y) => boxes.findIndex(b => b.x===x && b.y===y)
    const render = () => {
      grid.innerHTML = ''
      for (let y=0;y<H;y++) for(let x=0;x<W;x++) {
        const c=document.createElement('div'); c.className='soko-cell'
        if(walls.has(key(x,y))) c.classList.add('soko-wall')
        if(goals.has(key(x,y))) c.classList.add('soko-goal')
        if(boxAt(x,y)>=0) c.textContent='■'
        if(player.x===x&&player.y===y)c.textContent='🥷'
        grid.appendChild(c)
      }
      if (boxes.every(b => goals.has(key(b.x,b.y)))) this.win('Path cleared!')
    }
    const move = (dx,dy) => {
      const nx=player.x+dx, ny=player.y+dy
      if(walls.has(key(nx,ny))) return
      const bi=boxAt(nx,ny)
      if(bi>=0){const bx=nx+dx, by=ny+dy;if(walls.has(key(bx,by))||boxAt(bx,by)>=0)return;boxes[bi].x=bx;boxes[bi].y=by}
      player.x=nx;player.y=ny;this.game.audio.click();render()
    }
    dirs.forEach(([label,dx,dy])=>{const b=this.button(label);b.addEventListener('click',()=>move(dx,dy));controls.appendChild(b)})
    host.append(grid,controls);this.content.appendChild(host);render()
  }

  game_bridge() {
    this.instructions.textContent = 'Place up to seven planks to make a connected path from START to EXIT. The rock blocks the direct route.'
    const size=5, rock='2,2', start='0,2', goal='4,2', on=new Set([start,goal])
    let planks=0
    const grid=document.createElement('div');grid.className='bridge-grid'
    const key=(x,y)=>`${x},${y}`
    const cells=[]
    const connected=()=>{
      const q=[[0,2]], seen=new Set([start])
      for(let i=0;i<q.length;i++){const [x,y]=q[i];if(key(x,y)===goal)return true;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(nx<0||ny<0||nx>=size||ny>=size||seen.has(k)||!on.has(k))continue;seen.add(k);q.push([nx,ny])}}
      return false
    }
    const render=()=>cells.forEach(({el,x,y})=>{const k=key(x,y);el.className='bridge-tile'+(on.has(k)?' on':'');el.textContent=k===start?'S':k===goal?'E':k===rock?'⬟':on.has(k)?'═':'·'})
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){const el=document.createElement('button');cells.push({el,x,y});el.addEventListener('click',()=>{const k=key(x,y);if([rock,start,goal].includes(k))return;if(on.has(k)){on.delete(k);planks--}else{if(planks>=7){this.status.textContent='Only seven planks!';return}on.add(k);planks++}render();this.status.textContent=`${planks}/7 planks used`;if(connected())this.win('Bridge connected!')});grid.appendChild(el)}
    this.content.appendChild(grid);render();this.status.textContent='0/7 planks used'
  }

  game_monty() {
    this.instructions.textContent = 'One door hides the key. Pick a door. A ninja will reveal an empty door; then choose whether to stay or switch.'
    const wrap=document.createElement('div');wrap.className='mg-center'
    const doors=document.createElement('div');doors.className='monty-doors';wrap.appendChild(doors);this.content.appendChild(wrap)
    const prize=Math.floor(Math.random()*3);let first=null,revealed=null,phase=0
    const btns=[]
    const render=()=>btns.forEach((b,i)=>{b.textContent=i===revealed?'🐐':(phase===2&&i===prize?'🔑':'🚪');b.disabled=(phase===1&&i===revealed)})
    for(let i=0;i<3;i++){const b=document.createElement('button');b.className='monty-door';b.textContent='🚪';b.addEventListener('click',()=>{
      if(phase===0){first=i;const candidates=[0,1,2].filter(j=>j!==first&&j!==prize);revealed=candidates[Math.floor(Math.random()*candidates.length)];phase=1;this.status.textContent=`Door ${revealed+1} is empty. Stay with ${first+1}, or switch?`;render();return}
      if(phase===1&&i!==revealed){phase=2;render();if(i===prize)this.win('You found the key!');else this.fail('That door was empty. Close and try again!')}
    });btns.push(b);doors.appendChild(b)}
    render();this.status.textContent='Choose your first door.'
  }

  game_dance() {
    this.instructions.textContent = 'Watch the five-step pattern, then copy it on the direction pad.'
    const dirs=['up','left','down','right'];const glyph={up:'▲',left:'◀',down:'▼',right:'▶'}
    const seq=Array.from({length:5},()=>dirs[Math.floor(Math.random()*dirs.length)])
    const host=document.createElement('div');host.className='mg-center';host.style.flexDirection='column'
    const display=document.createElement('div');display.style.fontSize='3rem';display.style.minHeight='60px'
    const pad=document.createElement('div');pad.className='dance-pad';pad.style.opacity='.45';pad.style.pointerEvents='none'
    host.append(display,pad);this.content.appendChild(host)
    let pos=0, accepting=false
    dirs.forEach(d=>{const b=this.button(glyph[d]);b.classList.add(d);b.addEventListener('click',()=>{if(!accepting)return;if(d!==seq[pos]){accepting=false;this.fail('Wrong move! Close and try again.');pad.style.pointerEvents='none';return}pos++;this.game.audio.click();this.status.textContent=`${pos}/5 moves`;if(pos===seq.length)this.win('Perfect ninja dance!')});pad.appendChild(b)})
    let i=0
    const t=setInterval(()=>{if(i<seq.length){display.textContent=glyph[seq[i++]];this.game.audio.tone(360+i*40,.08,'square',.03)}else{clearInterval(t);display.textContent='YOUR TURN';accepting=true;pad.style.opacity='1';pad.style.pointerEvents='auto';this.status.textContent='0/5 moves'}} ,650)
    this.addCleanup(()=>clearInterval(t));this.status.textContent='Watch carefully…'
  }

  game_catch() {
    this.instructions.textContent = 'Move the basket by dragging across the play area. Catch seven falling items.'
    const area=document.createElement('div');area.className='catch-area'
    const basket=document.createElement('div');basket.className='catch-basket';area.appendChild(basket);this.content.appendChild(area)
    let x=.45, caught=0, missed=0, running=true
    const setX=clientX=>{const r=area.getBoundingClientRect();x=Math.max(0,Math.min(.84,(clientX-r.left-43)/r.width));basket.style.left=`${x*100}%`}
    area.addEventListener('pointerdown',e=>{area.setPointerCapture(e.pointerId);setX(e.clientX)})
    area.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch')setX(e.clientX)})
    setX(area.getBoundingClientRect().left+area.clientWidth/2)
    const spawn=()=>{
      if(!running||this.finished)return
      const el=document.createElement('div');el.className='fall-item';el.textContent=Math.random()<.5?'':' ';el.style.background=Math.random()<.5?'#f1d05a':'#9fe3ff'
      let ix=.03+Math.random()*.9,y=-25,last=performance.now();el.style.left=`${ix*100}%`;area.appendChild(el)
      const fall=now=>{if(!running){el.remove();return}const dt=Math.min(.05,(now-last)/1000);last=now;y+=120*dt;el.style.top=`${y}px`;if(y<area.clientHeight-48){requestAnimationFrame(fall);return}const bx=x, bw=86/area.clientWidth;if(ix>bx-.03&&ix<bx+bw){caught++;this.game.audio.pickup()}else missed++;el.remove();this.status.textContent=`${caught}/7 caught · ${missed} missed`;if(caught>=7){running=false;this.win('Great catch!')}}
      requestAnimationFrame(fall)
    }
    const sp=setInterval(spawn,620);this.addCleanup(()=>{running=false;clearInterval(sp)});this.status.textContent='0/7 caught'
  }

  game_parkour() {
    this.instructions.textContent = 'Tap JUMP to clear ten incoming blocks. Some are close together — keep your rhythm.'
    const area=document.createElement('div');area.className='drop-area';area.style.background='linear-gradient(#6d8291,#283640)'
    const ground=document.createElement('div');ground.style.cssText='position:absolute;left:0;right:0;bottom:34px;height:6px;background:#91a06b';area.appendChild(ground)
    const player=document.createElement('div');player.style.cssText='position:absolute;width:30px;height:42px;left:55px;bottom:40px;background:#1b1f25;border:4px solid #d84d4d';area.appendChild(player)
    const controls=document.createElement('div');controls.className='mg-center';controls.style.minHeight='70px';const jump=this.button('JUMP','mg-button mg-primary');controls.appendChild(jump);this.content.append(area,controls)
    let y=0,vy=0,passed=0,alive=true,last=performance.now(),obstacles=[],spawnTime=0
    const doJump=()=>{if(y<=.01){vy=430;this.game.audio.jump()}};jump.addEventListener('click',doJump)
    const key=e=>{if(e.code==='Space'){e.preventDefault();doJump()}};window.addEventListener('keydown',key);this.addCleanup(()=>window.removeEventListener('keydown',key))
    const loop=now=>{if(!alive||this.finished)return;const dt=Math.min(.035,(now-last)/1000);last=now;spawnTime-=dt;if(spawnTime<=0&&passed+obstacles.length<10){spawnTime=.85+Math.random()*.55;const el=document.createElement('div');const h=Math.random()<.25?52:32;el.style.cssText=`position:absolute;width:28px;height:${h}px;right:-30px;bottom:40px;background:#6f4a31;border:3px solid #9c6b49`;area.appendChild(el);obstacles.push({el,x:area.clientWidth+25,h})}vy-=980*dt;y=Math.max(0,y+vy*dt);if(y===0&&vy<0)vy=0;player.style.bottom=`${40+y}px`;for(let i=obstacles.length-1;i>=0;i--){const o=obstacles[i];o.x-=210*dt;o.el.style.left=`${o.x}px`;if(o.x<82&&o.x+28>55&&y<o.h-4){alive=false;this.fail('Bonk! Close and try again.');return}if(o.x<-35){o.el.remove();obstacles.splice(i,1);passed++;this.status.textContent=`${passed}/10 obstacles`;if(passed>=10){alive=false;this.win('Parkour cleared!');return}}}requestAnimationFrame(loop)}
    requestAnimationFrame(loop);this.addCleanup(()=>{alive=false;obstacles.forEach(o=>o.el.remove())});this.status.textContent='0/10 obstacles'
  }
}
