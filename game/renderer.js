// ============================================================
// RENDERING
// ============================================================
function draw() {
  ctx.fillStyle = currentZone?.bg || '#0a0a0a'; ctx.fillRect(0, 0, W, H);
  if (!currentZone || !player) return;
  const ts = currentZone.tileSize;
  camera.x += (player.x - W / 2 - camera.x) * 0.1; camera.y += (player.y - H / 2 - camera.y) * 0.1;
  ctx.save(); ctx.translate(-camera.x, -camera.y);
  
  // ============================================================
  // RADIUS SHADOWS - Shadow System with Stats
  // ============================================================
  const playerStats = getPlayerStats();
  const shadowRadius = playerStats.radiusShadows || 100;
  const shadowMultiplier = playerStats.shadowCoverage || 1;
  const shadowRadiusEffective = shadowRadius * shadowMultiplier;
  
  // Calculate center of shadow based on player position
  const shadowCenterX = player.x;
  const shadowCenterY = player.y;
  
  // Create radial gradient for shadow layer - dark overlay
  const shadowGradient = ctx.createRadialGradient(shadowCenterX, shadowCenterY, 0, shadowCenterX, shadowCenterY, shadowRadiusEffective);
  shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Transparent at center - fully visible
  shadowGradient.addColorStop(0.2, 'rgba(0, 0, 0, 0.05)'); // Very light fade - 95% visible
  shadowGradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.15)'); // Light fade - 85% visible
  shadowGradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.35)'); // Medium fade - 65% visible
  shadowGradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.65)'); // Dark fade - 35% visible
  shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)'); // Dark at edges - 10% visible
  
  // Apply shadow overlay using multiply composite operation
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = shadowGradient;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  
  // ============================================================
  // FOG OF WAR - Visibility Cone System
  // ============================================================
  const fogRadius = shadowRadiusEffective * 1.5; // Extended radius for shadow effect
  const fogCenterX = player.x;
  const fogCenterY = player.y;
  
  // Create radial gradient mask for fog of war
  const fogGradient = ctx.createRadialGradient(fogCenterX, fogCenterY, 0, fogCenterX, fogCenterY, fogRadius);
  fogGradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Transparent at center - fully visible
  fogGradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.1)'); // Light fade - 90% visible
  fogGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)'); // Medium fade - 50% visible
  fogGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)'); // Dark at edges - 10% visible
  
  // Apply fog of war overlay using multiply composite operation
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = fogGradient;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  
  const startX = Math.max(0, Math.floor(camera.x / ts)), startY = Math.max(0, Math.floor(camera.y / ts));
  const endX = Math.min(currentZone.width, Math.ceil((camera.x + W) / ts) + 1), endY = Math.min(currentZone.height, Math.ceil((camera.y + H) / ts) + 1);
  for (let y = startY; y < endY; y++) for (let x = startX; x < endX; x++) {
    const tile = zoneMap[y]?.[x];
    if (tile === 1) { ctx.fillStyle = currentZone.wallColor; ctx.fillRect(x * ts, y * ts, ts, ts);
      ctx.fillStyle = currentZone.accentColor + '30'; ctx.fillRect(x * ts + 4, y * ts + 4, ts - 8, ts - 8); }
    else if (tile === 0) { ctx.strokeStyle = currentZone.wallColor + '40'; ctx.strokeRect(x * ts, y * ts, ts, ts); }
  }
  for (const p of currentZone.portals) {
    const px = p.x * ts + (p.w * ts) / 2, py = p.y * ts + (p.h * ts) / 2;
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 300);
    ctx.fillStyle = `rgba(99,102,241,${0.3 + pulse * 0.3})`; ctx.beginPath(); ctx.arc(px, py, 16 + pulse * 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(p.label || '', px, py - 22);
  }
  for (const b of lootBags) {
    const bob = Math.sin(performance.now() / 300 + b.bobPhase) * 3;
    const item = WEAPONS[b.itemId] || GEAR[b.itemId]; const color = item ? RARITY_COLORS[item.rarity] : '#fff';
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(b.x, b.y + bob, 6, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  }
  for (const e of entities) {
    if (e.dead) continue; const flash = e.hurtTimer > 0; ctx.fillStyle = flash ? '#fff' : e.color;
    if (e.ai === 'boss') { ctx.shadowColor = e.color; ctx.shadowBlur = 15; ctx.fillRect(e.x - e.size / 2, e.y - e.size / 2, e.size, e.size); ctx.shadowBlur = 0; }
    else if (e.size > 18) ctx.fillRect(e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);
    else { ctx.beginPath(); ctx.arc(e.x, e.y, e.size / 2, 0, Math.PI * 2); ctx.fill(); }
    if (e.hp < e.maxHp) { const bw = e.size + 8; ctx.fillStyle = '#333'; ctx.fillRect(e.x - bw / 2, e.y - e.size / 2 - 8, bw, 4);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(e.x - bw / 2, e.y - e.size / 2 - 8, bw * (e.hp / e.maxHp), 4); }
    ctx.fillStyle = '#ccc'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(e.name, e.x, e.y - e.size / 2 - 12);
  }
  // Remote players
  for (const [, rp] of remotePlayers) {
    if (rp.hp <= 0) continue;
    const flash = rp.hurtTimer > 0;
    ctx.fillStyle = flash ? '#fff' : (rp.color || '#888');
    const angle = Math.atan2(rp.facing?.y || 0, rp.facing?.x || 1);
    ctx.save(); ctx.translate(rp.x, rp.y); ctx.rotate(angle);
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -9); ctx.lineTo(-8, 9); ctx.closePath();
    ctx.fill(); ctx.shadowColor = rp.color || '#888'; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(rp.name || '?', rp.x, rp.y - 18);
    ctx.fillText(`Lv.${rp.level || 1}`, rp.x, rp.y - 28);
    // HP bar
    if (rp.hp < (rp.maxHp || 100)) {
      const bw = 30; ctx.fillStyle = '#333'; ctx.fillRect(rp.x - bw / 2, rp.y - 36, bw, 3);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(rp.x - bw / 2, rp.y - 36, bw * (rp.hp / (rp.maxHp || 100)), 3);
    }
  }
  for (const p of projectiles) { ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 6; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
  if (!(player.invincible > 0 && Math.floor(performance.now() / 100) % 2 === 0)) {
    const flash = player.hurtTimer > 0; ctx.fillStyle = flash ? '#fff' : player.color;
    const angle = Math.atan2(player.facing.y, player.facing.x);
    ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(angle);
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -9); ctx.lineTo(-8, 9); ctx.closePath();
    ctx.fill(); ctx.shadowColor = player.color; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
  }
  ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(player.name, player.x, player.y - 18);
  for (const p of particles) { ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); }
  ctx.globalAlpha = 1;
  for (const t of floatingTexts) { ctx.globalAlpha = t.life / t.maxLife; ctx.fillStyle = t.color; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t.text, t.x, t.y); }
  ctx.globalAlpha = 1; ctx.restore();
  const stats = getPlayerStats();
  document.getElementById('hp-bar').style.width = `${(player.hp / stats.maxHp) * 100}%`;
  document.getElementById('mp-bar').style.width = `${(player.mp / stats.maxMp) * 100}%`;
  document.getElementById('xp-bar').style.width = `${(player.xp / XP_PER_LEVEL(player.level)) * 100}%`;
  document.getElementById('player-level').textContent = player.level;
  document.getElementById('gold-display').textContent = player.gold;
  drawMinimap();
  if (isMobile) drawJoystick();
}

function drawMinimap() {
  if (!currentZone) return;
  mmCtx.fillStyle = 'rgba(0,0,0,0.7)'; mmCtx.fillRect(0, 0, 140, 140);
  const scale = Math.min(140 / currentZone.width, 140 / currentZone.height);
  for (let y = 0; y < currentZone.height; y++) for (let x = 0; x < currentZone.width; x++) {
    if (zoneMap[y]?.[x] === 1) { mmCtx.fillStyle = currentZone.wallColor; mmCtx.fillRect(x * scale, y * scale, Math.max(1, scale), Math.max(1, scale)); } }
  for (const p of currentZone.portals) { mmCtx.fillStyle = '#6366f1'; mmCtx.fillRect(p.x * scale, p.y * scale, p.w * scale + 2, p.h * scale + 2); }
  for (const e of entities) { if (e.dead) continue; mmCtx.fillStyle = e.color;
    mmCtx.fillRect(e.x / currentZone.tileSize * scale - 1, e.y / currentZone.tileSize * scale - 1, 2, 2); }
  for (const [, rp] of remotePlayers) {
    if (rp.hp <= 0) continue; mmCtx.fillStyle = rp.color || '#60a5fa';
    mmCtx.fillRect(rp.x / currentZone.tileSize * scale - 1, rp.y / currentZone.tileSize * scale - 1, 3, 3); }
  mmCtx.fillStyle = '#fff';
  mmCtx.fillRect(player.x / currentZone.tileSize * scale - 2, player.y / currentZone.tileSize * scale - 2, 4, 4);
}

function drawJoystick() {
  jCtx.clearRect(0, 0, 120, 120);
  jCtx.strokeStyle = 'rgba(99,102,241,0.3)';
  jCtx.lineWidth = 2; jCtx.beginPath(); jCtx.arc(60, 60, 50, 0, Math.PI * 2); jCtx.stroke();
  const stickX = Math.max(10, Math.min(110, 60 - (isMobile ? input.stickX : 0)));
  const stickY = Math.max(10, Math.min(110, 60 - (isMobile ? input.stickY : 0)));
  jCtx.fillStyle = 'rgba(99,102,241,0.6)'; jCtx.beginPath(); jCtx.arc(stickX, stickY, 20, 0, Math.PI * 2); jCtx.fill();
}

// ============================================================
// DRAW FOG OVERLAY - Radial Gradient Shadow System
// ============================================================
function drawFog() {
  if (!currentZone || !player) return;
  const ts = currentZone.tileSize;
  const shadowRadius = getPlayerStats().radiusShadows || 100;
  const shadowMultiplier = getPlayerStats().shadowCoverage || 1;
  const shadowRadiusEffective = shadowRadius * shadowMultiplier;
  const fogRadius = shadowRadiusEffective * 1.5;
  const fogCenterX = player.x;
  const fogCenterY = player.y;
  
  // Create radial gradient mask for fog of war
  const fogGradient = ctx.createRadialGradient(fogCenterX, fogCenterY, 0, fogCenterX, fogCenterY, fogRadius);
  fogGradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Transparent at center - fully visible
  fogGradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.1)'); // Light fade - 90% visible
  fogGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)'); // Medium fade - 50% visible
  fogGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)'); // Dark at edges - 10% visible
  
  // Apply fog of war overlay using multiply composite operation
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = fogGradient;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
}

// ============================================================
// DRAW SHADOW STATS - Player Stats Display
// ============================================================
function drawShadowStats() {
  if (!currentZone || !player) return;
  const stats = getPlayerStats();
  const shadowRadius = stats.radiusShadows || 100;
  const shadowMultiplier = stats.shadowCoverage || 1;
  const shadowRadiusEffective = shadowRadius * shadowMultiplier;
  
  // Draw shadow radius indicator
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(player.x, player.y, shadowRadiusEffective, 0, Math.PI * 2);
  ctx.stroke();
  
  // Draw shadow radius text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Shadow Radius: ${Math.round(shadowRadiusEffective)}px`, player.x, player.y - shadowRadiusEffective - 10);
  
  // Draw shadow coverage text
  ctx.fillText(`Coverage: ${Math.round(shadowMultiplier * 100)}%`, player.x, player.y - shadowRadiusEffective - 5);
}

// ============================================================
// DRAW CONTROL INDICATORS - Clear Hotkeys/Controls
// ============================================================
function drawControlIndicators() {
  if (!currentZone || !player) return;
  
  // Draw control overlay in top-left corner
  const overlayX = 10;
  const overlayY = 10;
  const overlayWidth = 220;
  const overlayHeight = 140;
  
  // Semi-transparent background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(overlayX, overlayY, overlayWidth, overlayHeight);
  
  // Title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Controls', overlayX + 10, overlayY + 20);
  
  // Control list
  const controls = [
    { key: 'WASD', action: 'Move', color: 'rgba(99, 102, 241, 1)' },
    { key: 'Mouse', action: 'Aim & Click', color: 'rgba(99, 102, 241, 1)' },
    { key: 'R', action: 'Reload', color: 'rgba(99, 102, 241, 1)' },
    { key: 'E', action: 'Interact', color: 'rgba(99, 102, 241, 1)' },
    { key: 'F', action: 'Loot', color: 'rgba(99, 102, 241, 1)' },
    { key: 'G', action: 'Drop Item', color: 'rgba(99, 102, 241, 1)' },
    { key: 'Space', action: 'Jump', color: 'rgba(99, 102, 241, 1)' },
    { key: '1-4', action: 'Select Weapon', color: 'rgba(99, 102, 241, 1)' },
    { key: 'Tab', action: 'Open Inventory', color: 'rgba(99, 102, 241, 1)' },
    { key: 'Esc', action: 'Pause Menu', color: 'rgba(99, 102, 241, 1)' }
  ];
  
  let startY = overlayY + 40;
  for (const ctrl of controls) {
    ctx.fillStyle = ctrl.color;
    ctx.font = '10px sans-serif';
    ctx.fillText(`${ctrl.key} - ${ctrl.action}`, overlayX + 10, startY);
    startY += 16;
  }
  
  // Mobile controls hint
  if (isMobile) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '10px sans-serif';
    ctx.fillText('Tap left side to move', overlayX + 10, startY + 10);
    ctx.fillText('Tap right side to aim', overlayX + 10, startY + 25);
    ctx.fillText('Tap center to attack', overlayX + 10, startY + 40);
  }
}

// ============================================================
// DRAW ZONE INFO - Zone Name and Difficulty
// ============================================================
function drawZoneInfo() {
  if (!currentZone) return;
  
  const overlayX = 10;
  const overlayY = 10;
  
  // Zone name
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(currentZone.name || 'Unknown Zone', overlayX + 10, overlayY + 30);
  
  // Zone difficulty
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '11px sans-serif';
  ctx.fillText(`Difficulty: ${currentZone.difficulty || 'Normal'}`, overlayX + 10, overlayY + 45);
  
  // Zone size
  ctx.fillText(`Size: ${currentZone.width} x ${currentZone.height} tiles`, overlayX + 10, overlayY + 60);
}

// ============================================================
// DRAW LOOT INDICATORS - Pending Loot Display
// ============================================================
function drawLootIndicators() {
  if (!currentZone || !player) return;
  
  const overlayX = 10;
  const overlayY = 10;
  
  // Draw loot count
  const lootCount = lootBags.length;
  if (lootCount > 0) {
    ctx.fillStyle = 'rgba(234, 179, 8, 1)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Loot: ${lootCount} items`, overlayX + 10, overlayY + 80);
  }
  
  // Draw entity count
  const entityCount = entities.filter(e => !e.dead).length;
  if (entityCount > 0) {
    ctx.fillStyle = 'rgba(239, 68, 68, 1)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Enemies: ${entityCount}`, overlayX + 10, overlayY + 95);
  }
}

// ============================================================
// DRAW PORTAL INDICATORS - Portal Status and Labels
// ============================================================
function drawPortalIndicators() {
  if (!currentZone) return;
  
  for (const p of currentZone.portals) {
    const px = p.x * currentZone.tileSize + (p.w * currentZone.tileSize) / 2;
    const py = p.y * currentZone.tileSize + (p.h * currentZone.tileSize) / 2;
    
    // Portal pulse effect
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 300);
    
    // Portal glow
    ctx.fillStyle = `rgba(99,102,241,${0.3 + pulse * 0.3})`;
    ctx.beginPath();
    ctx.arc(px, py, 16 + pulse * 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Portal label
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.label || '', px, py - 22);
    
    // Portal status indicator
    if (p.active) {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
      ctx.fillRect(px - 8, py - 30, 16, 4);
    } else {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.fillRect(px - 8, py - 30, 16, 4);
    }
  }
}

// ============================================================
// DRAW ENEMY TYPE INDICATORS - Visual Enemy Type Badges
// ============================================================
function drawEnemyTypeIndicators() {
  if (!currentZone) return;
  
  for (const e of entities) {
    if (e.dead) continue;
    
    // Enemy type badge
    const badgeSize = 12;
    const badgeX = e.x - badgeSize / 2;
    const badgeY = e.y - e.size / 2 - badgeSize - 4;
    
    // Badge background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, 4);
    ctx.fill();
    
    // Badge icon based on enemy type
    if (e.type === 'melee') {
      ctx.fillStyle = 'rgba(99, 102, 241, 1)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚔️', badgeX + badgeSize / 2, badgeY + 9);
    } else if (e.type === 'ranged') {
      ctx.fillStyle = 'rgba(234, 179, 8, 1)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔫', badgeX + badgeSize / 2, badgeY + 9);
    } else if (e.type === 'tank') {
      ctx.fillStyle = 'rgba(234, 67, 53, 1)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛡️', badgeX + badgeSize / 2, badgeY + 9);
    } else if (e.type === 'caster') {
      ctx.fillStyle = 'rgba(167, 139, 250, 1)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✨', badgeX + badgeSize / 2, badgeY + 9);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', badgeX + badgeSize / 2, badgeY + 9);
    }
  }
}

// ============================================================
// DRAW PLAYER STATS - Enhanced Stats Display
// ============================================================
function drawPlayerStats() {
  if (!currentZone || !player) return;
  
  const stats = getPlayerStats();
  const overlayX = 10;
  const overlayY = 10;
  
  // Stats title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Player Stats', overlayX + 10, overlayY + 120);
  
  // Health
  ctx.fillStyle = 'rgba(239, 68, 68, 1)';
  ctx.font = '10px sans-serif';
  ctx.fillText(`HP: ${Math.round(player.hp)}/${stats.maxHp}`, overlayX + 10, overlayY + 135);
  
  // Mana
  ctx.fillStyle = 'rgba(99, 102, 241, 1)';
  ctx.fillText(`MP: ${Math.round(player.mp)}/${stats.maxMp}`, overlayX + 10, overlayY + 150);
  
  // XP
  ctx.fillStyle = 'rgba(234, 179, 8, 1)';
  ctx.fillText(`XP: ${Math.round(player.xp)}/${XP_PER_LEVEL(player.level)}`, overlayX + 10, overlayY + 165);
  
  // Level
  ctx.fillStyle = 'rgba(167, 139, 250, 1)';
  ctx.fillText(`Level: ${player.level}`, overlayX + 10, overlayY + 180);
  
  // Gold
  ctx.fillStyle = 'rgba(234, 179, 8, 1)';
  ctx.fillText(`Gold: ${player.gold}`, overlayX + 10, overlayY + 195);
  
  // Shadow radius
  ctx.fillStyle = 'rgba(99, 102, 241, 1)';
  ctx.fillText(`Shadow Radius: ${Math.round(stats.radiusShadows || 100)}px`, overlayX + 10, overlayY + 210);
  
  // Shadow coverage
  ctx.fillText(`Coverage: ${Math.round(stats.shadowCoverage || 1) * 100}%`, overlayX + 10, overlayY + 225);
  
  // Current weapon
  const currentWeapon = player.weapon;
  const weaponName = WEAPONS[currentWeapon]?.name || 'Unknown';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(`Weapon: ${weaponName}`, overlayX + 10, overlayY + 240);
  
  // Weapon damage
  const weaponDamage = getWeaponDamage(currentWeapon);
  ctx.fillStyle = 'rgba(239, 68, 68, 1)';
  ctx.fillText(`Damage: ${Math.round(weaponDamage)}`, overlayX + 10, overlayY + 255);
}

// ============================================================
// DRAW MINIMAP
// ============================================================
function drawMinimap() {
  if (!currentZone) return;
  mmCtx.fillStyle = 'rgba(0,0,0,0.7)'; mmCtx.fillRect(0, 0, 140, 140);
  const scale = Math.min(140 / currentZone.width, 140 / currentZone.height);
  for (let y = 0; y < currentZone.height; y++) for (let x = 0; x < currentZone.width; x++) {
    if (zoneMap[y]?.[x] === 1) { mmCtx.fillStyle = currentZone.wallColor; mmCtx.fillRect(x * scale, y * scale, Math.max(1, scale), Math.max(1, scale)); } }
  for (const p of currentZone.portals) { mmCtx.fillStyle = '#6366f1'; mmCtx.fillRect(p.x * scale, p.y * scale, p.w * scale + 2, p.h * scale + 2); }
  for (const e of entities) { if (e.dead) continue; mmCtx.fillStyle = e.color;
    mmCtx.fillRect(e.x / currentZone.tileSize * scale - 1, e.y / currentZone.tileSize * scale - 1, 2, 2); }
  for (const [, rp] of remotePlayers) {
    if (rp.hp <= 0) continue; mmCtx.fillStyle = rp.color || '#60a5fa';
    mmCtx.fillRect(rp.x / currentZone.tileSize * scale - 1, rp.y / currentZone.tileSize * scale - 1, 3, 3); }
  mmCtx.fillStyle = '#fff';
  mmCtx.fillRect(player.x / currentZone.tileSize * scale - 2, player.y / currentZone.tileSize * scale - 2, 4, 4);
}

// ============================================================
// DRAW JOYSTICK
// ============================================================
function drawJoystick() {
  jCtx.clearRect(0, 0, 120, 120);
  jCtx.strokeStyle = 'rgba(99,102,241,0.3)';
  jCtx.lineWidth = 2; jCtx.beginPath(); jCtx.arc(60, 60, 50, 0, Math.PI * 2); jCtx.stroke();
  const stickX = Math.max(10, Math.min(110, 60 - (isMobile ? input.stickX : 0)));
  const stickY = Math.max(10, Math.min(110, 60 - (isMobile ? input.stickY : 0)));
  jCtx.fillStyle = 'rgba(99,102,241,0.6)'; jCtx.beginPath(); jCtx.arc(stickX, stickY, 20, 0, Math.PI * 2); jCtx.fill();
}

// ============================================================
// DRAW FOG OVERLAY - Radial Gradient Shadow System
// ============================================================
function drawFog() {
  if (!currentZone || !player) return;
  const ts = currentZone.tileSize;
  const shadowRadius = getPlayerStats().radiusShadows || 100;
  const shadowMultiplier = getPlayerStats().shadowCoverage || 1;
  const shadowRadiusEffective = shadowRadius * shadowMultiplier;
  const fogRadius = shadowRadiusEffective * 1.5;
  const fogCenterX = player.x;
  const fogCenterY = player.y;
  
  // Create radial gradient mask for fog of war
  const fogGradient = ctx.createRadialGradient(fogCenterX, fogCenterY, 0, fogCenterX, fogCenterY, fogRadius);
  fogGradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Transparent at center - fully visible
  fogGradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.1)'); // Light fade - 90% visible
  fogGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)'); // Medium fade - 50% visible
  fogGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)'); // Dark at edges - 10% visible
  
  // Apply fog of war overlay using multiply composite operation
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = fogGradient;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
}

// ============================================================
// DRAW SHADOW STATS - Player Stats Display
// ============================================================
function drawShadowStats() {
  if (!currentZone || !player) return;
  const stats = getPlayerStats();
  const shadowRadius = stats.radiusShadows || 100;
  const shadowMultiplier = stats.shadowCoverage || 1;
  const shadowRadiusEffective = shadowRadius * shadowMultiplier;
  
  // Draw shadow radius indicator
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(player.x, player.y, shadowRadiusEffective, 0, Math.PI * 2);
  ctx.stroke();
  
  // Draw shadow radius text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Shadow Radius: ${Math.round(shadowRadiusEffective)}px`, player.x, player.y - shadowRadiusEffective - 10);
  
  // Draw shadow coverage text
  ctx.fillText(`Coverage: ${Math.round(shadowMultiplier * 100)}%`, player.x, player.y - shadowRadiusEffective - 5);
}

// ============================================================
// DRAW CONTROL INDICATORS - Clear Hotkeys/Controls
// ============================================================
function drawControlIndicators() {
  if (!currentZone || !player) return;
  
  // Draw control overlay in top-left corner
  const overlayX = 10;
  const overlayY = 10;
  const overlayWidth = 220;
  const overlayHeight = 140;
  
  // Semi-transparent background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(overlayX, overlayY, overlayWidth, overlayHeight);
  
  // Title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Controls', overlayX + 10, overlayY + 20);
  
  // Control list
  const controls = [
    { key: 'WASD', action: 'Move', color: 'rgba(99, 102, 241, 1)' },
    { key: 'Mouse', action: 'Aim & Click', color: 'rgba(99, 102, 241, 1)' },
    { key: 'R', action: 'Reload', color: 'rgba(99, 102, 241, 1)' },
    { key: 'E', action: 'Interact', color: 'rgba(99, 102, 241, 1)' },
    { key: 'F', action: 'Loot', color: 'rgba(99, 102, 241, 1)' },
    { key: 'G', action: 'Drop Item', color: 'rgba(99, 102, 241, 1)' },
    { key: 'Space', action: 'Jump', color: 'rgba(99, 102, 241, 1)' },
    { key: '1-4', action: 'Select Weapon', color: 'rgba(99, 102, 241, 1)' },
    { key: 'Tab', action: 'Open Inventory', color: 'rgba(99, 102, 241, 1)' },
    { key: 'Esc', action: 'Pause Menu', color: 'rgba(99, 102, 241, 1)' }
  ];
  
  let startY = overlayY + 40;
  for (const ctrl of controls) {
    ctx.fillStyle = ctrl.color;
    ctx.font = '10px sans-serif';
    ctx.fillText(`${ctrl.key} - ${ctrl.action}`, overlayX + 10, startY);
    startY += 16;
  }
  
  // Mobile controls hint
  if (isMobile) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '10px sans-serif';
    ctx.fillText('Tap left side to move', overlayX + 10, startY + 10);
    ctx.fillText('Tap right side to aim', overlayX + 10, startY + 25);
    ctx.fillText('Tap center to attack', overlayX + 10, startY + 40);
  }
}

// ============================================================
// DRAW ZONE INFO - Zone Name and Difficulty
// ============================================================
function drawZoneInfo() {
  if (!currentZone) return;
  
  const overlayX = 10;
  const overlayY = 10;
  
  // Zone name
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(currentZone.name || 'Unknown Zone', overlayX + 10, overlayY + 30);
  
  // Zone difficulty
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '11px sans-serif';
  ctx.fillText(`Difficulty: ${currentZone.difficulty || 'Normal'}`, overlayX + 10, overlayY + 45);
  
  // Zone size
  ctx.fillText(`Size: ${currentZone.width} x ${currentZone.height} tiles`, overlayX + 10, overlayY + 60);
}

// ============================================================
// DRAW LOOT INDICATORS - Pending Loot Display
// ============================================================
function drawLootIndicators() {
  if (!currentZone || !player) return;
  
  const overlayX = 10;
  const overlayY = 10;
  
  // Draw loot count
  const lootCount = lootBags.length;
  if (lootCount > 0) {
    ctx.fillStyle = 'rgba(234, 179, 8, 1)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Loot: ${lootCount} items`, overlayX + 10, overlayY + 80);
  }
  
  // Draw entity count
  const entityCount = entities.filter(e => !e.dead).length;
  if (entityCount > 0) {
    ctx.fillStyle = 'rgba(239, 68, 68, 1)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Enemies: ${entityCount}`, overlayX + 10, overlayY + 95);
  }
}

// ============================================================
// DRAW PORTAL INDICATORS - Portal Status and Labels
// ============================================================
function drawPortalIndicators() {
  if (!currentZone) return;
  
  for (const p of currentZone.portals) {
    const px = p.x * currentZone.tileSize + (p.w * currentZone.tileSize) / 2;
    const py = p.y * currentZone.tileSize + (p.h * currentZone.tileSize) / 2;
    
    // Portal pulse effect
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 300);
    
    // Portal glow
    ctx.fillStyle = `rgba(99,102,241,${0.3 + pulse * 0.3})`;
    ctx.beginPath();
    ctx.arc(px, py, 16 + pulse * 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Portal label
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.label || '', px, py - 22);
    
    // Portal status indicator
    if (p.active) {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
      ctx.fillRect(px - 8, py - 30, 16, 4);
    } else {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.fillRect(px - 8, py - 30, 16, 4);
    }
  }
}

// ============================================================
// DRAW ENEMY TYPE INDICATORS - Visual Enemy Type Badges
// ============================================================
function drawEnemyTypeIndicators() {
  if (!currentZone) return;
  
  for (const e of entities) {
    if (e.dead) continue;
    
    // Enemy type badge
    const badgeSize = 12;
    const badgeX = e.x - badgeSize / 2;
    const badgeY = e.y - e.size / 2 - badgeSize - 4;
    
    // Badge background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, 4);
    ctx.fill();
    
    // Badge icon based on enemy type
    if (e.type === 'melee') {
      ctx.fillStyle = 'rgba(99, 102, 241, 1)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚔️', badgeX + badgeSize / 2, badgeY + 9);
    } else if (e.type === 'ranged') {
      ctx.fillStyle = 'rgba(234, 179, 8, 1)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔫', badgeX + badgeSize / 2, badgeY + 9);
    } else if (e.type === 'tank') {
      ctx.fillStyle = 'rgba(234, 67, 53, 1)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛡️', badgeX + badgeSize / 2, badgeY + 9);
    } else if (e.type === 'caster') {
      ctx.fillStyle = 'rgba(167, 139, 250, 1)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✨', badgeX + badgeSize / 2, badgeY + 9);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', badgeX + badgeSize / 2, badgeY + 9);
    }
  }
}

// ============================================================
// DRAW PLAYER STATS - Enhanced Stats Display
// ============================================================
function drawPlayerStats() {
  if (!currentZone || !player) return;
  
  const stats = getPlayerStats();
  const overlayX = 10;
  const overlayY = 10;
  
  // Stats title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Player Stats', overlayX + 10, overlayY + 120);
  
  // Health
  ctx.fillStyle = 'rgba(239, 68, 68, 1)';
  ctx.font = '10px sans-serif';
  ctx.fillText(`HP: ${Math.round(player.hp)}/${stats.maxHp}`, overlayX + 10, overlayY + 135);
  
  // Mana
  ctx.fillStyle = 'rgba(99, 102, 241, 1)';
  ctx.fillText(`MP: ${Math.round(player.mp)}/${stats.maxMp}`, overlayX + 10, overlayY + 150);
  
  // XP
  ctx.fillStyle = 'rgba(234, 179, 8, 1)';
  ctx.fillText(`XP: ${Math.round(player.xp)}/${XP_PER_LEVEL(player.level)}`, overlayX + 10, overlayY + 165);
  
  // Level
  ctx.fillStyle = 'rgba(167, 139, 250, 1)';
  ctx.fillText(`Level: ${player.level}`, overlayX + 10, overlayY + 180);
  
  // Gold
  ctx.fillStyle = 'rgba(234, 179, 8, 1)';
  ctx.fillText(`Gold: ${player.gold}`, overlayX + 10, overlayY + 195);
  
  // Shadow radius
  ctx.fillStyle = 'rgba(99, 102, 241, 1)';
  ctx.fillText(`Shadow Radius: ${Math.round(stats.radiusShadows || 100)}px`, overlayX + 10, overlayY + 210);
  
  // Shadow coverage
  ctx.fillText(`Coverage: ${Math.round(stats.shadowCoverage || 1) * 100}%`, overlayX + 10, overlayY + 225);
  
  // Current weapon
  const currentWeapon = player.weapon;
  const weaponName = WEAPONS[currentWeapon]?.name || 'Unknown';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(`Weapon: ${weaponName}`, overlayX + 10, overlayY + 240);
  
  // Weapon damage
  const weaponDamage = getWeaponDamage(currentWeapon);
  ctx.fillStyle = 'rgba(239, 68, 68, 1)';
  ctx.fillText(`Damage: ${Math.round(weaponDamage)}`, overlayX + 10, overlayY + 255);
}
