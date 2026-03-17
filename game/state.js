// ============================================================
// ENGINE — Canvas setup and game state
// ============================================================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const mmCanvas = document.getElementById('minimap');
const mmCtx = mmCanvas.getContext('2d');
const jCanvas = document.getElementById('joystick-canvas');
const jCtx = jCanvas.getContext('2d');

let W, H;
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; mmCanvas.width = 140; mmCanvas.height = 140; }
window.addEventListener('resize', resize); resize();

const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) || ('ontouchstart' in window && window.innerWidth < 1024);
if (isMobile) { document.getElementById('touch-left').style.display = 'block'; document.getElementById('touch-right').style.display = 'block'; }

// ============================================================
// GAME STATE
// ============================================================
let gameStarted = false, player = null, camera = { x: 0, y: 0 };
let entities = [], projectiles = [], particles = [], floatingTexts = [], lootBags = [];
let currentZone = null, zoneMap = null;
let input = { x: 0, y: 0, attack: false, aimX: 0, aimY: 0 };
let lastAttackTime = 0, inventoryOpen = false, deathScreenVisible = false;
let remotePlayers = new Map();
let ws = null, wsReady = false, lastSendTime = 0, myServerId = null, chatOpen = false;
const PARTYKIT_HOST = 'gwens-realm.dearclawla1.partykit.dev';
