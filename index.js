/* ---------------- Settings ---------------- */
const LEVEL_SIZES = [6, 6, 9, 9];           // grid size of Level 1..4
const CELL = 60;                            // cell size in pixels
const MARGIN = 76;                          // space around the grid (cat / rat live here)
const ARROWS = ['↑', '→', '↓', '←'];        // index = direction (0 up, 1 right, 2 down, 3 left)
const MOVES = [[-1, 0], [0, 1], [1, 0], [0, -1]];

/* ---------------- Elements & images ---------------- */
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const messageEl = document.getElementById('message');
const popup = document.getElementById('popup');

const IMG = {};
for (const name of ['cat', 'rat', 'pond']) {
  IMG[name] = new Image();
  IMG[name].onload = () => { if (blocks) draw(); };
  IMG[name].src = `images/${name}.webp`;
}

/* ---------------- Game state ---------------- */
let level = 1;
let size, blocks, selected;                 // grid size, 2D array of blocks, selected [row, col] block
let startRow, endRow;                       // rows where the cat starts and the rat sits
let cells;                                  // path-slot cells: "row,col" -> arrow direction (or null = empty track)
let startState;                             // saved scramble, used by Reset
let solved = false;
let trail = [];                             // cells visited while validating (the cat's route)
let catPos = null;                          // [x, y, flip, groundY, hopProgress] while animating
let ratCaught = false;

/* ---------------- Helpers ---------------- */
const randInt = k => Math.floor(Math.random() * k);
const shuffle = a => a.map(v => [Math.random(), v]).sort((p, q) => p[0] - q[0]).map(p => p[1]);

/* ---------------- Level generation ---------------- */
function newLevel() {
  size = LEVEL_SIZES[level];
  startRow = randInt(size);
  endRow = randInt(size);

  // 1. Build a left-to-right solution path (it may step up/down once per column)
  let row = startRow;
  const path = [];
  for (let col = 0; col < size; col++) {
    const targetRow = col === size - 1 ? endRow : (Math.random() < 0.55 ? randInt(size) : row);
    path.push([row, col]);
    while (row !== targetRow) { row += row < targetRow ? 1 : -1; path.push([row, col]); }
  }

  // 2. Each path cell stores the arrow pointing at the next cell
  cells = {};
  path.forEach(([r, c], i) => {
    const next = path[i + 1];
    let dir = 1;                                         // last cell points right (out of the grid)
    if (next) dir = next[0] < r ? 0 : next[0] > r ? 2 : 1;
    cells[`${r},${c}`] = dir;
  });

  // 3. Add a few empty track cells (lily pads)
  for (let i = 0; i < Math.floor(size * size / 12); i++) {
    const key = `${randInt(size)},${randInt(size)}`;
    if (!(key in cells)) cells[key] = null;
  }

  // 4. Split into 3x3 blocks; each block gets 3 possible layouts and a random scramble
  const count = size / 3;
  blocks = [];
  for (let br = 0; br < count; br++) {
    blocks[br] = [];
    for (let bc = 0; bc < count; bc++) {
      const slots = [];
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
          if (`${br * 3 + i},${bc * 3 + j}` in cells) slots.push([br * 3 + i, bc * 3 + j]);

      const solution = slots.map(([r, c]) => cells[`${r},${c}`]);
      const block = { slots, layouts: [solution, shuffle(solution), shuffle(solution)], layout: randInt(3), rotation: randInt(4) };
      if (slots.length && block.layout === 0 && block.rotation === 0) block.rotation = 1 + randInt(3);
      blocks[br][bc] = block;
    }
  }

  selected = [0, 0];
  solved = false;
  catPos = null;
  ratCaught = false;
  startState = JSON.stringify(blocks.map(row => row.map(b => [b.layout, b.rotation])));
  canvas.width = canvas.height = size * CELL + MARGIN * 2;
  messageEl.textContent = '';
  draw();
}

/* Arrow currently shown in cell (r, c): a direction 0-3, or null for an empty track cell */
function arrowAt(r, c) {
  const block = blocks[Math.floor(r / 3)][Math.floor(c / 3)];
  const slot = block.slots.findIndex(s => s[0] === r && s[1] === c);
  const dir = block.layouts[block.layout][slot];
  return dir == null ? null : (dir + block.rotation) % 4;
}

/* ---------------- Drawing ---------------- */
function drawImageFit(img, cx, cy, box) {
  if (!img.complete || !img.naturalWidth) return;
  const k = Math.min(box / img.naturalWidth, box / img.naturalHeight);
  const w = img.naturalWidth * k, h = img.naturalHeight * k;
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
}

function drawLilyPad(cx, cy, seed) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((seed % 12) * 0.5);                         // each pad faces a different way
  ctx.fillStyle = 'rgba(0, 40, 70, .22)';                // soft shadow
  ctx.beginPath(); ctx.ellipse(2, 3, 22, 19, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#4f9d58';                             // pad with a notch
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 21, 0.35, 5.93); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3a7f46'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.28)';             // veins
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-13, -8); ctx.moveTo(0, 0); ctx.lineTo(-13, 8); ctx.stroke();
  ctx.restore();
}

function draw() {
  const gridSize = size * CELL;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Frame + pond background (one picture across the whole grid)
  ctx.fillStyle = '#000'; ctx.fillRect(MARGIN - 4, MARGIN - 4, gridSize + 8, gridSize + 8);
  ctx.fillStyle = '#8ecae6'; ctx.fillRect(MARGIN, MARGIN, gridSize, gridSize);
  if (IMG.pond.complete) ctx.drawImage(IMG.pond, MARGIN, MARGIN, gridSize, gridSize);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const x = MARGIN + c * CELL, y = MARGIN + r * CELL;
      if (`${r},${c}` in cells) {
        const dir = arrowAt(r, c);
        if (dir == null) {
          drawLilyPad(x + CELL / 2, y + CELL / 2, r * 7 + c * 13);
        } else {
          ctx.fillStyle = '#ffd400';
          ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
          ctx.fillStyle = '#222';
          ctx.font = 'bold 34px Arial';
          ctx.fillText(ARROWS[dir], x + CELL / 2, y + CELL / 2);
        }
      }
      // red outline on the selected block
      if (Math.floor(r / 3) === selected[0] && Math.floor(c / 3) === selected[1]) {
        ctx.strokeStyle = '#e00'; ctx.lineWidth = 3;
        ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4);
      }
    }
  }

  // Cat (with shadow, flip and tilt while hopping) and rat
  const catY = MARGIN + startRow * CELL + CELL / 2;
  const cat = catPos || [MARGIN - 38, catY, 1, catY, 0.5];
  if (catPos) {
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath(); ctx.ellipse(cat[0], cat[3] + 20, 20 - (cat[3] - cat[1]) / 3, 6, 0, 0, 7); ctx.fill();
  }
  ctx.save();
  ctx.translate(cat[0], cat[1]);
  ctx.scale(cat[2], 1);
  ctx.rotate((cat[4] - 0.5) * 0.6);
  drawImageFit(IMG.cat, 0, 0, 68);
  ctx.restore();
  if (!ratCaught) drawImageFit(IMG.rat, MARGIN + gridSize + 38, MARGIN + endRow * CELL + CELL / 2, 68);

  const b = blocks[selected[0]][selected[1]];
  document.getElementById('info').innerHTML =
    `Block <b>(${selected[0] + 1}, ${selected[1] + 1})</b> · Rotated: ${b.rotation * 90}° · Layout: ${b.layout + 1}/3`;
}

/* ---------------- Validation: follow the arrows from the cat ---------------- */
function checkPath() {
  let r = startRow, c = 0, dir = 1;
  const seen = {};
  trail = [];
  while (true) {
    if (c >= size) return r === endRow ? 'ok' : 'Exited at the wrong row.';
    if (r < 0 || r >= size || c < 0) return 'The path left the grid.';
    if (!(`${r},${c}` in cells)) return `Path breaks at row ${r + 1}, column ${c + 1}.`;
    if (seen[`${r},${c},${dir}`]) return 'The path loops forever.';
    seen[`${r},${c},${dir}`] = true;
    trail.push([r, c]);

    const arrow = arrowAt(r, c);
    if (arrow != null) dir = arrow;                      // empty track cells keep the current direction
    r += MOVES[dir][0];
    c += MOVES[dir][1];
  }
}

/* ---------------- Cat jumps from box to box ---------------- */
function runCat() {
  document.body.style.pointerEvents = 'none';            // lock the game while the cat runs
  const center = (r, c) => [MARGIN + c * CELL + CELL / 2, MARGIN + r * CELL + CELL / 2];
  const points = [
    [MARGIN - 38, MARGIN + startRow * CELL + CELL / 2],  // cat's starting spot
    ...trail.map(([r, c]) => center(r, c)),              // every box on the path
    [MARGIN + size * CELL + 38, MARGIN + endRow * CELL + CELL / 2]  // the rat
  ];
  const HOP = 320, PAUSE = 90;                           // ms
  let t0 = null, flip = 1;

  function step(t) {
    if (t0 == null) t0 = t;
    const elapsed = t - t0;
    const k = Math.floor(elapsed / (HOP + PAUSE));       // which hop we are on

    if (k >= points.length - 1) {                        // arrived: rat is caught
      const end = points[points.length - 1];
      catPos = [end[0], end[1], flip, end[1], 1];
      ratCaught = true;
      draw();
      popup.style.display = 'flex';
      return;
    }
    const f = Math.min((elapsed - k * (HOP + PAUSE)) / HOP, 1);
    const a = points[k], b = points[k + 1];
    const groundY = a[1] + (b[1] - a[1]) * f;
    if (b[0] < a[0] - 1) flip = -1; else if (b[0] > a[0] + 1) flip = 1;
    catPos = [a[0] + (b[0] - a[0]) * f, groundY - Math.sin(Math.PI * f) * 30, flip, groundY, f];
    draw();
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ---------------- Controls ---------------- */
canvas.onclick = e => {
  const box = canvas.getBoundingClientRect(), scale = canvas.width / box.width;
  const c = Math.floor(((e.clientX - box.left) * scale - MARGIN) / CELL);
  const r = Math.floor(((e.clientY - box.top) * scale - MARGIN) / CELL);
  if (r >= 0 && c >= 0 && r < size && c < size) { selected = [Math.floor(r / 3), Math.floor(c / 3)]; draw(); }
};

document.getElementById('rotateBtn').onclick = () => {
  const b = blocks[selected[0]][selected[1]];
  b.rotation = (b.rotation + 1) % 4;
  solved = false; messageEl.textContent = ''; draw();
};

document.getElementById('layoutBtn').onclick = () => {
  const b = blocks[selected[0]][selected[1]];
  b.layout = (b.layout + 1) % 3;
  solved = false; messageEl.textContent = ''; draw();
};

document.getElementById('validateBtn').onclick = () => {
  const result = checkPath();
  solved = result === 'ok';
  messageEl.style.color = solved ? '#1a9a3a' : '#d33';
  messageEl.textContent = solved ? '🎉 Perfect! The cat is on the run!' : result;
  if (solved) runCat();
};

document.getElementById('resetBtn').onclick = () => {
  if (solved) {                                          // after a win, Reset builds a brand-new puzzle
    newLevel();
    messageEl.style.color = '';
    messageEl.textContent = 'New puzzle ready! Cat, rat and arrows have changed.';
    return;
  }
  JSON.parse(startState).forEach((row, i) => row.forEach(([layout, rotation], j) => {
    blocks[i][j].layout = layout;
    blocks[i][j].rotation = rotation;
  }));
  messageEl.textContent = '';
  draw();
};

document.getElementById('nextBtn').onclick = () => {
  popup.style.display = 'none';
  document.body.style.pointerEvents = '';
  newLevel();
};

/* Level buttons */
const levelBox = document.getElementById('levels');
LEVEL_SIZES.forEach((n, i) => {
  const btn = document.createElement('button');
  btn.textContent = `Level ${i + 1} (${n}x${n})`;
  btn.onclick = () => {
    level = i;
    [...levelBox.children].forEach((b, j) => b.className = j === i ? 'active' : '');
    newLevel();
  };
  levelBox.append(btn);
});

/* Start on Level 2, like the original screenshot */
levelBox.children[1].className = 'active';
newLevel();