// ============================================================
// INVENTORY UI
// ============================================================
function toggleInventory() { inventoryOpen = !inventoryOpen; document.getElementById('inventory').style.display = inventoryOpen ? 'block' : 'none'; if (inventoryOpen) renderInventory(); }

function renderInventory() {
  const slotsDiv = document.getElementById('gear-slots'), itemsDiv = document.getElementById('inv-items');
  const slotNames = ['head', 'chest', 'legs', 'boots', 'ring'];
  let slotsHtml = '<div style="margin-bottom:8px;font-size:12px;color:#888">Equipped</div>';
  const w = WEAPONS[player.weapon];
  slotsHtml += `<div class="gear-slot filled" style="border-color:${RARITY_COLORS[w?.rarity]||'#333'}" title="${w?.name||'None'}"><span>${w?.icon||'?'}</span><span class="slot-label">Weapon</span></div>`;
  for (const s of slotNames) {
    const itemId = player.equipped[s]; const g = itemId ? GEAR[itemId] : null;
    slotsHtml += `<div class="gear-slot ${g?'filled':''}" style="border-color:${g?RARITY_COLORS[g.rarity]||'#333':'#333'}" onclick="unequipGear('${s}')" title="${g?.name||s}"><span>${g?.icon||''}</span><span class="slot-label">${s}</span></div>`;
  }
  slotsDiv.innerHTML = slotsHtml;
  let itemsHtml = `<div style="margin-bottom:8px;font-size:12px;color:#888">Backpack (${player.inventory.length}/20)</div>`;
  player.inventory.forEach((item, idx) => {
    const data = item.type === 'weapon' ? WEAPONS[item.id] : GEAR[item.id];
    if (!data) return;
    itemsHtml += `<div class="inv-item rarity-${data.rarity}" onclick="equipItem(${idx})" title="${data.name}">${data.icon || '?'}</div>`;
  });
  itemsDiv.innerHTML = itemsHtml;
}

function equipItem(idx) {
  const item = player.inventory[idx]; if (!item) return;
  if (item.type === 'weapon') { const old = player.weapon; player.weapon = item.id; player.inventory.splice(idx, 1); if (old) player.inventory.push({ id: old, type: 'weapon' }); }
  else if (item.type === 'gear') { const g = GEAR[item.id]; if (!g) return; const old = player.equipped[g.slot]; player.equipped[g.slot] = item.id;
    player.inventory.splice(idx, 1); if (old) player.inventory.push({ id: old, type: 'gear' });
    const stats = getPlayerStats(); player.maxHp = stats.maxHp; player.maxMp = stats.maxMp; }
  renderInventory();
}

function unequipGear(slot) {
  const itemId = player.equipped[slot]; if (!itemId) return;
  if (player.inventory.length >= 20) { addFloatingText(player.x, player.y - 20, 'Full!', '#dc2626'); return; }
  player.inventory.push({ id: itemId, type: 'gear' }); player.equipped[slot] = null;
  const stats = getPlayerStats(); player.maxHp = stats.maxHp; player.maxMp = stats.maxMp; renderInventory();
}
