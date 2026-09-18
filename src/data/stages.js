export const THEMES = {
  dungeon: {
    name: 'Dungeon', sky: 0x10161b, fog: 0x11161b, floor: 0x3b4246, wall: 0x555b5e,
    trim: 0x22282c, accent: 0x8eb2b8, light: 0xaed3d8, ambient: 0.48
  },
  cold: {
    name: 'Frozen Halls', sky: 0x9fb9c8, fog: 0xb8d4e2, floor: 0xd9edf4, wall: 0x8fc5dc,
    trim: 0x5f93aa, accent: 0xeaf9ff, light: 0xdaf7ff, ambient: 0.72
  },
  hot: {
    name: 'Furnace', sky: 0x2a0c08, fog: 0x4a160b, floor: 0x4d2920, wall: 0x9b5638,
    trim: 0x5c2c1d, accent: 0xff8b3e, light: 0xff9a4e, ambient: 0.47
  },
  garden: {
    name: 'Rain Garden', sky: 0x708a83, fog: 0x839c91, floor: 0x537a47, wall: 0x2f663e,
    trim: 0x204f2f, accent: 0xeacb6d, light: 0xd8f1d7, ambient: 0.66
  },
  dragon: {
    name: 'Dragon Court', sky: 0x261b38, fog: 0x312343, floor: 0x4c3d56, wall: 0x644b75,
    trim: 0x292035, accent: 0xd870ff, light: 0xe3c4ff, ambient: 0.56
  },
  money: {
    name: 'Golden Vault', sky: 0x171509, fog: 0x211d0b, floor: 0x4f4624, wall: 0xa7832f,
    trim: 0x493b16, accent: 0xffd447, light: 0xffefad, ambient: 0.62
  }
}

export const STAGES = [
  {
    id: 'dungeon-room', type: 'room', theme: 'dungeon', level: 1,
    title: 'The Dungeon', subtitle: 'Three tests reveal the key. Something watches from the shadows.',
    tasks: [
      { id: 'runes', title: 'Rune Memory', game: 'memory', station: [-8, 0, -7], icon: '◆', reward: { food: 1 } },
      { id: 'blocks', title: 'Clear the Stone Path', game: 'sokoban', station: [8, 0, -7], icon: '▦', reward: { stone: 1 } },
      { id: 'rescue', title: 'Free the Webbed Prisoner', game: 'race', station: [-8, 0, 7], icon: '🕸', rescue: 'web', reward: { string: 1 } },
      { id: 'parkour', title: 'Dungeon Parkour', game: 'parkour', station: [8, 0, 7], icon: '▲', reward: { food: 1 } }
    ],
    decor: 'wet-bed'
  },
  {
    id: 'dungeon-maze', type: 'maze', theme: 'dungeon', level: 1,
    title: 'Dungeon Maze', subtitle: 'Find the first code fragment. Not every shadow belongs to an object.',
    fragment: '7', seed: 173, size: 9,
    bonusGame: 'whack', bonusTitle: 'Spider Whack',
    pickups: ['stick', 'string', 'stick', 'feather', 'food'], secretReward: 'food',
    clue: 'The next room is frozen. Save a stick: it may become part of a bridge or a useful tool.'
  },
  {
    id: 'cold-room', type: 'room', theme: 'cold', level: 2,
    title: 'The Frozen Room', subtitle: 'Ice covers the walls and snow hides the floor.',
    tasks: [
      { id: 'bridge', title: 'Build an Ice Bridge', game: 'bridge', station: [-8, 0, -7], icon: '═', reward: { stick: 1 } },
      { id: 'snowcatch', title: 'Catch Snow Crystals', game: 'catch', station: [8, 0, -7], icon: '❄', reward: { feather: 1 } },
      { id: 'rescue', title: 'Thaw the Frozen Explorer', game: 'race', station: [-8, 0, 7], icon: '♨', rescue: 'ice', reward: { food: 2 } },
      { id: 'ice-memory', title: 'Ice Symbol Memory', game: 'memory', station: [8, 0, 7], icon: '◇', reward: { stone: 1 } }
    ],
    decor: 'ice'
  },
  {
    id: 'cold-maze', type: 'maze', theme: 'cold', level: 2,
    title: 'Frozen Maze', subtitle: 'The passages are slippery, but the second fragment is hidden somewhere inside.',
    fragment: '2', seed: 281, size: 9,
    bonusGame: 'parkour', bonusTitle: 'Frozen Footwork',
    pickups: ['feather', 'food', 'stone'], secretReward: 'arrows',
    clue: 'The furnace fans are your friends. Their wind can push you away from dangerous heat.'
  },
  {
    id: 'hot-room', type: 'room', theme: 'hot', level: 3,
    title: 'The Furnace Room', subtitle: 'Copper fire-walls glow red. Fans are the difference between warm and crispy.',
    tasks: [
      { id: 'bucket', title: 'Drop Fireballs into the Bucket', game: 'drop', station: [-8, 0, -7], icon: '●', reward: { food: 1 } },
      { id: 'fans', title: 'Race the Cooling Fans', game: 'race', station: [8, 0, -7], icon: '✣', reward: { stick: 1 } },
      { id: 'rescue', title: 'Free the Tied Engineer', game: 'dance', station: [-8, 0, 7], icon: '⚙', rescue: 'rope', reward: { string: 1 } },
      { id: 'lava-parkour', title: 'Lava Parkour', game: 'parkour', station: [8, 0, 7], icon: '▲', reward: { stone: 1 } }
    ],
    decor: 'lava'
  },
  {
    id: 'hot-maze', type: 'maze', theme: 'hot', level: 3,
    title: 'Furnace Maze', subtitle: 'Use the fans, avoid the lava vents and hunt down fragment three.',
    fragment: '9', seed: 397, size: 9,
    bonusGame: 'drop', bonusTitle: 'Cooling Bucket',
    pickups: ['stone', 'food', 'stick'], secretReward: 'food', foundTool: 'spear',
    clue: 'In the garden, watch patterns all the way through before you copy them.'
  },
  {
    id: 'garden-room', type: 'room', theme: 'garden', level: 4,
    title: 'The Rain Garden', subtitle: 'Topiary walls, flowers and rain. It almost feels peaceful.',
    tasks: [
      { id: 'stack', title: 'Stack the Garden Blocks', game: 'stack', station: [-8, 0, -7], icon: '▥', reward: { stick: 1 } },
      { id: 'moles', title: 'Whack the Sneaky Moles', game: 'whack', station: [8, 0, -7], icon: '●', reward: { food: 2 } },
      { id: 'rescue', title: 'Pull the Gardener from Glue', game: 'race', station: [-8, 0, 7], icon: '♣', rescue: 'glue', reward: { string: 1 } },
      { id: 'flowers', title: 'Flower Dance Memory', game: 'dance', station: [8, 0, 7], icon: '✿', reward: { feather: 1 } }
    ],
    decor: 'rain'
  },
  {
    id: 'garden-maze', type: 'maze', theme: 'garden', level: 4,
    title: 'Topiary Maze', subtitle: 'Flowers spill over the hedge walls. Somewhere inside is fragment four.',
    fragment: '4', seed: 443, size: 10,
    bonusGame: 'catch', bonusTitle: 'Catch the Falling Apples',
    pickups: ['food', 'feather', 'string'], secretReward: 'food',
    clue: 'Three doors, one prize: after an empty door is shown, you are allowed to switch.'
  },
  {
    id: 'dragon-room', type: 'room', theme: 'dragon', level: 5,
    title: 'Dragon Court', subtitle: 'Dragons circle overhead. Ninja pandas seem completely unconcerned.',
    tasks: [
      { id: 'monty', title: 'Three Ninja Doors', game: 'monty', station: [-8, 0, -7], icon: 'III', reward: { food: 1 } },
      { id: 'pandas', title: 'Copy the Ninja Panda Dance', game: 'dance', station: [8, 0, -7], icon: '♪', reward: { feather: 1 } },
      { id: 'eggs', title: 'Catch the Dragon Eggs', game: 'catch', station: [-8, 0, 7], icon: '●', reward: { food: 2 } },
      { id: 'rescue', title: 'Untie the Dragon Watcher', game: 'memory', station: [8, 0, 7], icon: '⌁', rescue: 'rope', reward: { string: 1 } }
    ],
    decor: 'dragons'
  },
  {
    id: 'dragon-maze', type: 'maze', theme: 'dragon', level: 5,
    title: 'Dragon Maze', subtitle: 'The dragons can see over the walls. You need the fifth and final fragment.',
    fragment: '1', seed: 557, size: 10,
    bonusGame: 'race', bonusTitle: 'Dragon Sprint',
    pickups: ['stone', 'food', 'stick'], secretReward: 'arrows',
    clue: 'The vault code is the five fragments in level order. Keep them safe.'
  },
  {
    id: 'money-room', type: 'final', theme: 'money', level: 6,
    title: 'The Golden Vault', subtitle: 'All five fragments lead here. Finish the final tests and open the vault.',
    tasks: [
      { id: 'coin-stack', title: 'Stack the Treasure', game: 'stack', station: [-8, 0, -7], icon: '$', reward: { food: 1 } },
      { id: 'cash-memory', title: 'Money Memory', game: 'memory', station: [8, 0, -7], icon: '¤', reward: { food: 1 } },
      { id: 'coin-bucket', title: 'Coin Drop', game: 'drop', station: [-8, 0, 7], icon: '●', reward: { food: 1 } },
      { id: 'final-bridge', title: 'Bridge to the Vault', game: 'bridge', station: [8, 0, 7], icon: '═', reward: { food: 1 } }
    ],
    decor: 'money'
  }
]

export const RECIPES = [
  { id: 'bow', name: 'Wooden Bow', needs: { stick: 1, string: 1 }, gives: { bow: 1 }, description: 'Opens high or distant secret switches.' },
  { id: 'arrows', name: 'Five Arrows', needs: { stick: 1, feather: 1 }, gives: { arrows: 5 }, description: 'Ammunition for the bow.' },
  { id: 'spear', name: 'Stone Spear', needs: { stick: 1, stone: 1 }, gives: { spear: 1 }, description: 'Breaks cracked stone, ice and thorn barriers.' }
]

export const ITEM_NAMES = {
  food: 'Food', stick: 'Stick', string: 'String', feather: 'Feather', stone: 'Stone',
  bow: 'Wooden Bow', arrows: 'Arrows', spear: 'Stone Spear'
}
