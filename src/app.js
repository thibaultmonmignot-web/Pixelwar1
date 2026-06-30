const GRID_SIZE = 5000;
const STORAGE_KEY = 'pixelwar-prototype-v2';

const palette = [
  '#ffffff', '#101115', '#ff6070', '#ffd166',
  '#35d49d', '#58b7ff', '#9b7bff', '#ff9f43',
  '#00d4ff', '#f15bb5', '#8bd450', '#c9ccd5'
];

const packs = [
  { label: '1 pixel', note: 'Prix prévu', price: '0,10 EUR', credits: 1 },
  { label: '10 pixels', note: 'Pack départ', price: '0,50 EUR', credits: 10 },
  { label: '15 pixels', note: 'Pack moyen', price: '0,65 EUR', credits: 15 },
  { label: '20 pixels', note: 'Pack équipe', price: '0,80 EUR', credits: 20 },
  { label: '25 pixels', note: 'Pack attaque', price: '1,00 EUR', credits: 25 },
  { label: 'Bombe', note: 'Détruit une zone 7 x 7', price: '0,20 EUR', bombs: 1, bomb: true }
];

const canvas = document.querySelector('#board');
const ctx = canvas.getContext('2d');
const creditsEl = document.querySelector('#credits');
const bombsEl = document.querySelector('#bombs');
const placedEl = document.querySelector('#placed');
const coordEl = document.querySelector('#coord');
const swatchesEl = document.querySelector('#swatches');
const packsEl = document.querySelector('#packs');
const paintTool = document.querySelector('#paintTool');
const bombTool = document.querySelector('#bombTool');
const resetButton = document.querySelector('#resetButton');

let state = loadState();
let selectedColor = palette[0];
let selectedTool = 'paint';
let scale = 12;
let camera = { x: 2500, y: 2500 };
let isPanning = false;
let panStart = { x: 0, y: 0, cameraX: 0, cameraY: 0 };
let lastTouchDistance = 0;
const keys = new Set();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.pixels) return saved;
  } catch (error) {}
  return { credits: 30, bombs: 1, placed: 0, pixels: {} };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function updateStats() {
  state.placed = Object.keys(state.pixels).length;
  creditsEl.textContent = state.credits;
  bombsEl.textContent = state.bombs;
  placedEl.textContent = state.placed;
}

function renderShop() {
  packsEl.innerHTML = '';
  packs.forEach((pack) => {
    const item = document.createElement('div');
    item.className = 'pack';
    item.innerHTML = '<div><strong>' + pack.label + '</strong><small>' + pack.note + '</small></div><button class="buy ' + (pack.bomb ? 'bomb' : '') + '" type="button">' + pack.price + '</button>';
    item.querySelector('button').addEventListener('click', () => {
      state.credits += pack.credits || 0;
      state.bombs += pack.bombs || 0;
      saveState();
      updateStats();
    });
    packsEl.appendChild(item);
  });
}

function renderSwatches() {
  swatchesEl.innerHTML = '';
  palette.forEach((color) => {
    const button = document.createElement('button');
    button.className = 'swatch' + (color === selectedColor ? ' active' : '');
    button.style.background = color;
    button.type = 'button';
    button.title = color;
    button.addEventListener('click', () => {
      selectedColor = color;
      renderSwatches();
    });
    swatchesEl.appendChild(button);
  });
}

function setTool(tool) {
  selectedTool = tool;
  paintTool.classList.toggle('active', tool === 'paint');
  bombTool.classList.toggle('active', tool === 'bomb');
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  draw();
}

function screenToGrid(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.floor(camera.x + (clientX - rect.left - rect.width / 2) / scale),
    y: Math.floor(camera.y + (clientY - rect.top - rect.height / 2) / scale)
  };
}

function clampCamera() {
  camera.x = Math.max(0, Math.min(GRID_SIZE, camera.x));
  camera.y = Math.max(0, Math.min(GRID_SIZE, camera.y));
}

function drawPixels(rect) {
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  Object.entries(state.pixels).forEach(([key, color]) => {
    const [x, y] = key.split(',').map(Number);
    const sx = cx + (x - camera.x) * scale;
    const sy = cy + (y - camera.y) * scale;
    if (sx < -scale || sy < -scale || sx > rect.width || sy > rect.height) return;
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(sx), Math.floor(sy), Math.max(1, Math.ceil(scale)), Math.max(1, Math.ceil(scale)));
  });
}

function drawGrid(rect) {
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const startX = Math.max(0, Math.floor(camera.x - cx / scale) - 1);
  const endX = Math.min(GRID_SIZE, Math.ceil(camera.x + cx / scale) + 1);
  const startY = Math.max(0, Math.floor(camera.y - cy / scale) - 1);
  const endY = Math.min(GRID_SIZE, Math.ceil(camera.y + cy / scale) + 1);

  ctx.strokeStyle = scale >= 8 ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.025)';
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let x = startX; x <= endX; x += 1) {
    const sx = Math.round(cx + (x - camera.x) * scale) + 0.5;
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, rect.height);
  }

  for (let y = startY; y <= endY; y += 1) {
    const sy = Math.round(cy + (y - camera.y) * scale) + 0.5;
    ctx.moveTo(0, sy);
    ctx.lineTo(rect.width, sy);
  }
  ctx.stroke();
}

function drawBombPreview(rect) {
  if (selectedTool !== 'bomb') return;
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  ctx.strokeStyle = 'rgba(255,96,112,.75)';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - 3.5 * scale, cy - 3.5 * scale, 7 * scale, 7 * scale);
}

function draw() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  drawPixels(rect);
  drawGrid(rect);
  drawBombPreview(rect);
}

function placePixel(point) {
  if (point.x < 0 || point.y < 0 || point.x >= GRID_SIZE || point.y >= GRID_SIZE) return;
  if (state.credits < 1) return;
  state.pixels[point.x + ',' + point.y] = selectedColor;
  state.credits -= 1;
  saveState();
  updateStats();
  draw();
}

function useBomb(point) {
  if (state.bombs < 1) return;
  state.bombs -= 1;
  for (let x = point.x - 3; x <= point.x + 3; x += 1) {
    for (let y = point.y - 3; y <= point.y + 3; y += 1) {
      delete state.pixels[x + ',' + y];
    }
  }
  saveState();
  updateStats();
  draw();
}

function touchDistance(event) {
  if (event.touches.length < 2) return 0;
  const dx = event.touches[0].clientX - event.touches[1].clientX;
  const dy = event.touches[0].clientY - event.touches[1].clientY;
  return Math.hypot(dx, dy);
}

canvas.addEventListener('contextmenu', (event) => event.preventDefault());
canvas.addEventListener('pointerdown', (event) => {
  if (event.button === 2 || keys.has(' ')) {
    isPanning = true;
    panStart = { x: event.clientX, y: event.clientY, cameraX: camera.x, cameraY: camera.y };
    canvas.setPointerCapture(event.pointerId);
    return;
  }
  const point = screenToGrid(event.clientX, event.clientY);
  if (selectedTool === 'paint') placePixel(point);
  else useBomb(point);
});
canvas.addEventListener('pointermove', (event) => {
  const point = screenToGrid(event.clientX, event.clientY);
  coordEl.textContent = 'x: ' + point.x + ', y: ' + point.y;
  if (!isPanning) return;
  camera.x = panStart.cameraX - (event.clientX - panStart.x) / scale;
  camera.y = panStart.cameraY - (event.clientY - panStart.y) / scale;
  clampCamera();
  draw();
});
canvas.addEventListener('pointerup', () => { isPanning = false; });
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const before = screenToGrid(event.clientX, event.clientY);
  scale = Math.max(1, Math.min(44, scale * (event.deltaY < 0 ? 1.15 : 0.85)));
  const after = screenToGrid(event.clientX, event.clientY);
  camera.x += before.x - after.x;
  camera.y += before.y - after.y;
  clampCamera();
  draw();
}, { passive: false });
canvas.addEventListener('touchstart', (event) => { lastTouchDistance = touchDistance(event); }, { passive: true });
canvas.addEventListener('touchmove', (event) => {
  if (event.touches.length === 2) {
    event.preventDefault();
    const nextDistance = touchDistance(event);
    if (lastTouchDistance > 0) {
      scale = Math.max(1, Math.min(44, scale * (nextDistance / lastTouchDistance)));
      draw();
    }
    lastTouchDistance = nextDistance;
  }
}, { passive: false });
window.addEventListener('keydown', (event) => keys.add(event.key));
window.addEventListener('keyup', (event) => keys.delete(event.key));
window.addEventListener('resize', resizeCanvas);
paintTool.addEventListener('click', () => setTool('paint'));
bombTool.addEventListener('click', () => setTool('bomb'));
resetButton.addEventListener('click', () => {
  state = { credits: 30, bombs: 1, placed: 0, pixels: {} };
  saveState();
  updateStats();
  draw();
});

renderShop();
renderSwatches();
updateStats();
resizeCanvas();
