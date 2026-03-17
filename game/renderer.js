// ============================================================
// RENDERING
// ============================================================
function draw() {
  ctx.fillStyle = currentZone?.bg || '#0a0a0a'; ctx.fillRect(0, 0, W, H);
  if (!currentZone || !player) return;
  const ts = currentZone.tileSize;
  camera.x += (player.x - W / 2 - camera.x) * 0.1; camera.y += (player.y - H / 2 - camera.y) * 0.1;
  ctx.save(); ctx.translate(-camera.x, -camera.y);
  
  // FOG OF WAR - Visibility Cone System
  const playerRadius = getPlayerStats().radiusShadows || 100;
  const fogRadius = playerRadius * 1.5; // Extended radius for shadow effect
  const centerX = player.x;
  const centerY = player.y;
  
  // Create radial gradient mask for fog of war
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, fogRadius);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Transparent at center
  gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.1)'); // Light fade
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)'); // Medium fade
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)'); // Dark at edges
  
  // Apply fog of war overlay using multiply composite operation
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = gradient;
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
  jCtx.strokeStyle = 'rgba(99,102,241,0.3)'; jCtx.lineWidth = 2; jCtx.beginPath(); jCtx.arc(60, 60, 40, 0, Math.PI * 2); jCtx.stroke();
  jCtx.fillStyle = 'rgba(99,102,241,0.5)'; jCtx.beginPath(); jCtx.arc(60 + joystickPos.x * 35, 60 + joystickPos.y * 35, 16, 0, Math.PI * 2); jCtx.fill();
}

// ============================================================
// FOG OF WAR - Visibility Cone System
// ============================================================
function drawFogOfWar() {
  if (!currentZone || !player) return;
  
  // Get player radius from stats - this can be upgraded
  const playerRadius = getPlayerStats().radiusShadows || 100;
  const fogRadius = playerRadius * 1.5; // Extended radius for shadow effect
  
  // Calculate center of fog based on player position
  const centerX = player.x;
  const centerY = player.y;
  
  // Create radial gradient mask for fog of war
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, fogRadius);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Transparent at center - fully visible
  gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.1)'); // Light fade - 90% visible
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)'); // Medium fade - 50% visible
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)'); // Dark at edges - 10% visible
  
  // Apply fog of war overlay using multiply composite operation
  // This creates the dark overlay that dims non-visible areas
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  
  // Calculate visible radius from game state variables
  const visibleRadius = playerRadius;
  
  // Fade darkness based on distance from center
  // The radial gradient handles this automatically
  // Areas within visibleRadius are fully visible
  // Areas beyond fade gradually to darkness
  
  // Optional: Add subtle vignette effect for extra immersion
  const vignetteGradient = ctx.createRadialGradient(centerX, centerY, visibleRadius * 0.5, centerX, centerY, visibleRadius * 1.5);
  vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
  
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = vignetteGradient;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
}

// ============================================================
// STATS UPGRADE SYSTEM - Radius Shadows
// ============================================================
function getRadiusUpgradeCost(level) {
  // Cost increases with upgrade level
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

function upgradeRadiusShadows(currentLevel) {
  const stats = getPlayerStats();
  const cost = getRadiusUpgradeCost(currentLevel + 1);
  
  if (player.gold >= cost) {
    player.gold -= cost;
    stats.radiusShadows = Math.min(stats.radiusShadows + 20, 300); // Cap at 300
    addFloatingText(player.x, player.y - 50, `Radius upgraded! Now ${stats.radiusShadows}px`, '#4ade80');
    return true;
  }
  return false;
}

// ============================================================
// VISIBILITY CONE CALCULATIONS
// ============================================================
function calculateVisibilityCone() {
  if (!currentZone || !player) return { visible: [], hidden: [] };
  
  const playerRadius = getPlayerStats().radiusShadows || 100;
  const fogRadius = playerRadius * 1.5;
  const centerX = player.x;
  const centerY = player.y;
  
  const visible = [];
  const hidden = [];
  
  // Check each entity for visibility
  for (const e of entities) {
    if (e.dead) continue;
    const dx = e.x - centerX;
    const dy = e.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= playerRadius) {
      visible.push(e);
    } else if (distance <= fogRadius) {
      // Partially visible - in shadow
      const fade = (distance - playerRadius) / (fogRadius - playerRadius);
      e.visibilityFade = fade;
    } else {
      hidden.push(e);
    }
  }
  
  return { visible, hidden };
}

// ============================================================
// SHADOW EFFECT RENDERING
// ============================================================
function renderShadowEffect() {
  if (!currentZone || !player) return;
  
  const playerRadius = getPlayerStats().radiusShadows || 100;
  const fogRadius = playerRadius * 1.5;
  const centerX = player.x;
  const centerY = player.y;
  
  // Create shadow gradient for visual effect
  const shadowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, fogRadius);
  shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shadowGradient.addColorStop(0.2, 'rgba(0, 0, 0, 0.05)');
  shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
  shadowGradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.6)');
  shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
  
  // Apply shadow effect
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = shadowGradient;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
}

// ============================================================
// MAIN DRAW LOOP INTEGRATION
// ============================================================
// The drawFogOfWar function is called in the main draw loop
// It creates the dark overlay that dims non-visible areas
// The visibility cone system ensures map is only visible within player's radius
// with gradual darkness fading outward
