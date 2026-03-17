// ============================================================
// GAME DATA — Gwen evolves this section
// Add new weapons, enemies, gear, zones by adding objects here
// ============================================================
const CLASSES = {
  warrior: { name: 'Warrior', hp: 120, mp: 30, str: 12, dex: 6, int: 4, speed: 140, weapon: 'iron-sword', color: '#ef4444', shadowRadius: 50, maxShadowRadius: 200, shadowVisibility: 1.0 },
  ranger: { name: 'Ranger', hp: 80, mp: 50, str: 6, dex: 12, int: 6, speed: 170, weapon: 'short-bow', color: '#22c55e', shadowRadius: 50, maxShadowRadius: 200, shadowVisibility: 1.0 },
  mage: { name: 'Mage', hp: 60, mp: 100, str: 4, dex: 6, int: 14, speed: 150, weapon: 'fire-staff', color: '#6366f1', shadowRadius: 50, maxShadowRadius: 200, shadowVisibility: 1.0 }
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

// ============================================================
// SHADOW SYSTEM — Radius shadows with visibility stat
// ============================================================
const SHADOW_SYSTEM = {
  // Shadow radius defaults for player classes
  shadowRadius: 50,
  // Maximum shadow radius cap
  maxShadowRadius: 200,
  // Shadow visibility multiplier (increases shadow radius when upgraded)
  shadowVisibility: 1.0,
  // FOV reduction factor for shadow system
  fovReduction: 0.3,
  // Shadow color
  shadowColor: 'rgba(0, 0, 0, 0.6)',
  // Shadow blur amount
  shadowBlur: 10,
  // Shadow update interval
  shadowUpdateInterval: 16,
  // Shadow system active
  shadowActive: true,
  // Shadow radius history for smooth transitions
  shadowRadiusHistory: [],
  // Shadow visibility history for smooth transitions
  shadowVisibilityHistory: [],
  // Shadow FOV reduction history
  fovReductionHistory: [],
  // Shadow system variables for game state
  shadowVariables: {
    currentShadowRadius: 50,
    currentShadowVisibility: 1.0,
    currentFovReduction: 0.3,
    shadowRadiusLevel: 0,
    shadowVisibilityLevel: 0,
    lastShadowUpdate: 0
  },
  // Calculate effective shadow radius based on visibility multiplier
  calculateEffectiveShadowRadius: function(baseRadius, visibilityMultiplier) {
    const effectiveRadius = baseRadius * visibilityMultiplier;
    return Math.min(effectiveRadius, this.maxShadowRadius);
  },
  // Calculate FOV reduction based on shadow system
  calculateFovReduction: function(baseReduction, visibilityMultiplier) {
    const effectiveReduction = baseReduction * visibilityMultiplier;
    return Math.min(effectiveReduction, 1.0);
  },
  // Update shadow system variables
  updateShadowVariables: function(playerStats) {
    const baseRadius = playerStats.shadowRadius || this.shadowRadius;
    const visibilityMultiplier = playerStats.shadowVisibility || this.shadowVisibility;
    const effectiveRadius = this.calculateEffectiveShadowRadius(baseRadius, visibilityMultiplier);
    const effectiveFovReduction = this.calculateFovReduction(this.fovReduction, visibilityMultiplier);
    
    this.shadowVariables.currentShadowRadius = effectiveRadius;
    this.shadowVariables.currentShadowVisibility = visibilityMultiplier;
    this.shadowVariables.currentFovReduction = effectiveFovReduction;
    this.shadowVariables.lastShadowUpdate = Date.now();
    
    // Add to history for smooth transitions
    this.shadowRadiusHistory.push(effectiveRadius);
    this.shadowVisibilityHistory.push(visibilityMultiplier);
    this.fovReductionHistory.push(effectiveFovReduction);
    
    // Keep history limited
    if (this.shadowRadiusHistory.length > 20) {
      this.shadowRadiusHistory.shift();
    }
    if (this.shadowVisibilityHistory.length > 20) {
      this.shadowVisibilityHistory.shift();
    }
    if (this.fovReductionHistory.length > 20) {
      this.fovReductionHistory.shift();
    }
  },
  // Get average shadow radius from history
  getAverageShadowRadius: function() {
    if (this.shadowRadiusHistory.length === 0) return this.shadowVariables.currentShadowRadius;
    const sum = this.shadowRadiusHistory.reduce((acc, val) => acc + val, 0);
    return sum / this.shadowRadiusHistory.length;
  },
  // Get average shadow visibility from history
  getAverageShadowVisibility: function() {
    if (this.shadowVisibilityHistory.length === 0) return this.shadowVariables.currentShadowVisibility;
    const sum = this.shadowVisibilityHistory.reduce((acc, val) => acc + val, 0);
    return sum / this.shadowVisibilityHistory.length;
  },
  // Get average FOV reduction from history
  getAverageFovReduction: function() {
    if (this.fovReductionHistory.length === 0) return this.shadowVariables.currentFovReduction;
    const sum = this.fovReductionHistory.reduce((acc, val) => acc + val, 0);
    return sum / this.fovReductionHistory.length;
  },
  // Reset shadow system
  resetShadowSystem: function() {
    this.shadowRadiusHistory = [];
    this.shadowVisibilityHistory = [];
    this.fovReductionHistory = [];
    this.shadowVariables.currentShadowRadius = this.shadowRadius;
    this.shadowVariables.currentShadowVisibility = this.shadowVisibility;
    this.shadowVariables.currentFovReduction = this.fovReduction;
    this.shadowVariables.shadowRadiusLevel = 0;
    this.shadowVariables.shadowVisibilityLevel = 0;
  },
  // Apply shadow radius upgrade
  applyShadowRadiusUpgrade: function(level) {
    const baseRadius = this.shadowRadius;
    const visibilityMultiplier = this.shadowVisibility;
    const effectiveRadius = this.calculateEffectiveShadowRadius(baseRadius, visibilityMultiplier);
    
    // Increase shadow radius based on level
    const radiusIncrease = level * 10;
    const newRadius = Math.min(effectiveRadius + radiusIncrease, this.maxShadowRadius);
    
    // Update shadow radius
    this.shadowRadius = newRadius;
    
    // Add to history
    this.shadowRadiusHistory.push(newRadius);
    if (this.shadowRadiusHistory.length > 20) {
      this.shadowRadiusHistory.shift();
    }
    
    // Update shadow radius level
    this.shadowVariables.shadowRadiusLevel = level;
  },
  // Apply shadow visibility upgrade
  applyShadowVisibilityUpgrade: function(level) {
    const baseRadius = this.shadowRadius;
    const visibilityMultiplier = this.shadowVisibility;
    const effectiveRadius = this.calculateEffectiveShadowRadius(baseRadius, visibilityMultiplier);
    
    // Increase shadow visibility based on level
    const visibilityIncrease = level * 0.2;
    const newVisibility = Math.min(visibilityMultiplier + visibilityIncrease, 3.0);
    
    // Update shadow visibility
    this.shadowVisibility = newVisibility;
    
    // Add to history
    this.shadowVisibilityHistory.push(newVisibility);
    if (this.shadowVisibilityHistory.length > 20) {
      this.shadowVisibilityHistory.shift();
    }
    
    // Update shadow visibility level
    this.shadowVariables.shadowVisibilityLevel = level;
  },
  // Get shadow system stats
  getShadowStats: function() {
    return {
      shadowRadius: this.shadowVariables.currentShadowRadius,
      shadowVisibility: this.shadowVariables.currentShadowVisibility,
      fovReduction: this.shadowVariables.currentFovReduction,
      shadowRadiusLevel: this.shadowVariables.shadowRadiusLevel,
      shadowVisibilityLevel: this.shadowVariables.shadowVisibilityLevel,
      maxShadowRadius: this.maxShadowRadius,
      shadowActive: this.shadowActive
    };
  }
};

// ============================================================
// SHADOW RENDERER — Draw radial shadows
// ============================================================
const SHADOW_RENDERER = {
  // Shadow rendering settings
  shadowSettings: {
    enabled: true,
    drawShadow: true,
    drawShadowBlur: true,
    shadowScale: 1.0,
    shadowAlpha: 0.6,
    shadowColor: 'rgba(0, 0, 0, 0.6)',
    shadowBlurAmount: 10,
    shadowRadius: 50,
    shadowVisibility: 1.0,
    fovReduction: 0.3,
    maxShadowRadius: 200
  },
  // Draw shadow for player
  drawPlayerShadow: function(ctx, player, camera) {
    if (!this.shadowSettings.enabled || !this.shadowSettings.drawShadow) {
      return;
    }
    
    const effectiveShadowRadius = this.calculateEffectiveShadowRadius(
      player.shadowRadius || SHADOW_SYSTEM.shadowRadius,
      player.shadowVisibility || SHADOW_SYSTEM.shadowVisibility
    );
    
    const fovReduction = this.calculateFovReduction(
      SHADOW_SYSTEM.fovReduction,
      player.shadowVisibility || SHADOW_SYSTEM.shadowVisibility
    );
    
    // Calculate shadow position relative to camera
    const shadowX = player.x - camera.x;
    const shadowY = player.y - camera.y;
    
    // Apply FOV reduction to shadow visibility
    const shadowAlpha = this.shadowSettings.shadowAlpha * fovReduction;
    
    // Draw shadow
    ctx.beginPath();
    ctx.arc(shadowX, shadowY, effectiveShadowRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.shadowSettings.shadowColor;
    ctx.fill();
    
    // Draw shadow blur
    if (this.shadowSettings.drawShadowBlur) {
      ctx.beginPath();
      ctx.arc(shadowX, shadowY, effectiveShadowRadius * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = this.shadowSettings.shadowColor.replace('0.6', '0.3');
      ctx.fill();
    }
  },
  // Draw shadow for enemy
  drawEnemyShadow: function(ctx, enemy, camera) {
    if (!this.shadowSettings.enabled || !this.shadowSettings.drawShadow) {
      return;
    }
    
    const effectiveShadowRadius = this.calculateEffectiveShadowRadius(
      enemy.shadowRadius || SHADOW_SYSTEM.shadowRadius,
      enemy.shadowVisibility || SHADOW_SYSTEM.shadowVisibility
    );
    
    const fovReduction = this.calculateFovReduction(
      SHADOW_SYSTEM.fovReduction,
      enemy.shadowVisibility || SHADOW_SYSTEM.shadowVisibility
    );
    
    // Calculate shadow position relative to camera
    const shadowX = enemy.x - camera.x;
    const shadowY = enemy.y - camera.y;
    
    // Apply FOV reduction to shadow visibility
    const shadowAlpha = this.shadowSettings.shadowAlpha * fovReduction;
    
    // Draw shadow
    ctx.beginPath();
    ctx.arc(shadowX, shadowY, effectiveShadowRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.shadowSettings.shadowColor;
    ctx.fill();
    
    // Draw shadow blur
    if (this.shadowSettings.drawShadowBlur) {
      ctx.beginPath();
      ctx.arc(shadowX, shadowY, effectiveShadowRadius * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = this.shadowSettings.shadowColor.replace('0.6', '0.3');
      ctx.fill();
    }
  },
  // Calculate effective shadow radius
  calculateEffectiveShadowRadius: function(baseRadius, visibilityMultiplier) {
    const effectiveRadius = baseRadius * visibilityMultiplier;
    return Math.min(effectiveRadius, this.shadowSettings.maxShadowRadius);
  },
  // Calculate FOV reduction
  calculateFovReduction: function(baseReduction, visibilityMultiplier) {
    const effectiveReduction = baseReduction * visibilityMultiplier;
    return Math.min(effectiveReduction, 1.0);
  },
  // Update shadow renderer settings
  updateShadowSettings: function(playerStats) {
    const baseRadius = playerStats.shadowRadius || SHADOW_SYSTEM.shadowRadius;
    const visibilityMultiplier = playerStats.shadowVisibility || SHADOW_SYSTEM.shadowVisibility;
    const effectiveRadius = this.calculateEffectiveShadowRadius(baseRadius, visibilityMultiplier);
    const effectiveFovReduction = this.calculateFovReduction(SHADOW_SYSTEM.fovReduction, visibilityMultiplier);
    
    this.shadowSettings.shadowRadius = effectiveRadius;
    this.shadowSettings.shadowVisibility = visibilityMultiplier;
    this.shadowSettings.fovReduction = effectiveFovReduction;
  },
  // Reset shadow renderer
  resetShadowRenderer: function() {
    this.shadowSettings.enabled = true;
    this.shadowSettings.drawShadow = true;
    this.shadowSettings.drawShadowBlur = true;
    this.shadowSettings.shadowScale = 1.0;
    this.shadowSettings.shadowAlpha = 0.6;
    this.shadowSettings.shadowColor = 'rgba(0, 0, 0, 0.6)';
    this.shadowSettings.shadowBlurAmount = 10;
    this.shadowSettings.shadowRadius = SHADOW_SYSTEM.shadowRadius;
    this.shadowSettings.shadowVisibility = SHADOW_SYSTEM.shadowVisibility;
    this.shadowSettings.fovReduction = SHADOW_SYSTEM.fovReduction;
    this.shadowSettings.maxShadowRadius = SHADOW_SYSTEM.maxShadowRadius;
  }
};

// ============================================================
// SHADOW STATS — Progression system for shadows
// ============================================================
const SHADOW_STATS = {
  // Shadow stat levels
  shadowStatLevels: {
    shadowRadius: {
      base: 50,
      max: 200,
      cost: [10, 25, 50, 100, 200],
      bonus: [10, 20, 30, 40, 50]
    },
    shadowVisibility: {
      base: 1.0,
      max: 3.0,
      cost: [10, 25, 50, 100, 200],
      bonus: [0.2, 0.3, 0.4, 0.5, 0.6]
    }
  },
  // Get shadow stat cost
  getShadowStatCost: function(stat, level) {
    const statConfig = this.shadowStatLevels[stat];
    if (level >= statConfig.cost.length) {
      return statConfig.cost[statConfig.cost.length - 1] * 2;
    }
    return statConfig.cost[level];
  },
  // Get shadow stat bonus
  getShadowStatBonus: function(stat, level) {
    const statConfig = this.shadowStatLevels[stat];
    if (level >= statConfig.bonus.length) {
      return statConfig.bonus[statConfig.bonus.length - 1];
    }
    return statConfig.bonus[level];
  },
  // Calculate shadow stat value
  calculateShadowStatValue: function(stat, baseValue, level) {
    const bonus = this.getShadowStatBonus(stat, level);
    return baseValue + bonus;
  },
  // Get shadow stat max level
  getShadowStatMaxLevel: function(stat) {
    return this.shadowStatLevels[stat].cost.length;
  },
  // Reset shadow stats
  resetShadowStats: function() {
    this.shadowStatLevels.shadowRadius.level = 0;
    this.shadowStatLevels.shadowVisibility.level = 0;
  }
};

// ============================================================
// SHADOW FOV — Field of view reduction system
// ============================================================
const SHADOW_FOV = {
  // FOV reduction settings
  fovSettings: {
    baseReduction: 0.3,
    maxReduction: 1.0,
    reductionFactor: 0.1,
    visibilityMultiplier: 1.0
  },
  // Calculate FOV reduction
  calculateFovReduction: function(baseReduction, visibilityMultiplier) {
    const effectiveReduction = baseReduction * visibilityMultiplier;
    return Math.min(effectiveReduction, this.fovSettings.maxReduction);
  },
  // Get FOV reduction percentage
  getFovReductionPercentage: function(reduction) {
    return Math.round(reduction * 100);
  },
  // Update FOV settings
  updateFovSettings: function(visibilityMultiplier) {
    this.fovSettings.visibilityMultiplier = visibilityMultiplier;
    this.fovSettings.currentReduction = this.calculateFovReduction(
      this.fovSettings.baseReduction,
      visibilityMultiplier
    );
  },
  // Reset FOV settings
  resetFovSettings: function() {
    this.fovSettings.baseReduction = 0.3;
    this.fovSettings.maxReduction = 1.0;
    this.fovSettings.reductionFactor = 0.1;
    this.fovSettings.visibilityMultiplier = 1.0;
    this.fovSettings.currentReduction = 0.3;
  }
};

// ============================================================
// SHADOW DOCUMENTATION — Shadow system variables
// ============================================================
const SHADOW_DOCUMENTATION = {
  // Shadow system variables
  shadowVariables: {
    shadowRadius: {
      description: 'Base shadow radius for player class',
      default: 50,
      unit: 'pixels',
      min: 0,
      max: SHADOW_SYSTEM.maxShadowRadius
    },
    maxShadowRadius: {
      description: 'Maximum shadow radius cap',
      default: 200,
      unit: 'pixels',
      min: 0
    },
    shadowVisibility: {
      description: 'Shadow visibility multiplier that increases shadow radius when upgraded',
      default: 1.0,
      unit: 'multiplier',
      min: 0,
      max: 3.0
    },
    fovReduction: {
      description: 'FOV reduction factor for shadow system',
      default: 0.3,
      unit: 'factor',
      min: 0,
      max: 1.0
    },
    shadowColor: {
      description: 'Shadow color',
      default: 'rgba(0, 0, 0, 0.6)',
      unit: 'color'
    },
    shadowBlur: {
      description: 'Shadow blur amount',
      default: 10,
      unit: 'pixels'
    },
    shadowUpdateInterval: {
      description: 'Shadow update interval',
      default: 16,
      unit: 'ms'
    },
    shadowActive: {
      description: 'Shadow system active',
      default: true,
      unit: 'boolean'
    }
  },
  // Shadow system functions
  shadowFunctions: {
    calculateEffectiveShadowRadius: {
      description: 'Calculate effective shadow radius based on visibility multiplier',
      parameters: ['baseRadius', 'visibilityMultiplier'],
      returns: 'effectiveRadius'
    },
    calculateFovReduction: {
      description: 'Calculate FOV reduction based on shadow system',
      parameters: ['baseReduction', 'visibilityMultiplier'],
      returns: 'effectiveReduction'
    },
    updateShadowVariables: {
      description: 'Update shadow system variables',
      parameters: ['playerStats'],
      returns: 'void'
    },
    getAverageShadowRadius: {
      description: 'Get average shadow radius from history',
      parameters: [],
      returns: 'averageRadius'
    },
    getAverageShadowVisibility: {
      description: 'Get average shadow visibility from history',
      parameters: [],
      returns: 'averageVisibility'
    },
    getAverageFovReduction: {
      description: 'Get average FOV reduction from history',
      parameters: [],
      returns: 'averageReduction'
    },
    resetShadowSystem: {
      description: 'Reset shadow system',
      parameters: [],
      returns: 'void'
    },
    applyShadowRadiusUpgrade: {
      description: 'Apply shadow radius upgrade',
      parameters: ['level'],
      returns: 'void'
    },
    applyShadowVisibilityUpgrade: {
      description: 'Apply shadow visibility upgrade',
      parameters: ['level'],
      returns: 'void'
    },
    getShadowStats: {
      description: 'Get shadow system stats',
      parameters: [],
      returns: 'shadowStats'
    }
  },
  // Shadow renderer functions
  rendererFunctions: {
    drawPlayerShadow: {
      description: 'Draw shadow for player',
      parameters: ['ctx', 'player', 'camera'],
      returns: 'void'
    },
    drawEnemyShadow: {
      description: 'Draw shadow for enemy',
      parameters: ['ctx', 'enemy', 'camera'],
      returns: 'void'
    },
    calculateEffectiveShadowRadius: {
      description: 'Calculate effective shadow radius',
      parameters: ['baseRadius', 'visibilityMultiplier'],
      returns: 'effectiveRadius'
    },
    calculateFovReduction: {
      description: 'Calculate FOV reduction',
      parameters: ['baseReduction', 'visibilityMultiplier'],
      returns: 'effectiveReduction'
    },
    updateShadowSettings: {
      description: 'Update shadow renderer settings',
      parameters: ['playerStats'],
      returns: 'void'
    },
    resetShadowRenderer: {
      description: 'Reset shadow renderer',
      parameters: [],
      returns: 'void'
    }
  },
  // Shadow stats functions
  statsFunctions: {
    getShadowStatCost: {
      description: 'Get shadow stat cost',
      parameters: ['stat', 'level'],
      returns: 'cost'
    },
    getShadowStatBonus: {
      description: 'Get shadow stat bonus',
      parameters: ['stat', 'level'],
      returns: 'bonus'
    },
    calculateShadowStatValue: {
      description: 'Calculate shadow stat value',
      parameters: ['stat', 'baseValue', 'level'],
      returns: 'value'
    },
    getShadowStatMaxLevel: {
      description: 'Get shadow stat max level',
      parameters: ['stat'],
      returns: 'maxLevel'
    },
    resetShadowStats: {
      description: 'Reset shadow stats',
      parameters: [],
      returns: 'void'
    }
  },
  // Shadow FOV functions
  fovFunctions: {
    calculateFovReduction: {
      description: 'Calculate FOV reduction',
      parameters: ['baseReduction', 'visibilityMultiplier'],
      returns: 'effectiveReduction'
    },
    getFovReductionPercentage: {
      description: 'Get FOV reduction percentage',
      parameters: ['reduction'],
      returns: 'percentage'
    },
    updateFovSettings: {
      description: 'Update FOV settings',
      parameters: ['visibilityMultiplier'],
      returns: 'void'
    },
    resetFovSettings: {
      description: 'Reset FOV settings',
      parameters: [],
      returns: 'void'
    }
  }
};

// ============================================================
// SHADOW EXAMPLES — Usage examples
// ============================================================
const SHADOW_EXAMPLES = {
  // Example: Initialize shadow system
  initializeShadowSystem: `
    // Initialize shadow system
    SHADOW_SYSTEM.updateShadowVariables(playerStats);
    
    // Get shadow stats
    const stats = SHADOW_SYSTEM.getShadowStats();
    console.log('Shadow Stats:', stats);
  `,
  // Example: Draw player shadow
  drawPlayerShadow: `
    // Draw player shadow
    SHADOW_RENDERER.drawPlayerShadow(ctx, player, camera);
  `,
  // Example: Apply shadow radius upgrade
  applyShadowRadiusUpgrade: `
    // Apply shadow radius upgrade
    SHADOW_SYSTEM.applyShadowRadiusUpgrade(1);
    
    // Update shadow variables
    SHADOW_SYSTEM.updateShadowVariables(playerStats);
  `,
  // Example: Apply shadow visibility upgrade
  applyShadowVisibilityUpgrade: `
    // Apply shadow visibility upgrade
    SHADOW_SYSTEM.applyShadowVisibilityUpgrade(1);
    
    // Update shadow variables
    SHADOW_SYSTEM.updateShadowVariables(playerStats);
  `,
  // Example: Get shadow stat cost
  getShadowStatCost: `
    // Get shadow radius stat cost for level 1
    const cost = SHADOW_STATS.getShadowStatCost('shadowRadius', 1);
    console.log('Shadow Radius Cost:', cost);
    
    // Get shadow visibility stat cost for level 2
    const visibilityCost = SHADOW_STATS.getShadowStatCost('shadowVisibility', 2);
    console.log('Shadow Visibility Cost:', visibilityCost);
  `,
  // Example: Calculate effective shadow radius
  calculateEffectiveShadowRadius: `
    // Calculate effective shadow radius
    const baseRadius = 50;
    const visibilityMultiplier = 1.5;
    const effectiveRadius = SHADOW_RENDERER.calculateEffectiveShadowRadius(baseRadius, visibilityMultiplier);
    console.log('Effective Shadow Radius:', effectiveRadius);
  `,
  // Example: Calculate FOV reduction
  calculateFovReduction: `
    // Calculate FOV reduction
    const baseReduction = 0.3;
    const visibilityMultiplier = 1.5;
    const effectiveReduction = SHADOW_RENDERER.calculateFovReduction(baseReduction, visibilityMultiplier);
    console.log('Effective FOV Reduction:', effectiveReduction);
  `
};

// ============================================================
// SHADOW CONSTANTS — Shadow system constants
// ============================================================
const SHADOW_CONSTANTS = {
  // Shadow system constants
  SHADOW_RADIUS_DEFAULT: 50,
  SHADOW_MAX_RADIUS: 200,
  SHADOW_VISIBILITY_DEFAULT: 1.0,
  SHADOW_MAX_VISIBILITY: 3.0,
  SHADOW_FOV_REDUCTION_DEFAULT: 0.3,
  SHADOW_FOV_MAX_REDUCTION: 1.0,
  SHADOW_COLOR_DEFAULT: 'rgba(0, 0, 0, 0.6)',
  SHADOW_BLUR_DEFAULT: 10,
  SHADOW_UPDATE_INTERVAL: 16,
  SHADOW_HISTORY_MAX_LENGTH: 20
};

// ============================================================
// SHADOW UPGRADE PATHS — Shadow upgrade progression
// ============================================================
const SHADOW_UPGRADE_PATHS = {
  // Shadow radius upgrade path
  shadowRadiusPath: {
    name: 'Shadow Radius',
    description: 'Increases the size of your shadow',
    levels: [
      { level: 1, cost: 10, bonus: 10, radius: 60, description: 'Small shadow' },
      { level: 2, cost: 25, bonus: 20, radius: 70, description: 'Medium shadow' },
      { level: 3, cost: 50, bonus: 30, radius: 80, description: 'Large shadow' },
      { level: 4, cost: 100, bonus: 40, radius: 90, description: 'Huge shadow' },
      { level: 5, cost: 200, bonus: 50, radius: 100, description: 'Massive shadow' }
    ],
    maxLevel: 5,
    totalCost: 385
  },
  // Shadow visibility upgrade path
  shadowVisibilityPath: {
    name: 'Shadow Visibility',
    description: 'Increases shadow visibility multiplier',
    levels: [
      { level: 1, cost: 10, bonus: 0.2, visibility: 1.2, description: 'Enhanced shadow' },
      { level: 2, cost: 25, bonus: 0.3, visibility: 1.5, description: 'Bright shadow' },
      { level: 3, cost: 50, bonus: 0.4, visibility: 1.8, description: 'Glowing shadow' },
      { level: 4, cost: 100, bonus: 0.5, visibility: 2.1, description: 'Radiant shadow' },
      { level: 5, cost: 200, bonus: 0.6, visibility: 2.4, description: 'Luminous shadow' }
    ],
    maxLevel: 5,
    totalCost: 385
  }
};

// ============================================================
// SHADOW CONFIG — Shadow system configuration
// ============================================================
const SHADOW_CONFIG = {
  // Shadow system configuration
  shadowConfig: {
    enabled: true,
    drawShadow: true,
    drawShadowBlur: true,
    shadowScale: 1.0,
    shadowAlpha: 0.6,
    shadowColor: 'rgba(0, 0, 0, 0.6)',
    shadowBlurAmount: 10,
    shadowRadius: 50,
    shadowVisibility: 1.0,
    fovReduction: 0.3,
    maxShadowRadius: 200
  },
  // Shadow system defaults
  shadowDefaults: {
    shadowRadius: 50,
    maxShadowRadius: 200,
    shadowVisibility: 1.0,
    fovReduction: 0.3,
    shadowColor: 'rgba(0, 0, 0, 0.6)',
    shadowBlur: 10,
    shadowUpdateInterval: 16,
    shadowActive: true
  },
  // Shadow system history settings
  shadowHistory: {
    maxRadiusHistory: 20,
    maxVisibilityHistory: 20,
    maxFovReductionHistory: 20
  }
};

// ============================================================
// SHADOW SYSTEM SUMMARY — Shadow system overview
// ============================================================
const SHADOW_SUMMARY = {
  // Shadow system summary
  summary: {
    name: 'Shadow System',
    description: 'Radius shadows with visibility stat',
    features: [
      'Shadow radius for player classes',
      'Maximum shadow radius cap',
      'Shadow visibility multiplier',
      'FOV reduction logic',
      'Shadow upgrade progression',
      'Shadow history tracking',
      'Smooth shadow transitions'
    ],
    variables: [
      'shadowRadius',
      'maxShadowRadius',
      'shadowVisibility',
      'fovReduction',
      'shadowColor',
      'shadowBlur',
      'shadowUpdateInterval',
      'shadowActive'
    ],
    functions: [
      'calculateEffectiveShadowRadius',
      'calculateFovReduction',
      'updateShadowVariables',
      'getAverageShadowRadius',
      'getAverageShadowVisibility',
      'getAverageFovReduction',
      'resetShadowSystem',
      'applyShadowRadiusUpgrade',
      'applyShadowVisibilityUpgrade',
      'getShadowStats'
    ],
    renderer: [
      'drawPlayerShadow',
      'drawEnemyShadow',
      'calculateEffectiveShadowRadius',
      'calculateFovReduction',
      'updateShadowSettings',
      'resetShadowRenderer'
    ],
    stats: [
      'getShadowStatCost',
      'getShadowStatBonus',
      'calculateShadowStatValue',
      'getShadowStatMaxLevel',
      'resetShadowStats'
    ],
    fov: [
      'calculateFovReduction',
      'getFovReductionPercentage',
      'updateFovSettings',
      'resetFovSettings'
    ]
  }
};
