// ============================================================
// ZONE GENERATION
// ============================================================
function generateZone(zoneId) {
  const z = ZONES[zoneId]; if (!z) return;
  currentZone = z; zoneMap = [];
  let seed = 0;
  for (let i = 0; i < zoneId.length; i++) seed = ((seed << 5) - seed + zoneId.charCodeAt(i)) | 0;
  const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let y = 0; y < z.height; y++) {
    zoneMap[y] = [];
    for (let x = 0; x < z.width; x++) {
      let tile = 0;
      if (x === 0 || y === 0 || x === z.width - 1 || y === z.height - 1) {
        let isPortal = false;
        for (const p of z.portals) { if (x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) { isPortal = true; break; } }
        if (!isPortal) tile = 1;
      } else {
        const r = rng();
        if (z.trees > 0 && r < z.trees) tile = 1;
        else if (z.obstacles > 0 && r < z.obstacles + z.trees) tile = 1;
      }
      zoneMap[y][x] = tile;
    }
  }
  const cx = Math.floor(z.width / 2), cy = Math.floor(z.height / 2);
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const ny = cy + dy, nx = cx + dx;
    if (ny >= 0 && ny < z.height && nx >= 0 && nx < z.width) zoneMap[ny][nx] = 0;
  }
  for (const p of z.portals) for (let dy = -1; dy <= p.h; dy++) for (let dx = -1; dx <= p.w; dx++) {
    const ny = p.y + dy, nx = p.x + dx;
    if (ny >= 0 && ny < z.height && nx >= 0 && nx < z.width) zoneMap[ny][nx] = 0;
  }
  entities = [];
  for (const esp of z.enemies) for (let i = 0; i < esp.count; i++) spawnEnemy(esp.type, z, rng);
  showZoneName(z.name);
  document.getElementById('zone-label').textContent = z.name;
  document.getElementById('pvp-label').style.display = z.pvp ? 'inline' : 'none';
}

function spawnEnemy(type, zone, rng) {
  const e = ENEMIES[type]; if (!e) return;
  let ex, ey, tries = 0;
  do { ex = Math.floor((rng ? rng() : Math.random()) * (zone.width - 4)) + 2; ey = Math.floor((rng ? rng() : Math.random()) * (zone.height - 4)) + 2; tries++; }
  while (tries < 50 && zoneMap[ey] && zoneMap[ey][ex] !== 0);
  entities.push({ type, ...e, id: Math.random().toString(36).slice(2),
    x: ex * zone.tileSize + zone.tileSize / 2, y: ey * zone.tileSize + zone.tileSize / 2,
    maxHp: e.hp, hp: e.hp, vx: 0, vy: 0, wanderAngle: Math.random() * Math.PI * 2,
    wanderTimer: 0, attackCooldown: 0, respawnType: type, respawnTime: 0, dead: false });
}

// ============================================================
// ZONE TRANSITIONS
// ============================================================
function checkPortals() {
  if (!currentZone) return;
  const ts = currentZone.tileSize;
  const px = Math.floor(player.x / ts), py = Math.floor(player.y / ts);
  for (const p of currentZone.portals) {
    if (px >= p.x && px < p.x + p.w && py >= p.y && py < p.y + p.h) {
      const tz = ZONES[p.target]; if (!tz) continue;
      if (player.level < tz.levelReq) {
        addFloatingText(player.x, player.y - 20, `Need Lv.${tz.levelReq}`, '#dc2626');
        player.x -= player.facing.x * ts; player.y -= player.facing.y * ts; return;
      }
      enterZone(p.target, p.sx * tz.tileSize + tz.tileSize / 2, p.sy * tz.tileSize + tz.tileSize / 2); return;
    }
  }
}

function enterZone(zoneId, spawnX, spawnY) {
  generateZone(zoneId);
  player.x = spawnX || currentZone.width * currentZone.tileSize / 2;
  player.y = spawnY || currentZone.height * currentZone.tileSize / 2;
  projectiles = []; particles = []; lootBags = []; floatingTexts = [];
  connectToZone(zoneId);
}

function showZoneName(name) { const el = document.getElementById('zone-name'); el.textContent = name; el.style.opacity = 1; setTimeout(() => { el.style.opacity = 0; }, 2000); }
