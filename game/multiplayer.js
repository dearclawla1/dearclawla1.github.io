// ============================================================
// MULTIPLAYER NETWORKING
// ============================================================
function connectToZone(zoneId) {
  if (ws) { ws.close(); ws = null; wsReady = false; }
  remotePlayers.clear();
  const url = `wss://${PARTYKIT_HOST}/party/${zoneId}`;
  document.getElementById('mp-status').textContent = 'Connecting...';
  ws = new WebSocket(url);
  ws.onopen = () => {
    wsReady = true;
    document.getElementById('mp-status').textContent = '';
    ws.send(JSON.stringify({ type: 'join', player: {
      id: myServerId || undefined, name: player.name, className: player.className,
      level: player.level, hp: player.hp, maxHp: getPlayerStats().maxHp,
      x: player.x, y: player.y, facing: player.facing, color: player.color,
      weapon: player.weapon, zone: zoneId, lastUpdate: Date.now()
    }}));
  };
  ws.onmessage = (ev) => { handleServerMessage(ev.data); };
  ws.onclose = () => { wsReady = false; document.getElementById('mp-status').textContent = 'Disconnected'; };
  ws.onerror = () => { wsReady = false; };
}

function handleServerMessage(raw) {
  let msg;
  try { msg = JSON.parse(raw); } catch { return; }
  switch (msg.type) {
    case 'state':
      myServerId = msg.you;
      for (const [id, p] of Object.entries(msg.players)) {
        if (id === myServerId) continue;
        remotePlayers.set(id, { ...p, hurtTimer: 0, invincible: 0, targetX: p.x, targetY: p.y });
      }
      updateMpStatus();
      break;
    case 'player-join':
      if (msg.player.id === myServerId) break;
      remotePlayers.set(msg.player.id, { ...msg.player, hurtTimer: 0, invincible: 0, targetX: msg.player.x, targetY: msg.player.y });
      addChatMessage(`${msg.player.name} joined`, '#6366f1');
      updateMpStatus();
      break;
    case 'player-leave':
      { const rp = remotePlayers.get(msg.id);
        if (rp) addChatMessage(`${rp.name} left`, '#888');
        remotePlayers.delete(msg.id); }
      updateMpStatus();
      break;
    case 'player-move':
      { const rp = remotePlayers.get(msg.id);
        if (rp) { rp.targetX = msg.x; rp.targetY = msg.y; rp.facing = msg.facing; } }
      break;
    case 'player-attack':
      { const rp = remotePlayers.get(msg.id);
        if (rp) { rp.facing = msg.facing;
          // Show attack visual for remote player
          const w = WEAPONS[msg.weapon];
          if (w && w.type === 'melee') {
            const len = Math.sqrt(msg.facing.x * msg.facing.x + msg.facing.y * msg.facing.y) || 1;
            const dx = msg.facing.x / len, dy = msg.facing.y / len;
            for (let i = 0; i < 3; i++) {
              const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.0;
              const dist = (w.range || 40) * (0.5 + Math.random() * 0.5);
              particles.push({ x: rp.x + Math.cos(angle) * dist, y: rp.y + Math.sin(angle) * dist,
                vx: Math.cos(angle) * 20, vy: Math.sin(angle) * 20, life: 0.15, maxLife: 0.15, color: '#ccc', size: 2 });
            }
          }
        } }
      break;
    case 'projectile':
      { const p = msg.proj;
        if (p.ownerId !== myServerId) {
          projectiles.push({ x: p.x, y: p.y, vx: p.vx, vy: p.vy, damage: p.damage, range: p.range,
            traveled: p.traveled || 0, owner: 'remote', ownerId: p.ownerId, color: p.color, size: p.size });
        } }
      break;
    case 'player-damage':
      if (msg.id === myServerId) {
        player.hp = msg.hp; player.hurtTimer = 0.2; player.invincible = 0.5;
        addFloatingText(player.x, player.y - 20, `-${msg.damage}`, '#dc2626');
        if (player.hp <= 0) playerDeath();
      } else {
        const rp = remotePlayers.get(msg.id);
        if (rp) { rp.hp = msg.hp; rp.hurtTimer = 0.2;
          addFloatingText(rp.x, rp.y - 20, `-${msg.damage}`, '#ef4444'); }
      }
      break;
    case 'player-death':
      if (msg.id === myServerId) {
        const killer = remotePlayers.get(msg.killerId);
        addChatMessage(`Killed by ${killer?.name || 'unknown'}!`, '#dc2626');
        playerDeath();
      } else {
        const rp = remotePlayers.get(msg.id);
        if (rp) { rp.hp = 0; addChatMessage(`${rp.name} was slain!`, '#dc2626'); }
      }
      break;
    case 'chat':
      if (msg.id !== myServerId) addChatMessage(`${msg.name}: ${msg.text}`, '#e0e0e0');
      break;
    case 'pong':
      document.getElementById('mp-status').textContent = `${msg.playerCount} online`;
      break;
  }
}

function sendMove() {
  if (!wsReady || !ws) return;
  const now = Date.now();
  if (now - lastSendTime < 50) return; // 20 updates/sec max
  lastSendTime = now;
  ws.send(JSON.stringify({ type: 'move', x: player.x, y: player.y, facing: player.facing }));
}

function sendAttack() {
  if (!wsReady || !ws) return;
  const w = WEAPONS[player.weapon]; if (!w) return;
  ws.send(JSON.stringify({ type: 'attack', facing: player.facing, weapon: player.weapon, damage: getWeaponDamage() }));
  // For ranged/magic, also send projectile
  if (w.type !== 'melee') {
    const fx = player.facing.x, fy = player.facing.y;
    const len = Math.sqrt(fx * fx + fy * fy) || 1;
    const dx = fx / len, dy = fy / len;
    const pColor = w.element === 'fire' ? '#ef4444' : w.element === 'ice' ? '#60a5fa' : w.element === 'lightning' ? '#fbbf24' : '#e2e8f0';
    ws.send(JSON.stringify({ type: 'projectile', proj: {
      id: Math.random().toString(36).slice(2), ownerId: myServerId,
      x: player.x + dx * 16, y: player.y + dy * 16, vx: dx * w.projSpeed, vy: dy * w.projSpeed,
      damage: getWeaponDamage(), range: w.range, traveled: 0, color: pColor, size: w.type === 'magic' ? 6 : 4
    }}));
  }
}

function sendHitPlayer(targetId, damage) {
  if (!wsReady || !ws) return;
  ws.send(JSON.stringify({ type: 'hit-player', targetId, damage }));
}

function sendChat(text) {
  if (!wsReady || !ws) return;
  ws.send(JSON.stringify({ type: 'chat', text }));
  addChatMessage(`${player.name}: ${text}`, '#e0e0e0');
}

function sendPing() { if (wsReady && ws) ws.send(JSON.stringify({ type: 'ping' })); }
setInterval(sendPing, 5000);

function updateMpStatus() {
  const count = remotePlayers.size + 1;
  document.getElementById('mp-status').textContent = `${count} in zone`;
}

function updateRemotePlayers(dt) {
  for (const [, rp] of remotePlayers) {
    // Interpolate position smoothly
    rp.x += (rp.targetX - rp.x) * Math.min(1, dt * 10);
    rp.y += (rp.targetY - rp.y) * Math.min(1, dt * 10);
    rp.hurtTimer = Math.max(0, (rp.hurtTimer || 0) - dt);
    rp.invincible = Math.max(0, (rp.invincible || 0) - dt);
  }
}

function checkPvpHits() {
  if (!currentZone?.pvp) return;
  // Check local projectiles hitting remote players
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    if (p.owner !== 'player') continue;
    for (const [id, rp] of remotePlayers) {
      const dx = p.x - rp.x, dy = p.y - rp.y;
      if (dx * dx + dy * dy < (14 + p.size) * (14 + p.size)) {
        sendHitPlayer(id, p.damage);
        projectiles.splice(i, 1);
        for (let j = 0; j < 4; j++) particles.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 80,
          life: 0.3, maxLife: 0.3, color: p.color, size: 2 });
        break;
      }
    }
  }
  // Check melee hits on remote players
  if (input.attack && WEAPONS[player.weapon]?.type === 'melee') {
    const w = WEAPONS[player.weapon];
    const fx = player.facing.x, fy = player.facing.y;
    const len = Math.sqrt(fx * fx + fy * fy) || 1;
    const ndx = fx / len, ndy = fy / len;
    for (const [id, rp] of remotePlayers) {
      const ex = rp.x - player.x, ey = rp.y - player.y;
      const dist = Math.sqrt(ex * ex + ey * ey);
      if (dist > w.range) continue;
      const dot = (ex * ndx + ey * ndy) / dist;
      if (dot < 0.4) continue;
      sendHitPlayer(id, getWeaponDamage());
    }
  }
  // Check remote projectiles hitting local player
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    if (p.owner !== 'remote') continue;
    const dx = p.x - player.x, dy = p.y - player.y;
    if (dx * dx + dy * dy < (14 + p.size) * (14 + p.size)) {
      // Server handles damage, just remove projectile visually
      projectiles.splice(i, 1);
    }
  }
}

// Chat input handling
const chatInput = document.getElementById('chat-input');
window.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !chatOpen && gameStarted && !inventoryOpen) {
    e.preventDefault(); chatOpen = true; chatInput.style.display = 'block'; chatInput.focus();
  } else if (e.key === 'Enter' && chatOpen) {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (text) sendChat(text);
    chatInput.value = ''; chatInput.style.display = 'none'; chatOpen = false; canvas.focus();
  } else if (e.key === 'Escape' && chatOpen) {
    chatInput.value = ''; chatInput.style.display = 'none'; chatOpen = false; canvas.focus();
  }
});

function addChatMessage(text, color) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.style.color = color || '#ccc';
  div.textContent = text;
  container.appendChild(div);
  if (container.children.length > 50) container.removeChild(container.firstChild);
  container.scrollTop = container.scrollHeight;
}
