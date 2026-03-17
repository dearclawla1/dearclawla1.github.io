// ============================================================
// COMBAT
// ============================================================
function playerAttack() {
  const w = WEAPONS[player.weapon]; if (!w) return;
  const now = performance.now() / 1000;
  if (now - lastAttackTime < (1 / w.speed)) return;
  if (w.mpCost && player.mp < w.mpCost) return;
  if (w.mpCost) player.mp -= w.mpCost;
  lastAttackTime = now;
  sendAttack();
  const fx = player.facing.x, fy = player.facing.y;
  const len = Math.sqrt(fx * fx + fy * fy) || 1;
  const dx = fx / len, dy = fy / len;
  if (w.type === 'melee') {
    const dmg = getWeaponDamage();
    for (const e of entities) {
      if (e.dead) continue;
      const ex = e.x - player.x, ey = e.y - player.y;
      const dist = Math.sqrt(ex * ex + ey * ey);
      if (dist > w.range) continue;
      const dot = (ex * dx + ey * dy) / dist;
      if (dot < 0.4) continue;
      damageEntity(e, dmg);
    }
    for (let i = 0; i < 5; i++) {
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.2;
      const dist = w.range * (0.5 + Math.random() * 0.5);
      particles.push({ x: player.x + Math.cos(angle) * dist, y: player.y + Math.sin(angle) * dist,
        vx: Math.cos(angle) * 30, vy: Math.sin(angle) * 30, life: 0.2, maxLife: 0.2, color: '#fff', size: 3 });
    }
  } else {
    const dmg = getWeaponDamage();
    const pColor = w.element === 'fire' ? '#ef4444' : w.element === 'ice' ? '#60a5fa' : w.element === 'lightning' ? '#fbbf24' : '#e2e8f0';
    projectiles.push({ x: player.x + dx * 16, y: player.y + dy * 16, vx: dx * w.projSpeed, vy: dy * w.projSpeed,
      damage: dmg, range: w.range, traveled: 0, owner: 'player', color: pColor, size: w.type === 'magic' ? 6 : 4, element: w.element || null });
  }
}

function damageEntity(e, dmg) {
  const finalDmg = Math.max(1, Math.floor(dmg * (0.8 + Math.random() * 0.4)));
  e.hp -= finalDmg; e.hurtTimer = 0.15;
  addFloatingText(e.x, e.y - e.size, `-${finalDmg}`, '#ef4444');
  if (e.hp <= 0) killEnemy(e);
}

function killEnemy(e) {
  e.dead = true;
  e.respawnTime = performance.now() / 1000 + (ENEMIES[e.respawnType]?.respawn || 30) + Math.random() * 10;
  player.xp += e.xp; player.kills++;
  addFloatingText(e.x, e.y - 20, `+${e.xp} XP`, '#eab308');
  const drops = ENEMIES[e.respawnType]?.drops || [];
  for (const [itemId, chance] of drops) {
    if (Math.random() < chance) {
      lootBags.push({ x: e.x + (Math.random() - 0.5) * 20, y: e.y + (Math.random() - 0.5) * 20, itemId, timer: 30, bobPhase: Math.random() * Math.PI * 2 });
    }
  }
  const goldAmt = Math.floor(e.xp * (0.5 + Math.random()));
  if (goldAmt > 0) { player.gold += goldAmt; addFloatingText(e.x + 15, e.y - 10, `+${goldAmt}g`, '#fbbf24'); }
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    particles.push({ x: e.x, y: e.y, vx: Math.cos(angle) * (40 + Math.random() * 60), vy: Math.sin(angle) * (40 + Math.random() * 60),
      life: 0.5, maxLife: 0.5, color: e.color, size: 3 });
  }
  checkLevelUp();
}

function checkLevelUp() {
  let needed = XP_PER_LEVEL(player.level);
  while (player.xp >= needed) {
    player.xp -= needed; player.level++;
    const stats = getPlayerStats();
    player.maxHp = stats.maxHp; player.hp = player.maxHp; player.maxMp = stats.maxMp; player.mp = player.maxMp;
    addFloatingText(player.x, player.y - 30, `LEVEL UP! Lv.${player.level}`, '#6366f1');
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      particles.push({ x: player.x, y: player.y, vx: Math.cos(angle) * 80, vy: Math.sin(angle) * 80, life: 0.8, maxLife: 0.8, color: '#6366f1', size: 4 });
    }
    needed = XP_PER_LEVEL(player.level);
  }
}

function damagePlayer(amount) {
  if (player.invincible > 0) return;
  const stats = getPlayerStats();
  const reduced = Math.max(1, Math.floor(amount * (1 - stats.def * 0.02)));
  player.hp -= reduced; player.hurtTimer = 0.2; player.invincible = 0.5;
  addFloatingText(player.x, player.y - 20, `-${reduced}`, '#dc2626');
  if (player.hp <= 0) playerDeath();
}

function playerDeath() {
  player.deaths++;
  player.gold = Math.floor(player.gold * 0.9);
  deathScreenVisible = true;
  document.getElementById('death-screen').style.display = 'flex';
}

function respawn() {
  deathScreenVisible = false;
  document.getElementById('death-screen').style.display = 'none';
  const stats = getPlayerStats();
  player.hp = stats.maxHp; player.mp = stats.maxMp; player.invincible = 3;
  enterZone('starter-meadow');
}

// ============================================================
// LOOT
// ============================================================
function checkLootPickup() {
  for (let i = lootBags.length - 1; i >= 0; i--) {
    const b = lootBags[i];
    const dx = player.x - b.x, dy = player.y - b.y;
    if (dx * dx + dy * dy < 900) {
      if (player.inventory.length >= 20) { addFloatingText(b.x, b.y - 10, 'Full!', '#dc2626'); continue; }
      if (WEAPONS[b.itemId]) player.inventory.push({ id: b.itemId, type: 'weapon' });
      else if (GEAR[b.itemId]) player.inventory.push({ id: b.itemId, type: 'gear' });
      const item = WEAPONS[b.itemId] || GEAR[b.itemId];
      if (item) addFloatingText(b.x, b.y - 10, item.name, RARITY_COLORS[item.rarity] || '#fff');
      lootBags.splice(i, 1);
    }
  }
}
