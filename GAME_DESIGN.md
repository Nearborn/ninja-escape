# Ninja Escape — Implementation Plan and Game Design

## High-level loop

Each of the first five levels uses the same readable rhythm:

1. Enter a themed escape room.
2. Explore four test stations and complete any three.
3. Rescue a trapped previous contestant when that station is chosen.
4. The room key appears in the centre.
5. Take the key and open the exit.
6. Enter a themed maze.
7. Search for food/components, an optional mini-game, tool cache and an impossible-shadow clue.
8. Avoid living shadows and environmental hazards.
9. Collect the mandatory numerical code fragment.
10. Find the portal to the next escape room.

Level six is the Money-themed final room. Three completed tests activate the vault keypad. The five maze fragments, in level order, open the vault.

## Themes

### 1. Dungeon
Dark stone, trapped skeletons, spider webs, cold lighting and a visibly wet bed. Maze clue introduces the crafting/exploration loop.

### 2. Cold
Blue ice walls, snow floor palette and falling snow particles. The room emphasizes bridge/catching tasks.

### 3. Hot
Copper/red masonry, lava patches and animated fans. Lava respawns the player; fans exert a physical push force.

### 4. Garden
Green topiary architecture, flowers and rain. Ambient audio changes to a calmer harmonic pair.

### 5. Dragon
Purple court, voxel dragons moving above walls and animated ninja pandas.

### 6. Money / Vault
Gold architecture, money pictures and the final keypad/vault.

## Exploration and safety

The game uses child-friendly fail states. Hazards cost a small amount of hunger and return the player to a safe stage spawn. Completed puzzles and collected story progress are never erased by a hazard.

Hunger creates a reason to explore but is deliberately forgiving. At low hunger the player slows rather than dying. Food can be carried and eaten from the backpack.

## Shadows

There are two shadow concepts because the original design described both clue-like and dangerous shadows:

- **Impossible shadows:** stationary patches with no corresponding object. Investigating one reveals a secret cache and a hint about the next room.
- **Living shadows:** dark voxel figures that begin following the player at close range and return the player to safety if they catch them.

## Crafting

Components are distributed through rooms and mazes. Recipes:

- Stick + String → Wooden Bow
- Stick + Feather → 5 Arrows
- Stick + Stone → Stone Spear

Crafted tools open optional reinforced caches. One stone spear can also be found directly, satisfying the design requirement that some tools need not be crafted.

The tool system is deliberately non-blocking: missing an optional component cannot make the story unwinnable.

## Mini-games

The mini-game manager provides touch-first implementations of the requested ideas:

- Parkour runner: jump incoming voxel blocks.
- Imperfect stack: overlapping area is retained and unsupported area is removed.
- Whack-a-mole/spider.
- Build a bridge with a limited plank budget.
- Drop balls into a horizontally moving bucket.
- Push blocks (Sokoban-style) to clear a path.
- Race to fill a timer through rapid input.
- Monty Hall door game.
- Memory cards.
- Catch falling items by dragging a basket.
- Direction-pattern/dance memory, used for ninja pandas and themed variants.

## Tablet-first interaction

The world remains first-person. On touch devices, the left thumb operates a virtual joystick while the right side of the screen acts as a free-look surface. Large ACTION and JUMP buttons sit on the right. Mini-games use large tap targets and avoid hover-only interactions.

## Performance strategy

- One level is present in memory at a time.
- Geometry/materials are cached and reused.
- Models are voxel primitives instead of large GLTF files.
- Device pixel ratio is capped to reduce GPU load on high-DPI tablets.
- Weather uses a single `THREE.Points` draw call.
- No external textures, fonts, audio or models are required.
- PWA assets remain small and GitHub Pages friendly.

## Extensibility

The architecture deliberately separates game state, stage progression, controls, UI, mini-games and world construction. New rooms/mazes can be added to `src/data/stages.js`, while new visual mechanics belong in `World.js` and new test types in `MiniGames.js`.
