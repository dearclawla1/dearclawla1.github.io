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
  jCtx.strokeStyle = 'rgba(99,102,241,0.3)'; jCtx.lineWidth = 2; jCtx.beginPath(); jCtx.arc(60, 60, 40, 0, Math.PI * 2); jCtx.stroke();
  jCtx.fillStyle = 'rgba(99,102,241,0.5)'; jCtx.beginPath(); jCtx.arc(60 + joystickPos.x * 35, 60 + joystickPos.y * 35, 16, 0, Math.PI * 2); jCtx.fill();
}

// ============================================================
// RADIUS SHADOWS - Shadow System with Stats
// ============================================================
function calculateShadowRadius() {
  const playerStats = getPlayerStats();
  const baseRadius = playerStats.radiusShadows || 100;
  const coverageMultiplier = playerStats.shadowCoverage || 1;
  return baseRadius * coverageMultiplier;
}

function renderShadows() {
  if (!currentZone || !player) return;
  
  const shadowRadius = calculateShadowRadius();
  const shadowCenterX = player.x;
  const shadowCenterY = player.y;
  
  // Create radial gradient for shadow layer - dark overlay
  const shadowGradient = ctx.createRadialGradient(shadowCenterX, shadowCenterY, 0, shadowCenterX, shadowCenterY, shadowRadius);
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
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
}

// ============================================================
// SHADOW STATS DISPLAY - Optional UI for Shadow System
// ============================================================
function drawShadowStats() {
  if (!currentZone || !player) return;
  
  const playerStats = getPlayerStats();
  const shadowRadius = playerStats.radiusShadows || 100;
  const coverageMultiplier = playerStats.shadowCoverage || 1;
  
  // Draw shadow radius indicator near player
  const indicatorSize = 30;
  const indicatorX = player.x - indicatorSize;
  const indicatorY = player.y - indicatorSize;
  
  // Draw shadow radius circle
  ctx.strokeStyle = 'rgba(99,102,241,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(indicatorX, indicatorY, shadowRadius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Draw shadow radius label
  ctx.fillStyle = 'rgba(99,102,241,0.8)';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Shadow: ${Math.floor(shadowRadius)}px`, indicatorX, indicatorY - 35);
  
  // Draw coverage multiplier
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '10px sans-serif';
  ctx.fillText(`Coverage: ${coverageMultiplier.toFixed(1)}x`, indicatorX, indicatorY - 20);
}

// ============================================================
// SHADOW ENHANCEMENT - Advanced Shadow Effects
// ============================================================
function enhanceShadowEffect() {
  if (!currentZone || !player) return;
  
  const playerStats = getPlayerStats();
  const shadowRadius = playerStats.radiusShadows || 100;
  
  // Add subtle glow effect around shadow boundary
  const glowRadius = shadowRadius * 1.2;
  const glowGradient = ctx.createRadialGradient(player.x, player.y, shadowRadius, player.x, player.y, glowRadius);
  glowGradient.addColorStop(0, 'rgba(99,102,241,0)');
  glowGradient.addColorStop(0.5, 'rgba(99,102,241,0.1)');
  glowGradient.addColorStop(1, 'rgba(99,102,241,0)');
  
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = glowGradient;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
}

// ============================================================
// SHADOW COVERAGE BAR - Visual Feedback for Shadow Progress
// ============================================================
function drawShadowCoverageBar() {
  if (!currentZone || !player) return;
  
  const playerStats = getPlayerStats();
  const shadowRadius = playerStats.radiusShadows || 100;
  const coverageMultiplier = playerStats.shadowCoverage || 1;
  
  // Draw coverage bar at bottom of screen
  const barHeight = 8;
  const barWidth = 200;
  const barX = W - barWidth - 10;
  const barY = H - 20;
  
  // Draw bar background
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  // Draw coverage fill
  const fillWidth = barWidth * (coverageMultiplier / 3); // Max coverage at 3x
  ctx.fillStyle = 'rgba(99,102,241,0.8)';
  ctx.fillRect(barX, barY, Math.max(0, fillWidth), barHeight);
  
  // Draw bar label
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Shadow Coverage', barX, barY - 12);
}

// ============================================================
// SHADOW MISC - Utility Functions for Shadow System
// ============================================================
function getShadowStats() {
  const playerStats = getPlayerStats();
  return {
    radius: playerStats.radiusShadows || 100,
    coverage: playerStats.shadowCoverage || 1,
    effectiveRadius: (playerStats.radiusShadows || 100) * (playerStats.shadowCoverage || 1)
  };
}

function updateShadowStats() {
  // Called when shadow stats are updated in player system
  const shadowStats = getShadowStats();
  // Update UI elements if needed
  const shadowDisplay = document.getElementById('shadow-radius');
  if (shadowDisplay) {
    shadowDisplay.textContent = `${Math.floor(shadowStats.effectiveRadius)}px`;
  }
  
  const coverageDisplay = document.getElementById('shadow-coverage');
  if (coverageDisplay) {
    coverageDisplay.textContent = `${shadowStats.coverage.toFixed(1)}x`;
  }
}

// ============================================================
// SHADOW VISUALIZATION - Debug/Dev Tools for Shadow System
// ============================================================
function drawShadowDebug() {
  if (!currentZone || !player) return;
  
  const playerStats = getPlayerStats();
  const shadowRadius = playerStats.radiusShadows || 100;
  
  // Draw debug grid for shadow area
  const gridSize = 10;
  const gridColor = 'rgba(255,255,255,0.05)';
  
  for (let x = Math.floor(player.x / gridSize) * gridSize; x < player.x + shadowRadius + gridSize; x += gridSize) {
    for (let y = Math.floor(player.y / gridSize) * gridSize; y < player.y + shadowRadius + gridSize; y += gridSize) {
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, gridSize, gridSize);
    }
  }
}

// ============================================================
// SHADOW PERFORMANCE - Optimization for Shadow Rendering
// ============================================================
function optimizeShadowRendering() {
  // Check if shadow rendering is too expensive
  const playerStats = getPlayerStats();
  const shadowRadius = playerStats.radiusShadows || 100;
  
  // If shadow radius is very large, consider simplifying gradient
  if (shadowRadius > 500) {
    // Use simplified gradient for performance
    const simpleGradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, shadowRadius);
    simpleGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    simpleGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = simpleGradient;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ============================================================
// SHADOW INTEGRATION - Connect Shadow System with Other Features
// ============================================================
function integrateShadowSystem() {
  // Connect shadow system with existing features
  const playerStats = getPlayerStats();
  const shadowRadius = playerStats.radiusShadows || 100;
  
  // Update minimap shadow visibility
  if (drawMinimap) {
    // Minimap already handles visibility, shadow system works in main view
  }
  
  // Connect with zone system for shadow effects
  if (currentZone && currentZone.shadowEnabled) {
    // Zone-specific shadow effects can be applied here
  }
}

// ============================================================
// SHADOW EVENTS - Listen for Shadow System Events
// ============================================================
function setupShadowEvents() {
  // Listen for shadow radius changes
  if (window.addEventListener) {
    window.addEventListener('shadowRadiusChanged', (e) => {
      const newRadius = e.detail;
      // Update shadow rendering with new radius
      renderShadows();
    });
    
    window.addEventListener('shadowCoverageChanged', (e) => {
      const newCoverage = e.detail;
      // Update shadow rendering with new coverage
      renderShadows();
    });
  }
}

// ============================================================
// SHADOW INITIALIZATION - Setup Shadow System on Load
// ============================================================
function initShadowSystem() {
  // Initialize shadow system when game loads
  if (!currentZone || !player) return;
  
  // Set up initial shadow rendering
  const playerStats = getPlayerStats();
  const shadowRadius = playerStats.radiusShadows || 100;
  
  // Create initial shadow gradient
  const shadowGradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, shadowRadius);
  shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shadowGradient.addColorStop(0.2, 'rgba(0, 0, 0, 0.05)');
  shadowGradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.15)');
  shadowGradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.35)');
  shadowGradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.65)');
  shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
  
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = shadowGradient;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
}

// ============================================================
// SHADOW DOCUMENTATION - Comments for Shadow System
// ============================================================
/**
 * RADIUS SHADOWS SYSTEM
 * 
 * This system implements configurable radius shadows that limit map visibility.
 * Shadows are tied to player stats that can be upgraded:
 * - radiusShadows: Base shadow radius in pixels (default: 100)
 * - shadowCoverage: Multiplier for shadow radius (default: 1)
 * 
 * Shadow rendering uses radial gradients with composite operations to create
 * a fog-like darkness outside the shadow bounds. The gradient creates a smooth
 * transition from transparent at the center to dark at the edges.
 * 
 * Usage:
 * - calculateShadowRadius(): Get current effective shadow radius
 * - renderShadows(): Render shadow overlay in main view
 * - drawShadowStats(): Draw shadow radius indicator near player
 * - drawShadowCoverageBar(): Draw visual feedback for shadow progress
 * 
 * Integration:
 * - Shadows are rendered before main game content in draw()
 * - Works with existing minimap and other rendering features
 * - Can be enhanced with glow effects and debug tools
 */
