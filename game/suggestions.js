// ============================================================
// SUGGESTIONS (player feedback to Gwen)
// ============================================================
let suggestionsVisible = false;
function submitSuggestion() {
  const inp = document.getElementById('suggest-input');
  const text = inp.value.trim(); if (!text || text.length < 5) return;
  fetch(`${API_BASE}/api/suggestions`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, game: 'realm' }) }).then(() => { inp.value = ''; addFloatingText(player.x, player.y - 30, 'Suggestion sent!', '#6366f1'); }).catch(() => {});
}
function toggleSuggestions() {
  suggestionsVisible = !suggestionsVisible;
  const list = document.getElementById('suggestions-list');
  list.style.display = suggestionsVisible ? 'block' : 'none';
  if (suggestionsVisible) loadSuggestions();
}
function loadSuggestions() {
  fetch(`${API_BASE}/api/suggestions?limit=10`).then(r => r.json()).then(data => {
    const items = data.results || data || [];
    const list = document.getElementById('suggestions-list');
    if (items.length === 0) { list.innerHTML = '<div style="color:#888;padding:4px">No suggestions yet</div>'; return; }
    list.innerHTML = items.map(s => {
      const d = typeof s.data === 'string' ? JSON.parse(s.data) : s.data;
      return `<div class="suggestion-item"><span>${d.text || ''}</span><button onclick="voteSuggestion('${s.id}')">&#9650; ${d.votes || 0}</button></div>`;
    }).join('');
  }).catch(() => {});
}
function voteSuggestion(id) { fetch(`${API_BASE}/api/suggestions/vote/${id}`, { method: 'POST' }).then(() => loadSuggestions()).catch(() => {}); }
