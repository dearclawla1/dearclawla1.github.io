// ============================================================
// GAME LOOP
// ============================================================
let lastTime = 0;
function gameLoop(timestamp) {
  if (!gameStarted || !player || deathScreenVisible) { requestAnimationFrame(gameLoop); return; }
  const dt = Math.min(0.05, (timestamp - lastTime) / 1000); lastTime = timestamp;
  processInput();
  const stats = getPlayerStats();
  player.vx = input.x * stats.speed; player.vy = input.y * stats.speed;
  moveWithCollision(player, dt);
  player.mp = Math.min(stats.maxMp, player.mp + dt * 2);
  player.hurtTimer = Math.max(0, player.hurtTimer - dt);
  player.invincible = Math.max(0, player.invincible - dt);
  if (input.attack) playerAttack();
  for (let i = lootBags.length - 1; i >= 0; i--) { lootBags[i].timer -= dt; if (lootBags[i].timer <= 0) lootBags.splice(i, 1); }
  updateEnemies(dt); updateProjectiles(dt); updateParticles(dt); checkPortals(); checkLootPickup();
  updateRemotePlayers(dt); sendMove(); checkPvpHits();
  draw(); requestAnimationFrame(gameLoop);
}

// ============================================================
// START
// ============================================================
function selectClass(cls) {
  const name = document.getElementById('name-input').value.trim() || 'Hero';
  player = createPlayer(name, cls);
  document.getElementById('player-name').textContent = name;
  document.getElementById('player-class').textContent = CLASSES[cls].name;
  document.getElementById('class-select').style.display = 'none';
  gameStarted = true; enterZone('starter-meadow');
  lastTime = performance.now(); requestAnimationFrame(gameLoop);
  fetch(`${API_BASE}/api/store/game-players`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { name, class: cls, level: 1, timestamp: new Date().toISOString() } }) }).catch(() => {});
}
requestAnimationFrame(gameLoop);
