// ============================================================
// COLLISION
// ============================================================
function moveWithCollision(ent, dt) {
  if (!currentZone || !zoneMap) return;
  const ts = currentZone.tileSize;
  const newX = ent.x + ent.vx * dt, newY = ent.y + ent.vy * dt;
  const tileX = Math.floor(newX / ts), tileY = Math.floor(ent.y / ts);
  if (tileX >= 0 && tileX < currentZone.width && tileY >= 0 && tileY < currentZone.height && zoneMap[tileY][tileX] === 0) ent.x = newX;
  const tileX2 = Math.floor(ent.x / ts), tileY2 = Math.floor(newY / ts);
  if (tileX2 >= 0 && tileX2 < currentZone.width && tileY2 >= 0 && tileY2 < currentZone.height && zoneMap[tileY2][tileX2] === 0) ent.y = newY;
  ent.x = Math.max(12, Math.min(currentZone.width * ts - 12, ent.x));
  ent.y = Math.max(12, Math.min(currentZone.height * ts - 12, ent.y));
}

// ============================================================
// PROJECTILES
// ============================================================
function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.traveled += Math.sqrt(p.vx * p.vx + p.vy * p.vy) * dt;
    const ts = currentZone.tileSize;
    const tx = Math.floor(p.x / ts), ty = Math.floor(p.y / ts);
    if (tx < 0 || ty < 0 || tx >= currentZone.width || ty >= currentZone.height || (zoneMap[ty] && zoneMap[ty][tx] !== 0)) { projectiles.splice(i, 1); continue; }
    if (p.traveled > p.range) { projectiles.splice(i, 1); continue; }
    if (p.owner === 'player') {
      for (const e of entities) {
        if (e.dead) continue;
        const dx = p.x - e.x, dy = p.y - e.y;
        if (dx * dx + dy * dy < (e.size + p.size) * (e.size + p.size)) {
          damageEntity(e, p.damage); projectiles.splice(i, 1);
          for (let j = 0; j < 4; j++) particles.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 80,
            life: 0.3, maxLife: 0.3, color: p.color, size: 2 });
          break;
        }
      }
    }
  }
}

// ============================================================
// PARTICLES & TEXT
// ============================================================
function addFloatingText(x, y, text, color) { floatingTexts.push({ x, y, text, color, life: 1.2, maxLife: 1.2 }); }
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.95; p.vy *= 0.95; p.life -= dt; if (p.life <= 0) particles.splice(i, 1); }
  for (let i = floatingTexts.length - 1; i >= 0; i--) { const t = floatingTexts[i]; t.y -= 30 * dt; t.life -= dt; if (t.life <= 0) floatingTexts.splice(i, 1); }
}
