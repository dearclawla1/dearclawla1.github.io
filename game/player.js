// ============================================================
// PLAYER
// ============================================================
function createPlayer(name, className) {
  const cls = CLASSES[className];
  return {
    name, className, level: 1, xp: 0, gold: 0,
    x: 0, y: 0, vx: 0, vy: 0,
    hp: cls.hp, maxHp: cls.hp, mp: cls.mp, maxMp: cls.mp,
    str: cls.str, dex: cls.dex, int: cls.int,
    baseSpeed: cls.speed, color: cls.color,
    weapon: cls.weapon,
    equipped: { head: null, chest: null, legs: null, boots: null, ring: null },
    inventory: [], attackCooldown: 0, hurtTimer: 0, invincible: 0,
    facing: { x: 0, y: 1 }, kills: 0, deaths: 0
  };
}

function getPlayerStats() {
  const p = player;
  let def = 0, bonusHp = 0, bonusMp = 0, bonusStr = 0, bonusDex = 0, bonusInt = 0, bonusSpeed = 0;
  for (const slot of Object.keys(p.equipped)) {
    const itemId = p.equipped[slot];
    if (!itemId) continue;
    const g = GEAR[itemId];
    if (!g) continue;
    def += g.def || 0; bonusHp += g.hp || 0; bonusMp += g.mp || 0;
    bonusStr += g.str || 0; bonusDex += g.dex || 0; bonusInt += g.int || 0; bonusSpeed += g.speed || 0;
  }
  const cls = CLASSES[p.className];
  return { maxHp: cls.hp + bonusHp + (p.level - 1) * 8, maxMp: cls.mp + bonusMp + (p.level - 1) * 4,
    str: p.str + bonusStr, dex: p.dex + bonusDex, int: p.int + bonusInt, def, speed: p.baseSpeed + bonusSpeed + p.dex * 1.5 };
}

function getWeaponDamage() {
  const w = WEAPONS[player.weapon]; if (!w) return 5;
  const stats = getPlayerStats();
  let base = w.damage;
  if (w.type === 'melee') base += stats.str * 0.8;
  else if (w.type === 'ranged') base += stats.dex * 0.6;
  else if (w.type === 'magic') base += stats.int * 1.0;
  return Math.floor(base * (1 + player.level * 0.05));
}
