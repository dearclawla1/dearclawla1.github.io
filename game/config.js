// ============================================================
// GAME DATA — Gwen evolves this section
// Add new weapons, enemies, gear, zones by adding objects here
// ============================================================
const CLASSES = {
  warrior: { name: 'Warrior', hp: 120, mp: 30, str: 12, dex: 6, int: 4, speed: 140, weapon: 'iron-sword', color: '#ef4444' },
  ranger: { name: 'Ranger', hp: 80, mp: 50, str: 6, dex: 12, int: 6, speed: 170, weapon: 'short-bow', color: '#22c55e' },
  mage: { name: 'Mage', hp: 60, mp: 100, str: 4, dex: 6, int: 14, speed: 150, weapon: 'fire-staff', color: '#6366f1' }
};

const WEAPONS = {
    'plasma-blaster': { name:'Plasma Blaster', type:'magic', damage:28, speed:0.45, range:350, projSpeed:550, rarity:'epic', icon:'⚡', element:'plasma', mpCost:12 },
  'wooden-sword': { name: 'Wooden Sword', type: 'melee', damage: 4, speed: 1.0, range: 38, rarity: 'common', icon: '&#9876;' },
  'iron-sword': { name: 'Iron Sword', type: 'melee', damage: 10, speed: 0.9, range: 42, rarity: 'uncommon', icon: '&#9876;' },
  'great-axe': { name: 'Great Axe', type: 'melee', damage: 18, speed: 0.5, range: 48, rarity: 'rare', icon: '&#129683;' },
  'short-bow': { name: 'Short Bow', type: 'ranged', damage: 7, speed: 0.7, range: 220, projSpeed: 350, rarity: 'common', icon: '&#127993;' },
  'longbow': { name: 'Longbow', type: 'ranged', damage: 14, speed: 0.55, range: 320, projSpeed: 450, rarity: 'rare', icon: '&#127993;' },
  'fire-staff': { name: 'Fire Staff', type: 'magic', damage: 12, speed: 0.6, range: 250, projSpeed: 280, rarity: 'uncommon', icon: '&#10024;', element: 'fire', mpCost: 8 },
  'ice-wand': { name: 'Ice Wand', type: 'magic', damage: 9, speed: 0.8, range: 200, projSpeed: 300, rarity: 'rare', icon: '&#10052;', element: 'ice', mpCost: 6 },
  'shadow-dagger': { name: 'Shadow Dagger', type: 'melee', damage: 15, speed: 1.3, range: 32, rarity: 'epic', icon: '&#128481;' },
  'thunder-staff': { name: 'Thunder Staff', type: 'magic', damage: 22, speed: 0.4, range: 280, projSpeed: 500, rarity: 'epic', icon: '&#9889;', element: 'lightning', mpCost: 15 }
};

const GEAR = {
  'leather-cap': { name: 'Leather Cap', slot: 'head', def: 2, rarity: 'common', icon: '&#129506;' },
  'iron-helm': { name: 'Iron Helm', slot: 'head', def: 5, hp: 10, rarity: 'uncommon', icon: '&#129506;' },
  'leather-vest': { name: 'Leather Vest', slot: 'chest', def: 3, rarity: 'common', icon: '&#129507;' },
  'chainmail': { name: 'Chainmail', slot: 'chest', def: 8, rarity: 'uncommon', icon: '&#129507;' },
  'iron-plate': { name: 'Iron Plate', slot: 'chest', def: 14, hp: 20, rarity: 'rare', icon: '&#129507;' },
  'leather-pants': { name: 'Leather Pants', slot: 'legs', def: 2, rarity: 'common', icon: '&#128086;' },
  'iron-greaves': { name: 'Iron Greaves', slot: 'legs', def: 6, rarity: 'uncommon', icon: '&#128086;' },
  'sandals': { name: 'Sandals', slot: 'boots', def: 1, speed: 10, rarity: 'common', icon: '&#128095;' },
  'iron-boots': { name: 'Iron Boots', slot: 'boots', def: 4, rarity: 'uncommon', icon: '&#128095;' },
  'swift-boots': { name: 'Swift Boots', slot: 'boots', def: 2, speed: 25, rarity: 'rare', icon: '&#128095;' },
  'copper-ring': { name: 'Copper Ring', slot: 'ring', str: 2, rarity: 'common', icon: '&#128141;' },
  'ruby-ring': { name: 'Ruby Ring', slot: 'ring', str: 5, hp: 15, rarity: 'rare', icon: '&#128141;' },
  'mana-ring': { name: 'Mana Ring', slot: 'ring', int: 4, mp: 30, rarity: 'uncommon', icon: '&#128141;' },
  'shadow-cloak': { name: 'Shadow Cloak', slot: 'chest', def: 10, dex: 6, rarity: 'epic', icon: '&#129507;' },
  'dragon-helm': { name: 'Dragon Helm', slot: 'head', def: 12, str: 4, hp: 30, rarity: 'legendary', icon: '&#129506;' }
};

const ENEMIES = {
  'shadow-stalker': { name:'Shadow Stalker', hp:60, damage:12, speed:80, xp:35, color:'#1a1a1a', size:18, ai:'chase', drops:[['shadow-blade',0.05],['shadow-helm',0.03]] },
  'frost-wraith': { name:'Frost Wraith', hp:55, damage:12, speed:88, xp:35, color:'#60a5fa', size:17, ai:'chase', drops:[['frost-soul',0.08]] },
  'shadow-walker': { name:'Shadow Walker', hp:45, damage:9, speed:80, xp:32, color:'#1a1a1a', size:17, ai:'chase', drops:[['shadow-fragment',0.08]] },
  'wraith-blade': { name:'Wraith Blade', hp:55, damage:11, speed:95, xp:35, color:'#7c3aed', size:17, ai:'chase', drops:[['wraith-essence',0.08],['wraith-cloak',0.05]] },
  'ice-stalker': { name:'Ice Stalker', hp:60, damage:12, speed:92, xp:35, color:'#1e40af', size:17, ai:'chase', drops:[['frost-scale',0.08],['ice-blade',0.05]] },
  'ice-wraith': { name:'Ice Wraith', hp:65, damage:15, speed:85, xp:38, color:'#1e3a8a', size:17, ai:'swoop', drops:[['ice-shards',0.07],['wraith-cloak',0.05]] },
  'frost-hunter': { name:'Frost Hunter', hp:55, damage:12, speed:95, xp:32, color:'#60a5fa', size:17, ai:'chase', drops:[['frost-teeth',0.06],['ice-boots',0.08]] },
  'ice-spider': { name:'Ice Spider', hp:50, damage:11, speed:90, xp:30, color:'#a855f7', size:16, ai:'freeze', drops:[['ice-thread',0.08],['ice-armor',0.05]] },
  slime: { name: 'Slime', hp: 25, damage: 3, speed: 25, xp: 8, color: '#4ade80', size: 14, ai: 'wander', drops: [['leather-vest',0.08],['sandals',0.08],['copper-ring',0.05]] },
  bat: { name: 'Cave Bat', hp: 15, damage: 5, speed: 70, xp: 6, color: '#a78bfa', size: 10, ai: 'swoop', drops: [['leather-cap',0.1]] },
  skeleton: { name: 'Skeleton', hp: 50, damage: 10, speed: 40, xp: 20, color: '#e2e8f0', size: 16, ai: 'chase', drops: [['iron-sword',0.06],['iron-helm',0.08],['chainmail',0.05],['iron-greaves',0.06]] },
  wolf: { name: 'Dark Wolf', hp: 40, damage: 12, speed: 65, xp: 18, color: '#94a3b8', size: 14, ai: 'chase', drops: [['swift-boots',0.04],['leather-pants',0.1]] },
  golem: { name: 'Stone Golem', hp: 120, damage: 18, speed: 20, xp: 45, color: '#78716c', size: 24, ai: 'guard', drops: [['iron-plate',0.08],['iron-boots',0.1],['great-axe',0.04]] },
  wraith: { name: 'Wraith', hp: 70, damage: 15, speed: 50, xp: 35, color: '#7c3aed', size: 18, ai: 'chase', drops: [['shadow-dagger',0.03],['shadow-cloak',0.02],['mana-ring',0.06]] },
  dragon: { name: 'Elder Dragon', hp: 300, damage: 30, speed: 35, xp: 150, color: '#dc2626', size: 32, ai: 'boss', drops: [['dragon-helm',0.15],['thunder-staff',0.08],['longbow',0.1],['ruby-ring',0.1]] }
};

const ZONES = {
  'starter-meadow': {
    name: 'Starter Meadow', width: 50, height: 50, tileSize: 32,
    bg: '#1a3a1a', wallColor: '#2d5a2d', floorColor: '#1a3a1a', accentColor: '#4ade80',
    pvp: false, levelReq: 0,
    enemies: [{ type: 'slime', count: 6, respawn: 20 }],
    portals: [{ x: 49, y: 25, w: 1, h: 3, target: 'dark-forest', sx: 1, sy: 25, label: 'Dark Forest >' }],
    obstacles: 0.04, trees: 0.06
  },
  'dark-forest': {
    name: 'Dark Forest', width: 60, height: 60, tileSize: 32,
    bg: '#0d1a0d', wallColor: '#1a2e1a', floorColor: '#0d1a0d', accentColor: '#94a3b8',
    pvp: true, levelReq: 3,
    enemies: [{ type: 'skeleton', count: 5, respawn: 25 }, { type: 'wolf', count: 4, respawn: 20 }],
    portals: [
      { x: 0, y: 25, w: 1, h: 3, target: 'starter-meadow', sx: 48, sy: 25, label: '< Meadow' },
      { x: 59, y: 30, w: 1, h: 3, target: 'crystal-caves', sx: 1, sy: 15, label: 'Crystal Caves >' },
      { x: 30, y: 0, w: 3, h: 1, target: 'cursed-ruins', sx: 15, sy: 28, label: '^ Cursed Ruins' }
    ],
    obstacles: 0.03, trees: 0.12
  },
  'crystal-caves': {
    name: 'Crystal Caves', width: 50, height: 50, tileSize: 32,
    bg: '#0d0d2e', wallColor: '#1a1a4e', floorColor: '#0d0d2e', accentColor: '#60a5fa',
    pvp: false, levelReq: 5,
    enemies: [{ type: 'bat', count: 6, respawn: 15 }, { type: 'golem', count: 3, respawn: 40 }],
    portals: [{ x: 0, y: 15, w: 1, h: 3, target: 'dark-forest', sx: 58, sy: 30, label: '< Forest' }],
    obstacles: 0.08, trees: 0
  },
  'cursed-ruins': {
    name: 'Cursed Ruins', width: 70, height: 70, tileSize: 32,
    bg: '#1a0a1a', wallColor: '#2e1a2e', floorColor: '#1a0a1a', accentColor: '#a855f7',
    pvp: true, levelReq: 8,
    enemies: [{ type: 'wraith', count: 5, respawn: 30 }, { type: 'skeleton', count: 4, respawn: 25 }, { type: 'dragon', count: 1, respawn: 120 }],
    portals: [{ x: 15, y: 29, w: 3, h: 1, target: 'dark-forest', sx: 30, sy: 1, label: 'v Forest' }],
    obstacles: 0.06, trees: 0.02
  }
};

const RARITY_COLORS = { common: '#9ca3af', uncommon: '#22c55e', rare: '#3b82f6', epic: '#a855f7', legendary: '#f97316' };
const XP_PER_LEVEL = lvl => Math.floor(50 * Math.pow(1.4, lvl - 1));
const API_BASE = 'https://gwen-api.dearclawla1.workers.dev';
