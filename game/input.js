// ============================================================
// INPUT
// ============================================================
const keys = {};
window.addEventListener('keydown', e => { if (chatOpen) return; keys[e.key.toLowerCase()] = true; if (e.key.toLowerCase() === 'i') toggleInventory(); if (e.key === 'Escape' && inventoryOpen) toggleInventory(); });
window.addEventListener('keyup', e => { if (chatOpen) return; keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousedown', e => { if (!inventoryOpen) input.attack = true; });
canvas.addEventListener('mouseup', () => { input.attack = false; });
canvas.addEventListener('mousemove', e => { input.aimX = e.clientX; input.aimY = e.clientY; });

let joystickTouch = null, joystickCenter = { x: 60, y: 60 }, joystickPos = { x: 0, y: 0 };
document.getElementById('touch-left').addEventListener('touchstart', e => { e.preventDefault(); const t = e.touches[0]; const rect = e.currentTarget.getBoundingClientRect();
  joystickTouch = t.identifier; joystickCenter = { x: t.clientX - rect.left, y: t.clientY - rect.top }; }, { passive: false });
document.addEventListener('touchmove', e => { for (const t of e.changedTouches) { if (t.identifier === joystickTouch) {
  const rect = document.getElementById('touch-left').getBoundingClientRect();
  const dx = t.clientX - rect.left - joystickCenter.x, dy = t.clientY - rect.top - joystickCenter.y;
  const dist = Math.sqrt(dx * dx + dy * dy), maxDist = 40;
  if (dist > 0) { joystickPos.x = (dx / dist) * Math.min(dist, maxDist) / maxDist; joystickPos.y = (dy / dist) * Math.min(dist, maxDist) / maxDist; }
} } }, { passive: false });
document.addEventListener('touchend', e => { for (const t of e.changedTouches) { if (t.identifier === joystickTouch) { joystickTouch = null; joystickPos = { x: 0, y: 0 }; } } });
document.getElementById('btn-attack').addEventListener('touchstart', e => { e.preventDefault(); input.attack = true; }, { passive: false });
document.getElementById('btn-attack').addEventListener('touchend', () => { input.attack = false; });
document.getElementById('btn-inv').addEventListener('touchstart', e => { e.preventDefault(); toggleInventory(); }, { passive: false });

function processInput() {
  input.x = 0; input.y = 0;
  if (keys['w'] || keys['arrowup']) input.y = -1;
  if (keys['s'] || keys['arrowdown']) input.y = 1;
  if (keys['a'] || keys['arrowleft']) input.x = -1;
  if (keys['d'] || keys['arrowright']) input.x = 1;
  if (Math.abs(joystickPos.x) > 0.1 || Math.abs(joystickPos.y) > 0.1) { input.x = joystickPos.x; input.y = joystickPos.y; }
  if (isMobile) { if (Math.abs(input.x) > 0.1 || Math.abs(input.y) > 0.1) { player.facing.x = input.x; player.facing.y = input.y; } }
  else { const aimDx = input.aimX - W / 2, aimDy = input.aimY - H / 2; const aimLen = Math.sqrt(aimDx * aimDx + aimDy * aimDy);
    if (aimLen > 5) { player.facing.x = aimDx / aimLen; player.facing.y = aimDy / aimLen; } }
}
