// ============================================================
// ENEMY AI
// ============================================================
function updateEnemies(dt) {
  const now = performance.now() / 1000;
  for (const e of entities) {
    if (e.dead) { if (now >= e.respawnTime) { e.dead = false; e.hp = e.maxHp; const z = currentZone; let ex, ey, tries = 0;
      do { ex = Math.floor(Math.random() * (z.width - 4)) + 2; ey = Math.floor(Math.random() * (z.height - 4)) + 2; tries++; }
      while (tries < 30 && zoneMap[ey] && zoneMap[ey][ex] !== 0);
      e.x = ex * z.tileSize + z.tileSize / 2; e.y = ey * z.tileSize + z.tileSize / 2; } continue; }
    e.hurtTimer = Math.max(0, (e.hurtTimer || 0) - dt);
    const dx = player.x - e.x, dy = player.y - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (e.ai === 'wander') {
      e.wanderTimer -= dt;
      if (dist < 150) { e.vx = (dx / dist) * e.speed; e.vy = (dy / dist) * e.speed; }
      else if (e.wanderTimer <= 0) { e.wanderAngle += (Math.random() - 0.5) * 2; e.wanderTimer = 1 + Math.random() * 2;
        e.vx = Math.cos(e.wanderAngle) * e.speed * 0.4; e.vy = Math.sin(e.wanderAngle) * e.speed * 0.4; }
    } else if (e.ai === 'chase') {
      if (dist < 300) { e.vx = (dx / dist) * e.speed; e.vy = (dy / dist) * e.speed; } else { e.vx *= 0.9; e.vy *= 0.9; }
    } else if (e.ai === 'swoop') {
      if (dist < 200) { const angle = Math.atan2(dy, dx) + 0.05; e.vx = Math.cos(angle) * e.speed; e.vy = Math.sin(angle) * e.speed;
        if (dist < 60) { e.vx = (dx / dist) * e.speed * 1.5; e.vy = (dy / dist) * e.speed * 1.5; } }
      else { e.wanderTimer -= dt; if (e.wanderTimer <= 0) { e.wanderAngle += (Math.random() - 0.5) * 3; e.wanderTimer = 0.5 + Math.random(); }
        e.vx = Math.cos(e.wanderAngle) * e.speed; e.vy = Math.sin(e.wanderAngle) * e.speed; }
    } else if (e.ai === 'guard') {
      if (dist < 100) { e.vx = (dx / dist) * e.speed; e.vy = (dy / dist) * e.speed; } else { e.vx *= 0.85; e.vy *= 0.85; }
    } else if (e.ai === 'boss') {
      if (dist < 400) { e.vx = (dx / dist) * e.speed; e.vy = (dy / dist) * e.speed;
        if (dist < 200 && Math.random() < 0.005) { e.vx = (dx / dist) * e.speed * 3; e.vy = (dy / dist) * e.speed * 3; } }
      else { e.vx *= 0.9; e.vy *= 0.9; }
    }
    moveWithCollision(e, dt);
    if (!e.dead && dist < e.size + 14) { e.attackCooldown -= dt; if (e.attackCooldown <= 0) { damagePlayer(e.damage); e.attackCooldown = 1.0; } }
  }
}
